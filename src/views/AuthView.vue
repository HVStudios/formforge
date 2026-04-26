<template>
  <div class="auth-page">
    <div class="blob-tl" />
    <div class="blob-br" />

    <div class="auth-inner">
      <!-- Logo lockup -->
      <div class="auth-lockup">
        <svg viewBox="0 0 56 56" width="56" height="56" class="auth-mark">
          <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" fill="var(--accent)"/>
          <polygon points="28,10 46,20 46,36 28,46 10,36 10,20" fill="var(--bg)"/>
          <rect x="16" y="20" width="8" height="2" fill="var(--accent)"/>
          <rect x="16" y="20" width="2" height="14" fill="var(--accent)"/>
          <rect x="16" y="26" width="6" height="2" fill="var(--accent)"/>
          <rect x="26" y="20" width="8" height="2" fill="var(--accent)"/>
          <rect x="26" y="20" width="2" height="14" fill="var(--accent)"/>
          <rect x="26" y="26" width="6" height="2" fill="var(--accent)"/>
        </svg>
        <div class="auth-wordmark">FORMFORGE</div>
      </div>
      <p class="auth-tagline">Track. Level up. Forge the strongest version of yourself.</p>

      <!-- Auth card -->
      <div class="auth-card">
        <div class="auth-card-stripe" />

        <!-- Segmented tabs -->
        <div class="auth-tabs">
          <button class="auth-tab" :class="{ active: mode === 'signup' }" @click="mode = 'signup'">Sign up</button>
          <button class="auth-tab" :class="{ active: mode === 'signin' }" @click="mode = 'signin'">Sign in</button>
        </div>

        <form @submit.prevent="submit" class="auth-form">
          <div class="auth-field">
            <div class="auth-label">EMAIL</div>
            <input
              v-model="emailVal"
              class="auth-input auth-input-mono"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>
          <div class="auth-field">
            <div class="auth-label">PASSWORD</div>
            <div class="auth-pw-wrap" :class="{ focused: pwFocused }">
              <input
                v-model="password"
                class="auth-pw-input auth-input-mono"
                :type="showPw ? 'text' : 'password'"
                :placeholder="mode === 'signup' ? 'Min. 6 characters' : 'Your password'"
                :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
                required
                minlength="6"
                @focus="pwFocused = true"
                @blur="pwFocused = false"
              />
              <button type="button" class="pw-show-btn" @click="showPw = !showPw">
                {{ showPw ? 'HIDE' : 'SHOW' }}
              </button>
            </div>
          </div>

          <div v-if="error" class="auth-error">{{ error }}</div>

          <button type="submit" class="auth-cta" :disabled="loading">
            <span v-if="loading">Please wait…</span>
            <span v-else-if="mode === 'signup'">Create account → +50 XP</span>
            <span v-else>Sign in →</span>
          </button>
        </form>

        <div class="auth-divider">
          <span class="auth-divider-line" />
          <span class="auth-divider-text">OR</span>
          <span class="auth-divider-line" />
        </div>

        <button class="auth-ghost" @click="continueAnon" :disabled="loading">
          CONTINUE WITHOUT ACCOUNT
        </button>
      </div>

      <p class="auth-footer">
        By signing up you agree to
        <span class="auth-footer-link">Terms</span> and
        <span class="auth-footer-link">Privacy</span>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router    = useRouter()

const mode      = ref<'signin' | 'signup'>('signup')
const emailVal  = ref('')
const password  = ref('')
const error     = ref('')
const loading   = ref(false)
const showPw    = ref(false)
const pwFocused = ref(false)

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
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/email-already-in-use':      'An account with this email already exists.',
    'auth/invalid-email':             'Invalid email address.',
    'auth/weak-password':             'Password must be at least 6 characters.',
    'auth/user-not-found':            'No account found with this email.',
    'auth/wrong-password':            'Incorrect password.',
    'auth/invalid-credential':        'Incorrect email or password.',
    'auth/too-many-requests':         'Too many attempts. Please try again later.',
    'auth/credential-already-in-use': 'This email is already linked to another account.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
</script>

<style scoped>
.auth-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  position: relative;
  overflow: hidden;
  padding: 32px 20px 48px;
}

.blob-tl {
  position: absolute;
  top: -80px;
  left: -80px;
  width: 320px;
  height: 320px;
  border-radius: 160px;
  background: color-mix(in srgb, var(--accent) 9%, transparent);
  filter: blur(80px);
  pointer-events: none;
}

.blob-br {
  position: absolute;
  bottom: -40px;
  right: -60px;
  width: 240px;
  height: 240px;
  border-radius: 120px;
  background: color-mix(in srgb, var(--hot) 9%, transparent);
  filter: blur(60px);
  pointer-events: none;
}

.auth-inner {
  position: relative;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Lockup ─────────────────────────────────────────────── */
.auth-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.auth-mark { flex-shrink: 0; }

.auth-wordmark {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text);
  line-height: 1;
}

.auth-tagline {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-align: center;
  max-width: 280px;
  line-height: 1.5;
  margin-bottom: 28px;
}

/* ── Card ───────────────────────────────────────────────── */
.auth-card {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 13%, transparent),
              0 20px 60px color-mix(in srgb, var(--bg) 60%, transparent);
}

.auth-card-stripe {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  opacity: 0.1;
  background: repeating-linear-gradient(45deg, var(--accent) 0 2px, transparent 2px 10px);
  pointer-events: none;
}

/* ── Tabs ───────────────────────────────────────────────── */
.auth-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 18px;
}

.auth-tab {
  flex: 1;
  padding: 10px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.auth-tab.active {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}

/* ── Form ───────────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-label {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.auth-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 0.875rem;
  color: var(--text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.auth-input:focus { border-color: var(--accent); }
.auth-input-mono  { font-family: var(--font-mono); }

/* Password wrapper */
.auth-pw-wrap {
  display: flex;
  align-items: center;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 0 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.auth-pw-wrap.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
}

.auth-pw-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 0.875rem;
  color: var(--text);
  outline: none;
}

.pw-show-btn {
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 0;
  flex-shrink: 0;
  letter-spacing: 0.05em;
}

/* ── CTA ────────────────────────────────────────────────── */
.auth-cta {
  width: 100%;
  background: var(--accent);
  color: var(--accent-ink);
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-family: var(--font-display);
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 33%, transparent);
  transition: opacity 0.15s;
  margin-top: 4px;
}
.auth-cta:disabled   { opacity: 0.5; cursor: not-allowed; }
.auth-cta:active:not(:disabled) { opacity: 0.9; }

/* ── Error ──────────────────────────────────────────────── */
.auth-error {
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  color: var(--danger);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.8125rem;
}

/* ── OR divider ─────────────────────────────────────────── */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.auth-divider-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
.auth-divider-text {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* ── Ghost button ───────────────────────────────────────── */
.auth-ghost {
  width: 100%;
  padding: 12px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.auth-ghost:active:not(:disabled) { border-color: var(--text-muted); color: var(--text); }
.auth-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Footer ─────────────────────────────────────────────── */
.auth-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.5;
}
.auth-footer-link {
  color: var(--text);
  text-decoration: underline;
  cursor: pointer;
}
</style>
