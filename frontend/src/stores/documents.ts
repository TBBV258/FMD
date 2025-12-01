import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Document, DocumentFormData } from '@/types'
import { supabase } from '@/utils/supabase'

export const useDocumentsStore = defineStore('documents', () => {
  // State
  const documents = ref<Document[]>([])
  const currentDocument = ref<Document | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const page = ref(0)
  const pageSize = 20

  // Getters
  const lostDocuments = computed(() => 
    documents.value.filter(doc => doc.status === 'lost')
  )
  
  const foundDocuments = computed(() => 
    documents.value.filter(doc => doc.status === 'found')
  )

  // Actions
  async function fetchDocuments(refresh = false) {
    if (refresh) {
      page.value = 0
      documents.value = []
      hasMore.value = true
    }
    
    if (!hasMore.value && !refresh) {
      return { success: true }
    }
    
    isLoading.value = true
    error.value = null

    try {
      const from = page.value * pageSize
      const to = from + pageSize - 1
      
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .in('status', ['lost', 'found'])
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (fetchError) throw fetchError
      
      if (data) {
        if (refresh) {
          documents.value = data as Document[]
        } else {
          documents.value.push(...(data as Document[]))
        }
        
        hasMore.value = data.length === pageSize
        if (data.length > 0) {
        page.value++
        }
      }
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar documentos'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDocumentById(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      if (data) {
        currentDocument.value = data as Document
      }
      
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar documento'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function createDocument(userId: string, formData: DocumentFormData) {
    isLoading.value = true
    error.value = null
    
    try {
      let fileUrl = ''
      let filePath = ''
      
      // Upload file if provided
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop()
        const fileName = `${userId}_${Date.now()}.${fileExt}`
        filePath = `documents/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, formData.file)
        
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)
        
        fileUrl = urlData.publicUrl
      }
      
      const documentData = {
        user_id: userId,
        title: formData.title,
        type: formData.type,
        status: formData.status,
        description: formData.description || '',
        location: formData.location || '',
        document_number: formData.documentNumber || '',
        issue_date: formData.issueDate || null,
        expiry_date: formData.expiryDate || null,
        issue_place: formData.issuePlace || '',
        issuing_authority: formData.issuingAuthority || '',
        country_of_issue: formData.countryOfIssue || '',
        file_url: fileUrl,
        file_path: filePath,
        file_name: formData.file?.name || '',
        file_size: formData.file?.size || null,
        file_type: formData.file?.type || '',
        is_verified: false,
        verification_status: 'pending' as const,
        is_public: true,
        is_archived: false
      }
      
      const { data, error: createError } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single()
      
      if (createError) throw createError
      
      if (data) {
        documents.value.unshift(data as Document)
      }
      
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message || 'Erro ao criar documento'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function updateDocument(id: string, updates: Partial<Document>) {
    isLoading.value = true
    error.value = null
    
    try {
      const { data, error: updateError } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      if (data) {
        const index = documents.value.findIndex(doc => doc.id === id)
      if (index !== -1) {
          documents.value[index] = data as Document
        }
        if (currentDocument.value?.id === id) {
          currentDocument.value = data as Document
        }
      }
      
      return { success: true, data }
    } catch (err: any) {
      error.value = err.message || 'Erro ao atualizar documento'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteDocument(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
      
      documents.value = documents.value.filter(doc => doc.id !== id)
      if (currentDocument.value?.id === id) {
        currentDocument.value = null
      }
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Erro ao deletar documento'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function clearDocuments() {
    documents.value = []
    currentDocument.value = null
    page.value = 0
    hasMore.value = true
  }

  return {
    // State
    documents,
    currentDocument,
    isLoading,
    error,
    hasMore,
    // Getters
    lostDocuments,
    foundDocuments,
    // Actions
    fetchDocuments,
    fetchDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    clearDocuments
  }
})
