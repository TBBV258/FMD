import { ref, computed, watch } from 'vue'
import type { Document, DocumentType } from '@/types'

interface SearchFilters {
  query: string
  types: DocumentType[]
  status: 'all' | 'lost' | 'found'
  dateFrom?: Date
  dateTo?: Date
  locationRadius?: number
}

export function useDocumentSearch(documents: Document[]) {
  const searchQuery = ref('')
  const filters = ref<SearchFilters>({
    query: '',
    types: [],
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    locationRadius: undefined
  })

  // Debounced search
  let searchTimeout: NodeJS.Timeout | null = null
  
  watch(searchQuery, (newVal) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    searchTimeout = setTimeout(() => {
      filters.value.query = newVal
    }, 300)
  })

  const filteredDocuments = computed(() => {
    let results = documents

    // Text search
    if (filters.value.query) {
      const query = filters.value.query.toLowerCase()
      results = results.filter(doc => 
        doc.title?.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.location?.toLowerCase().includes(query) ||
        doc.document_number?.toLowerCase().includes(query)
      )
    }

    // Type filter
    if (filters.value.types.length > 0) {
      results = results.filter(doc => 
        filters.value.types.includes(doc.type)
      )
    }

    // Status filter
    if (filters.value.status !== 'all') {
      results = results.filter(doc => 
        doc.status === filters.value.status
      )
    }

    // Date range filter
    if (filters.value.dateFrom) {
      results = results.filter(doc => 
        new Date(doc.created_at) >= filters.value.dateFrom!
      )
    }

    if (filters.value.dateTo) {
      results = results.filter(doc => 
        new Date(doc.created_at) <= filters.value.dateTo!
      )
    }

    return results
  })

  const setTypeFilter = (types: DocumentType[]) => {
    filters.value.types = types
  }

  const setStatusFilter = (status: 'all' | 'lost' | 'found') => {
    filters.value.status = status
  }

  const setDateRange = (from?: Date, to?: Date) => {
    filters.value.dateFrom = from
    filters.value.dateTo = to
  }

  const clearFilters = () => {
    searchQuery.value = ''
    filters.value = {
      query: '',
      types: [],
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      locationRadius: undefined
    }
  }

  const hasActiveFilters = computed(() => {
    return filters.value.query !== '' ||
      filters.value.types.length > 0 ||
      filters.value.status !== 'all' ||
      filters.value.dateFrom !== undefined ||
      filters.value.dateTo !== undefined
  })

  return {
    searchQuery,
    filters,
    filteredDocuments,
    setTypeFilter,
    setStatusFilter,
    setDateRange,
    clearFilters,
    hasActiveFilters
  }
}

