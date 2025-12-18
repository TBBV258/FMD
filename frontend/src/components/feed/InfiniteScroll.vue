<template>
  <div 
    ref="containerRef"
    class="overflow-auto h-full"
    @scroll="handleScroll"
  >
    <slot />
    
    <!-- Loading indicator -->
    <div v-if="loading" class="flex justify-center py-4">
      <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- End message -->
    <div v-else-if="!hasMore && !loading" class="text-center py-8 text-neutral-500 dark:text-neutral-400">
      <p class="text-sm">{{ endMessage || 'Não há mais itens para carregar' }}</p>
    </div>

    <!-- Sentinel element for intersection observer -->
    <div ref="sentinelRef" class="h-1" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  threshold?: number
  endMessage?: string
}>()

const containerRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  // Use Intersection Observer for better performance
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && props.hasMore && !props.loading) {
        props.onLoadMore()
      }
    },
    {
      root: containerRef.value,
      rootMargin: `${props.threshold || 200}px`,
      threshold: 0
    }
  )

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

function handleScroll() {
  // Fallback scroll handler
  if (!containerRef.value || props.loading || !props.hasMore) return

  const { scrollTop, scrollHeight, clientHeight } = containerRef.value
  const threshold = props.threshold || 200

  if (scrollHeight - scrollTop - clientHeight < threshold) {
    props.onLoadMore()
  }
}
</script>

