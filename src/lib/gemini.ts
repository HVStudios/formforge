import { GoogleGenerativeAI } from '@google/generative-ai'
import { EXERCISES } from '../data/exercises'
import type { Equipment } from '../types'

export type Goal       = 'strength' | 'hypertrophy' | 'fat-loss' | 'general'
export type Experience = 'beginner' | 'intermediate' | 'advanced'

export interface RoutinePreferences {
  goal:        Goal
  daysPerWeek: number
  experience:  Experience
  equipment:   Equipment[]
  duration:    30 | 45 | 60 | 90
}

export interface GeneratedExercise {
  exerciseId: string
  sets:       { targetReps: number; targetWeight: number }[]
  notes:      string
}

export interface GeneratedPlan {
  name:        string
  description: string
  exercises:   GeneratedExercise[]
}

const GOAL_SETS: Record<Goal, string> = {
  strength:    '4-5 sets × 3-5 reps, heavy compound movements',
  hypertrophy: '3-4 sets × 8-12 reps, compound and isolation mix',
  'fat-loss':  '3 sets × 12-15 reps, include cardio exercises',
  general:     '3 sets × 10-12 reps, balanced movements',
}

const SESSION_EXERCISES: Record<number, number> = { 30: 4, 45: 5, 60: 7, 90: 9 }

export async function generateRoutine(prefs: RoutinePreferences): Promise<GeneratedPlan[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  // Only show exercises that match selected equipment (bodyweight always included)
  const available = EXERCISES.filter(
    e => prefs.equipment.includes(e.equipment) || e.equipment === 'bodyweight',
  )
  const exerciseList = available
    .map(e => `${e.id} | ${e.name} | ${e.category} | ${e.equipment}`)
    .join('\n')

  const count = SESSION_EXERCISES[prefs.duration]
  const beginnerNote =
    prefs.experience === 'beginner'
      ? 'Focus on compound movements only, keep it simple.'
      : prefs.experience === 'advanced'
        ? 'Include isolation work and add technique tips in notes.'
        : 'Balance compound and isolation movements.'

  const prompt = `You are a certified personal trainer. Generate a ${prefs.daysPerWeek}-day weekly workout routine.

Preferences:
- Goal: ${prefs.goal} — ${GOAL_SETS[prefs.goal]}
- Experience: ${prefs.experience} — ${beginnerNote}
- Session length: ${prefs.duration} min (~${count} exercises per session)
- Available equipment: ${prefs.equipment.join(', ')}

You MUST only use exercises from this list (id | name | category | equipment):
${exerciseList}

Rules:
1. Create exactly ${prefs.daysPerWeek} plans.
2. Use exercise IDs exactly as listed above — no substitutions or made-up IDs.
3. Set targetWeight to 0 for every set.
4. Each set object must have both targetReps and targetWeight.
5. Distribute muscle groups sensibly across the week.
6. Keep notes concise (one short sentence or empty string "").

Return valid JSON only — no markdown, no explanation:
{
  "plans": [
    {
      "name": "Day 1 - Push",
      "description": "Chest, shoulders and triceps",
      "exercises": [
        {
          "exerciseId": "bench-press",
          "sets": [
            {"targetReps": 8, "targetWeight": 0},
            {"targetReps": 8, "targetWeight": 0},
            {"targetReps": 8, "targetWeight": 0}
          ],
          "notes": "Keep elbows at 45 degrees"
        }
      ]
    }
  ]
}`

  const result = await model.generateContent(prompt)
  const raw    = result.response.text().trim()
  // Strip markdown fences if Gemini ignores the mime type
  const json   = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const parsed = JSON.parse(json) as { plans: GeneratedPlan[] }

  // Drop any hallucinated exercise IDs so the app never breaks
  const validIds = new Set(EXERCISES.map(e => e.id))
  for (const plan of parsed.plans) {
    plan.exercises = plan.exercises.filter(ex => validIds.has(ex.exerciseId))
  }

  return parsed.plans
}
