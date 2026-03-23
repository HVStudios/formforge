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
import { getExerciseName } from '../data/exercises'
import type { WorkoutPlan, WorkoutLog, PlanExercise, LoggedExercise } from '../types'

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

  let _uid: string | null = null

  // ─── Local cache helpers ─────────────────────────
  function savePlansLocal()  { localStorage.setItem('ff_plans',  JSON.stringify(plans.value)) }
  function saveLogsLocal()   { localStorage.setItem('ff_logs',   JSON.stringify(logs.value)) }
  function saveActiveLocal() { localStorage.setItem('ff_active', JSON.stringify(activeWorkout.value)) }

  // ─── Firestore helpers (fire-and-forget) ─────────
  function fsWritePlan(plan: WorkoutPlan) {
    if (!_uid) return
    setDoc(doc(db, 'users', _uid, 'plans', plan.id), plan).catch(console.error)
  }
  function fsDeletePlan(planId: string) {
    if (!_uid) return
    deleteDoc(doc(db, 'users', _uid, 'plans', planId)).catch(console.error)
  }
  function fsWriteLog(log: WorkoutLog) {
    if (!_uid) return
    setDoc(doc(db, 'users', _uid, 'logs', log.id), log).catch(console.error)
  }
  function fsDeleteLog(logId: string) {
    if (!_uid) return
    deleteDoc(doc(db, 'users', _uid, 'logs', logId)).catch(console.error)
  }
  function fsWriteActive(workout: WorkoutLog | null) {
    if (!_uid) return
    if (workout) {
      setDoc(doc(db, 'users', _uid, 'meta', 'active'), workout).catch(console.error)
    } else {
      deleteDoc(doc(db, 'users', _uid, 'meta', 'active')).catch(console.error)
    }
  }

  // ─── Firestore load (called on auth) ─────────────
  async function loadFromFirestore(uid: string) {
    _uid = uid
    const [plansSnap, logsSnap, activeSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'plans')),
      getDocs(collection(db, 'users', uid, 'logs')),
      getDoc(doc(db, 'users', uid, 'meta', 'active')),
    ])
    plans.value = plansSnap.docs.map(d => d.data() as WorkoutPlan)
    logs.value  = logsSnap.docs
      .map(d => d.data() as WorkoutLog)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    activeWorkout.value = activeSnap.exists() ? (activeSnap.data() as WorkoutLog) : null
    savePlansLocal()
    saveLogsLocal()
    saveActiveLocal()
  }

  /** Call when the user signs out — clears in-memory and local data. */
  function clearData() {
    _uid = null
    plans.value         = []
    logs.value          = []
    activeWorkout.value = null
    localStorage.removeItem('ff_plans')
    localStorage.removeItem('ff_logs')
    localStorage.removeItem('ff_active')
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

  return {
    plans,
    logs,
    activeWorkout,
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
  }
})
