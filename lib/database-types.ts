export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          status: 'draft' | 'published' | 'completed' | 'expired'
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          status?: 'draft' | 'published' | 'completed' | 'expired'
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          status?: 'draft' | 'published' | 'completed' | 'expired'
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
      signature_areas: {
        Row: {
          id: string
          document_id: string
          x: number
          y: number
          width: number
          height: number
          order_index: number
          required: boolean
          signer_name: string | null
          signer_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          x: number
          y: number
          width: number
          height: number
          order_index?: number
          required?: boolean
          signer_name?: string | null
          signer_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          x?: number
          y?: number
          width?: number
          height?: number
          order_index?: number
          required?: boolean
          signer_name?: string | null
          signer_email?: string | null
          created_at?: string
        }
      }
      document_shares: {
        Row: {
          id: string
          document_id: string
          short_url: string
          password_hash: string | null
          max_uses: number | null
          used_count: number
          expires_at: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          document_id: string
          short_url: string
          password_hash?: string | null
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          short_url?: string
          password_hash?: string | null
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      signatures: {
        Row: {
          id: string
          document_id: string
          signature_area_id: string
          signature_data: string
          signer_name: string | null
          signer_email: string | null
          signer_ip: string | null
          signed_at: string
          status: 'pending' | 'signed'
        }
        Insert: {
          id?: string
          document_id: string
          signature_area_id: string
          signature_data: string
          signer_name?: string | null
          signer_email?: string | null
          signer_ip?: string | null
          signed_at?: string
          status?: 'pending' | 'signed'
        }
        Update: {
          id?: string
          document_id?: string
          signature_area_id?: string
          signature_data?: string
          signer_name?: string | null
          signer_email?: string | null
          signer_ip?: string | null
          signed_at?: string
          status?: 'pending' | 'signed'
        }
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          version_type: string
          file_path: string
          file_size: number | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          document_id: string
          version_type: string
          file_path: string
          file_size?: number | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          version_type?: string
          file_path?: string
          file_size?: number | null
          created_at?: string
          created_by?: string | null
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          language: string
          theme: string
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          language?: string
          theme?: string
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          language?: string
          theme?: string
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_shared_document: {
        Args: {
          doc_id: string
          share_url?: string
        }
        Returns: boolean
      }
      cleanup_old_signatures: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_signed_document_version: {
        Args: {
          doc_id: string
        }
        Returns: string
      }
    }
    Enums: {
      document_status: 'draft' | 'published' | 'completed' | 'expired'
      signature_status: 'pending' | 'signed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}