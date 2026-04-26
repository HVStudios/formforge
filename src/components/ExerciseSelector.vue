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
          <div class="sheet-header-row">
            <div class="sheet-title">Add exercise</div>
            <div class="sheet-count mono">{{ totalFiltered }} IN LIBRARY</div>
          </div>

          <!-- Pill search with accent focus ring -->
          <div class="search-pill" :class="{ focused: searchFocused }">
            <span class="search-icon">⌕</span>
            <input
              v-model="search"
              class="search-input"
              placeholder="Search exercises…"
              type="search"
              autocomplete="off"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
            />
          </div>

          <!-- Muscle group filter chips -->
          <div class="filter-row">
            <button
              v-for="cat in allCategories"
              :key="cat.value"
              class="filter-chip"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectedCategory = cat.value"
            >{{ cat.label }}</button>
          </div>

          <!-- Equipment filter -->
          <div class="filter-row">
            <button
              v-for="eq in allEquipment"
              :key="eq.value"
              class="filter-chip"
              :class="{ active: selectedEquipment === eq.value }"
              @click="selectedEquipment = eq.value"
            >{{ eq.label }}</button>
          </div>
        </div>

        <!-- ── Create custom header ─────────────────── -->
        <div v-else class="sheet-header">
          <div class="sheet-header-row">
            <button class="circle-btn" @click="cancelCreate">‹</button>
            <div class="sheet-title">Create Exercise</div>
            <div style="width:36px" />
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

          <!-- Grouped view -->
          <template v-else-if="isGrouped">
            <div v-for="group in grouped" :key="group.category" class="exercise-group">
              <div class="group-label">{{ group.label }}</div>
              <div class="exercise-cards">
                <button v-for="ex in group.exercises" :key="ex.id" class="exercise-card" @click="select(ex)">
                  <div class="exercise-card-body">
                    <div class="exercise-name">
                      {{ ex.name }}
                      <span v-if="ex.custom" class="custom-tag">Custom</span>
                    </div>
                    <span class="exercise-tag">{{ EQUIPMENT_LABELS[ex.equipment] }}</span>
                  </div>
                  <div class="exercise-add-btn">+</div>
                </button>
              </div>
            </div>
          </template>

          <!-- Flat filtered view -->
          <template v-else>
            <div class="exercise-cards">
              <button v-for="ex in flatFiltered" :key="ex.id" class="exercise-card" @click="select(ex)">
                <div class="exercise-card-body">
                  <div class="exercise-name">
                    {{ ex.name }}
                    <span v-if="ex.custom" class="custom-tag">Custom</span>
                  </div>
                  <div class="exercise-meta text-xs text-muted">
                    {{ selectedCategory === 'all' ? CATEGORY_LABELS[ex.category] + ' · ' : '' }}{{ EQUIPMENT_LABELS[ex.equipment] }}
                  </div>
                </div>
                <div class="exercise-add-btn">+</div>
              </button>
            </div>
          </template>

          <!-- Create custom -->
          <button v-if="totalFiltered > 0" class="create-custom-btn" @click="startCreate(search)">
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
              >{{ cat.icon }} {{ cat.label }}</button>
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
              >{{ eq.icon }} {{ eq.label }}</button>
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

const search            = ref('')
const searchFocused     = ref(false)
const selectedCategory  = ref('all')
const selectedEquipment = ref('all')
const creatingCustom    = ref(false)
const customName        = ref('')
const customCategory    = ref<ExerciseCategory>('other')
const customEquipment   = ref<Equipment>('other')
const nameInput         = ref<HTMLInputElement | null>(null)

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell:    'Barbell',
  dumbbell:   'Dumbbell',
  bodyweight: 'Bodyweight',
  machine:    'Machine',
  cable:      'Cable',
  other:      'Other',
}

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

const allEquipment = [
  { value: 'all',        label: 'All' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbell',   label: 'Dumbbell' },
  { value: 'barbell',    label: 'Barbell' },
  { value: 'cable',      label: 'Cable' },
  { value: 'machine',    label: 'Machine' },
  { value: 'other',      label: 'Other' },
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

const CATEGORY_GROUP_META: Record<string, { label: string; order: number }> = {
  chest:     { label: 'CHEST',     order: 0 },
  back:      { label: 'BACK',      order: 1 },
  legs:      { label: 'LEGS',      order: 2 },
  shoulders: { label: 'SHOULDERS', order: 3 },
  arms:      { label: 'ARMS',      order: 4 },
  core:      { label: 'CORE',      order: 5 },
  cardio:    { label: 'CARDIO',    order: 6 },
  other:     { label: 'OTHER',     order: 7 },
}

const allExercises = computed<Exercise[]>(() => [
  ...EXERCISES,
  ...store.customExercises,
])

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

const isGrouped = computed(() =>
  selectedCategory.value === 'all' && !search.value.trim()
)

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
      label: CATEGORY_GROUP_META[cat]?.label ?? cat.toUpperCase(),
      order: CATEGORY_GROUP_META[cat]?.order ?? 99,
      exercises,
    }))
    .sort((a, b) => a.order - b.order)
})

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
/* ── Sheet header ─────────────────────────────────────────── */
.sheet-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sheet-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sheet-count {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
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
}

/* ── Pill search ─────────────────────────────────────────── */
.search-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 999px;
  padding: 10px 16px;
  margin-bottom: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-pill.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 13%, transparent);
}

.search-icon {
  font-size: 0.875rem;
  color: var(--text-muted);
  flex-shrink: 0;
}
.search-pill.focused .search-icon { color: var(--accent); }

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 0.875rem;
  color: var(--text);
  min-width: 0;
}
.search-input::placeholder { color: var(--text-muted); }
.search-input::-webkit-search-cancel-button { -webkit-appearance: none; }

/* ── Filter chips ─────────────────────────────────────────── */
.filter-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-top: 6px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.filter-row::-webkit-scrollbar { display: none; }

.filter-chip {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.filter-chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

/* ── Group label ──────────────────────────────────────────── */
.exercise-group { margin-bottom: 4px; }

.group-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  padding: 14px 0 8px;
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
}

/* ── Exercise cards ───────────────────────────────────────── */
.exercise-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exercise-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}
.exercise-card:active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 5%, var(--bg)); }

.exercise-card-body { flex: 1; }

.exercise-name {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.exercise-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.5625rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-top: 4px;
}

.exercise-meta {
  margin-top: 2px;
}

.exercise-add-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 10px;
}

.custom-tag {
  font-size: 0.5625rem;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 100px;
  background: color-mix(in srgb, var(--cool) 13%, transparent);
  color: var(--cool);
}

/* ── Empty / no-results ─────────────────────────────────── */
.no-results {
  padding: 32px 0 8px;
  text-align: center;
}

/* ── Create custom button ───────────────────────────────── */
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
.create-custom-btn:active {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Create form ─────────────────────────────────────────── */
.create-form { display: flex; flex-direction: column; gap: 4px; }

.pill-grid { display: flex; flex-wrap: wrap; gap: 8px; }

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
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.mono { font-family: var(--font-mono); }
</style>
