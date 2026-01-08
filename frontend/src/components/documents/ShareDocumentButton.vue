<template>
  <div class="relative">
    <BaseButton
      :variant="variant"
      :size="size"
      :loading="isGenerating"
      @click="handleShare"
      :class="buttonClass"
    >
      <i class="fas fa-share-alt mr-2"></i>
      {{ label }}
    </BaseButton>

    <!-- Share Options Dropdown -->
    <div
      v-if="showOptions"
      class="absolute top-full left-0 mt-2 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-50 min-w-[200px]"
      @click.stop
    >
      <button
        class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
        @click="shareToWhatsApp"
      >
        <i class="fab fa-whatsapp text-green-500 text-xl"></i>
        <span>WhatsApp</span>
      </button>
      <button
        class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
        @click="shareToFacebook"
      >
        <i class="fab fa-facebook text-blue-500 text-xl"></i>
        <span>Facebook</span>
      </button>
      <button
        class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
        @click="copyLink"
      >
        <i class="fas fa-link text-gray-500 text-xl"></i>
        <span>Copiar Link</span>
      </button>
      <button
        class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
        @click="downloadImage"
      >
        <i class="fas fa-download text-primary text-xl"></i>
        <span>Baixar Imagem</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useShareDocument } from '@/composables/useShareDocument'
import { useToast } from '@/composables/useToast'
import type { Document } from '@/types'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  document: Document
  variant?: 'primary' | 'outline' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  buttonClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  label: 'Partilhar',
  buttonClass: ''
})

const { isGenerating, generateShareImage, shareToWhatsApp: shareWhatsApp, shareToFacebook: shareFacebook, downloadShareImage } = useShareDocument()
const { success, error: showError } = useToast()
const showOptions = ref(false)
const shareImageUrl = ref<string | null>(null)

const handleShare = () => {
  showOptions.value = !showOptions.value
}

const generateImage = async () => {
  if (shareImageUrl.value) return shareImageUrl.value

  try {
    const url = await generateShareImage(props.document)
    shareImageUrl.value = url
    return url
  } catch (err: any) {
    showError(err.message || 'Erro ao gerar imagem para partilha')
    throw err
  }
}

const shareToWhatsApp = async () => {
  try {
    showOptions.value = false
    const imageUrl = await generateImage()
    await shareWhatsApp(props.document, imageUrl)
  } catch (err: any) {
    showError(err.message || 'Erro ao partilhar no WhatsApp')
  }
}

const shareToFacebook = async () => {
  try {
    showOptions.value = false
    const imageUrl = await generateImage()
    await shareFacebook(props.document, imageUrl)
  } catch (err: any) {
    showError(err.message || 'Erro ao partilhar no Facebook')
  }
}

const copyLink = async () => {
  try {
    showOptions.value = false
    const url = `${window.location.origin}/document/${props.document.id}`
    await navigator.clipboard.writeText(url)
    success('Link copiado para a área de transferência!')
  } catch (err: any) {
    showError('Erro ao copiar link')
  }
}

const downloadImage = async () => {
  try {
    showOptions.value = false
    if (!shareImageUrl.value) {
      await generateImage()
    }
    if (shareImageUrl.value) {
      await downloadShareImage(shareImageUrl.value, `findmydocs-${props.document.id}.png`)
      success('Imagem baixada com sucesso!')
    }
  } catch (err: any) {
    showError(err.message || 'Erro ao baixar imagem')
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showOptions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (shareImageUrl.value) {
    URL.revokeObjectURL(shareImageUrl.value)
  }
})
</script>

