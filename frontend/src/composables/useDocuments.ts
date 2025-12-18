import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import type { Document } from '@/types'

export function useDocuments() {
  const items = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Feed público: apenas lost/found, ordenado por created_at desc
  const fetchPublicFeed = async () => {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .in('status', ['lost', 'found'])
      .order('created_at', { ascending: false })

    if (err) error.value = err.message
    items.value = (data as Document[]) ?? []
    loading.value = false
    return items.value
  }

  // Meus documentos: todos os status do próprio usuário (RLS garante privacidade)
  const fetchMyDocuments = async (userId: string) => {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (err) error.value = err.message
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
