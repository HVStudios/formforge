<template>
  <main class="page">
    <div class="page-inner">
      <div class="detail-header">
        <button class="btn btn-ghost" @click="router.back()">← Back</button>
      </div>

      <h1 class="ex-title">{{ exerciseName }}</h1>

      <div v-if="sessions.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>No tracked sets yet for this exercise.</p>
      </div>

      <template v-else>
        <!-- PR card -->
        <div class="pr-card card">
          <div class="pr-badge">🏆 Personal Record</div>
          <div class="pr-main">
            <span class="pr-weight">{{ pr.weight }} kg</span>
            <span class="pr-reps text-muted"> × {{ pr.reps }} reps</span>
          </div>
          <div class="pr-sub text-xs text-muted">
            ~{{ Math.round(pr.e1rm) }} kg est. 1RM · {{ formatDate(pr.date) }}
          </div>
        </div>

        <!-- Quick stats -->
        <div class="ex-stats-row">
          <div class="ex-stat card">
            <span class="ex-stat-val">{{ sessions.length }}</span>
            <span class="ex-stat-lbl">Sessions</span>
          </div>
          <div class="ex-stat card">
            <span class="ex-stat-val">{{ totalSets }}</span>
            <span class="ex-stat-lbl">Total sets</span>
          </div>
          <div class="ex-stat card">
            <span class="ex-stat-val">+{{ improvement }}%</span>
            <span class="ex-stat-lbl">1RM growth</span>
          </div>
        </div>

        <!-- e1RM progress chart -->
        <div v-if="chart" class="chart-wrap card">
          <div class="chart-label">Estimated 1RM progress</div>
          <svg
            :viewBox="`0 0 ${chart.W} ${chart.H}`"
            preserveAspectRatio="none"
            class="e1rm-chart"
          >
            <!-- Grid lines -->
            <line
              v-for="gl in chart.gridLines" :key="gl.y"
              :x1="chart.pad.left" :y1="gl.y" :x2="chart.W - chart.pad.right" :y2="gl.y"
              stroke="rgba(255,255,255,0.06)" stroke-width="1"
            />
            <!-- Y labels -->
            <text
              v-for="gl in chart.gridLines" :key="'l'+gl.y"
              :x="chart.pad.left - 4" :y="gl.y + 4"
              text-anchor="end" class="chart-axis-text"
            >{{ gl.label }}</text>
            <!-- Filled area -->
            <path
              :d="chart.area"
              fill="rgba(74,222,128,0.08)"
            />
            <!-- Line -->
            <polyline
              :points="chart.line"
              fill="none"
              stroke="var(--primary)"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Dots -->
            <circle
              v-for="(pt, i) in chart.pts" :key="i"
              :cx="pt.x" :cy="pt.y" r="3"
              fill="var(--primary)"
            />
          </svg>
          <!-- X-axis labels -->
          <div class="chart-x-labels" :style="{ paddingLeft: chart.pad.left + 'px', paddingRight: chart.pad.right + 'px' }">
            <span>{{ formatDate(sessions[0].date) }}</span>
            <span>{{ formatDate(sessions[sessions.length - 1].date) }}</span>
          </div>
        </div>

        <!-- Session list -->
        <h2 class="section-title">Sessions</h2>
        <div class="session-list">
          <RouterLink
            v-for="s in [...sessions].reverse()" :key="s.logId"
            :to="{ name: 'workout-detail', params: { id: s.logId } }"
            class="session-row card"
          >
            <div class="session-info">
              <span class="session-date text-sm">{{ formatDate(s.date) }}</span>
              <span class="session-best text-xs text-muted">
                Best: {{ s.bestWeight }} kg × {{ s.bestReps }} reps
              </span>
            </div>
            <div class="session-right">
              <span class="session-e1rm">~{{ Math.round(s.bestE1rm) }}</span>
              <span class="session-e1rm-unit text-xs text-muted">kg</span>
            </div>
            <span class="session-chevron">›</span>
          </RouterLink>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { getExerciseName } from '../data/exercises'
import { formatDate } from '../utils/format'

const props  = defineProps<{ id: string }>()
const router = useRouter()
const store  = useWorkoutsStore()

const exerciseName = computed(() => getExerciseName(props.id))
const sessions     = computed(() => store.getExerciseHistory(props.id))

const pr = computed(() => {
  const prEntry = store.prMap.get(props.id)
  if (prEntry) return prEntry
  return { weight: 0, reps: 0, e1rm: 0, date: '' }
})

const totalSets = computed(() => sessions.value.reduce((s, x) => s + x.totalSets, 0))

const improvement = computed(() => {
  if (sessions.value.length < 2) return 0
  const first = sessions.value[0].bestE1rm
  const last  = sessions.value[sessions.value.length - 1].bestE1rm
  if (!first) return 0
  return Math.round(((last - first) / first) * 100)
})

// ── e1RM chart ────────────────────────────────────────────────────────────────
const CHART = { W: 300, H: 120, pad: { top: 10, right: 8, bottom: 6, left: 36 } }

const chart = computed(() => {
  const data = sessions.value.filter(s => s.bestE1rm > 0)
  if (data.length < 2) return null

  const { W, H, pad } = CHART
  const iW = W - pad.left - pad.right
  const iH = H - pad.top - pad.bottom
  const n  = data.length

  const vals   = data.map(s => s.bestE1rm)
  const maxVal = Math.max(...vals)
  const minVal = Math.min(...vals) * 0.9
  const range  = maxVal - minVal || 1

  const pts = data.map((s, i) => ({
    x: pad.left + (i / (n - 1)) * iW,
    y: pad.top + iH - ((s.bestE1rm - minVal) / range) * iH,
  }))

  const line = pts.map(p => `${p.x},${p.y}`).join(' ')

  // Closed area path (fill under the line)
  const area = `M ${pts[0].x},${pad.top + iH} ` +
    pts.map(p => `L ${p.x},${p.y}`).join(' ') +
    ` L ${pts[n - 1].x},${pad.top + iH} Z`

  // Grid lines (3 horizontal)
  const gridLines = [0, 0.5, 1].map(t => ({
    y: pad.top + iH * (1 - t),
    label: Math.round(minVal + range * t),
  }))

  return { pts, line, area, gridLines, W, H, pad }
})
</script>

<style scoped>
.detail-header { display: flex; margin-bottom: 16px; }

.ex-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 16px; }

/* ── PR card ──────────────────────────────────────────────────────────────── */
.pr-card {
  background: rgba(251, 191, 36, 0.06);
  border-color: rgba(251, 191, 36, 0.3);
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.pr-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fbbf24;
  letter-spacing: 0.04em;
}

.pr-main { display: flex; align-items: baseline; gap: 2px; }
.pr-weight { font-size: 1.75rem; font-weight: 700; color: var(--text); }
.pr-reps   { font-size: 1rem; }
.pr-sub    { margin-top: 2px; }

/* ── Quick stats ──────────────────────────────────────────────────────────── */
.ex-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.ex-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
}

.ex-stat-val { font-size: 1.1rem; font-weight: 700; color: var(--primary); line-height: 1; }
.ex-stat-lbl { font-size: 0.6875rem; color: var(--text-muted); text-align: center; }

/* ── Chart ────────────────────────────────────────────────────────────────── */
.chart-wrap { margin-bottom: 20px; padding: 14px 14px 10px; }

.chart-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.e1rm-chart {
  width: 100%;
  height: auto;
  aspect-ratio: 2.5 / 1;
  display: block;
}

.chart-axis-text {
  font-size: 9px;
  fill: var(--text-dim);
  font-family: inherit;
}

.chart-x-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--text-dim);
  margin-top: 4px;
}

/* ── Session list ─────────────────────────────────────────────────────────── */
.section-title { margin-bottom: 10px; }

.session-list { display: flex; flex-direction: column; gap: 8px; }

.session-row {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s;
}
.session-row:active { background: var(--card-hover); }

.session-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.session-date { font-weight: 600; }

.session-right { display: flex; align-items: baseline; gap: 2px; }
.session-e1rm  { font-size: 1rem; font-weight: 700; color: var(--primary); }

.session-chevron { font-size: 1.1rem; color: var(--text-dim); }
</style>
