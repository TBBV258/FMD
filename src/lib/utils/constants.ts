import type { DocumentType } from '@/lib/types';

// Document type configurations
export const DOCUMENT_TYPES: Record<DocumentType, {
  icon: string;
  color: string;
  maxLength?: number;
  pattern?: RegExp;
  example?: string;
}> = {
  bi: {
    icon: 'fa-id-card',
    color: 'text-blue-600',
    maxLength: 14,
    pattern: /^\d{9}[A-Z]\d{3}[A-Z]$/,
    example: '123456789A123B',
  },
  passaporte: {
    icon: 'fa-passport',
    color: 'text-green-600',
    maxLength: 9,
    pattern: /^[A-Z]{2}\d{7}$/,
    example: 'AB1234567',
  },
  carta: {
    icon: 'fa-car',
    color: 'text-orange-600',
    maxLength: 12,
    example: 'AO123456789',
  },
  outros: {
    icon: 'fa-file-alt',
    color: 'text-gray-600',
  },
};

// Country configurations with flags and phone prefixes
export const COUNTRIES = {
  AO: {
    name: 'Angola',
    flag: '🇦🇴',
    prefix: '+244',
    phonePattern: /^[89]\d{8}$/,
    phoneExample: '84 123 4567',
  },
  MZ: {
    name: 'Mozambique', 
    flag: '🇲🇿',
    prefix: '+258',
    phonePattern: /^[8-9]\d{8}$/,
    phoneExample: '84 123 4567',
  },
  PT: {
    name: 'Portugal',
    flag: '🇵🇹', 
    prefix: '+351',
    phonePattern: /^[9]\d{8}$/,
    phoneExample: '912 345 678',
  },
  BR: {
    name: 'Brasil',
    flag: '🇧🇷',
    prefix: '+55',
    phonePattern: /^[1-9]\d{10}$/,
    phoneExample: '11 98765 4321',
  },
} as const;

// Storage keys for localStorage
export const STORAGE_KEYS = {
  LANGUAGE: 'findmydocs_language',
  THEME: 'findmydocs_theme',
  ONBOARDING_COMPLETED: 'findmydocs_onboarding',
  DRAFT_DOCUMENTS: 'findmydocs_draft_documents',
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  USER_PROFILE: 'user-profile',
  USER_DOCUMENTS: 'user-documents',
  DOCUMENT_LIMITS: 'document-limits',
  LOST_DOCUMENTS: 'lost-documents',
  FOUND_DOCUMENTS: 'found-documents',
  CHAT_MESSAGES: 'chat-messages',
  USER_CHATS: 'user-chats',
  NOTIFICATIONS: 'notifications',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  CONFIG: '/api/config',
  DOCUMENTS: '/api/documents',
  LOST_DOCUMENTS: '/api/lost-documents',
  FOUND_DOCUMENTS: '/api/found-documents',
  CHATS: '/api/chats',
  PROFILE: '/api/profile',
  NOTIFICATIONS: '/api/notifications',
  UPLOAD_AVATAR: '/api/upload-avatar',
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENTS: ['application/pdf'],
    ALL: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
  MAX_FILES: 5,
} as const;

// Premium plan limits
export const PLAN_LIMITS = {
  FREE: {
    MAX_DOCUMENTS: 1,
    ALLOWED_TYPES: ['bi'] as DocumentType[],
    FEATURES: ['basic_search', 'document_storage'],
  },
  PREMIUM: {
    MAX_DOCUMENTS: -1, // Unlimited
    ALLOWED_TYPES: ['bi', 'passaporte', 'carta', 'outros'] as DocumentType[],
    FEATURES: ['unlimited_documents', 'all_document_types', 'priority_chat', 'push_notifications'],
  },
} as const;

// Map default coordinates (Maputo, Mozambique)
export const MAP_DEFAULTS = {
  CENTER: [-25.966, 32.583] as [number, number],
  ZOOM: 10,
  MAX_ZOOM: 18,
  MIN_ZOOM: 5,
} as const;

// Breakpoints for responsive design (matches Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Animation durations (in ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Toast notification durations
export const TOAST_DURATION = {
  SHORT: 3000,
  NORMAL: 5000,
  LONG: 8000,
} as const;

// Error retry configurations
export const RETRY_CONFIG = {
  DEFAULT_RETRIES: 3,
  RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 30000,
} as const;

// Date format patterns
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
} as const;
