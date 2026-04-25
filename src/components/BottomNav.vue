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

      <!-- Centre FAB -->
      <div class="nav-fab-wrap">
        <RouterLink
          to="/workout"
          class="nav-fab"
          :class="{ active: route.name === 'workout', 'has-active': !!store.activeWorkout }"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 12L19 12M12 5L12 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <span v-if="store.activeWorkout" class="active-dot" />
        </RouterLink>
      </div>

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
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </span>
        <span class="nav-label">You</span>
        <span v-if="gStore.level >= 1" class="level-chip">{{ gStore.level }}</span>
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
  padding: 10px 12px calc(var(--safe-bottom) + 10px);
  background: linear-gradient(to top, var(--bg) 70%, transparent);
  pointer-events: none;
}

.nav-bar {
  max-width: 480px;
  margin: 0 auto;
  height: 64px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 26px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  pointer-events: auto;
  box-shadow: var(--card-shadow);
  padding: 8px;
  position: relative;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-muted);
  text-decoration: none;
  position: relative;
  transition: color 0.2s;
}

.nav-item.active {
  color: var(--accent);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 26px;
  border-radius: 8px;
  transition: background 0.2s;
}

.nav-item.active .nav-icon {
  background: rgba(212, 255, 58, 0.12);
}

[data-theme="light"] .nav-item.active .nav-icon {
  background: rgba(20, 20, 15, 0.08);
}

.nav-icon svg {
  width: 20px;
  height: 20px;
  transition: transform 0.15s;
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
  font-family: var(--font-ui);
}

/* ── Centre FAB ───────────────────────────────────────────── */
.nav-fab-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-fab {
  position: relative;
  top: -22px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: var(--accent);
  color: var(--accent-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  box-shadow: 0 8px 22px rgba(212, 255, 58, 0.45), 0 0 0 4px var(--bg);
  transition: transform 0.15s, box-shadow 0.15s;
}

.nav-fab:active {
  transform: scale(0.93);
}

.nav-fab.active,
.nav-fab.has-active {
  box-shadow: 0 8px 28px rgba(212, 255, 58, 0.60), 0 0 0 4px var(--bg);
}

[data-theme="light"] .nav-fab {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.20), 0 0 0 4px var(--bg);
}

.active-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--hot);
  border: 2px solid var(--accent);
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.level-chip {
  position: absolute;
  top: 2px;
  right: calc(50% - 18px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.5625rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--bg);
  line-height: 1;
  font-family: var(--font-mono);
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
</style>
