<template>
  <div
    ref="containerRef"
    class="relative overflow-hidden"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Pull indicator -->
    <div
      class="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
      :style="{ height: `${pullDistance}px`, opacity: pullOpacity }"
    >
      <div class="flex flex-col items-center">
        <div
          class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
          v-if="isRefreshing"
        ></div>
        <i
          v-else
          class="fas fa-arrow-down text-primary text-xl"
          :class="{ 'rotate-180': pullDistance > threshold }"
          :style="{ transform: `rotate(${Math.min(pullDistance / threshold * 180, 180)}deg)` }"
        ></i>
        <span class="text-xs text-gray-500 mt-1">
          {{ pullDistance > threshold ? 'Solte para atualizar' : 'Puxe para atualizar' }}
        </span>
      </div>
    </div>
    
    <!-- Content -->
    <div :style="{ transform: `translateY(${pullDistance}px)`, transition: isRefreshing ? 'transform 0.2s' : 'none' }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  threshold?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 80,
  disabled: false
})

const emit = defineEmits<{
  refresh: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const pullDistance = ref(0)
const startY = ref(0)
const isRefreshing = ref(false)
const isPulling = ref(false)

const pullOpacity = computed(() => {
  return Math.min(pullDistance.value / props.threshold, 1)
})

const handleTouchStart = (event: TouchEvent) => {
  if (props.disabled || isRefreshing.value) return
  
  // Only start pull if at top of scroll
  if (window.scrollY === 0 || (containerRef.value && containerRef.value.scrollTop === 0)) {
    startY.value = event.touches[0].clientY
    isPulling.value = true
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (!isPulling.value || props.disabled || isRefreshing.value) return
  
  const currentY = event.touches[0].clientY
  const delta = currentY - startY.value
  
  if (delta > 0) {
    // Apply resistance (diminishing returns as you pull further)
    pullDistance.value = Math.min(delta * 0.5, props.threshold * 1.5)
    
    // Prevent default scrolling while pulling
    if (pullDistance.value > 10) {
      event.preventDefault()
    }
  }
}

const handleTouchEnd = () => {
  if (!isPulling.value || props.disabled) {
    isPulling.value = false
    pullDistance.value = 0
    return
  }
  
  isPulling.value = false
  
  if (pullDistance.value > props.threshold && !isRefreshing.value) {
    // Trigger refresh
    isRefreshing.value = true
    pullDistance.value = props.threshold
    
    emit('refresh')
    
    // Reset after 2 seconds (or when parent completes refresh)
    setTimeout(() => {
      finishRefresh()
    }, 2000)
  } else {
    // Reset pull distance
    pullDistance.value = 0
  }
}

const finishRefresh = () => {
  isRefreshing.value = false
  pullDistance.value = 0
}

// Expose method to parent
defineExpose({
  finishRefresh
})
</script>

