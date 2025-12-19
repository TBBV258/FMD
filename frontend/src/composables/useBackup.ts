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

      // Download directly from the file_url
      const response = await fetch(doc.file_url)
      if (!response.ok) throw new Error('Erro ao baixar arquivo')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = doc.file_name || `document_${doc.id}.${getFileExtension(doc.file_type || '')}`
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

      // Filter documents that have files
      const documentsWithFiles = documents.filter((doc: any) => doc.file_url)

      if (documentsWithFiles.length === 0) {
        throw new Error('Nenhum documento com arquivo encontrado para backup')
      }

      // Download all files individually
      let successCount = 0
      let failCount = 0

      for (const doc of documentsWithFiles) {
        try {
          // Small delay between downloads to avoid overwhelming the browser
          if (successCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          const response = await fetch((doc as any).file_url)
          if (!response.ok) {
            failCount++
            continue
          }

          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          
          // Create descriptive filename: title_type_timestamp.extension
          const extension = getFileExtension((doc as any).file_type || '')
          const safeTitle = (doc as any).title.replace(/[^a-z0-9]/gi, '_')
          const timestamp = (doc as any).created_at.split('T')[0]
          link.download = `${safeTitle}_${(doc as any).type}_${timestamp}.${extension}`
          
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)

          successCount++
        } catch (err) {
          console.error('Error downloading document:', (doc as any).id, err)
          failCount++
        }
      }

      if (successCount === 0) {
        throw new Error('Nenhum arquivo foi baixado com sucesso')
      }

      return {
        success: true,
        message: `Backup concluído: ${successCount} arquivo(s) baixado(s)${failCount > 0 ? `, ${failCount} falhou` : ''}`
      }
    } catch (err: any) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isBackingUp.value = false
    }
  }

  const getFileExtension = (mimeType: string): string => {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    }

    return extensions[mimeType] || 'file'
  }

  return {
    isBackingUp,
    error,
    downloadDocument,
    backupAllDocuments
  }
}
