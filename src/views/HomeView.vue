<template>
  <main class="page">
    <div class="page-inner">
      <!-- Header -->
      <div class="home-header">
        <div>
          <p class="greeting text-muted text-sm">{{ greeting }}</p>
          <h1>FormForge</h1>
        </div>
        <div class="logo-mark">
          <img src="/icon.svg" alt="FormForge" />
        </div>
      </div>

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

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card card">
          <span class="stat-value">{{ store.weeklyCount }}</span>
          <span class="stat-label">This week</span>
        </div>
        <div class="stat-card card">
          <span class="stat-value">{{ store.totalWorkouts }}</span>
          <span class="stat-label">Total sessions</span>
        </div>
        <div class="stat-card card">
          <span class="stat-value">{{ store.plans.length }}</span>
          <span class="stat-label">Plans saved</span>
        </div>
      </div>

      <!-- Quick actions -->
      <h2 class="section-title">Quick Start</h2>
      <div class="quick-actions">
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
      <div v-if="store.recentLogs.length > 0">
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDate, formatDuration, elapsedSeconds } from '../utils/format'
import type { WorkoutPlan } from '../types'

const store = useWorkoutsStore()
const router = useRouter()

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

function startPlan(plan: WorkoutPlan) {
  if (store.activeWorkout) {
    if (!confirm('A workout is already in progress. Start a new one?')) return
    store.discardWorkout()
  }
  store.startWorkout(plan)
  router.push({ name: 'workout' })
}
</script>

<style scoped>
.home-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.greeting { margin-bottom: 2px; }

.logo-mark img {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
}

.active-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  text-decoration: none;
  color: var(--text);
  border-color: var(--primary);
  background: var(--primary-dim);
  position: relative;
  overflow: hidden;
}
.banner-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 14px 8px;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}
.stat-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-align: center;
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
</style>
