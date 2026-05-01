import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase'
import { nanoid } from '../utils/nanoid'
import { getExerciseName, isRunningExercise } from '../data/exercises'
import type { WorkoutPlan, WorkoutLog, PlanExercise, LoggedExercise, WeightEntry, StepEntry, Exercise, NutritionProfile } from '../types'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const useWorkoutsStore = defineStore('workouts', () => {
  const plans           = ref<WorkoutPlan[]>(load('ff_plans', []))
  const logs            = ref<WorkoutLog[]>(load('ff_logs', []))
  const activeWorkout   = ref<WorkoutLog | null>(load('ff_active', null))
  const bodyWeightLog   = ref<WeightEntry[]>(load('ff_bw', []))
  const stepEntries     = ref<StepEntry[]>(load('ff_steps', []))
  const customExercises    = ref<Exercise[]>(load('ff_custom_exercises', []))
  const nutritionProfile   = ref<NutritionProfile | null>(load('ff_nutrition', null))

  let _uid: string | null = null

  // ─── Sync error state ────────────────────────────
  const syncError = ref<string | null>(null)
  let _syncErrorTimer: ReturnType<typeof setTimeout> | null = null
  function _reportSyncError(e: unknown) {
    console.error(e)
    syncError.value = 'Failed to sync. Check your connection.'
    if (_syncErrorTimer) clearTimeout(_syncErrorTimer)
    _syncErrorTimer = setTimeout(() => { syncError.value = null }, 5000)
  }

  // ─── Local cache helpers ─────────────────────────
  function savePlansLocal()         { localStorage.setItem('ff_plans',            JSON.stringify(plans.value)) }
  function saveLogsLocal()          { localStorage.setItem('ff_logs',             JSON.stringify(logs.value)) }
  function saveActiveLocal()        { localStorage.setItem('ff_active',           JSON.stringify(activeWorkout.value)) }
  function saveBwLocal()            { localStorage.setItem('ff_bw',               JSON.stringify(bodyWeightLog.value)) }
  function saveStepsLocal()         { localStorage.setItem('ff_steps',            JSON.stringify(stepEntries.value)) }
  function saveCustomExercisesLocal()  { localStorage.setItem('ff_custom_exercises', JSON.stringify(customExercises.value)) }
  function saveNutritionLocal()        { localStorage.setItem('ff_nutrition',        JSON.stringify(nutritionProfile.value)) }

  // ─── Supabase helpers (fire-and-forget) ──────────
  function sbUpsertPlan(plan: WorkoutPlan) {
    if (!_uid) return
    supabase.from('plans')
      .upsert({ id: plan.id, user_id: _uid, data: plan })
      .then(({ error }) => { if (error) _reportSyncError(error) })
  }
  function sbDeletePlan(planId: string) {
    if (!_uid) return
    supabase.from('plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', _uid)
      .then(({ error }) => { if (error) _reportSyncError(error) })
  }
  function sbUpsertLog(log: WorkoutLog) {
    if (!_uid) return
    supabase.from('workout_logs')
      .upsert({ id: log.id, user_id: _uid, data: log })
      .then(({ error }) => { if (error) _reportSyncError(error) })
  }
  function sbDeleteLog(logId: string) {
    if (!_uid) return
    supabase.from('workout_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', _uid)
      .then(({ error }) => { if (error) _reportSyncError(error) })
  }
  function sbUpsertMeta(key: string, data: unknown) {
    if (!_uid) return
    supabase.from('user_meta')
      .upsert({ user_id: _uid, key, data })
      .then(({ error }) => { if (error) _reportSyncError(error) })
  }
  function sbDeleteMeta(key: string) {
    if (!_uid) return
    supabase.from('user_meta')
      .delete()
      .eq('user_id', _uid)
      .eq('key', key)
      .then(({ error }) => { if (error) _reportSyncError(error) })
  }

  // ─── Supabase load (called on auth) ──────────────
  async function loadFromSupabase(uid: string) {
    _uid = uid
    const [
      { data: plansData },
      { data: logsData },
      { data: activeMeta },
      { data: bwMeta },
      { data: stepsMeta },
      { data: customMeta },
      { data: nutritionMeta },
    ] = await Promise.all([
      supabase.from('plans').select('data').eq('user_id', uid),
      supabase.from('workout_logs').select('data').eq('user_id', uid),
      supabase.from('user_meta').select('data').eq('user_id', uid).eq('key', 'active').maybeSingle(),
      supabase.from('user_meta').select('data').eq('user_id', uid).eq('key', 'bodyweight').maybeSingle(),
      supabase.from('user_meta').select('data').eq('user_id', uid).eq('key', 'steps').maybeSingle(),
      supabase.from('user_meta').select('data').eq('user_id', uid).eq('key', 'customExercises').maybeSingle(),
      supabase.from('user_meta').select('data').eq('user_id', uid).eq('key', 'nutrition').maybeSingle(),
    ])

    plans.value = (plansData ?? []).map(r => r.data as WorkoutPlan)
    logs.value  = (logsData ?? [])
      .map(r => r.data as WorkoutLog)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    activeWorkout.value    = activeMeta    ? (activeMeta.data as WorkoutLog) : null
    bodyWeightLog.value    = bwMeta        ? ((bwMeta.data as { entries: WeightEntry[] }).entries ?? []) : []
    stepEntries.value      = stepsMeta     ? ((stepsMeta.data as { entries: StepEntry[] }).entries ?? []) : []
    customExercises.value  = customMeta    ? ((customMeta.data as { exercises: Exercise[] }).exercises ?? []) : []
    nutritionProfile.value = nutritionMeta ? ((nutritionMeta.data as { profile: NutritionProfile }).profile ?? null) : null

    savePlansLocal()
    saveLogsLocal()
    saveActiveLocal()
    saveBwLocal()
    saveStepsLocal()
    saveCustomExercisesLocal()
    saveNutritionLocal()
  }

  /** Call when the user signs out — clears in-memory and local data. */
  function clearData() {
    _uid = null
    plans.value           = []
    logs.value            = []
    activeWorkout.value   = null
    bodyWeightLog.value   = []
    stepEntries.value     = []
    customExercises.value = []
    localStorage.removeItem('ff_plans')
    localStorage.removeItem('ff_logs')
    localStorage.removeItem('ff_active')
    localStorage.removeItem('ff_bw')
    localStorage.removeItem('ff_steps')
    localStorage.removeItem('ff_custom_exercises')
    localStorage.removeItem('ff_nutrition')
  }

  // ─── Plans ──────────────────────────────────────
  function savePlan(plan: WorkoutPlan) {
    const idx = plans.value.findIndex(p => p.id === plan.id)
    if (idx !== -1) {
      plans.value[idx] = plan
    } else {
      plans.value.push(plan)
    }
    savePlansLocal()
    sbUpsertPlan(plan)
  }

  function deletePlan(id: string) {
    plans.value = plans.value.filter(p => p.id !== id)
    savePlansLocal()
    sbDeletePlan(id)
  }

  function getPlan(id: string): WorkoutPlan | undefined {
    return plans.value.find(p => p.id === id)
  }

  function createEmptyPlan(): WorkoutPlan {
    return {
      id: nanoid(),
      name: '',
      description: '',
      exercises: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // ─── Active workout ─────────────────────────────
  function resolveExerciseName(id: string): string {
    return (
      getExerciseName(id) ||
      customExercises.value.find(e => e.id === id)?.name ||
      id
    )
  }

  function saveCustomExercise(ex: Exercise) {
    const idx = customExercises.value.findIndex(e => e.id === ex.id)
    if (idx !== -1) {
      customExercises.value[idx] = ex
    } else {
      customExercises.value.push(ex)
    }
    saveCustomExercisesLocal()
    sbUpsertMeta('customExercises', { exercises: customExercises.value })
  }

  function saveNutrition(profile: NutritionProfile) {
    nutritionProfile.value = profile
    saveNutritionLocal()
    sbUpsertMeta('nutrition', { profile })
  }

  function deleteCustomExercise(id: string) {
    customExercises.value = customExercises.value.filter(e => e.id !== id)
    saveCustomExercisesLocal()
    sbUpsertMeta('customExercises', { exercises: customExercises.value })
  }

  function startWorkout(plan: WorkoutPlan) {
    const exercises: LoggedExercise[] = plan.exercises.map((pe: PlanExercise) => {
      const isRun = isRunningExercise(pe.exerciseId)
      return {
        uid: pe.uid,
        exerciseId: pe.exerciseId,
        exerciseName: resolveExerciseName(pe.exerciseId),
        notes: pe.notes,
        sets: pe.sets.map(s => isRun
          ? {
              reps: null,
              weight: null,
              distanceKm:  s.targetDistanceKm  ?? s.targetReps ?? null,
              durationMin: s.targetDurationMin ?? null,
              completed: false,
            }
          : {
              reps: s.targetReps || null,
              weight: s.targetWeight || null,
              completed: false,
            }
        ),
      }
    })
    activeWorkout.value = {
      id: nanoid(),
      planId: plan.id,
      planName: plan.name,
      startedAt: new Date().toISOString(),
      completedAt: null,
      exercises,
      notes: '',
    }
    saveActiveLocal()
    sbUpsertMeta('active', activeWorkout.value)
  }

  function startEmptyWorkout(name = 'Free Workout') {
    activeWorkout.value = {
      id: nanoid(),
      planId: null,
      planName: name,
      startedAt: new Date().toISOString(),
      completedAt: null,
      exercises: [],
      notes: '',
    }
    saveActiveLocal()
    sbUpsertMeta('active', activeWorkout.value)
  }

  function updateActiveWorkout(workout: WorkoutLog) {
    activeWorkout.value = workout
    saveActiveLocal()
    sbUpsertMeta('active', workout)
  }

  function finishWorkout() {
    if (!activeWorkout.value) return
    activeWorkout.value.completedAt = new Date().toISOString()
    const completed = { ...activeWorkout.value }
    logs.value.unshift(completed)
    saveLogsLocal()
    sbUpsertLog(completed)
    sbDeleteMeta('active')
    activeWorkout.value = null
    saveActiveLocal()
  }

  function discardWorkout() {
    activeWorkout.value = null
    saveActiveLocal()
    sbDeleteMeta('active')
  }

  // ─── History ────────────────────────────────────
  function deleteLog(id: string) {
    logs.value = logs.value.filter(l => l.id !== id)
    saveLogsLocal()
    sbDeleteLog(id)
  }

  function getLog(id: string): WorkoutLog | undefined {
    return logs.value.find(l => l.id === id)
  }

  // ─── Computed ───────────────────────────────────
  const recentLogs = computed(() => logs.value.slice(0, 5))

  const weeklyCount = computed(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    return logs.value.filter(l => new Date(l.startedAt) >= cutoff).length
  })

  const totalWorkouts = computed(() => logs.value.length)

  // ─── Personal Records ────────────────────────────
  /** Epley estimated 1-rep-max */
  function e1rm(weight: number, reps: number): number {
    if (!weight || !reps) return 0
    return weight * (1 + reps / 30)
  }

  /** Map<exerciseId, best-ever set info> — excludes running exercises */
  const prMap = computed(() => {
    const map = new Map<string, { e1rm: number; weight: number; reps: number; date: string }>()
    for (const log of logs.value) {
      for (const ex of log.exercises) {
        if (isRunningExercise(ex.exerciseId)) continue
        for (const set of ex.sets) {
          if (!set.completed || !set.weight || !set.reps) continue
          const calc = e1rm(set.weight, set.reps)
          const cur = map.get(ex.exerciseId)
          if (!cur || calc > cur.e1rm) {
            map.set(ex.exerciseId, { e1rm: calc, weight: set.weight, reps: set.reps, date: log.startedAt })
          }
        }
      }
    }
    return map
  })

  // ─── Steps ──────────────────────────────────────
  function logSteps(date: string, steps: number) {
    const idx = stepEntries.value.findIndex(e => e.date === date)
    if (idx !== -1) {
      stepEntries.value[idx].steps = steps
    } else {
      stepEntries.value.unshift({ date, steps })
      stepEntries.value.sort((a, b) => b.date.localeCompare(a.date))
    }
    saveStepsLocal()
    sbUpsertMeta('steps', { entries: stepEntries.value })
  }

  function getStepsForDate(date: string): number {
    return stepEntries.value.find(e => e.date === date)?.steps ?? 0
  }

  const todaySteps = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return getStepsForDate(today)
  })

  // ─── Body Weight ─────────────────────────────────
  function logWeight(kg: number, date?: string) {
    const dateStr = date ?? new Date().toISOString().slice(0, 10)
    const idx = bodyWeightLog.value.findIndex(e => e.date === dateStr)
    if (idx !== -1) {
      bodyWeightLog.value[idx] = { date: dateStr, kg }
    } else {
      bodyWeightLog.value.push({ date: dateStr, kg })
      bodyWeightLog.value.sort((a, b) => a.date.localeCompare(b.date))
    }
    saveBwLocal()
    sbUpsertMeta('bodyweight', { entries: bodyWeightLog.value })
  }

  function deleteWeightEntry(date: string) {
    bodyWeightLog.value = bodyWeightLog.value.filter(e => e.date !== date)
    saveBwLocal()
    sbUpsertMeta('bodyweight', { entries: bodyWeightLog.value })
  }

  const latestWeight = computed(() => bodyWeightLog.value[bodyWeightLog.value.length - 1] ?? null)

  /** Chronological history for one exercise (oldest first) */
  function getExerciseHistory(exerciseId: string) {
    type Session = { date: string; logId: string; bestE1rm: number; bestWeight: number; bestReps: number; totalSets: number }
    const sessions: Session[] = []
    for (const log of [...logs.value].reverse()) {
      const ex = log.exercises.find(e => e.exerciseId === exerciseId)
      if (!ex) continue
      let best = 0, bestW = 0, bestR = 0, sets = 0
      for (const set of ex.sets) {
        if (!set.completed) continue
        sets++
        if (set.weight && set.reps) {
          const calc = e1rm(set.weight, set.reps)
          if (calc > best) { best = calc; bestW = set.weight; bestR = set.reps }
        }
      }
      if (sets > 0) sessions.push({ date: log.startedAt, logId: log.id, bestE1rm: best, bestWeight: bestW, bestReps: bestR, totalSets: sets })
    }
    return sessions
  }

  return {
    plans,
    logs,
    activeWorkout,
    syncError,
    loadFromSupabase,
    clearData,
    savePlan,
    deletePlan,
    getPlan,
    createEmptyPlan,
    startWorkout,
    startEmptyWorkout,
    updateActiveWorkout,
    finishWorkout,
    discardWorkout,
    deleteLog,
    getLog,
    recentLogs,
    weeklyCount,
    totalWorkouts,
    prMap,
    e1rm,
    getExerciseHistory,
    bodyWeightLog,
    logWeight,
    deleteWeightEntry,
    latestWeight,
    stepEntries,
    logSteps,
    getStepsForDate,
    todaySteps,
    customExercises,
    saveCustomExercise,
    deleteCustomExercise,
    nutritionProfile,
    saveNutrition,
  }
})
