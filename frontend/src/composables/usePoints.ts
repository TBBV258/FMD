import { ref, computed } from 'vue'
import { pointsApi, type PointsHistoryEntry, type RankingUser } from '@/api/points'

export function usePoints(userId?: string) {
  const history = ref<PointsHistoryEntry[]>([])
  const ranking = ref<RankingUser[]>([])
  const userStats = ref({ points: 0, rank: 'bronze' })
  const userPosition = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  // Computed
  const totalPoints = computed(() => userStats.value.points)
  const currentRank = computed(() => userStats.value.rank)

  const rankInfo = computed(() => {
    const ranks = {
      bronze: { name: 'Bronze', min: 0, max: 499, color: '#CD7F32' },
      silver: { name: 'Prata', min: 500, max: 1999, color: '#C0C0C0' },
      gold: { name: 'Ouro', min: 2000, max: 4999, color: '#FFD700' },
      platinum: { name: 'Platina', min: 5000, max: 9999, color: '#E5E4E2' },
      diamond: { name: 'Diamante', min: 10000, max: Infinity, color: '#B9F2FF' }
    }

    return ranks[currentRank.value as keyof typeof ranks] || ranks.bronze
  })

  const progressToNextRank = computed(() => {
    const current = totalPoints.value
    const info = rankInfo.value

    if (info.max === Infinity) return 100 // Já é o rank máximo

    const progress = ((current - info.min) / (info.max - info.min)) * 100
    return Math.min(Math.max(progress, 0), 100)
  })

  const pointsToNextRank = computed(() => {
    const current = totalPoints.value
    const info = rankInfo.value

    if (info.max === Infinity) return 0 // Já é o rank máximo

    return Math.max(info.max + 1 - current, 0)
  })

  // Methods
  const loadHistory = async (uid?: string, limit: number = 50) => {
    const targetUserId = uid || userId
    if (!targetUserId) return

    isLoading.value = true
    error.value = null

    try {
      history.value = await pointsApi.getUserPointsHistory(targetUserId, limit)
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar histórico de pontos'
      console.error('Error loading points history:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadRanking = async (limit: number = 50) => {
    isLoading.value = true
    error.value = null

    try {
      ranking.value = await pointsApi.getGlobalRanking(limit)
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar ranking'
      console.error('Error loading ranking:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadUserStats = async (uid?: string) => {
    const targetUserId = uid || userId
    if (!targetUserId) return

    try {
      const [stats, position] = await Promise.all([
        pointsApi.getUserStats(targetUserId),
        pointsApi.getUserRankPosition(targetUserId)
      ])

      userStats.value = stats
      userPosition.value = position
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar estatísticas'
      console.error('Error loading user stats:', err)
    }
  }

  const subscribeToHistory = (uid?: string) => {
    const targetUserId = uid || userId
    if (!targetUserId) return

    // Cancelar subscrição anterior se existir
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = pointsApi.subscribeToPointsHistory(targetUserId, (entry) => {
      // Adicionar nova entrada no início do histórico
      history.value.unshift(entry)

      // Atualizar total de pontos
      userStats.value.points += entry.points

      // Atualizar rank se necessário
      loadUserStats(targetUserId)
    })
  }

  const unsubscribeFromHistory = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const addPoints = async (
    uid: string,
    points: number,
    activityType: string,
    description?: string,
    documentId?: string
  ) => {
    try {
      const newTotal = await pointsApi.addPoints(uid, points, activityType, description, documentId)
      userStats.value.points = newTotal
      await loadUserStats(uid)
      return newTotal
    } catch (err: any) {
      error.value = err.message || 'Erro ao adicionar pontos'
      console.error('Error adding points:', err)
      throw err
    }
  }

  const getActivityIcon = (activityType: string) => {
    const icons: Record<string, string> = {
      document_upload: 'fa-upload',
      first_document: 'fa-star',
      document_verified: 'fa-check-circle',
      document_found: 'fa-search',
      document_returned: 'fa-hand-holding',
      helped_someone: 'fa-hands-helping',
      daily_login: 'fa-calendar-check',
      profile_complete: 'fa-user-check',
      achievement: 'fa-trophy',
      penalty: 'fa-exclamation-triangle'
    }

    return icons[activityType] || 'fa-coins'
  }

  const getActivityColor = (activityType: string) => {
    const colors: Record<string, string> = {
      document_upload: 'text-blue-500',
      first_document: 'text-yellow-500',
      document_verified: 'text-green-500',
      document_found: 'text-purple-500',
      document_returned: 'text-green-600',
      helped_someone: 'text-blue-400',
      daily_login: 'text-gray-500',
      profile_complete: 'text-indigo-500',
      achievement: 'text-yellow-600',
      penalty: 'text-red-500'
    }

    return colors[activityType] || 'text-gray-400'
  }

  return {
    // State
    history,
    ranking,
    userStats,
    userPosition,
    isLoading,
    error,

    // Computed
    totalPoints,
    currentRank,
    rankInfo,
    progressToNextRank,
    pointsToNextRank,

    // Methods
    loadHistory,
    loadRanking,
    loadUserStats,
    subscribeToHistory,
    unsubscribeFromHistory,
    addPoints,
    getActivityIcon,
    getActivityColor
  }
}

