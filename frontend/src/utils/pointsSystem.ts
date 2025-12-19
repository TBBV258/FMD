import type { UserRank } from '@/types'

export const POINTS_CONFIG = {
  DOCUMENT_MATCH: 50,
  REPORT_DOCUMENT: 10,
  VERIFY_DOCUMENT: 20,
  DAILY_LOGIN: 5,
  HELP_OTHERS: 15,
  COMPLETE_PROFILE: 25
}

export const RANK_THRESHOLDS = {
  bronze: 0,
  silver: 100,
  gold: 500,
  platinum: 1000
}

export function calculateRank(points: number): UserRank {
  if (points >= RANK_THRESHOLDS.platinum) return 'platinum'
  if (points >= RANK_THRESHOLDS.gold) return 'gold'
  if (points >= RANK_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

export function getNextRank(currentRank: UserRank): { rank: UserRank; pointsNeeded: number } | null {
  const ranks: UserRank[] = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = ranks.indexOf(currentRank)
  
  if (currentIndex === ranks.length - 1) {
    return null // Already at highest rank
  }
  
  const nextRank = ranks[currentIndex + 1]
  const pointsNeeded = RANK_THRESHOLDS[nextRank]
  
  return { rank: nextRank, pointsNeeded }
}

export function getRankInfo(rank: UserRank) {
  const info = {
    bronze: {
      name: 'Bronze',
      icon: '🥉',
      color: '#CD7F32',
      benefits: ['Acesso básico', 'Upload de 10 documentos/mês']
    },
    silver: {
      name: 'Prata',
      icon: '🥈',
      color: '#C0C0C0',
      benefits: ['Upload de 25 documentos/mês', 'Suporte prioritário']
    },
    gold: {
      name: 'Ouro',
      icon: '🥇',
      color: '#FFD700',
      benefits: ['Upload de 50 documentos/mês', 'Notificações avançadas', 'Badge especial']
    },
    platinum: {
      name: 'Platina',
      icon: '💎',
      color: '#E5E4E2',
      benefits: ['Uploads ilimitados', 'Suporte VIP', 'Todas as features premium']
    }
  }
  
  return info[rank]
}

