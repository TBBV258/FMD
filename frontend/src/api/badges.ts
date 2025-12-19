import { supabase } from './supabase'
import type { Badge, BadgeDefinition } from '@/types'

export const badgesApi = {
  /**
   * Buscar todos os badges do usuário
   */
  async getMyBadges(): Promise<Badge[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Buscar badges de um usuário específico
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    const { data, error } = await supabase.rpc('get_user_badges', {
      p_user_id: userId
    })

    if (error) throw error
    return data || []
  },

  /**
   * Buscar todas as definições de badges
   */
  async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    const { data, error } = await supabase.rpc('get_badge_definition', {
      p_badge_type: null
    })

    if (error) throw error
    return data || []
  },

  /**
   * Conceder um badge a um usuário (apenas admin)
   */
  async awardBadge(userId: string, badgeType: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('award_badge', {
      p_user_id: userId,
      p_badge_type: badgeType
    })

    if (error) throw error
    return data
  },

  /**
   * Buscar estatísticas de badges
   */
  async getBadgeStats() {
    const { data, error } = await supabase
      .from('badge_stats')
      .select('*')
      .order('total_earned', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Verificar se usuário tem um badge específico
   */
  async hasBadge(badgeType: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', user.id)
      .eq('badge_type', badgeType)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  /**
   * Contar badges por raridade
   */
  async countBadgesByRarity(userId: string) {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_rarity')
      .eq('user_id', userId)

    if (error) throw error

    const counts = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      total: data?.length || 0
    }

    data?.forEach(badge => {
      const rarity = badge.badge_rarity as keyof typeof counts
      if (rarity in counts) counts[rarity]++
    })

    return counts
  }
}

