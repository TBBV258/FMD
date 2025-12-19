<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
    <!-- Score Badge -->
    <div class="relative">
      <div class="absolute top-3 right-3 z-10">
        <div :class="[
          'px-3 py-1 rounded-full text-xs font-bold shadow-lg',
          scoreClass
        ]">
          {{ Math.round(match.match_score) }}%
        </div>
      </div>
      
      <!-- Document Image -->
      <div v-if="otherDocument?.file_url" class="h-48 overflow-hidden">
        <img 
          :src="otherDocument.file_url" 
          :alt="otherDocument.title"
          class="w-full h-full object-cover"
        />
      </div>
      <div v-else class="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <i class="fas fa-file-alt text-6xl text-primary/30"></i>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Document Info -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {{ otherDocument?.title }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ otherDocument?.description }}
        </p>
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            <i class="fas fa-id-card mr-1"></i>
            {{ otherDocument?.document_type }}
          </span>
          <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            <i class="fas fa-map-marker-alt mr-1"></i>
            {{ otherDocument?.location }}
          </span>
        </div>
      </div>

      <!-- Match Reasons -->
      <div class="mb-4">
        <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="fas fa-lightbulb text-warning-dark mr-1"></i>
          Por que é um match:
        </p>
        <ul class="space-y-1">
          <li 
            v-for="(reason, index) in match.match_reasons.slice(0, 3)"
            :key="index"
            class="text-xs text-gray-600 dark:text-gray-400 flex items-start"
          >
            <i class="fas fa-check text-success mr-2 mt-0.5"></i>
            <span>{{ reason.description }}</span>
          </li>
        </ul>
      </div>

      <!-- User Info -->
      <div class="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
        <img 
          v-if="otherUser?.avatar_url"
          :src="otherUser.avatar_url" 
          :alt="otherUser.full_name"
          class="w-8 h-8 rounded-full"
        />
        <div v-else class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <i class="fas fa-user text-primary text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ otherUser?.full_name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ myDocument?.status === 'lost' ? 'Encontrou' : 'Perdeu' }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="!confirmed" class="flex gap-2">
        <button
          @click="$emit('confirm', match.id)"
          class="flex-1 bg-success hover:bg-success-dark text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
        >
          <i class="fas fa-check mr-1"></i>
          É meu documento!
        </button>
        <button
          @click="$emit('reject', match.id)"
          class="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
        >
          <i class="fas fa-times mr-1"></i>
          Não é meu
        </button>
      </div>
      <div v-else class="text-center py-2 bg-success/10 rounded-lg">
        <p class="text-success font-semibold text-sm">
          <i class="fas fa-check-circle mr-1"></i>
          Match Confirmado!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentMatch } from '@/types'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  match: DocumentMatch
  confirmed?: boolean
}>()

defineEmits<{
  confirm: [matchId: string]
  reject: [matchId: string]
}>()

const authStore = useAuthStore()

// Determinar qual documento mostrar (o que NÃO é do usuário atual)
const myDocument = computed(() => {
  if (props.match.lost_document?.user_id === authStore.user?.id) {
    return props.match.lost_document
  }
  return props.match.found_document
})

const otherDocument = computed(() => {
  if (props.match.lost_document?.user_id === authStore.user?.id) {
    return props.match.found_document
  }
  return props.match.lost_document
})

const otherUser = computed(() => {
  return otherDocument.value?.user_profiles
})

const scoreClass = computed(() => {
  const score = props.match.match_score
  if (score >= 70) return 'bg-success text-white'
  if (score >= 40) return 'bg-warning-dark text-white'
  return 'bg-gray-500 text-white'
})
</script>

