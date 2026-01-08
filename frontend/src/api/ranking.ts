import { supabase } from './supabase'
import { profilesApi } from './profiles'

export interface RankingUser {
  id: string
  full_name: string
  avatar_url?: string
  points: number
  rank?: string
  position?: number
}

export interface UserRanking {
  user: RankingUser
  position: number
  totalUsers: number
  nextRank?: {
    rank: string
    pointsNeeded: number
  }
}

export const rankingApi = {
  async getTopUsers(limit: number = 10): Promise<RankingUser[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url, points')
      .order('points', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    return (data || []).map((user, index) => ({
      ...user,
      position: index + 1
    })) as RankingUser[]
  },

  async getUserRanking(userId: string): Promise<UserRanking> {
    // Get user profile
    const userProfile = await profilesApi.get(userId)
    
    // Get total count of users
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    // Get position by counting users with more points
    const { count: positionCount, error: positionError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gt('points', userProfile.points || 0)

    if (positionError) throw positionError

    const position = (positionCount || 0) + 1

    // Calculate next rank
    const nextRank = this.calculateNextRank(userProfile.points || 0)

    return {
      user: {
        id: userProfile.id,
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        points: userProfile.points || 0,
        rank: userProfile.rank
      },
      position,
      totalUsers: count || 0,
      nextRank
    }
  },

  calculateNextRank(points: number): { rank: string; pointsNeeded: number } | null {
    const ranks = [
      { rank: 'bronze', threshold: 0 },
      { rank: 'silver', threshold: 100 },
      { rank: 'gold', threshold: 500 },
      { rank: 'platinum', threshold: 1000 }
    ]

    for (let i = ranks.length - 1; i >= 0; i--) {
      if (points < ranks[i].threshold) {
        return {
          rank: ranks[i].rank,
          pointsNeeded: ranks[i].threshold - points
        }
      }
    }

    return null // Already at max rank
  },

  async getRankingAroundUser(userId: string, range: number = 5): Promise<RankingUser[]> {
    const userProfile = await profilesApi.get(userId)
    const userPoints = userProfile.points || 0

    // Get users with similar points (above and below)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url, points')
      .gte('points', userPoints - (range * 10))
      .lte('points', userPoints + (range * 10))
      .order('points', { ascending: false })
      .limit(range * 2 + 1)

    if (error) throw error

    // Calculate positions
    const { count: aboveCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gt('points', userPoints)

    const startPosition = (aboveCount || 0) + 1

    return (data || []).map((user, index) => ({
      ...user,
      position: startPosition + index - (data.findIndex(u => u.id === userId) || 0)
    })) as RankingUser[]
  }
}

