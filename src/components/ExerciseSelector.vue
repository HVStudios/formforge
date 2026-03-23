<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="overlay" @click.self="emit('update:modelValue', false)" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="modelValue" class="sheet">
        <div class="sheet-handle" />
        <div class="sheet-header">
          <div class="flex items-center justify-between mb-12">
            <h2>Add Exercise</h2>
            <button class="btn btn-ghost btn-icon" @click="emit('update:modelValue', false)">✕</button>
          </div>
          <input
            v-model="search"
            class="input"
            placeholder="Search exercises..."
            type="search"
            autofocus
          />
          <div class="category-tabs">
            <button
              v-for="cat in allCategories"
              :key="cat.value"
              class="cat-tab"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectedCategory = cat.value"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>
        <div class="sheet-body">
          <div v-if="filtered.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No exercises found</p>
          </div>
          <button
            v-for="ex in filtered"
            :key="ex.id"
            class="exercise-row"
            @click="select(ex)"
          >
            <div>
              <div class="exercise-name">{{ ex.name }}</div>
              <div class="exercise-meta text-xs text-muted">
                {{ CATEGORY_LABELS[ex.category] }} · {{ ex.equipment }}
              </div>
            </div>
            <span class="add-icon">+</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { EXERCISES, CATEGORY_LABELS } from '../data/exercises'
import type { Exercise } from '../types'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [exercise: Exercise]
}>()

const search = ref('')
const selectedCategory = ref('all')

const allCategories = [
  { value: 'all', label: 'All' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'legs', label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
]

const filtered = computed(() => {
  let list = EXERCISES
  if (selectedCategory.value !== 'all') {
    list = list.filter(e => e.category === selectedCategory.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }
  return list
})

function select(ex: Exercise) {
  emit('select', ex)
  emit('update:modelValue', false)
  search.value = ''
  selectedCategory.value = 'all'
}
</script>

<style scoped>
.category-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-top: 12px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.category-tabs::-webkit-scrollbar { display: none; }

.cat-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-tab.active {
  background: var(--primary-dim);
  border-color: var(--primary);
  color: var(--primary);
}

.exercise-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 0;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  border-radius: var(--radius-sm);
  padding-inline: 4px;
}
.exercise-row:last-child { border-bottom: none; }
.exercise-row:active { background: var(--card); }

.exercise-name {
  font-size: 0.9375rem;
  font-weight: 500;
}

.add-icon {
  font-size: 1.25rem;
  color: var(--primary);
  font-weight: 700;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}
</style>
