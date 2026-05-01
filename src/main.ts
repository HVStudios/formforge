import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Resolve Firebase auth state before mounting so the router guard has a user
// reference on the very first navigation.
const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
})
