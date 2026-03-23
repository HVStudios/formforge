<template>
  <div class="app-shell">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <BottomNav v-if="route.name !== 'auth'" />
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
</style>
