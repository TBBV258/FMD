<template>
  <BaseModal v-model="isOpen" title="Como Ganhar Pontos?" maxWidth="md">
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Ganhe pontos e suba no ranking realizando ações na plataforma!
      </p>
      
      <div
        v-for="(item, key) in pointsConfig"
        :key="key"
        class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div class="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span class="text-primary font-bold text-sm">+{{ item.points }}</span>
        </div>
        <div class="flex-1">
          <h4 class="font-medium text-gray-900 dark:text-dark-text">{{ item.title }}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ item.description }}</p>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-primary/10 rounded-lg">
        <h4 class="font-bold text-primary mb-2">Ranking</h4>
        <div class="space-y-2">
          <div v-for="(rank, key) in ranks" :key="key" class="flex items-center justify-between text-sm">
            <div class="flex items-center space-x-2">
              <span class="text-xl">{{ rank.icon }}</span>
              <span class="font-medium">{{ rank.name }}</span>
            </div>
            <span class="text-gray-600 dark:text-gray-400">{{ rank.threshold }}+ pontos</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <BaseButton variant="primary" @click="isOpen = false" full-width>
        Entendi!
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { POINTS_CONFIG, RANK_THRESHOLDS, getRankInfo } from '@/utils/pointsSystem'
import type { UserRank } from '@/types'

const isOpen = defineModel<boolean>()

const pointsConfig = computed(() => [
  {
    title: 'Match de Documento',
    description: 'Quando seu documento perdido/encontrado faz match',
    points: POINTS_CONFIG.DOCUMENT_MATCH
  },
  {
    title: 'Reportar Documento',
    description: 'Ao reportar um documento perdido ou encontrado',
    points: POINTS_CONFIG.REPORT_DOCUMENT
  },
  {
    title: 'Documento Verificado',
    description: 'Quando seu documento é verificado como autêntico',
    points: POINTS_CONFIG.VERIFY_DOCUMENT
  },
  {
    title: 'Login Diário',
    description: 'Entre todos os dias para ganhar pontos',
    points: POINTS_CONFIG.DAILY_LOGIN
  },
  {
    title: 'Ajudar Outros',
    description: 'Ao ajudar alguém a encontrar um documento',
    points: POINTS_CONFIG.HELP_OTHERS
  },
  {
    title: 'Completar Perfil',
    description: 'Complete todas as informações do seu perfil',
    points: POINTS_CONFIG.COMPLETE_PROFILE
  }
])

const ranks = computed(() => {
  const rankKeys: UserRank[] = ['bronze', 'silver', 'gold', 'platinum']
  return rankKeys.map(key => ({
    ...getRankInfo(key),
    threshold: RANK_THRESHOLDS[key]
  }))
})
</script>

