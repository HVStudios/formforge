import type { AchievementDef, MissionDef, EvalContext } from '../types/gamification'

// ─── Level maths ──────────────────────────────────────────────────────────────
/** XP required to reach level n (1-indexed). Level 1 = 0, Level 2 = 100, etc. */
export function xpForLevel(n: number): number {
  return 50 * n * (n - 1)
}

/** Derive level from total XP. */
export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2))
}

/** XP progress from start of current level towards the next level (0–1). */
export function levelProgress(xp: number): number {
  const lv  = levelFromXp(xp)
  const cur = xpForLevel(lv)
  const nxt = xpForLevel(lv + 1)
  return (xp - cur) / (nxt - cur)
}

/** Level 17 = Iron Wolf per the design spec. Ranks increase every ~5 levels. */
const LEVEL_RANKS: { min: number; name: string }[] = [
  { min: 1,   name: 'Raw Iron' },
  { min: 6,   name: 'Iron Pup' },
  { min: 11,  name: 'Bronze Wolf' },
  { min: 16,  name: 'Iron Wolf' },
  { min: 21,  name: 'Steel Wolf' },
  { min: 26,  name: 'Silver Bear' },
  { min: 31,  name: 'Iron Bear' },
  { min: 41,  name: 'Gold Bear' },
  { min: 51,  name: 'Platinum Forge' },
  { min: 76,  name: 'Diamond Forge' },
  { min: 101, name: 'Legendary Forger' },
]

export function levelRankName(level: number): string {
  let name = LEVEL_RANKS[0].name
  for (const r of LEVEL_RANKS) {
    if (level >= r.min) name = r.name
    else break
  }
  return name
}

// ─── Week helpers (ISO week, Monday-based) ────────────────────────────────────
export function getWeekKey(date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7
  d.setDate(d.getDate() + 4 - day)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function isInCurrentWeek(dateStr: string): boolean {
  const d   = new Date(dateStr)
  const now = new Date()
  const dow = now.getDay() || 7
  const mon = new Date(now)
  mon.setDate(now.getDate() - (dow - 1))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 7)
  return d >= mon && d < sun
}

// ─── Streak helpers ───────────────────────────────────────────────────────────
export function computeWorkoutStreak(logs: EvalContext['logs']): number {
  const days = new Set(logs.map(l => l.startedAt.slice(0, 10)))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function countBack(from: Date) {
    let streak = 0
    const d = new Date(from)
    while (days.has(d.toISOString().slice(0, 10))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const todayStr = today.toISOString().slice(0, 10)
  if (days.has(todayStr)) return countBack(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  return countBack(yesterday)
}

export function computeStepStreak(entries: EvalContext['stepEntries']): number {
  const days = new Set(entries.map(e => e.date))
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  let streak = 0
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// ─── Achievements (20) ────────────────────────────────────────────────────────
export const ACHIEVEMENTS: AchievementDef[] = [
  // Workout count
  {
    id: 'workout-1', title: 'First Rep', icon: '🏋️', xp: 50, rarity: 'common',
    description: 'Complete your first workout.',
    check: ctx => ctx.logs.length >= 1,
  },
  {
    id: 'workout-5', title: 'Getting Warmed Up', icon: '💪', xp: 75, rarity: 'common',
    description: 'Complete 5 workouts.',
    check: ctx => ctx.logs.length >= 5,
  },
  {
    id: 'workout-10', title: 'Ten Down', icon: '🔥', xp: 100, rarity: 'common',
    description: 'Complete 10 workouts.',
    check: ctx => ctx.logs.length >= 10,
  },
  {
    id: 'workout-25', title: 'Regular', icon: '⚡', xp: 150, rarity: 'rare',
    description: 'Complete 25 workouts.',
    check: ctx => ctx.logs.length >= 25,
  },
  {
    id: 'workout-50', title: 'Dedicated', icon: '🎯', xp: 250, rarity: 'rare',
    description: 'Complete 50 workouts.',
    check: ctx => ctx.logs.length >= 50,
  },
  {
    id: 'workout-100', title: 'Century', icon: '🏆', xp: 500, rarity: 'epic',
    description: 'Complete 100 workouts.',
    check: ctx => ctx.logs.length >= 100,
  },
  {
    id: 'workout-365', title: 'Year of Iron', icon: '👑', xp: 1500, rarity: 'legendary',
    description: 'Complete 365 workouts.',
    check: ctx => ctx.logs.length >= 365,
  },

  // Streaks
  {
    id: 'streak-3', title: 'Hat Trick', icon: '🔥', xp: 75, rarity: 'common',
    description: 'Work out 3 days in a row.',
    check: ctx => ctx.streakDays >= 3,
  },
  {
    id: 'streak-7', title: 'Week Warrior', icon: '⚔️', xp: 200, rarity: 'rare',
    description: 'Work out 7 days in a row.',
    check: ctx => ctx.streakDays >= 7,
  },
  {
    id: 'streak-30', title: 'Iron Month', icon: '💎', xp: 600, rarity: 'legendary',
    description: 'Work out 30 days in a row.',
    check: ctx => ctx.streakDays >= 30,
  },

  // Personal records
  {
    id: 'pr-1', title: 'New Ground', icon: '🎖️', xp: 75, rarity: 'common',
    description: 'Set your first personal record.',
    check: ctx => ctx.prCount >= 1,
  },
  {
    id: 'pr-10', title: 'Record Breaker', icon: '📈', xp: 250, rarity: 'rare',
    description: 'Set personal records on 10 exercises.',
    check: ctx => ctx.prCount >= 10,
  },

  // Steps
  {
    id: 'steps-10k', title: '10K Club', icon: '👟', xp: 75, rarity: 'common',
    description: 'Log 10,000+ steps in a single day.',
    check: ctx => ctx.stepEntries.some(e => e.steps >= 10_000),
  },
  {
    id: 'steps-streak-7', title: 'Step Streak', icon: '🚶', xp: 200, rarity: 'rare',
    description: 'Log steps 7 days in a row.',
    check: ctx => ctx.stepStreakDays >= 7,
  },

  // Body weight
  {
    id: 'bw-first', title: 'Body Check', icon: '⚖️', xp: 25, rarity: 'common',
    description: 'Log your body weight for the first time.',
    check: ctx => ctx.bodyWeightLog.length >= 1,
  },
  {
    id: 'bw-10', title: 'Tracking Progress', icon: '📊', xp: 100, rarity: 'rare',
    description: 'Log your body weight 10 times.',
    check: ctx => ctx.bodyWeightLog.length >= 10,
  },

  // Plans
  {
    id: 'plan-first', title: 'Blueprint', icon: '📋', xp: 50, rarity: 'common',
    description: 'Create your first workout plan.',
    check: ctx => ctx.plans.length >= 1,
  },

  // Timing
  {
    id: 'early-bird', title: 'Early Bird', icon: '🌅', xp: 100, rarity: 'rare',
    description: 'Complete a workout before 7 am.',
    check: ctx => ctx.logs.some(l => new Date(l.startedAt).getHours() < 7),
  },
  {
    id: 'night-owl', title: 'Night Owl', icon: '🌙', xp: 100, rarity: 'rare',
    description: 'Complete a workout after 9 pm.',
    check: ctx => ctx.logs.some(l => new Date(l.startedAt).getHours() >= 21),
  },

  // Free-form
  {
    id: 'free-spirit', title: 'Free Spirit', icon: '🎭', xp: 50, rarity: 'common',
    description: 'Complete a free-form workout (not from a plan).',
    check: ctx => ctx.logs.some(l => !l.planId),
  },
]

// ─── Weekly missions (5) ──────────────────────────────────────────────────────
export const WEEKLY_MISSIONS: MissionDef[] = [
  {
    id: 'w-workouts-3', title: 'Workout Trio', icon: '💪', xp: 150, target: 3,
    description: 'Complete 3 workouts this week.',
    getProgress: ctx => ctx.thisWeekLogs.length,
  },
  {
    id: 'w-workouts-5', title: 'Five and Alive', icon: '⚡', xp: 300, target: 5,
    description: 'Complete 5 workouts this week.',
    getProgress: ctx => ctx.thisWeekLogs.length,
  },
  {
    id: 'w-steps-50k', title: 'Step Champion', icon: '👟', xp: 200, target: 50_000,
    description: 'Log 50,000+ steps this week.',
    getProgress: ctx => ctx.thisWeekStepTotal,
  },
  {
    id: 'w-bw-2', title: 'Weight Watcher', icon: '⚖️', xp: 75, target: 2,
    description: 'Log your body weight twice this week.',
    getProgress: ctx => ctx.thisWeekBwCount,
  },
  {
    id: 'w-plan-2', title: 'Stick to the Plan', icon: '📋', xp: 150, target: 2,
    description: 'Complete 2 plan-based workouts this week.',
    getProgress: ctx => ctx.thisWeekLogs.filter(l => l.planId != null).length,
  },
]
