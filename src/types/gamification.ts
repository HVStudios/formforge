import type { WorkoutLog, WorkoutPlan, StepEntry, WeightEntry } from './index'

// ─── Evaluation context ───────────────────────────────────────────────────────
/** Snapshot of all data needed to check achievements and mission progress. */
export interface EvalContext {
  logs: WorkoutLog[]           // all completed workout logs
  plans: WorkoutPlan[]         // saved workout plans
  stepEntries: StepEntry[]     // all step entries
  bodyWeightLog: WeightEntry[] // all body weight entries
  prCount: number              // number of exercises with a personal record
  streakDays: number           // current consecutive-day workout streak
  stepStreakDays: number       // current consecutive-day step streak
  thisWeekLogs: WorkoutLog[]   // completed logs from Mon–Sun of current week
  thisWeekStepTotal: number    // total steps logged this week
  thisWeekBwCount: number      // body weight entries logged this week
}

// ─── Achievement ──────────────────────────────────────────────────────────────
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  rarity: AchievementRarity
  check: (ctx: EvalContext) => boolean
}

// ─── Mission ──────────────────────────────────────────────────────────────────
export interface MissionDef {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  target: number
  getProgress: (ctx: EvalContext) => number
}

// ─── Persisted document ───────────────────────────────────────────────────────
export interface GamificationDoc {
  xp: number
  achievements: string[]
  /** Map of ISO week key (e.g. "2026-W12") to completed mission IDs */
  weeklyMissions: Record<string, string[]>
}
