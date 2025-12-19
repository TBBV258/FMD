import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://agqpfpzsxqbrqyjiqtiy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncXBmcHpzeHFicnF5amlxdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjc3MTksImV4cCI6MjA4MTY0MzcxOX0.keYcyd0FViLtxH2DvlH8Ce4EglzGoTSC7via74SE52o'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-agqpfpzsxqbrqyjiqtiy-auth-token',
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper function to clear invalid sessions
export function clearInvalidSessions() {
  if (typeof window === 'undefined') return
  
  const sessionKeys = [
    'fmd_session',
    'sb-agqpfpzsxqbrqyjiqtiy-auth-token'
  ]
  
  sessionKeys.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      // Ignore errors
    }
  })
}

// Helper function to check if error is related to refresh token
export function isRefreshTokenError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = (error.message || error.toString() || '').toLowerCase()
  return errorMessage.includes('invalid refresh token') || 
         errorMessage.includes('refresh token not found') ||
         errorMessage.includes('jwt') ||
         (error.status === 400 && errorMessage.includes('refresh'))
}

// Listen for auth state changes and handle refresh token errors
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      clearInvalidSessions()
    }
    
    // Handle token refresh errors
    if (event === 'TOKEN_REFRESHED' && !session) {
      // Token refresh failed, clear everything
      clearInvalidSessions()
    }
  })

  // Global error handler for unhandled auth errors
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    if (isRefreshTokenError(error)) {
      clearInvalidSessions()
      // Prevent the error from being logged to console
      event.preventDefault()
    }
  })
}

// Auth helpers
export const auth = {
  async signUp(email: string, password: string, userData: any) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
  },

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  async signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
  },

  async signOut() {
    return await supabase.auth.signOut()
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
  }
}

export default supabase

