import { supabase } from './supabase'
import type { Notification } from '@/types'

export const notificationsApi = {
  async fetch(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Map database fields to Notification interface
    return (data || []).map((notif: any) => ({
      id: notif.id,
      user_id: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data || notif.metadata || {},
      read: notif.is_read || notif.read || false,
      created_at: notif.created_at
    })) as Notification[]
  },

  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Notification
  },

  async markAllAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()

    if (error) throw error
    return data as Notification[]
  },

  subscribeToUser(userId: string, onInsert: (notification: Notification) => void) {
    const channel = supabase.channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const notif = payload.new as any
          onInsert({
            id: notif.id,
            user_id: notif.user_id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            data: notif.data || notif.metadata || {},
            read: notif.is_read || notif.read || false,
            created_at: notif.created_at
          } as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

