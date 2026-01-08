<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text">Galeria de Fotos</h3>
    
    <div v-if="isProcessing" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-gray-500">Processando imagens...</p>
      <p class="text-xs text-gray-400">{{ progress }}%</p>
    </div>

    <div v-else-if="processedImages.length === 0" class="text-center py-8 text-gray-500">
      <i class="fas fa-images text-4xl mb-2"></i>
      <p>Nenhuma foto disponível</p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div
        v-for="(image, index) in processedImages"
        :key="index"
        class="relative group cursor-pointer"
        @click="openLightbox(index)"
      >
        <div class="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            :src="image.url"
            :alt="`Documento ${index + 1}`"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
          <i class="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
        </div>
        <div v-if="image.hasBlur" class="absolute top-2 right-2">
          <span class="badge bg-warning/20 text-warning text-xs">
            <i class="fas fa-shield-alt mr-1"></i>Protegido
          </span>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <BaseModal v-model="showLightbox" title="Visualizar Foto" maxWidth="4xl">
      <div v-if="currentImage" class="relative">
        <img
          :src="currentImage.url"
          :alt="`Documento ${lightboxIndex + 1}`"
          class="w-full h-auto rounded-lg"
        />
        <div v-if="currentImage.hasBlur" class="mt-4 p-3 bg-warning/10 rounded-lg">
          <p class="text-sm text-warning-dark">
            <i class="fas fa-shield-alt mr-2"></i>
            Esta imagem foi processada para ocultar informações sensíveis
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center">
          <button
            v-if="lightboxIndex > 0"
            @click="lightboxIndex--"
            class="btn btn-outline"
          >
            <i class="fas fa-chevron-left mr-2"></i>Anterior
          </button>
          <span class="text-sm text-gray-500">
            {{ lightboxIndex + 1 }} / {{ processedImages.length }}
          </span>
          <button
            v-if="lightboxIndex < processedImages.length - 1"
            @click="lightboxIndex++"
            class="btn btn-outline"
          >
            Próxima<i class="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSensitiveDataBlur } from '@/composables/useSensitiveDataBlur'
import type { Document } from '@/types'
import BaseModal from '@/components/common/BaseModal.vue'

interface ProcessedImage {
  url: string
  hasBlur: boolean
  originalUrl: string
}

interface Props {
  documents: Document[]
  autoProcess?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoProcess: true
})

const { processImageForSensitiveData, isProcessing, progress } = useSensitiveDataBlur()
const processedImages = ref<ProcessedImage[]>([])
const showLightbox = ref(false)
const lightboxIndex = ref(0)

const currentImage = computed(() => processedImages.value[lightboxIndex.value])

const openLightbox = (index: number) => {
  lightboxIndex.value = index
  showLightbox.value = true
}

const processDocuments = async () => {
  if (props.documents.length === 0) return

  processedImages.value = []
  
  for (const doc of props.documents) {
    if (!doc.file_url && !doc.thumbnail_url) continue

    try {
      const imageUrl = doc.thumbnail_url || doc.file_url || ''
      
      // Fetch image as blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'document.jpg', { type: blob.type })

      // Process with blur
      const processedFile = await processImageForSensitiveData(file)
      const processedUrl = URL.createObjectURL(processedFile)

      processedImages.value.push({
        url: processedUrl,
        hasBlur: processedFile !== file,
        originalUrl: imageUrl
      })
    } catch (error) {
      console.error('Error processing image:', error)
      // Add original image if processing fails
      const imageUrl = doc.thumbnail_url || doc.file_url || ''
      if (imageUrl) {
        processedImages.value.push({
          url: imageUrl,
          hasBlur: false,
          originalUrl: imageUrl
        })
      }
    }
  }
}

onMounted(() => {
  if (props.autoProcess) {
    processDocuments()
  }
})

defineExpose({
  processDocuments,
  processedImages
})
</script>

