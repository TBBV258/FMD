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
            Relatar Documento Encontrado
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Ajude alguém a recuperar seu documento
          </p>
        </div>
        
        <!-- Form (same as ReportLostView but with status: 'found') -->
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
            placeholder="Ex: BI encontrado em Maputo"
            required
          />
          
          <!-- Description -->
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea
              v-model="formData.description"
              class="input min-h-[100px] resize-none"
              placeholder="Descreva detalhes do documento encontrado..."
            ></textarea>
          </div>
          
          <!-- Location Text -->
          <BaseInput
            v-model="formData.location"
            label="Onde encontrou?"
            placeholder="Ex: Avenida Julius Nyerere, Maputo"
            icon="fas fa-map-marker-alt"
            required
          />

          <!-- Location on Map -->
          <div class="space-y-2">
            <label class="form-label">Localização no Mapa (opcional)</label>
            <div class="flex items-center space-x-2">
              <button
                type="button"
                @click="showLocationPicker = true"
                class="flex-1 btn btn-secondary"
              >
                <i class="fas fa-map-marked-alt mr-2"></i>
                {{ locationMetadata ? 'Atualizar Localização' : 'Marcar no Mapa' }}
              </button>
              <button
                v-if="locationMetadata"
                type="button"
                @click="clearLocation"
                class="btn-icon bg-red-100 text-danger hover:bg-red-200"
                title="Remover localização"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div v-if="locationMetadata" class="bg-success/10 rounded-lg p-3 text-sm">
              <p class="text-success-dark dark:text-success font-semibold mb-1">
                <i class="fas fa-check-circle mr-1"></i>
                Localização Marcada
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Lat: {{ locationMetadata.lat?.toFixed(6) }}, Lng: {{ locationMetadata.lng?.toFixed(6) }}
              </p>
            </div>
          </div>

          <!-- Meeting Point (Optional) -->
          <div class="space-y-2">
            <label class="form-label">Ponto de Encontro (opcional)</label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Onde você pode se encontrar com o dono para devolver?
            </p>
            <div class="flex items-center space-x-2">
              <button
                type="button"
                @click="showMeetingPointPicker = true"
                class="flex-1 btn btn-outline"
              >
                <i class="fas fa-handshake mr-2"></i>
                {{ meetingPointMetadata ? 'Atualizar Ponto' : 'Marcar Ponto de Encontro' }}
              </button>
              <button
                v-if="meetingPointMetadata"
                type="button"
                @click="clearMeetingPoint"
                class="btn-icon bg-red-100 text-danger hover:bg-red-200"
                title="Remover ponto"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div v-if="meetingPointMetadata" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
              <p class="text-blue-900 dark:text-blue-100 font-semibold mb-1">
                <i class="fas fa-map-pin mr-1"></i>
                Ponto de Encontro Definido
              </p>
              <p class="text-xs text-blue-700 dark:text-blue-300">
                Lat: {{ meetingPointMetadata.lat.toFixed(6) }}, Lng: {{ meetingPointMetadata.lng.toFixed(6) }}
              </p>
            </div>
          </div>
          
          <!-- Upload Photo -->
          <div class="form-group">
            <label class="form-label">Foto do Documento *</label>
            <div
              class="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              @click="handleUploadClick"
            >
              <div v-if="!formData.file">
                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-600 dark:text-gray-400">
                  Clique para adicionar foto
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Importante: Evite mostrar dados sensíveis
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
          </div>

          <!-- Photo Picker Modal -->
          <PhotoPickerModal
            v-model="showPhotoPicker"
            @file-selected="handlePhotoSelected"
          />

          <!-- Location Picker Modal -->
          <LocationPicker
            v-model="showLocationPicker"
            title="Onde você encontrou o documento?"
            message="Marque no mapa o local onde encontrou o documento. Isso ajuda o dono a verificar."
            :initial-location="locationMetadata"
            @location-selected="handleLocationSelected"
          />

          <!-- Meeting Point Picker Modal -->
          <LocationPicker
            v-model="showMeetingPointPicker"
            title="Ponto de Encontro para Devolução"
            message="Escolha um local público e seguro onde você pode devolver o documento ao dono."
            :initial-location="meetingPointMetadata"
            @location-selected="handleMeetingPointSelected"
          />
          
          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isSubmitting"
            loading-text="Publicando..."
          >
            <i class="fas fa-paper-plane mr-2"></i>
            Publicar Documento Encontrado
          </BaseButton>
        </form>
      </div>
    </div>
    
    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDocumentsStore } from '@/stores/documents'
import { useToast } from '@/composables/useToast'
import type { DocumentFormData, DocumentType } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import PhotoPickerModal from '@/components/permissions/PhotoPickerModal.vue'
import LocationPicker from '@/components/map/LocationPicker.vue'

const router = useRouter()
const authStore = useAuthStore()
const documentsStore = useDocumentsStore()
const { success, error: showError } = useToast()

const isSubmitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const formData = reactive<DocumentFormData>({
  title: '',
  type: 'bi',
  status: 'found',
  description: '',
  location: '',
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
    return `${base} border-2 border-success bg-success/5`
  }
  return `${base} hover:border-success`
}

const showPhotoPicker = ref(false)
const showLocationPicker = ref(false)
const showMeetingPointPicker = ref(false)
const locationMetadata = ref<{ lat: number; lng: number } | null>(null)
const meetingPointMetadata = ref<{ lat: number; lng: number; address?: string } | null>(null)

const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

const handleUploadClick = () => {
  if (isMobile.value) {
    showPhotoPicker.value = true
  } else {
    fileInputRef.value?.click()
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    formData.file = file
  }
}

const handlePhotoSelected = (file: File) => {
  formData.file = file
}

const handleLocationSelected = (location: { lat: number; lng: number; address?: string }) => {
  locationMetadata.value = location
}

const handleMeetingPointSelected = (location: { lat: number; lng: number; address?: string }) => {
  meetingPointMetadata.value = location
}

const clearLocation = () => {
  locationMetadata.value = null
}

const clearMeetingPoint = () => {
  meetingPointMetadata.value = null
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
  
  if (!formData.location.trim()) {
    showError('Por favor, informe onde encontrou o documento')
    return
  }
  
  if (!formData.file) {
    showError('Por favor, adicione uma foto do documento')
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
