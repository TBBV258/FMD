<template>
  <div class="space-y-4">
    <div v-if="!enabled && !isSettingUp">
      <BaseButton variant="outline" @click="startSetup">
        <i class="fas fa-shield-alt mr-2"></i>
        Configurar 2FA
      </BaseButton>
    </div>

    <div v-else-if="isSettingUp && qrCodeUrl">
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Escaneie este código QR com seu aplicativo de autenticação (Google Authenticator, Authy, etc.)
        </p>
        
        <div class="flex justify-center">
          <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48 border border-gray-300 dark:border-gray-600 rounded-lg" />
        </div>

        <div class="bg-warning/10 border border-warning/20 rounded-lg p-3">
          <p class="text-sm font-semibold text-warning-dark mb-2">Códigos de Backup:</p>
          <div class="grid grid-cols-2 gap-2">
            <code
              v-for="(code, index) in backupCodes"
              :key="index"
              class="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded"
            >
              {{ code }}
            </code>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Guarde estes códigos em local seguro. Você precisará deles se perder acesso ao seu dispositivo.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Digite o código de verificação do app:
          </label>
          <input
            v-model="verificationCode"
            type="text"
            maxlength="6"
            placeholder="000000"
            class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text text-center text-2xl tracking-widest"
          />
        </div>

        <div class="flex space-x-2">
          <BaseButton variant="outline" full-width @click="cancelSetup">
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            full-width
            @click="verifyAndEnable"
            :disabled="!verificationCode || verificationCode.length !== 6"
            :loading="isVerifying"
          >
            Verificar e Ativar
          </BaseButton>
        </div>
      </div>
    </div>

    <div v-else-if="enabled">
      <div class="bg-success/10 border border-success/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold text-success-dark">2FA Ativado</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Sua conta está protegida com autenticação de dois fatores
            </p>
          </div>
          <BaseButton variant="danger" size="sm" @click="disable2FA" :loading="isDisabling">
            Desativar
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTwoFactorAuth } from '@/composables/useTwoFactorAuth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  enabled: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  enabled: []
  disabled: []
}>()

const { setup2FA, verifyAndEnable2FA, disable2FA: disable2FAComposable, isLoading, qrCodeUrl } = useTwoFactorAuth()
const { error: showError } = useToast()

const isSettingUp = ref(false)
const isVerifying = ref(false)
const isDisabling = ref(false)
const verificationCode = ref('')
const backupCodes = ref<string[]>([])

const startSetup = async () => {
  isSettingUp.value = true
  try {
    const result = await setup2FA()
    backupCodes.value = result.backupCodes
  } catch (err: any) {
    isSettingUp.value = false
    showError(err.message || 'Erro ao configurar 2FA')
  }
}

const cancelSetup = () => {
  isSettingUp.value = false
  verificationCode.value = ''
  backupCodes.value = []
}

const verifyAndEnable = async () => {
  isVerifying.value = true
  try {
    await verifyAndEnable2FA(verificationCode.value)
    emit('enabled')
    isSettingUp.value = false
    verificationCode.value = ''
  } catch (err: any) {
    showError(err.message || 'Código inválido')
  } finally {
    isVerifying.value = false
  }
}

const disable2FA = async () => {
  isDisabling.value = true
  try {
    await disable2FAComposable()
    emit('disabled')
  } catch (err: any) {
    showError(err.message || 'Erro ao desativar 2FA')
  } finally {
    isDisabling.value = false
  }
}
</script>

