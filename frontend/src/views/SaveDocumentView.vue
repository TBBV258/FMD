<template>
  <MainLayout>
    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">
          Guardar Documento
        </h1>
        <button 
          @click="router.back()"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <div class="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div class="flex items-start space-x-3">
          <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
          <div class="flex-1">
            <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Documento Privado
            </h3>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Este documento ficará guardado apenas no seu perfil. Para reportá-lo como perdido, vá em "Meus Documentos" e mude o status.
            </p>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Tipo de Documento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Documento *
          </label>
          <select
            v-model="form.type"
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Selecione o tipo</option>
            <option value="bi">Bilhete de Identidade (BI)</option>
            <option value="passport">Passaporte</option>
            <option value="driver_license">Carta de Condução</option>
            <option value="dire">DIRE</option>
            <option value="nuit">NUIT</option>
            <option value="work_card">Cartão de Trabalho</option>
            <option value="student_card">Cartão de Estudante</option>
            <option value="voter_card">Cartão de Eleitor</option>
            <option value="birth_certificate">Certidão de Nascimento</option>
            <option value="title_deed">Título de Propriedade</option>
            <option value="other">Outro</option>
          </select>
        </div>

        <!-- Título -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="Ex: Meu BI"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Número do Documento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número do Documento
          </label>
          <input
            v-model="form.document_number"
            type="text"
            placeholder="Ex: 110100123456A"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Descrição -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Notas adicionais sobre o documento..."
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-primary focus:border-transparent"
          ></textarea>
        </div>

        <!-- Upload de Arquivo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Foto/Scan do Documento *
          </label>
          <div 
            class="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
            @click="$refs.fileInput.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            :class="{ 'border-primary bg-primary/5': isDragging }"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*,.pdf"
              @change="handleFileSelect"
              class="hidden"
              required
            />
            <div v-if="!selectedFile">
              <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
              <p class="text-gray-600 dark:text-gray-400 mb-1">
                Clique ou arraste para fazer upload
              </p>
              <p class="text-xs text-gray-500">
                PNG, JPG, PDF (máx. 10MB)
              </p>
            </div>
            <div v-else class="flex items-center justify-center space-x-3">
              <i class="fas fa-file text-2xl text-primary"></i>
              <div class="text-left">
                <p class="font-medium text-gray-900 dark:text-dark-text">{{ selectedFile.name }}</p>
                <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button 
                @click.stop="selectedFile = null" 
                class="text-red-500 hover:text-red-700"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">
            <i class="fas fa-exclamation-circle mr-1"></i>
            {{ errorMessage }}
          </p>
        </div>

        <!-- Buttons -->
        <div class="flex space-x-3">
          <BaseButton
            type="button"
            variant="secondary"
            full-width
            @click="router.back()"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            full-width
            :loading="isUploading"
          >
            <i class="fas fa-save mr-2"></i>
            Guardar Documento
          </BaseButton>
        </div>
      </form>
    </div>

    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { supabase } from '@/api/supabase'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')

const form = reactive({
  type: '',
  title: '',
  document_number: '',
  description: ''
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 10 * 1024 * 1024) {
      errorMessage.value = 'Arquivo muito grande. Máximo 10MB.'
      return
    }
    selectedFile.value = file
    errorMessage.value = ''
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.size > 10 * 1024 * 1024) {
      errorMessage.value = 'Arquivo muito grande. Máximo 10MB.'
      return
    }
    selectedFile.value = file
    errorMessage.value = ''
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleSubmit = async () => {
  if (!selectedFile.value) {
    errorMessage.value = 'Selecione um arquivo'
    return
  }

  if (!authStore.userId) {
    router.push({ name: 'Login' })
    return
  }

  isUploading.value = true
  errorMessage.value = ''

  try {
    // 1. Upload do arquivo
    const fileExt = selectedFile.value.name.split('.').pop()
    const fileName = `${authStore.userId}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, selectedFile.value, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 2. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(uploadData.path)

    // 3. Criar documento no banco com status 'normal' e is_public = false
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .insert([{
        user_id: authStore.userId,
        title: form.title,
        type: form.type,
        status: 'normal', // Status normal = documento guardado, não perdido
        is_public: false, // Não aparece no feed
        document_number: form.document_number || null,
        description: form.description || null,
        file_url: publicUrl,
        file_name: selectedFile.value.name,
        file_path: uploadData.path,
        file_size: selectedFile.value.size,
        file_type: selectedFile.value.type
      }])
      .select()
      .single()

    if (docError) throw docError

    success('Documento guardado com sucesso!')
    
    // Redirecionar para Meus Documentos
    setTimeout(() => {
      router.push('/documents')
    }, 1500)

  } catch (err: any) {
    console.error('Error saving document:', err)
    errorMessage.value = err.message || 'Erro ao guardar documento'
    showError(errorMessage.value)
  } finally {
    isUploading.value = false
  }
}
</script>

