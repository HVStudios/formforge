import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useWorkoutsStore } from './workouts'
import type { GamificationDoc, EvalContext } from '../types/gamification'
import type { AchievementDef } from '../types/gamification'
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
  // ─── State ─────────────────────────────────────────────────────────────────
  const xp             = ref(0)
  const achievements   = ref<string[]>([])
  const weeklyMissions = ref<Record<string, string[]>>({})

  /** Set to true once Firestore data has been loaded — guards evaluate() */
  const _loaded = ref(false)
  let _uid: string | null = null

  /** The most recently unlocked achievement, consumed by AchievementToast */
  const pendingToast = ref<AchievementDef | null>(null)
  const _toastQueue: AchievementDef[] = []
  let _toastTimer: ReturnType<typeof setTimeout> | null = null

  // ─── Sync error (reuse same pattern as workouts store) ────────────────────
  const syncError = ref<string | null>(null)
  function _reportSyncError(e: unknown) {
    console.error('[gamification sync]', e)
    syncError.value = 'Failed to sync progress.'
    setTimeout(() => { syncError.value = null }, 5000)
  }

  // ─── Computed ──────────────────────────────────────────────────────────────
  const level       = computed(() => levelFromXp(xp.value))
  const levelName   = computed(() => levelRankName(level.value))
  const progress    = computed(() => levelProgress(xp.value))
  const xpThisLevel = computed(() => xp.value - xpForLevel(level.value))
  const xpNextLevel = computed(() => xpForLevel(level.value + 1) - xpForLevel(level.value))
  const xpToNext    = computed(() => xpForLevel(level.value + 1) - xp.value)

  // ─── Toast queue ───────────────────────────────────────────────────────────
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
    if (_toastQueue.length > 0) {
      setTimeout(_nextToast, 400)
    }
  }

  // ─── Firestore ─────────────────────────────────────────────────────────────
  async function loadFromFirestore(uid: string) {
    _uid = uid
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'meta', 'gamification'))
      if (snap.exists()) {
        const data = snap.data() as GamificationDoc
        xp.value             = data.xp             ?? 0
        achievements.value   = data.achievements   ?? []
        weeklyMissions.value = data.weeklyMissions ?? {}
      }
    } catch (e) {
      _reportSyncError(e)
    }
    _loaded.value = true
  }

  function _saveToFirestore() {
    if (!_uid) return
    // Trim old weekly mission data (keep only current + previous 2 weeks)
    const currentKey = getWeekKey()
    const trimmed = Object.fromEntries(
      Object.entries(weeklyMissions.value).filter(([k]) => k >= getPrevWeekKey(currentKey, 2))
    )
    weeklyMissions.value = trimmed

    setDoc(
      doc(db, 'users', _uid, 'meta', 'gamification'),
      {
        xp: xp.value,
        achievements: achievements.value,
        weeklyMissions: trimmed,
      } satisfies GamificationDoc,
      { merge: true },
    ).catch(_reportSyncError)
  }

  function getPrevWeekKey(key: string, weeksBack: number): string {
    // Approximate: subtract 7*n days from the Monday of the given week key
    const [year, weekStr] = key.split('-W')
    const week = parseInt(weekStr)
    // Convert ISO week to a date, go back N weeks, get that key
    const d = new Date(parseInt(year), 0, 1 + (week - 1) * 7)
    d.setDate(d.getDate() - weeksBack * 7)
    return getWeekKey(d)
  }

  function clearData() {
    _uid        = null
    _loaded.value = false
    xp.value             = 0
    achievements.value   = []
    weeklyMissions.value = {}
    pendingToast.value   = null
    _toastQueue.length   = 0
  }

  // ─── Evaluate ──────────────────────────────────────────────────────────────
  /** Build an EvalContext from live store data. */
  function _buildContext(): EvalContext {
    const ws = useWorkoutsStore()

    const logs         = ws.logs.filter(l => l.completedAt != null)
    const thisWeekLogs = logs.filter(l => isInCurrentWeek(l.startedAt))

    const thisWeekStepTotal = ws.stepEntries
      .filter(e => isInCurrentWeek(e.date))
      .reduce((s, e) => s + e.steps, 0)

    const thisWeekBwCount = ws.bodyWeightLog
      .filter(e => isInCurrentWeek(e.date))
      .length

    return {
      logs,
      plans:        ws.plans,
      stepEntries:  ws.stepEntries,
      bodyWeightLog: ws.bodyWeightLog,
      prCount:      ws.prMap.size,
      streakDays:   computeWorkoutStreak(logs),
      stepStreakDays: computeStepStreak(ws.stepEntries),
      thisWeekLogs,
      thisWeekStepTotal,
      thisWeekBwCount,
    }
  }

  /**
   * Check all achievements and weekly missions against current data.
   * Awards XP for anything newly completed. Safe to call on every data change.
   */
  async function evaluate() {
    if (!_loaded.value) return

    const ctx     = _buildContext()
    const weekKey = getWeekKey()
    let changed   = false

    // ── Achievements ──────────────────────────────────────────────────────
    for (const def of ACHIEVEMENTS) {
      if (achievements.value.includes(def.id)) continue
      if (!def.check(ctx)) continue
      achievements.value.push(def.id)
      xp.value += def.xp
      _enqueueToast(def)
      changed = true
    }

    // ── Weekly missions ───────────────────────────────────────────────────
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
      weeklyMissions.value = {
        ...weeklyMissions.value,
        [weekKey]: [...completedThisWeek],
      }
    }

    if (changed) _saveToFirestore()
  }

  // ─── Mission progress helpers (for UI) ────────────────────────────────────
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
    // State
    xp, achievements, weeklyMissions, pendingToast, syncError,
    _loaded,
    // Computed
    level, levelName, progress, xpThisLevel, xpNextLevel, xpToNext,
    // Actions
    loadFromFirestore, clearData, evaluate, dismissToast,
    getMissionProgress, isMissionCompleted,
  }
})
