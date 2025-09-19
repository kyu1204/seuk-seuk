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
          filename: string
          file_url: string
          short_url: string
          signed_file_url: string | null
          created_at: string
          status: 'draft' | 'published' | 'completed'
          password: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          filename: string
          file_url: string
          short_url: string
          signed_file_url?: string | null
          created_at?: string
          status?: 'draft' | 'published' | 'completed'
          password?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          filename?: string
          file_url?: string
          short_url?: string
          signed_file_url?: string | null
          created_at?: string
          status?: 'draft' | 'published' | 'completed'
          password?: string | null
          expires_at?: string | null
        }
        Relationships: []
      }
      signatures: {
        Row: {
          id: string
          document_id: string
          area_index: number
          x: number
          y: number
          width: number
          height: number
          signature_data: string | null
          status: 'pending' | 'signed'
          signer_name: string | null
          created_at: string
          signed_at: string | null
        }
        Insert: {
          id?: string
          document_id: string
          area_index: number
          x: number
          y: number
          width: number
          height: number
          signature_data?: string | null
          status?: 'pending' | 'signed'
          signer_name?: string | null
          created_at?: string
          signed_at?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          area_index?: number
          x?: number
          y?: number
          width?: number
          height?: number
          signature_data?: string | null
          status?: 'pending' | 'signed'
          signer_name?: string | null
          created_at?: string
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
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

// Helper types for easier usage
export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

// Client-side Document type that excludes password hash and includes requiresPassword
export type ClientDocument = Omit<Document, 'password'> & {
  requiresPassword?: boolean
}

export type Signature = Database['public']['Tables']['signatures']['Row']
export type SignatureInsert = Database['public']['Tables']['signatures']['Insert']
export type SignatureUpdate = Database['public']['Tables']['signatures']['Update']

// Type for signature areas (now integrated into signatures table)
export interface SignatureArea {
  x: number
  y: number
  width: number
  height: number
}