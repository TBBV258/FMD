<template>
  <MainLayout>
    <section class="max-w-3xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-dark-text">Conversas</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Suas conversas por documento ou usuário
          </p>
        </div>
        <span v-if="unreadTotal" class="text-sm text-primary font-semibold">
          {{ unreadTotal }} não lida(s)
        </span>
      </div>

      <div v-if="loading" class="text-gray-500 dark:text-gray-400">Carregando...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>

      <ul v-else class="space-y-3">
        <li
          v-for="chat in previews"
          :key="chat.threadKey"
          class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-3 shadow-sm cursor-pointer hover:border-primary transition"
          @click="openChat(chat)"
        >
          <img
            :src="chat.other_user_avatar_url || 'https://placehold.co/48x48'"
            alt="Avatar"
            class="h-12 w-12 rounded-full object-cover"
          />
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 dark:text-dark-text truncate">
              {{ chat.other_user_name || 'Contato' }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {{ chat.last_message?.message || 'Sem mensagens' }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-400">
              {{ chat.last_message ? formatDate(chat.last_message.created_at) : '' }}
            </p>
            <span
              v-if="chat.unread_count"
              class="ml-auto inline-flex min-w-6 justify-center rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white"
            >
              {{ chat.unread_count }}
            </span>
          </div>
        </li>

        <li v-if="previews.length === 0" class="text-center text-gray-500 py-8">
          Nenhuma conversa encontrada.
        </li>
      </ul>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChat } from '@/composables/useChat'
import MainLayout from '@/components/layout/MainLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const { previews, loading, error, unreadTotal, loadChatHistoryList } = useChat(authStore.userId || '')

const openChat = (chat: { document_id: string | null }) => {
  if (chat.document_id) {
    router.push({ name: 'Chat', params: { documentId: chat.document_id } })
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

onMounted(() => {
  if (authStore.userId) {
    loadChatHistoryList()
  }
})

watch(
  () => authStore.userId,
  (id) => {
    if (id) {
      loadChatHistoryList()
    }
  }
)
</script>
