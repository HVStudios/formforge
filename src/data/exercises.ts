import type { Exercise } from '../types'

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', category: 'chest', equipment: 'barbell' },
  { id: 'incline-bench', name: 'Incline Bench Press', category: 'chest', equipment: 'barbell' },
  { id: 'db-fly', name: 'Dumbbell Fly', category: 'chest', equipment: 'dumbbell' },
  { id: 'db-bench', name: 'Dumbbell Bench Press', category: 'chest', equipment: 'dumbbell' },
  { id: 'cable-crossover', name: 'Cable Crossover', category: 'chest', equipment: 'cable' },
  { id: 'push-up', name: 'Push-up', category: 'chest', equipment: 'bodyweight' },
  { id: 'dip', name: 'Dip', category: 'chest', equipment: 'bodyweight' },

  // Back
  { id: 'deadlift', name: 'Deadlift', category: 'back', equipment: 'barbell' },
  { id: 'barbell-row', name: 'Barbell Row', category: 'back', equipment: 'barbell' },
  { id: 'pull-up', name: 'Pull-up', category: 'back', equipment: 'bodyweight' },
  { id: 'chin-up', name: 'Chin-up', category: 'back', equipment: 'bodyweight' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'back', equipment: 'cable' },
  { id: 'seated-row', name: 'Seated Cable Row', category: 'back', equipment: 'cable' },
  { id: 'db-row', name: 'Dumbbell Row', category: 'back', equipment: 'dumbbell' },
  { id: 'face-pull', name: 'Face Pull', category: 'back', equipment: 'cable' },

  // Legs
  { id: 'squat', name: 'Squat', category: 'legs', equipment: 'barbell' },
  { id: 'front-squat', name: 'Front Squat', category: 'legs', equipment: 'barbell' },
  { id: 'leg-press', name: 'Leg Press', category: 'legs', equipment: 'machine' },
  { id: 'leg-curl', name: 'Leg Curl', category: 'legs', equipment: 'machine' },
  { id: 'leg-extension', name: 'Leg Extension', category: 'legs', equipment: 'machine' },
  { id: 'rdl', name: 'Romanian Deadlift', category: 'legs', equipment: 'barbell' },
  { id: 'lunge', name: 'Lunge', category: 'legs', equipment: 'dumbbell' },
  { id: 'calf-raise', name: 'Calf Raise', category: 'legs', equipment: 'machine' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'legs', equipment: 'dumbbell' },

  // Shoulders
  { id: 'ohp', name: 'Overhead Press', category: 'shoulders', equipment: 'barbell' },
  { id: 'db-ohp', name: 'Dumbbell Shoulder Press', category: 'shoulders', equipment: 'dumbbell' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'shoulders', equipment: 'dumbbell' },
  { id: 'front-raise', name: 'Front Raise', category: 'shoulders', equipment: 'dumbbell' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', category: 'shoulders', equipment: 'dumbbell' },
  { id: 'upright-row', name: 'Upright Row', category: 'shoulders', equipment: 'barbell' },

  // Arms
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'arms', equipment: 'barbell' },
  { id: 'db-curl', name: 'Dumbbell Curl', category: 'arms', equipment: 'dumbbell' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'arms', equipment: 'dumbbell' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'arms', equipment: 'cable' },
  { id: 'skull-crusher', name: 'Skull Crusher', category: 'arms', equipment: 'barbell' },
  { id: 'overhead-tricep', name: 'Overhead Tricep Extension', category: 'arms', equipment: 'dumbbell' },
  { id: 'preacher-curl', name: 'Preacher Curl', category: 'arms', equipment: 'barbell' },

  // Core
  { id: 'plank', name: 'Plank', category: 'core', equipment: 'bodyweight' },
  { id: 'crunch', name: 'Crunch', category: 'core', equipment: 'bodyweight' },
  { id: 'leg-raise', name: 'Leg Raise', category: 'core', equipment: 'bodyweight' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', category: 'core', equipment: 'other' },
  { id: 'cable-crunch', name: 'Cable Crunch', category: 'core', equipment: 'cable' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'core', equipment: 'bodyweight' },

  // Cardio
  { id: 'running', name: 'Running', category: 'cardio', equipment: 'other' },
  { id: 'cycling', name: 'Cycling', category: 'cardio', equipment: 'machine' },
  { id: 'rowing', name: 'Rowing Machine', category: 'cardio', equipment: 'machine' },
  { id: 'jump-rope', name: 'Jump Rope', category: 'cardio', equipment: 'other' },
  { id: 'elliptical', name: 'Elliptical', category: 'cardio', equipment: 'machine' },

  // Running — used by the AI running regimen generator
  { id: 'run-easy',      name: 'Easy Run',      category: 'cardio', equipment: 'other' },
  { id: 'run-tempo',     name: 'Tempo Run',      category: 'cardio', equipment: 'other' },
  { id: 'run-interval',  name: 'Interval Run',   category: 'cardio', equipment: 'other' },
  { id: 'run-long',      name: 'Long Run',        category: 'cardio', equipment: 'other' },
  { id: 'run-recovery',  name: 'Recovery Run',   category: 'cardio', equipment: 'other' },
  { id: 'run-fartlek',   name: 'Fartlek',         category: 'cardio', equipment: 'other' },
  { id: 'run-hill',      name: 'Hill Repeats',    category: 'cardio', equipment: 'other' },
]

export const CATEGORY_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  cardio: 'Cardio',
  other: 'Other',
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id)
}

export function getExerciseName(id: string): string {
  return getExerciseById(id)?.name ?? id
}

export function isRunningExercise(exerciseId: string): boolean {
  return exerciseId.startsWith('run-')
}
