<template>
  <div
    ref="containerRef"
    :class="containerClasses"
    :style="containerStyle"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseEnd"
    @mouseleave="handleMouseEnd"
    >
    <slot :swiping="isSwiping" :direction="swipeDirection"></slot>

    <!-- Swipe indicators -->
    <div v-if="showIndicators && isSwiping" class="absolute inset-0 pointer-events-none">
      <div 
        v-if="swipeDirection === 'left'"
        class="absolute right-0 top-0 bottom-0 w-20 bg-danger/20 flex items-center justify-start px-4"
      >
        <i class="fas fa-times text-danger text-2xl"></i>
      </div>
      <div 
        v-else-if="swipeDirection === 'right'"
        class="absolute left-0 top-0 bottom-0 w-20 bg-success/20 flex items-center justify-end px-4"
      >
        <i class="fas fa-check text-success text-2xl"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  threshold?: number
  showIndicators?: boolean
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 100,
  showIndicators: true,
  enabled: true
})

const emit = defineEmits<{
  swipeLeft: []
  swipeRight: []
  swipeUp: []
  swipeDown: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const isSwiping = ref(false)
const swipeDirection = ref<'left' | 'right' | 'up' | 'down' | null>(null)
const startX = ref(0)
const startY = ref(0)
const currentX = ref(0)
const currentY = ref(0)
const isMouseDown = ref(false)

const containerClasses = computed(() => {
  return 'relative touch-pan-y select-none'
})

const containerStyle = computed(() => {
  if (!isSwiping.value || !props.enabled) return {}

  const deltaX = currentX.value - startX.value
  const deltaY = currentY.value - startY.value
  
  return {
    transform: `translate(${deltaX}px, ${deltaY}px)`,
    transition: 'none'
  }
})

const handleTouchStart = (event: TouchEvent) => {
  if (!props.enabled) return
  
  const touch = event.touches[0]
  startX.value = touch.clientX
  startY.value = touch.clientY
  currentX.value = touch.clientX
  currentY.value = touch.clientY
  isSwiping.value = false
}

const handleTouchMove = (event: TouchEvent) => {
  if (!props.enabled) return
  
  const touch = event.touches[0]
  currentX.value = touch.clientX
  currentY.value = touch.clientY
  
  const deltaX = Math.abs(currentX.value - startX.value)
  const deltaY = Math.abs(currentY.value - startY.value)
  
  if (deltaX > 10 || deltaY > 10) {
    isSwiping.value = true
    
    if (deltaX > deltaY) {
      swipeDirection.value = currentX.value > startX.value ? 'right' : 'left'
    } else {
      swipeDirection.value = currentY.value > startY.value ? 'down' : 'up'
  }
}
}

const handleTouchEnd = () => {
  if (!props.enabled || !isSwiping.value) {
    resetSwipe()
    return
  }
  
  const deltaX = currentX.value - startX.value
  const deltaY = currentY.value - startY.value
  
  if (Math.abs(deltaX) > props.threshold) {
    if (deltaX > 0) {
      emit('swipeRight')
    } else {
      emit('swipeLeft')
    }
  } else if (Math.abs(deltaY) > props.threshold) {
    if (deltaY > 0) {
      emit('swipeDown')
    } else {
      emit('swipeUp')
    }
  }
  
  resetSwipe()
}

const handleMouseDown = (event: MouseEvent) => {
  if (!props.enabled) return
  
  isMouseDown.value = true
  startX.value = event.clientX
  startY.value = event.clientY
  currentX.value = event.clientX
  currentY.value = event.clientY
}

const handleMouseMove = (event: MouseEvent) => {
  if (!props.enabled || !isMouseDown.value) return
  
  currentX.value = event.clientX
  currentY.value = event.clientY
  
  const deltaX = Math.abs(currentX.value - startX.value)
  const deltaY = Math.abs(currentY.value - startY.value)
  
  if (deltaX > 10 || deltaY > 10) {
    isSwiping.value = true
    
    if (deltaX > deltaY) {
      swipeDirection.value = currentX.value > startX.value ? 'right' : 'left'
    } else {
      swipeDirection.value = currentY.value > startY.value ? 'down' : 'up'
      }
    }
  }

const handleMouseEnd = () => {
  if (!props.enabled || !isMouseDown.value) {
    isMouseDown.value = false
    resetSwipe()
    return
  }
  
  handleTouchEnd()
  isMouseDown.value = false
}

const resetSwipe = () => {
  setTimeout(() => {
    isSwiping.value = false
    swipeDirection.value = null
    currentX.value = startX.value
    currentY.value = startY.value
  }, 200)
}
</script>
