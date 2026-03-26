<template>
  <main class="page">
    <div class="page-inner">
      <!-- Header -->
      <div class="edit-header">
        <button class="btn btn-ghost" @click="router.back()">← Back</button>
        <h1>{{ isNew ? 'New Plan' : 'Edit Plan' }}</h1>
        <button class="btn btn-primary btn-sm" :disabled="!plan.name.trim()" @click="save">Save</button>
      </div>

      <!-- Plan details -->
      <div class="field">
        <label class="label">Plan Name</label>
        <input v-model="plan.name" class="input" placeholder="e.g. Push Day, Leg Day…" maxlength="60" />
      </div>
      <div class="field">
        <label class="label">Description (optional)</label>
        <textarea v-model="plan.description" class="input" placeholder="What is this plan for?" rows="2" />
      </div>

      <!-- Goal & schedule -->
      <div class="goal-section">
        <div class="field">
          <label class="label">Goal</label>
          <div class="pill-row">
            <button
              v-for="g in GOALS"
              :key="g.value"
              class="goal-pill"
              :class="{ active: plan.goal === g.value }"
              @click="plan.goal = plan.goal === g.value ? undefined : g.value"
            >
              {{ g.icon }} {{ g.label }}
            </button>
          </div>
        </div>

        <div class="field">
          <label class="label">Difficulty</label>
          <div class="pill-row">
            <button
              v-for="d in DIFFICULTIES"
              :key="d.value"
              class="goal-pill"
              :class="{ active: plan.difficulty === d.value, [`diff-${d.value}`]: plan.difficulty === d.value }"
              @click="plan.difficulty = plan.difficulty === d.value ? undefined : d.value"
            >
              {{ d.icon }} {{ d.label }}
            </button>
          </div>
        </div>

        <div class="schedule-row">
          <div class="field" style="flex:1">
            <label class="label">Days / week</label>
            <div class="pill-row">
              <button
                v-for="n in [1,2,3,4,5,6,7]"
                :key="n"
                class="goal-pill num-pill"
                :class="{ active: plan.daysPerWeek === n }"
                @click="plan.daysPerWeek = plan.daysPerWeek === n ? undefined : n"
              >{{ n }}</button>
            </div>
          </div>

          <div class="field" style="flex:1">
            <label class="label">Session length</label>
            <div class="pill-row">
              <button
                v-for="d in DURATIONS"
                :key="d.value"
                class="goal-pill"
                :class="{ active: plan.sessionDuration === d.value }"
                @click="plan.sessionDuration = plan.sessionDuration === d.value ? undefined : d.value"
              >{{ d.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="divider" />

      <!-- Exercises -->
      <div class="flex items-center justify-between mb-12">
        <h2>Exercises</h2>
        <button class="btn btn-outline btn-sm" @click="showSelector = true">+ Add Exercise</button>
      </div>

      <div v-if="plan.exercises.length === 0" class="empty-state" style="padding: 24px 0">
        <div class="empty-icon">🏋️</div>
        <p>No exercises yet. Add some!</p>
      </div>

      <div class="exercises-list">
        <div
          v-for="(pe, idx) in plan.exercises"
          :key="pe.uid"
          class="exercise-editor card"
        >
          <!-- Exercise header -->
          <div class="ex-header">
            <div>
              <div class="ex-name">{{ getExerciseName(pe.exerciseId) }}</div>
              <div class="text-xs text-muted">{{ CATEGORY_LABELS[getExerciseById(pe.exerciseId)?.category ?? ''] }}</div>
            </div>
            <div class="ex-controls">
              <button v-if="idx > 0" class="btn btn-ghost btn-icon" style="font-size:0.875rem" @click="moveUp(idx)">↑</button>
              <button v-if="idx < plan.exercises.length - 1" class="btn btn-ghost btn-icon" style="font-size:0.875rem" @click="moveDown(idx)">↓</button>
              <button class="btn btn-ghost btn-icon" style="color: var(--danger)" @click="removeExercise(idx)">✕</button>
            </div>
          </div>

          <!-- Sets header -->
          <div class="sets-labels">
            <span style="width:22px" />
            <span class="set-col-label">Target weight (kg)</span>
            <span class="set-col-label">Target reps</span>
            <span style="width:28px" />
          </div>

          <!-- Set rows -->
          <div class="planned-sets">
            <div
              v-for="(set, si) in pe.sets"
              :key="si"
              class="planned-set-row"
            >
              <span class="set-num-label">{{ si + 1 }}</span>
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
              <button class="btn btn-ghost btn-icon" style="color: var(--text-dim); font-size:0.875rem" @click="removeSet(pe, si)">✕</button>
            </div>
          </div>

          <!-- Add set -->
          <button class="btn btn-ghost btn-sm add-set-btn" @click="addSet(pe)">+ Add Set</button>

          <!-- Notes -->
          <input
            v-model="pe.notes"
            class="input"
            style="margin-top: 8px; font-size:0.875rem"
            placeholder="Notes for this exercise (optional)"
          />
        </div>
      </div>

      <!-- Save button at bottom -->
      <button
        v-if="plan.exercises.length > 0"
        class="btn btn-primary btn-full mt-16"
        :disabled="!plan.name.trim()"
        @click="save"
      >
        {{ isNew ? 'Create Plan' : 'Save Changes' }}
      </button>
    </div>
  </main>

  <ExerciseSelector v-model="showSelector" @select="addExercise" />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { nanoid } from '../utils/nanoid'
import { getExerciseById, getExerciseName, CATEGORY_LABELS } from '../data/exercises'
import type { Exercise, PlanExercise, PlannedSet, PlanGoal, PlanDifficulty } from '../types'

const GOALS: { value: PlanGoal; label: string; icon: string }[] = [
  { value: 'strength',    label: 'Strength',    icon: '🏋️' },
  { value: 'hypertrophy', label: 'Hypertrophy', icon: '💪' },
  { value: 'endurance',   label: 'Endurance',   icon: '🏃' },
  { value: 'fat-loss',    label: 'Fat Loss',    icon: '🔥' },
  { value: 'mobility',    label: 'Mobility',    icon: '🧘' },
  { value: 'general',     label: 'General',     icon: '⭐' },
]

const DIFFICULTIES: { value: PlanDifficulty; label: string; icon: string }[] = [
  { value: 'beginner',     label: 'Beginner',     icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', icon: '🔵' },
  { value: 'advanced',     label: 'Advanced',     icon: '🔴' },
]

const DURATIONS = [
  { value: 30,  label: '30m' },
  { value: 45,  label: '45m' },
  { value: 60,  label: '60m' },
  { value: 90,  label: '90m+' },
]
import ExerciseSelector from '../components/ExerciseSelector.vue'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const store = useWorkoutsStore()

const isNew = !props.id
const showSelector = ref(false)

const plan = reactive(
  props.id ? JSON.parse(JSON.stringify(store.getPlan(props.id) ?? store.createEmptyPlan()))
           : store.createEmptyPlan()
)

onMounted(() => {
  if (props.id && !store.getPlan(props.id)) {
    router.replace({ name: 'plans' })
  }
})

function addExercise(ex: Exercise) {
  const pe: PlanExercise = {
    uid: nanoid(),
    exerciseId: ex.id,
    sets: [{ targetReps: 10, targetWeight: 0 }],
    notes: '',
  }
  plan.exercises.push(pe)
}

function removeExercise(idx: number) {
  plan.exercises.splice(idx, 1)
}

function addSet(pe: PlanExercise) {
  const last = pe.sets.at(-1)
  const newSet: PlannedSet = {
    targetReps: last?.targetReps ?? 10,
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
.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.edit-header h1 { font-size: 1.25rem; }

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exercise-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ex-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.ex-name {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 2px;
}

.ex-controls {
  display: flex;
  gap: 0;
  margin-top: -4px;
}

.sets-labels {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
}

.set-col-label {
  flex: 1;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

.planned-sets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.planned-set-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.set-num-label {
  width: 22px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.plan-input {
  flex: 1;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.9375rem;
  font-weight: 600;
  padding: 8px 10px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
}
.plan-input:focus { border-color: var(--primary); }
.plan-input::placeholder { color: var(--text-dim); }
.plan-input::-webkit-inner-spin-button,
.plan-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.plan-input[type=number] { -moz-appearance: textfield; }

.add-set-btn {
  align-self: flex-start;
  color: var(--primary);
  padding: 4px 8px;
  font-size: 0.875rem;
}

/* ── Goal & schedule section ─────────────────────── */
.goal-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.schedule-row {
  display: flex;
  gap: 16px;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 2px;
}

.goal-pill {
  padding: 6px 13px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.goal-pill:active { transform: scale(0.96); }

.goal-pill.active {
  background: var(--primary-dim);
  border-color: var(--primary);
  color: var(--primary);
}

/* Difficulty colours override primary when active */
.goal-pill.diff-beginner.active    { background: rgba(167,139,250,0.12); border-color: var(--accent); color: var(--accent); }
.goal-pill.diff-intermediate.active { background: rgba(56,189,248,0.12);  border-color: var(--primary); color: var(--primary); }
.goal-pill.diff-advanced.active    { background: rgba(251,146,60,0.12);  border-color: var(--warm);   color: var(--warm); }

.num-pill {
  width: 36px;
  padding: 6px 0;
  text-align: center;
}
</style>
