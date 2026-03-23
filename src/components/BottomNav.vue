<template>
  <nav class="bottom-nav">
    <RouterLink to="/" class="nav-item" :class="{ active: route.name === 'home' }">
      <span class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </span>
      <span class="nav-label">Home</span>
    </RouterLink>

    <RouterLink to="/plans" class="nav-item" :class="{ active: route.name === 'plans' || route.name === 'plan-new' || route.name === 'plan-edit' }">
      <span class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      </span>
      <span class="nav-label">Plans</span>
    </RouterLink>

    <RouterLink
      to="/workout"
      class="nav-item nav-workout"
      :class="{ active: route.name === 'workout', 'has-active': !!store.activeWorkout }"
    >
      <span class="nav-icon workout-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="2"/>
          <path d="M6.343 6.343a8 8 0 1 0 11.314 11.314"/>
          <path d="M17.657 6.343A8 8 0 0 1 19 12"/>
          <line x1="4" y1="4" x2="4" y2="8"/>
          <line x1="4" y1="4" x2="8" y2="4"/>
          <line x1="20" y1="20" x2="20" y2="16"/>
          <line x1="20" y1="20" x2="16" y2="20"/>
        </svg>
      </span>
      <span class="nav-label">Workout</span>
      <span v-if="store.activeWorkout" class="active-dot" />
    </RouterLink>

    <RouterLink to="/history" class="nav-item" :class="{ active: route.name === 'history' || route.name === 'workout-detail' }">
      <span class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </span>
      <span class="nav-label">History</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'

const route = useRoute()
const store = useWorkoutsStore()
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(var(--nav-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: stretch;
  z-index: 50;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-dim);
  text-decoration: none;
  position: relative;
  transition: color 0.15s;
}

.nav-item.active {
  color: var(--primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Workout button is special – rounded pill shape */
.nav-workout .workout-icon {
  width: 48px;
  height: 36px;
  background: var(--primary-dim);
  border-radius: 18px;
  transition: background 0.2s;
}

.nav-workout.active .workout-icon,
.nav-workout.has-active .workout-icon {
  background: var(--primary);
}

.nav-workout.active svg,
.nav-workout.has-active svg {
  color: #0d0d0d;
}

.active-dot {
  position: absolute;
  top: 6px;
  right: calc(50% - 14px);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--surface);
}
</style>
