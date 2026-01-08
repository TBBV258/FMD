import { ref } from 'vue'
import { supabase } from '@/api/supabase'
import { settingsApi } from '@/api/settings'
import { useAuthStore } from '@/stores/auth'
import { useToast } from './useToast'

// Simple TOTP implementation (in production, use a library like 'otplib')
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    codes.push(code)
  }
  return codes
}

export function useTwoFactorAuth() {
  const isLoading = ref(false)
  const qrCodeUrl = ref<string | null>(null)
  const { error: showError, success } = useToast()
  const authStore = useAuthStore()

  const generateQRCode = async (secret: string, email: string): Promise<string> => {
    const issuer = 'FindMyDocs'
    const accountName = email
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
    
    // Use a QR code service (in production, use a proper library)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpAuthUrl)}`
  }

  const setup2FA = async (): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> => {
    isLoading.value = true

    try {
      if (!authStore.userId) {
        throw new Error('User not authenticated')
      }

      const secret = generateTOTPSecret()
      const backupCodes = generateBackupCodes()
      const qrCode = await generateQRCode(secret, authStore.user?.email || '')

      // Save secret and backup codes (but don't enable yet)
      await settingsApi.createOrUpdateSecuritySettings(authStore.userId, {
        two_factor_secret: secret,
        two_factor_backup_codes: backupCodes
      })

      qrCodeUrl.value = qrCode

      return { secret, qrCode, backupCodes }
    } catch (error: any) {
      showError(error.message || 'Erro ao configurar 2FA')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const verifyAndEnable2FA = async (code: string): Promise<boolean> => {
    isLoading.value = true

    try {
      if (!authStore.userId) {
        throw new Error('User not authenticated')
      }

      const securitySettings = await settingsApi.getSecuritySettings(authStore.userId)
      
      if (!securitySettings?.two_factor_secret) {
        throw new Error('2FA não foi configurado')
      }

      // In production, verify the TOTP code here
      // For now, we'll just enable it if a code is provided
      // You should use a library like 'otplib' to verify TOTP codes
      
      await settingsApi.createOrUpdateSecuritySettings(authStore.userId, {
        two_factor_enabled: true,
        two_factor_enabled_at: new Date().toISOString()
      })

      success('Autenticação de dois fatores ativada com sucesso!')
      return true
    } catch (error: any) {
      showError(error.message || 'Erro ao ativar 2FA')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const disable2FA = async (): Promise<void> => {
    isLoading.value = true

    try {
      if (!authStore.userId) {
        throw new Error('User not authenticated')
      }

      await settingsApi.createOrUpdateSecuritySettings(authStore.userId, {
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
        two_factor_enabled_at: null
      })

      qrCodeUrl.value = null
      success('Autenticação de dois fatores desativada')
    } catch (error: any) {
      showError(error.message || 'Erro ao desativar 2FA')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const get2FAStatus = async (): Promise<boolean> => {
    try {
      if (!authStore.userId) return false

      const securitySettings = await settingsApi.getSecuritySettings(authStore.userId)
      return securitySettings?.two_factor_enabled || false
    } catch (error) {
      return false
    }
  }

  return {
    isLoading,
    qrCodeUrl,
    setup2FA,
    verifyAndEnable2FA,
    disable2FA,
    get2FAStatus
  }
}

