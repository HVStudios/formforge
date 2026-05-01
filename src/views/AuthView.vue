<template>
  <div class="auth-page">
    <div class="auth-card card">
      <!-- Logo -->
      <div class="auth-logo">
        <img src="/icon.svg" alt="FormForge" />
        <h1>FormForge</h1>
        <p class="text-muted text-sm">Track your workouts, anywhere.</p>
      </div>

      <!-- Tab toggle -->
      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: mode === 'signup' }" @click="mode = 'signup'">Sign Up</button>
        <button class="auth-tab" :class="{ active: mode === 'signin' }" @click="mode = 'signin'">Sign In</button>
      </div>

      <!-- Email / password form -->
      <form @submit.prevent="submit" class="auth-form">
        <div class="field">
          <label class="label">Email</label>
          <input
            v-model="emailVal"
            class="input"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>
        <div class="field">
          <label class="label">Password</label>
          <input
            v-model="password"
            class="input"
            type="password"
            :placeholder="mode === 'signup' ? 'Min. 6 characters' : 'Your password'"
            :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            required
            minlength="6"
          />
        </div>

        <div v-if="error" class="auth-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading">Please wait…</span>
          <span v-else-if="mode === 'signup'">Create Account</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="auth-divider"><span class="text-muted text-xs">or</span></div>

      <button class="btn btn-outline btn-full" @click="continueAnon" :disabled="loading">
        Continue without account
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router    = useRouter()

const mode     = ref<'signin' | 'signup'>('signup')
const emailVal = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    if (mode.value === 'signup') {
      await authStore.signUp(emailVal.value, password.value)
    } else {
      await authStore.signIn(emailVal.value, password.value)
    }
    router.replace({ name: 'home' })
  } catch (e: unknown) {
    error.value = friendlyError(e)
  } finally {
    loading.value = false
  }
}

async function continueAnon() {
  error.value   = ''
  loading.value = true
  try {
    await authStore.continueAnonymously()
    router.replace({ name: 'home' })
  } catch {
    error.value   = 'Something went wrong. Please try again.'
    loading.value = false
  }
}

function friendlyError(e: unknown): string {
  const msg = ((e as { message?: string })?.message ?? '').toLowerCase()
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists'))
    return 'An account with this email already exists.'
  if (msg.includes('invalid email'))
    return 'Invalid email address.'
  if (msg.includes('password') && (msg.includes('least') || msg.includes('short') || msg.includes('weak')))
    return 'Password must be at least 6 characters.'
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('email not confirmed'))
    return 'Incorrect email or password.'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Too many attempts. Please try again later.'
  if (msg.includes('email address cannot be used'))
    return 'This email is already linked to another account.'
  return 'Something went wrong. Please try again.'
}
</script>

<style scoped>
.auth-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--bg);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 28px 24px;
}

.auth-logo {
  text-align: center;
  margin-bottom: 24px;
}
.auth-logo img {
  width: 56px;
  height: 56px;
  border-radius: var(--radius);
  margin-bottom: 10px;
}
.auth-logo h1 { margin-bottom: 4px; }

.auth-tabs {
  display: flex;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 4px;
  margin-bottom: 20px;
  gap: 4px;
}
.auth-tab {
  flex: 1;
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.auth-tab.active {
  background: var(--card);
  color: var(--text);
}

.auth-form { margin-bottom: 16px; }

.auth-error {
  background: var(--danger-dim);
  color: var(--danger);
  border-radius: var(--radius);
  padding: 10px 12px;
  font-size: 0.875rem;
  margin-bottom: 12px;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

</style>
