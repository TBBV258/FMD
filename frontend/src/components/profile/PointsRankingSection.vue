<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text">Ranking de Pontos</h3>
      <span v-if="userRanking" class="badge badge-primary">
        #{{ userRanking.position }}
      </span>
    </div>

    <!-- User's Current Rank -->
    <div v-if="userRanking" class="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div class="flex items-center justify-between mb-2">
        <div>
          <p class="font-semibold text-gray-900 dark:text-dark-text">Sua Posição</p>
          <p class="text-sm text-gray-500">
            {{ userRanking.user.points }} pontos
          </p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold text-primary">#{{ userRanking.position }}</p>
          <p class="text-xs text-gray-500">de {{ userRanking.totalUsers }} usuários</p>
        </div>
      </div>

      <!-- Progress to Next Rank -->
      <div v-if="userRanking.nextRank" class="mt-4">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-gray-600 dark:text-gray-400">Próximo nível: {{ userRanking.nextRank.rank }}</span>
          <span class="font-semibold text-primary">{{ userRanking.nextRank.pointsNeeded }} pontos</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all"
            :style="{ width: `${Math.min(100, (userRanking.user.points / (userRanking.user.points + userRanking.nextRank.pointsNeeded)) * 100)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Top 10 Users -->
    <div>
      <h4 class="font-medium text-gray-900 dark:text-dark-text mb-3">Top 10</h4>
      <div v-if="isLoading" class="text-center py-4">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
      <div v-else-if="topUsers.length === 0" class="text-center py-4 text-gray-500 text-sm">
        Nenhum usuário encontrado
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="(user, index) in topUsers"
          :key="user.id"
          class="flex items-center space-x-3 p-2 rounded-lg"
          :class="user.id === authStore.userId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
        >
          <div class="flex-shrink-0 w-8 text-center">
            <span
              v-if="index < 3"
              class="text-lg font-bold"
              :class="getMedalColor(index)"
            >
              {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
            </span>
            <span v-else class="text-sm font-semibold text-gray-500">
              #{{ index + 1 }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-dark-text truncate">
              {{ user.full_name || 'Usuário' }}
            </p>
            <p class="text-xs text-gray-500">{{ user.points }} pontos</p>
          </div>
          <img
            v-if="user.avatar_url"
            :src="user.avatar_url"
            :alt="user.full_name"
            class="w-8 h-8 rounded-full"
          />
          <div v-else class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <i class="fas fa-user text-gray-500 text-sm"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { rankingApi } from '@/api/ranking'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { error: showError } = useToast()

const userRanking = ref<any>(null)
const topUsers = ref<any[]>([])
const isLoading = ref(false)

const getMedalColor = (index: number) => {
  if (index === 0) return 'text-yellow-500'
  if (index === 1) return 'text-gray-400'
  if (index === 2) return 'text-orange-500'
  return ''
}

const loadRanking = async () => {
  if (!authStore.userId) return

  isLoading.value = true
  try {
    const [userRank, top] = await Promise.all([
      rankingApi.getUserRanking(authStore.userId),
      rankingApi.getTopUsers(10)
    ])
    userRanking.value = userRank
    topUsers.value = top
  } catch (err: any) {
    showError(err.message || 'Erro ao carregar ranking')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRanking()
})
</script>

