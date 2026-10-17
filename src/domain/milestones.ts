export const GOAL_DAYS = 254;
export const MILESTONES = [30, 60, 90, 100, 150, 200, 250, 254] as const;

/** Next milestone strictly above `day` (kit.jsx nextMs). */
export const nextMilestone = (day: number): number => MILESTONES.find((m) => m > day) ?? GOAL_DAYS;
