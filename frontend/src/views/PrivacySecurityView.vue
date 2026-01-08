<template>
  <MainLayout>
    <div class="px-4 py-6 space-y-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">Privacidade e Segurança</h1>

      <!-- Privacy Settings -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Configurações de Privacidade</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-dark-text">Mostrar número de telefone</p>
              <p class="text-sm text-gray-500">Permitir que outros usuários vejam seu telefone</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="privacySettings.show_phone_number"
                type="checkbox"
                class="sr-only peer"
                @change="updatePrivacySettings"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-dark-text">Requerer pedido de contacto</p>
              <p class="text-sm text-gray-500">Apenas mostrar telefone após aceitar pedido</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="privacySettings.require_contact_request"
                type="checkbox"
                class="sr-only peer"
                @change="updatePrivacySettings"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-dark-text">Mostrar localização exata</p>
              <p class="text-sm text-gray-500">Permitir que outros vejam sua localização precisa</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="privacySettings.show_exact_location"
                type="checkbox"
                class="sr-only peer"
                @change="updatePrivacySettings"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Configurações de Segurança</h2>
        
        <!-- Change Password -->
        <div class="space-y-4">
          <div>
            <h3 class="font-medium text-gray-900 dark:text-dark-text mb-2">Alterar Palavra-passe</h3>
            <div class="space-y-3">
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="Palavra-passe atual"
                class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
              />
              <input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="Nova palavra-passe"
                class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
              />
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="Confirmar nova palavra-passe"
                class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
              />
              <BaseButton
                variant="primary"
                size="sm"
                @click="handleChangePassword"
                :loading="isChangingPassword"
              >
                Alterar Palavra-passe
              </BaseButton>
            </div>
          </div>

          <!-- Two-Factor Authentication -->
          <div class="pt-4 border-t border-gray-200 dark:border-dark-border">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-dark-text">Autenticação de Dois Fatores (2FA)</h3>
                <p class="text-sm text-gray-500">Adicione uma camada extra de segurança à sua conta</p>
              </div>
              <span v-if="is2FAEnabled" class="badge badge-success">Ativado</span>
              <span v-else class="badge bg-gray-500/10 text-gray-600">Desativado</span>
            </div>
            
            <TwoFactorAuthSetup
              :enabled="is2FAEnabled"
              @enabled="is2FAEnabled = true"
              @disabled="is2FAEnabled = false"
            />
          </div>
        </div>
      </div>

      <!-- Delete Account -->
      <div class="card border-danger/20">
        <h2 class="text-lg font-semibold text-danger mb-4">Zona Perigosa</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Ao eliminar sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
        </p>
        <BaseButton
          variant="danger"
          @click="showDeleteModal = true"
        >
          <i class="fas fa-trash mr-2"></i>
          Eliminar Conta
        </BaseButton>
      </div>

      <!-- Delete Account Modal -->
      <DeleteAccountModal
        v-model="showDeleteModal"
        @deleted="handleAccountDeleted"
      />

      <ToastContainer />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { settingsApi } from '@/api/settings'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import TwoFactorAuthSetup from '@/components/security/TwoFactorAuthSetup.vue'
import DeleteAccountModal from '@/components/security/DeleteAccountModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const privacySettings = ref({
  show_phone_number: false,
  require_contact_request: true,
  show_exact_location: false,
  show_document_count: true,
  show_points: true,
  allow_profile_search: true,
  share_analytics: false
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const is2FAEnabled = ref(false)
const isChangingPassword = ref(false)
const showDeleteModal = ref(false)

const loadSettings = async () => {
  if (!authStore.userId) return

  try {
    const privacy = await settingsApi.getPrivacySettings(authStore.userId)
    if (privacy) {
      privacySettings.value = { ...privacySettings.value, ...privacy }
    }

    const security = await settingsApi.getSecuritySettings(authStore.userId)
    if (security) {
      is2FAEnabled.value = security.two_factor_enabled || false
    }
  } catch (err: any) {
    console.error('Error loading settings:', err)
  }
}

const updatePrivacySettings = async () => {
  if (!authStore.userId) return

  try {
    await settingsApi.createOrUpdatePrivacySettings(authStore.userId, privacySettings.value)
    success('Configurações de privacidade atualizadas!')
  } catch (err: any) {
    showError(err.message || 'Erro ao atualizar configurações')
  }
}

const handleChangePassword = async () => {
  if (!passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    showError('Por favor, preencha todos os campos')
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showError('As palavras-passe não coincidem')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    showError('A palavra-passe deve ter pelo menos 6 caracteres')
    return
  }

  isChangingPassword.value = true

  try {
    await settingsApi.updatePassword(passwordForm.value.newPassword)
    success('Palavra-passe alterada com sucesso!')
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (err: any) {
    showError(err.message || 'Erro ao alterar palavra-passe')
  } finally {
    isChangingPassword.value = false
  }
}

const handleAccountDeleted = () => {
  router.push('/login')
}

onMounted(() => {
  loadSettings()
})
</script>

