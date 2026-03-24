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

export type RunningGoal = '5k' | '10k' | 'half-marathon' | 'marathon' | 'fitness'
export type LongestRun  = 'under5' | '5to10' | '10to20' | 'over20'

export interface RunningPreferences {
  goal:        RunningGoal
  level:       Experience
  daysPerWeek: number
  longestRun:  LongestRun
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

// ── Running regimen ────────────────────────────────────────────────────────

const RUNNING_EXERCISES = `run-easy | Easy Run | sustained aerobic effort, conversational pace, Zone 2
run-tempo | Tempo Run | comfortably hard, lactate threshold pace (~1hr race effort)
run-interval | Interval Run | high-intensity repeats (e.g. 6×1km at 5K pace)
run-long | Long Run | longest run of the week, easy pace, 60–120+ min
run-recovery | Recovery Run | very easy, very short, active recovery
run-fartlek | Fartlek | unstructured speed play mixed into an easy run
run-hill | Hill Repeats | repeated hill climbs for strength and power`

const RUNNING_GOAL_CONTEXT: Record<RunningGoal, string> = {
  '5k':            'Improve 5K race time — mix of intervals, tempo, and easy runs',
  '10k':           'Build toward a 10K — tempo work and longer easy runs',
  'half-marathon': 'Half marathon training — long runs, tempo, and easy base',
  'marathon':      'Marathon training — high mileage base, long runs, and marathon-pace work',
  'fitness':       'General running fitness — aerobic base, consistency, enjoyment',
}

const LONGEST_RUN_LABELS: Record<LongestRun, string> = {
  under5:  'under 5 km (beginner base)',
  '5to10': '5–10 km (building endurance)',
  '10to20':'10–20 km (solid base)',
  over20:  '20+ km (high mileage runner)',
}

export async function generateRunningPlan(prefs: RunningPreferences): Promise<GeneratedPlan[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = `You are an expert running coach. Generate a ${prefs.daysPerWeek}-day weekly running training plan.

Runner profile:
- Goal: ${RUNNING_GOAL_CONTEXT[prefs.goal]}
- Level: ${prefs.level}
- Longest recent run: ${LONGEST_RUN_LABELS[prefs.longestRun]}

You MUST only use exercise IDs from this list (id | name | description):
${RUNNING_EXERCISES}

Rules:
1. Create exactly ${prefs.daysPerWeek} plans, one per running day.
2. "targetReps" = distance in whole kilometres for that segment. "targetWeight" = 0 always.
3. Each set object must have both targetReps and targetWeight.
4. For interval sessions split into warmup / main set / cooldown as separate exercise entries.
   For the main interval block use multiple sets (e.g. 6 sets × 1km).
5. For single-segment runs use exactly 1 set with the total distance.
6. notes = concise pace or effort cue (one sentence max, or empty string "").
7. Never schedule two hard sessions (tempo, interval, hill, fartlek) on consecutive days.
8. Total weekly distance should be appropriate for the runner's level and longest run.
9. Include at least one easy/recovery run per week.

Return valid JSON only — no markdown, no explanation:
{
  "plans": [
    {
      "name": "Day 1 – Easy Run",
      "description": "Aerobic base, settle into the week",
      "exercises": [
        {
          "exerciseId": "run-easy",
          "sets": [{"targetReps": 6, "targetWeight": 0}],
          "notes": "Conversational pace, keep heart rate in Zone 2"
        }
      ]
    }
  ]
}`

  const result = await model.generateContent(prompt)
  const raw    = result.response.text().trim()
  const json   = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const parsed = JSON.parse(json) as { plans: GeneratedPlan[] }

  // Keep only known running exercise IDs
  const validRunIds = new Set([
    'run-easy', 'run-tempo', 'run-interval', 'run-long',
    'run-recovery', 'run-fartlek', 'run-hill',
  ])
  for (const plan of parsed.plans) {
    plan.exercises = plan.exercises.filter(ex => validRunIds.has(ex.exerciseId))
  }

  return parsed.plans
}
