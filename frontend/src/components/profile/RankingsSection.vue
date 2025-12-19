<template>
  <div class="space-y-6">
    <!-- Current User Rank Card -->
    <div class="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
      <div class="text-center mb-4">
        <div class="text-5xl mb-2">{{ currentRankInfo.icon }}</div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
          {{ currentRankInfo.name }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ currentRankInfo.description }}
        </p>
      </div>
      
      <!-- Points Display -->
      <div class="text-center mb-4">
        <p class="text-4xl font-bold text-primary">{{ userPoints }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">pontos</p>
      </div>
      
      <!-- Progress to next rank -->
      <div v-if="nextRankInfo" class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Próximo nível:</span>
          <span class="font-semibold">{{ nextRankInfo.name }} {{ nextRankInfo.icon }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            class="bg-gradient-to-r from-primary to-primary-dark h-3 rounded-full transition-all duration-500"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 text-center">
          Faltam {{ pointsToNextRank }} pontos para o próximo nível
        </p>
      </div>
      <div v-else class="text-center text-sm text-success font-semibold">
        🎉 Você atingiu o nível máximo!
      </div>
    </div>
    
    <!-- How to Earn Points -->
    <div class="card">
      <h4 class="font-semibold text-gray-900 dark:text-dark-text mb-3">
        Como ganhar pontos?
      </h4>
      <div class="space-y-2">
        <div v-for="(action, key) in pointsActions" :key="key" class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ action.label }}</span>
          <span class="text-sm font-semibold text-primary">+{{ action.points }}</span>
        </div>
      </div>
    </div>
    
    <!-- Leaderboard -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-semibold text-gray-900 dark:text-dark-text">
          🏆 Top Usuários
        </h4>
        <button
          @click="refreshLeaderboard"
          class="text-sm text-primary hover:underline"
          :disabled="loadingLeaderboard"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingLeaderboard }"></i>
          Atualizar
        </button>
      </div>
      
      <div v-if="loadingLeaderboard" class="text-center py-6 text-gray-500">
        Carregando ranking...
      </div>
      
      <div v-else-if="leaderboard.length === 0" class="text-center py-6 text-gray-500">
        Nenhum usuário no ranking ainda
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="(user, index) in leaderboard"
          :key="user.id"
          class="flex items-center space-x-3 p-3 rounded-lg transition-colors"
          :class="user.id === currentUserId ? 'bg-primary/10 border border-primary/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
        >
          <!-- Rank Position -->
          <div class="flex-shrink-0 w-8 text-center">
            <span v-if="index === 0" class="text-2xl">🥇</span>
            <span v-else-if="index === 1" class="text-2xl">🥈</span>
            <span v-else-if="index === 2" class="text-2xl">🥉</span>
            <span v-else class="text-lg font-semibold text-gray-500">{{ index + 1 }}</span>
          </div>
          
          <!-- Avatar -->
          <img
            :src="user.avatar_url || 'https://placehold.co/48x48'"
            :alt="user.full_name"
            class="w-12 h-12 rounded-full object-cover"
          />
          
          <!-- User Info -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 dark:text-dark-text truncate">
              {{ user.full_name || 'Usuário' }}
              <span v-if="user.id === currentUserId" class="text-xs text-primary ml-1">(Você)</span>
            </p>
            <p class="text-xs text-gray-500">
              {{ getUserRankName(user.points || 0) }}
            </p>
          </div>
          
          <!-- Points -->
          <div class="flex-shrink-0 text-right">
            <p class="font-bold text-primary">{{ user.points || 0 }}</p>
            <p class="text-xs text-gray-500">pontos</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/api/supabase'
import { calculateRank, getRankInfo, getNextRank, POINTS_CONFIG } from '@/utils/pointsSystem'

interface Props {
  userPoints: number
  currentUserId: string
}

const props = defineProps<Props>()

const leaderboard = ref<any[]>([])
const loadingLeaderboard = ref(false)

const currentRankInfo = computed(() => {
  const rank = calculateRank(props.userPoints)
  return getRankInfo(rank)
})

const nextRankInfo = computed(() => {
  const rank = calculateRank(props.userPoints)
  const next = getNextRank(rank)
  return next ? getRankInfo(next.rank) : null
})

const pointsToNextRank = computed(() => {
  const rank = calculateRank(props.userPoints)
  const next = getNextRank(rank)
  return next ? next.pointsNeeded : 0
})

const progressPercentage = computed(() => {
  const rank = calculateRank(props.userPoints)
  const next = getNextRank(rank)
  if (!next) return 100
  
  const currentThreshold = getCurrentThreshold(rank)
  const nextThreshold = next.pointsNeeded + currentThreshold
  const progress = props.userPoints - currentThreshold
  const total = nextThreshold - currentThreshold
  
  return Math.min(Math.round((progress / total) * 100), 100)
})

const pointsActions = computed(() => ({
  documentMatch: { label: 'Match de documento', points: POINTS_CONFIG.DOCUMENT_MATCH },
  reportDocument: { label: 'Reportar documento', points: POINTS_CONFIG.REPORT_DOCUMENT },
  verifyDocument: { label: 'Verificar documento', points: POINTS_CONFIG.VERIFY_DOCUMENT },
  helpOthers: { label: 'Ajudar outros usuários', points: POINTS_CONFIG.HELP_OTHERS },
  completeProfile: { label: 'Completar perfil', points: POINTS_CONFIG.COMPLETE_PROFILE },
  dailyLogin: { label: 'Login diário', points: POINTS_CONFIG.DAILY_LOGIN }
}))

const getCurrentThreshold = (rank: string): number => {
  const thresholds: Record<string, number> = {
    bronze: 0,
    silver: 100,
    gold: 500,
    platinum: 1000
  }
  return thresholds[rank] || 0
}

const getUserRankName = (points: number): string => {
  const rank = calculateRank(points)
  const rankInfo = getRankInfo(rank)
  return rankInfo?.name || 'Bronze'
}

const refreshLeaderboard = async () => {
  loadingLeaderboard.value = true
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, points, avatar_url')
      .order('points', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    leaderboard.value = data || []
  } catch (err) {
    console.error('Erro ao carregar leaderboard:', err)
  } finally {
    loadingLeaderboard.value = false
  }
}

onMounted(() => {
  refreshLeaderboard()
})
</script>

