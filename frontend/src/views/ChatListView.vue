<template>
  <MainLayout>
    <section class="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">Conversas</h1>
        <span v-if="unreadTotal" class="text-sm text-primary">
          {{ unreadTotal }} não lidas
        </span>
      </header>

      <div v-if="loading" class="text-gray-500">Carregando conversas...</div>
      <div v-else-if="error" class="text-red-500">{{ error }}</div>

      <ul class="space-y-3">
        <li
          v-for="chat in previews"
          :key="chat.threadKey"
          class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-3 shadow-sm cursor-pointer"
          @click="openChat(chat)"
        >
          <img
            :src="chat.other_user_avatar_url || 'https://placehold.co/64x64'"
            alt="Avatar"
            class="h-12 w-12 rounded-full object-cover"
          />
          <div class="flex-1 overflow-hidden">
            <p class="font-semibold truncate">
              {{ chat.other_user_name || 'Contato' }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-300 truncate">
              {{ chat.last_message?.message || 'Sem mensagens' }}
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs text-gray-400">
              {{ chat.last_message ? formatDate(chat.last_message.created_at) : '' }}
            </p>
            <span
              v-if="chat.unread_count"
              class="ml-auto mt-1 inline-flex min-w-6 justify-center rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white"
            >
              {{ chat.unread_count }}
            </span>
          </div>
        </li>
      </ul>

      <EmptyState
        v-if="!loading && !error && previews.length === 0"
        title="Nenhuma conversa"
        description="Inicie uma nova conversa a partir de um documento."
      />
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/components/layout/MainLayout.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useChat } from '@/composables/useChat'

const router = useRouter()
const authStore = useAuthStore()
const { previews, loading, error, loadChatHistoryList, unreadTotal, setCurrentUserId } = useChat(
  authStore.userId || ''
)

const openChat = (chat: any) => {
  if (chat.document_id) {
    router.push({ name: 'Chat', params: { documentId: chat.document_id } })
  } else {
    // fallback: open chat by thread (could route to generic chat if exists)
    router.push({ name: 'Chat', params: { documentId: chat.threadKey.replace('users:', '') } })
  }
}

const formatDate = (date: string) =>
  new Date(date).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

onMounted(() => {
  if (authStore.userId) {
    loadChatHistoryList()
  }
})

watch(
  () => authStore.userId,
  (newId) => {
    if (newId) {
      setCurrentUserId(newId)
      loadChatHistoryList()
    } else {
      setCurrentUserId('')
    }
  }
)
</script>
