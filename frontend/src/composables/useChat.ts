import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import type { ChatMessage } from '@/types'

export interface ChatPreview {
  threadKey: string // document:{id} ou users:{sortedPair}
  document_id: string | null
  other_user_id: string
  last_message: ChatMessage | null
  unread_count: number
  other_user_avatar_url?: string | null
  other_user_name?: string | null
}

export function useChat(initialUserId: string) {
  const currentUserId = ref(initialUserId)
  const previews = ref<ChatPreview[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const setCurrentUserId = (id: string) => {
    currentUserId.value = id
  }

  const loadChatHistoryList = async () => {
    if (!currentUserId.value) {
      previews.value = []
      return []
    }

    loading.value = true
    error.value = null

    // Primary query: chats table
    let messages: any[] | null = null
    let err: any = null
    {
      const res = await supabase
        .from('chats')
        .select('*')
        .or(`sender_id.eq.${currentUserId.value},receiver_id.eq.${currentUserId.value}`)
        .order('created_at', { ascending: false })
      messages = res.data
      err = res.error
    }

    // Fallback: legacy messages table (se existir)
    if (!messages?.length) {
      const resFallback = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId.value},receiver_id.eq.${currentUserId.value}`)
        .order('created_at', { ascending: false })
      if (resFallback.data?.length) {
        messages = resFallback.data
        err = resFallback.error
      }
    }

    if (err) {
      error.value = err.message
      loading.value = false
      return []
    }

    // Ensure messages is always an array
    const messagesArray = Array.isArray(messages) ? messages : []
    
    // Use a plain object instead of Map for better compatibility
    const threads: Record<string, ChatPreview> = {}

    messagesArray.forEach((msg: any) => {
      // Skip if message is missing required fields
      if (!msg || !msg.sender_id || !msg.receiver_id) return
      
      const otherId = msg.sender_id === currentUserId.value ? msg.receiver_id : msg.sender_id
      if (!otherId) return
      
      const threadKey =
        msg.document_id !== null && msg.document_id !== undefined
          ? `document:${msg.document_id}`
          : `users:${[currentUserId.value, otherId].sort().join('-')}`

      // Check read field (can be boolean or field name)
      const isRead = msg.read === true || msg.read === 'true' || msg.is_read === true
      const unreadInc = msg.receiver_id === currentUserId.value && !isRead ? 1 : 0
      const existing = threads[threadKey]

      if (!existing) {
        threads[threadKey] = {
          threadKey,
          document_id: msg.document_id,
          other_user_id: otherId,
          last_message: msg,
          unread_count: unreadInc
        }
      } else {
        if (!existing.last_message || msg.created_at > existing.last_message.created_at) {
          existing.last_message = msg
        }
        existing.unread_count += unreadInc
      }
    })

    previews.value = Object.values(threads).sort((a, b) =>
      (b.last_message?.created_at ?? '').localeCompare(a.last_message?.created_at ?? '')
    )

    // Enriquecer com perfil do outro usuário
    const uniqueUserIds = [...new Set(previews.value.map((p) => p.other_user_id))]
    if (uniqueUserIds.length) {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, avatar_url, full_name')
        .in('id', uniqueUserIds)

      if (!profileError && profiles && Array.isArray(profiles)) {
        const profileMap: Record<string, { avatar_url: string | null; full_name: string | null }> = {}
        profiles.forEach((p: any) => {
          if (p.id) {
            profileMap[p.id] = { avatar_url: p.avatar_url || null, full_name: p.full_name || null }
          }
        })

        previews.value = previews.value.map((p) => ({
          ...p,
          other_user_avatar_url: profileMap[p.other_user_id]?.avatar_url ?? null,
          other_user_name: profileMap[p.other_user_id]?.full_name ?? 'Usuário'
        }))
      } else {
        // Fallback: set default values if profiles not found
        previews.value = previews.value.map((p) => ({
          ...p,
          other_user_avatar_url: p.other_user_avatar_url ?? null,
          other_user_name: p.other_user_name ?? 'Usuário'
        }))
      }
    }

    loading.value = false
    return previews.value
  }

  const unreadTotal = computed(() =>
    previews.value.reduce((acc, item) => acc + item.unread_count, 0)
  )

  return {
    previews,
    loading,
    error,
    loadChatHistoryList,
    unreadTotal,
    setCurrentUserId
  }
}
