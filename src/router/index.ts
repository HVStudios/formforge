import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView             from '../views/HomeView.vue'
import PlansView            from '../views/PlansView.vue'
import EditPlanView         from '../views/EditPlanView.vue'
import GenerateRoutineView  from '../views/GenerateRoutineView.vue'
import ActiveWorkoutView    from '../views/ActiveWorkoutView.vue'
import HistoryView          from '../views/HistoryView.vue'
import WorkoutDetailView    from '../views/WorkoutDetailView.vue'
import AuthView             from '../views/AuthView.vue'
import { useAuthStore }  from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/auth',               name: 'auth',           component: AuthView },
    { path: '/',                   name: 'home',           component: HomeView,          meta: { requiresAuth: true } },
    { path: '/plans',              name: 'plans',          component: PlansView,         meta: { requiresAuth: true } },
    { path: '/plans/new',          name: 'plan-new',       component: EditPlanView,         meta: { requiresAuth: true } },
    { path: '/plans/generate',     name: 'plan-generate',  component: GenerateRoutineView,  meta: { requiresAuth: true } },
    { path: '/plans/:id/edit',     name: 'plan-edit',      component: EditPlanView,      meta: { requiresAuth: true }, props: true },
    { path: '/workout',            name: 'workout',        component: ActiveWorkoutView, meta: { requiresAuth: true } },
    { path: '/history',            name: 'history',        component: HistoryView,       meta: { requiresAuth: true } },
    { path: '/history/:id',        name: 'workout-detail', component: WorkoutDetailView, meta: { requiresAuth: true }, props: true },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(to => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isSignedIn) return { name: 'auth' }
  if (to.name === 'auth'    &&  auth.isSignedIn) return { name: 'home' }
})

export default router
