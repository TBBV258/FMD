import { ref, onMounted, onUnmounted } from 'vue'

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine)
  const effectiveType = ref<string>('')
  const downlink = ref<number>(0)
  const rtt = ref<number>(0)

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  const updateConnectionInfo = () => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection

    if (connection) {
      effectiveType.value = connection.effectiveType || ''
      downlink.value = connection.downlink || 0
      rtt.value = connection.rtt || 0
    }
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateConnectionInfo)
      updateConnectionInfo()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)

    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection

    if (connection) {
      connection.removeEventListener('change', updateConnectionInfo)
    }
  })

  return {
    isOnline,
    effectiveType,
    downlink,
    rtt
  }
}

