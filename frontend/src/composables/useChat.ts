import { ref, computed } from 'vue'
import { supabase } from '@/api/supabase'
import type { ChatMessage } from '@/types'

export interface ChatPreview {
  threadKey: string
  document_id: string | null
  other_user_id: string
  last_message: ChatMessage | null
  unread_count: number
  other_user_avatar_url?: string | null
  other_user_name?: string | null
}

export function useChat(currentUserId: string) {
  const previews = ref<ChatPreview[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadChatHistoryList = async () => {
    loading.value = true
    error.value = null

    const { data: messages, error: err } = await supabase
      .from('chats')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })

    if (err) {
      error.value = err.message
      loading.value = false
      return []
    }

    const threadMap = new Map<string, ChatPreview>()

    ;(messages ?? []).forEach((message) => {
      const otherId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id
      const threadKey =
        message.document_id && message.document_id.length > 0
          ? `document:${message.document_id}`
          : `users:${[currentUserId, otherId].sort().join('-')}`

      const unreadIncrement = message.receiver_id === currentUserId && !message.read ? 1 : 0
      const existing = threadMap.get(threadKey)

      if (!existing) {
        threadMap.set(threadKey, {
          threadKey,
          document_id: message.document_id,
          other_user_id: otherId,
          last_message: message as ChatMessage,
          unread_count: unreadIncrement
        })
      } else {
        if (
          !existing.last_message ||
          new Date(message.created_at).getTime() > new Date(existing.last_message.created_at).getTime()
        ) {
          existing.last_message = message as ChatMessage
        }
        existing.unread_count += unreadIncrement
      }
    })

    const list = Array.from(threadMap.values()).sort((a, b) =>
      (b.last_message?.created_at ?? '').localeCompare(a.last_message?.created_at ?? '')
    )

    // Enrich with profile info (avatar + nome)
    const userIds = [...new Set(list.map((item) => item.other_user_id))].filter(Boolean)
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      )

      list.forEach((item) => {
        const profile = profileMap.get(item.other_user_id)
        item.other_user_avatar_url = profile?.avatar_url ?? null
        item.other_user_name = profile?.full_name ?? 'Usuário'
      })
    }

    previews.value = list
    loading.value = false
    return previews.value
  }

  const unreadTotal = computed(() =>
    previews.value.reduce((total, preview) => total + preview.unread_count, 0)
  )

  return {
    previews,
    loading,
    error,
    unreadTotal,
    loadChatHistoryList
  }
}
