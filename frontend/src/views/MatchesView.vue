<template>
  <MainLayout>
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          <i class="fas fa-puzzle-piece mr-2 text-primary"></i>
          Matches Sugeridos
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Documentos que podem ser seus, encontrados automaticamente pela IA
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
        <p class="text-gray-600 dark:text-gray-400">Procurando matches...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="pendingMatches.length === 0" class="text-center py-12">
        <i class="fas fa-search text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum match encontrado
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Quando alguém reportar um documento similar ao seu, ele aparecerá aqui.
        </p>
      </div>

      <!-- Matches List -->
      <div v-else class="space-y-6">
        <!-- High Score Matches -->
        <div v-if="highScoreMatches.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i class="fas fa-fire text-danger mr-2"></i>
            Alta Probabilidade ({{ highScoreMatches.length }})
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MatchCard
              v-for="match in highScoreMatches"
              :key="match.id"
              :match="match"
              @confirm="confirmMatch"
              @reject="rejectMatch"
            />
          </div>
        </div>

        <!-- Medium Score Matches -->
        <div v-if="mediumScoreMatches.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i class="fas fa-star text-warning-dark mr-2"></i>
            Média Probabilidade ({{ mediumScoreMatches.length }})
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MatchCard
              v-for="match in mediumScoreMatches"
              :key="match.id"
              :match="match"
              @confirm="confirmMatch"
              @reject="rejectMatch"
            />
          </div>
        </div>

        <!-- Low Score Matches -->
        <div v-if="lowScoreMatches.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i class="fas fa-question-circle text-gray-500 mr-2"></i>
            Baixa Probabilidade ({{ lowScoreMatches.length }})
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MatchCard
              v-for="match in lowScoreMatches"
              :key="match.id"
              :match="match"
              @confirm="confirmMatch"
              @reject="rejectMatch"
            />
          </div>
        </div>
      </div>

      <!-- Confirmed Matches -->
      <div v-if="confirmedMatches.length > 0" class="mt-8">
        <h2 class="text-lg font-semibold text-success mb-4 flex items-center">
          <i class="fas fa-check-circle mr-2"></i>
          Matches Confirmados ({{ confirmedMatches.length }})
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MatchCard
            v-for="match in confirmedMatches"
            :key="match.id"
            :match="match"
            :confirmed="true"
          />
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import MatchCard from '@/components/matches/MatchCard.vue'
import { useMatches } from '@/composables/useMatches'

const {
  loading,
  pendingMatches,
  confirmedMatches,
  highScoreMatches,
  mediumScoreMatches,
  lowScoreMatches,
  fetchMatches,
  confirmMatch: confirmMatchAction,
  rejectMatch: rejectMatchAction
} = useMatches()

const confirmMatch = async (matchId: string) => {
  if (confirm('Confirmar que este é o seu documento?')) {
    await confirmMatchAction(matchId)
  }
}

const rejectMatch = async (matchId: string) => {
  if (confirm('Tem certeza que este NÃO é o seu documento?')) {
    await rejectMatchAction(matchId)
  }
}

onMounted(() => {
  fetchMatches()
})
</script>

