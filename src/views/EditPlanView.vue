<template>
  <main class="page">
    <div class="page-inner">
      <!-- Header: circle back + centered title + accent Save -->
      <div class="edit-header">
        <button class="circle-btn" @click="router.back()">‹</button>
        <div class="edit-header-center">
          <div class="edit-header-sub">{{ isNew ? 'NEW PLAN' : 'EDIT PLAN' }}</div>
          <div class="edit-header-title">{{ plan.name || 'Untitled' }}</div>
        </div>
        <button class="accent-save-btn" :disabled="!plan.name.trim()" @click="save">Save</button>
      </div>

      <!-- Plan name -->
      <div class="edit-field">
        <div class="edit-label">PLAN NAME</div>
        <input v-model="plan.name" class="edit-name-input" placeholder="e.g. Push Day, Forge 5×5…" maxlength="60" />
      </div>

      <!-- Goal: 2×3 tile grid -->
      <div class="edit-field">
        <div class="edit-label">GOAL</div>
        <div class="goal-grid">
          <button
            v-for="g in GOALS"
            :key="g.value"
            class="goal-tile"
            :class="{ active: plan.goal === g.value }"
            @click="plan.goal = plan.goal === g.value ? undefined : g.value"
          >
            <div class="goal-tile-name">{{ g.label }}</div>
            <div class="goal-tile-desc">{{ g.desc }}</div>
          </button>
        </div>
      </div>

      <!-- Difficulty + Days/wk as stat cards -->
      <div class="meta-row">
        <div class="meta-card">
          <div class="edit-label">DIFFICULTY</div>
          <div class="pill-row" style="margin-top: 8px">
            <button
              v-for="d in DIFFICULTIES"
              :key="d.value"
              class="meta-pill"
              :class="{ active: plan.difficulty === d.value, [`diff-${d.value}`]: plan.difficulty === d.value }"
              @click="plan.difficulty = plan.difficulty === d.value ? undefined : d.value"
            >{{ d.label }}</button>
          </div>
        </div>
        <div class="meta-card">
          <div class="edit-label">DAYS / WK</div>
          <div class="pill-row" style="margin-top: 8px; flex-wrap: wrap">
            <button
              v-for="n in [1,2,3,4,5,6,7]"
              :key="n"
              class="meta-pill num-pill"
              :class="{ active: plan.daysPerWeek === n }"
              @click="plan.daysPerWeek = plan.daysPerWeek === n ? undefined : n"
            >{{ n }}</button>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="edit-field">
        <div class="edit-label">NOTES <span class="optional-note">optional</span></div>
        <textarea
          v-model="plan.description"
          class="edit-textarea"
          placeholder="Goal, injuries, equipment, anything else…"
          rows="2"
        />
      </div>

      <!-- Exercises section header -->
      <div class="ex-section-header">
        <div class="edit-label">EXERCISES · {{ plan.exercises.length }}</div>
        <button class="reorder-btn" @click="showSelector = true">+ ADD</button>
      </div>

      <div v-if="plan.exercises.length === 0" class="empty-state" style="padding: 24px 0">
        <div class="empty-icon">🏋️</div>
        <p>No exercises yet. Add some!</p>
      </div>

      <!-- Exercise cards -->
      <div class="exercises-list">
        <div v-for="(pe, idx) in plan.exercises" :key="pe.uid" class="exercise-card">
          <!-- Card header -->
          <div class="ex-card-header">
            <div class="ex-card-left">
              <div class="ex-num-chip">{{ String(idx + 1).padStart(2, '0') }}</div>
              <div>
                <div class="ex-card-name">{{ getExerciseName(pe.exerciseId) }}</div>
                <div class="ex-card-sub">{{ CATEGORY_LABELS[getExerciseById(pe.exerciseId)?.category ?? ''] }}</div>
              </div>
            </div>
            <div class="ex-card-controls">
              <button v-if="idx > 0" class="ex-ctrl-btn" @click="moveUp(idx)">↑</button>
              <button v-if="idx < plan.exercises.length - 1" class="ex-ctrl-btn" @click="moveDown(idx)">↓</button>
              <button class="ex-ctrl-btn ex-ctrl-del" @click="removeExercise(idx)">✕</button>
            </div>
          </div>

          <!-- Sets header row -->
          <div class="sets-col-header">
            <div class="set-col-num">SET</div>
            <div class="set-col-field">{{ isRunningExercise(pe.exerciseId) ? 'KM' : 'KG' }}</div>
            <div class="set-col-field">{{ isRunningExercise(pe.exerciseId) ? 'MIN' : 'REPS' }}</div>
            <div class="set-col-del" />
          </div>

          <!-- Set rows -->
          <div class="planned-sets">
            <div v-for="(set, si) in pe.sets" :key="si" class="planned-set-row">
              <div class="set-num">{{ si + 1 }}</div>
              <template v-if="isRunningExercise(pe.exerciseId)">
                <input
                  v-model.number="set.targetDistanceKm"
                  type="number"
                  inputmode="decimal"
                  step="0.5"
                  min="0"
                  placeholder="km"
                  class="plan-input"
                />
                <input
                  v-model.number="set.targetDurationMin"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  placeholder="min"
                  class="plan-input"
                />
              </template>
              <template v-else>
                <input
                  v-model.number="set.targetWeight"
                  type="number"
                  inputmode="decimal"
                  placeholder="0"
                  class="plan-input"
                />
                <input
                  v-model.number="set.targetReps"
                  type="number"
                  inputmode="numeric"
                  placeholder="0"
                  class="plan-input"
                />
              </template>
              <button class="set-del-btn" @click="removeSet(pe, si)">✕</button>
            </div>
          </div>

          <!-- Dashed add set -->
          <button class="add-set-dashed" @click="addSet(pe)">+ ADD SET</button>

          <!-- Notes -->
          <input
            v-model="pe.notes"
            class="edit-textarea"
            style="margin-top: 8px; padding: 8px 10px; font-size: 0.8125rem"
            placeholder="Notes for this exercise (optional)"
          />
        </div>

        <!-- Dashed add exercise card -->
        <div class="add-exercise-card" @click="showSelector = true">
          <div class="add-exercise-label">+ Add exercise</div>
          <div class="add-exercise-sub">Browse 240+ in the library</div>
        </div>
      </div>

      <!-- XP preview -->
      <div class="xp-preview">
        <div class="xp-preview-icon">✦</div>
        <div class="xp-preview-body">
          <div class="xp-preview-label">EST. XP / SESSION</div>
          <div class="xp-preview-val">+{{ xpMin }} to +{{ xpMax }}</div>
        </div>
        <div class="xp-preview-dur mono">~{{ estimatedMinutes }}M</div>
      </div>

      <div style="height: 40px" />
    </div>
  </main>

  <ExerciseSelector v-model="showSelector" @select="addExercise" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { nanoid } from '../utils/nanoid'
import { getExerciseById, getExerciseName, CATEGORY_LABELS, isRunningExercise } from '../data/exercises'
import type { Exercise, PlanExercise, PlannedSet, PlanGoal, PlanDifficulty } from '../types'
import ExerciseSelector from '../components/ExerciseSelector.vue'

const GOALS: { value: PlanGoal; label: string; desc: string }[] = [
  { value: 'strength',    label: 'Strength',    desc: 'Heavy compounds' },
  { value: 'hypertrophy', label: 'Hypertrophy', desc: 'Muscle growth' },
  { value: 'endurance',   label: 'Endurance',   desc: 'Run + capacity' },
  { value: 'fat-loss',    label: 'Fat loss',    desc: 'Cut & cardio' },
  { value: 'mobility',    label: 'Mobility',    desc: 'Range of motion' },
  { value: 'general',     label: 'General',     desc: 'Stay fit' },
]

const DIFFICULTIES: { value: PlanDifficulty; label: string }[] = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
]

const DURATIONS = [
  { value: 30,  label: '30m' },
  { value: 45,  label: '45m' },
  { value: 60,  label: '60m' },
  { value: 90,  label: '90m+' },
]

const props = defineProps<{ id?: string }>()
const router = useRouter()
const store = useWorkoutsStore()

const isNew = !props.id
const showSelector = ref(false)

const plan = reactive(
  props.id ? JSON.parse(JSON.stringify(store.getPlan(props.id) ?? store.createEmptyPlan()))
           : store.createEmptyPlan()
)

// Migrate legacy running plans where distance was stored in `targetReps`.
// Running plans saved before the dedicated running fields existed used
// `targetReps` to mean "km" and `targetWeight` was always 0.
for (const pe of plan.exercises as PlanExercise[]) {
  if (!isRunningExercise(pe.exerciseId)) continue
  for (const s of pe.sets) {
    if (s.targetDistanceKm == null && s.targetReps) s.targetDistanceKm = s.targetReps
  }
}

onMounted(() => {
  if (props.id && !store.getPlan(props.id)) {
    router.replace({ name: 'plans' })
  }
})

const totalSets = computed(() =>
  plan.exercises.reduce((sum: number, pe: PlanExercise) => sum + pe.sets.length, 0)
)
const xpMin = computed(() => Math.max(50, totalSets.value * 10))
const xpMax = computed(() => Math.max(80, totalSets.value * 14))
const estimatedMinutes = computed(() => Math.max(20, totalSets.value * 2 + plan.exercises.length * 3))

function addExercise(ex: Exercise) {
  const isRun = isRunningExercise(ex.id)
  const pe: PlanExercise = {
    uid: nanoid(),
    exerciseId: ex.id,
    sets: [isRun
      ? { targetReps: 0, targetWeight: 0, targetDistanceKm: 5 }
      : { targetReps: 10, targetWeight: 0 }
    ],
    notes: '',
  }
  plan.exercises.push(pe)
}

function removeExercise(idx: number) {
  plan.exercises.splice(idx, 1)
}

function addSet(pe: PlanExercise) {
  const last = pe.sets.at(-1)
  const isRun = isRunningExercise(pe.exerciseId)
  const newSet: PlannedSet = isRun
    ? {
        targetReps: 0,
        targetWeight: 0,
        targetDistanceKm:  last?.targetDistanceKm  ?? 5,
        targetDurationMin: last?.targetDurationMin,
      }
    : {
        targetReps:   last?.targetReps   ?? 10,
        targetWeight: last?.targetWeight ?? 0,
      }
  pe.sets.push(newSet)
}

function removeSet(pe: PlanExercise, idx: number) {
  if (pe.sets.length <= 1) return
  pe.sets.splice(idx, 1)
}

function moveUp(idx: number) {
  if (idx === 0) return
  const tmp = plan.exercises[idx]
  plan.exercises[idx] = plan.exercises[idx - 1]
  plan.exercises[idx - 1] = tmp
}

function moveDown(idx: number) {
  if (idx >= plan.exercises.length - 1) return
  const tmp = plan.exercises[idx]
  plan.exercises[idx] = plan.exercises[idx + 1]
  plan.exercises[idx + 1] = tmp
}

function save() {
  if (!plan.name.trim()) return
  plan.updatedAt = new Date().toISOString()
  store.savePlan({ ...plan, exercises: plan.exercises })
  router.back()
}
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────── */
.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.circle-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: var(--text);
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.edit-header-center {
  text-align: center;
  flex: 1;
  padding: 0 12px;
}

.edit-header-sub {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
}

.edit-header-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.accent-save-btn {
  padding: 8px 16px;
  background: var(--accent);
  color: var(--accent-ink);
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8125rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.accent-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Field wrapper ───────────────────────────────────────── */
.edit-field {
  margin-bottom: 16px;
}

.edit-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.optional-note {
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: 0;
}

.edit-name-input {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
  color: var(--text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.edit-name-input:focus { border-color: var(--accent); }

.edit-textarea {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 0.875rem;
  color: var(--text);
  outline: none;
  box-sizing: border-box;
  resize: none;
  transition: border-color 0.15s;
}
.edit-textarea:focus { border-color: var(--accent); }

/* ── Goal 2×3 grid ───────────────────────────────────────── */
.goal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.goal-tile {
  padding: 12px;
  border-radius: 14px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.goal-tile.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.goal-tile-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: -0.01em;
}

.goal-tile-desc {
  font-size: 0.6875rem;
  margin-top: 2px;
  opacity: 0.65;
}

/* ── Meta row (difficulty + days) ────────────────────────── */
.meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-pill {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.meta-pill.active {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-color: var(--accent);
  color: var(--accent);
}
.meta-pill.diff-beginner.active    { background: color-mix(in srgb, var(--cool) 15%, transparent); border-color: var(--cool); color: var(--cool); }
.meta-pill.diff-intermediate.active { background: color-mix(in srgb, var(--accent) 15%, transparent); border-color: var(--accent); color: var(--accent); }
.meta-pill.diff-advanced.active    { background: color-mix(in srgb, var(--flame) 15%, transparent); border-color: var(--flame); color: var(--flame); }

.num-pill {
  width: 32px;
  padding: 5px 0;
  text-align: center;
}

/* ── Exercise section header ─────────────────────────────── */
.ex-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.reorder-btn {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
  letter-spacing: 0.08em;
  padding: 0;
}

/* ── Exercises list ──────────────────────────────────────── */
.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exercise-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.ex-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.ex-card-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ex-num-chip {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  flex-shrink: 0;
}

.ex-card-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9375rem;
}

.ex-card-sub {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.ex-card-controls {
  display: flex;
  gap: 4px;
}

.ex-ctrl-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  cursor: pointer;
}
.ex-ctrl-del { color: var(--danger); }
.ex-ctrl-del:active { border-color: var(--danger); }

/* Sets col header */
.sets-col-header {
  display: grid;
  grid-template-columns: 20px 1fr 1fr 26px;
  gap: 6px;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}
.set-col-num  { }
.set-col-field { }
.set-col-del  { }

.planned-sets { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }

.planned-set-row {
  display: grid;
  grid-template-columns: 20px 1fr 1fr 26px;
  gap: 6px;
  align-items: center;
}

.set-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-align: center;
}

.plan-input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
}
.plan-input:focus { border-color: var(--accent); }
.plan-input::placeholder { color: var(--text-muted); }
.plan-input::-webkit-inner-spin-button,
.plan-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.plan-input[type=number] { -moz-appearance: textfield; }

.set-del-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  cursor: pointer;
}

/* Dashed add set */
.add-set-dashed {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  border: 1px dashed var(--border);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, color 0.15s;
}
.add-set-dashed:active { border-color: var(--accent); color: var(--accent); }

/* Dashed add exercise card */
.add-exercise-card {
  padding: 18px;
  border-radius: 14px;
  border: 1.5px dashed color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 4%, transparent);
  text-align: center;
  cursor: pointer;
}
.add-exercise-card:active { opacity: 0.85; }

.add-exercise-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--accent);
}
.add-exercise-sub {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ── XP preview ──────────────────────────────────────────── */
.xp-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  margin-top: 10px;
}

.xp-preview-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 1.125rem;
  font-weight: 800;
  flex-shrink: 0;
}

.xp-preview-body { flex: 1; }

.xp-preview-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

.xp-preview-val {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.375rem;
  color: var(--accent);
  letter-spacing: -0.02em;
  margin-top: 2px;
}

.xp-preview-dur {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
