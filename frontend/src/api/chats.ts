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
    
    // Map database fields to ChatMessage interface
    return (data || []).map((msg: any) => ({
      id: msg.id,
      document_id: msg.document_id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      message: msg.message,
      created_at: msg.created_at,
      read: msg.read || false
    })) as ChatMessage[]
  },

  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at' | 'read'>) {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ 
        document_id: message.document_id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        message: message.message,
        message_type: 'text',
        status: 'sent',
        read: false
      }])
      .select()
      .single()

    if (error) throw error
    
    // Map response to ChatMessage
    return {
      id: data.id,
      document_id: data.document_id,
      sender_id: data.sender_id,
      receiver_id: data.receiver_id,
      message: data.message,
      created_at: data.created_at,
      read: data.read || false
    } as ChatMessage
  },

  subscribeToDocument(documentId: string, onInsert: (message: ChatMessage) => void) {
    const channel = supabase.channel(`chats:${documentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats', filter: `document_id=eq.${documentId}` },
        (payload) => {
          const msg = payload.new as any
          onInsert({
            id: msg.id,
            document_id: msg.document_id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            message: msg.message,
            created_at: msg.created_at,
            read: msg.read || false
          } as ChatMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

