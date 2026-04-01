<template>
  <main class="page">
    <div v-if="!store.activeWorkout" class="page-inner">
      <div class="page-header"><h1>Workout</h1></div>

      <!-- Start from a plan -->
      <div class="start-section">
        <h2 class="start-label">From a plan</h2>
        <RouterLink to="/plans" class="btn btn-primary btn-full">Browse Plans</RouterLink>
      </div>

      <div class="divider-row"><span class="divider-text">or</span></div>

      <!-- Quick log / custom activity -->
      <div class="start-section">
        <h2 class="start-label">Log any activity</h2>
        <p class="text-sm text-muted mb-10">Bouldering, swimming, a run — anything you want to track.</p>
        <input
          v-model="customName"
          class="input"
          placeholder="Activity name (e.g. Bouldering)"
          maxlength="60"
          @keydown.enter="startCustom"
        />
        <button
          class="btn btn-outline btn-full mt-10"
          :disabled="!customName.trim()"
          @click="startCustom"
        >
          Start Logging
        </button>
      </div>
    </div>

    <div v-else class="page-inner">
      <!-- Workout header -->
      <div class="workout-header">
        <div>
          <p class="text-xs text-muted">In progress</p>
          <h1 class="workout-title">{{ store.activeWorkout.planName }}</h1>
        </div>
        <div class="header-right">
          <button
            class="rest-toggle"
            :class="{ 'rest-toggle-off': !restEnabled }"
            @click="restEnabled = !restEnabled"
            :title="restEnabled ? 'Rest timer on — tap to disable' : 'Rest timer off — tap to enable'"
          >⏸ Rest</button>
          <div class="timer-badge">
            <span class="timer-icon">⏱</span>
            <span class="timer-label">{{ elapsedLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPct + '%' }" />
        </div>
        <span class="progress-text text-xs text-muted">{{ completedSets }} / {{ totalSets }} sets</span>
      </div>

      <!-- Exercise list -->
      <div class="exercise-list">
        <div
          v-for="(ex, exIdx) in workout.exercises"
          :key="ex.uid"
          class="exercise-block card"
          :class="{ 'ex-done': isExerciseDone(ex) }"
        >
          <!-- Exercise header (toggle collapse) -->
          <button class="ex-toggle" @click="toggleExpand(exIdx)">
            <div class="ex-toggle-left">
              <span class="ex-status-icon">{{ isExerciseDone(ex) ? '✅' : '○' }}</span>
              <div>
                <div class="ex-name">{{ ex.exerciseName }}</div>
                <div class="text-xs text-muted">{{ ex.sets.length }} sets · {{ completedCount(ex) }} done</div>
              </div>
            </div>
            <span class="chevron" :class="{ open: expandedMap[exIdx] }">›</span>
          </button>

          <!-- Sets (collapsible) -->
          <Transition name="expand">
            <div v-if="expandedMap[exIdx]" class="sets-section">
              <div class="divider" />
              <div class="sets-header">
                <span class="set-col-hdr">Set</span>
                <span class="set-col-hdr">kg</span>
                <span class="set-col-hdr">Reps</span>
                <span style="width:38px" />
                <span style="width:26px" />
              </div>
              <SetRow
                v-for="(set, si) in ex.sets"
                :key="si"
                :ref="(el) => setRowRef(el, exIdx, si)"
                :set="set"
                :number="si + 1"
                :canDelete="ex.sets.length > 1"
                @update:set="updateSet(exIdx, si, $event)"
                @delete="removeSet(exIdx, si)"
              />
              <button class="btn btn-ghost btn-sm add-set-btn" @click="addSet(exIdx)">
                {{ canRepeat(ex) ? '＋ Repeat last set' : '＋ Add set' }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Add exercise -->
      <button class="btn btn-outline btn-full mt-12" @click="showSelector = true">+ Add Exercise</button>

      <!-- Finish / Discard -->
      <div class="workout-footer">
        <button class="btn btn-primary btn-full" @click="finish">Finish Workout</button>
        <button class="btn btn-ghost btn-full" style="color: var(--danger)" @click="discard">Discard Workout</button>
      </div>
    </div>
  </main>

  <ExerciseSelector v-model="showSelector" @select="addExercise" />

  <!-- Rest timer (fixed above bottom nav) -->
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="restLeft > 0" class="rest-banner">
        <div class="rest-info">
          <span class="rest-label">Rest</span>
          <span class="rest-countdown" :class="{ 'rest-urgent': restLeft <= 10 }">
            {{ formatDuration(restLeft) }}
          </span>
        </div>
        <div class="rest-presets">
          <button
            v-for="s in REST_OPTIONS" :key="s"
            class="rest-preset" :class="{ active: restTarget === s }"
            @click="setRestDuration(s)"
          >{{ restLabel(s) }}</button>
        </div>
        <button class="rest-dismiss" @click="stopRest">✕</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDuration } from '../utils/format'
import { nanoid } from '../utils/nanoid'
import type { WorkoutLog, LoggedExercise, LoggedSet, Exercise } from '../types'
import SetRow from '../components/SetRow.vue'
import ExerciseSelector from '../components/ExerciseSelector.vue'

const store = useWorkoutsStore()
const router = useRouter()

// ── Custom workout start ─────────────────────────────────────────────────────
const customName = ref('')
function startCustom() {
  const name = customName.value.trim()
  if (!name) return
  store.startEmptyWorkout(name)
  // Template reacts automatically when store.activeWorkout is set
}

// Local mutable copy of the active workout
const workout = reactive<WorkoutLog>(
  JSON.parse(JSON.stringify(store.activeWorkout ?? {
    id: '', planId: null, planName: '', startedAt: new Date().toISOString(),
    completedAt: null, exercises: [], notes: ''
  }))
)

// Keep store in sync — only when there is a real active workout (not the placeholder)
watch(workout, (val) => {
  if (store.activeWorkout) store.updateActiveWorkout({ ...val })
}, { deep: true })

// Sync if store changes externally (e.g. another tab)
watch(() => store.activeWorkout, (val) => {
  if (!val) return
  // Only sync if IDs match (don't overwrite local edits)
}, { deep: false })

// Expand state
const expandedMap = reactive<Record<number, boolean>>({})
onMounted(() => {
  // Expand first incomplete exercise by default
  const firstIncomplete = workout.exercises.findIndex(ex => !isExerciseDone(ex))
  if (firstIncomplete !== -1) expandedMap[firstIncomplete] = true
  else if (workout.exercises.length > 0) expandedMap[0] = true
})

function toggleExpand(idx: number) {
  expandedMap[idx] = !expandedMap[idx]
}

// Elapsed workout timer
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => { clearInterval(timer); stopRest() })

// ── Rest timer ────────────────────────────────────────────────────────────────
const restEnabled = ref(localStorage.getItem('ff_rest_enabled') !== 'false')
watch(restEnabled, v => localStorage.setItem('ff_rest_enabled', String(v)))

const REST_OPTIONS = [60, 90, 120, 180] as const
type RestOption = typeof REST_OPTIONS[number]
const restTarget = ref<RestOption>(90)
const restLeft   = ref(0)
let restInterval: ReturnType<typeof setInterval> | null = null

function restLabel(s: number) {
  if (s < 60) return `${s}s`
  if (s % 60 === 0) return `${s / 60}m`
  return `${s}s`
}

function startRest() {
  if (restInterval) clearInterval(restInterval)
  restLeft.value = restTarget.value
  restInterval = setInterval(() => {
    restLeft.value--
    if (restLeft.value <= 0) {
      clearInterval(restInterval!)
      restInterval = null
      navigator.vibrate?.([200, 100, 200, 100, 200])
    }
  }, 1000)
}

function stopRest() {
  if (restInterval) { clearInterval(restInterval); restInterval = null }
  restLeft.value = 0
}

function setRestDuration(s: RestOption) {
  restTarget.value = s
  startRest()
}

const elapsedLabel = computed(() => {
  if (!store.activeWorkout) return '00:00'
  const secs = Math.floor((now.value - new Date(store.activeWorkout.startedAt).getTime()) / 1000)
  return formatDuration(secs)
})

// Progress
const totalSets = computed(() => workout.exercises.reduce((s, ex) => s + ex.sets.length, 0))
const completedSets = computed(() => workout.exercises.reduce((s, ex) => s + ex.sets.filter(set => set.completed).length, 0))
const progressPct = computed(() => totalSets.value === 0 ? 0 : Math.round((completedSets.value / totalSets.value) * 100))

function isExerciseDone(ex: LoggedExercise) {
  return ex.sets.length > 0 && ex.sets.every(s => s.completed)
}

function completedCount(ex: LoggedExercise) {
  return ex.sets.filter(s => s.completed).length
}

function canRepeat(ex: LoggedExercise): boolean {
  const last = ex.sets.at(-1)
  return !!last && (last.weight !== null || last.reps !== null)
}

// Mutations
function updateSet(exIdx: number, setIdx: number, newSet: LoggedSet) {
  const wasCompleted = workout.exercises[exIdx].sets[setIdx].completed
  workout.exercises[exIdx].sets[setIdx] = newSet
  if (newSet.completed && !wasCompleted) {
    if (restEnabled.value) startRest()
    focusNextSet(exIdx, setIdx)
  }
}

function removeSet(exIdx: number, setIdx: number) {
  workout.exercises[exIdx].sets.splice(setIdx, 1)
}

function addSet(exIdx: number) {
  const ex = workout.exercises[exIdx]
  const last = ex.sets.at(-1)
  ex.sets.push({
    reps: last?.reps ?? null,
    weight: last?.weight ?? null,
    completed: false,
  })
}

// ── SetRow refs for auto-focus ────────────────────────────────────────────────
const setRowRefs = ref<Record<string, InstanceType<typeof SetRow>>>({})

function setRowRef(el: unknown, exIdx: number, setIdx: number) {
  if (el) setRowRefs.value[`${exIdx}-${setIdx}`] = el as InstanceType<typeof SetRow>
}

function focusNextSet(exIdx: number, setIdx: number) {
  const ex = workout.exercises[exIdx]
  // Next set in same exercise
  for (let si = setIdx + 1; si < ex.sets.length; si++) {
    if (!ex.sets[si].completed) {
      nextTick(() => setRowRefs.value[`${exIdx}-${si}`]?.focusWeight())
      return
    }
  }
  // First incomplete set of the next exercises
  for (let ei = exIdx + 1; ei < workout.exercises.length; ei++) {
    const nextEx = workout.exercises[ei]
    const firstIncomplete = nextEx.sets.findIndex(s => !s.completed)
    if (firstIncomplete !== -1) {
      expandedMap[exIdx] = false
      expandedMap[ei] = true
      nextTick(() => setRowRefs.value[`${ei}-${firstIncomplete}`]?.focusWeight())
      return
    }
  }
}

const showSelector = ref(false)
function addExercise(ex: Exercise) {
  const logged: LoggedExercise = {
    uid: nanoid(),
    exerciseId: ex.id,
    exerciseName: ex.name,
    notes: '',
    sets: [{ reps: null, weight: null, completed: false }],
  }
  workout.exercises.push(logged)
  const idx = workout.exercises.length - 1
  expandedMap[idx] = true
}

function finish() {
  if (!confirm('Finish this workout and save it?')) return
  store.finishWorkout()
  router.replace({ name: 'history' })
}

function discard() {
  if (!confirm('Discard this workout? All progress will be lost.')) return
  store.discardWorkout()
  router.replace({ name: 'home' })
}
</script>

<style scoped>
/* ── Start screen ────────────────────────────────────────────────────────── */
.start-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 4px;
}

.start-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
}
.divider-row::before,
.divider-row::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.mb-10 { margin-bottom: 10px; }
.mt-10 { margin-top: 10px; }

/* ── Workout header ──────────────────────────────────────────────────────── */
.workout-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.workout-title {
  font-size: 1.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rest-toggle {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 100px;
  border: 1px solid var(--primary);
  background: var(--primary-dim);
  color: var(--primary);
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.rest-toggle-off {
  border-color: var(--border);
  background: transparent;
  color: var(--text-dim);
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 6px 14px;
  flex-shrink: 0;
}
.timer-icon { font-size: 0.875rem; }
.timer-label {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: var(--primary);
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-text { flex-shrink: 0; }

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exercise-block {
  padding: 0;
  overflow: hidden;
  transition: border-color 0.2s;
}
.exercise-block.ex-done {
  border-color: var(--primary-dark);
  background: rgba(34, 197, 94, 0.04);
}

.ex-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 14px 16px;
  text-align: left;
}

.ex-toggle-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ex-status-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.ex-name {
  font-weight: 700;
  font-size: 0.9375rem;
}

.chevron {
  font-size: 1.25rem;
  color: var(--text-muted);
  transition: transform 0.2s;
  transform: rotate(0deg);
}
.chevron.open { transform: rotate(90deg); }

.sets-section {
  padding: 0 16px 14px;
}

.sets-header {
  display: flex;
  gap: 10px;
  padding: 4px 0 6px;
}
.set-col-hdr {
  flex: 1;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}
.sets-header span:first-child { width: 22px; flex: none; text-align: center; }

.add-set-btn {
  color: var(--primary);
  padding: 6px 4px;
  font-size: 0.875rem;
  margin-top: 4px;
}

.workout-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

/* Expand transition */
.expand-enter-active, .expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Rest timer banner ───────────────────────────────────────────────────── */
.rest-banner {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom) + 10px);
  left: 16px;
  right: 16px;
  background: var(--surface);
  border: 1.5px solid var(--primary);
  border-radius: var(--radius);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 49;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.rest-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rest-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rest-countdown {
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary);
  min-width: 48px;
  transition: color 0.2s;
}
.rest-countdown.rest-urgent { color: var(--danger); }

.rest-presets {
  display: flex;
  gap: 5px;
  flex: 1;
  justify-content: flex-end;
}

.rest-preset {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.rest-preset.active {
  border-color: var(--primary);
  color: var(--primary);
}

.rest-dismiss {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  line-height: 1;
}
</style>
