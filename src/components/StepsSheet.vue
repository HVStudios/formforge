<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="overlay" @click.self="close" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="modelValue" class="sheet">
        <div class="sheet-handle" />
        <div class="sheet-header">
          <div class="steps-header-row">
            <div>
              <div class="steps-log-label">LOG</div>
              <div class="steps-header-title">Daily steps</div>
            </div>
            <button class="close-x" @click="close">×</button>
          </div>
        </div>

        <div class="sheet-body">
          <!-- Big numeric display with accent border + glow -->
          <div class="steps-display" :class="{ focused: inputFocused }">
            <div class="steps-display-date mono">{{ displayDate }}</div>
            <input
              v-model.number="stepCount"
              type="number"
              inputmode="numeric"
              class="steps-big-input"
              min="0"
              max="100000"
              placeholder="0"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
            />
            <div class="steps-display-goal mono">STEPS · GOAL 10,000</div>
            <div class="steps-goal-bar">
              <div class="steps-goal-fill" :style="{ width: Math.min(goalPct, 100) + '%' }" />
            </div>
          </div>

          <!-- Date selector row -->
          <div class="date-tabs">
            <button
              v-for="d in dateOptions"
              :key="d.value"
              class="date-tab"
              :class="{ active: selectedDate === d.value }"
              @click="selectDate(d.value)"
            >{{ d.label }}</button>
            <input
              type="date"
              class="date-custom"
              :max="today"
              :value="isCustomDate ? selectedDate : ''"
              @change="selectDate(($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Adjust buttons -->
          <div class="steps-adj-row">
            <button class="steps-adj" @click="adjustSteps(-1000)">−1k</button>
            <button class="steps-adj" @click="adjustSteps(-100)">−100</button>
            <button class="steps-adj steps-adj-spacer" disabled />
            <button class="steps-adj" @click="adjustSteps(100)">+100</button>
            <button class="steps-adj" @click="adjustSteps(1000)">+1k</button>
          </div>

          <!-- Save CTA -->
          <button class="steps-cta" @click="save" :disabled="!stepCount || stepCount < 0">
            Save · +{{ xpPreview }} XP
          </button>

          <!-- Recent entries -->
          <div v-if="recentEntries.length > 0">
            <div class="recent-label">RECENT</div>
            <div class="recent-list">
              <div v-for="r in recentEntries" :key="r.date" class="recent-row">
                <div class="recent-date mono">{{ r.label }}</div>
                <div class="recent-right">
                  <div class="recent-steps">{{ r.steps.toLocaleString() }}</div>
                  <span v-if="r.steps >= 10000" class="goal-chip">GOAL ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWorkoutsStore } from '../stores/workouts'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useWorkoutsStore()

const today = new Date().toISOString().slice(0, 10)

function formatDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function dayLabel(d: Date) {
  const t = new Date()
  const diff = Math.round((t.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'YESTERDAY'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

const dateOptions = computed(() =>
  Array.from({ length: 4 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return { value: formatDateStr(d), label: dayLabel(d) }
  })
)

const selectedDate  = ref(today)
const stepCount     = ref(0)
const inputFocused  = ref(false)

const isCustomDate = computed(() => !dateOptions.value.find(d => d.value === selectedDate.value))
const goalPct      = computed(() => Math.min((stepCount.value / 10000) * 100, 100))
const xpPreview    = computed(() => Math.min(Math.round((stepCount.value || 0) / 800), 12))

const displayDate = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00')
  const diff = Math.round((new Date().setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return `TODAY · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`
  if (diff === 1) return 'YESTERDAY'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
})

const recentEntries = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i - 1)
    const dateStr = formatDateStr(d)
    const steps = store.getStepsForDate(dateStr)
    return { date: dateStr, steps, label: dayLabel(d) }
  }).filter(e => e.steps > 0).slice(0, 3)
)

function selectDate(date: string) {
  if (!date) return
  selectedDate.value = date
  stepCount.value = store.getStepsForDate(date)
}

function adjustSteps(delta: number) {
  stepCount.value = Math.max(0, (stepCount.value || 0) + delta)
}

function save() {
  if (!stepCount.value || stepCount.value < 0) return
  store.logSteps(selectedDate.value, stepCount.value)
  close()
}

function close() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (open) => {
  if (open) {
    selectedDate.value = today
    stepCount.value = store.getStepsForDate(today)
    inputFocused.value = false
  }
})
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────── */
.steps-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.steps-log-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
}

.steps-header-title {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 2px;
}

.close-x {
  background: none;
  border: none;
  font-size: 1.375rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

/* ── Big numeric display ─────────────────────────────────── */
.steps-display {
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 16px 18px;
  text-align: right;
  margin-bottom: 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.steps-display.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 13%, transparent);
}

.steps-display-date {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-align: left;
}

.steps-big-input {
  width: 100%;
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  text-align: right;
  color: var(--text);
  margin-top: 8px;
  padding: 0;
}
.steps-big-input::placeholder { color: var(--text-muted); }
.steps-big-input::-webkit-inner-spin-button,
.steps-big-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.steps-big-input[type=number] { -moz-appearance: textfield; }

.steps-display-goal {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  margin-top: 6px;
  text-align: left;
}

.steps-goal-bar {
  margin-top: 10px;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.steps-goal-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* ── Date tabs ───────────────────────────────────────────── */
.date-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;
}

.date-tab {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.date-tab.active {
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.date-custom {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 6px 12px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}
.date-custom::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
  cursor: pointer;
}

/* ── Adjust row ──────────────────────────────────────────── */
.steps-adj-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}

.steps-adj {
  flex: 1;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}
.steps-adj:active { background: color-mix(in srgb, var(--accent) 13%, transparent); border-color: var(--accent); color: var(--accent); }
.steps-adj-spacer { flex: 0.5; visibility: hidden; border: none; background: none; }

/* ── Save CTA ────────────────────────────────────────────── */
.steps-cta {
  width: 100%;
  background: var(--accent);
  color: var(--accent-ink);
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  margin-bottom: 20px;
  transition: opacity 0.15s;
}
.steps-cta:disabled { opacity: 0.4; cursor: not-allowed; }
.steps-cta:active:not(:disabled) { opacity: 0.9; }

/* ── Recent log ──────────────────────────────────────────── */
.recent-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.recent-list { display: flex; flex-direction: column; gap: 6px; }

.recent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
}

.recent-date {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

.recent-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-steps {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.goal-chip {
  font-size: 0.5rem;
  font-weight: 800;
  padding: 2px 5px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 3px;
  letter-spacing: 0.08em;
}

.mono { font-family: var(--font-mono); }
</style>
