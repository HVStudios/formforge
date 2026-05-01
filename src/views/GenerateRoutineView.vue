<template>
  <main class="page">
    <div class="page-inner">

      <!-- Header -->
      <div class="page-header">
        <RouterLink to="/plans" class="btn btn-ghost btn-sm">← Back</RouterLink>
        <h1>AI Routine</h1>
      </div>

      <!-- ── FORM ─────────────────────────────────── -->
      <div v-if="step === 'form'" class="form-content">

        <!-- Mode toggle -->
        <div class="mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: mode === 'gym' }"
            @click="mode = 'gym'"
          >💪 Gym Routine</button>
          <button
            class="mode-btn"
            :class="{ active: mode === 'running' }"
            @click="mode = 'running'"
          >🏃 Running Plan</button>
        </div>

        <!-- ── GYM FORM ── -->
        <template v-if="mode === 'gym'">
          <section class="form-section">
            <h2 class="section-label">Goal</h2>
            <div class="pill-grid pill-grid-2">
              <button
                v-for="g in GOALS" :key="g.value"
                class="pill-btn" :class="{ active: gymPrefs.goal === g.value }"
                @click="gymPrefs.goal = g.value"
              >
                <span class="pill-icon">{{ g.icon }}</span> {{ g.label }}
              </button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Days per week</h2>
            <div class="pill-grid pill-grid-5">
              <button
                v-for="d in [2,3,4,5,6]" :key="d"
                class="pill-btn" :class="{ active: gymPrefs.daysPerWeek === d }"
                @click="gymPrefs.daysPerWeek = d"
              >{{ d }}</button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Experience</h2>
            <div class="pill-grid pill-grid-3">
              <button
                v-for="e in EXPERIENCES" :key="e.value"
                class="pill-btn" :class="{ active: gymPrefs.experience === e.value }"
                @click="gymPrefs.experience = e.value"
              >{{ e.label }}</button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Available equipment</h2>
            <div class="pill-grid pill-grid-2">
              <button
                v-for="eq in EQUIPMENT_OPTIONS" :key="eq.value"
                class="pill-btn" :class="{ active: gymPrefs.equipment.includes(eq.value) }"
                @click="toggleEquipment(eq.value)"
              >
                <span class="pill-icon">{{ eq.icon }}</span> {{ eq.label }}
              </button>
            </div>
            <p v-if="gymPrefs.equipment.length === 0" class="text-xs text-danger mt-8">
              Select at least one
            </p>
          </section>

          <section class="form-section">
            <h2 class="section-label">Session length</h2>
            <div class="pill-grid pill-grid-4">
              <button
                v-for="d in DURATIONS" :key="d.value"
                class="pill-btn" :class="{ active: gymPrefs.duration === d.value }"
                @click="gymPrefs.duration = d.value"
              >{{ d.label }}</button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Anything else? <span class="optional-label">optional</span></h2>
            <textarea
              v-model="gymPrefs.extraContext"
              class="context-input"
              placeholder="e.g. I have a bad knee so avoid leg press, I want to focus on upper body, I'm training for a holiday in 8 weeks…"
              rows="3"
            />
          </section>

          <button
            class="btn btn-primary btn-full mt-8"
            :disabled="gymPrefs.equipment.length === 0"
            @click="generate"
          >✨ Generate Routine</button>
        </template>

        <!-- ── RUNNING FORM ── -->
        <template v-else>
          <section class="form-section">
            <h2 class="section-label">Goal</h2>
            <div class="pill-grid pill-grid-2">
              <button
                v-for="g in RUNNING_GOALS" :key="g.value"
                class="pill-btn" :class="{ active: runPrefs.goal === g.value }"
                @click="runPrefs.goal = g.value"
              >
                <span class="pill-icon">{{ g.icon }}</span> {{ g.label }}
              </button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Experience</h2>
            <div class="pill-grid pill-grid-3">
              <button
                v-for="e in EXPERIENCES" :key="e.value"
                class="pill-btn" :class="{ active: runPrefs.level === e.value }"
                @click="runPrefs.level = e.value"
              >{{ e.label }}</button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Days per week</h2>
            <div class="pill-grid pill-grid-4">
              <button
                v-for="d in [3,4,5,6]" :key="d"
                class="pill-btn" :class="{ active: runPrefs.daysPerWeek === d }"
                @click="runPrefs.daysPerWeek = d"
              >{{ d }}</button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Longest recent run</h2>
            <div class="pill-grid pill-grid-2">
              <button
                v-for="r in LONGEST_RUNS" :key="r.value"
                class="pill-btn" :class="{ active: runPrefs.longestRun === r.value }"
                @click="runPrefs.longestRun = r.value"
              >{{ r.label }}</button>
            </div>
          </section>

          <section class="form-section">
            <h2 class="section-label">Anything else? <span class="optional-label">optional</span></h2>
            <textarea
              v-model="runPrefs.extraContext"
              class="context-input"
              placeholder="e.g. I'm recovering from a calf strain, I prefer trail runs, my race is on 15 June…"
              rows="3"
            />
          </section>

          <button class="btn btn-primary btn-full mt-8" @click="generate">
            ✨ Generate Running Plan
          </button>
        </template>

      </div>

      <!-- ── LOADING ──────────────────────────────── -->
      <div v-else-if="step === 'loading'" class="loading-state">
        <div class="spinner"></div>
        <p class="text-muted">{{ mode === 'running' ? 'Building your running plan…' : 'Building your personalised routine…' }}</p>
        <p class="text-xs text-muted mt-8">This usually takes 5–10 seconds</p>
      </div>

      <!-- ── ERROR ───────────────────────────────── -->
      <div v-else-if="step === 'error'" class="card error-card">
        <p class="error-title">Something went wrong</p>
        <p class="text-sm text-muted">{{ errorMessage }}</p>
        <button class="btn btn-outline mt-16" @click="step = 'form'">Try Again</button>
      </div>

      <!-- ── PREVIEW ─────────────────────────────── -->
      <div v-else-if="step === 'preview'" class="preview-content">

        <p class="text-sm text-muted preview-note">
          Your {{ generatedPlans.length }}-day {{ mode === 'running' ? 'running plan' : 'routine' }} is ready. Review and save below.
        </p>

        <div v-for="(plan, i) in generatedPlans" :key="i" class="card plan-preview">
          <div class="plan-preview-header">
            <h2 class="plan-name">{{ plan.name }}</h2>
            <p class="text-sm text-muted">{{ plan.description }}</p>
          </div>
          <div class="exercise-list">
            <div
              v-for="ex in plan.exercises" :key="ex.exerciseId"
              class="exercise-row"
            >
              <div class="exercise-main">
                <span class="exercise-name">{{ getExerciseName(ex.exerciseId) }}</span>
                <!-- Running: show Xkm or N × Xkm; Gym: show sets × reps -->
                <span v-if="mode === 'running'" class="exercise-meta text-xs text-muted">
                  {{ runSetLabel(ex) }}
                </span>
                <span v-else class="exercise-meta text-xs text-muted">
                  {{ ex.sets.length }} sets × {{ ex.sets[0]?.targetReps }} reps
                </span>
              </div>
              <p v-if="ex.notes" class="exercise-note text-xs text-muted">{{ ex.notes }}</p>
            </div>
          </div>
        </div>

        <div class="preview-actions">
          <button class="btn btn-outline" @click="step = 'form'">Regenerate</button>
          <button
            class="btn btn-primary"
            :disabled="saving"
            @click="saveAll"
          >
            {{ saving ? 'Saving…' : `Save ${generatedPlans.length} Plans` }}
          </button>
        </div>

      </div>

    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { getExerciseName } from '../data/exercises'
import { nanoid } from '../utils/nanoid'
import {
  generateRoutine,
  generateRunningPlan,
  type Goal,
  type Experience,
  type RunningGoal,
  type LongestRun,
  type GeneratedPlan,
  type GeneratedExercise,
  type RoutinePreferences,
  type RunningPreferences,
} from '../lib/gemini'
import type { Equipment } from '../types'

const router = useRouter()
const store  = useWorkoutsStore()

// ── Mode ──────────────────────────────────────────────────────────────────────
type Mode = 'gym' | 'running'
const mode = ref<Mode>('gym')

// ── Step state ────────────────────────────────────────────────────────────────
type Step = 'form' | 'loading' | 'error' | 'preview'
const step           = ref<Step>('form')
const errorMessage   = ref('')
const saving         = ref(false)
const generatedPlans = ref<GeneratedPlan[]>([])

// ── Gym preferences ───────────────────────────────────────────────────────────
const gymPrefs = reactive<RoutinePreferences>({
  goal:         'hypertrophy',
  daysPerWeek:  3,
  experience:   'intermediate',
  equipment:    ['barbell', 'dumbbell'],
  duration:     60,
  extraContext: '',
})

function toggleEquipment(eq: Equipment) {
  const idx = gymPrefs.equipment.indexOf(eq)
  if (idx === -1) gymPrefs.equipment.push(eq)
  else            gymPrefs.equipment.splice(idx, 1)
}

// ── Running preferences ───────────────────────────────────────────────────────
const runPrefs = reactive<RunningPreferences>({
  goal:         'fitness',
  level:        'beginner',
  daysPerWeek:  3,
  longestRun:   'under5',
  extraContext: '',
})

// ── Options ───────────────────────────────────────────────────────────────────
const GOALS: { value: Goal; label: string; icon: string }[] = [
  { value: 'strength',    label: 'Strength',   icon: '🏋️' },
  { value: 'hypertrophy', label: 'Muscle',      icon: '💪' },
  { value: 'fat-loss',    label: 'Fat Loss',    icon: '🔥' },
  { value: 'general',     label: 'General Fit', icon: '⚡' },
]

const RUNNING_GOALS: { value: RunningGoal; label: string; icon: string }[] = [
  { value: 'fitness',        label: 'General Fitness', icon: '🌟' },
  { value: '5k',             label: '5K',              icon: '🏅' },
  { value: '10k',            label: '10K',             icon: '🎯' },
  { value: 'half-marathon',  label: 'Half Marathon',   icon: '🥈' },
  { value: 'marathon',       label: 'Marathon',        icon: '🏆' },
]

const EXPERIENCES: { value: Experience; label: string }[] = [
  { value: 'beginner',     label: 'Beginner'     },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced'     },
]

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; icon: string }[] = [
  { value: 'barbell',    label: 'Barbell',    icon: '🏋️' },
  { value: 'dumbbell',   label: 'Dumbbell',   icon: '💪' },
  { value: 'machine',    label: 'Machine',    icon: '⚙️' },
  { value: 'cable',      label: 'Cable',      icon: '🔗' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
  { value: 'other',      label: 'Other',      icon: '➕' },
]

const DURATIONS: { value: 30 | 45 | 60 | 90; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
]

const LONGEST_RUNS: { value: LongestRun; label: string }[] = [
  { value: 'under5',  label: '< 5 km'    },
  { value: '5to10',   label: '5–10 km'   },
  { value: '10to20',  label: '10–20 km'  },
  { value: 'over20',  label: '20+ km'    },
]

// ── Running preview helper ────────────────────────────────────────────────────
function runSetLabel(ex: GeneratedExercise): string {
  if (ex.sets.length === 0) return ''
  const first = ex.sets[0]
  const km = first.targetDistanceKm ?? first.targetReps
  if (ex.sets.length === 1) return `${km} km`
  return `${ex.sets.length} × ${km} km`
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function generate() {
  step.value = 'loading'
  try {
    generatedPlans.value = mode.value === 'running'
      ? await generateRunningPlan({ ...runPrefs })
      : await generateRoutine({ ...gymPrefs })
    step.value = 'preview'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Unknown error'
    step.value = 'error'
  }
}

function saveAll() {
  saving.value = true
  const now = new Date().toISOString()
  for (const plan of generatedPlans.value) {
    store.savePlan({
      id:          nanoid(),
      name:        plan.name,
      description: plan.description,
      // carry over structured metadata from the generation form
      ...(mode.value === 'gym' ? {
        goal:            gymPrefs.goal as import('../types').PlanGoal,
        difficulty:      gymPrefs.experience as import('../types').PlanDifficulty,
        daysPerWeek:     gymPrefs.daysPerWeek,
        sessionDuration: gymPrefs.duration,
      } : {
        difficulty:  runPrefs.level as import('../types').PlanDifficulty,
        daysPerWeek: runPrefs.daysPerWeek,
      }),
      exercises:   plan.exercises.map(ex => ({
        uid:        nanoid(),
        exerciseId: ex.exerciseId,
        notes:      ex.notes ?? '',
        sets:       ex.sets.map(s => ({
          targetReps:        s.targetReps,
          targetWeight:      s.targetWeight,
          ...(s.targetDistanceKm  != null ? { targetDistanceKm:  s.targetDistanceKm  } : {}),
          ...(s.targetDurationMin != null ? { targetDurationMin: s.targetDurationMin } : {}),
        })),
      })),
      createdAt: now,
      updatedAt: now,
    })
  }
  router.push({ name: 'plans' })
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.form-content,
.preview-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 80px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

/* ── Mode toggle ────────────────────────────────────────────────────────── */
.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 4px;
  margin-bottom: 4px;
}

.mode-btn {
  padding: 10px 12px;
  border-radius: calc(var(--radius) - 2px);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.mode-btn.active {
  background: var(--primary-dim);
  color: var(--primary);
}

/* ── Pill buttons ───────────────────────────────────────────────────────── */
.pill-grid {
  display: grid;
  gap: 8px;
}
.pill-grid-2 { grid-template-columns: repeat(2, 1fr); }
.pill-grid-3 { grid-template-columns: repeat(3, 1fr); }
.pill-grid-4 { grid-template-columns: repeat(4, 1fr); }
.pill-grid-5 { grid-template-columns: repeat(5, 1fr); }

.pill-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  white-space: nowrap;
}
.pill-btn:hover  { border-color: var(--primary); }
.pill-btn.active {
  border-color: var(--primary);
  background: var(--primary-dim);
  color: var(--primary);
  font-weight: 600;
}

.pill-icon { font-size: 1rem; }

/* ── Loading ────────────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 0;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Error ──────────────────────────────────────────────────────────────── */
.error-card  { display: flex; flex-direction: column; gap: 6px; }
.error-title { font-weight: 700; color: var(--danger); }

/* ── Preview ────────────────────────────────────────────────────────────── */
.preview-note { margin-bottom: 4px; }

.plan-preview { display: flex; flex-direction: column; gap: 12px; }

.plan-preview-header { display: flex; flex-direction: column; gap: 2px; }

.plan-name { font-size: 1.05rem; font-weight: 700; }

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.exercise-row  { display: flex; flex-direction: column; gap: 2px; }

.exercise-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.exercise-name { font-size: 0.9rem; font-weight: 500; }

.exercise-note { padding-left: 2px; font-style: italic; opacity: 0.8; }

.preview-actions {
  display: flex;
  gap: 10px;
  position: sticky;
  bottom: calc(64px + 12px);
  background: var(--bg);
  padding: 12px 0 4px;
}
.preview-actions .btn-outline { flex: 1; }
.preview-actions .btn-primary { flex: 2; }

/* ── Extra context textarea ─────────────────────────────────────────────── */
.context-input {
  width: 100%;
  background: rgba(8, 12, 26, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 0.9rem;
  font-family: inherit;
  line-height: 1.5;
  padding: 12px 14px;
  resize: none;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.context-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-dim);
}
.context-input::placeholder { color: var(--text-dim); }

.optional-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-dim);
  text-transform: none;
  letter-spacing: 0;
}

/* ── Utilities ──────────────────────────────────────────────────────────── */
.mt-8  { margin-top: 8px;  }
.mt-16 { margin-top: 16px; }
.text-danger { color: var(--danger); }
.btn-full { width: 100%; }
</style>
