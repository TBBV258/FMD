<template>
  <div class="min-h-screen bg-gray-50 dark:bg-dark-bg pb-16">
    <!-- Top Bar -->
    <TopBar 
      v-if="showTopBar" 
      :title="pageTitle"
      :notification-count="notificationCount"
    />
    
    <!-- Main Content -->
    <main class="container mx-auto px-0 sm:px-4 max-w-2xl">
      <slot></slot>
    </main>
    
    <!-- Bottom Navigation -->
    <BottomNavigation 
      v-if="showBottomNav"
      :chat-unread-count="chatUnreadCount"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationCount } from '@/composables/useNotificationCount'
import { useChat } from '@/composables/useChat'
import TopBar from './TopBar.vue'
import BottomNavigation from './BottomNavigation.vue'

interface Props {
  showTopBar?: boolean
  showBottomNav?: boolean
  notificationCount?: number
  chatUnreadCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  showTopBar: true,
  showBottomNav: true,
  notificationCount: undefined,
  chatUnreadCount: undefined
})

const route = useRoute()
const authStore = useAuthStore()

// Notification count
const { count: notificationCountValue, fetchCount: fetchNotificationCount, startRealtime: startNotificationRealtime, stopRealtime: stopNotificationRealtime } = useNotificationCount()

// Chat unread count
const { unreadTotal: chatUnreadCountValue, loadChatHistoryList, setCurrentUserId } = useChat(authStore.userId || '')

const notificationCount = computed(() => {
  return props.notificationCount !== undefined ? props.notificationCount : notificationCountValue.value
})

const chatUnreadCount = computed(() => {
  return props.chatUnreadCount !== undefined ? props.chatUnreadCount : chatUnreadCountValue.value
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'FindMyDocs',
    '/report-lost': 'Relatar Perda',
    '/report-found': 'Relatar Encontrado',
    '/chats': 'Conversas',
    '/notifications': 'Notificações',
    '/profile': 'Perfil'
  }
  
  return titles[route.path] || 'FindMyDocs'
})

// Load counts when user is authenticated
watch(() => authStore.userId, async (userId) => {
  if (userId) {
    setCurrentUserId(userId)
    await fetchNotificationCount(userId)
    await loadChatHistoryList()
    startNotificationRealtime(userId)
  } else {
    stopNotificationRealtime()
  }
}, { immediate: true })

onMounted(async () => {
  if (authStore.userId) {
    setCurrentUserId(authStore.userId)
    await fetchNotificationCount(authStore.userId)
    await loadChatHistoryList()
    startNotificationRealtime(authStore.userId)
  }
})

onBeforeUnmount(() => {
  stopNotificationRealtime()
})
</script>

