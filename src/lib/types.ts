// Core entity types - preserving backend field names
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    location?: string;
    avatar_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

// User profile from the users table
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  points?: number;
  is_premium?: boolean;
  avatar_url?: string;
  document_count?: number;
  helped_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type DocumentType = 'bi' | 'passaporte' | 'carta' | 'outros';

export type DocumentStatus = 'normal' | 'lost' | 'found';

export interface Document {
  id?: string;
  user_id: string;
  type: DocumentType;
  name: string;
  number?: string | undefined; // Changed from string | null
  description?: string | undefined; // Changed from string | null
  status: 'normal' | 'lost' | 'found';
  location?: string;
  contact_info?: string;
  files?: any[];
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

export type DocumentFile = {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
};

export type Report = {
  id: string;
  doc_id?: string;
  kind: 'lost' | 'found';
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
  created_at: string;
};

export type Chat = {
  id: string;
  document_id: string;
  document_name: string;
  document_status: string;
  participant_ids: string[];
  other_user_name: string;
  last_message: string | null;
  last_message_time: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  updated_at: string;
};

// UI State types
export type Language = 'pt' | 'en';
export type Theme = 'light' | 'dark';

export type AuthState = {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AppState = {
  language: Language;
  theme: Theme;
  isOnline: boolean;
};

// Form types
export type DocumentFormData = {
  type: DocumentType;
  name: string;
  number?: string;
  description?: string;
};

export type LostReportFormData = {
  document_type: DocumentType;
  document_name: string;
  location: string;
  description?: string;
  contact_info: string;
  latitude?: number;
  longitude?: number;
};

export type FoundReportFormData = {
  document_type: DocumentType;
  document_name: string;
  location: string;
  description?: string;
  contact_info: string;
  latitude?: number;
  longitude?: number;
};

// API Response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  needsUpgrade?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// Service interfaces
export interface AuthService {
  signIn(email: string, password: string): Promise<{ user: any; session: any }>;
  signUp(email: string, password: string, userData: any): Promise<{ user: any; session: any }>;
  signInWithGoogle(): Promise<{ provider: string; url: string }>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<any | null>;
  onAuthStateChange(callback: (event: string, session: any) => void): () => void;
}

export interface StorageService {
  uploadDocumentFiles(files: File[], documentId: string): Promise<DocumentFile[]>;
  uploadAvatar(file: File, userId: string): Promise<string>;
  deleteFile(bucket: string, path: string): Promise<void>;
  getPublicUrl(bucket: string, path: string): string;
}

export interface MapService {
  initializeMap(container: HTMLElement, options?: any): any;
  addMarker(map: any, lat: number, lng: number): any;
  geocodeAddress(address: string): Promise<{ lat: number; lng: number }>;
  getCurrentLocation(): Promise<{ lat: number; lng: number }>;
}

export interface RealtimeService {
  subscribeToChats(documentId: string, callback: (payload: any) => void): () => void;
  subscribeToNotifications(userId: string, callback: (payload: any) => void): () => void;
  subscribeToDocumentUpdates(callback: (payload: any) => void): () => void;
}

// Entitlements hook types
export type Entitlements = {
  canAddDocuments: boolean;
  maxDocuments: number;
  canAccessAllDocumentTypes: boolean;
  hasPriorityChat: boolean;
  hasPushNotifications: boolean;
};
