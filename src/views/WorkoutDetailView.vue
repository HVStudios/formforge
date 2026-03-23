<template>
  <main class="page">
    <div class="page-inner">
      <div class="detail-header">
        <button class="btn btn-ghost" @click="router.back()">← Back</button>
        <button class="btn btn-ghost" style="color: var(--danger)" @click="confirmDelete">Delete</button>
      </div>

      <div v-if="!log" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Workout not found.</p>
      </div>

      <template v-else>
        <h1 class="detail-title">{{ log.planName }}</h1>
        <p class="text-muted text-sm mb-16">{{ formatDate(log.startedAt) }}</p>

        <!-- Summary stats -->
        <div class="summary-row">
          <div class="summary-stat card">
            <span class="stat-value">{{ log.exercises.length }}</span>
            <span class="stat-label">Exercises</span>
          </div>
          <div class="summary-stat card">
            <span class="stat-value">{{ totalSets }}</span>
            <span class="stat-label">Sets done</span>
          </div>
          <div class="summary-stat card" v-if="log.completedAt">
            <span class="stat-value">{{ formatDuration(elapsedSeconds(log.startedAt, log.completedAt)) }}</span>
            <span class="stat-label">Duration</span>
          </div>
        </div>

        <!-- Exercise breakdown -->
        <h2 class="mb-12">Exercises</h2>
        <div class="ex-detail-list">
          <div
            v-for="ex in log.exercises"
            :key="ex.uid"
            class="ex-detail card"
          >
            <div class="ex-detail-header">
              <span class="ex-detail-name">{{ ex.exerciseName }}</span>
              <span class="badge badge-green">{{ ex.sets.filter(s => s.completed).length }}/{{ ex.sets.length }} sets</span>
            </div>

            <div class="sets-table">
              <div class="sets-table-header">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>Done</span>
              </div>
              <div
                v-for="(set, si) in ex.sets"
                :key="si"
                class="sets-table-row"
                :class="{ 'set-skipped': !set.completed }"
              >
                <span>{{ si + 1 }}</span>
                <span>{{ set.weight != null ? set.weight + ' kg' : '—' }}</span>
                <span>{{ set.reps != null ? set.reps : '—' }}</span>
                <span>{{ set.completed ? '✓' : '✗' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="log.notes" class="notes-card card mt-16">
          <span class="label">Notes</span>
          <p class="text-sm">{{ log.notes }}</p>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDate, formatDuration, elapsedSeconds } from '../utils/format'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useWorkoutsStore()

const log = computed(() => store.getLog(props.id))

const totalSets = computed(() =>
  log.value?.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0) ?? 0
)

function confirmDelete() {
  if (!confirm('Delete this workout log? This cannot be undone.')) return
  store.deleteLog(props.id)
  router.back()
}
</script>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 14px 8px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-align: center;
}

.ex-detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ex-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ex-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ex-detail-name {
  font-weight: 700;
  font-size: 0.9375rem;
}

.sets-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sets-table-header,
.sets-table-row {
  display: grid;
  grid-template-columns: 32px 1fr 1fr 32px;
  gap: 8px;
  align-items: center;
  padding: 4px 2px;
}

.sets-table-header {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
}

.sets-table-row {
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.sets-table-row:last-child { border-bottom: none; }

.set-skipped {
  opacity: 0.4;
}

.sets-table-row span:last-child {
  font-weight: 700;
  color: var(--primary);
}
.set-skipped span:last-child { color: var(--danger); }
</style>
