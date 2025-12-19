import { supabase } from './supabase'

export interface PointsHistoryEntry {
  id: string
  points: number
  activity_type: string
  activity_description: string
  related_document_id?: string
  created_at: string
}

export interface RankingUser {
  rank_position: number
  user_id: string
  full_name: string
  avatar_url?: string
  points: number
  rank: string
  document_count: number
}

export const pointsApi = {
  /**
   * Adicionar pontos manualmente (use com cuidado)
   */
  async addPoints(
    userId: string,
    points: number,
    activityType: string,
    description?: string,
    documentId?: string
  ) {
    const { data, error } = await supabase.rpc('add_points', {
      p_user_id: userId,
      p_points: points,
      p_activity_type: activityType,
      p_description: description || null,
      p_document_id: documentId || null,
      p_metadata: null
    })

    if (error) throw error
    return data as number // Retorna novo total de pontos
  },

  /**
   * Obter histórico de pontos do usuário
   */
  async getUserPointsHistory(userId: string, limit: number = 50) {
    const { data, error } = await supabase.rpc('get_user_points_history', {
      p_user_id: userId,
      p_limit: limit
    })

    if (error) throw error
    return (data || []) as PointsHistoryEntry[]
  },

  /**
   * Obter ranking global
   */
  async getGlobalRanking(limit: number = 50) {
    const { data, error } = await supabase.rpc('get_global_ranking', {
      p_limit: limit
    })

    if (error) throw error
    return (data || []) as RankingUser[]
  },

  /**
   * Obter posição do usuário no ranking
   */
  async getUserRankPosition(userId: string) {
    const { data, error } = await supabase.rpc('get_user_rank_position', {
      p_user_id: userId
    })

    if (error) throw error
    return data as number
  },

  /**
   * Obter estatísticas de pontos do usuário
   */
  async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('points, rank')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as { points: number; rank: string }
  },

  /**
   * Obter total de pontos por tipo de atividade
   */
  async getPointsByActivityType(userId: string) {
    const { data, error } = await supabase
      .from('points_history')
      .select('activity_type, points')
      .eq('user_id', userId)

    if (error) throw error

    // Agrupar por tipo
    const grouped = (data || []).reduce((acc: Record<string, number>, item) => {
      acc[item.activity_type] = (acc[item.activity_type] || 0) + item.points
      return acc
    }, {})

    return grouped
  },

  /**
   * Subscrever a mudanças no histórico de pontos
   */
  subscribeToPointsHistory(userId: string, callback: (entry: PointsHistoryEntry) => void) {
    const channel = supabase
      .channel(`points_history:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_history',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as PointsHistoryEntry)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

