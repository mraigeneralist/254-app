# 254

**254** helps you build good habits and break bad ones. Check in once a day until a habit reaches 254 days.

A 2010 study at University College London (Lally et al.) found new habits took between 18 and 254 days to become automatic, about 66 on average. 254 is the top of that range, so going the full distance gives a habit the best chance to stick.

Milestones at 30, 60, 90, 100, 150, 200 and 250 days act as checkpoints. Missing a day drops you back to your last milestone, not to zero.

The app also includes:

- a daily to-do list with a calendar
- self-made challenges (30/60/90 days or custom)
- a meditation timer
- a private journal, *Note To Self*
- a profile with stats and graphs

Everything is tied to your account, synced to the cloud, and works offline.

## Tech stack

| Area | Choice |
|---|---|
| App | [Expo](https://expo.dev) SDK 58 · React Native 0.88 (New Architecture) · TypeScript |
| Navigation | `expo-router` (file-based routes in `src/app/`) |
| Backend | [Supabase](https://supabase.com): Postgres with Row Level Security, email/password auth, Edge Functions |
| Offline | `expo-sqlite` local store plus an outbox sync queue (most recent edit wins) |
| UI | Custom components built from the Cream Design System tokens (`src/theme/`), Urbanist font, Lucide icons |
| Device | `expo-notifications` (local reminders), `expo-haptics`, `expo-keep-awake`, `expo-audio` |
| Tests | Jest (`jest-expo`) |

## Project structure

```
src/app/          screens (expo-router)
src/components/   design-system (ds/) and app components
src/theme/        colors, typography, spacing, effects tokens
src/domain/       pure business logic (streaks, milestones, challenges) + tests
src/data/         Supabase client, SQLite, sync engine
supabase/         SQL migrations and Edge Functions
```

## Running locally (Android)

The app runs as an **Expo development build** (not Expo Go).

### Prerequisites

- Node 20+
- Android Studio with the Android SDK
- JDK 17+ (Android Studio's bundled JBR works)
- An Android phone with USB debugging enabled

### Steps

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create `.env` in the project root (never commit it):
   ```sh
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
   ```
3. Connect your phone over USB, then build and install the dev client:
   ```sh
   npx expo run:android --device
   ```
4. Afterwards, start the dev server. Changes then appear instantly through Fast Refresh:
   ```sh
   npx expo start --dev-client
   adb reverse tcp:8081 tcp:8081   # only if the phone can't reach Metro
   ```

You only need a native rebuild (step 3) after adding a native library or changing `app.json` or its plugins.

### Tests

```sh
npm test          # unit tests
npm run typecheck
```

## Security

- The app only ever contains the Supabase **project URL** and **anon/publishable key**. Row Level Security limits every user to their own rows.
- The service-role key is used only inside the `delete-account` Edge Function on Supabase's servers.
- `.env`, `.secret`, keystores and generated native folders are git-ignored.
