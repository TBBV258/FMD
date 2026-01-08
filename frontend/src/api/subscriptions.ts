import { supabase } from './supabase'

export interface Subscription {
  id: string
  user_id: string
  plan_type: 'free' | 'premium' | 'enterprise'
  billing_period: 'monthly' | 'quarterly' | 'annual'
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  started_at: string
  expires_at?: string
  cancelled_at?: string
  auto_renew: boolean
  payment_method?: string
  payment_provider?: string
  amount_paid?: number
  currency: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DocumentHighlight {
  id: string
  document_id: string
  user_id: string
  points_cost: number
  highlight_type: 'feed_top' | 'featured' | 'urgent'
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const subscriptionsApi = {
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data as Subscription | null
  },

  async getAllSubscriptions(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Subscription[]
  },

  async createSubscription(subscription: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single()

    if (error) throw error
    return data as Subscription
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Subscription
  },

  async cancelSubscription(id: string): Promise<Subscription> {
    return this.updateSubscription(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false
    })
  },

  async highlightDocument(documentId: string, userId: string, highlightType: DocumentHighlight['highlight_type'], pointsCost: number, durationDays: number): Promise<DocumentHighlight> {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    const { data, error } = await supabase
      .from('document_highlights')
      .insert([{
        document_id: documentId,
        user_id: userId,
        points_cost: pointsCost,
        highlight_type: highlightType,
        end_date: endDate.toISOString(),
        is_active: true
      }])
      .select()
      .single()

    if (error) throw error
    return data as DocumentHighlight
  },

  async getDocumentHighlights(documentId: string): Promise<DocumentHighlight[]> {
    const { data, error } = await supabase
      .from('document_highlights')
      .select('*')
      .eq('document_id', documentId)
      .eq('is_active', true)
      .gt('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as DocumentHighlight[]
  },

  async getUserHighlights(userId: string): Promise<DocumentHighlight[]> {
    const { data, error } = await supabase
      .from('document_highlights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as DocumentHighlight[]
  }
}

