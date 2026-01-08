import { supabase } from './supabase'

export interface Invoice {
  id: string
  user_id: string
  subscription_id?: string
  invoice_number: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  payment_method?: string
  payment_provider?: string
  payment_provider_transaction_id?: string
  description?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_at?: string
  due_date?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export const invoicesApi = {
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Invoice[]
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Invoice
  },

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single()

    if (error) throw error
    return data as Invoice
  },

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    // Generate invoice number if not provided
    if (!invoice.invoice_number) {
      const { data: invoiceNum } = await supabase.rpc('generate_invoice_number')
      invoice.invoice_number = invoiceNum || `INV-${Date.now()}`
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select()
      .single()

    if (error) throw error
    return data as Invoice
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Invoice
  },

  async downloadInvoice(id: string): Promise<Blob> {
    // This would typically generate a PDF, but for now we'll return invoice data as JSON
    const invoice = await this.getInvoiceById(id)
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' })
    return blob
  }
}

