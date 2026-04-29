import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase'
import { useWorkoutsStore } from './workouts'
import type { GamificationDoc, EvalContext } from '../types/gamification'
import type { AchievementDef } from '../types/gamification'
import type { WorkoutLog, StepEntry, WeightEntry } from '../types'
import {
  ACHIEVEMENTS,
  WEEKLY_MISSIONS,
  levelFromXp,
  xpForLevel,
  levelProgress,
  levelRankName,
  getWeekKey,
  isInCurrentWeek,
  computeWorkoutStreak,
  computeStepStreak,
} from '../utils/gamificationDefs'

export const useGamificationStore = defineStore('gamification', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const xp             = ref(0)
  const achievements   = ref<string[]>([])
  const weeklyMissions = ref<Record<string, string[]>>({})
  const _loaded        = ref(false)
  let _uid: string | null = null

  const pendingToast = ref<AchievementDef | null>(null)
  const _toastQueue: AchievementDef[] = []
  let _toastTimer: ReturnType<typeof setTimeout> | null = null

  // ─── Sync error ───────────────────────────────────────────────────────────
  const syncError = ref<string | null>(null)
  function _reportSyncError(e: unknown) {
    console.error('[gamification sync]', e)
    syncError.value = 'Failed to sync progress.'
    setTimeout(() => { syncError.value = null }, 5000)
  }

  // ─── Computed ─────────────────────────────────────────────────────────────
  const level       = computed(() => levelFromXp(xp.value))
  const levelName   = computed(() => levelRankName(level.value))
  const progress    = computed(() => levelProgress(xp.value))
  const xpThisLevel = computed(() => xp.value - xpForLevel(level.value))
  const xpNextLevel = computed(() => xpForLevel(level.value + 1) - xpForLevel(level.value))
  const xpToNext    = computed(() => xpForLevel(level.value + 1) - xp.value)

  const streak = computed(() => {
    const ws = useWorkoutsStore()
    return computeWorkoutStreak(ws.logs.filter((l: WorkoutLog) => l.completedAt != null))
  })

  // ─── Toast queue ──────────────────────────────────────────────────────────
  function _enqueueToast(def: AchievementDef) {
    _toastQueue.push(def)
    if (!pendingToast.value) _nextToast()
  }

  function _nextToast() {
    if (_toastQueue.length === 0) return
    pendingToast.value = _toastQueue.shift()!
    if (_toastTimer) clearTimeout(_toastTimer)
    _toastTimer = setTimeout(dismissToast, 3500)
  }

  function dismissToast() {
    pendingToast.value = null
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null }
    if (_toastQueue.length > 0) setTimeout(_nextToast, 400)
  }

  // ─── Supabase ─────────────────────────────────────────────────────────────
  async function loadFromSupabase(uid: string) {
    _uid = uid
    try {
      const { data, error } = await supabase
        .from('user_meta')
        .select('data')
        .eq('user_id', uid)
        .eq('key', 'gamification')
        .maybeSingle()
      if (error) throw error
      if (data) {
        const doc = data.data as GamificationDoc
        xp.value             = doc.xp             ?? 0
        achievements.value   = doc.achievements   ?? []
        weeklyMissions.value = doc.weeklyMissions ?? {}
      }
    } catch (e) {
      _reportSyncError(e)
    }
    _loaded.value = true
  }

  function _saveToSupabase() {
    if (!_uid) return
    const currentKey = getWeekKey()
    const trimmed = Object.fromEntries(
      Object.entries(weeklyMissions.value).filter(([k]) => k >= _prevWeekKey(currentKey, 2))
    ) as Record<string, string[]>
    weeklyMissions.value = trimmed

    const payload: GamificationDoc = {
      xp: xp.value,
      achievements: achievements.value,
      weeklyMissions: trimmed,
    }

    void (async () => {
      const { error } = await supabase
        .from('user_meta')
        .upsert({ user_id: _uid, key: 'gamification', data: payload })
      if (error) _reportSyncError(error)
    })()
  }

  function _prevWeekKey(key: string, weeksBack: number): string {
    const [year, weekStr] = key.split('-W')
    const week = parseInt(weekStr)
    const d = new Date(parseInt(year), 0, 1 + (week - 1) * 7)
    d.setDate(d.getDate() - weeksBack * 7)
    return getWeekKey(d)
  }

  function clearData() {
    _uid         = null
    _loaded.value = false
    xp.value             = 0
    achievements.value   = []
    weeklyMissions.value = {}
    pendingToast.value   = null
    _toastQueue.length   = 0
  }

  // ─── Evaluate ─────────────────────────────────────────────────────────────
  function _buildContext(): EvalContext {
    const ws = useWorkoutsStore()
    const logs         = ws.logs.filter((l: WorkoutLog) => l.completedAt != null)
    const thisWeekLogs = logs.filter((l: WorkoutLog) => isInCurrentWeek(l.startedAt))
    const thisWeekStepTotal = ws.stepEntries
      .filter((e: StepEntry) => isInCurrentWeek(e.date))
      .reduce((s: number, e: StepEntry) => s + e.steps, 0)
    const thisWeekBwCount = ws.bodyWeightLog
      .filter((e: WeightEntry) => isInCurrentWeek(e.date))
      .length

    return {
      logs,
      plans:         ws.plans,
      stepEntries:   ws.stepEntries,
      bodyWeightLog: ws.bodyWeightLog,
      prCount:       ws.prMap.size,
      streakDays:    computeWorkoutStreak(logs),
      stepStreakDays: computeStepStreak(ws.stepEntries),
      thisWeekLogs,
      thisWeekStepTotal,
      thisWeekBwCount,
    }
  }

  async function evaluate() {
    if (!_loaded.value) return
    const ctx     = _buildContext()
    const weekKey = getWeekKey()
    let changed   = false

    for (const def of ACHIEVEMENTS) {
      if (achievements.value.includes(def.id)) continue
      if (!def.check(ctx)) continue
      achievements.value.push(def.id)
      xp.value += def.xp
      _enqueueToast(def)
      changed = true
    }

    const completedThisWeek = new Set(weeklyMissions.value[weekKey] ?? [])
    let missionsChanged = false
    for (const mission of WEEKLY_MISSIONS) {
      if (completedThisWeek.has(mission.id)) continue
      if (mission.getProgress(ctx) >= mission.target) {
        completedThisWeek.add(mission.id)
        xp.value += mission.xp
        missionsChanged = true
        changed = true
      }
    }
    if (missionsChanged) {
      weeklyMissions.value = { ...weeklyMissions.value, [weekKey]: [...completedThisWeek] }
    }

    if (changed) _saveToSupabase()
  }

  // ─── Mission helpers ──────────────────────────────────────────────────────
  function getMissionProgress(missionId: string): number {
    const mission = WEEKLY_MISSIONS.find(m => m.id === missionId)
    if (!mission) return 0
    return mission.getProgress(_buildContext())
  }

  function isMissionCompleted(missionId: string): boolean {
    const weekKey = getWeekKey()
    return (weeklyMissions.value[weekKey] ?? []).includes(missionId)
  }

  return {
    xp, achievements, weeklyMissions, pendingToast, syncError, _loaded,
    level, levelName, progress, xpThisLevel, xpNextLevel, xpToNext, streak,
    loadFromSupabase, clearData, evaluate, dismissToast,
    getMissionProgress, isMissionCompleted,
  }
})
