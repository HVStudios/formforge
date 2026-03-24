import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { nanoid } from '../utils/nanoid'
import { getExerciseName, isRunningExercise } from '../data/exercises'
import type { WorkoutPlan, WorkoutLog, PlanExercise, LoggedExercise, WeightEntry } from '../types'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const useWorkoutsStore = defineStore('workouts', () => {
  const plans         = ref<WorkoutPlan[]>(load('ff_plans', []))
  const logs          = ref<WorkoutLog[]>(load('ff_logs', []))
  const activeWorkout = ref<WorkoutLog | null>(load('ff_active', null))
  const bodyWeightLog = ref<WeightEntry[]>(load('ff_bw', []))

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
  function savePlansLocal()  { localStorage.setItem('ff_plans',  JSON.stringify(plans.value)) }
  function saveLogsLocal()   { localStorage.setItem('ff_logs',   JSON.stringify(logs.value)) }
  function saveActiveLocal() { localStorage.setItem('ff_active', JSON.stringify(activeWorkout.value)) }
  function saveBwLocal()     { localStorage.setItem('ff_bw',     JSON.stringify(bodyWeightLog.value)) }

  // ─── Firestore helpers (fire-and-forget) ─────────
  function fsWritePlan(plan: WorkoutPlan) {
    if (!_uid) return
    setDoc(doc(db, 'users', _uid, 'plans', plan.id), plan).catch(_reportSyncError)
  }
  function fsDeletePlan(planId: string) {
    if (!_uid) return
    deleteDoc(doc(db, 'users', _uid, 'plans', planId)).catch(_reportSyncError)
  }
  function fsWriteLog(log: WorkoutLog) {
    if (!_uid) return
    setDoc(doc(db, 'users', _uid, 'logs', log.id), log).catch(_reportSyncError)
  }
  function fsDeleteLog(logId: string) {
    if (!_uid) return
    deleteDoc(doc(db, 'users', _uid, 'logs', logId)).catch(_reportSyncError)
  }
  function fsWriteActive(workout: WorkoutLog | null) {
    if (!_uid) return
    if (workout) {
      setDoc(doc(db, 'users', _uid, 'meta', 'active'), workout).catch(_reportSyncError)
    } else {
      deleteDoc(doc(db, 'users', _uid, 'meta', 'active')).catch(_reportSyncError)
    }
  }
  function fsWriteBw() {
    if (!_uid) return
    setDoc(doc(db, 'users', _uid, 'meta', 'bodyweight'), { entries: bodyWeightLog.value }).catch(_reportSyncError)
  }

  // ─── Firestore load (called on auth) ─────────────
  async function loadFromFirestore(uid: string) {
    _uid = uid
    const [plansSnap, logsSnap, activeSnap, bwSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'plans')),
      getDocs(collection(db, 'users', uid, 'logs')),
      getDoc(doc(db, 'users', uid, 'meta', 'active')),
      getDoc(doc(db, 'users', uid, 'meta', 'bodyweight')),
    ])
    plans.value = plansSnap.docs.map(d => d.data() as WorkoutPlan)
    logs.value  = logsSnap.docs
      .map(d => d.data() as WorkoutLog)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    activeWorkout.value = activeSnap.exists() ? (activeSnap.data() as WorkoutLog) : null
    bodyWeightLog.value = bwSnap.exists() ? ((bwSnap.data() as { entries: WeightEntry[] }).entries ?? []) : []
    savePlansLocal()
    saveLogsLocal()
    saveActiveLocal()
    saveBwLocal()
  }

  /** Call when the user signs out — clears in-memory and local data. */
  function clearData() {
    _uid = null
    plans.value         = []
    logs.value          = []
    activeWorkout.value = null
    bodyWeightLog.value = []
    localStorage.removeItem('ff_plans')
    localStorage.removeItem('ff_logs')
    localStorage.removeItem('ff_active')
    localStorage.removeItem('ff_bw')
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
    fsWritePlan(plan)
  }

  function deletePlan(id: string) {
    plans.value = plans.value.filter(p => p.id !== id)
    savePlansLocal()
    fsDeletePlan(id)
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
  function startWorkout(plan: WorkoutPlan) {
    const exercises: LoggedExercise[] = plan.exercises.map((pe: PlanExercise) => ({
      uid: pe.uid,
      exerciseId: pe.exerciseId,
      exerciseName: getExerciseName(pe.exerciseId),
      notes: pe.notes,
      sets: pe.sets.map(s => ({
        reps: s.targetReps || null,
        weight: s.targetWeight || null,
        completed: false,
      })),
    }))
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
    fsWriteActive(activeWorkout.value)
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
    fsWriteActive(activeWorkout.value)
  }

  function updateActiveWorkout(workout: WorkoutLog) {
    activeWorkout.value = workout
    saveActiveLocal()
    fsWriteActive(workout)
  }

  function finishWorkout() {
    if (!activeWorkout.value) return
    activeWorkout.value.completedAt = new Date().toISOString()
    const completed = { ...activeWorkout.value }
    logs.value.unshift(completed)
    saveLogsLocal()
    fsWriteLog(completed)
    fsWriteActive(null)
    activeWorkout.value = null
    saveActiveLocal()
  }

  function discardWorkout() {
    activeWorkout.value = null
    saveActiveLocal()
    fsWriteActive(null)
  }

  // ─── History ────────────────────────────────────
  function deleteLog(id: string) {
    logs.value = logs.value.filter(l => l.id !== id)
    saveLogsLocal()
    fsDeleteLog(id)
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
    fsWriteBw()
  }

  function deleteWeightEntry(date: string) {
    bodyWeightLog.value = bodyWeightLog.value.filter(e => e.date !== date)
    saveBwLocal()
    fsWriteBw()
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
    loadFromFirestore,
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
  }
})
