<template>
  <div class="set-row" :class="{ completed: set.completed }">
    <span class="set-num">{{ number }}</span>

    <!-- Weight input -->
    <div class="input-group" :class="{ focused: weightFocused }">
      <button class="adj-btn" :disabled="set.completed" @click.prevent="adjustWeight(-2.5)" tabindex="-1">−</button>
      <input
        ref="weightRef"
        :value="set.weight ?? ''"
        type="number"
        inputmode="decimal"
        placeholder="kg"
        class="set-input"
        :disabled="set.completed"
        @focus="weightFocused = true"
        @blur="weightFocused = false"
        @input="updateWeight(($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="focusReps"
      />
      <button class="adj-btn" :disabled="set.completed" @click.prevent="adjustWeight(2.5)" tabindex="-1">+</button>
    </div>

    <!-- Reps input -->
    <div class="input-group" :class="{ focused: repsFocused }">
      <button class="adj-btn" :disabled="set.completed" @click.prevent="adjustReps(-1)" tabindex="-1">−</button>
      <input
        ref="repsRef"
        :value="set.reps ?? ''"
        type="number"
        inputmode="numeric"
        placeholder="reps"
        class="set-input"
        :disabled="set.completed"
        @focus="repsFocused = true"
        @blur="repsFocused = false"
        @input="updateReps(($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="complete"
      />
      <button class="adj-btn" :disabled="set.completed" @click.prevent="adjustReps(1)" tabindex="-1">+</button>
    </div>

    <button class="complete-btn" :class="{ done: set.completed }" @click="toggleComplete">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </button>

    <button v-if="canDelete" class="delete-btn" @click="emit('delete')" title="Remove set">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
    <span v-else class="delete-spacer" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { LoggedSet } from '../types'

const props = defineProps<{
  set: LoggedSet
  number: number
  canDelete?: boolean
}>()

const emit = defineEmits<{
  'update:set': [set: LoggedSet]
  'delete': []
}>()

const weightRef    = ref<HTMLInputElement | null>(null)
const repsRef      = ref<HTMLInputElement | null>(null)
const weightFocused = ref(false)
const repsFocused   = ref(false)

// ── Exposed for parent auto-focus ─────────────────────────────────────────────
function focusWeight() {
  weightRef.value?.focus()
  weightRef.value?.select()
}
function focusReps() {
  repsRef.value?.focus()
  repsRef.value?.select()
}
defineExpose({ focusWeight, focusReps })

// ── Mutations ─────────────────────────────────────────────────────────────────
function updateWeight(val: string) {
  emit('update:set', { ...props.set, weight: val === '' ? null : Number(val) })
}

function updateReps(val: string) {
  emit('update:set', { ...props.set, reps: val === '' ? null : Number(val) })
}

function adjustWeight(delta: number) {
  const current = props.set.weight ?? 0
  const next = Math.max(0, Math.round((current + delta) * 4) / 4) // snap to 0.25 kg
  emit('update:set', { ...props.set, weight: next })
}

function adjustReps(delta: number) {
  const current = props.set.reps ?? 0
  const next = Math.max(1, current + delta)
  emit('update:set', { ...props.set, reps: next })
}

function complete() {
  if (!props.set.completed) {
    emit('update:set', { ...props.set, completed: true })
  }
}

function toggleComplete() {
  emit('update:set', { ...props.set, completed: !props.set.completed })
}
</script>

<style scoped>
.set-row {
  display: grid;
  grid-template-columns: 28px 1fr 1fr 36px;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  transition: background 0.15s;
}

.set-row:first-child { border-top: none; }

.set-row.completed {
  background: rgba(212, 255, 58, 0.04);
}

.set-row.completed .set-input,
.set-row.completed .set-num {
  opacity: 0.4;
}

.set-num {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-muted);
  text-align: center;
  flex-shrink: 0;
}

.set-row.completed .set-num {
  color: var(--accent);
}

/* ── Input group ─────────────────────────────────── */
.input-group {
  display: flex;
  align-items: stretch;
  background: var(--surface-2);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.input-group.focused {
  border-color: var(--accent);
}

.adj-btn {
  width: 26px;
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.12s, background 0.12s;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.adj-btn:active:not(:disabled) {
  background: var(--border);
  color: var(--accent);
}

.adj-btn:disabled { opacity: 0.2; cursor: default; }

.adj-btn:first-child { border-right: 1px solid var(--border); }
.adj-btn:last-child  { border-left:  1px solid var(--border); }

.set-input {
  width: 0;
  flex: 1;
  background: none;
  border: none;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 700;
  padding: 9px 4px;
  outline: none;
  text-align: center;
  min-width: 0;
}

.set-input:disabled { color: var(--text-muted); }
.set-input::placeholder { color: var(--text-faint); font-weight: 500; }

.set-input::-webkit-inner-spin-button,
.set-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.set-input[type=number] { -moz-appearance: textfield; }

/* ── Complete button ─────────────────────────────── */
.complete-btn {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.complete-btn svg { width: 15px; height: 15px; }
.complete-btn:active { transform: scale(0.88); }

.complete-btn.done {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

/* ── Delete button ───────────────────────────────── */
.delete-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}
.delete-btn svg { width: 12px; height: 12px; }
.delete-btn:active { color: var(--danger); border-color: var(--danger); }

.delete-spacer { width: 24px; flex-shrink: 0; }
</style>
