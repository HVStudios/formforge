<template>
  <main class="page">
    <div class="page-inner">
      <!-- Header — design: greeting + avatar -->
      <div class="home-header">
        <div>
          <p class="greeting text-muted text-sm">{{ greeting }}</p>
          <h1 class="home-title">Let's forge it</h1>
        </div>
        <div class="header-actions">
          <button class="account-btn" @click="showAccount = true" :title="authStore.email ?? 'Guest'">
            <div class="avatar-circle">
              {{ authStore.email ? authStore.email.charAt(0).toUpperCase() : 'G' }}
            </div>
            <div v-if="!authStore.isAnonymous" class="avatar-notif" />
          </button>
        </div>
      </div>

      <!-- Level + XP hero card -->
      <RouterLink to="/profile" class="xp-hero card" v-if="gStore.level >= 1">
        <div class="xp-hero-glow" />
        <div class="xp-hero-top">
          <div>
            <div class="xp-hero-lbl">
              <span class="xp-hero-lbl-text">LEVEL</span>
              <span class="xp-hero-num">{{ gStore.level }}</span>
            </div>
            <div class="xp-hero-sub mono">
              <span style="color: var(--text); font-weight: 700">{{ gStore.xp.toLocaleString() }}</span>
              / {{ gStore.xpNextLevel.toLocaleString() }} XP · {{ gStore.xpToNext.toLocaleString() }} to L{{ gStore.level + 1 }}
            </div>
          </div>
        </div>
        <div class="xp-hero-bar">
          <div class="xp-hero-fill" :style="{ width: (gStore.progress * 100).toFixed(1) + '%' }" />
        </div>
      </RouterLink>

      <!-- Account sheet -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showAccount" class="overlay" @click="showAccount = false" />
        </Transition>
        <Transition name="slide-up">
          <div v-if="showAccount" class="sheet account-sheet">
            <div class="sheet-handle" />
            <div class="sheet-header">
              <h3>Account</h3>
            </div>
            <div class="sheet-body">
              <div v-if="authStore.isAnonymous" class="anon-prompt card">
                <p class="text-sm" style="margin-bottom:12px">You're using FormForge as a guest. Create an account to sync your data across devices.</p>
                <RouterLink to="/auth" class="btn btn-primary btn-full" @click="showAccount = false">
                  Create Account / Sign In
                </RouterLink>
              </div>
              <div v-else class="account-info">
                <p class="text-muted text-sm" style="margin-bottom:4px">Signed in as</p>
                <p class="text-sm" style="font-weight:600; margin-bottom:16px">{{ authStore.email }}</p>
              </div>
              <button class="btn btn-danger btn-full" style="margin-top:8px" @click="handleSignOut">
                Sign Out
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Active workout banner -->
      <Transition name="slide-up">
        <RouterLink v-if="store.activeWorkout" to="/workout" class="active-banner card">
          <div class="banner-pulse" />
          <div class="banner-info">
            <span class="text-xs text-muted">Workout in progress</span>
            <span class="banner-name">{{ store.activeWorkout.planName }}</span>
            <span class="text-xs text-primary">{{ elapsedLabel }} · Tap to continue →</span>
          </div>
        </RouterLink>
      </Transition>

      <!-- Stats row — design: streak + this week + volume -->
      <div class="stats-row reveal">
        <div class="stat-card stat-streak card">
          <div class="stat-streak-glow" />
          <div style="position:relative">
            <div style="font-size:1.25rem">🔥</div>
            <span class="stat-value stat-value-hot">{{ currentStreak }}</span>
            <span class="stat-label">DAY STREAK</span>
          </div>
        </div>
        <div class="stat-card card">
          <span class="stat-sub">This week</span>
          <span class="stat-value">{{ store.weeklyCount }}<span class="stat-faint">/5</span></span>
          <span class="stat-label">workouts</span>
        </div>
        <div class="stat-card card">
          <span class="stat-sub">Total</span>
          <span class="stat-value">{{ store.totalWorkouts }}</span>
          <span class="stat-label">sessions</span>
        </div>
      </div>

      <!-- Body weight widget -->
      <div class="bw-widget card reveal reveal-d1" @click="openBwSheet">
        <div class="bw-left">
          <span class="bw-label text-xs text-muted">Body Weight</span>
          <div class="bw-main">
            <span v-if="store.latestWeight" class="bw-value">
              {{ store.latestWeight.kg }}<span class="bw-unit"> kg</span>
            </span>
            <span v-else class="bw-value bw-empty text-muted">—</span>
            <span v-if="bwTrend !== null" class="bw-trend" :class="bwTrend >= 0 ? 'trend-up' : 'trend-down'">
              {{ bwTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(bwTrend).toFixed(1) }} kg
            </span>
          </div>
          <span class="bw-date text-xs text-muted" v-if="store.latestWeight">
            {{ formatDate(store.latestWeight.date) }}
          </span>
        </div>
        <button class="btn btn-ghost bw-log-btn" @click.stop="openBwSheet">Log</button>
      </div>

      <!-- Steps widget -->
      <div class="steps-widget card reveal reveal-d2" @click="showStepsSheet = true">
        <div class="steps-left">
          <span class="steps-label text-xs text-muted">Today's Steps</span>
          <div class="steps-main">
            <span class="steps-value">{{ store.todaySteps.toLocaleString() }}</span>
          </div>
          <div class="steps-goal-bar">
            <div class="steps-goal-fill" :style="{ width: Math.min((store.todaySteps / 10000) * 100, 100) + '%' }" />
          </div>
        </div>
        <button class="btn btn-ghost steps-log-btn" @click.stop="showStepsSheet = true">Log</button>
      </div>

      <StepsSheet v-model="showStepsSheet" />

      <!-- Nutrition tip card -->
      <div class="tip-card card reveal reveal-d3">
        <div class="tip-header">
          <span class="tip-icon">🥗</span>
          <span class="tip-title">Nutrition Tips</span>
          <span class="tip-badge" :class="`tip-badge--${tipData.theme}`">{{ tipData.label }}</span>
        </div>
        <ul class="tip-list">
          <li v-for="tip in tipData.tips" :key="tip" class="tip-item">{{ tip }}</li>
        </ul>
        <RouterLink v-if="!store.nutritionProfile" to="/profile" class="tip-setup-link text-xs text-primary">
          Set up nutrition targets →
        </RouterLink>
      </div>

      <!-- Body weight sheet -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showBwSheet" class="overlay" @click="showBwSheet = false" />
        </Transition>
        <Transition name="slide-up">
          <div v-if="showBwSheet" class="sheet bw-sheet">
            <div class="sheet-handle" />
            <div class="sheet-header">
              <h3>Log Body Weight</h3>
            </div>
            <div class="sheet-body">
              <div class="bw-date-row">
                <label class="bw-date-label text-xs text-muted">Date</label>
                <input
                  v-model="bwDate"
                  type="date"
                  :max="today"
                  class="bw-date-input"
                />
              </div>
              <div class="bw-input-row">
                <input
                  ref="bwInputEl"
                  v-model.number="bwInput"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  placeholder="e.g. 75.5"
                  class="bw-input"
                  @keydown.enter="saveBwEntry"
                />
                <span class="bw-input-unit">kg</span>
              </div>
              <button class="btn btn-primary btn-full mt-12" @click="saveBwEntry" :disabled="!bwInput">
                Save
              </button>

              <!-- Recent entries -->
              <div v-if="store.bodyWeightLog.length > 0" class="bw-recent">
                <div class="bw-recent-title text-xs text-muted">Recent</div>
                <div
                  v-for="entry in [...store.bodyWeightLog].reverse().slice(0, 7)"
                  :key="entry.date"
                  class="bw-recent-row"
                >
                  <span class="text-sm">{{ formatDate(entry.date) }}</span>
                  <span class="bw-recent-val">{{ entry.kg }} kg</span>
                  <button class="bw-del-btn" @click="store.deleteWeightEntry(entry.date)" title="Delete">✕</button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Today's Workout — hero card -->
      <div v-if="store.plans.length > 0" class="reveal reveal-d4">
        <div class="section-label-row">
          <span class="section-label">TODAY</span>
        </div>
        <div class="today-hero" @click="startPlan(store.plans[0])">
          <div class="today-hero-stripes" />
          <div style="position:relative">
            <div class="today-hero-tag">{{ store.plans[0].goal?.toUpperCase() || 'WORKOUT' }}</div>
            <div class="today-hero-name">{{ store.plans[0].name }}</div>
            <div class="today-hero-meta mono">
              {{ store.plans[0].exercises.length }} EXERCISES
              <span style="margin:0 6px">·</span>
              ~{{ store.plans[0].sessionDuration || 45 }} MIN
            </div>
            <div class="today-hero-btn">
              Start workout <span style="font-size:1rem; margin-left:6px">→</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <h2 class="section-title reveal reveal-d4">Quick Start</h2>
      <div class="quick-actions reveal reveal-d4">
        <RouterLink
          v-for="plan in store.plans.slice(0, 3)"
          :key="plan.id"
          class="quick-card card"
          :to="{ name: 'plans' }"
          @click.prevent="startPlan(plan)"
        >
          <span class="quick-icon">💪</span>
          <span class="quick-name">{{ plan.name }}</span>
          <span class="quick-count text-xs text-muted">{{ plan.exercises.length }} exercises</span>
        </RouterLink>

        <RouterLink to="/plans/new" class="quick-card quick-new card">
          <span class="quick-icon">＋</span>
          <span class="quick-name">New Plan</span>
          <span class="quick-count text-xs text-muted">Create a template</span>
        </RouterLink>
      </div>

      <!-- Recent workouts -->
      <div v-if="store.recentLogs.length > 0" class="reveal reveal-d5">
        <div class="flex items-center justify-between section-title">
          <h2>Recent</h2>
          <RouterLink to="/history" class="text-sm text-primary" style="text-decoration:none">See all →</RouterLink>
        </div>
        <div class="recent-list">
          <RouterLink
            v-for="log in store.recentLogs"
            :key="log.id"
            :to="{ name: 'workout-detail', params: { id: log.id } }"
            class="recent-item card"
          >
            <div>
              <div class="recent-name">{{ log.planName }}</div>
              <div class="text-xs text-muted">{{ formatDate(log.startedAt) }} · {{ log.exercises.length }} exercises</div>
            </div>
            <span class="recent-duration text-xs text-muted" v-if="log.completedAt">
              {{ formatDuration(elapsedSeconds(log.startedAt, log.completedAt)) }}
            </span>
          </RouterLink>
        </div>
      </div>

      <!-- Empty first-run CTA -->
      <div v-else-if="store.plans.length === 0" class="first-run card">
        <div style="font-size:2.5rem; margin-bottom:12px">🏋️</div>
        <h2>Welcome to FormForge</h2>
        <p class="text-muted mt-8" style="font-size:0.9375rem">Create your first workout plan and start tracking your progress.</p>
        <RouterLink to="/plans/new" class="btn btn-primary btn-full mt-16">Create First Plan</RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useAuthStore } from '../stores/auth'
import { formatDate, formatDuration, elapsedSeconds } from '../utils/format'
import type { WorkoutPlan } from '../types'
import StepsSheet from '../components/StepsSheet.vue'
import { useGamificationStore } from '../stores/gamification'

const store     = useWorkoutsStore()
const authStore = useAuthStore()
const gStore    = useGamificationStore()
const router    = useRouter()

const showAccount = ref(false)
const showStepsSheet = ref(false)

// ── Body weight ──────────────────────────────────────────────────────────────
const showBwSheet = ref(false)
const bwInput     = ref<number | null>(null)
const bwDate      = ref(new Date().toISOString().slice(0, 10))
const today       = new Date().toISOString().slice(0, 10)
const bwInputEl   = ref<HTMLInputElement | null>(null)

function openBwSheet() {
  bwInput.value = store.latestWeight?.kg ?? null
  bwDate.value  = new Date().toISOString().slice(0, 10)
  showBwSheet.value = true
  nextTick(() => bwInputEl.value?.focus())
}

function saveBwEntry() {
  if (!bwInput.value || bwInput.value <= 0) return
  store.logWeight(bwInput.value, bwDate.value)
  showBwSheet.value = false
  bwInput.value = null
}

/** Weight change vs the entry ~7 days ago */
const bwTrend = computed(() => {
  const log = store.bodyWeightLog
  if (log.length < 2) return null
  const latest = log[log.length - 1]
  const cutoff = new Date(latest.date)
  cutoff.setDate(cutoff.getDate() - 7)
  const old = [...log].reverse().find(e => new Date(e.date) <= cutoff)
  if (!old) return null
  return Math.round((latest.kg - old.kg) * 10) / 10
})

async function handleSignOut() {
  showAccount.value = false
  await authStore.signOut()
  router.replace({ name: 'auth' })
}

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(timer))

const elapsedLabel = computed(() => {
  if (!store.activeWorkout) return ''
  const secs = Math.floor((now.value - new Date(store.activeWorkout.startedAt).getTime()) / 1000)
  return formatDuration(secs)
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

// ── Nutrition tip card ────────────────────────────────────────────────────────
type TipSet = { label: string; theme: string; tips: string[] }

const TIP_SETS: Record<string, TipSet> = {
  cut: {
    label: 'Cutting',
    theme: 'warm',
    tips: [
      'Aim for a 300–500 kcal deficit — larger cuts risk muscle loss.',
      'Keep protein high (≥2g/kg) to preserve muscle while losing fat.',
      'Fill your plate with vegetables — high volume, low calories.',
    ],
  },
  bulk: {
    label: 'Building',
    theme: 'accent',
    tips: [
      'A 200–400 kcal surplus is plenty — more just adds excess fat.',
      'Eat protein every 3–4 hours to maximise muscle protein synthesis.',
      'Prioritise carbs around workouts to fuel performance and recovery.',
    ],
  },
  maintain: {
    label: 'Maintaining',
    theme: 'primary',
    tips: [
      'Match carb intake to your activity level — more on training days.',
      'Keep protein at 1.6–1.8g/kg to support ongoing muscle repair.',
      'Weigh yourself weekly at the same time for consistent tracking.',
    ],
  },
}

const GENERAL_TIPS: TipSet = {
  label: 'General',
  theme: 'dim',
  tips: [
    'Aim for at least 1.6g of protein per kg of bodyweight daily.',
    'Stay hydrated — even mild dehydration impairs performance.',
    'Eat within 1–2 hours of training to support recovery.',
  ],
}

const tipData = computed<TipSet>(() => {
  const np = store.nutritionProfile
  let goal: string | null = np?.goal ?? null

  if (!goal) {
    // Fall back to the most recently updated plan's goal
    const latest = [...store.plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    const planGoal = latest?.goal
    if (planGoal === 'fat-loss') goal = 'cut'
    else if (planGoal === 'strength' || planGoal === 'hypertrophy') goal = 'bulk'
    else if (planGoal === 'endurance' || planGoal === 'mobility' || planGoal === 'general') goal = 'maintain'
  }

  return TIP_SETS[goal ?? ''] ?? GENERAL_TIPS
})

function startPlan(plan: WorkoutPlan) {
  if (store.activeWorkout) {
    if (!confirm('A workout is already in progress. Start a new one?')) return
    store.discardWorkout()
  }
  store.startWorkout(plan)
  router.push({ name: 'workout' })
}

// ── Current streak ───────────────────────────────────────────────────────────
const currentStreak = computed(() => {
  if (store.logs.length === 0) return 0
  const days = new Set(store.logs.map(l => l.startedAt.slice(0, 10)))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const check = (start: Date) => {
    let streak = 0
    const d = new Date(start)
    while (days.has(d.toISOString().slice(0, 10))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }
  if (days.has(today.toISOString().slice(0, 10))) return check(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (days.has(yesterday.toISOString().slice(0, 10))) return check(yesterday)
  return 0
})
</script>

<style scoped>
.home-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.greeting { margin-bottom: 2px; }
.home-title {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--accent), var(--flame));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-ink);
  font-weight: 800;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.avatar-notif {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background: var(--hot);
  border: 2px solid var(--bg);
}

.account-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

/* ── XP Hero card ────────────────────────────────────────────────────────── */
.xp-hero {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  text-decoration: none;
  color: var(--text);
}
.xp-hero-glow {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background: rgba(212, 255, 58, 0.12);
  filter: blur(20px);
  pointer-events: none;
}
.xp-hero-top { position: relative; }
.xp-hero-lbl {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.xp-hero-lbl-text {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.12em;
}
.xp-hero-num {
  font-family: var(--font-display);
  font-size: 2.375rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--accent);
}
.xp-hero-sub {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 6px;
}
.xp-hero-bar {
  position: relative;
  height: 10px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.xp-hero-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent) 70%, var(--flame) 100%);
  border-radius: 999px;
  box-shadow: 0 0 12px rgba(212, 255, 58, 0.5);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.xp-hero-fill::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 40px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: ff-shine 2.4s linear infinite;
}
[data-theme="light"] .xp-hero-fill { box-shadow: none; }

/* ── Stats row ───────────────────────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  position: relative;
  overflow: hidden;
}
.stat-streak { position: relative; }
.stat-streak-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 51, 102, 0.15), transparent);
  pointer-events: none;
}
.stat-sub {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-weight: 600;
}
.stat-value {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--text);
}
.stat-value-hot { color: var(--hot); }
.stat-faint { color: var(--text-faint); font-size: 1rem; }
.stat-label {
  font-size: 0.625rem;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ── Section label row ───────────────────────────────────────────────────── */
.section-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.section-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

/* ── Today hero card ─────────────────────────────────────────────────────── */
.today-hero {
  background: var(--accent);
  border-radius: 22px;
  padding: 18px;
  color: var(--accent-ink);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 14px;
  transition: opacity 0.15s;
}
.today-hero:active { opacity: 0.9; }
.today-hero-stripes {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background: repeating-linear-gradient(45deg, var(--accent-ink) 0 2px, transparent 2px 14px);
  pointer-events: none;
}
.today-hero-tag {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.7;
}
.today-hero-name {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-top: 4px;
  line-height: 1.05;
}
.today-hero-meta {
  display: flex;
  gap: 0;
  margin-top: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
.today-hero-btn {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--accent-ink);
  color: var(--accent);
  padding: 11px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: -0.01em;
}

.account-sheet { z-index: 101; }

.anon-prompt { background: var(--primary-dim); border-color: var(--accent); }

.account-info { padding: 4px 0; }

.active-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  text-decoration: none;
  color: var(--text);
  border-color: var(--accent);
  background: rgba(212, 255, 58, 0.08);
  position: relative;
  overflow: hidden;
}
.banner-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
.banner-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.banner-name {
  font-weight: 700;
  font-size: 1rem;
}

.section-title { margin-bottom: 12px; }

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}
.quick-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  text-decoration: none;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s;
}
.quick-card:active { background: var(--card-hover); }
.quick-icon { font-size: 1.4rem; margin-bottom: 4px; }
.quick-name { font-weight: 600; font-size: 0.9375rem; }
.quick-new { border-style: dashed; border-color: var(--text-dim); }
.quick-new .quick-icon { color: var(--text-dim); font-size: 1.4rem; }

.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s;
}
.recent-item:active { background: var(--card-hover); }
.recent-name { font-weight: 600; margin-bottom: 2px; }

.first-run {
  text-align: center;
  padding: 32px 20px;
  margin-top: 8px;
}

/* ── Steps widget ─────────────────────────────────────────────────────────── */
.steps-widget {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  cursor: pointer;
  transition: background 0.15s;
}
.steps-widget:active { background: var(--card-hover); }

.steps-left { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.steps-label { }
.steps-main { display: flex; align-items: baseline; gap: 6px; }
.steps-value { font-size: 1.5rem; font-weight: 700; color: var(--text); line-height: 1; }

.steps-goal-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
  max-width: 160px;
}
.steps-goal-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--primary));
  border-radius: 2px;
  transition: width 0.3s ease;
}
.steps-log-btn { flex-shrink: 0; }

/* ── Body weight widget ────────────────────────────────────────────────────── */
.bw-widget {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  cursor: pointer;
  transition: background 0.15s;
}
.bw-widget:active { background: var(--card-hover); }

.bw-left { display: flex; flex-direction: column; gap: 2px; }
.bw-label { }
.bw-main  { display: flex; align-items: baseline; gap: 8px; }
.bw-value { font-size: 1.5rem; font-weight: 700; color: var(--text); line-height: 1; }
.bw-unit  { font-size: 1rem; font-weight: 400; color: var(--text-muted); }
.bw-empty { font-size: 1.2rem; }
.bw-date  { margin-top: 1px; }

.bw-trend {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
}
.trend-up   { color: #f87171; background: rgba(248, 113, 113, 0.1); }
.trend-down { color: var(--primary); background: rgba(74, 222, 128, 0.1); }

.bw-log-btn { flex-shrink: 0; }

/* ── Body weight sheet ─────────────────────────────────────────────────────── */
.bw-sheet { z-index: 101; }

.bw-date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.bw-date-label { flex-shrink: 0; }

.bw-date-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.875rem;
  padding: 6px 10px;
  outline: none;
  color-scheme: dark;
}
.bw-date-input:focus { border-color: var(--primary); }

.bw-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bw-input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 700;
  padding: 12px 14px;
  outline: none;
  text-align: right;
}
.bw-input:focus { border-color: var(--primary); }

.bw-input-unit {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-muted);
  min-width: 24px;
}

.bw-recent { margin-top: 20px; }
.bw-recent-title { margin-bottom: 8px; }
.bw-recent-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.bw-recent-row:last-child { border-bottom: none; }
.bw-recent-val { flex: 1; text-align: right; font-weight: 600; font-size: 0.9375rem; }
.bw-del-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 4px 6px;
  border-radius: 4px;
  transition: color 0.15s;
}
.bw-del-btn:active { color: var(--danger); }

/* ── Nutrition tip card ────────────────────────────────────────────────────── */
.tip-card {
  margin-bottom: 20px;
  padding: 14px 16px;
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.tip-icon { font-size: 1rem; flex-shrink: 0; }

.tip-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex: 1;
}

.tip-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
  border: 1.5px solid;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tip-badge--warm    { color: var(--flame);    background: rgba(255, 138, 61, 0.10);   border-color: rgba(255, 138, 61, 0.30); }
.tip-badge--accent  { color: var(--accent);  background: rgba(167,139,250,0.1);  border-color: rgba(167,139,250,0.35); }
.tip-badge--primary { color: var(--primary); background: var(--primary-dim);     border-color: rgba(212, 255, 58, 0.25); }
.tip-badge--dim     { color: var(--text-dim); background: var(--surface);        border-color: var(--border); }

.tip-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.tip-item {
  font-size: 0.875rem;
  color: var(--text-muted);
  padding-left: 16px;
  position: relative;
  line-height: 1.45;
}

.tip-item::before {
  content: '·';
  position: absolute;
  left: 4px;
  color: var(--primary);
  font-size: 1rem;
  line-height: 1.3;
  font-weight: 700;
}

.tip-setup-link {
  display: inline-block;
  margin-top: 10px;
  text-decoration: none;
  font-weight: 600;
}
.tip-setup-link:hover { opacity: 0.8; }
</style>
