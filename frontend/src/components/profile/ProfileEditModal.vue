<template>
  <BaseModal v-model="isOpen" title="Editar Perfil" maxWidth="lg">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Nome Completo -->
      <div>
        <label for="fullName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome Completo *
        </label>
        <input
          id="fullName"
          v-model="formData.full_name"
          type="text"
          required
          minlength="3"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-card dark:text-dark-text"
          placeholder="Digite seu nome completo"
        />
        <p v-if="errors.full_name" class="text-xs text-red-500 mt-1">{{ errors.full_name }}</p>
      </div>
      
      <!-- Telefone -->
      <div>
        <label for="phoneNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefone Celular *
        </label>
        <div class="flex">
          <span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
            +258
          </span>
          <input
            id="phoneNumber"
            v-model="formData.phone_number"
            type="tel"
            required
            pattern="[0-9]{9}"
            maxlength="9"
            class="rounded-none rounded-r-lg flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-card dark:text-dark-text"
            placeholder="XX XXX XXXX"
          />
        </div>
        <p class="text-xs text-gray-500 mt-1">Formato: 9 dígitos (ex: 841234567)</p>
        <p v-if="errors.phone_number" class="text-xs text-red-500 mt-1">{{ errors.phone_number }}</p>
      </div>
      
      <!-- Endereço para Entrega -->
      <div>
        <label for="deliveryAddress" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Endereço para Entrega de Documentos
        </label>
        <textarea
          id="deliveryAddress"
          v-model="formData.delivery_address"
          rows="3"
          maxlength="200"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark-card dark:text-dark-text resize-none"
          placeholder="Rua, bairro, cidade... (opcional)"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">
          {{ formData.delivery_address?.length || 0 }}/200 caracteres
        </p>
        <p v-if="errors.delivery_address" class="text-xs text-red-500 mt-1">{{ errors.delivery_address }}</p>
      </div>
      
      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-sm text-red-600 dark:text-red-400">
          <i class="fas fa-exclamation-circle mr-1"></i>
          {{ errorMessage }}
        </p>
      </div>
      
      <!-- Success Message -->
      <div v-if="successMessage" class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p class="text-sm text-green-600 dark:text-green-400">
          <i class="fas fa-check-circle mr-1"></i>
          {{ successMessage }}
        </p>
      </div>
    </form>
    
    <template #footer>
      <div class="flex space-x-3">
        <BaseButton
          variant="secondary"
          full-width
          @click="isOpen = false"
          :disabled="isSaving"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          full-width
          @click="handleSubmit"
          :loading="isSaving"
          :disabled="!isFormValid"
        >
          Salvar Alterações
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

interface ProfileData {
  full_name: string
  phone_number: string
  delivery_address: string
}

const isOpen = defineModel<boolean>()
const authStore = useAuthStore()

const formData = ref<ProfileData>({
  full_name: '',
  phone_number: '',
  delivery_address: ''
})

const errors = ref<Partial<Record<keyof ProfileData, string>>>({})
const errorMessage = ref('')
const successMessage = ref('')
const isSaving = ref(false)

// Load current profile data when modal opens
watch(isOpen, (newValue) => {
  if (newValue && authStore.profile) {
    formData.value = {
      full_name: authStore.profile.full_name || '',
      phone_number: authStore.profile.phone_number?.replace('+258', '') || '',
      delivery_address: (authStore.profile as any).delivery_address || ''
    }
    errors.value = {}
    errorMessage.value = ''
    successMessage.value = ''
  }
})

const isFormValid = computed(() => {
  return (
    formData.value.full_name.length >= 3 &&
    formData.value.phone_number.length === 9 &&
    /^[0-9]{9}$/.test(formData.value.phone_number) &&
    (formData.value.delivery_address?.length || 0) <= 200
  )
})

const validateForm = (): boolean => {
  errors.value = {}
  let isValid = true
  
  // Validate name
  if (formData.value.full_name.length < 3) {
    errors.value.full_name = 'Nome deve ter pelo menos 3 caracteres'
    isValid = false
  }
  
  // Validate phone
  if (!/^[0-9]{9}$/.test(formData.value.phone_number)) {
    errors.value.phone_number = 'Telefone deve ter 9 dígitos'
    isValid = false
  }
  
  // Validate address length
  if ((formData.value.delivery_address?.length || 0) > 200) {
    errors.value.delivery_address = 'Endereço deve ter no máximo 200 caracteres'
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  
  if (!validateForm()) {
    errorMessage.value = 'Por favor, corrija os erros no formulário'
    return
  }
  
  isSaving.value = true
  
  try {
    // Primeiro tenta atualizar com todos os campos
    let updates: any = {
      full_name: formData.value.full_name,
      phone_number: `+258${formData.value.phone_number}`
    }
    
    // Só adiciona delivery_address se o campo foi preenchido
    if (formData.value.delivery_address) {
      updates.delivery_address = formData.value.delivery_address
    }
    
    const result = await authStore.updateProfile(updates)
    
    if (result.success) {
      successMessage.value = 'Perfil atualizado com sucesso!'
      setTimeout(() => {
        isOpen.value = false
      }, 1500)
    } else {
      // Se erro for sobre delivery_address, tenta sem esse campo
      if (result.error?.includes('delivery_address') || result.error?.includes('column')) {
        console.warn('Campo delivery_address não existe, tentando sem ele...')
        const updatesWithoutAddress = {
          full_name: formData.value.full_name,
          phone_number: `+258${formData.value.phone_number}`
        }
        
        const retryResult = await authStore.updateProfile(updatesWithoutAddress)
        
        if (retryResult.success) {
          successMessage.value = 'Perfil atualizado! (Endereço não salvo - execute a migração do banco)'
          setTimeout(() => {
            isOpen.value = false
          }, 2000)
        } else {
          errorMessage.value = retryResult.error || 'Erro ao atualizar perfil'
        }
      } else {
        errorMessage.value = result.error || 'Erro ao atualizar perfil'
      }
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Erro inesperado ao atualizar perfil'
  } finally {
    isSaving.value = false
  }
}
</script>

