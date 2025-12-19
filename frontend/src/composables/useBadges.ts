import { ref, computed } from 'vue'
import { badgesApi } from '@/api/badges'
import type { Badge, BadgeDefinition } from '@/types'
import { useToast } from './useToast'

export function useBadges() {
  const badges = ref<Badge[]>([])
  const badgeDefinitions = ref<BadgeDefinition[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { success, showError } = useToast()

  // Computed
  const badgeCount = computed(() => badges.value.length)

  const badgesByRarity = computed(() => {
    const grouped = {
      legendary: [] as Badge[],
      epic: [] as Badge[],
      rare: [] as Badge[],
      common: [] as Badge[]
    }
    
    badges.value.forEach(badge => {
      if (badge.badge_rarity in grouped) {
        grouped[badge.badge_rarity as keyof typeof grouped].push(badge)
      }
    })
    
    return grouped
  })

  const rarityStats = computed(() => ({
    legendary: badgesByRarity.value.legendary.length,
    epic: badgesByRarity.value.epic.length,
    rare: badgesByRarity.value.rare.length,
    common: badgesByRarity.value.common.length,
    total: badgeCount.value
  }))

  const latestBadge = computed(() => {
    if (badges.value.length === 0) return null
    return badges.value[0] // Já está ordenado por earned_at DESC
  })

  // Methods
  const fetchMyBadges = async () => {
    loading.value = true
    error.value = null
    try {
      badges.value = await badgesApi.getMyBadges()
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao carregar badges: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const fetchUserBadges = async (userId: string) => {
    loading.value = true
    error.value = null
    try {
      badges.value = await badgesApi.getUserBadges(userId)
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao carregar badges: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const fetchBadgeDefinitions = async () => {
    loading.value = true
    error.value = null
    try {
      badgeDefinitions.value = await badgesApi.getAllBadgeDefinitions()
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao carregar definições: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const hasBadge = async (badgeType: string): Promise<boolean> => {
    try {
      return await badgesApi.hasBadge(badgeType)
    } catch (err: any) {
      return false
    }
  }

  // UI Helpers
  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: 'text-gray-500',
      rare: 'text-blue-500',
      epic: 'text-purple-500',
      legendary: 'text-yellow-500'
    }
    return colors[rarity] || 'text-gray-500'
  }

  const getRarityBgColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: 'bg-gray-100 dark:bg-gray-700',
      rare: 'bg-blue-100 dark:bg-blue-900',
      epic: 'bg-purple-100 dark:bg-purple-900',
      legendary: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900'
    }
    return colors[rarity] || 'bg-gray-100'
  }

  const getRarityLabel = (rarity: string): string => {
    const labels: Record<string, string> = {
      common: 'Comum',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Lendário'
    }
    return labels[rarity] || rarity
  }

  const getRarityIcon = (rarity: string): string => {
    const icons: Record<string, string> = {
      common: 'fas fa-certificate',
      rare: 'fas fa-award',
      epic: 'fas fa-trophy',
      legendary: 'fas fa-crown'
    }
    return icons[rarity] || 'fas fa-star'
  }

  const getBadgeRank = (badge: Badge): number => {
    const rarityRanks: Record<string, number> = {
      legendary: 4,
      epic: 3,
      rare: 2,
      common: 1
    }
    return rarityRanks[badge.badge_rarity] || 0
  }

  const formatEarnedDate = (date: string): string => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `Há ${days} dias`
    if (days < 30) return `Há ${Math.floor(days / 7)} semanas`
    if (days < 365) return `Há ${Math.floor(days / 30)} meses`
    return `Há ${Math.floor(days / 365)} anos`
  }

  return {
    badges,
    badgeDefinitions,
    loading,
    error,
    badgeCount,
    badgesByRarity,
    rarityStats,
    latestBadge,
    fetchMyBadges,
    fetchUserBadges,
    fetchBadgeDefinitions,
    hasBadge,
    getRarityColor,
    getRarityBgColor,
    getRarityLabel,
    getRarityIcon,
    getBadgeRank,
    formatEarnedDate
  }
}

