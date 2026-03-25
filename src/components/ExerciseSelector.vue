<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="overlay" @click.self="close" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="modelValue" class="sheet">
        <div class="sheet-handle" />

        <!-- ── Standard header ──────────────────────── -->
        <div v-if="!creatingCustom" class="sheet-header">
          <div class="flex items-center justify-between mb-12">
            <h2>Add Exercise</h2>
            <button class="btn btn-ghost btn-icon" @click="close">✕</button>
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

        <!-- ── Create custom exercise header ──────────── -->
        <div v-else class="sheet-header">
          <div class="flex items-center gap-8 mb-12">
            <button class="btn btn-ghost btn-icon" @click="cancelCreate">←</button>
            <h2>Create Exercise</h2>
          </div>
        </div>

        <!-- ── Exercise list ───────────────────────────── -->
        <div v-if="!creatingCustom" class="sheet-body">
          <div v-if="filtered.length === 0 && !search" class="empty-state">
            <div class="empty-icon">🏋️</div>
            <p>No exercises found</p>
          </div>

          <template v-else>
            <!-- No results: prompt to create -->
            <div v-if="filtered.length === 0" class="no-results">
              <p class="text-muted text-sm">No results for "{{ search }}"</p>
              <button class="btn btn-outline btn-full mt-12" @click="startCreate(search)">
                + Create "{{ search }}" as custom exercise
              </button>
            </div>

            <!-- Exercise rows -->
            <button
              v-for="ex in filtered"
              :key="ex.id"
              class="exercise-row"
              @click="select(ex)"
            >
              <div>
                <div class="exercise-name">
                  {{ ex.name }}
                  <span v-if="ex.custom" class="custom-tag">Custom</span>
                </div>
                <div class="exercise-meta text-xs text-muted">
                  {{ CATEGORY_LABELS[ex.category] }} · {{ ex.equipment }}
                </div>
              </div>
              <span class="add-icon">+</span>
            </button>
          </template>

          <!-- Create custom button at bottom (always visible when list has items) -->
          <button
            v-if="filtered.length > 0"
            class="create-custom-btn"
            @click="startCreate(search)"
          >
            + Create custom exercise
          </button>
        </div>

        <!-- ── Custom exercise creation form ──────────── -->
        <div v-else class="sheet-body create-form">
          <div class="field">
            <label class="label">Exercise name</label>
            <input
              ref="nameInput"
              v-model="customName"
              class="input"
              placeholder="e.g. Bulgarian Split Squat"
              type="text"
            />
          </div>

          <div class="field">
            <label class="label">Category</label>
            <div class="pill-grid">
              <button
                v-for="cat in exerciseCategories"
                :key="cat.value"
                class="pill"
                :class="{ active: customCategory === cat.value }"
                @click="customCategory = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>

          <div class="field">
            <label class="label">Equipment</label>
            <div class="pill-grid">
              <button
                v-for="eq in equipmentOptions"
                :key="eq.value"
                class="pill"
                :class="{ active: customEquipment === eq.value }"
                @click="customEquipment = eq.value"
              >
                {{ eq.label }}
              </button>
            </div>
          </div>

          <button
            class="btn btn-primary btn-full"
            :disabled="!customName.trim()"
            @click="confirmCreate"
          >
            Create &amp; Add
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { EXERCISES, CATEGORY_LABELS } from '../data/exercises'
import { useWorkoutsStore } from '../stores/workouts'
import { nanoid } from '../utils/nanoid'
import type { Exercise, ExerciseCategory, Equipment } from '../types'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [exercise: Exercise]
}>()

const store = useWorkoutsStore()

const search          = ref('')
const selectedCategory = ref('all')
const creatingCustom  = ref(false)
const customName      = ref('')
const customCategory  = ref<ExerciseCategory>('other')
const customEquipment = ref<Equipment>('other')
const nameInput       = ref<HTMLInputElement | null>(null)

const allCategories = [
  { value: 'all',       label: 'All' },
  { value: 'chest',     label: 'Chest' },
  { value: 'back',      label: 'Back' },
  { value: 'legs',      label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms',      label: 'Arms' },
  { value: 'core',      label: 'Core' },
  { value: 'cardio',    label: 'Cardio' },
]

const exerciseCategories = [
  { value: 'chest',     label: 'Chest' },
  { value: 'back',      label: 'Back' },
  { value: 'legs',      label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms',      label: 'Arms' },
  { value: 'core',      label: 'Core' },
  { value: 'cardio',    label: 'Cardio' },
  { value: 'other',     label: 'Other' },
]

const equipmentOptions = [
  { value: 'barbell',    label: 'Barbell' },
  { value: 'dumbbell',   label: 'Dumbbell' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'machine',    label: 'Machine' },
  { value: 'cable',      label: 'Cable' },
  { value: 'other',      label: 'Other' },
]

const allExercises = computed<Exercise[]>(() => [
  ...EXERCISES,
  ...store.customExercises,
])

const filtered = computed(() => {
  let list = allExercises.value
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
  close()
}

function close() {
  emit('update:modelValue', false)
  search.value = ''
  selectedCategory.value = 'all'
  cancelCreate()
}

async function startCreate(prefill = '') {
  customName.value     = prefill.trim()
  customCategory.value = 'other'
  customEquipment.value = 'other'
  creatingCustom.value = true
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

function cancelCreate() {
  creatingCustom.value = false
  customName.value     = ''
}

function confirmCreate() {
  const name = customName.value.trim()
  if (!name) return

  const ex: Exercise = {
    id: `custom-${nanoid()}`,
    name,
    category: customCategory.value,
    equipment: customEquipment.value,
    custom: true,
  }
  store.saveCustomExercise(ex)
  select(ex)
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
  padding: 14px 4px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  border-radius: var(--radius-sm);
}
.exercise-row:last-of-type { border-bottom: none; }
.exercise-row:active { background: var(--card); }

.exercise-name {
  font-size: 0.9375rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-tag {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 100px;
  background: var(--accent-dim);
  color: var(--accent);
}

.add-icon {
  font-size: 1.25rem;
  color: var(--primary);
  font-weight: 700;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.no-results {
  padding: 24px 0 8px;
  text-align: center;
}

.create-custom-btn {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border-radius: var(--radius);
  border: 1.5px dashed var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.create-custom-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-dim);
}

/* ── Create form ────────────────────────────── */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  padding: 7px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.pill.active {
  background: var(--primary-dim);
  border-color: var(--primary);
  color: var(--primary);
}
</style>
