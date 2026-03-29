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

      <!-- ── Monthly calendar ───────────────────────────────────────── -->
      <div v-if="store.logs.length > 0" class="chart-card card reveal reveal-d1">
        <div class="cal-header">
          <button class="cal-nav" @click="calPrev">‹</button>
          <span class="chart-title" style="margin:0">{{ calTitle }}</span>
          <button class="cal-nav" @click="calNext" :disabled="!canGoNext">›</button>
        </div>
        <div class="cal-grid">
          <div v-for="d in DOW_LABELS" :key="d" class="cal-dow">{{ d }}</div>
          <div
            v-for="cell in calCells" :key="cell.key"
            class="cal-cell"
            :class="{
              'cal-has-workout': cell.count > 0,
              'cal-today': cell.isToday,
              'cal-selected': cell.date === selectedDate,
              'cal-filler': !cell.day,
            }"
            @click="cell.day && toggleDayFilter(cell.date)"
          >
            <span v-if="cell.day" class="cal-day-num">{{ cell.day }}</span>
            <span v-if="cell.count > 0" class="cal-pip" :data-count="cell.count > 1 ? cell.count : ''"></span>
          </div>
        </div>
        <div v-if="selectedDate" class="cal-filter-bar">
          <span class="text-xs text-muted">{{ formatDate(selectedDate) }}</span>
          <button class="cal-clear" @click="selectedDate = null">Show all</button>
        </div>
      </div>

      <!-- ── Muscle group volume ─────────────────────────────────────── -->
      <div v-if="muscleVolume.length > 0" class="chart-card card reveal reveal-d2">
        <div class="chart-title">Volume this week</div>
        <div class="muscle-list">
          <div
            v-for="(mg, i) in muscleVolume" :key="mg.category"
            class="muscle-row"
            :style="{ animationDelay: (i * 0.055) + 's' }"
          >
            <span class="muscle-label">{{ mg.label }}</span>
            <div class="muscle-bar-wrap">
              <div class="muscle-bar-fill" :style="{ width: mg.pct + '%', background: mg.color }" />
            </div>
            <span class="muscle-sets">{{ mg.sets }}s</span>
          </div>
        </div>
      </div>

      <!-- ── Strength trends ─────────────────────────────────────────── -->
      <div v-if="strengthTrends.length > 0" class="chart-card card reveal reveal-d3">
        <div class="chart-title">Strength trends</div>
        <div class="trend-list">
          <RouterLink
            v-for="t in strengthTrends" :key="t.exerciseId"
            :to="{ name: 'exercise-history', params: { id: t.exerciseId } }"
            class="trend-row"
          >
            <div class="trend-info">
              <span class="trend-name">{{ t.name }}</span>
              <span
                class="trend-change text-xs"
                :class="t.change > 0 ? 'trend-up' : t.change < 0 ? 'trend-down' : 'text-muted'"
              >{{ t.change > 0 ? '+' : '' }}{{ t.change }}%</span>
            </div>
            <svg viewBox="0 0 80 30" class="trend-svg" preserveAspectRatio="none">
              <polyline
                :points="t.sparkline"
                fill="none"
                stroke="var(--accent)"
                stroke-width="1.5"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </svg>
            <span class="pr-chevron">›</span>
          </RouterLink>
        </div>
      </div>

      <!-- ── Weekly activity chart ─────────────────────────────────── -->
      <div v-if="store.logs.length > 0" class="chart-card card reveal reveal-d4">
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

      <!-- ── Body weight chart ────────────────────────────────────── -->
      <div v-if="bwChart" class="chart-card card">
        <div class="chart-title">Body weight trend</div>
        <svg
          :viewBox="`0 0 ${bwChart.W} ${bwChart.H}`"
          preserveAspectRatio="none"
          class="bw-svg"
        >
          <line
            v-for="gl in bwChart.gridLines" :key="gl.y"
            :x1="bwChart.pad.left" :y1="gl.y" :x2="bwChart.W - bwChart.pad.right" :y2="gl.y"
            stroke="rgba(255,255,255,0.06)" stroke-width="1"
          />
          <text
            v-for="gl in bwChart.gridLines" :key="'l'+gl.y"
            :x="bwChart.pad.left - 4" :y="gl.y + 4"
            text-anchor="end" class="bw-axis-text"
          >{{ gl.label }}</text>
          <path :d="bwChart.area" fill="rgba(139,92,246,0.08)" />
          <polyline
            :points="bwChart.line"
            fill="none"
            stroke="var(--accent)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <circle
            v-for="(pt, i) in bwChart.pts" :key="i"
            :cx="pt.x" :cy="pt.y" r="3"
            fill="var(--accent)"
          />
        </svg>
        <div class="bw-x-labels" :style="{ paddingLeft: bwChart.pad.left + 'px', paddingRight: bwChart.pad.right + 'px' }">
          <span>{{ formatDate(bwChartData[0].date) }}</span>
          <span>{{ formatDate(bwChartData[bwChartData.length - 1].date) }}</span>
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
        <div v-if="groupedLogs.length === 0 && selectedDate" class="empty-state" style="padding: 24px 0">
          <p class="text-muted">No workouts on this day.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDate, formatDuration, elapsedSeconds } from '../utils/format'
import { getExerciseName, getExerciseById, isRunningExercise } from '../data/exercises'
import type { WorkoutLog } from '../types'

const store = useWorkoutsStore()

// ── Group logs by month (respects selectedDate filter) ───────────────────────
const selectedDate = ref<string | null>(null)

function toggleDayFilter(date: string) {
  selectedDate.value = selectedDate.value === date ? null : date
}

const groupedLogs = computed(() => {
  const source = selectedDate.value
    ? store.logs.filter(l => l.startedAt.slice(0, 10) === selectedDate.value)
    : store.logs

  const groups: { label: string; logs: WorkoutLog[] }[] = []
  const map = new Map<string, WorkoutLog[]>()
  for (const log of source) {
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

// ── Monthly calendar ──────────────────────────────────────────────────────────
const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const calYear  = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth()) // 0-11

const calTitle = computed(() =>
  new Date(calYear.value, calMonth.value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)

const canGoNext = computed(() => {
  const now = new Date()
  return calYear.value < now.getFullYear() || calMonth.value < now.getMonth()
})

function calPrev() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}

function calNext() {
  if (!canGoNext.value) return
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

const calCells = computed(() => {
  const year = calYear.value, month = calMonth.value
  const firstDay  = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow  = (firstDay.getDay() + 6) % 7 // Mon = 0

  const mm = String(month + 1).padStart(2, '0')
  const counts = new Map<string, number>()
  for (const log of store.logs) {
    const d = log.startedAt.slice(0, 10)
    if (d.startsWith(`${year}-${mm}`)) counts.set(d, (counts.get(d) ?? 0) + 1)
  }

  const today = new Date().toISOString().slice(0, 10)
  type Cell = { key: string; day: number | null; date: string; count: number; isToday: boolean }
  const cells: Cell[] = []

  for (let i = 0; i < startDow; i++) {
    cells.push({ key: `f${i}`, day: null, date: '', count: 0, isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${mm}-${String(d).padStart(2, '0')}`
    cells.push({ key: date, day: d, date, count: counts.get(date) ?? 0, isToday: date === today })
  }
  return cells
})

// ── Muscle group volume (this week) ──────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; color: string }> = {
  chest:     { label: 'Chest',     color: '#ef4444' },
  back:      { label: 'Back',      color: '#3b82f6' },
  legs:      { label: 'Legs',      color: '#22c55e' },
  shoulders: { label: 'Shoulders', color: '#f59e0b' },
  arms:      { label: 'Arms',      color: '#a78bfa' },
  core:      { label: 'Core',      color: '#06b6d4' },
  cardio:    { label: 'Cardio',    color: '#f97316' },
  other:     { label: 'Other',     color: '#6b7280' },
}

const muscleVolume = computed(() => {
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)

  const counts = new Map<string, number>()
  for (const log of store.logs) {
    if (new Date(log.startedAt) < weekStart) continue
    for (const ex of log.exercises) {
      const cat = getExerciseById(ex.exerciseId)?.category ?? 'other'
      const completedSets = ex.sets.filter(s => s.completed).length
      if (completedSets > 0) counts.set(cat, (counts.get(cat) ?? 0) + completedSets)
    }
  }

  if (counts.size === 0) return []
  const max = Math.max(...counts.values())
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, sets]) => ({
      category: cat,
      label: CATEGORY_META[cat]?.label ?? cat,
      color: CATEGORY_META[cat]?.color ?? '#6b7280',
      sets,
      pct: Math.round((sets / max) * 100),
    }))
})

// ── Strength trends (top exercises with sparklines) ───────────────────────────
const strengthTrends = computed(() => {
  // Build per-exercise session history (chronological)
  const exMap = new Map<string, { name: string; e1rms: number[] }>()

  for (const log of [...store.logs].reverse()) {
    for (const ex of log.exercises) {
      if (isRunningExercise(ex.exerciseId)) continue
      let best = 0
      for (const set of ex.sets) {
        if (!set.completed || !set.weight || !set.reps) continue
        const calc = store.e1rm(set.weight, set.reps)
        if (calc > best) best = calc
      }
      if (best > 0) {
        if (!exMap.has(ex.exerciseId)) exMap.set(ex.exerciseId, { name: ex.exerciseName, e1rms: [] })
        exMap.get(ex.exerciseId)!.e1rms.push(best)
      }
    }
  }

  return [...exMap.entries()]
    .filter(([, v]) => v.e1rms.length >= 3)
    .sort((a, b) => b[1].e1rms.length - a[1].e1rms.length)
    .slice(0, 5)
    .map(([exerciseId, { name, e1rms }]) => {
      const pts = e1rms.slice(-10)
      const n   = pts.length
      const min = Math.min(...pts) * 0.95
      const max = Math.max(...pts) * 1.05
      const range = max - min || 1
      const W = 80, H = 30

      const sparkline = pts.map((v, i) => {
        const x = (i / (n - 1)) * W
        const y = H - ((v - min) / range) * H
        return `${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')

      const change = Math.round(((pts[n - 1] - pts[0]) / pts[0]) * 100)
      return { exerciseId, name, sparkline, change }
    })
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

// ── Body weight chart ─────────────────────────────────────────────────────────
const BW = { W: 300, H: 100, pad: { top: 8, right: 8, bottom: 6, left: 36 } }

const bwChartData = computed(() => store.bodyWeightLog.slice(-60))

const bwChart = computed(() => {
  const data = bwChartData.value
  if (data.length < 2) return null
  const { W, H, pad } = BW
  const iW = W - pad.left - pad.right
  const iH = H - pad.top - pad.bottom
  const n  = data.length

  const vals   = data.map(e => e.kg)
  const maxVal = Math.max(...vals)
  const minVal = Math.min(...vals) * 0.98
  const range  = maxVal - minVal || 1

  const pts = data.map((e, i) => ({
    x: pad.left + (i / (n - 1)) * iW,
    y: pad.top + iH - ((e.kg - minVal) / range) * iH,
  }))

  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M ${pts[0].x},${pad.top + iH} ` +
    pts.map(p => `L ${p.x},${p.y}`).join(' ') +
    ` L ${pts[n - 1].x},${pad.top + iH} Z`

  const gridLines = [0, 0.5, 1].map(t => ({
    y: pad.top + iH * (1 - t),
    label: (minVal + range * t).toFixed(1),
  }))

  return { pts, line, area, gridLines, W, H, pad }
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
/* ── Entrance animations ──────────────────────────────────────────────────── */
@keyframes cell-pop {
  from { opacity: 0; transform: scale(0.55); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes draw-line {
  to { stroke-dashoffset: 0; }
}

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

/* ── Monthly calendar ─────────────────────────────────────────────────────── */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.cal-nav {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.cal-nav:hover:not(:disabled) { background: var(--border); color: var(--text); }
.cal-nav:disabled { opacity: 0.3; cursor: default; }

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.cal-dow {
  text-align: center;
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--text-dim);
  padding-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cal-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: default;
  position: relative;
  gap: 2px;
  transition: background 0.12s;
}

.cal-cell.cal-has-workout {
  cursor: pointer;
  animation: cell-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.cal-cell.cal-has-workout:active { background: var(--border); }

.cal-filler { visibility: hidden; }

.cal-day-num {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  line-height: 1;
}

.cal-cell.cal-has-workout .cal-day-num {
  color: var(--text);
  font-weight: 600;
}

.cal-cell.cal-today .cal-day-num {
  color: var(--primary);
  font-weight: 700;
}

.cal-cell.cal-selected {
  background: rgba(74, 222, 128, 0.12);
  outline: 1px solid var(--primary);
}

.cal-pip {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
  position: relative;
}

/* show count badge for 2+ workouts */
.cal-pip[data-count]::after {
  content: attr(data-count);
  position: absolute;
  left: 6px;
  top: -2px;
  font-size: 0.5rem;
  color: var(--primary);
  white-space: nowrap;
  line-height: 1;
  font-weight: 700;
}

.cal-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.cal-clear {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.cal-clear:hover { border-color: var(--primary); color: var(--primary); }

/* ── Muscle group volume ───────────────────────────────────────────────────── */
.muscle-list { display: flex; flex-direction: column; gap: 8px; }

.muscle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  animation: reveal-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.muscle-label {
  font-size: 0.8125rem;
  color: var(--text);
  width: 76px;
  flex-shrink: 0;
}

.muscle-bar-wrap {
  flex: 1;
  height: 7px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.muscle-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 4px;
}

.muscle-sets {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  width: 28px;
  text-align: right;
  flex-shrink: 0;
}

/* ── Strength trends ──────────────────────────────────────────────────────── */
.trend-list { display: flex; flex-direction: column; gap: 2px; }

.trend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
  text-decoration: none;
  color: var(--text);
  border-radius: 8px;
  transition: background 0.15s;
}
.trend-row:active { background: var(--card-hover); }

.trend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trend-name {
  font-size: 0.875rem;
  font-weight: 600;
}

.trend-change { font-weight: 700; }
.trend-up   { color: #4ade80; }
.trend-down { color: #f87171; }

.trend-svg {
  width: 80px;
  height: 30px;
  flex-shrink: 0;
}

.trend-svg polyline {
  stroke-dasharray: 500;
  stroke-dashoffset: 500;
  animation: draw-line 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
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

.pr-chevron { font-size: 1.1rem; color: var(--text-dim); }

/* ── Body weight chart ────────────────────────────────────────────────────── */
.bw-svg {
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 1;
  display: block;
}

.bw-axis-text {
  font-size: 9px;
  fill: var(--text-dim);
  font-family: inherit;
}

.bw-x-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--text-dim);
  margin-top: 4px;
}

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
