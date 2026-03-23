<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>History</h1>
        <span class="badge badge-green">{{ store.logs.length }} sessions</span>
      </div>

      <!-- ── Stats strip ───────────────────────────────────────────── -->
      <div class="stats-strip">
        <div class="strip-stat card">
          <span class="strip-value">{{ totalSessions }}</span>
          <span class="strip-label">Total</span>
        </div>
        <div class="strip-stat card">
          <span class="strip-value">{{ currentStreak }}</span>
          <span class="strip-label">Streak 🔥</span>
        </div>
        <div class="strip-stat card">
          <span class="strip-value">{{ bestStreak }}</span>
          <span class="strip-label">Best streak</span>
        </div>
        <div class="strip-stat card">
          <span class="strip-value">{{ avgPerWeek }}</span>
          <span class="strip-label">Avg/week</span>
        </div>
      </div>

      <!-- ── Weekly activity chart ─────────────────────────────────── -->
      <div v-if="store.logs.length > 0" class="chart-card card">
        <div class="chart-title">Workouts per week</div>
        <div class="bar-chart" aria-hidden="true">
          <div
            v-for="(bar, i) in weeklyBars"
            :key="i"
            class="bar-col"
          >
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ height: bar.pct + '%' }"
                :class="{ 'bar-current': i === weeklyBars.length - 1 }"
              />
            </div>
            <span class="bar-count">{{ bar.count || '' }}</span>
            <span class="bar-label">{{ bar.label }}</span>
          </div>
        </div>
      </div>

      <!-- ── Top exercises ─────────────────────────────────────────── -->
      <div v-if="topExercises.length > 0" class="chart-card card">
        <div class="chart-title">Most logged exercises</div>
        <div class="top-list">
          <div v-for="ex in topExercises" :key="ex.name" class="top-row">
            <span class="top-name">{{ ex.name }}</span>
            <div class="top-bar-wrap">
              <div class="top-bar-fill" :style="{ width: ex.pct + '%' }" />
            </div>
            <span class="top-count">{{ ex.count }}</span>
          </div>
        </div>
      </div>

      <!-- ── Log list ──────────────────────────────────────────────── -->
      <div v-if="store.logs.length === 0" class="empty-state">
        <div class="empty-icon">📈</div>
        <p>No workouts logged yet.<br />Complete a workout to see your stats here.</p>
      </div>

      <div v-else>
        <h2 class="section-title">Sessions</h2>
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

// ── Group logs by month (for the list) ──────────────────────────────────────
const groupedLogs = computed(() => {
  const groups: { label: string; logs: WorkoutLog[] }[] = []
  const map = new Map<string, WorkoutLog[]>()
  for (const log of store.logs) {
    const d = new Date(log.startedAt)
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(log)
  }
  for (const [label, logs] of map) groups.push({ label, logs })
  return groups
})

// ── Key metrics ──────────────────────────────────────────────────────────────
const totalSessions = computed(() => store.logs.length)

const avgPerWeek = computed(() => {
  if (store.logs.length === 0) return '—'
  const oldest = new Date(store.logs[store.logs.length - 1].startedAt).getTime()
  const weeks = Math.max(1, Math.ceil((Date.now() - oldest) / (7 * 86400000)))
  return (store.logs.length / weeks).toFixed(1)
})

/** Returns the workout date strings (YYYY-MM-DD) as a Set for streak maths */
const workoutDays = computed(() => {
  const days = new Set<string>()
  for (const log of store.logs) {
    days.add(log.startedAt.slice(0, 10))
  }
  return days
})

function streakFrom(startDate: Date, step: -1 | 1): number {
  let streak = 0
  const d = new Date(startDate)
  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (!workoutDays.value.has(key)) break
    streak++
    d.setDate(d.getDate() + step)
  }
  return streak
}

const currentStreak = computed(() => {
  if (store.logs.length === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Count back from today; also accept yesterday in case they haven't worked out yet today
  if (workoutDays.value.has(today.toISOString().slice(0, 10))) {
    return streakFrom(today, -1)
  }
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (workoutDays.value.has(yesterday.toISOString().slice(0, 10))) {
    return streakFrom(yesterday, -1)
  }
  return 0
})

const bestStreak = computed(() => {
  if (store.logs.length === 0) return 0
  // Walk each unique day forward to find the longest consecutive run
  const days = [...workoutDays.value].sort()
  let best = 1, run = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) { run++; best = Math.max(best, run) }
    else run = 1
  }
  return best
})

// ── Weekly bar chart (last 8 weeks) ─────────────────────────────────────────
const weeklyBars = computed(() => {
  const counts: number[] = Array(8).fill(0)
  const now = new Date()
  // Align to start of current week (Monday)
  const dayOfWeek = (now.getDay() + 6) % 7  // 0 = Mon
  const startOfWeek = new Date(now)
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(now.getDate() - dayOfWeek)

  for (const log of store.logs) {
    const d = new Date(log.startedAt)
    const msAgo = startOfWeek.getTime() - d.getTime()
    const weeksAgo = Math.floor(msAgo / (7 * 86400000))
    if (weeksAgo >= 0 && weeksAgo < 8) counts[7 - weeksAgo]++
    if (msAgo < 0) counts[7]++ // this week
  }

  const max = Math.max(...counts, 1)
  const now2 = new Date()

  return counts.map((count, i) => {
    const weekStart = new Date(startOfWeek)
    weekStart.setDate(startOfWeek.getDate() - (7 - i) * 7)
    const isCurrentWeek = i === 7
    const label = isCurrentWeek
      ? 'now'
      : weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { count, pct: Math.round((count / max) * 100), label }
  })
})

// ── Top exercises ────────────────────────────────────────────────────────────
const topExercises = computed(() => {
  const counts = new Map<string, number>()
  for (const log of store.logs) {
    for (const ex of log.exercises) {
      counts.set(ex.exerciseName, (counts.get(ex.exerciseName) ?? 0) + 1)
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = sorted[0]?.[1] ?? 1
  return sorted.map(([name, count]) => ({
    name,
    count,
    pct: Math.round((count / max) * 100),
  }))
})
</script>

<style scoped>
/* ── Stats strip ──────────────────────────────────────────────────────────── */
.stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.strip-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 6px;
}

.strip-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}

.strip-label {
  font-size: 0.625rem;
  color: var(--text-muted);
  text-align: center;
  white-space: nowrap;
}

/* ── Chart card ───────────────────────────────────────────────────────────── */
.chart-card {
  margin-bottom: 14px;
  padding: 16px;
}

.chart-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 14px;
}

/* ── Bar chart ────────────────────────────────────────────────────────────── */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 90px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  height: 100%;
}

.bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  min-height: 4px;
}

.bar-fill {
  width: 100%;
  background: var(--primary-dim);
  border-radius: 4px;
  transition: height 0.4s ease;
  min-height: 4px;
}

.bar-fill.bar-current {
  background: var(--primary);
}

.bar-count {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1;
  min-height: 10px;
}

.bar-label {
  font-size: 0.5625rem;
  color: var(--text-dim);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

/* ── Top exercises ────────────────────────────────────────────────────────── */
.top-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-name {
  font-size: 0.8125rem;
  color: var(--text);
  width: 110px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.top-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.top-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  width: 20px;
  text-align: right;
  flex-shrink: 0;
}

/* ── Section title ────────────────────────────────────────────────────────── */
.section-title { margin-bottom: 12px; }

/* ── Log list (unchanged) ─────────────────────────────────────────────────── */
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
