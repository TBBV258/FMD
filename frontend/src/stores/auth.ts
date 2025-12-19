import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserProfile, AuthSession } from '@/types'
import { supabase, clearInvalidSessions, isRefreshTokenError } from '@/utils/supabase'
import { calculateRank } from '@/utils/pointsSystem'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const session = ref<AuthSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!session.value)
  const userId = computed(() => user.value?.id || null)

  // Actions
  async function signIn(email: string, password: string) {
    isLoading.value = true
    error.value = null
    
    try {
      // Clear any invalid sessions before signing in
      clearInvalidSessions()
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) {
        // Check if it's a refresh token error (shouldn't happen on sign in, but handle it)
        if (isRefreshTokenError(signInError)) {
          await clearInvalidSession()
        }
        throw signInError
      }
      
      if (data.user && data.session) {
        user.value = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at || new Date().toISOString()
        }
        
        session.value = {
          user: user.value,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0
        }
        
        // Load user profile
        await loadProfile()
        
        // Save to localStorage
        localStorage.setItem('fmd_session', JSON.stringify(session.value))
      }
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Erro ao fazer login'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function signUp(email: string, password: string, userData: { fullName: string; phoneNumber?: string; country?: string }) {
    isLoading.value = true
    error.value = null
    
    console.log('signUp called with:', { email, password: '***', userData })
    
    try {
      // Clear any invalid sessions before signing up
      clearInvalidSessions()
      
      console.log('Calling supabase.auth.signUp...')
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: userData.fullName,
            phone_number: userData.phoneNumber || '',
            country: userData.country || 'MZ'
          }
        }
      })
      
      console.log('supabase.auth.signUp response:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        error: signUpError 
      })
      
      if (signUpError) {
        console.error('SignUp error:', signUpError)
        throw signUpError
      }
      
      // Check if it's a refresh token error (shouldn't happen on signup, but handle it)
      if (isRefreshTokenError(signUpError)) {
        await clearInvalidSession()
      }
      
      // Profile will be created automatically by the trigger
      // No manual profile creation needed
      
      console.log('SignUp successful')
      return { success: true, data }
    } catch (err: any) {
      console.error('SignUp exception:', err)
      const errorMessage = err.message || 'Erro ao criar conta'
      error.value = errorMessage
      
      // Provide user-friendly error messages
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        userFriendlyMessage = 'Este email já está registrado. Tente fazer login.'
      } else if (errorMessage.includes('invalid email')) {
        userFriendlyMessage = 'Email inválido. Por favor, verifique o email.'
      } else if (errorMessage.includes('password')) {
        userFriendlyMessage = 'A senha não atende aos requisitos mínimos.'
      }
      
      return { success: false, error: userFriendlyMessage }
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      
      user.value = null
      profile.value = null
      session.value = null
      localStorage.removeItem('fmd_session')
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Erro ao sair'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function loadProfile() {
    if (!user.value) return
    
    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (profileError) throw profileError
      
      if (data) {
        profile.value = data as UserProfile
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
    }
  }

  async function createProfile(userId: string, userData: { fullName: string; phoneNumber?: string; country?: string }) {
    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: userId,
          full_name: userData.fullName,
          phone_number: userData.phoneNumber || '',
          country: userData.country || 'MZ',
          points: 0,
          document_count: 0,
          plan: 'free'
        }])
        .select()
        .single()
      
      if (profileError) throw profileError
      
      if (data) {
        profile.value = data as UserProfile
      }
    } catch (err: any) {
      console.error('Error creating profile:', err)
    }
  }

  async function checkSession() {
    isLoading.value = true
    
    try {
      // First, try to get session from Supabase (this handles refresh automatically)
      const { data, error: sessionError } = await supabase.auth.getSession()
      
      // If there's an error related to refresh token, clear everything
      if (sessionError && isRefreshTokenError(sessionError)) {
        await clearInvalidSession()
        return
      }
      
      if (data.session) {
        // Verify session is not expired
        const expiresAt = data.session.expires_at
        const isExpired = expiresAt && expiresAt * 1000 < Date.now()
        
        if (isExpired) {
          // Session expired, try to refresh
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            if (isRefreshTokenError(refreshError)) {
              await clearInvalidSession()
              return
            }
            // Other refresh errors, still try to use current session if valid
          }
          
          // Use refreshed session if available, otherwise use current
          const validSession = refreshData?.session || data.session
          
          user.value = {
            id: validSession.user.id,
            email: validSession.user.email!,
            created_at: validSession.user.created_at || new Date().toISOString()
          }
          
          session.value = {
            user: user.value,
            access_token: validSession.access_token,
            refresh_token: validSession.refresh_token,
            expires_at: validSession.expires_at || 0
          }
        } else {
          // Session is valid
          user.value = {
            id: data.session.user.id,
            email: data.session.user.email!,
            created_at: data.session.user.created_at || new Date().toISOString()
          }
          
          session.value = {
            user: user.value,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0
          }
        }
        
        await loadProfile()
        
        // Save to localStorage only if session is valid
        if (session.value) {
          localStorage.setItem('fmd_session', JSON.stringify(session.value))
        }
      } else {
        // No session from Supabase, clear any stale localStorage data
        await clearInvalidSession()
      }
    } catch (err: any) {
      console.error('Error checking session:', err)
      if (isRefreshTokenError(err)) {
        await clearInvalidSession()
      }
    } finally {
      isLoading.value = false
    }
  }

  async function clearInvalidSession() {
    user.value = null
    profile.value = null
    session.value = null
    clearInvalidSessions()
    // Also clear Supabase's internal storage
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // Ignore errors during cleanup - session might already be cleared
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!userId.value) return { success: false, error: 'Not authenticated' }
    
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId.value)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      if (data) {
        profile.value = data as UserProfile
      }
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Erro ao atualizar perfil'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updatePoints(points: number, action: string) {
    if (!user.value) return { success: false, error: 'Usuário não autenticado' }
    
    try {
      const newPoints = (profile.value?.points || 0) + points
      const newRank = calculateRank(newPoints)
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          points: newPoints,
          rank: newRank
        })
        .eq('id', user.value.id)
      
      if (updateError) throw updateError
      
      // Update local profile
      if (profile.value) {
        profile.value.points = newPoints
        profile.value.rank = newRank
      }
      
      return { success: true, points: newPoints, rank: newRank }
    } catch (err: any) {
      console.error('Error updating points:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    // State
    user,
    profile,
    session,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userId,
    // Actions
    signIn,
    signUp,
    signOut,
    loadProfile,
    checkSession,
    clearInvalidSession,
    updateProfile,
    updatePoints
  }
})
