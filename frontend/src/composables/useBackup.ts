import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
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

      // Download each document
      const results = await Promise.allSettled(
        documents.map(doc => downloadDocument(doc as Document))
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.length - successful

      return {
        success: true,
        message: `Backup concluído: ${successful} documentos baixados${failed > 0 ? `, ${failed} falharam` : ''}`
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

