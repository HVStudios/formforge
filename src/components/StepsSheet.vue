<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="overlay" @click.self="close" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="modelValue" class="sheet">
        <div class="sheet-handle" />
        <div class="sheet-header">
          <div class="flex items-center justify-between mb-12">
            <h2>Log Steps</h2>
            <button class="btn btn-ghost btn-icon" @click="close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="sheet-body">
          <!-- Date selector -->
          <div class="field">
            <label class="label">Date</label>
            <div class="date-tabs">
              <button
                v-for="d in dateOptions"
                :key="d.value"
                class="date-tab"
                :class="{ active: selectedDate === d.value }"
                @click="selectDate(d.value)"
              >
                {{ d.label }}
              </button>
              <input
                type="date"
                class="date-custom"
                :max="today"
                :value="isCustomDate ? selectedDate : ''"
                @change="selectDate(($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Steps input -->
          <div class="field">
            <label class="label">Steps</label>
            <div class="steps-input-wrap">
              <button class="steps-adj" @click="adjustSteps(-1000)">−1k</button>
              <button class="steps-adj" @click="adjustSteps(-100)">−100</button>
              <input
                v-model.number="stepCount"
                type="number"
                inputmode="numeric"
                class="steps-input"
                min="0"
                max="100000"
                placeholder="0"
              />
              <button class="steps-adj" @click="adjustSteps(100)">+100</button>
              <button class="steps-adj" @click="adjustSteps(1000)">+1k</button>
            </div>
          </div>

          <!-- Goal ring -->
          <div class="goal-row">
            <div class="goal-bar">
              <div class="goal-fill" :style="{ width: Math.min(goalPct, 100) + '%' }" />
            </div>
            <span class="goal-label">{{ Math.round(goalPct) }}% of 10,000 goal</span>
          </div>

          <!-- Quick presets -->
          <div class="presets">
            <button v-for="p in presets" :key="p" class="preset-btn" @click="stepCount = p">
              {{ p.toLocaleString() }}
            </button>
          </div>

          <button class="btn btn-primary btn-full" style="margin-top: 20px" @click="save" :disabled="!stepCount || stepCount < 0">
            Save Steps
          </button>
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

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function dayLabel(d: Date) {
  const t = new Date()
  const diff = Math.round((t.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const dateOptions = computed(() => {
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return { value: formatDate(d), label: dayLabel(new Date(d)) }
  })
})

const selectedDate = ref(today)
const stepCount = ref(0)
const presets = [3000, 5000, 7500, 10000, 12500, 15000]

const isCustomDate = computed(() => !dateOptions.value.find(d => d.value === selectedDate.value))
const goalPct = computed(() => (stepCount.value / 10000) * 100)

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

// Reset when opened
watch(() => props.modelValue, (open) => {
  if (open) {
    selectedDate.value = today
    stepCount.value = store.getStepsForDate(today)
  }
})
</script>

<style scoped>
.date-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.date-tab {
  padding: 8px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  touch-action: manipulation;
}
.date-tab.active {
  background: var(--primary-dim);
  border-color: var(--primary);
  color: var(--primary);
}

.date-custom {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 100px;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}
.date-custom::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
  cursor: pointer;
}

.steps-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.steps-adj {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  touch-action: manipulation;
  flex-shrink: 0;
}
.steps-adj:active {
  background: var(--card);
  color: var(--text);
}

.steps-input {
  flex: 1;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 800;
  padding: 12px 16px;
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
  min-width: 0;
}
.steps-input:focus { border-color: var(--primary); }
.steps-input::placeholder { color: var(--text-dim); }
.steps-input::-webkit-inner-spin-button,
.steps-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.steps-input[type=number] { -moz-appearance: textfield; }

.goal-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.goal-bar {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.goal-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-dark), var(--primary));
  border-radius: 3px;
  transition: width 0.3s ease;
}
.goal-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.preset-btn {
  padding: 10px 8px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  touch-action: manipulation;
}
.preset-btn:active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}
</style>
