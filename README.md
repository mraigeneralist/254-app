# 254

**254** helps you build good habits and break bad ones. Check in once a day until a habit reaches 254 days.

A 2010 study at University College London (Lally et al.) found new habits took between 18 and 254 days to become automatic, about 66 on average. 254 is the top of that range, so going the full distance gives a habit the best chance to stick. It isn't a scientific law; it's a generous target.

Milestones at **30, 60, 90, 100, 150, 200, 250** and **254** days act as checkpoints. Missing a day drops you back to your last milestone, never to zero once you've reached one.

## Features

| | |
|---|---|
| **Build & Break** | Habits to build ("Mark done") and addictions to break ("I stayed clean today"). Daily check-in with haptics, undo until midnight, milestone celebrations, "Habit Built!" / "Addiction Broken!" at Day 254 |
| **Missed days** | Recalculated from the check-in history every time the app opens or returns to the foreground. You're told exactly what happened ("was 47 → now 30") |
| **Challenges** | 30 / 60 / 90 / custom (1–365) days, no checkpoints. Miss a day and it fails, then Restart from Day 1. "Challenge Complete!" at the end |
| **Tasks** | Quick add, week strip and month calendar with dots, overdue tasks roll into today, time and reminder per task, swipe to delete |
| **Meditate** | 5 / 10 / 15 / custom (1–180) min timer that stays accurate with the screen locked, pause / resume / end early, chime + notification, session history |
| **Note To Self** | Private journal with a calendar, multiple entries per day, autosaved drafts, past dates |
| **Profile** | Stats, current streaks, longest streak, check-ins over the last 30 days, heatmap, meditation per week, milestones earned, built / broken / challenge history |
| **Notifications** | Local reminders per habit (skipped once you've checked in), task reminders, daily "still waiting" summary, meditation finished, master switch |
| **Offline** | Everything works offline after sign-in. Changes queue and sync when you're back online, with an "Offline / Syncing" indicator |
| **Account** | Email + password, password reset by email, stays signed in, account deletion (removes all data) |

## Tech stack

| Area | Choice |
|---|---|
| App | [Expo](https://expo.dev) SDK 58 · React Native 0.88 (New Architecture) · TypeScript · development build (`expo-dev-client`) |
| Navigation | `expo-router`, file-based routes in `src/app/` |
| Backend | [Supabase](https://supabase.com): Postgres + Row Level Security, email/password auth, Edge Function for account deletion |
| Offline / sync | `expo-sqlite` local store + outbox queue → Supabase upserts; pull by server `synced_at` cursor; last write wins (server trigger) |
| State | `zustand` |
| UI | Cream Design System tokens as a typed theme (`src/theme/`), Urbanist font, Lucide icons, `react-native-reanimated`, `react-native-svg` |
| Device | `expo-notifications`, `expo-haptics`, `expo-keep-awake`, `expo-audio`, `@react-native-community/netinfo` |
| Tests | Jest (`jest-expo`): streak / milestone / challenge engine |

## Project structure

```
src/app/            screens (expo-router): (auth), (setup), (tabs), habit/, challenge/, task/, note/, meditate/, settings/
src/components/     design-system primitives (ds/) and app components (cards, calendar, pickers, dialogs, tour…)
src/theme/          colors, typography, spacing, effects tokens
src/domain/         pure logic — streaks.ts, challenges.ts, dates.ts, milestones.ts (+ __tests__)
src/data/           Supabase client, SQLite store, sync engine, session/auth, selectors, actions
src/features/       notifications, meditation timer, check-in flows, stats, background effects
supabase/           SQL migrations, delete-account Edge Function, email template
scripts/            Supabase CLI wrapper, auth config, RLS test, icon + chime generators
```

### How streaks work (`src/domain/streaks.ts`)

State is never stored incrementally. It is **replayed** from the list of check-in dates (local `YYYY-MM-DD`), one calendar day at a time:

- A check-in adds 1. Reaching a milestone saves it as the checkpoint.
- A past day without a check-in sets the count to the checkpoint.
- Today without a check-in changes nothing until midnight.

This keeps the result correct even if the phone was off for days. Timezone moves that repeat a date never double count.

## Running locally (Android)

### Prerequisites

- Node 20+
- Android Studio with the Android SDK
- JDK 17+ (Android Studio's bundled JBR works)
- An Android phone with USB debugging enabled

> **Windows:** React Native's C++ build needs long paths. Enable `LongPathsEnabled` (admin) and make sure the SDK's CMake ships ninja ≥ 1.12.

### Steps

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create `.env` in the project root (never commit it):
   ```sh
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
   ```
3. Connect your phone over USB, then build and install the dev client:
   ```sh
   npx expo run:android --device
   ```
4. Start the dev server. Changes then appear instantly through Fast Refresh:
   ```sh
   npx expo start --dev-client
   adb reverse tcp:8081 tcp:8081   # if the phone can't reach Metro
   ```

You only need to rebuild (step 3) after adding a native library or changing `app.json` / plugins.

### Tests

```sh
npm test            # streak / challenge unit tests
npm run typecheck
npm run test:rls    # live Row Level Security + account-deletion checks against Supabase
```

## Backend (Supabase)

- **Schema:** `supabase/migrations/`. Apply with `bash scripts/sb.sh db push` (the wrapper reads the access token from `.secret` into an env var).
- **Account deletion:** `supabase/functions/delete-account`. Deploy with `bash scripts/sb.sh functions deploy delete-account --use-api`.
- **Auth settings:** `node scripts/configure-auth.mjs`.
- **Email:** Supabase's built-in email sends only a few messages per hour, and only to your project's team members. Before real users can receive password-reset emails, set up **custom SMTP** (Resend, Postmark, AWS SES…), then run `WITH_TEMPLATES=1 node scripts/configure-auth.mjs` to install the branded template.

## Security

- The app only ever contains the Supabase **project URL** and **publishable/anon key**. Row Level Security limits every user to their own rows.
- The server key is used only inside the `delete-account` Edge Function on Supabase's servers.
- `.env`, `.secret`, keystores and generated native folders are git-ignored.
