<template>
  <div class="app-shell">
    <router-view v-slot="{ Component }">
      <transition name="page">
        <component :is="Component" :key="route.name" />
      </transition>
    </router-view>
    <BottomNav v-if="route.name !== 'auth'" />

    <!-- Sync error toast -->
    <Transition name="toast">
      <div v-if="workoutsStore.syncError" class="sync-toast">
        ⚠ {{ workoutsStore.syncError }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav        from './components/BottomNav.vue'
import { useAuthStore }     from './stores/auth'
import { useWorkoutsStore } from './stores/workouts'

const route         = useRoute()
const authStore     = useAuthStore()
const workoutsStore = useWorkoutsStore()

// Whenever auth state resolves to a user, load their data from Firestore.
// Whenever they sign out, clear local data.
watch(
  () => authStore.user,
  async user => {
    if (user) {
      try {
        await workoutsStore.loadFromFirestore(user.uid)
      } catch (err) {
        console.error('Firestore load failed, using local data:', err)
      }
    } else {
      workoutsStore.clearData()
    }
  },
  { immediate: true },
)
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
  bottom: calc(var(--nav-height, 64px) + var(--safe-bottom, 0px) + 12px);
  left: 16px;
  right: 16px;
  background: #7f1d1d;
  color: #fca5a5;
  border: 1px solid #b91c1c;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  z-index: 200;
  pointer-events: none;
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
