<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <div>
          <h1>Plans</h1>
          <p class="text-xs text-muted" style="margin-top:2px">{{ store.plans.length }} saved</p>
        </div>
        <div class="header-actions">
          <RouterLink to="/plans/new" class="header-icon-btn">
            <span style="font-size:1rem">+</span>
          </RouterLink>
        </div>
      </div>

      <!-- AI generate hero -->
      <div class="ai-hero" @click="$router.push('/plans/generate')">
        <div class="ai-hero-watermark">AI</div>
        <div class="ai-hero-chip">✦ NEW</div>
        <div class="ai-hero-title">Forge a plan,<br/>built for your goals</div>
        <div class="ai-hero-sub">Tell us your goal. Get a 12-week plan in seconds.</div>
        <div class="ai-hero-btn">✦ Generate with AI</div>
      </div>

      <div v-if="store.plans.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No workout plans yet.</p>
        <div class="empty-actions">
          <RouterLink to="/plans/generate" class="btn btn-outline">✨ Generate with AI</RouterLink>
          <RouterLink to="/plans/new" class="btn btn-primary">Create Manually</RouterLink>
        </div>
      </div>

      <!-- Plans grid — 2 col with pattern headers -->
      <div v-else class="plans-grid">
        <div v-for="(plan, i) in store.plans" :key="plan.id" class="plan-tile">
          <!-- Pattern header -->
          <div class="plan-tile-header" :style="{ background: planColor(plan, i) }">
            <div class="plan-tile-pattern" :class="'pattern-' + (i % 4)" />
            <div v-if="i === 0" class="plan-tile-tag">● ACTIVE</div>
            <div class="plan-tile-num">{{ String(i + 1).padStart(2, '0') }}</div>
          </div>
          <div class="plan-tile-body">
            <div class="plan-tile-name">{{ plan.name }}</div>
            <div class="plan-tile-sub text-xs text-muted">
              {{ plan.goal ? GOAL_META[plan.goal]?.label : '' }}{{ plan.goal && plan.description ? ' · ' : '' }}{{ plan.description || '' }}
            </div>
            <div class="plan-tile-stats mono">
              <span><span class="plan-tile-stat-val">{{ plan.daysPerWeek || '—' }}</span>D</span>
              <span><span class="plan-tile-stat-val">{{ plan.exercises.length }}</span> EX</span>
            </div>
            <div class="plan-tile-actions">
              <button class="btn btn-primary btn-sm" style="flex:1" @click="startPlan(plan)">Start</button>
              <button class="btn btn-outline btn-sm" @click="router.push({ name: 'plan-edit', params: { id: plan.id } })">Edit</button>
              <button class="plan-tile-del" @click="confirmDelete(plan)" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDate } from '../utils/format'
import type { WorkoutPlan, PlanGoal, PlanDifficulty } from '../types'

const GOAL_META: Record<PlanGoal, { label: string; icon: string }> = {
  strength:    { label: 'Strength',    icon: '🏋️' },
  hypertrophy: { label: 'Hypertrophy', icon: '💪' },
  endurance:   { label: 'Endurance',   icon: '🏃' },
  'fat-loss':  { label: 'Fat Loss',    icon: '🔥' },
  mobility:    { label: 'Mobility',    icon: '🧘' },
  general:     { label: 'General',     icon: '⭐' },
}

const PLAN_COLORS = [
  'var(--accent)',
  'var(--hot)',
  'var(--cool)',
  'var(--flame)',
]

const store = useWorkoutsStore()
const router = useRouter()

function planColor(_plan: WorkoutPlan, index: number) {
  return PLAN_COLORS[index % PLAN_COLORS.length]
}

function startPlan(plan: WorkoutPlan) {
  if (store.activeWorkout) {
    if (!confirm('A workout is already in progress. Start a new one?')) return
    store.discardWorkout()
  }
  store.startWorkout(plan)
  router.push({ name: 'workout' })
}

function confirmDelete(plan: WorkoutPlan) {
  if (confirm(`Delete "${plan.name}"? This cannot be undone.`)) {
    store.deletePlan(plan.id)
  }
}
</script>

<style scoped>
.header-actions { display: flex; gap: 8px; }

.header-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--text);
  font-family: var(--font-display);
  font-weight: 700;
}

/* ── AI hero banner ──────────────────────────────────────────────────────── */
.ai-hero {
  background: linear-gradient(135deg, var(--accent) 0%, var(--flame) 120%);
  border-radius: 22px;
  padding: 18px;
  color: var(--accent-ink);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 14px;
}
.ai-hero:active { opacity: 0.92; }
.ai-hero-watermark {
  position: absolute;
  top: 14px;
  right: 14px;
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 800;
  opacity: 0.12;
  line-height: 1;
  letter-spacing: -0.05em;
}
.ai-hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--accent-ink);
  color: var(--accent);
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.ai-hero-title {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: 12px;
  line-height: 1.1;
}
.ai-hero-sub {
  font-size: 0.75rem;
  margin-top: 6px;
  opacity: 0.75;
  font-weight: 500;
}
.ai-hero-btn {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-ink);
  color: var(--accent);
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.8125rem;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 16px auto 0;
  width: 100%;
  max-width: 260px;
}

/* ── Plans 2-col grid ────────────────────────────────────────────────────── */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.plan-tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
}

.plan-tile-header {
  height: 84px;
  position: relative;
  overflow: hidden;
}

.plan-tile-pattern {
  position: absolute;
  inset: 0;
}
.pattern-0 {
  background: repeating-linear-gradient(45deg, currentColor 0 8px, transparent 8px 12px);
  opacity: 0.15;
  color: var(--bg);
}
.pattern-1 {
  background: radial-gradient(var(--bg) 2px, transparent 2px);
  background-size: 12px 12px;
  opacity: 0.2;
}
.pattern-2 {
  background-image:
    linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px);
  background-size: 14px 14px;
}
.pattern-3 {
  opacity: 0.15;
}

.plan-tile-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  background: var(--bg);
  color: var(--accent);
  border-radius: 6px;
  font-size: 0.5625rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.plan-tile-num {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  color: var(--bg);
  letter-spacing: -0.04em;
  opacity: 0.6;
  line-height: 1;
}

.plan-tile-body {
  padding: 12px;
}

.plan-tile-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  line-height: 1.15;
}

.plan-tile-sub {
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-tile-stats {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  font-size: 0.625rem;
  color: var(--text-muted);
  font-weight: 600;
}
.plan-tile-stat-val {
  color: var(--text);
  font-size: 0.75rem;
}

.plan-tile-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 10px;
}

.plan-tile-del {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.plan-tile-del:active { color: var(--danger); border-color: var(--danger); }
</style>
