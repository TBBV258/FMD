import { supabase } from './supabase'
import type { ChatMessage } from '@/types'

export const chatsApi = {
  async fetchMessages(documentId: string, userId?: string) {
    let query = supabase
      .from('chats')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    // Optional safety filter: only messages involving the current user
    if (userId) {
      query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as ChatMessage[]
  },

  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at' | 'read'>) {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ ...message, read: false }])
      .select()
      .single()

    if (error) throw error
    return data as ChatMessage
  },

  subscribeToDocument(documentId: string, onInsert: (message: ChatMessage) => void) {
    const channel = supabase.channel(`chats:${documentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats', filter: `document_id=eq.${documentId}` },
        (payload) => {
          onInsert(payload.new as ChatMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

