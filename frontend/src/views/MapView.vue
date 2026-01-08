<template>
  <MainLayout>
    <div class="h-[calc(100vh-8rem)]">
      <MapComponent
        :documents="documents"
        @marker-click="handleMarkerClick"
      />
    </div>
    
    <!-- Document preview modal -->
    <BaseModal
      v-model="showDocumentModal"
      :title="selectedDocument?.title"
    >
      <template v-if="selectedDocument">
        <!-- Image -->
        <div v-if="selectedDocument.thumbnail_url || selectedDocument.file_url" class="aspect-video bg-gray-200 dark:bg-dark-card rounded-lg overflow-hidden mb-4">
          <img
            :src="selectedDocument.thumbnail_url || selectedDocument.file_url"
            :alt="selectedDocument.title"
            class="w-full h-full object-cover"
          />
        </div>
        
        <!-- Info -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <span :class="statusBadgeClass">{{ statusLabel }}</span>
            <span class="badge badge-primary">
              <i :class="typeIcon" class="mr-1"></i>
              {{ typeLabel }}
            </span>
          </div>
          
          <p v-if="selectedDocument.description" class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedDocument.description }}
          </p>
          
          <div class="space-y-2 text-sm">
            <div class="flex items-start">
              <i class="fas fa-map-marker-alt text-gray-400 w-5 mt-0.5"></i>
              <span>{{ selectedDocument.location || 'Localização não especificada' }}</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-clock text-gray-400 w-5 mt-0.5"></i>
              <span>{{ formatRelativeTime(selectedDocument.created_at) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
          <BaseButton
            variant="primary"
            class="flex-1"
            @click="viewDetails"
          >
            Ver Detalhes
          </BaseButton>
          <BaseButton
            variant="outline"
            @click="showDocumentModal = false"
          >
            Fechar
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { formatRelativeTime } from '@/utils/formatters'
import type { Document } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'
import MapComponent from '@/components/map/MapComponent.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const documentsStore = useDocumentsStore()

const selectedDocument = ref<Document | null>(null)
const showDocumentModal = ref(false)

const documents = computed(() => documentsStore.documents)

const statusBadgeClass = computed(() => {
  if (!selectedDocument.value) return ''
  
  const classes = {
    lost: 'badge badge-danger',
    found: 'badge bg-orange-500/10 text-orange-600 dark:text-orange-400',
    matched: 'badge bg-purple-500/10 text-purple-500',
    returned: 'badge badge-success'
  }
  return classes[selectedDocument.value.status] || 'badge badge-primary'
})

const statusLabel = computed(() => {
  if (!selectedDocument.value) return ''
  
  const labels = {
    lost: 'Perdido',
    found: 'Submetido por Utilizador',
    matched: 'Match',
    returned: 'Devolvido',
    normal: 'Normal'
  }
  return labels[selectedDocument.value.status] || selectedDocument.value.status
})

const typeIcon = computed(() => {
  if (!selectedDocument.value) return ''
  
  const icons = {
    passport: 'fas fa-passport',
    id_card: 'fas fa-id-card',
    driver_license: 'fas fa-id-card-alt',
    birth_certificate: 'fas fa-file-alt',
    other: 'fas fa-file'
  }
  return icons[selectedDocument.value.type] || 'fas fa-file'
})

const typeLabel = computed(() => {
  if (!selectedDocument.value) return ''
  
  const labels = {
    passport: 'Passaporte',
    id_card: 'BI',
    driver_license: 'Carta',
    birth_certificate: 'Certidão',
    other: 'Outro'
  }
  return labels[selectedDocument.value.type] || 'Documento'
})

const handleMarkerClick = (document: Document) => {
  selectedDocument.value = document
  showDocumentModal.value = true
}

const viewDetails = () => {
  if (selectedDocument.value) {
    router.push(`/document/${selectedDocument.value.id}`)
  }
}

onMounted(async () => {
  // Load documents if not already loaded
  if (documents.value.length === 0) {
    await documentsStore.fetchDocuments()
  }
})
</script>

