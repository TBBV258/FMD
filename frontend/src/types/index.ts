import type { UserRank } from '@/utils/pointsSystem'

// User types
export interface User {
  id: string
  email: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string | null
  avatar_url?: string | null
  bio?: string | null
  points: number
  rank: UserRank
  created_at: string
  updated_at: string
}

// Document types
export type DocumentType = 'BI' | 'Passport' | 'Driver_License' | 'Birth_Certificate' | 'Other'
export type DocumentStatus = 'lost' | 'found' | 'normal'

export interface LocationMetadata {
  lat?: number
  lng?: number
  address?: string
  city?: string
  country?: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  description: string
  document_type: DocumentType
  status: DocumentStatus
  location: string
  location_metadata?: LocationMetadata | null
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  user_profiles?: UserProfile
}

// Match types
export interface MatchReason {
  reason: string
  points: number
  description: string
}

export interface DocumentMatch {
  id: string
  lost_document_id: string
  found_document_id: string
  match_score: number
  match_reasons: MatchReason[]
  status: 'pending' | 'confirmed' | 'rejected'
  created_at: string
  updated_at: string
  lost_document?: Document
  found_document?: Document
}

// Chat types
export interface Chat {
  id: string
  document_id: string
  sender_id: string
  receiver_id: string
  message: string
  read: boolean
  created_at: string
  documents?: Document
  sender?: UserProfile
  receiver?: UserProfile
}

// Notification types
export type NotificationType = 
  | 'document_match' 
  | 'document_found' 
  | 'message' 
  | 'verification' 
  | 'status_change' 
  | 'points_milestone'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, any> | null
  created_at: string
}

// Meeting Point types
export interface MeetingPoint {
  id: string
  user_id: string
  document_id?: string | null
  name: string
  description?: string | null
  location_metadata: LocationMetadata
  created_at: string
}

// Points & Ranking types
export type PointActivityType = 
  | 'document_upload' 
  | 'document_found' 
  | 'document_returned' 
  | 'message_sent' 
  | 'profile_update' 
  | 'login' 
  | 'daily_bonus' 
  | 'referral' 
  | 'admin_award'

export interface PointActivity {
  id: string
  user_id: string
  activity_type: PointActivityType
  points_awarded: number
  created_at: string
}

// Badge types
export type BadgeType = 
  | 'good_samaritan' 
  | 'lucky_finder' 
  | 'early_bird' 
  | 'night_owl'
  | 'social_butterfly'
  | 'speed_demon'
  | 'helper'
  | 'veteran'
  | 'pioneer'
  | 'match_maker'

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  id: string
  user_id: string
  badge_type: BadgeType
  badge_name: string
  badge_description: string
  badge_icon: string
  badge_rarity: BadgeRarity
  earned_at: string
  progress?: number // 0-100 for progress-based badges
}

export interface BadgeDefinition {
  type: BadgeType
  name: string
  description: string
  icon: string
  rarity: BadgeRarity
  requirement: string
  color: string
}

// SMS Notification types
export interface SMSNotification {
  id: string
  user_id: string
  phone: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  provider: 'twilio' | 'vonage' | 'movitel' | 'vodacom'
  created_at: string
  sent_at?: string | null
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Form types
export interface DocumentFormData {
  title: string
  description: string
  document_type: DocumentType
  status: DocumentStatus
  location: string
  location_metadata?: LocationMetadata | null
  file?: File | null
  is_public: boolean
}

export interface ProfileFormData {
  full_name: string
  phone?: string | null
  bio?: string | null
  avatar?: File | null
}
