import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref<User | null>(null)
  const ready = ref(false)

  const isAnonymous = computed(() => user.value?.is_anonymous ?? false)
  const isSignedIn  = computed(() => !!user.value)
  const email       = computed(() => user.value?.email ?? null)

  /** Call once on app start. Resolves once Supabase has determined auth state. */
  function init(): Promise<void> {
    return new Promise(resolve => {
      // Register the listener first so we never miss the INITIAL_SESSION event.
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
        if (!ready.value) {
          ready.value = true
          resolve()
        }
      })
    })
  }

  async function continueAnonymously(): Promise<void> {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    user.value = data.user
  }

  async function signUp(emailVal: string, password: string): Promise<void> {
    if (user.value?.is_anonymous) {
      // Upgrade anonymous account → keeps same uid so DB data is preserved
      const { data, error } = await supabase.auth.updateUser({ email: emailVal, password })
      if (error) throw error
      user.value = data.user
    } else {
      const { data, error } = await supabase.auth.signUp({ email: emailVal, password })
      if (error) throw error
      user.value = data.user
    }
  }

  async function signIn(emailVal: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailVal, password })
    if (error) throw error
    user.value = data.user
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, ready, isAnonymous, isSignedIn, email, init, continueAnonymously, signUp, signIn, signOut }
})
