<template>
  <BaseModal v-model="isOpen" title="Adicionar Foto" maxWidth="sm">
    <div class="space-y-3">
      <!-- Camera Option -->
      <button
        @click="handleCamera"
        class="w-full flex items-center space-x-4 p-4 rounded-lg border-2 border-gray-200 dark:border-dark-border hover:border-primary hover:bg-primary/5 transition-all"
      >
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <i class="fas fa-camera text-xl text-primary"></i>
        </div>
        <div class="flex-1 text-left">
          <p class="font-semibold text-gray-900 dark:text-dark-text">Tirar Foto</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Usar câmera do dispositivo</p>
        </div>
        <i class="fas fa-chevron-right text-gray-400"></i>
      </button>

      <!-- Gallery Option -->
      <button
        @click="handleGallery"
        class="w-full flex items-center space-x-4 p-4 rounded-lg border-2 border-gray-200 dark:border-dark-border hover:border-primary hover:bg-primary/5 transition-all"
      >
        <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <i class="fas fa-images text-xl text-success"></i>
        </div>
        <div class="flex-1 text-left">
          <p class="font-semibold text-gray-900 dark:text-dark-text">Escolher da Galeria</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Selecionar foto existente</p>
        </div>
        <i class="fas fa-chevron-right text-gray-400"></i>
      </button>

      <!-- File Input (hidden) -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Camera Input (hidden) -->
      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <template #footer>
      <BaseButton
        variant="secondary"
        full-width
        @click="isOpen = false"
      >
        Cancelar
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const isOpen = defineModel<boolean>()
const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)

const handleCamera = () => {
  cameraInput.value?.click()
}

const handleGallery = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    emit('file-selected', file)
    isOpen.value = false
  }
  
  // Reset input
  if (target) {
    target.value = ''
  }
}
</script>

