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

          <!-- Muscle group filter -->
          <div class="filter-row">
            <button
              v-for="cat in allCategories"
              :key="cat.value"
              class="filter-pill"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectedCategory = cat.value"
            >
              {{ cat.icon }} {{ cat.label }}
            </button>
          </div>

          <!-- Equipment filter -->
          <div class="filter-row equipment-row">
            <button
              v-for="eq in allEquipment"
              :key="eq.value"
              class="filter-pill eq-pill"
              :class="{ active: selectedEquipment === eq.value }"
              @click="selectedEquipment = eq.value"
            >
              {{ eq.icon }} {{ eq.label }}
            </button>
          </div>
        </div>

        <!-- ── Create custom header ─────────────────── -->
        <div v-else class="sheet-header">
          <div class="flex items-center gap-8 mb-12">
            <button class="btn btn-ghost btn-icon" @click="cancelCreate">←</button>
            <h2>Create Exercise</h2>
          </div>
        </div>

        <!-- ── Exercise list ───────────────────────── -->
        <div v-if="!creatingCustom" class="sheet-body">

          <!-- No results -->
          <template v-if="totalFiltered === 0">
            <div v-if="search" class="no-results">
              <p class="text-muted text-sm">No results for "{{ search }}"</p>
              <button class="btn btn-outline btn-full mt-12" @click="startCreate(search)">
                + Create "{{ search }}" as custom exercise
              </button>
            </div>
            <div v-else class="no-results">
              <p class="text-muted text-sm">No exercises match these filters.</p>
              <button class="btn btn-ghost btn-sm mt-8" @click="clearFilters">Clear filters</button>
            </div>
          </template>

          <!-- Grouped view (All category, no search) -->
          <template v-else-if="isGrouped">
            <div
              v-for="group in grouped"
              :key="group.category"
              class="exercise-group"
            >
              <div class="group-header">
                <span class="group-icon">{{ group.icon }}</span>
                <span class="group-label">{{ group.label }}</span>
                <span class="group-count">{{ group.exercises.length }}</span>
              </div>
              <button
                v-for="ex in group.exercises"
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
                    {{ EQUIPMENT_LABELS[ex.equipment] }}
                  </div>
                </div>
                <span class="add-icon">+</span>
              </button>
            </div>
          </template>

          <!-- Flat filtered view -->
          <template v-else>
            <button
              v-for="ex in flatFiltered"
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
                  {{ selectedCategory === 'all' ? CATEGORY_LABELS[ex.category] + ' · ' : '' }}{{ EQUIPMENT_LABELS[ex.equipment] }}
                </div>
              </div>
              <span class="add-icon">+</span>
            </button>
          </template>

          <!-- Create custom button -->
          <button
            v-if="totalFiltered > 0"
            class="create-custom-btn"
            @click="startCreate(search)"
          >
            + Create custom exercise
          </button>
        </div>

        <!-- ── Create form ──────────────────────────── -->
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
                {{ cat.icon }} {{ cat.label }}
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
                {{ eq.icon }} {{ eq.label }}
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

const search           = ref('')
const selectedCategory  = ref('all')
const selectedEquipment = ref('all')
const creatingCustom   = ref(false)
const customName       = ref('')
const customCategory   = ref<ExerciseCategory>('other')
const customEquipment  = ref<Equipment>('other')
const nameInput        = ref<HTMLInputElement | null>(null)

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell:    'Barbell',
  dumbbell:   'Dumbbell',
  bodyweight: 'Bodyweight',
  machine:    'Machine',
  cable:      'Cable',
  other:      'Other',
}

const allCategories = [
  { value: 'all',       label: 'All',       icon: '✦' },
  { value: 'chest',     label: 'Chest',     icon: '💪' },
  { value: 'back',      label: 'Back',      icon: '🔙' },
  { value: 'legs',      label: 'Legs',      icon: '🦵' },
  { value: 'shoulders', label: 'Shoulders', icon: '🏔️' },
  { value: 'arms',      label: 'Arms',      icon: '💪' },
  { value: 'core',      label: 'Core',      icon: '🔥' },
  { value: 'cardio',    label: 'Cardio',    icon: '🏃' },
]

const allEquipment = [
  { value: 'all',        label: 'All',        icon: '✦' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
  { value: 'dumbbell',   label: 'Dumbbell',   icon: '🏋️' },
  { value: 'barbell',    label: 'Barbell',    icon: '🔩' },
  { value: 'cable',      label: 'Cable',      icon: '🔗' },
  { value: 'machine',    label: 'Machine',    icon: '⚙️' },
  { value: 'other',      label: 'Other',      icon: '📦' },
]

const exerciseCategories = [
  { value: 'chest',     label: 'Chest',     icon: '💪' },
  { value: 'back',      label: 'Back',      icon: '🔙' },
  { value: 'legs',      label: 'Legs',      icon: '🦵' },
  { value: 'shoulders', label: 'Shoulders', icon: '🏔️' },
  { value: 'arms',      label: 'Arms',      icon: '💪' },
  { value: 'core',      label: 'Core',      icon: '🔥' },
  { value: 'cardio',    label: 'Cardio',    icon: '🏃' },
  { value: 'other',     label: 'Other',     icon: '📦' },
]

const equipmentOptions = [
  { value: 'barbell',    label: 'Barbell',    icon: '🔩' },
  { value: 'dumbbell',   label: 'Dumbbell',   icon: '🏋️' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
  { value: 'machine',    label: 'Machine',    icon: '⚙️' },
  { value: 'cable',      label: 'Cable',      icon: '🔗' },
  { value: 'other',      label: 'Other',      icon: '📦' },
]

const CATEGORY_GROUP_META: Record<string, { label: string; icon: string; order: number }> = {
  chest:     { label: 'Chest',     icon: '💪', order: 0 },
  back:      { label: 'Back',      icon: '🔙', order: 1 },
  legs:      { label: 'Legs',      icon: '🦵', order: 2 },
  shoulders: { label: 'Shoulders', icon: '🏔️', order: 3 },
  arms:      { label: 'Arms',      icon: '💪', order: 4 },
  core:      { label: 'Core',      icon: '🔥', order: 5 },
  cardio:    { label: 'Cardio',    icon: '🏃', order: 6 },
  other:     { label: 'Other',     icon: '📦', order: 7 },
}

const allExercises = computed<Exercise[]>(() => [
  ...EXERCISES,
  ...store.customExercises,
])

/** Apply equipment + category + search filters */
function applyFilters(list: Exercise[]): Exercise[] {
  if (selectedEquipment.value !== 'all') {
    list = list.filter(e => e.equipment === selectedEquipment.value)
  }
  if (selectedCategory.value !== 'all') {
    list = list.filter(e => e.category === selectedCategory.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }
  return list
}

/** Show grouped sections when browsing with no active search */
const isGrouped = computed(() =>
  selectedCategory.value === 'all' && !search.value.trim()
)

/** Grouped by muscle category (for browse mode) */
const grouped = computed(() => {
  const filtered = applyFilters(allExercises.value)
  const map = new Map<string, Exercise[]>()
  for (const ex of filtered) {
    const group = map.get(ex.category) ?? []
    group.push(ex)
    map.set(ex.category, group)
  }
  return [...map.entries()]
    .map(([cat, exercises]) => ({
      category: cat,
      label: CATEGORY_GROUP_META[cat]?.label ?? cat,
      icon:  CATEGORY_GROUP_META[cat]?.icon ?? '•',
      order: CATEGORY_GROUP_META[cat]?.order ?? 99,
      exercises,
    }))
    .sort((a, b) => a.order - b.order)
})

/** Flat list (for filtered / search mode) */
const flatFiltered = computed(() => applyFilters(allExercises.value))

const totalFiltered = computed(() =>
  isGrouped.value
    ? grouped.value.reduce((n, g) => n + g.exercises.length, 0)
    : flatFiltered.value.length
)

function clearFilters() {
  selectedCategory.value  = 'all'
  selectedEquipment.value = 'all'
  search.value = ''
}

function select(ex: Exercise) {
  emit('select', ex)
  close()
}

function close() {
  emit('update:modelValue', false)
  search.value = ''
  selectedCategory.value  = 'all'
  selectedEquipment.value = 'all'
  cancelCreate()
}

async function startCreate(prefill = '') {
  customName.value      = prefill.trim()
  customCategory.value  = 'other'
  customEquipment.value = 'other'
  creatingCustom.value  = true
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
/* ── Filter rows ──────────────────────────────── */
.filter-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-top: 10px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.filter-row::-webkit-scrollbar { display: none; }

.equipment-row { padding-top: 6px; }

.filter-pill {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

/* Category pills — primary (blue) */
.filter-pill.active {
  background: var(--primary-dim);
  border-color: var(--primary);
  color: var(--primary);
}

/* Equipment pills — accent (purple) when active */
.eq-pill.active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Grouped sections ──────────────────────────── */
.exercise-group {
  margin-bottom: 4px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 0 6px;
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
  /* subtle blur to blend with glass bg */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.group-icon { font-size: 1rem; }

.group-label {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
}

.group-count {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dim);
  background: var(--card);
  padding: 2px 8px;
  border-radius: 100px;
}

/* ── Exercise rows ─────────────────────────────── */
.exercise-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 13px 4px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  border-radius: var(--radius-sm);
}
.exercise-row:last-child { border-bottom: none; }
.exercise-row:active { background: var(--card); }

.exercise-name {
  font-size: 0.9375rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.exercise-meta {
  margin-top: 2px;
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

/* ── Empty / no-results ────────────────────────── */
.no-results {
  padding: 32px 0 8px;
  text-align: center;
}

/* ── Create custom button ─────────────────────── */
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

/* ── Create form ──────────────────────────────── */
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
