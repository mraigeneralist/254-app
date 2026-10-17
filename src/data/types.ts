import type { DateKey } from '@/domain/dates';

/** ISO-8601 timestamp string. */
export type Iso = string;

type Base = {
  id: string;
  user_id: string;
  created_at: Iso;
  updated_at: Iso;
  deleted_at: Iso | null;
};

export type NotificationSettings = {
  /** master switch for every notification */
  notificationsEnabled: boolean;
  habitReminders: boolean;
  breakReminders: boolean;
  challengeReminders: boolean;
  taskReminders: boolean;
  /** daily "N habits still waiting" summary */
  summaryEnabled: boolean;
  summaryTime: string; // HH:MM
  milestoneAlerts: boolean;
  /** meditation end bell: bowl | gong | chimes | marimba */
  meditationSound: string;
};

export const DEFAULT_SETTINGS: NotificationSettings = {
  notificationsEnabled: true,
  habitReminders: true,
  breakReminders: true,
  challengeReminders: false,
  taskReminders: true,
  summaryEnabled: true,
  summaryTime: '21:00',
  milestoneAlerts: true,
  meditationSound: 'bowl',
};

export type Profile = Omit<Base, 'user_id'> & {
  name: string;
  onboarding_completed: boolean;
  settings: Partial<NotificationSettings>;
  avatar_path?: string | null;
};

export type HabitKind = 'build' | 'break';

export type Habit = Base & {
  kind: HabitKind;
  name: string;
  description: string;
  icon: string;
  reminder_time: string | null; // HH:MM
  start_date: DateKey;
  status: 'active' | 'completed';
  completed_date: DateKey | null;
  checkpoint: number;
  best_streak: number;
};

/** Local id is `${habit_id}:${date}` — one check-in per habit per day. */
export type HabitCheckin = Base & { habit_id: string; date: DateKey };

export type Challenge = Base & {
  name: string;
  description: string;
  icon: string;
  duration_days: number;
  start_date: DateKey;
  status: 'active' | 'failed' | 'completed';
  completed_date: DateKey | null;
  failed_date: DateKey | null;
  restarted_from: string | null;
};

/** Local id is `${challenge_id}:${date}`. */
export type ChallengeCheckin = Base & { challenge_id: string; date: DateKey };

export type Task = Base & {
  title: string;
  notes: string;
  date: DateKey;
  time: string | null; // HH:MM
  reminder: boolean;
  completed_at: Iso | null;
};

export type MeditationSession = Base & {
  date: DateKey;
  started_at: Iso;
  planned_minutes: number;
  actual_minutes: number;
};

export type Note = Base & { date: DateKey; title: string; body: string };

export type TableRows = {
  profiles: Profile;
  habits: Habit;
  habit_checkins: HabitCheckin;
  challenges: Challenge;
  challenge_checkins: ChallengeCheckin;
  tasks: Task;
  meditation_sessions: MeditationSession;
  notes: Note;
};

export type TableName = keyof TableRows;

/** Push/pull order — parents before children so foreign keys exist on the server. */
export const TABLES: TableName[] = [
  'profiles',
  'habits',
  'habit_checkins',
  'challenges',
  'challenge_checkins',
  'tasks',
  'meditation_sessions',
  'notes',
];

/** Check-in tables are keyed by (parent, date) instead of a client id. */
export const CHECKIN_PARENT: Partial<Record<TableName, 'habit_id' | 'challenge_id'>> = {
  habit_checkins: 'habit_id',
  challenge_checkins: 'challenge_id',
};

export function localId<T extends TableName>(table: T, row: Record<string, unknown>): string {
  const parent = CHECKIN_PARENT[table];
  return parent ? `${row[parent]}:${row.date}` : String(row.id);
}
