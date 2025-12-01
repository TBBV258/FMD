// Document Types
export interface Document {
  id: string
  user_id: string
  title: string
  type: DocumentType
  status: DocumentStatus
  location: string
  file_url?: string
  file_name?: string
  file_path?: string
  file_size?: number
  file_type?: string
  hash_local?: string
  document_number?: string
  issue_date?: string
  expiry_date?: string
  issue_place?: string
  issuing_authority?: string
  country_of_issue?: string
  thumbnail_url?: string
  location_lost_found?: string | null
  last_known_location?: string | null
  location_metadata?: LocationMetadata | null
  is_verified: boolean
  verification_status: VerificationStatus
  verification_notes?: string
  description?: string
  tags?: string[]
  is_public: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type DocumentType = 'passport' | 'id_card' | 'driver_license' | 'birth_certificate' | 'other'
export type DocumentStatus = 'lost' | 'found' | 'normal' | 'matched' | 'returned'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface LocationMetadata {
  lat?: number
  lng?: number
  address?: string
  city?: string
  country?: string
}

// User Types
export interface UserProfile {
  id: string
  full_name: string
  phone_number?: string
  country: string
  avatar_url?: string
  points: number
  document_count: number
  plan: UserPlan
  created_at: string
  updated_at: string
}

export type UserPlan = 'free' | 'premium' | 'enterprise'

// Auth Types
export interface User {
  id: string
  email: string
  created_at: string
}

export interface AuthSession {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
}

// Chat Types
export interface ChatMessage {
  id: string
  document_id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
  read: boolean
}

// Notification Types
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at: string
}

export type NotificationType = 'match' | 'message' | 'system' | 'verification'

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
  success: boolean
}

// Form Types
export interface DocumentFormData {
  title: string
  type: DocumentType
  status: DocumentStatus
  description?: string
  location?: string
  documentNumber?: string
  issueDate?: string
  expiryDate?: string
  issuePlace?: string
  issuingAuthority?: string
  countryOfIssue?: string
  file?: File
}

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phoneNumber?: string
  country: string
}
