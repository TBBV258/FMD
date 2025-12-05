<template>
  <div class="fixed inset-0 bg-white dark:bg-dark-bg flex flex-col items-center justify-center z-50">
    <!-- Logo -->
    <div class="mb-8">
      <img
        :src="logoImg"
        alt="FindMyDocs Logo"
        class="h-24 w-24 rounded-2xl shadow-lg animate-pulse"
      />
    </div>
    
    <!-- Loading spinner -->
    <div class="relative">
      <div class="w-12 h-12 border-4 border-gray-200 dark:border-dark-border rounded-full"></div>
      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    
    <!-- Loading text -->
    <p class="mt-6 text-gray-600 dark:text-gray-400 text-sm">
      {{ loadingText }}
    </p>
    
    <!-- Progress bar (optional) -->
    <div v-if="progress !== null" class="mt-4 w-48">
      <div class="h-1 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          class="h-full bg-primary transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 text-center mt-2">{{ progress }}%</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import logoImg from '/logofmd.jpg'

interface Props {
  loadingText?: string
  progress?: number | null
}

withDefaults(defineProps<Props>(), {
  loadingText: 'Carregando...',
  progress: null
})
</script>

