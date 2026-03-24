export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'other'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'bodyweight'
  | 'machine'
  | 'cable'
  | 'other'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  equipment: Equipment
}

/** One planned set inside a workout plan */
export interface PlannedSet {
  targetReps: number
  targetWeight: number
}

/** An exercise slot inside a workout plan */
export interface PlanExercise {
  uid: string
  exerciseId: string
  sets: PlannedSet[]
  notes: string
}

/** A saved workout template */
export interface WorkoutPlan {
  id: string
  name: string
  description: string
  exercises: PlanExercise[]
  createdAt: string
  updatedAt: string
}

/** A set logged during an actual workout */
export interface LoggedSet {
  reps: number | null
  weight: number | null
  completed: boolean
}

/** An exercise logged during an actual workout */
export interface LoggedExercise {
  uid: string
  exerciseId: string
  exerciseName: string
  sets: LoggedSet[]
  notes: string
}

/** A daily step count entry */
export interface StepEntry {
  date: string  // YYYY-MM-DD
  steps: number
}

/** A body weight entry */
export interface WeightEntry {
  date: string   // YYYY-MM-DD
  kg: number
}

/** A workout session (in progress or completed) */
export interface WorkoutLog {
  id: string
  planId: string | null
  planName: string
  startedAt: string
  completedAt: string | null
  exercises: LoggedExercise[]
  notes: string
}
