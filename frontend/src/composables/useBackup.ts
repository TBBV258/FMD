import { ref } from 'vue'
import { supabase } from '@/api/supabase'
import type { Document } from '@/types'

export function useBackup() {
  const isBackingUp = ref(false)
  const error = ref<string | null>(null)

  const downloadDocument = async (doc: Document) => {
    try {
      if (!doc.file_url) {
        throw new Error('Documento não possui arquivo')
      }

      // Extract file path from URL
      const url = new URL(doc.file_url)
      const filePath = url.pathname.split('/').slice(-1)[0]

      // Download from Supabase Storage
      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(filePath)

      if (downloadError) throw downloadError

      // Create download link
      const blob = data as Blob
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = doc.file_name || `document_${doc.id}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      return { success: true }
    } catch (err: any) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  const backupAllDocuments = async (userId: string) => {
    isBackingUp.value = true
    error.value = null

    try {
      // Fetch user's documents
      const { data: documents, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)

      if (fetchError) throw fetchError

      if (!documents || documents.length === 0) {
        throw new Error('Nenhum documento encontrado para backup')
      }

      // Criar backup JSON com metadados dos documentos
      const backupData = {
        backup_date: new Date().toISOString(),
        user_id: userId,
        total_documents: documents.length,
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          status: doc.status,
          document_number: doc.document_number,
          issue_date: doc.issue_date,
          expiry_date: doc.expiry_date,
          issue_place: doc.issue_place,
          issuing_authority: doc.issuing_authority,
          country_of_issue: doc.country_of_issue,
          description: doc.description,
          location: doc.location,
          is_verified: doc.is_verified,
          verification_status: doc.verification_status,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          file_name: doc.file_name,
          file_type: doc.file_type,
          file_size: doc.file_size
        }))
      }

      // Criar e baixar arquivo JSON
      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `FMD_Backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      return {
        success: true,
        message: `Backup concluído: ${documents.length} documentos salvos em JSON`
      }
    } catch (err: any) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isBackingUp.value = false
    }
  }

  return {
    isBackingUp,
    error,
    downloadDocument,
    backupAllDocuments
  }
}

