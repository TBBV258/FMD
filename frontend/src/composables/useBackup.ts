import { ref } from 'vue'
import { supabase } from '@/api/supabase'
import type { Document } from '@/types'

export function useBackup() {
  const isBackingUp = ref(false)
  const error = ref<string | null>(null)

  /**
   * Extrai o caminho do arquivo do Supabase Storage a partir do file_url
   */
  const extractStoragePath = (fileUrl: string): string | null => {
    try {
      // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const url = new URL(fileUrl)
      const pathParts = url.pathname.split('/object/public/')
      if (pathParts.length === 2) {
        return pathParts[1] // bucket/path
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Baixa um documento individual
   */
  const downloadDocument = async (doc: Document) => {
    try {
      if (!doc.file_url) {
        throw new Error('Documento não possui arquivo')
      }

      // Extrair caminho do storage
      const storagePath = extractStoragePath(doc.file_url)
      
      if (storagePath) {
        // Formato: bucket/path
        const [bucket, ...pathParts] = storagePath.split('/')
        const path = pathParts.join('/')
        
        // Usar método download do Supabase Storage
        const { data, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(path)

        if (downloadError) throw downloadError
        if (!data) throw new Error('Nenhum dado recebido')

        // Criar blob e download
        const downloadUrl = window.URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = doc.file_name || `${doc.title}.${getFileExtension(doc.file_type || '')}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      } else {
        // Fallback: fetch direto (para URLs antigas)
        const response = await fetch(doc.file_url)
        if (!response.ok) throw new Error('Erro ao baixar arquivo')

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = doc.file_name || `${doc.title}.${getFileExtension(doc.file_type || '')}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      }

      return { success: true }
    } catch (err: any) {
      console.error('Erro ao baixar documento:', err)
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  /**
   * Faz backup de todos os documentos do usuário
   */
  const backupAllDocuments = async (userId: string) => {
    isBackingUp.value = true
    error.value = null

    try {
      // Buscar documentos do usuário
      const { data: documents, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      if (!documents || documents.length === 0) {
        throw new Error('Nenhum documento encontrado para backup')
      }

      // Filtrar apenas documentos com arquivos
      const documentsWithFiles = documents.filter((doc: any) => 
        doc.file_url && doc.file_url.trim() !== ''
      )

      if (documentsWithFiles.length === 0) {
        throw new Error('Nenhum documento com arquivo encontrado para backup')
      }

      console.log(`Iniciando backup de ${documentsWithFiles.length} documentos...`)

      let successCount = 0
      let failCount = 0
      const failedDocs: string[] = []

      for (let i = 0; i < documentsWithFiles.length; i++) {
        const doc = documentsWithFiles[i] as any
        
        try {
          // Delay entre downloads (exceto no primeiro)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 800))
          }

          console.log(`Baixando ${i + 1}/${documentsWithFiles.length}: ${doc.title}`)

          // Extrair caminho do storage
          const storagePath = extractStoragePath(doc.file_url)
          
          if (storagePath) {
            // Formato: bucket/path
            const [bucket, ...pathParts] = storagePath.split('/')
            const path = pathParts.join('/')
            
            // Usar método download do Supabase Storage
            const { data, error: downloadError } = await supabase.storage
              .from(bucket)
              .download(path)

            if (downloadError) {
              console.error('Erro no download do Supabase:', downloadError)
              throw downloadError
            }
            
            if (!data) {
              throw new Error('Nenhum dado recebido do Supabase Storage')
            }

            // Criar nome descritivo para o arquivo
            const extension = getFileExtension(doc.file_type || data.type)
            const safeTitle = doc.title
              .substring(0, 50) // Limitar tamanho
              .replace(/[^a-z0-9_\-]/gi, '_') // Remover caracteres especiais
              .replace(/_+/g, '_') // Remover underscores duplicados
              .replace(/^_|_$/g, '') // Remover underscores no início/fim
            
            const date = doc.created_at ? doc.created_at.split('T')[0] : 'sem_data'
            const docType = doc.document_type || 'doc'
            const filename = `${safeTitle}_${docType}_${date}.${extension}`

            // Download
            const downloadUrl = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)

            successCount++
            console.log(`✓ Baixado: ${filename}`)
          } else {
            // Fallback: fetch direto
            console.log('Usando fallback fetch...')
            const response = await fetch(doc.file_url)
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const blob = await response.blob()
            
            // Verificar se é realmente um arquivo e não JSON
            if (blob.type === 'application/json') {
              throw new Error('URL retornou JSON ao invés de arquivo')
            }

            const extension = getFileExtension(blob.type || doc.file_type)
            const safeTitle = doc.title
              .substring(0, 50)
              .replace(/[^a-z0-9_\-]/gi, '_')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '')
            
            const date = doc.created_at ? doc.created_at.split('T')[0] : 'sem_data'
            const docType = doc.document_type || 'doc'
            const filename = `${safeTitle}_${docType}_${date}.${extension}`

            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)

            successCount++
            console.log(`✓ Baixado (fallback): ${filename}`)
          }
        } catch (err: any) {
          console.error(`✗ Erro ao baixar "${doc.title}":`, err.message)
          failCount++
          failedDocs.push(doc.title)
        }
      }

      console.log(`Backup finalizado: ${successCount} sucesso, ${failCount} falhas`)

      if (successCount === 0) {
        throw new Error(`Nenhum arquivo foi baixado com sucesso. ${failedDocs.length > 0 ? 'Documentos com erro: ' + failedDocs.join(', ') : ''}`)
      }

      return {
        success: true,
        message: `Backup concluído! ${successCount} arquivo(s) baixado(s)${failCount > 0 ? `, ${failCount} falhou(ram)` : ''}`,
        details: {
          total: documentsWithFiles.length,
          success: successCount,
          failed: failCount,
          failedDocs
        }
      }
    } catch (err: any) {
      console.error('Erro no backup:', err)
      error.value = err.message
      return { 
        success: false, 
        error: err.message,
        details: null
      }
    } finally {
      isBackingUp.value = false
    }
  }

  /**
   * Obtém a extensão do arquivo baseado no MIME type
   */
  const getFileExtension = (mimeType: string): string => {
    const extensions: Record<string, string> = {
      // Imagens
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/svg+xml': 'svg',
      
      // Documentos
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      
      // Outros
      'text/plain': 'txt',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar'
    }

    return extensions[mimeType.toLowerCase()] || 'file'
  }

  return {
    isBackingUp,
    error,
    downloadDocument,
    backupAllDocuments
  }
}
