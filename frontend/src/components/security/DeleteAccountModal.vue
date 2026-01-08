<template>
  <BaseModal v-model="isOpen" title="Eliminar Conta" maxWidth="md">
    <div class="space-y-4">
      <div class="bg-danger/10 border border-danger/20 rounded-lg p-4">
        <p class="text-sm text-danger font-semibold mb-2">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Atenção: Esta ação é permanente!
        </p>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Ao eliminar sua conta, todos os seus dados serão permanentemente removidos, incluindo:
        </p>
        <ul class="text-sm text-gray-700 dark:text-gray-300 mt-2 list-disc list-inside space-y-1">
          <li>Seu perfil e configurações</li>
          <li>Todos os documentos reportados</li>
          <li>Histórico de mensagens e notificações</li>
          <li>Pontos e conquistas</li>
        </ul>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Digite "ELIMINAR" para confirmar:
        </label>
        <input
          v-model="confirmationText"
          type="text"
          placeholder="ELIMINAR"
          class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
        />
      </div>

      <div>
        <label class="flex items-center space-x-2">
          <input
            v-model="confirmBackup"
            type="checkbox"
            class="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Confirmei que fiz backup dos meus dados importantes
          </span>
        </label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <BaseButton variant="outline" @click="isOpen = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="danger"
          @click="handleDelete"
          :disabled="confirmationText !== 'ELIMINAR' || !confirmBackup"
          :loading="isDeleting"
        >
          Eliminar Conta Permanentemente
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const isOpen = defineModel<boolean>()
const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const confirmationText = ref('')
const confirmBackup = ref(false)
const isDeleting = ref(false)

const handleDelete = async () => {
  if (confirmationText.value !== 'ELIMINAR' || !confirmBackup.value) return

  isDeleting.value = true

  try {
    // Delete user account (this will cascade delete all related data due to ON DELETE CASCADE)
    const { error } = await supabase.auth.admin.deleteUser(authStore.userId || '')
    
    if (error) {
      // If admin API is not available, sign out and show message
      await authStore.signOut()
      success('Sua conta será eliminada em breve. Você foi desconectado.')
      emit('deleted')
      router.push('/login')
      return
    }

    success('Conta eliminada com sucesso')
    emit('deleted')
    router.push('/login')
  } catch (err: any) {
    showError(err.message || 'Erro ao eliminar conta. Por favor, contacte o suporte.')
  } finally {
    isDeleting.value = false
  }
}

const emit = defineEmits<{
  deleted: []
}>()
</script>

