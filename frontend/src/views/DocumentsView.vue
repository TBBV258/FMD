<template>
  <MainLayout>
    <div class="px-4 py-6">
      <!-- Header with backup button -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">Meus Documentos</h1>
        <BaseButton
          variant="outline"
          size="sm"
          @click="handleDownloadBackup"
          :loading="isDownloading"
        >
          <i class="fas fa-download mr-2"></i>
          Backup
        </BaseButton>
      </div>

      <!-- Stats Card -->
      <div class="card mb-6">
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-primary">{{ totalDocuments }}</p>
            <p class="text-xs text-gray-500">Total</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-danger">{{ lostDocuments }}</p>
            <p class="text-xs text-gray-500">Perdidos</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-success">{{ foundDocuments }}</p>
            <p class="text-xs text-gray-500">Recuperados</p>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex space-x-2 mb-4 overflow-x-auto">
        <button
          v-for="filter in filters"
          :key="filter.value"
          :class="filterButtonClass(filter.value)"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <LoadingSkeleton v-for="i in 3" :key="i" type="card" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="filteredDocuments.length === 0"
        icon="fas fa-file-alt"
        title="Nenhum documento encontrado"
        description="Você ainda não cadastrou nenhum documento."
      >
        <BaseButton variant="primary" @click="router.push('/report-lost')">
          <i class="fas fa-plus mr-2"></i>
          Adicionar Documento
        </BaseButton>
      </EmptyState>

      <!-- Documents List -->
      <div v-else class="space-y-3">
        <div
          v-for="document in filteredDocuments"
          :key="document.id"
          class="card card-hover relative group"
        >
          <div class="flex items-start space-x-3" @click="router.push(`/document/${document.id}`)">
            <!-- Thumbnail -->
            <div class="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden cursor-pointer">
              <img
                v-if="document.thumbnail_url || document.file_url"
                :src="document.thumbnail_url || document.file_url"
                :alt="document.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <i :class="getTypeIcon(document.type)" class="text-gray-400 text-2xl"></i>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 cursor-pointer">
              <div class="flex items-start justify-between mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-dark-text truncate">
                  {{ document.title }}
                </h3>
                <span :class="getStatusBadgeClass(document.status)" class="ml-2">
                  {{ getStatusLabel(document.status) }}
                </span>
              </div>
              <p v-if="document.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                {{ document.description }}
              </p>
              <div class="flex items-center text-xs text-gray-500 space-x-3">
                <span>
                  <i class="fas fa-calendar mr-1"></i>
                  {{ formatDate(document.created_at) }}
                </span>
                <span v-if="document.location">
                  <i class="fas fa-map-marker-alt mr-1"></i>
                  {{ document.location }}
                </span>
              </div>
            </div>

            <!-- Actions Menu -->
            <div class="relative flex-shrink-0" @click.stop>
              <button
                @click="toggleMenu(document.id)"
                class="btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
                title="Opções"
              >
                <i class="fas fa-ellipsis-v"></i>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="openMenuId === document.id"
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-10"
              >
                <div class="py-2">
                  <button
                    v-if="document.status !== 'lost'"
                    @click="changeStatus(document, 'lost')"
                    class="w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <i class="fas fa-exclamation-triangle text-danger w-5"></i>
                    <span>Marcar como Perdido</span>
                  </button>
                  <button
                    v-if="document.status !== 'found'"
                    @click="changeStatus(document, 'found')"
                    class="w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <i class="fas fa-check-circle text-success w-5"></i>
                    <span>Marcar como Encontrado</span>
                  </button>
                  <button
                    v-if="document.status !== 'normal'"
                    @click="changeStatus(document, 'normal')"
                    class="w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <i class="fas fa-lock text-primary w-5"></i>
                    <span>Marcar como Normal (Privado)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Backdrop para fechar menu -->
      <div
        v-if="openMenuId"
        class="fixed inset-0 z-0"
        @click="openMenuId = null"
      ></div>
    </div>

    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { supabase } from '@/api/supabase'
import type { Document } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const documentsStore = useDocumentsStore()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const activeFilter = ref<'all' | 'lost' | 'found' | 'matched' | 'returned'>('all')
const isLoading = ref(false)
const isDownloading = ref(false)
const openMenuId = ref<string | null>(null)

const filters = [
  { label: 'Todos', value: 'all' },
  { label: 'Perdidos', value: 'lost' },
  { label: 'Recuperados', value: 'found' },
  { label: 'Matches', value: 'matched' },
  { label: 'Devolvidos', value: 'returned' }
]

const filteredDocuments = computed(() => {
  if (activeFilter.value === 'all') {
    return documentsStore.documents
  }
  return documentsStore.documents.filter(doc => doc.status === activeFilter.value)
})

const totalDocuments = computed(() => documentsStore.documents.length)
const lostDocuments = computed(() => documentsStore.documents.filter(d => d.status === 'lost').length)
const foundDocuments = computed(() => documentsStore.documents.filter(d => d.status === 'found').length)

const filterButtonClass = (filter: string) => {
  const base = 'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap'
  if (filter === activeFilter.value) {
    return `${base} bg-primary text-white`
  }
  return `${base} bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800`
}

const getStatusBadgeClass = (status: string) => {
  const classes = {
    lost: 'badge badge-danger',
    found: 'badge badge-success',
    matched: 'badge bg-purple-500/10 text-purple-500',
    returned: 'badge badge-success',
    normal: 'badge badge-primary'
  }
  return classes[status as keyof typeof classes] || 'badge badge-primary'
}

const getStatusLabel = (status: string) => {
  const labels = {
    lost: 'Perdido',
    found: 'Encontrado',
    matched: 'Match',
    returned: 'Devolvido',
    normal: 'Normal'
  }
  return labels[status as keyof typeof labels] || status
}

const getTypeIcon = (type: string) => {
  const icons = {
    passport: 'fas fa-passport',
    id_card: 'fas fa-id-card',
    bi: 'fas fa-id-card',
    driver_license: 'fas fa-id-card',
    birth_certificate: 'fas fa-file-alt',
    other: 'fas fa-file'
  }
  return icons[type as keyof typeof icons] || 'fas fa-file'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const toggleMenu = (docId: string) => {
  openMenuId.value = openMenuId.value === docId ? null : docId
}

const changeStatus = async (document: Document, newStatus: string) => {
  openMenuId.value = null

  const statusLabels = {
    lost: 'perdido',
    found: 'encontrado',
    normal: 'normal (privado)'
  }

  if (!confirm(`Tem certeza que deseja marcar "${document.title}" como ${statusLabels[newStatus as keyof typeof statusLabels]}?`)) {
    return
  }

  try {
    const isPublic = newStatus === 'lost' || newStatus === 'found'
    
    const { error } = await supabase
      .from('documents')
      .update({ 
        status: newStatus,
        is_public: isPublic
      })
      .eq('id', document.id)

    if (error) throw error

    success(`Documento marcado como ${statusLabels[newStatus as keyof typeof statusLabels]}!`)
    
    // Recarregar documentos
    if (authStore.userId) {
      await documentsStore.fetchUserDocuments(authStore.userId)
    }
  } catch (err: any) {
    showError(err.message || 'Erro ao atualizar status')
  }
}

const handleDownloadBackup = async () => {
  try {
    isDownloading.value = true

    // Sempre buscar versão mais recente dos documentos no Supabase antes do backup
    if (authStore.userId) {
      await documentsStore.fetchUserDocuments(authStore.userId, true)
    }

    // Prepare backup data
    const backupData = {
      user: {
        id: authStore.user?.id,
        email: authStore.user?.email,
        profile: authStore.profile
      },
      documents: documentsStore.documents,
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    }

    // Convert to JSON
    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `findmydocs_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    success('Backup baixado com sucesso!')
  } catch (err: any) {
    console.error('Download backup error:', err)
    showError('Erro ao baixar backup')
  } finally {
    isDownloading.value = false
  }
}

onMounted(async () => {
  if (!authStore.userId) {
    showError('Usuário não autenticado')
    return
  }
  
  isLoading.value = true
  // Busca TODOS os documentos do usuário (não apenas perdidos/encontrados)
  await documentsStore.fetchUserDocuments(authStore.userId, true)
  isLoading.value = false
})
</script>

