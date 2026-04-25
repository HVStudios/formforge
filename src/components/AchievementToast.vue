<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div v-if="store.pendingToast" class="achievement-toast" @click="store.dismissToast()">
        <div class="toast-icon-wrap">
          <span class="toast-icon">{{ store.pendingToast.icon }}</span>
        </div>
        <div class="toast-body">
          <span class="toast-label">ACHIEVEMENT UNLOCKED</span>
          <span class="toast-title">{{ store.pendingToast.title }}</span>
          <span class="toast-sub">+{{ store.pendingToast.xp }} XP earned</span>
        </div>
        <span class="toast-xp">+{{ store.pendingToast.xp }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useGamificationStore } from '../stores/gamification'
const store = useGamificationStore()
</script>

<style scoped>
.achievement-toast {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom) + 12px);
  left: 16px;
  right: 16px;
  max-width: 480px;
  margin: 0 auto;
  background: var(--text);
  color: var(--bg);
  border-radius: 22px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 300;
  cursor: pointer;
  touch-action: manipulation;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--accent);
}

.toast-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent);
  color: var(--accent-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toast-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.toast-label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  font-family: var(--font-ui);
}

.toast-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--bg);
}

.toast-sub {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-muted);
}

.toast-xp {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--accent);
  flex-shrink: 0;
  letter-spacing: -0.02em;
}

/* Animation */
.toast-slide-enter-active { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease; }
.toast-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.18s ease; }
.toast-slide-enter-from   { transform: translateY(80px); opacity: 0; }
.toast-slide-leave-to     { transform: translateY(80px); opacity: 0; }
</style>
