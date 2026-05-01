import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref<User | null>(null)
  const ready = ref(false)

  const isAnonymous = computed(() => user.value?.isAnonymous ?? false)
  const isSignedIn  = computed(() => !!user.value)
  const email       = computed(() => user.value?.email ?? null)

  /** Call once on app start. Resolves when Firebase has determined auth state. */
  function init(): Promise<void> {
    return new Promise(resolve => {
      onAuthStateChanged(auth, u => {
        user.value = u
        if (!ready.value) {
          ready.value = true
          resolve()
        }
      })
    })
  }

  async function continueAnonymously(): Promise<void> {
    const cred = await signInAnonymously(auth)
    user.value = cred.user
  }

  async function signUp(emailVal: string, password: string): Promise<void> {
    if (user.value?.isAnonymous) {
      // Upgrade anonymous account → keeps same uid so Firestore data is preserved
      const credential = EmailAuthProvider.credential(emailVal, password)
      const result = await linkWithCredential(user.value, credential)
      user.value = result.user
    } else {
      const result = await createUserWithEmailAndPassword(auth, emailVal, password)
      user.value = result.user
    }
  }

  async function signIn(emailVal: string, password: string): Promise<void> {
    const result = await signInWithEmailAndPassword(auth, emailVal, password)
    user.value = result.user
  }

  async function signOut(): Promise<void> {
    await firebaseSignOut(auth)
    user.value = null
  }

  return { user, ready, isAnonymous, isSignedIn, email, init, continueAnonymously, signUp, signIn, signOut }
})
