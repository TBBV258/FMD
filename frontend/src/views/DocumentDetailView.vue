<template>
  <MainLayout :show-top-bar="false">
    <div class="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <!-- Header -->
      <header class="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border pt-safe">
        <div class="flex items-center justify-between px-4 h-14">
          <button class="btn-icon" @click="router.back()">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h1 class="text-lg font-semibold">Detalhes</h1>
          <button class="btn-icon" @click="handleShare">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </header>

    <div class="pt-14 pb-safe">
      <!-- Loading state -->
      <div v-if="isLoading" class="p-4">
        <LoadingSkeleton type="card" />
    </div>

      <!-- Document content -->
      <div v-else-if="document" class="max-w-2xl mx-auto">
      <!-- Image -->
        <div class="relative aspect-square bg-gray-200 dark:bg-dark-card">
          <img
        v-if="document.file_url || document.thumbnail_url"
          :src="document.file_url || document.thumbnail_url"
          :alt="document.title"
            class="w-full h-full object-cover"
        />
          <div v-else class="w-full h-full flex items-center justify-center">
            <i class="fas fa-file text-gray-400 text-8xl"></i>
          </div>
      </div>

        <!-- Content -->
        <div class="p-4 space-y-6">
          <!-- Status and type badges -->
          <div class="flex items-center space-x-2">
            <span :class="statusBadgeClass">{{ statusLabel }}</span>
            <span class="badge badge-primary">
              <i :class="typeIcon" class="mr-1"></i>
              {{ typeLabel }}
        </span>
      </div>

          <!-- Title -->
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
        {{ document.title }}
      </h2>
            <p v-if="document.description" class="text-gray-600 dark:text-gray-400">
              {{ document.description }}
      </p>
          </div>

          <!-- Details -->
          <div class="card space-y-3">
            <div v-if="document.document_number" class="flex items-start">
              <i class="fas fa-hashtag text-gray-400 w-6 mt-1"></i>
              <div class="flex-1">
                <p class="text-sm text-gray-500">Número do Documento</p>
                <p class="font-medium">{{ document.document_number }}</p>
              </div>
      </div>

            <div v-if="document.location" class="flex items-start">
              <i class="fas fa-map-marker-alt text-gray-400 w-6 mt-1"></i>
              <div class="flex-1">
                <p class="text-sm text-gray-500">Local</p>
                <p class="font-medium">{{ document.location }}</p>
              </div>
      </div>

            <div class="flex items-start">
              <i class="fas fa-clock text-gray-400 w-6 mt-1"></i>
              <div class="flex-1">
                <p class="text-sm text-gray-500">Data de Publicação</p>
                <p class="font-medium">{{ formattedDate }}</p>
        </div>
      </div>

            <div v-if="document.issue_date" class="flex items-start">
              <i class="fas fa-calendar text-gray-400 w-6 mt-1"></i>
              <div class="flex-1">
                <p class="text-sm text-gray-500">Data de Emissão</p>
                <p class="font-medium">{{ formatDate(document.issue_date) }}</p>
              </div>
        </div>
        </div>
          
          <!-- Actions -->
          <div class="space-y-2">
            <BaseButton
              variant="primary"
              size="lg"
              full-width
              @click="handleContact"
            >
              <i class="fas fa-comment-dots mr-2"></i>
              Entrar em Contacto
            </BaseButton>
            
            <BaseButton
              variant="outline"
              size="lg"
              full-width
              @click="handleShare"
            >
              <i class="fas fa-share-alt mr-2"></i>
              Compartilhar
            </BaseButton>
        </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else class="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <i class="fas fa-exclamation-triangle text-gray-400 text-6xl mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Documento não encontrado
        </h3>
        <BaseButton variant="primary" @click="router.back()">
          Voltar
        </BaseButton>
      </div>
    </div>

    <ToastContainer />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useToast } from '@/composables/useToast'
import type { Document } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const route = useRoute()
const documentsStore = useDocumentsStore()
const { success, error: showError } = useToast()

const isLoading = ref(true)
const document = ref<Document | null>(null)

const documentId = route.params.id as string

const statusBadgeClass = computed(() => {
  if (!document.value) return ''
  
  const classes = {
    lost: 'badge badge-danger',
    found: 'badge badge-success',
    matched: 'badge bg-purple-500/10 text-purple-500',
    returned: 'badge badge-success'
  }
  return classes[document.value.status] || 'badge badge-primary'
})

const statusLabel = computed(() => {
  if (!document.value) return ''
  
  const labels = {
    lost: 'Perdido',
    found: 'Encontrado',
    matched: 'Match',
    returned: 'Devolvido',
    normal: 'Normal'
  }
  return labels[document.value.status] || document.value.status
})

const typeIcon = computed(() => {
  if (!document.value) return ''
  
  const icons = {
    passport: 'fas fa-passport',
    id_card: 'fas fa-id-card',
    driver_license: 'fas fa-id-card-alt',
    birth_certificate: 'fas fa-file-alt',
    other: 'fas fa-file'
  }
  return icons[document.value.type] || 'fas fa-file'
})

const typeLabel = computed(() => {
  if (!document.value) return ''
  
  const labels = {
    passport: 'Passaporte',
    id_card: 'Bilhete de Identidade',
    driver_license: 'Carta de Condução',
    birth_certificate: 'Certidão de Nascimento',
    other: 'Outro Documento'
  }
  return labels[document.value.type] || 'Documento'
})

const formattedDate = computed(() => {
  if (!document.value) return ''
  
  return new Date(document.value.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const handleContact = () => {
  if (!document.value) return
  
  router.push(`/chat/${documentId}`)
}

const handleShare = async () => {
  if (!document.value) return

  const shareData = {
    title: document.value.title,
    text: `${document.value.title} - ${document.value.description || 'Ver documento'}`,
    url: `${window.location.origin}/document/${documentId}`
  }

  try {
  if (navigator.share) {
      await navigator.share(shareData)
      success('Documento compartilhado!')
    } else {
      await navigator.clipboard.writeText(shareData.url)
      success('Link copiado para área de transferência!')
    }
    } catch (err) {
    console.error('Error sharing:', err)
    }
}

onMounted(async () => {
  isLoading.value = true
  
  const result = await documentsStore.fetchDocumentById(documentId)
  
  if (result.success) {
    document.value = documentsStore.currentDocument
  } else {
    showError(result.error || 'Erro ao carregar documento')
  }
  
  isLoading.value = false
})
</script>
