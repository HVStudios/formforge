import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  const plans = ref<WorkoutPlan[]>(load('ff_plans', []))
  const logs = ref<WorkoutLog[]>(load('ff_logs', []))
  const activeWorkout = ref<WorkoutLog | null>(load('ff_active', null))

  // ─── Persistence helpers ────────────────────────────
  function savePlans() {
    localStorage.setItem('ff_plans', JSON.stringify(plans.value))
  }
  function saveLogs() {
    localStorage.setItem('ff_logs', JSON.stringify(logs.value))
  }
  function saveActive() {
    localStorage.setItem('ff_active', JSON.stringify(activeWorkout.value))
  }

  // ─── Plans ──────────────────────────────────────────
  function savePlan(plan: WorkoutPlan) {
    const idx = plans.value.findIndex(p => p.id === plan.id)
    if (idx !== -1) {
      plans.value[idx] = plan
    } else {
      plans.value.push(plan)
    }
    savePlans()
  }

  function deletePlan(id: string) {
    plans.value = plans.value.filter(p => p.id !== id)
    savePlans()
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

  // ─── Active workout ─────────────────────────────────
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
    saveActive()
  }

  function startEmptyWorkout() {
    activeWorkout.value = {
      id: nanoid(),
      planId: null,
      planName: 'Free Workout',
      startedAt: new Date().toISOString(),
      completedAt: null,
      exercises: [],
      notes: '',
    }
    saveActive()
  }

  function updateActiveWorkout(workout: WorkoutLog) {
    activeWorkout.value = workout
    saveActive()
  }

  function finishWorkout() {
    if (!activeWorkout.value) return
    activeWorkout.value.completedAt = new Date().toISOString()
    logs.value.unshift({ ...activeWorkout.value })
    saveLogs()
    activeWorkout.value = null
    saveActive()
  }

  function discardWorkout() {
    activeWorkout.value = null
    saveActive()
  }

  // ─── History ────────────────────────────────────────
  function deleteLog(id: string) {
    logs.value = logs.value.filter(l => l.id !== id)
    saveLogs()
  }

  function getLog(id: string): WorkoutLog | undefined {
    return logs.value.find(l => l.id === id)
  }

  // ─── Computed ───────────────────────────────────────
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
