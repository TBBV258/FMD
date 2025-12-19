import { ref } from 'vue'
import { smsApi } from '@/api/sms'
import type { SMSNotification } from '@/types'
import { useToast } from './useToast'

export function useSMS() {
  const smsHistory = ref<SMSNotification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { success, showError } = useToast()

  // Methods
  const sendSMS = async (
    userId: string,
    notificationType: string,
    title: string,
    details?: string,
    relatedId?: string
  ) => {
    loading.value = true
    error.value = null
    try {
      const smsId = await smsApi.sendSMS(userId, notificationType, title, details, relatedId)
      if (smsId) {
        success('SMS enviado com sucesso! 📱')
        return smsId
      } else {
        showError('Usuário não tem telefone cadastrado')
        return null
      }
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao enviar SMS: ' + err.message)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchSMSHistory = async () => {
    loading.value = true
    error.value = null
    try {
      smsHistory.value = await smsApi.getMySMSHistory()
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao carregar histórico: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const updateSMSPreferences = async (
    enabled: boolean,
    highPriorityOnly: boolean = true
  ) => {
    loading.value = true
    error.value = null
    try {
      await smsApi.updateSMSPreferences(enabled, highPriorityOnly)
      success(enabled ? 'SMS ativado' : 'SMS desativado')
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao atualizar preferências: ' + err.message)
      throw err
    } finally {
      loading.value = false
    }
  }

  const validatePhone = (phone: string): boolean => {
    return smsApi.isValidMozambiquePhone(phone)
  }

  const formatPhone = (phone: string): string => {
    return smsApi.formatMozambiquePhone(phone)
  }

  const getProviderName = (provider: string): string => {
    const providers: Record<string, string> = {
      movitel: 'Movitel',
      vodacom: 'Vodacom',
      tmcel: 'TMcel',
      twilio: 'Twilio',
      vonage: 'Vonage',
      africastalking: 'Africa\'s Talking'
    }
    return providers[provider] || provider
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      sent: 'Enviado',
      delivered: 'Entregue',
      failed: 'Falhou',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'text-warning-dark',
      sent: 'text-primary',
      delivered: 'text-success',
      failed: 'text-danger',
      cancelled: 'text-gray-500'
    }
    return colors[status] || 'text-gray-500'
  }

  return {
    smsHistory,
    loading,
    error,
    sendSMS,
    fetchSMSHistory,
    updateSMSPreferences,
    validatePhone,
    formatPhone,
    getProviderName,
    getStatusLabel,
    getStatusColor
  }
}

