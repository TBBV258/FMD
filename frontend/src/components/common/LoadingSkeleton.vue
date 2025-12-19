<template>
  <div :class="containerClasses">
    <div v-if="type === 'card'" class="space-y-3">
      <div class="skeleton-image"></div>
      <div class="skeleton-text w-3/4"></div>
      <div class="skeleton-text w-1/2"></div>
      <div class="skeleton-text w-full"></div>
    </div>
    
    <div v-else-if="type === 'list'" class="space-y-4">
      <div v-for="i in count" :key="i" class="flex items-center space-x-3">
        <div class="skeleton-avatar"></div>
        <div class="flex-1 space-y-2">
          <div class="skeleton-text w-3/4"></div>
          <div class="skeleton-text w-1/2"></div>
        </div>
      </div>
    </div>
    
    <div v-else-if="type === 'text'" class="space-y-2">
      <div v-for="i in count" :key="i" class="skeleton-text"></div>
    </div>
    
    <div v-else-if="type === 'avatar'">
      <div class="skeleton-avatar"></div>
    </div>
    
    <div v-else class="skeleton" :style="customStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'card' | 'list' | 'text' | 'avatar' | 'custom'
  count?: number
  width?: string
  height?: string
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'custom',
  count: 3,
  rounded: false
})

const containerClasses = computed(() => {
  return props.rounded ? 'rounded-lg overflow-hidden' : ''
})

const customStyle = computed(() => {
  if (props.type !== 'custom') return {}
  
  return {
    width: props.width || '100%',
    height: props.height || '20px'
  }
})
</script>

