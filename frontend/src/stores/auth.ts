import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserProfile, AuthSession } from '@/types'
import { supabase } from '@/utils/supabase'
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) throw signInError
      
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
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            phone_number: userData.phoneNumber,
            country: userData.country || 'MZ'
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      // Profile will be created automatically by the trigger
      // No manual profile creation needed
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Erro ao criar conta'
      return { success: false, error: error.value }
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
      const { data } = await supabase.auth.getSession()
      
      if (data.session) {
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
        
        await loadProfile()
        
        localStorage.setItem('fmd_session', JSON.stringify(session.value))
      } else {
        // Try to load from localStorage
        const savedSession = localStorage.getItem('fmd_session')
        if (savedSession) {
          session.value = JSON.parse(savedSession)
          user.value = session.value!.user
          await loadProfile()
        }
      }
    } catch (err: any) {
      console.error('Error checking session:', err)
      localStorage.removeItem('fmd_session')
    } finally {
      isLoading.value = false
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
    updateProfile,
    updatePoints
  }
})
