import type { Document } from '@/types'
import { supabase } from '@/utils/supabase'

interface MatchResult {
  document: Document
  matchScore: number
  matchReasons: string[]
}

/**
 * Find potential matches for a document
 * Matches are based on:
 * 1. Document type (must match)
 * 2. Document number (if provided, high weight)
 * 3. Location proximity (within 50km)
 * 4. Time proximity (within 30 days)
 */
export async function findDocumentMatches(document: Document): Promise<MatchResult[]> {
  try {
    // Query for opposite status documents (lost matches with found, and vice versa)
    const oppositeStatus = document.status === 'lost' ? 'found' : 'lost'
    
    const { data: candidates, error } = await supabase
      .from('documents')
      .select('*')
      .eq('type', document.type)
      .eq('status', oppositeStatus)
      .neq('user_id', document.user_id) // Don't match own documents
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    
    if (error) throw error
    if (!candidates || candidates.length === 0) return []
    
    const matches: MatchResult[] = []
    
    for (const candidate of candidates as Document[]) {
      let score = 0
      const reasons: string[] = []
      
      // Exact document number match (high confidence)
      if (document.document_number && candidate.document_number) {
        if (document.document_number.toLowerCase() === candidate.document_number.toLowerCase()) {
          score += 50
          reasons.push('Número do documento coincide')
        }
      }
      
      // Location proximity
      if (document.location_metadata?.lat && candidate.location_metadata?.lat) {
        const distance = calculateDistance(
          document.location_metadata.lat,
          document.location_metadata.lng || 0,
          candidate.location_metadata.lat,
          candidate.location_metadata.lng || 0
        )
        
        if (distance < 5) {
          score += 30
          reasons.push('Localização muito próxima')
        } else if (distance < 20) {
          score += 15
          reasons.push('Localização próxima')
        } else if (distance < 50) {
          score += 5
          reasons.push('Mesma região')
        }
      }
      
      // Time proximity
      const timeDiff = Math.abs(
        new Date(document.created_at).getTime() - new Date(candidate.created_at).getTime()
      )
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
      
      if (daysDiff < 3) {
        score += 15
        reasons.push('Reportado recentemente')
      } else if (daysDiff < 7) {
        score += 10
        reasons.push('Reportado na mesma semana')
      }
      
      // Title/description similarity (basic)
      if (document.title && candidate.title) {
        const similarity = calculateTextSimilarity(document.title, candidate.title)
        if (similarity > 0.5) {
          score += Math.floor(similarity * 10)
          reasons.push('Descrição similar')
        }
      }
      
      // Only include if score is significant
      if (score >= 20) {
        matches.push({
          document: candidate,
          matchScore: score,
          matchReasons: reasons
        })
      }
    }
    
    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore)
    
    return matches
  } catch (err) {
    console.error('Error finding matches:', err)
    return []
  }
}

/**
 * Create match notification for both users
 */
export async function notifyMatch(lostDoc: Document, foundDoc: Document, matchScore: number) {
  try {
    const notifications = [
      {
        user_id: lostDoc.user_id,
        type: 'match',
        title: 'Possível Match Encontrado!',
        message: `Encontramos um documento ${foundDoc.type} que pode ser o seu.`,
        data: { 
          documentId: foundDoc.id,
          matchScore,
          matchedWith: lostDoc.id
        },
        read: false,
        created_at: new Date().toISOString()
      },
      {
        user_id: foundDoc.user_id,
        type: 'match',
        title: 'Possível Dono Encontrado!',
        message: `Alguém reportou a perda de um documento ${lostDoc.type} que pode ser o que você encontrou.`,
        data: { 
          documentId: lostDoc.id,
          matchScore,
          matchedWith: foundDoc.id
        },
        read: false,
        created_at: new Date().toISOString()
      }
    ]
    
    const { error } = await supabase
      .from('notifications')
      .insert(notifications)
    
    if (error) throw error
    
    return { success: true }
  } catch (err) {
    console.error('Error creating match notifications:', err)
    return { success: false, error: err }
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate basic text similarity (Jaccard similarity)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

