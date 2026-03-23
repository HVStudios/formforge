<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>My Plans</h1>
        <div class="header-actions">
          <RouterLink to="/plans/generate" class="btn btn-outline btn-sm">✨ AI</RouterLink>
          <RouterLink to="/plans/new" class="btn btn-primary btn-sm">+ New</RouterLink>
        </div>
      </div>

      <div v-if="store.plans.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No workout plans yet.</p>
        <div class="empty-actions">
          <RouterLink to="/plans/generate" class="btn btn-outline">✨ Generate with AI</RouterLink>
          <RouterLink to="/plans/new" class="btn btn-primary">Create Manually</RouterLink>
        </div>
      </div>

      <div v-else class="plans-list">
        <div v-for="plan in store.plans" :key="plan.id" class="plan-card card">
          <div class="plan-info">
            <h2 class="plan-name">{{ plan.name }}</h2>
            <p v-if="plan.description" class="text-sm text-muted plan-desc">{{ plan.description }}</p>
            <div class="plan-meta">
              <span class="badge badge-green">{{ plan.exercises.length }} exercises</span>
              <span class="text-xs text-muted">Updated {{ formatDate(plan.updatedAt) }}</span>
            </div>
          </div>
          <div class="plan-actions">
            <button class="btn btn-primary btn-sm" @click="startPlan(plan)">Start</button>
            <button class="btn btn-outline btn-sm" @click="router.push({ name: 'plan-edit', params: { id: plan.id } })">Edit</button>
            <button class="btn btn-ghost btn-icon" @click="confirmDelete(plan)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
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
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { formatDate } from '../utils/format'
import type { WorkoutPlan } from '../types'

const store = useWorkoutsStore()
const router = useRouter()

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
.header-actions {
  display: flex;
  gap: 8px;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  width: 100%;
  max-width: 260px;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.plan-desc {
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.plan-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.plan-actions .btn-primary { flex: 1; }
.plan-actions .btn-outline { flex: 1; }
.plan-actions .btn-ghost { margin-left: auto; color: var(--danger); }
.plan-actions .btn-ghost:hover { background: var(--danger-dim); color: var(--danger); }
</style>
