<template>
  <MainLayout>
    <div class="px-4 py-6 space-y-6">
      <!-- Tabs -->
      <div class="flex rounded-full bg-gray-100 dark:bg-dark-card p-1">
        <button
          :class="tabClass('all')"
          @click="activeTab = 'all'"
        >
          Notificações
        </button>
        <button
          :class="tabClass('chats')"
          @click="activeTab = 'chats'"
        >
          Conversas
        </button>
      </div>

      <div v-if="displayedNotifications.length === 0" class="text-center py-12 card">
        <i class="fas fa-bell-slash text-gray-400 text-6xl mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {{ emptyState.title }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          {{ emptyState.subtitle }}
        </p>
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="notification in displayedNotifications"
          :key="notification.id"
          :class="notificationClass(notification.read)"
          class="card card-hover"
          @click="handleNotificationClick(notification)"
        >
          <div class="flex items-start space-x-3">
            <div :class="iconClass(notification.type)">
              <i :class="iconName(notification.type)"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-gray-900 dark:text-dark-text mb-1">
                {{ notification.title }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ notification.message }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatTime(notification.created_at) }}
              </p>
            </div>
            <button
              v-if="!notification.read"
              class="w-2 h-2 rounded-full bg-primary"
              @click.stop="markAsRead(notification.id)"
            ></button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { notificationsApi } from '@/api/notifications'
import { useToast } from '@/composables/useToast'
import type { Notification } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const { error: showError } = useToast()

const activeTab = ref<'all' | 'chats'>('all')
const notifications = ref<Notification[]>([])
const isLoading = ref(false)
let unsubscribe: (() => void) | null = null

const allNotifications = computed(() => notifications.value)

const chatNotifications = computed(() => 
  notifications.value.filter(n => n.type === 'message')
)

const displayedNotifications = computed(() => 
  activeTab.value === 'all' ? allNotifications.value : chatNotifications.value
)

const emptyState = computed(() => {
  if (activeTab.value === 'chats') {
    return {
      title: 'Sem conversas',
      subtitle: 'Quando alguém enviar uma mensagem, ela aparecerá aqui.'
    }
  }
  return {
    title: 'Sem notificações',
    subtitle: 'Você está em dia!'
  }
})

const notificationClass = (read: boolean) => {
  return read ? 'opacity-60' : ''
}

const tabClass = (tab: 'all' | 'chats') => {
  const base = 'flex-1 py-2 rounded-full text-sm font-semibold transition-colors'
  if (activeTab.value === tab) {
    return `${base} bg-white dark:bg-dark-bg text-primary shadow`
  }
  return `${base} text-gray-500`
}

const iconClass = (type: string) => {
  const classes = {
    match: 'w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center',
    message: 'w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center',
    system: 'w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 flex items-center justify-center',
    verification: 'w-10 h-10 rounded-full bg-warning/10 text-warning-dark flex items-center justify-center'
  }
  return classes[type as keyof typeof classes] || classes.system
}

const iconName = (type: string) => {
  const icons = {
    match: 'fas fa-check-double',
    message: 'fas fa-envelope',
    system: 'fas fa-info-circle',
    verification: 'fas fa-shield-alt'
  }
  return icons[type as keyof typeof icons] || 'fas fa-bell'
}

const formatTime = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}m atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const loadNotifications = async () => {
  if (!authStore.userId) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }

  isLoading.value = true
  try {
    notifications.value = await notificationsApi.fetch(authStore.userId)
  } catch (err: any) {
    showError(err.message || 'Erro ao carregar notificações')
  } finally {
    isLoading.value = false
  }
}

const startRealtime = () => {
  if (!authStore.userId || unsubscribe) return
  unsubscribe = notificationsApi.subscribeToUser(authStore.userId, (notification) => {
    notifications.value = [notification, ...notifications.value]
  })
}

const handleNotificationClick = async (notification: Notification) => {
  await markAsRead(notification.id)
  
  // Navigate based on notification type
  if (notification.type === 'match' && notification.data?.documentId) {
    router.push(`/document/${notification.data.documentId}`)
  } else if (notification.type === 'message' && notification.data?.documentId) {
    router.push(`/chat/${notification.data.documentId}`)
  } else if (notification.type === 'verification' && notification.data?.documentId) {
    router.push(`/document/${notification.data.documentId}`)
  }
  // System notifications don't navigate anywhere
}

const markAsRead = async (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (!notification || notification.read) return

  notification.read = true
  try {
    await notificationsApi.markAsRead(id)
  } catch (err: any) {
    showError(err.message || 'Erro ao atualizar notificação')
    notification.read = false
  }
}

onMounted(async () => {
  await loadNotifications()
  startRealtime()
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
})
</script>
