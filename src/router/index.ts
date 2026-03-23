import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PlansView from '../views/PlansView.vue'
import EditPlanView from '../views/EditPlanView.vue'
import ActiveWorkoutView from '../views/ActiveWorkoutView.vue'
import HistoryView from '../views/HistoryView.vue'
import WorkoutDetailView from '../views/WorkoutDetailView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',               name: 'home',           component: HomeView },
    { path: '/plans',          name: 'plans',          component: PlansView },
    { path: '/plans/new',      name: 'plan-new',       component: EditPlanView },
    { path: '/plans/:id/edit', name: 'plan-edit',      component: EditPlanView, props: true },
    { path: '/workout',        name: 'workout',        component: ActiveWorkoutView },
    { path: '/history',        name: 'history',        component: HistoryView },
    { path: '/history/:id',    name: 'workout-detail', component: WorkoutDetailView, props: true },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
