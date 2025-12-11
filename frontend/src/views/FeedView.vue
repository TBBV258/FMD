<template>
  <MainLayout :notification-count="0">
    <PullToRefresh @refresh="handleRefresh" ref="pullToRefreshRef">
      <!-- Filters (compact) -->
      <div class="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-4 py-3 sticky top-14 z-10">
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
          </div>

      <!-- Feed content -->
      <div class="px-4 py-4 space-y-4">
          <!-- Empty state -->
        <div v-if="!isLoading && filteredDocuments.length === 0" class="text-center py-12">
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
        <FeedSkeleton v-if="isLoading" :count="3" />

        <!-- Load more indicator -->
        <div v-if="hasMore && !isLoading && filteredDocuments.length > 0" class="text-center py-4">
          <div class="spinner mx-auto"></div>
            </div>

        <!-- No more items -->
        <div v-if="!hasMore && filteredDocuments.length > 0" class="text-center py-4 text-gray-500">
          <i class="fas fa-check-circle mr-2"></i>
          Todos os documentos carregados
        </div>
      </div>
    </PullToRefresh>

    <!-- Toast Container -->
    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useToast } from '@/composables/useToast'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import MainLayout from '@/components/layout/MainLayout.vue'
import PullToRefresh from '@/components/layout/PullToRefresh.vue'
import FeedCard from '@/components/feed/FeedCard.vue'
import FeedSkeleton from '@/components/feed/FeedSkeleton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const documentsStore = useDocumentsStore()
const { success, error: showError } = useToast()

const currentFilter = ref<'all' | 'lost' | 'found'>('all')
const pullToRefreshRef = ref<InstanceType<typeof PullToRefresh> | null>(null)

const filters = [
  { label: 'Todos', value: 'all' as const, icon: 'fas fa-th' },
  { label: 'Perdidos', value: 'lost' as const, icon: 'fas fa-search' },
  { label: 'Encontrados', value: 'found' as const, icon: 'fas fa-check' }
]

const filteredDocuments = computed(() => {
  if (currentFilter.value === 'all') {
    return documentsStore.documents
  }
  return documentsStore.documents.filter(doc => doc.status === currentFilter.value)
})

const filterButtonClass = (value: string) => {
  const base = 'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap'
  if (value === currentFilter.value) {
    return `${base} bg-primary text-white`
  }
  return `${base} bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300`
}

// Infinite scroll
const { isLoading, hasMore, setLoading, setHasMore } = useInfiniteScroll(loadMore)

// Ensure the feed always starts with the public lost/found documents of all users
async function fetchInitialFeed() {
  setLoading(true)
  const result = await documentsStore.fetchDocuments(true) // reset pagination + list
  setHasMore(documentsStore.hasMore)
  setLoading(false)

  if (result && !result.success && result.error) {
    showError(result.error)
  }
}

async function loadMore() {
  const result = await documentsStore.fetchDocuments()
  setLoading(false)
  setHasMore(documentsStore.hasMore)
  
  if (result && !result.success && result.error) {
    showError(result.error)
  }
}

async function handleRefresh() {
  const result = await documentsStore.fetchDocuments(true)
  setHasMore(documentsStore.hasMore)
  
  if (pullToRefreshRef.value) {
    pullToRefreshRef.value.finishRefresh()
  }
  
  if (result && result.success) {
    success('Feed atualizado!')
  } else if (result && result.error) {
    showError(result.error)
  }
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
  const document = documentsStore.documents.find(d => d.id === documentId)
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
  await fetchInitialFeed()
})
</script>
