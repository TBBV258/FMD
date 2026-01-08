<template>
  <MainLayout>
    <div class="px-4 py-6 space-y-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">Configurações</h1>

      <!-- General Settings -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Configurações Gerais</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Idioma
            </label>
            <select
              v-model="settings.language"
              class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
              @change="updateSettings"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tema
            </label>
            <select
              v-model="settings.theme"
              class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
              @change="updateSettings"
            >
              <option value="system">Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Moeda
            </label>
            <select
              v-model="settings.currency"
              class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
              @change="updateSettings"
            >
              <option value="MZN">MZN - Metical</option>
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Preferências de Notificações</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-dark-text">Notificações Push</p>
              <p class="text-sm text-gray-500">Receber notificações no dispositivo</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="notificationPrefs.push_notifications"
                type="checkbox"
                class="sr-only peer"
                @change="updateNotificationPrefs"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-dark-text">Notificações por Email</p>
              <p class="text-sm text-gray-500">Receber notificações por email</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="notificationPrefs.email_notifications"
                type="checkbox"
                class="sr-only peer"
                @change="updateNotificationPrefs"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-dark-text">SMS (Apenas Alta Prioridade)</p>
              <p class="text-sm text-gray-500">Receber SMS apenas para notificações importantes</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="notificationPrefs.sms_high_priority_only"
                type="checkbox"
                class="sr-only peer"
                @change="updateNotificationPrefs"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Backup Settings -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Backup Automático</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-dark-text">Backup Automático</p>
              <p class="text-sm text-gray-500">Fazer backup automático dos seus documentos</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="settings.auto_backup"
                type="checkbox"
                class="sr-only peer"
                @change="updateSettings"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div v-if="settings.auto_backup">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequência de Backup
            </label>
            <select
              v-model="settings.backup_frequency"
              class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
              @change="updateSettings"
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          <div v-if="settings.last_backup_at" class="text-sm text-gray-500">
            Último backup: {{ formatDate(settings.last_backup_at) }}
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { settingsApi } from '@/api/settings'
import { profilesApi } from '@/api/profiles'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/components/layout/MainLayout.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const authStore = useAuthStore()
const { success, error: showError } = useToast()

const settings = ref({
  language: 'pt',
  theme: 'system',
  currency: 'MZN',
  timezone: 'Africa/Maputo',
  date_format: 'DD/MM/YYYY',
  auto_backup: false,
  backup_frequency: 'weekly',
  last_backup_at: undefined as string | undefined
})

const notificationPrefs = ref({
  push_notifications: true,
  email_notifications: true,
  sms_high_priority_only: true
})

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Nunca'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadSettings = async () => {
  if (!authStore.userId) return

  try {
    const userSettings = await settingsApi.getUserSettings(authStore.userId)
    if (userSettings) {
      settings.value = { ...settings.value, ...userSettings }
    }

    const profile = await profilesApi.get(authStore.userId)
    if (profile.preferences) {
      notificationPrefs.value = { ...notificationPrefs.value, ...profile.preferences }
    }
  } catch (err: any) {
    console.error('Error loading settings:', err)
  }
}

const updateSettings = async () => {
  if (!authStore.userId) return

  try {
    await settingsApi.createOrUpdateUserSettings(authStore.userId, settings.value)
    success('Configurações atualizadas!')
  } catch (err: any) {
    showError(err.message || 'Erro ao atualizar configurações')
  }
}

const updateNotificationPrefs = async () => {
  if (!authStore.userId) return

  try {
    await profilesApi.update(authStore.userId, {
      preferences: notificationPrefs.value
    })
    success('Preferências atualizadas!')
  } catch (err: any) {
    showError(err.message || 'Erro ao atualizar preferências')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

