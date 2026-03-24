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

      <!-- ── Calendar heatmap ──────────────────────────────────────── -->
      <div v-if="store.logs.length > 0" class="chart-card card">
        <div class="chart-title">{{ heatmap.year }} activity</div>
        <div class="heatmap-wrap" ref="heatmapEl">
          <!-- Month labels -->
          <div class="heatmap-months" :style="{ width: heatmapWidth + 'px' }">
            <span
              v-for="m in heatmap.monthStarts" :key="m.month"
              class="month-tag"
              :style="{ left: m.weekIdx * CELL_STEP + 'px' }"
            >{{ m.month }}</span>
          </div>
          <!-- Day grid -->
          <div class="heatmap-grid" :style="{ width: heatmapWidth + 'px' }">
            <div v-for="(week, wi) in heatmap.weeks" :key="wi" class="heatmap-col">
              <div
                v-for="(day, di) in week" :key="di"
                class="heatmap-cell"
                :class="heatClass(day.count, !!day.date)"
                :title="day.date ? `${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}` : ''"
              />
            </div>
          </div>
          <!-- Weekday labels (Mon / Wed / Fri) -->
          <div class="heatmap-days">
            <span style="grid-row:1">M</span>
            <span style="grid-row:3">W</span>
            <span style="grid-row:5">F</span>
          </div>
        </div>
      </div>

      <!-- ── Weekly activity chart ─────────────────────────────────── -->
      <div v-if="store.logs.length > 0" class="chart-card card">
        <div class="chart-title">Workouts per week</div>
        <div class="bar-chart" aria-hidden="true">
          <div v-for="(bar, i) in weeklyBars" :key="i" class="bar-col">
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

      <!-- ── Personal records ───────────────────────────────────────── -->
      <div v-if="prList.length > 0" class="chart-card card">
        <div class="chart-title">Personal records</div>
        <div class="pr-list">
          <RouterLink
            v-for="pr in prList" :key="pr.exerciseId"
            :to="{ name: 'exercise-history', params: { id: pr.exerciseId } }"
            class="pr-row"
          >
            <div class="pr-info">
              <span class="pr-name">{{ pr.name }}</span>
              <span class="pr-set text-xs text-muted">{{ pr.weight }} kg × {{ pr.reps }} reps</span>
            </div>
            <div class="pr-right">
              <span class="pr-e1rm">~{{ Math.round(pr.e1rm) }} kg</span>
              <span class="pr-e1rm-label text-xs text-muted">est. 1RM</span>
            </div>
            <span class="pr-chevron">›</span>
          </RouterLink>
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
import { computed, ref, onMounted } from 'vue'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDate, formatDuration, elapsedSeconds } from '../utils/format'
import { getExerciseName } from '../data/exercises'
import type { WorkoutLog } from '../types'

const store = useWorkoutsStore()

// ── Group logs by month ──────────────────────────────────────────────────────
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

const workoutDays = computed(() => {
  const days = new Set<string>()
  for (const log of store.logs) days.add(log.startedAt.slice(0, 10))
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
  if (workoutDays.value.has(today.toISOString().slice(0, 10))) return streakFrom(today, -1)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (workoutDays.value.has(yesterday.toISOString().slice(0, 10))) return streakFrom(yesterday, -1)
  return 0
})

const bestStreak = computed(() => {
  if (store.logs.length === 0) return 0
  const days = [...workoutDays.value].sort()
  let best = 1, run = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86400000
    if (diff === 1) { run++; best = Math.max(best, run) }
    else run = 1
  }
  return best
})

// ── Calendar heatmap ─────────────────────────────────────────────────────────
const CELL_SIZE = 11
const CELL_GAP  = 2
const CELL_STEP = CELL_SIZE + CELL_GAP
const DAY_LABEL_W = 14

const heatmapEl = ref<HTMLElement | null>(null)

const heatmap = computed(() => {
  const year = new Date().getFullYear()
  const counts = new Map<string, number>()
  for (const log of store.logs) {
    const key = log.startedAt.slice(0, 10)
    if (key.startsWith(year.toString())) counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  const startDow = (jan1.getDay() + 6) % 7  // Mon=0

  type Cell = { date: string; count: number }
  const weeks: Cell[][] = []
  let week: Cell[] = Array.from({ length: startDow }, () => ({ date: '', count: 0 }))

  const d = new Date(jan1)
  while (d <= dec31) {
    const key = d.toISOString().slice(0, 10)
    week.push({ date: key, count: counts.get(key) ?? 0 })
    if (week.length === 7) { weeks.push([...week]); week = [] }
    d.setDate(d.getDate() + 1)
  }
  if (week.length) {
    while (week.length < 7) week.push({ date: '', count: 0 })
    weeks.push(week)
  }

  // Month labels: first week each month appears
  const monthStarts: { month: string; weekIdx: number }[] = []
  const seen = new Set<number>()
  weeks.forEach((wk, wi) => {
    for (const day of wk) {
      if (!day.date) continue
      const m = parseInt(day.date.slice(5, 7))
      if (!seen.has(m)) {
        seen.add(m)
        monthStarts.push({
          month: new Date(day.date).toLocaleDateString('en-US', { month: 'short' }),
          weekIdx: wi,
        })
      }
    }
  })

  return { weeks, monthStarts, year }
})

const heatmapWidth = computed(() =>
  DAY_LABEL_W + heatmap.value.weeks.length * CELL_STEP
)

function heatClass(count: number, isYear: boolean) {
  if (!isYear) return 'heat-empty'
  if (count === 0) return 'heat-0'
  if (count === 1) return 'heat-1'
  if (count === 2) return 'heat-2'
  return 'heat-3'
}

// Scroll to current month on mount
onMounted(() => {
  if (!heatmapEl.value) return
  const today = new Date()
  const jan1 = new Date(today.getFullYear(), 0, 1)
  const weeksSinceJan = Math.floor((today.getTime() - jan1.getTime()) / (7 * 86400000))
  const scrollTo = Math.max(0, (weeksSinceJan - 3) * CELL_STEP + DAY_LABEL_W)
  heatmapEl.value.scrollLeft = scrollTo
})

// ── Weekly bar chart ─────────────────────────────────────────────────────────
const weeklyBars = computed(() => {
  const counts: number[] = Array(8).fill(0)
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7
  const startOfWeek = new Date(now)
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(now.getDate() - dayOfWeek)

  for (const log of store.logs) {
    const d = new Date(log.startedAt)
    const msAgo = startOfWeek.getTime() - d.getTime()
    const weeksAgo = Math.floor(msAgo / (7 * 86400000))
    if (msAgo < 0) counts[7]++
    else if (weeksAgo < 8) counts[7 - weeksAgo]++
  }

  const max = Math.max(...counts, 1)
  return counts.map((count, i) => {
    const ws = new Date(startOfWeek)
    ws.setDate(startOfWeek.getDate() - (7 - i) * 7)
    const label = i === 7 ? 'now' : ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { count, pct: Math.round((count / max) * 100), label }
  })
})

// ── Personal records list ────────────────────────────────────────────────────
const prList = computed(() => {
  const entries = [...store.prMap.entries()]
  return entries
    .map(([exerciseId, pr]) => ({ exerciseId, name: getExerciseName(exerciseId), ...pr }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
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
  return sorted.map(([name, count]) => ({ name, count, pct: Math.round((count / max) * 100) }))
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
.strip-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 6px; }
.strip-value { font-size: 1.25rem; font-weight: 700; color: var(--primary); line-height: 1; }
.strip-label { font-size: 0.625rem; color: var(--text-muted); text-align: center; white-space: nowrap; }

/* ── Chart card ───────────────────────────────────────────────────────────── */
.chart-card { margin-bottom: 14px; padding: 16px; }
.chart-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 14px;
}

/* ── Calendar heatmap ─────────────────────────────────────────────────────── */
.heatmap-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
  position: relative;
}

.heatmap-months {
  position: relative;
  height: 16px;
  margin-left: 14px;
  margin-bottom: 4px;
}

.month-tag {
  position: absolute;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.heatmap-grid {
  display: flex;
  gap: 2px;
  margin-left: 14px;
}

.heatmap-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.heatmap-cell {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  flex-shrink: 0;
}

.heat-empty { background: transparent; }
.heat-0     { background: var(--border); }
.heat-1     { background: rgba(74, 222, 128, 0.25); }
.heat-2     { background: rgba(74, 222, 128, 0.55); }
.heat-3     { background: var(--primary); }

.heatmap-days {
  position: absolute;
  left: 0;
  top: 20px;
  display: grid;
  grid-template-rows: repeat(7, 13px);
  font-size: 0.55rem;
  color: var(--text-dim);
  line-height: 11px;
}

/* ── Bar chart ────────────────────────────────────────────────────────────── */
.bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 90px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; }
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
.bar-fill { width: 100%; background: var(--primary-dim); border-radius: 4px; transition: height 0.4s ease; min-height: 4px; }
.bar-fill.bar-current { background: var(--primary); }
.bar-count { font-size: 0.625rem; font-weight: 600; color: var(--text-muted); line-height: 1; min-height: 10px; }
.bar-label { font-size: 0.5625rem; color: var(--text-dim); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }

/* ── Personal records ─────────────────────────────────────────────────────── */
.pr-list { display: flex; flex-direction: column; gap: 2px; }

.pr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  text-decoration: none;
  color: var(--text);
  border-radius: 8px;
  transition: background 0.15s;
}
.pr-row:active { background: var(--card-hover); }

.pr-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.pr-name { font-size: 0.875rem; font-weight: 600; }
.pr-set  { margin-top: 1px; }

.pr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.pr-e1rm  { font-size: 0.9375rem; font-weight: 700; color: #fbbf24; }
.pr-e1rm-label { }

.pr-chevron { font-size: 1.1rem; color: var(--text-dim); }

/* ── Top exercises ────────────────────────────────────────────────────────── */
.top-list { display: flex; flex-direction: column; gap: 8px; }
.top-row  { display: flex; align-items: center; gap: 10px; }
.top-name { font-size: 0.8125rem; color: var(--text); width: 110px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.top-bar-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; }
.top-count { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); width: 20px; text-align: right; flex-shrink: 0; }

/* ── Section title ────────────────────────────────────────────────────────── */
.section-title { margin-bottom: 12px; }

/* ── Log list ─────────────────────────────────────────────────────────────── */
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
.log-list { display: flex; flex-direction: column; gap: 8px; }
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
.log-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.log-arrow { font-size: 1.25rem; color: var(--text-dim); margin-left: 2px; }
</style>
