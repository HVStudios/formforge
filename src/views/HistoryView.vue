<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>History</h1>
        <span class="badge badge-green">{{ store.logs.length }} sessions</span>
      </div>

      <div v-if="store.logs.length === 0" class="empty-state">
        <div class="empty-icon">📈</div>
        <p>No workouts logged yet.<br />Complete a workout to see it here.</p>
      </div>

      <div v-else>
        <!-- Group by month -->
        <div v-for="group in groupedLogs" :key="group.label" class="month-group">
          <div class="month-label">{{ group.label }}</div>
          <div class="log-list">
            <RouterLink
              v-for="log in group.logs"
              :key="log.id"
              :to="{ name: 'workout-detail', params: { id: log.id } }"
              class="log-card card"
            >
              <div class="log-main">
                <div class="log-name">{{ log.planName }}</div>
                <div class="log-date text-xs text-muted">{{ formatDate(log.startedAt) }}</div>
              </div>
              <div class="log-stats">
                <span class="badge badge-green">{{ log.exercises.length }} exercises</span>
                <span class="text-xs text-muted" v-if="log.completedAt">
                  {{ formatDuration(elapsedSeconds(log.startedAt, log.completedAt)) }}
                </span>
              </div>
              <span class="log-arrow">›</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDate, formatDuration, elapsedSeconds } from '../utils/format'
import type { WorkoutLog } from '../types'

const store = useWorkoutsStore()

const groupedLogs = computed(() => {
  const groups: { label: string; logs: WorkoutLog[] }[] = []
  const map = new Map<string, WorkoutLog[]>()

  for (const log of store.logs) {
    const d = new Date(log.startedAt)
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(log)
  }

  for (const [label, logs] of map) {
    groups.push({ label, logs })
  }
  return groups
})
</script>

<style scoped>
.month-group { margin-bottom: 20px; }

.month-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
  padding-left: 4px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-card {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s;
}
.log-card:active { background: var(--card-hover); }

.log-main { flex: 1; }
.log-name { font-weight: 600; margin-bottom: 2px; }

.log-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.log-arrow {
  font-size: 1.25rem;
  color: var(--text-dim);
  margin-left: 2px;
}
</style>
