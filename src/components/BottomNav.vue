<template>
  <nav class="bottom-nav">
    <div class="nav-bar">
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
          <!-- Dumbbell icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 4v16M18 4v16M6 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M6 12h12"/>
          </svg>
        </span>
        <span class="nav-label">Workout</span>
        <span v-if="store.activeWorkout" class="active-dot" />
      </RouterLink>

      <RouterLink to="/history" class="nav-item" :class="{ active: route.name === 'history' || route.name === 'workout-detail' || route.name === 'exercise-history' }">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </span>
        <span class="nav-label">History</span>
      </RouterLink>

      <RouterLink to="/profile" class="nav-item" :class="{ active: route.name === 'profile' }">
        <span class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </span>
        <span class="nav-label">Profile</span>
        <span v-if="gStore.level > 1 || gStore.achievements.length > 0" class="level-chip">{{ gStore.level }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useGamificationStore } from '../stores/gamification'

const route  = useRoute()
const store  = useWorkoutsStore()
const gStore = useGamificationStore()
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 0 12px calc(var(--safe-bottom) + 8px);
  pointer-events: none;
}

.nav-bar {
  max-width: 480px;
  margin: 0 auto;
  height: 64px;
  background: rgba(11, 15, 30, 0.92);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 22px;
  display: flex;
  align-items: stretch;
  pointer-events: auto;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.04) inset;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-dim);
  text-decoration: none;
  position: relative;
  transition: color 0.2s;
}

.nav-item.active {
  color: var(--primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
  border-radius: 10px;
  transition: background 0.2s;
}

.nav-item.active .nav-icon {
  background: var(--primary-dim);
}

.nav-icon svg {
  width: 22px;
  height: 22px;
  transition: transform 0.15s;
}

.nav-item:active .nav-icon svg {
  transform: scale(0.84);
}

@keyframes nav-icon-pop {
  0%   { transform: scale(0.78); }
  60%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}

.nav-item.active .nav-icon svg {
  animation: nav-icon-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* Workout button — glowing pill */
.nav-workout .workout-icon {
  width: 52px;
  height: 34px;
  background: var(--primary-dim);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 12px;
  transition: all 0.2s;
}

.nav-workout.active .workout-icon,
.nav-workout.has-active .workout-icon {
  background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
  border-color: transparent;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.45);
}

.nav-workout.active svg,
.nav-workout.has-active svg {
  color: #001a2e;
}

.active-dot {
  position: absolute;
  top: 4px;
  right: calc(50% - 16px);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--surface);
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.60);
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.level-chip {
  position: absolute;
  top: 4px;
  right: calc(50% - 16px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #fbbf24;
  color: #1a0e00;
  font-size: 0.5625rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--surface);
  line-height: 1;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
