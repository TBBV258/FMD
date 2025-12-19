import { ref, onMounted, onUnmounted } from 'vue'

export function useInfiniteScroll(callback: () => void, options = { threshold: 200 }) {
  const isLoading = ref(false)
  const hasMore = ref(true)
  
  const handleScroll = () => {
    if (isLoading.value || !hasMore.value) return
    
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const clientHeight = document.documentElement.clientHeight
    
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight)
    
    if (distanceToBottom < options.threshold) {
      isLoading.value = true
      callback()
    }
  }
  
  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
  })
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
  
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }
  
  const setHasMore = (more: boolean) => {
    hasMore.value = more
  }
  
  return {
    isLoading,
    hasMore,
    setLoading,
    setHasMore
  }
}

