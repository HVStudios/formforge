<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div v-if="store.pendingToast" class="achievement-toast" @click="store.dismissToast()">
        <span class="toast-icon">{{ store.pendingToast.icon }}</span>
        <div class="toast-body">
          <span class="toast-title">{{ store.pendingToast.title }}</span>
          <span class="toast-sub">Achievement unlocked · +{{ store.pendingToast.xp }} XP</span>
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
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 16px;
  right: 16px;
  max-width: 480px;
  margin: 0 auto;
  background: rgba(10, 15, 30, 0.96);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 32px rgba(0,0,0,0.5), 0 0 20px rgba(251, 191, 36, 0.15);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 300;
  cursor: pointer;
  touch-action: manipulation;
}

.toast-icon {
  font-size: 2rem;
  flex-shrink: 0;
  line-height: 1;
}

.toast-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text);
}

.toast-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.toast-xp {
  font-size: 1rem;
  font-weight: 800;
  color: #fbbf24;
  flex-shrink: 0;
}

/* Animation */
.toast-slide-enter-active { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease; }
.toast-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.18s ease; }
.toast-slide-enter-from   { transform: translateY(-80px); opacity: 0; }
.toast-slide-leave-to     { transform: translateY(-80px); opacity: 0; }
</style>
