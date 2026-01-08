<template>
  <MainLayout :notification-count="0">
    <PullToRefresh @refresh="handleRefresh" ref="pullToRefreshRef">
      <!-- Filters (compact) -->
      <div class="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-4 py-3 sticky top-14 z-10 space-y-3">
        <div class="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          <button
            v-for="filter in filters"
            :key="filter.value"
            :class="filterButtonClass(filter.value)"
            @click="currentFilter = filter.value"
          >
            <i :class="filter.icon" class="mr-1"></i>
            {{ filter.label }}
          </button>
        </div>

        <div class="relative">
          <label class="sr-only" for="feed-search">Buscar documentos</label>
          <input
            id="feed-search"
            v-model="searchTerm"
            type="search"
            placeholder="Buscar por título, descrição ou tipo"
            class="w-full rounded-full border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <!-- Feed content -->
      <div class="px-4 py-4 space-y-4">
        <!-- Empty state -->
        <div v-if="!loading && filteredDocuments.length === 0" class="text-center py-12">
          <i class="fas fa-inbox text-gray-400 text-6xl mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nenhum documento encontrado
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Seja o primeiro a reportar um documento!
          </p>
        </div>

        <!-- Feed cards -->
        <FeedCard
          v-for="document in filteredDocuments"
          :key="document.id"
          :document="document"
          @interested="handleInterested"
          @dismiss="handleDismiss"
          @share="handleShare"
        />

        <!-- Loading skeleton -->
        <FeedSkeleton v-if="loading" :count="3" />
      </div>
    </PullToRefresh>

    <!-- Toast Container -->
    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useDocuments } from '@/composables/useDocuments'
import MainLayout from '@/components/layout/MainLayout.vue'
import PullToRefresh from '@/components/layout/PullToRefresh.vue'
import FeedCard from '@/components/feed/FeedCard.vue'
import FeedSkeleton from '@/components/feed/FeedSkeleton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const { success, error: showError } = useToast()
const { items, loading, error, fetchPublicFeed } = useDocuments()

const currentFilter = ref<'all' | 'lost' | 'found'>('all')
const pullToRefreshRef = ref<InstanceType<typeof PullToRefresh> | null>(null)
const searchTerm = ref('')

const filters = [
  { label: 'Todos', value: 'all' as const, icon: 'fas fa-th' },
  { label: 'Perdidos', value: 'lost' as const, icon: 'fas fa-search' },
  { label: 'Submetido por Utilizador', value: 'found' as const, icon: 'fas fa-check' }
]

const filteredDocuments = computed(() => {
  const byStatus =
    currentFilter.value === 'all'
      ? items.value
      : items.value.filter(doc => doc.status === currentFilter.value)

  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return byStatus

  return byStatus.filter(doc => {
    const title = doc.title?.toLowerCase() || ''
    const description = doc.description?.toLowerCase() || ''
    const type = (doc as any).type?.toLowerCase?.() || '' // fallback if type exists
    return title.includes(query) || description.includes(query) || type.includes(query)
  })
})

const filterButtonClass = (value: string) => {
  const base = 'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap'
  if (value === currentFilter.value) {
    return `${base} bg-primary text-white`
  }
  return `${base} bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300`
}

async function handleRefresh() {
  await fetchPublicFeed()

  if (pullToRefreshRef.value) {
    pullToRefreshRef.value.finishRefresh()
  }

  success('Feed atualizado!')
}

function handleInterested(documentId: string) {
  router.push(`/document/${documentId}`)
  success('Abrindo detalhes do documento...')
}

function handleDismiss(documentId: string) {
  success('Documento dispensado')
  // Could implement a "hide" feature here
}

async function handleShare(documentId: string) {
  const document = items.value.find(d => d.id === documentId)
  if (!document) return
  
  const shareData = {
    title: document.title,
    text: `${document.title} - ${document.description || 'Ver documento'}`,
    url: `${window.location.origin}/document/${documentId}`
  }
  
  try {
    if (navigator.share) {
      await navigator.share(shareData)
      success('Documento compartilhado!')
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareData.url)
      success('Link copiado para área de transferência!')
    }
  } catch (err) {
    console.error('Error sharing:', err)
  }
}

onMounted(async () => {
  const result = await fetchPublicFeed()
  if (!result && error.value) {
    showError(error.value)
  }
})
</script>
