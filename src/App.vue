<template>
  <div class="app-shell">
    <router-view v-slot="{ Component }">
      <transition name="page">
        <component :is="Component" :key="route.name" />
      </transition>
    </router-view>
    <BottomNav v-if="route.name !== 'auth'" />
    <AchievementToast />

    <!-- Sync error toast -->
    <Transition name="toast">
      <div v-if="workoutsStore.syncError" class="sync-toast">
        ⚠ {{ workoutsStore.syncError }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { watch, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav          from './components/BottomNav.vue'
import AchievementToast   from './components/AchievementToast.vue'
import { useAuthStore }         from './stores/auth'
import { useWorkoutsStore }     from './stores/workouts'
import { useGamificationStore } from './stores/gamification'

const route            = useRoute()
const authStore        = useAuthStore()
const workoutsStore    = useWorkoutsStore()
const gamificationStore = useGamificationStore()

// ── Light mode toggle ─────────────────────────────────────────────────────
// Persisted in localStorage. ProfileView reads/writes this via data-theme on <html>.
onMounted(() => {
  const saved = localStorage.getItem('ff_theme')
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  }
})

// Load / clear data on auth state change
watch(
  () => authStore.user,
  async user => {
    if (user) {
      try {
        await workoutsStore.loadFromFirestore(user.uid)
      } catch (err) {
        console.error('Firestore load failed, using local data:', err)
      }
      try {
        await gamificationStore.loadFromFirestore(user.uid)
        await gamificationStore.evaluate()
      } catch (err) {
        console.error('Gamification load failed:', err)
      }
    } else {
      workoutsStore.clearData()
      gamificationStore.clearData()
    }
  },
  { immediate: true },
)

// Re-evaluate whenever relevant workout data changes
const dataSnapshot = computed(() => ({
  l: workoutsStore.logs.length,
  p: workoutsStore.plans.length,
  s: workoutsStore.stepEntries.length,
  b: workoutsStore.bodyWeightLog.length,
  r: workoutsStore.prMap.size,
}))

watch(dataSnapshot, async () => {
  if (authStore.user && gamificationStore._loaded) {
    await gamificationStore.evaluate()
  }
})
</script>

<style scoped>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sync-toast {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom) + 12px);
  left: 16px;
  right: 16px;
  max-width: 480px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--hot);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--hot);
  text-align: center;
  z-index: 200;
  pointer-events: none;
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
