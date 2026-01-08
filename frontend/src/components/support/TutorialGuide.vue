<template>
  <div class="space-y-4">
    <div
      v-for="(step, index) in tutorialSteps"
      :key="index"
      class="flex items-start space-x-4 p-4 border border-gray-200 dark:border-dark-border rounded-lg"
    >
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
        {{ index + 1 }}
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 dark:text-dark-text mb-1">{{ step.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ step.description }}</p>
        <div v-if="step.action" class="mt-2">
          <BaseButton
            v-if="step.action.route"
            variant="outline"
            size="sm"
            @click="$router.push(step.action.route)"
          >
            {{ step.action.label }}
            <i class="fas fa-arrow-right ml-2"></i>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()

const tutorialSteps = [
  {
    title: 'Explorar o Mapa',
    description: 'Use o mapa para ver documentos perdidos e encontrados na sua área. Clique nos marcadores para ver detalhes.',
    action: {
      label: 'Abrir Mapa',
      route: '/map'
    }
  },
  {
    title: 'Reportar Documento Perdido',
    description: 'Se perdeu um documento, reporte-o adicionando uma foto, tipo de documento e localização onde foi perdido.',
    action: {
      label: 'Reportar Perdido',
      route: '/report-lost'
    }
  },
  {
    title: 'Reportar Documento Encontrado',
    description: 'Encontrou um documento? Reporte-o para ajudar o proprietário a recuperá-lo. Lembre-se de ocultar dados sensíveis na foto.',
    action: {
      label: 'Reportar Encontrado',
      route: '/report-found'
    }
  },
  {
    title: 'Verificar Matches',
    description: 'Quando há um possível match entre um documento perdido e encontrado, você receberá uma notificação. Use o chat para verificar.',
    action: {
      label: 'Ver Notificações',
      route: '/notifications'
    }
  },
  {
    title: 'Ganhar Pontos',
    description: 'Ganhe pontos reportando documentos, ajudando outros usuários e completando seu perfil. Use pontos para destacar documentos.',
    action: {
      label: 'Ver Perfil',
      route: '/profile'
    }
  }
]
</script>

