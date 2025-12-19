<template>
  <MainLayout :show-top-bar="false">
    <div class="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col">
      <!-- Header -->
      <header class="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border pt-safe px-4 py-3">
        <div class="flex items-center space-x-3">
          <button class="btn-icon" @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-dark-text">Chat</h3>
            <p class="text-sm text-gray-500">Documento #{{ documentId.slice(0, 8) }}</p>
          </div>
        </div>
      </header>
      
      <!-- Messages Container -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="messageClass(message.sender_id)"
      >
        <div :class="bubbleClass(message.sender_id)">
          <p class="text-sm">{{ message.message }}</p>
          <p class="text-xs opacity-70 mt-1">
            {{ formatTime(message.created_at) }}
          </p>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="text-center py-12">
        <i class="fas fa-comments text-gray-400 text-6xl mb-4"></i>
        <p class="text-gray-500">Nenhuma mensagem ainda</p>
        <p class="text-sm text-gray-400">Inicie a conversa!</p>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border p-4 pb-safe">
      <form @submit.prevent="handleSend" class="flex items-end space-x-2">
        <textarea
          v-model="newMessage"
          placeholder="Digite sua mensagem..."
          class="input flex-1 min-h-[44px] max-h-32 resize-none"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
        ></textarea>
        <BaseButton
          type="submit"
          variant="primary"
          :disabled="!newMessage.trim()"
        >
          <i class="fas fa-paper-plane"></i>
        </BaseButton>
      </form>
    </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDocumentsStore } from '@/stores/documents'
import { useToast } from '@/composables/useToast'
import { chatsApi } from '@/api/chats'
import type { ChatMessage } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const documentsStore = useDocumentsStore()
const { error: showError } = useToast()

const documentId = route.params.documentId as string
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const messages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const receiverId = ref<string>('')
let unsubscribe: (() => void) | null = null

const ensureAuthenticated = () => {
  if (!authStore.userId) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return false
  }
  return true
}

const resolveReceiver = (items: ChatMessage[], documentOwnerId?: string) => {
  const current = authStore.userId
  const participant = items
    .map(m => (m.sender_id === current ? m.receiver_id : m.sender_id))
    .find(id => id && id !== current)

  if (participant) return participant
  if (documentOwnerId && documentOwnerId !== current) return documentOwnerId
  return ''
}

const loadChat = async () => {
  if (!ensureAuthenticated()) return

  isLoading.value = true
  let documentOwnerId = ''

  try {
    const documentResult = await documentsStore.fetchDocumentById(documentId)
    documentOwnerId = (documentResult?.data?.user_id || documentsStore.currentDocument?.user_id || '') as string

    messages.value = await chatsApi.fetchMessages(documentId, authStore.userId || undefined)
    receiverId.value = resolveReceiver(messages.value, documentOwnerId)
  } catch (err: any) {
    showError(err.message || 'Erro ao carregar chat')
  } finally {
    isLoading.value = false
  }

  await nextTick()
  scrollToBottom()
  startRealtime()
}

const startRealtime = () => {
  if (unsubscribe) return
  unsubscribe = chatsApi.subscribeToDocument(documentId, (message) => {
    const exists = messages.value.some(m => m.id === message.id)
    if (!exists) {
      messages.value.push(message)
      nextTick().then(scrollToBottom)
    }
  })
}

const messageClass = (senderId: string) => {
  const isOwn = senderId === authStore.userId
  return `flex ${isOwn ? 'justify-end' : 'justify-start'}`
}

const bubbleClass = (senderId: string) => {
  const isOwn = senderId === authStore.userId
  const base = 'max-w-[75%] rounded-2xl px-4 py-2'
  if (isOwn) {
    return `${base} bg-primary text-white`
  }
  return `${base} bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text`
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSend = async () => {
  if (!newMessage.value.trim()) return
  if (!ensureAuthenticated()) return

  if (!receiverId.value) {
    showError('Não foi possível identificar o destinatário.')
    return
  }

  try {
    const message = await chatsApi.sendMessage({
      document_id: documentId,
      sender_id: authStore.userId as string,
      receiver_id: receiverId.value,
      message: newMessage.value.trim()
    })

    messages.value.push(message)
    newMessage.value = ''
    await nextTick()
    scrollToBottom()
  } catch (err: any) {
    showError(err.message || 'Erro ao enviar mensagem')
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  loadChat()
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
})
</script>
