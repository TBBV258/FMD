import { ref } from 'vue'
import { supabase } from '@/api/supabase'
import type { Document, DocumentStatus } from '@/types'

export function useDocuments() {
  const items = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Busca o feed público com documentos perdidos ou encontrados
   * de todos os usuários. Ordena por mais recentes.
   */
  const fetchPublicFeed = async () => {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .in('status', ['lost', 'found'] satisfies DocumentStatus[])
      .order('created_at', { ascending: false })

    if (err) {
      error.value = err.message
      loading.value = false
      return []
    }

    items.value = (data as Document[]) ?? []
    loading.value = false
    return items.value
  }

  /**
   * Busca todos os documentos de um usuário (inclui privados).
   * A política RLS garante que somente o dono vê seus documentos.
   */
  const fetchMyDocuments = async (userId: string) => {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (err) {
      error.value = err.message
      loading.value = false
      return []
    }

    items.value = (data as Document[]) ?? []
    loading.value = false
    return items.value
  }

  return {
    items,
    loading,
    error,
    fetchPublicFeed,
    fetchMyDocuments
  }
}
