import { supabase } from '@/config/supabase'
import type { SMSNotification } from '@/types'

export const smsApi = {
  /**
   * Enviar SMS para um usuário
   */
  async sendSMS(
    userId: string,
    notificationType: string,
    title: string,
    details?: string,
    relatedId?: string
  ): Promise<string | null> {
    const { data, error } = await supabase.rpc('send_sms', {
      p_user_id: userId,
      p_notification_type: notificationType,
      p_title: title,
      p_details: details,
      p_related_id: relatedId
    })

    if (error) throw error
    return data
  },

  /**
   * Buscar histórico de SMS do usuário
   */
  async getMySMSHistory(): Promise<SMSNotification[]> {
    const { data, error } = await supabase
      .from('sms_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  },

  /**
   * Atualizar preferências de SMS
   */
  async updateSMSPreferences(
    enabled: boolean,
    highPriorityOnly: boolean = true
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.rpc('update_sms_preferences', {
      p_user_id: user.id,
      p_enabled: enabled,
      p_high_priority_only: highPriorityOnly
    })

    if (error) throw error
    return data
  },

  /**
   * Obter estatísticas de SMS
   */
  async getSMSStats() {
    const { data, error } = await supabase
      .from('sms_stats')
      .select('*')
      .limit(30)

    if (error) throw error
    return data || []
  },

  /**
   * Verificar se número é válido para Moçambique
   */
  isValidMozambiquePhone(phone: string): boolean {
    // Remove espaços e caracteres especiais
    const cleaned = phone.replace(/[^0-9+]/g, '')
    
    // Deve começar com +258 e ter 12 dígitos no total
    // ou começar com 8 e ter 9 dígitos
    const patterns = [
      /^\+258\d{9}$/,  // +258 84 123 4567
      /^258\d{9}$/,    // 258 84 123 4567
      /^8\d{8}$/       // 84 123 4567
    ]
    
    return patterns.some(pattern => pattern.test(cleaned))
  },

  /**
   * Formatar número para padrão internacional
   */
  formatMozambiquePhone(phone: string): string {
    const cleaned = phone.replace(/[^0-9+]/g, '')
    
    // Já está no formato internacional
    if (cleaned.startsWith('+258')) {
      return cleaned
    }
    
    // Começou com 258 mas sem +
    if (cleaned.startsWith('258')) {
      return '+' + cleaned
    }
    
    // Começou com 8 (formato local)
    if (cleaned.startsWith('8')) {
      return '+258' + cleaned
    }
    
    return cleaned
  }
}

