<template>
  <div class="set-row" :class="{ completed: set.completed }">
    <span class="set-num">{{ number }}</span>
    <div class="set-inputs">
      <div class="input-group">
        <input
          :value="set.weight ?? ''"
          type="number"
          inputmode="decimal"
          placeholder="—"
          class="set-input"
          :disabled="set.completed"
          @input="updateWeight(($event.target as HTMLInputElement).value)"
        />
        <span class="input-unit">kg</span>
      </div>
      <div class="input-group">
        <input
          :value="set.reps ?? ''"
          type="number"
          inputmode="numeric"
          placeholder="—"
          class="set-input"
          :disabled="set.completed"
          @input="updateReps(($event.target as HTMLInputElement).value)"
        />
        <span class="input-unit">reps</span>
      </div>
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

function updateWeight(val: string) {
  emit('update:set', { ...props.set, weight: val === '' ? null : Number(val) })
}

function updateReps(val: string) {
  emit('update:set', { ...props.set, reps: val === '' ? null : Number(val) })
}

function toggleComplete() {
  emit('update:set', { ...props.set, completed: !props.set.completed })
}
</script>

<style scoped>
.set-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  transition: opacity 0.2s;
}

.set-row.completed {
  opacity: 0.5;
}

.set-num {
  width: 22px;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.set-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

.input-group {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: border-color 0.15s;
}
.input-group:focus-within {
  border-color: var(--primary);
}

.set-input {
  width: 0;
  flex: 1;
  background: none;
  border: none;
  color: var(--text);
  font-size: 0.9375rem;
  font-weight: 600;
  padding: 8px 8px;
  outline: none;
  text-align: right;
  min-width: 0;
}
.set-input:disabled {
  color: var(--text-muted);
}
.set-input::placeholder { color: var(--text-dim); }

/* Hide number input spinners */
.set-input::-webkit-inner-spin-button,
.set-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.set-input[type=number] { -moz-appearance: textfield; }

.input-unit {
  font-size: 0.6875rem;
  color: var(--text-dim);
  padding: 0 6px;
  flex-shrink: 0;
}

.complete-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.complete-btn svg { width: 16px; height: 16px; }
.complete-btn:active { transform: scale(0.9); }

.complete-btn.done {
  background: var(--primary);
  border-color: var(--primary);
  color: #0d0d0d;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}
.delete-btn svg { width: 14px; height: 14px; }
.delete-btn:active { color: var(--danger); border-color: var(--danger); }

.delete-spacer {
  width: 28px;
  flex-shrink: 0;
}
</style>
