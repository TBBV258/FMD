<template>
  <MainLayout :show-bottom-nav="false">
    <div class="px-4 py-6">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <button class="btn-icon mb-4" @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
            Relatar Documento Perdido
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Preencha as informações para ajudarmos a encontrar seu documento
          </p>
        </div>
        
        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Document Type -->
          <div class="form-group">
            <label class="form-label">Tipo de Documento *</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="type in documentTypes"
                :key="type.value"
                type="button"
                :class="typeButtonClass(type.value)"
                @click="formData.type = type.value"
              >
                <i :class="type.icon" class="text-2xl mb-2"></i>
                <span class="text-sm">{{ type.label }}</span>
              </button>
            </div>
          </div>
          
          <!-- Title -->
          <BaseInput
            v-model="formData.title"
            label="Título do Documento"
            placeholder="Ex: BI João Silva"
            required
          />
          
          <!-- Description -->
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea
              v-model="formData.description"
              class="input min-h-[100px] resize-none"
              placeholder="Descreva detalhes do documento..."
            ></textarea>
          </div>
          
          <!-- Document Number -->
          <BaseInput
            v-model="formData.documentNumber"
            label="Número do Documento (opcional)"
            placeholder="Ex: 110100123456A"
          />
          
          <!-- Location -->
          <BaseInput
            v-model="formData.location"
            label="Onde perdeu?"
            placeholder="Ex: Praça da Independência, Maputo"
            icon="fas fa-map-marker-alt"
          />
          
          <!-- Upload Photo -->
          <div class="form-group">
            <label class="form-label">Foto do Documento (opcional)</label>
            <div
              class="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              @click="triggerFileInput"
            >
              <div v-if="!formData.file && !isBlurProcessing">
                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-600 dark:text-gray-400">
                  Clique para adicionar foto
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  <i class="fas fa-shield-alt text-warning-dark"></i>
                  Dados sensíveis serão automaticamente protegidos
                </p>
              </div>
              <div v-else-if="isBlurProcessing" class="space-y-2">
                <div class="spinner mx-auto"></div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Protegendo dados sensíveis... {{ blurProgress }}%
                </p>
              </div>
              <div v-else class="flex items-center justify-center space-x-2">
                <i class="fas fa-file text-primary"></i>
                <span>{{ formData.file.name }}</span>
                <button type="button" @click.stop="formData.file = undefined" class="text-danger">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <div v-if="showBlurWarning" class="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p class="text-sm text-warning-dark flex items-start space-x-2">
                <i class="fas fa-info-circle mt-0.5"></i>
                <span>
                  <strong>Aviso de Segurança:</strong> Certifique-se de que números de BI, NUIT e outros dados sensíveis estão ocultos na imagem antes de fazer upload.
                </span>
              </p>
            </div>
          </div>
          
          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isSubmitting || isBlurProcessing"
            :disabled="isBlurProcessing"
            loading-text="Publicando..."
          >
            <i class="fas fa-paper-plane mr-2"></i>
            Publicar Documento Perdido
          </BaseButton>
        </form>
      </div>
    </div>
    
    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDocumentsStore } from '@/stores/documents'
import { useToast } from '@/composables/useToast'
import { useSensitiveDataBlur } from '@/composables/useSensitiveDataBlur'
import type { DocumentFormData, DocumentType } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const authStore = useAuthStore()
const documentsStore = useDocumentsStore()
const { success, error: showError } = useToast()
const { isProcessing: isBlurProcessing, progress: blurProgress, applyCommonDocumentBlur } = useSensitiveDataBlur()

const isSubmitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showBlurWarning = ref(false)

const formData = reactive<DocumentFormData>({
  title: '',
  type: 'bi',
  status: 'lost',
  description: '',
  location: '',
  documentNumber: '',
  file: undefined
})

const documentTypes = [
  { label: 'Bilhete de Identidade (BI)', value: 'bi' as DocumentType, icon: 'fas fa-id-card' },
  { label: 'Passaporte', value: 'passport' as DocumentType, icon: 'fas fa-passport' },
  { label: 'Carta de Condução', value: 'driver_license' as DocumentType, icon: 'fas fa-id-card-alt' },
  { label: 'DIRE', value: 'dire' as DocumentType, icon: 'fas fa-id-card' },
  { label: 'NUIT', value: 'nuit' as DocumentType, icon: 'fas fa-file-invoice' },
  { label: 'Cartão de Trabalho', value: 'work_card' as DocumentType, icon: 'fas fa-briefcase' },
  { label: 'Cartão de Estudante', value: 'student_card' as DocumentType, icon: 'fas fa-graduation-cap' },
  { label: 'Cartão de Eleitor', value: 'voter_card' as DocumentType, icon: 'fas fa-vote-yea' },
  { label: 'Certidão de Nascimento', value: 'birth_certificate' as DocumentType, icon: 'fas fa-file-alt' },
  { label: 'Título de Propriedade', value: 'title_deed' as DocumentType, icon: 'fas fa-home' },
  { label: 'Outro', value: 'other' as DocumentType, icon: 'fas fa-file' }
]

const typeButtonClass = (value: string) => {
  const base = 'card flex flex-col items-center justify-center p-4 cursor-pointer transition-all'
  if (value === formData.type) {
    return `${base} border-2 border-primary bg-primary/5`
  }
  return `${base} hover:border-primary`
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // Verificar se é uma imagem
    if (file.type.startsWith('image/')) {
      try {
        // Aplicar blur automático em dados sensíveis
        showBlurWarning.value = true
        const processedFile = await applyCommonDocumentBlur(file)
        formData.file = processedFile
        success('Imagem processada! Dados sensíveis foram protegidos.')
      } catch (error) {
        console.error('Erro ao processar imagem:', error)
        // Em caso de erro, usar arquivo original mas mostrar aviso
        formData.file = file
        showBlurWarning.value = true
        showError('Não foi possível processar a imagem automaticamente. Por favor, certifique-se de ocultar dados sensíveis manualmente.')
      }
    } else {
      formData.file = file
    }
  }
}

const handleSubmit = async () => {
  if (!authStore.userId) {
    showError('Você precisa estar logado para relatar um documento')
    router.push('/login')
    return
  }
  
  if (!formData.title.trim()) {
    showError('Por favor, preencha o título do documento')
    return
  }
  
  isSubmitting.value = true
  
  const result = await documentsStore.createDocument(authStore.userId, formData)
  
  isSubmitting.value = false
  
  if (result.success) {
    success('Documento publicado com sucesso!')
    router.push('/')
  } else {
    showError(result.error || 'Erro ao publicar documento')
  }
}
</script>
