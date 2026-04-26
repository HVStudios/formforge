<template>
  <main class="page">
    <div class="page-inner">
      <!-- Header: circle back + circle overflow -->
      <div class="detail-top">
        <button class="circle-btn" @click="router.back()">‹</button>
        <div class="detail-top-center">
          <div class="detail-top-sub">EXERCISE</div>
          <div class="detail-top-title">{{ exerciseName }}</div>
        </div>
        <div class="circle-btn" style="font-size: 1.25rem; color: var(--text-muted)">⋯</div>
      </div>

      <div v-if="sessions.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>No tracked sets yet for this exercise.</p>
      </div>

      <template v-else>
        <!-- PR card — accent lime border + glow -->
        <div class="pr-card">
          <div class="pr-card-glow" />
          <div class="pr-card-inner">
            <div class="pr-top-row">
              <span class="pr-badge">PR · GOLD</span>
              <span class="pr-date mono">{{ formatDate(pr.date) }}</span>
            </div>
            <div class="pr-numbers">
              <span class="pr-weight">{{ pr.weight }}</span>
              <span class="pr-x">kg ×</span>
              <span class="pr-reps">{{ pr.reps }}</span>
            </div>
            <div class="pr-sub mono">EST. 1RM · <span class="pr-e1rm">{{ Math.round(pr.e1rm) }} kg</span></div>
          </div>
        </div>

        <!-- 3-stat row -->
        <div class="ex-stats-row">
          <div class="ex-stat">
            <div class="ex-stat-val">{{ sessions.length }}</div>
            <div class="ex-stat-lbl">SESSIONS</div>
          </div>
          <div class="ex-stat">
            <div class="ex-stat-val">{{ totalSets }}</div>
            <div class="ex-stat-lbl">TOTAL SETS</div>
          </div>
          <div class="ex-stat">
            <div class="ex-stat-val accent">+{{ improvement }}%</div>
            <div class="ex-stat-lbl">1RM Δ</div>
          </div>
        </div>

        <!-- e1RM progress chart -->
        <div v-if="chart" class="chart-wrap">
          <div class="chart-label">ESTIMATED 1RM PROGRESS</div>
          <svg
            :viewBox="`0 0 ${chart.W} ${chart.H}`"
            preserveAspectRatio="none"
            class="e1rm-chart"
          >
            <line
              v-for="gl in chart.gridLines" :key="gl.y"
              :x1="chart.pad.left" :y1="gl.y" :x2="chart.W - chart.pad.right" :y2="gl.y"
              stroke="var(--border)" stroke-dasharray="2 4"
            />
            <text
              v-for="gl in chart.gridLines" :key="'l'+gl.y"
              :x="chart.pad.left - 4" :y="gl.y + 4"
              text-anchor="end" class="chart-axis-text"
            >{{ gl.label }}</text>
            <path :d="chart.area" class="chart-area" />
            <polyline
              :points="chart.line"
              fill="none"
              stroke="var(--accent)"
              stroke-width="2.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <circle
              v-for="(pt, i) in chart.pts" :key="i"
              :cx="pt.x" :cy="pt.y" r="3"
              :fill="i === chart.pts.length - 1 ? 'var(--accent)' : 'var(--surface)'"
              stroke="var(--accent)" stroke-width="2"
            />
          </svg>
          <div class="chart-x-labels" :style="{ paddingLeft: chart.pad.left + 'px', paddingRight: chart.pad.right + 'px' }">
            <span>{{ formatDate(sessions[0].date) }}</span>
            <span>{{ formatDate(sessions[sessions.length - 1].date) }}</span>
          </div>
        </div>

        <!-- Session list -->
        <div class="section-title">RECENT SESSIONS</div>
        <div class="session-list">
          <RouterLink
            v-for="s in [...sessions].reverse()" :key="s.logId"
            :to="{ name: 'workout-detail', params: { id: s.logId } }"
            class="session-row"
          >
            <div class="session-date mono">{{ formatDate(s.date) }}</div>
            <div class="session-divider" />
            <div class="session-mid">
              <div class="session-best">
                {{ s.bestWeight }} kg × {{ s.bestReps }}
                <span v-if="isSessionPR(s)" class="session-pr-badge">PR</span>
              </div>
              <div class="session-sub mono">e1RM {{ Math.round(s.bestE1rm) }} kg · {{ s.totalSets }} sets</div>
            </div>
            <div class="session-xp mono">+{{ sessionXP(s) }}</div>
            <span class="session-chevron">›</span>
          </RouterLink>
        </div>
      </template>

      <div style="height: 40px" />
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

function sessionXP(s: typeof sessions.value[0]): number {
  return Math.round(s.totalSets * 14)
}

function isSessionPR(s: typeof sessions.value[0]): boolean {
  if (!pr.value.e1rm) return false
  return Math.abs(s.bestE1rm - pr.value.e1rm) < 0.01
}

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

  const area = `M ${pts[0].x},${pad.top + iH} ` +
    pts.map(p => `L ${p.x},${p.y}`).join(' ') +
    ` L ${pts[n - 1].x},${pad.top + iH} Z`

  const gridLines = [0, 0.5, 1].map(t => ({
    y: pad.top + iH * (1 - t),
    label: Math.round(minVal + range * t),
  }))

  return { pts, line, area, gridLines, W, H, pad }
})
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────── */
.detail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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

.detail-top-center {
  text-align: center;
  flex: 1;
  padding: 0 12px;
}
.detail-top-sub {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
}
.detail-top-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 2px;
}

/* ── PR card — accent lime ───────────────────────────────── */
.pr-card {
  background: var(--surface);
  border: 1.5px solid var(--accent);
  border-radius: 20px;
  padding: 18px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--accent),
              0 0 24px color-mix(in srgb, var(--accent) 20%, transparent);
  margin-bottom: 12px;
}

.pr-card-glow {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  filter: blur(20px);
  pointer-events: none;
}

.pr-card-inner { position: relative; }

.pr-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.pr-badge {
  font-size: 0.5625rem;
  font-weight: 800;
  padding: 3px 7px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 4px;
  letter-spacing: 0.1em;
}

.pr-date {
  font-size: 0.625rem;
  color: var(--text-muted);
}

.pr-numbers {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.pr-weight {
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.05em;
  line-height: 1;
}

.pr-x {
  font-size: 1.125rem;
  color: var(--text-muted);
  font-weight: 700;
}

.pr-reps {
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.04em;
}

.pr-sub {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.pr-e1rm { color: var(--accent); font-weight: 700; }

/* ── Stats row ───────────────────────────────────────────── */
.ex-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.ex-stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.ex-stat-val {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--text);
}
.ex-stat-val.accent { color: var(--accent); }

.ex-stat-lbl {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  margin-top: 6px;
}

/* ── Chart ───────────────────────────────────────────────── */
.chart-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 14px 10px;
  margin-bottom: 20px;
}

.chart-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.e1rm-chart {
  width: 100%;
  height: auto;
  aspect-ratio: 2.5 / 1;
  display: block;
  overflow: visible;
}

.chart-area {
  fill: var(--accent);
  opacity: 0.13;
}

.chart-axis-text {
  font-size: 9px;
  fill: var(--text-muted);
  font-family: inherit;
}

.chart-x-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.5625rem;
  color: var(--text-muted);
  margin-top: 4px;
  font-family: var(--font-mono);
}

/* ── Session list ────────────────────────────────────────── */
.section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: 10px;
}

.session-list { display: flex; flex-direction: column; gap: 6px; }

.session-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  text-decoration: none;
  color: var(--text);
  transition: background 0.1s;
}
.session-row:active { background: var(--bg); }

.session-date {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 44px;
}

.session-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  flex-shrink: 0;
}

.session-mid { flex: 1; }

.session-best {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.session-pr-badge {
  font-size: 0.4375rem;
  font-weight: 800;
  padding: 1px 4px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 3px;
  letter-spacing: 0.08em;
}

.session-sub {
  font-size: 0.625rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.session-xp {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
}

.session-chevron { font-size: 1rem; color: var(--text-muted); }

.mono { font-family: var(--font-mono); }
</style>
