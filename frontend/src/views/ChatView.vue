<template>
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
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ChatMessage } from '@/types'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const documentId = route.params.documentId as string
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

// Mock messages
const messages = ref<ChatMessage[]>([
  {
    id: '1',
    document_id: documentId,
    sender_id: 'other',
    receiver_id: authStore.userId || '',
    message: 'Olá! Vi que você perdeu um documento.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  {
    id: '2',
    document_id: documentId,
    sender_id: authStore.userId || '',
    receiver_id: 'other',
    message: 'Sim, é meu BI. Você o encontrou?',
    created_at: new Date(Date.now() - 3000000).toISOString(),
    read: true
  }
])

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
  
  const message: ChatMessage = {
    id: Date.now().toString(),
    document_id: documentId,
    sender_id: authStore.userId || '',
    receiver_id: 'other',
    message: newMessage.value,
    created_at: new Date().toISOString(),
    read: false
  }
  
  messages.value.push(message)
  newMessage.value = ''
  
  await nextTick()
  scrollToBottom()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>
