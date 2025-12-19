import { ref, computed } from 'vue'
import { matchesApi } from '@/api/matches'
import type { DocumentMatch } from '@/types'
import { useToast } from './useToast'

export function useMatches() {
  const matches = ref<DocumentMatch[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { success, showError } = useToast()

  // Computed
  const pendingMatches = computed(() => 
    matches.value.filter(m => m.status === 'pending')
  )

  const confirmedMatches = computed(() => 
    matches.value.filter(m => m.status === 'confirmed')
  )

  const highScoreMatches = computed(() => 
    matches.value.filter(m => m.match_score >= 70)
  )

  const mediumScoreMatches = computed(() => 
    matches.value.filter(m => m.match_score >= 40 && m.match_score < 70)
  )

  const lowScoreMatches = computed(() => 
    matches.value.filter(m => m.match_score < 40)
  )

  // Methods
  const fetchMatches = async () => {
    loading.value = true
    error.value = null
    try {
      matches.value = await matchesApi.getMyMatches()
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao carregar matches: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const fetchMatchesForDocument = async (documentId: string) => {
    loading.value = true
    error.value = null
    try {
      matches.value = await matchesApi.getMatchesForDocument(documentId)
    } catch (err: any) {
      error.value = err.message
      showError('Erro ao carregar matches: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const confirmMatch = async (matchId: string) => {
    try {
      await matchesApi.confirmMatch(matchId)
      success('Match confirmado com sucesso! 🎉')
      // Atualizar lista de matches
      await fetchMatches()
    } catch (err: any) {
      showError('Erro ao confirmar match: ' + err.message)
      throw err
    }
  }

  const rejectMatch = async (matchId: string) => {
    try {
      await matchesApi.rejectMatch(matchId)
      success('Match rejeitado')
      // Atualizar lista de matches
      await fetchMatches()
    } catch (err: any) {
      showError('Erro ao rejeitar match: ' + err.message)
      throw err
    }
  }

  const findNewMatches = async (documentId: string, minScore: number = 30) => {
    loading.value = true
    try {
      const newMatches = await matchesApi.findMatches(documentId, minScore)
      if (newMatches.length > 0) {
        success(`${newMatches.length} possíveis matches encontrados!`)
        await fetchMatchesForDocument(documentId)
      } else {
        showError('Nenhum match encontrado no momento')
      }
    } catch (err: any) {
      showError('Erro ao buscar matches: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const getMatchScoreColor = (score: number): string => {
    if (score >= 70) return 'text-success'
    if (score >= 40) return 'text-warning-dark'
    return 'text-gray-500'
  }

  const getMatchScoreLabel = (score: number): string => {
    if (score >= 70) return 'Alta Probabilidade'
    if (score >= 40) return 'Média Probabilidade'
    return 'Baixa Probabilidade'
  }

  const getMatchScoreBadge = (score: number): string => {
    if (score >= 90) return '🎯 Excelente'
    if (score >= 70) return '✅ Muito Bom'
    if (score >= 50) return '👍 Bom'
    if (score >= 30) return '🤔 Possível'
    return '❓ Improvável'
  }

  return {
    matches,
    loading,
    error,
    pendingMatches,
    confirmedMatches,
    highScoreMatches,
    mediumScoreMatches,
    lowScoreMatches,
    fetchMatches,
    fetchMatchesForDocument,
    confirmMatch,
    rejectMatch,
    findNewMatches,
    getMatchScoreColor,
    getMatchScoreLabel,
    getMatchScoreBadge
  }
}

