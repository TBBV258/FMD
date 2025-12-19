import { supabase } from '@/config/supabase'
import type { DocumentMatch } from '@/types'

export const matchesApi = {
  /**
   * Buscar matches para um documento específico
   */
  async getMatchesForDocument(documentId: string): Promise<DocumentMatch[]> {
    const { data, error } = await supabase
      .from('document_matches')
      .select(`
        *,
        lost_document:documents!lost_document_id(
          id,
          title,
          description,
          document_type,
          location,
          location_metadata,
          file_url,
          user_profiles(id, full_name, avatar_url)
        ),
        found_document:documents!found_document_id(
          id,
          title,
          description,
          document_type,
          location,
          location_metadata,
          file_url,
          user_profiles(id, full_name, avatar_url)
        )
      `)
      .or(`lost_document_id.eq.${documentId},found_document_id.eq.${documentId}`)
      .order('match_score', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Buscar todos os matches do usuário atual
   */
  async getMyMatches(): Promise<DocumentMatch[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('document_matches')
      .select(`
        *,
        lost_document:documents!lost_document_id(
          id,
          title,
          description,
          document_type,
          location,
          location_metadata,
          file_url,
          user_id,
          user_profiles(id, full_name, avatar_url)
        ),
        found_document:documents!found_document_id(
          id,
          title,
          description,
          document_type,
          location,
          location_metadata,
          file_url,
          user_id,
          user_profiles(id, full_name, avatar_url)
        )
      `)
      .or(`lost_document.user_id.eq.${user.id},found_document.user_id.eq.${user.id}`)
      .eq('status', 'pending')
      .order('match_score', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Confirmar um match
   */
  async confirmMatch(matchId: string): Promise<boolean> {
    const { error } = await supabase.rpc('confirm_match', {
      p_match_id: matchId
    })

    if (error) throw error
    return true
  },

  /**
   * Rejeitar um match
   */
  async rejectMatch(matchId: string): Promise<boolean> {
    const { error } = await supabase
      .from('document_matches')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', matchId)

    if (error) throw error
    return true
  },

  /**
   * Forçar busca de matches para um documento
   */
  async findMatches(documentId: string, minScore: number = 30): Promise<any[]> {
    const { data, error } = await supabase.rpc('find_document_matches', {
      p_document_id: documentId,
      p_min_score: minScore
    })

    if (error) throw error
    return data || []
  },

  /**
   * Obter estatísticas de matches
   */
  async getMatchStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const [pendingResult, confirmedResult, rejectedResult] = await Promise.all([
      supabase
        .from('document_matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('document_matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed'),
      supabase
        .from('document_matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected')
    ])

    return {
      pending: pendingResult.count || 0,
      confirmed: confirmedResult.count || 0,
      rejected: rejectedResult.count || 0,
      total: (pendingResult.count || 0) + (confirmedResult.count || 0) + (rejectedResult.count || 0)
    }
  },

  /**
   * Subscrever a mudanças em matches
   */
  subscribeToMatches(documentId: string, callback: (match: DocumentMatch) => void) {
    const channel = supabase
      .channel('document-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_matches',
          filter: `lost_document_id=eq.${documentId},found_document_id=eq.${documentId}`
        },
        (payload) => {
          callback(payload.new as DocumentMatch)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

