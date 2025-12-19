<template>
  <BaseModal v-model="isOpen" title="Permissão de Localização" maxWidth="md">
    <div class="space-y-4">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <i class="fas fa-map-marker-alt text-3xl text-primary"></i>
        </div>
      </div>

      <!-- Message -->
      <div class="text-center">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
          {{ title || 'Precisamos da sua localização' }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ message || 'Para ajudar a encontrar documentos perdidos próximos a você.' }}
        </p>
      </div>

      <!-- Benefits -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
        <p class="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Por que precisamos disso?
        </p>
        <ul class="space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li class="flex items-start space-x-2">
            <i class="fas fa-check text-xs mt-0.5"></i>
            <span>Mostrar documentos perdidos perto de você</span>
          </li>
          <li class="flex items-start space-x-2">
            <i class="fas fa-check text-xs mt-0.5"></i>
            <span>Ajudar outros a encontrarem seus documentos</span>
          </li>
          <li class="flex items-start space-x-2">
            <i class="fas fa-check text-xs mt-0.5"></i>
            <span>Registrar onde você perdeu/encontrou</span>
          </li>
        </ul>
      </div>

      <!-- Privacy Note -->
      <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
        <i class="fas fa-lock mr-1"></i>
        Sua localização é usada apenas quando você permite e nunca é compartilhada sem seu consentimento.
      </p>

      <!-- Permission Denied Help -->
      <div v-if="permissionDenied" class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <p class="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
          Permissão Negada
        </p>
        <p class="text-xs text-red-700 dark:text-red-300 mb-3">
          Para habilitar a localização, siga as instruções:
        </p>
        
        <!-- Mobile Instructions -->
        <div v-if="isMobile" class="space-y-2 text-xs text-red-700 dark:text-red-300">
          <div v-if="isAndroid">
            <p class="font-semibold">Android (Chrome):</p>
            <ol class="list-decimal list-inside space-y-1 ml-2">
              <li>Abra Configurações do Chrome</li>
              <li>Toque em "Configurações do site"</li>
              <li>Toque em "Localização"</li>
              <li>Habilite para este site</li>
            </ol>
          </div>
          <div v-else-if="isIOS">
            <p class="font-semibold">iOS (Safari):</p>
            <ol class="list-decimal list-inside space-y-1 ml-2">
              <li>Abra Ajustes do iPhone</li>
              <li>Role até Safari</li>
              <li>Toque em "Localização"</li>
              <li>Selecione "Perguntar" ou "Permitir"</li>
            </ol>
          </div>
        </div>

        <!-- Desktop Instructions -->
        <div v-else class="space-y-2 text-xs text-red-700 dark:text-red-300">
          <p class="font-semibold">Desktop:</p>
          <ol class="list-decimal list-inside space-y-1 ml-2">
            <li>Clique no ícone de cadeado/informação na barra de endereço</li>
            <li>Procure "Localização"</li>
            <li>Altere para "Permitir"</li>
            <li>Recarregue a página</li>
          </ol>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex space-x-3">
        <BaseButton
          variant="secondary"
          full-width
          @click="handleDeny"
        >
          Agora não
        </BaseButton>
        <BaseButton
          variant="primary"
          full-width
          @click="handleAllow"
          :loading="requesting"
        >
          Permitir Localização
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  title?: string
  message?: string
}

const props = defineProps<Props>()
const isOpen = defineModel<boolean>()

const emit = defineEmits<{
  (e: 'allow'): void
  (e: 'deny'): void
}>()

const requesting = ref(false)
const permissionDenied = ref(false)

const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

const isAndroid = computed(() => {
  return /Android/i.test(navigator.userAgent)
})

const isIOS = computed(() => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
})

const handleAllow = async () => {
  requesting.value = true
  permissionDenied.value = false

  try {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          requesting.value = false
          emit('allow')
          isOpen.value = false
        },
        (error) => {
          requesting.value = false
          if (error.code === error.PERMISSION_DENIED) {
            permissionDenied.value = true
          }
          emit('deny')
        }
      )
    } else {
      requesting.value = false
      alert('Geolocalização não é suportada neste navegador')
      emit('deny')
    }
  } catch (err) {
    requesting.value = false
    emit('deny')
  }
}

const handleDeny = () => {
  emit('deny')
  isOpen.value = false
}
</script>

