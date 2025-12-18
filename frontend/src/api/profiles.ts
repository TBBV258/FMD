import { supabase } from './supabase'
import type { UserProfile } from '@/types'

export const profilesApi = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as UserProfile
  },

  async create(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ id: userId, ...profile }])
      .select()
      .single()

    if (error) throw error
    return data as UserProfile
  },

  async update(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as UserProfile
  },

  async getTopProfiles(limit = 50) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, points, avatar_url')
      .order('points', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as UserProfile[]
  }
}

