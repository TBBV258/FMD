export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          type: string
          status: string
          location: string | null
          file_url: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          hash_local: string | null
          document_number: string | null
          issue_date: string | null
          expiry_date: string | null
          issue_place: string | null
          issuing_authority: string | null
          country_of_issue: string | null
          thumbnail_url: string | null
          location_lost_found: Json | null
          last_known_location: Json | null
          location_metadata: Json | null
          is_verified: boolean
          verification_status: string
          verification_notes: string | null
          description: string | null
          tags: string[] | null
          is_public: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          type: string
          status?: string
          location?: string | null
          file_url?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          hash_local?: string | null
          document_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          issue_place?: string | null
          issuing_authority?: string | null
          country_of_issue?: string | null
          thumbnail_url?: string | null
          location_lost_found?: Json | null
          last_known_location?: Json | null
          location_metadata?: Json | null
          is_verified?: boolean
          verification_status?: string
          verification_notes?: string | null
          description?: string | null
          tags?: string[] | null
          is_public?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string
          phone_number: string | null
          country: string
          avatar_url: string | null
          points: number
          document_count: number
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone_number?: string | null
          country?: string
          avatar_url?: string | null
          points?: number
          document_count?: number
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          [key: string]: any
        }
      }
      chats: {
        Row: {
          id: string
          document_id: string
          sender_id: string
          receiver_id: string
          message: string
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          document_id: string
          sender_id: string
          receiver_id: string
          message: string
          created_at?: string
          read?: boolean
        }
        Update: {
          [key: string]: any
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          [key: string]: any
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

