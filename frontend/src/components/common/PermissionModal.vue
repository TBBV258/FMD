<template>
  <BaseModal v-model="isOpen" :title="title" maxWidth="md">
    <div class="space-y-4">
      <div class="flex justify-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <i :class="icon" class="text-3xl text-primary"></i>
        </div>
      </div>
      
      <div class="text-center">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ message }}
        </p>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
          <h4 class="font-medium text-sm text-gray-900 dark:text-dark-text mb-2">
            Como permitir:
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ helpText }}
          </p>
        </div>
      </div>
      
      <div v-if="denied" class="bg-danger/10 border border-danger/20 rounded-lg p-3">
        <div class="flex items-start space-x-2">
          <i class="fas fa-exclamation-triangle text-danger mt-0.5"></i>
          <div class="flex-1 text-sm text-danger">
            <p class="font-medium">Permissão Negada</p>
            <p class="mt-1">Você precisará permitir manualmente nas configurações do navegador.</p>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex space-x-2">
        <BaseButton 
          variant="outline" 
          @click="isOpen = false"
          class="flex-1"
        >
          Cancelar
        </BaseButton>
        <BaseButton 
          variant="primary" 
          @click="handleAllow"
          class="flex-1"
          :disabled="denied"
        >
          {{ denied ? 'Negado' : 'Permitir' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  type: 'camera' | 'location'
  denied?: boolean
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  denied: false,
  helpText: ''
})

const isOpen = defineModel<boolean>()

const emit = defineEmits<{
  allow: []
}>()

const title = props.type === 'camera' ? 'Permissão de Câmera' : 'Permissão de Localização'

const icon = props.type === 'camera' ? 'fas fa-camera' : 'fas fa-map-marker-alt'

const message = props.type === 'camera' 
  ? 'Precisamos de acesso à câmera para tirar fotos dos documentos.'
  : 'Precisamos de acesso à sua localização para mostrar documentos próximos.'

const handleAllow = () => {
  emit('allow')
  if (!props.denied) {
    isOpen.value = false
  }
}
</script>

