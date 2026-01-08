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

export type DocumentType = 
  | 'bi' // Bilhete de Identidade
  | 'passport' // Passaporte
  | 'driver_license' // Carta de Condução
  | 'dire' // DIRE - Documento de Identificação de Residentes Estrangeiros
  | 'nuit' // NUIT - Número Único de Identificação Tributária
  | 'work_card' // Cartão de Trabalho
  | 'student_card' // Cartão de Estudante
  | 'voter_card' // Cartão de Eleitor
  | 'birth_certificate' // Certidão de Nascimento
  | 'title_deed' // Título de Propriedade
  | 'other' // Outro
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
  rank: UserRank
  document_count: number
  plan: UserPlan
  subscription_expires_at?: string
  privacy_settings?: PrivacySettings
  backup_settings?: BackupSettings
  delivery_address?: string
  base_location?: string
  id_document_url?: string
  preferences?: NotificationPreferences
  created_at: string
  updated_at: string
}

export type UserPlan = 'free' | 'premium' | 'enterprise'
export type UserRank = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface PrivacySettings {
  showExactLocation: boolean
  allowContact: boolean
}

export interface BackupSettings {
  autoBackup: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  lastBackup?: string
}

export interface NotificationPreferences {
  sms_notifications?: boolean
  push_notifications?: boolean
  email_notifications?: boolean
  sms_high_priority_only?: boolean
}

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
