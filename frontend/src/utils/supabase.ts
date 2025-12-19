import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://agqpfpzsxqbrqyjiqtiy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncXBmcHpzeHFicnF5amlxdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjc3MTksImV4cCI6MjA4MTY0MzcxOX0.keYcyd0FViLtxH2DvlH8Ce4EglzGoTSC7via74SE52o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-agqpfpzsxqbrqyjiqtiy-auth-token',
    // Handle refresh token errors gracefully
    flowType: 'pkce'
  }
})

// Helper function to clear invalid sessions
export function clearInvalidSessions() {
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

