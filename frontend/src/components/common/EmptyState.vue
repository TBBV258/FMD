<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- Icon -->
    <div class="mb-4">
      <div class="w-20 h-20 bg-gray-100 dark:bg-dark-card rounded-full flex items-center justify-center">
        <i :class="icon" class="text-gray-400 text-3xl"></i>
      </div>
    </div>
    
    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
      {{ description }}
    </p>
    
    <!-- Action button -->
    <slot name="action">
      <BaseButton
        v-if="actionLabel && actionClick"
        variant="primary"
        @click="actionClick"
      >
        <i v-if="actionIcon" :class="actionIcon" class="mr-2"></i>
        {{ actionLabel }}
      </BaseButton>
    </slot>
  </div>
</template>

<script setup lang="ts">
import BaseButton from './BaseButton.vue'

interface Props {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionIcon?: string
  actionClick?: () => void
}

withDefaults(defineProps<Props>(), {
  icon: 'fas fa-inbox'
})
</script>

