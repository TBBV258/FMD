import { supabase } from './supabase'

export interface UserSettings {
  id: string
  user_id: string
  language: 'pt' | 'en' | 'fr'
  theme: 'light' | 'dark' | 'system'
  currency: string
  timezone: string
  date_format: string
  auto_backup: boolean
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  last_backup_at?: string
  created_at: string
  updated_at: string
}

export interface PrivacySettings {
  id: string
  user_id: string
  show_phone_number: boolean
  require_contact_request: boolean
  show_exact_location: boolean
  show_document_count: boolean
  show_points: boolean
  allow_profile_search: boolean
  share_analytics: boolean
  created_at: string
  updated_at: string
}

export interface SecuritySettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  two_factor_secret?: string
  two_factor_backup_codes?: string[]
  two_factor_enabled_at?: string
  last_password_change?: string
  login_notifications: boolean
  suspicious_activity_alerts: boolean
  session_timeout_minutes: number
  created_at: string
  updated_at: string
}

export const settingsApi = {
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as UserSettings | null
  },

  async createOrUpdateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId)
    
    if (existing) {
      const { data, error } = await supabase
        .from('user_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } else {
      const { data, error } = await supabase
        .from('user_settings')
        .insert([{ user_id: userId, ...settings }])
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    }
  },

  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    const { data, error } = await supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as PrivacySettings | null
  },

  async createOrUpdatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const existing = await this.getPrivacySettings(userId)
    
    if (existing) {
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as PrivacySettings
    } else {
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .insert([{ user_id: userId, ...settings }])
        .select()
        .single()

      if (error) throw error
      return data as PrivacySettings
    }
  },

  async getSecuritySettings(userId: string): Promise<SecuritySettings | null> {
    const { data, error } = await supabase
      .from('user_security_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as SecuritySettings | null
  },

  async createOrUpdateSecuritySettings(userId: string, settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    const existing = await this.getSecuritySettings(userId)
    
    if (existing) {
      const { data, error } = await supabase
        .from('user_security_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as SecuritySettings
    } else {
      const { data, error } = await supabase
        .from('user_security_settings')
        .insert([{ user_id: userId, ...settings }])
        .select()
        .single()

      if (error) throw error
      return data as SecuritySettings
    }
  },

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }
}

