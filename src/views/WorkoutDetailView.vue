<template>
  <main class="page">
    <div class="page-inner">
      <!-- Header: circle back + circle share -->
      <div class="detail-top">
        <button class="circle-btn" @click="router.push({ name: 'history' })">‹</button>
        <button class="circle-btn" style="color: var(--danger)" @click="confirmDelete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>

      <div v-if="!log" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Workout not found.</p>
      </div>

      <template v-else>
        <!-- Celebration hero -->
        <div class="hero">
          <div class="confetti-layer" aria-hidden="true">
            <div v-for="i in 14" :key="i" class="confetti-dot" :class="`confetti-${(i % 4) + 1}`" :style="confettiStyle(i)" />
          </div>
          <div class="hero-eyebrow">WORKOUT COMPLETE</div>
          <div class="hero-xp">+{{ xpEarned }}</div>
          <div class="hero-xp-label">XP EARNED</div>
          <div class="hero-name">{{ log.planName }}</div>
          <div class="hero-date mono">{{ formatDate(log.startedAt) }}</div>
        </div>

        <!-- 3-stat row -->
        <div class="stat-row">
          <div class="stat-card" v-for="s in heroStats" :key="s.label">
            <div class="stat-val">{{ s.value }}<span v-if="s.suffix" class="stat-suffix">{{ s.suffix }}</span></div>
            <div class="stat-lbl">{{ s.label }}</div>
            <div v-if="s.sub" class="stat-sub mono">{{ s.sub }}</div>
          </div>
        </div>

        <!-- Volume + streak row -->
        <div class="wide-row">
          <div class="wide-card">
            <div class="wide-label">TOTAL VOLUME</div>
            <div class="wide-val">
              {{ totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + 'k' : totalVolume }}
              <span class="wide-unit">kg</span>
            </div>
          </div>
          <div class="wide-card wide-card-streak">
            <div class="wide-label">STREAK</div>
            <div class="wide-val wide-val-streak">{{ currentStreak }}<span class="streak-fire">🔥</span></div>
          </div>
        </div>

        <!-- Exercise breakdown -->
        <div class="section-title">BREAKDOWN</div>
        <div class="ex-list">
          <div v-for="ex in log.exercises" :key="ex.uid" class="ex-breakdown-card">
            <div class="ex-breakdown-header">
              <div class="ex-breakdown-left">
                <RouterLink
                  v-if="!isRunningExercise(ex.exerciseId)"
                  :to="{ name: 'exercise-history', params: { id: ex.exerciseId } }"
                  class="ex-breakdown-name"
                >{{ ex.exerciseName }}</RouterLink>
                <span v-else class="ex-breakdown-name">{{ ex.exerciseName }}</span>
                <span v-if="hasPR(ex)" class="pr-chip">NEW PR</span>
              </div>
              <span class="ex-breakdown-chevron">›</span>
            </div>

            <!-- Set rows header -->
            <div class="breakdown-col-header">
              <div>SET</div><div>KG</div><div>REPS</div><div></div>
            </div>

            <!-- Set rows -->
            <div v-for="(set, si) in ex.sets" :key="si" class="breakdown-set-row">
              <div class="bsr-num">{{ si + 1 }}</div>
              <div class="bsr-val" :class="{ accent: set.completed && isSetPR(ex.exerciseId, set) }">
                {{ set.weight != null ? set.weight : '—' }}
              </div>
              <div class="bsr-val" :class="{ accent: set.completed && isSetPR(ex.exerciseId, set) }">
                {{ set.reps != null ? set.reps : '—' }}
              </div>
              <div class="bsr-check" :class="{ done: set.completed, skipped: !set.completed }">
                {{ set.completed ? '✓' : '' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="log.notes" class="notes-card">
          <div class="section-title" style="margin-bottom: 8px">NOTES</div>
          <p class="notes-text">{{ log.notes }}</p>
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
import { useGamificationStore } from '../stores/gamification'
import { formatDate, formatDuration, elapsedSeconds } from '../utils/format'
import { isRunningExercise } from '../data/exercises'
import { computeWorkoutStreak } from '../utils/gamificationDefs'
import type { LoggedExercise, LoggedSet } from '../types'

const props  = defineProps<{ id: string }>()
const router = useRouter()
const store  = useWorkoutsStore()
const gStore = useGamificationStore()

const log = computed(() => store.getLog(props.id))

const currentStreak = computed(() => {
  const completedLogs = store.logs.filter(l => l.completedAt != null)
  return computeWorkoutStreak(completedLogs)
})

const totalSets = computed(() =>
  log.value?.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0) ?? 0
)

const totalVolume = computed(() =>
  log.value?.exercises.reduce((tot, ex) =>
    tot + ex.sets.reduce((st, s) =>
      st + (s.completed && s.weight && s.reps ? s.weight * s.reps : 0), 0), 0) ?? 0
)

const xpEarned = computed(() => Math.round(totalSets.value * 14))

const durationSec = computed(() =>
  log.value?.completedAt ? elapsedSeconds(log.value.startedAt, log.value.completedAt) : 0
)

const heroStats = computed(() => [
  {
    value: log.value?.exercises.length ?? 0,
    label: 'EXERCISES',
    suffix: `/${log.value?.exercises.length ?? 0}`,
    sub: null,
  },
  { value: totalSets.value, label: 'SETS', suffix: null, sub: 'all done' },
  {
    value: Math.round(durationSec.value / 60),
    label: 'MIN',
    suffix: null,
    sub: null,
  },
])

function confettiStyle(i: number) {
  return {
    top:  `${(i * 8) % 80}%`,
    left: `${(i * 9.3) % 95}%`,
    width:  i % 2 ? '10px' : '6px',
    height: i % 2 ? '6px'  : '10px',
    transform: `rotate(${i * 47}deg)`,
  }
}

// ── Personal Records ──────────────────────────────────────────────────────────
function isSetPR(exerciseId: string, set: LoggedSet): boolean {
  if (!set.weight || !set.reps) return false
  const pr = store.prMap.get(exerciseId)
  if (!pr) return false
  const calc = store.e1rm(set.weight, set.reps)
  return Math.abs(calc - pr.e1rm) < 0.01
}

function hasPR(ex: LoggedExercise): boolean {
  return ex.sets.some(s => s.completed && isSetPR(ex.exerciseId, s))
}

function confirmDelete() {
  if (!confirm('Delete this workout log? This cannot be undone.')) return
  store.deleteLog(props.id)
  router.push({ name: 'history' })
}
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────── */
.detail-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
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

/* ── Celebration hero ────────────────────────────────────── */
.hero {
  position: relative;
  text-align: center;
  padding: 12px 20px 20px;
  overflow: hidden;
}

.confetti-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-dot {
  position: absolute;
  border-radius: 1px;
  opacity: 0.7;
}
.confetti-1 { background: var(--accent); }
.confetti-2 { background: var(--hot); }
.confetti-3 { background: var(--flame); }
.confetti-4 { background: var(--cool); }

.hero-eyebrow {
  font-size: 0.6875rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: 0.2em;
  position: relative;
}

.hero-xp {
  font-family: var(--font-display);
  font-size: 4.5rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
  margin-top: 6px;
  background: linear-gradient(180deg, var(--accent), var(--flame));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 16px color-mix(in srgb, var(--accent) 33%, transparent));
  position: relative;
}

.hero-xp-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text);
  margin-top: 2px;
  position: relative;
}

.hero-name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 14px;
  position: relative;
}

.hero-date {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 4px;
  position: relative;
}

/* ── 3-stat row ──────────────────────────────────────────── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.stat-val {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--accent);
}

.stat-suffix {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.stat-lbl {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  margin-top: 6px;
}

.stat-sub {
  font-size: 0.625rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ── Volume + streak row ─────────────────────────────────── */
.wide-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.wide-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.wide-card-streak {
  border-color: color-mix(in srgb, var(--hot) 33%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--hot) 13%, var(--surface)), var(--surface));
}

.wide-label {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.wide-val {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.wide-val-streak { color: var(--hot); }

.wide-unit {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-weight: 500;
  margin-left: 2px;
}

.streak-fire { font-size: 1rem; }

/* ── Exercise breakdown ──────────────────────────────────── */
.section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: 10px;
}

.ex-list { display: flex; flex-direction: column; gap: 8px; }

.ex-breakdown-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.ex-breakdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ex-breakdown-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.ex-breakdown-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px dashed var(--border);
}
a.ex-breakdown-name:active { color: var(--accent); }

.pr-chip {
  font-size: 0.5rem;
  font-weight: 800;
  padding: 2px 5px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 4px;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.ex-breakdown-chevron { font-size: 1rem; color: var(--text-muted); }

/* Set rows header */
.breakdown-col-header {
  display: grid;
  grid-template-columns: 24px 1fr 1fr 24px;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}

.breakdown-set-row {
  display: grid;
  grid-template-columns: 24px 1fr 1fr 24px;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  margin-top: 5px;
}

.bsr-num  { font-weight: 700; color: var(--text-muted); }
.bsr-val  { font-weight: 700; color: var(--text); }
.bsr-val.accent { color: var(--accent); }

.bsr-check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 800;
}
.bsr-check.done    { background: var(--accent); color: var(--accent-ink); }
.bsr-check.skipped { background: var(--bg); border: 1px solid var(--border); }

/* ── Notes ───────────────────────────────────────────────── */
.notes-card {
  margin-top: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.notes-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text);
  margin: 0;
}

.mono { font-family: var(--font-mono); }
</style>
