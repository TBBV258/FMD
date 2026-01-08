import { ref } from 'vue'
import { notificationsApi } from '@/api/notifications'
import { supabase } from '@/api/supabase'

export function useNotificationCount() {
  const count = ref(0)
  const isLoading = ref(false)
  let unsubscribe: (() => void) | null = null

  const fetchCount = async (userId: string) => {
    if (!userId) {
      count.value = 0
      return
    }

    isLoading.value = true
    try {
      const { count: notificationCount, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: false })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      count.value = notificationCount || 0
    } catch (error) {
      console.error('Error fetching notification count:', error)
      // Fallback: fetch all and count
      try {
        const { data } = await notificationsApi.fetch(userId)
        count.value = data.filter(n => !n.read).length
      } catch {
        count.value = 0
      }
    } finally {
      isLoading.value = false
    }
  }

  const startRealtime = (userId: string) => {
    if (unsubscribe || !userId) return

    unsubscribe = notificationsApi.subscribeToUser(userId, () => {
      // Refresh count when new notification arrives
      fetchCount(userId)
    })
  }

  const stopRealtime = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    count,
    isLoading,
    fetchCount,
    startRealtime,
    stopRealtime
  }
}

