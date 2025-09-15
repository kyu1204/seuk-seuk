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
          signature_areas: Json[] // Array of {x, y, width, height} objects
          short_url: string
          created_at: string
          status: 'draft' | 'completed'
        }
        Insert: {
          id?: string
          filename: string
          file_url: string
          signature_areas: Json[]
          short_url: string
          created_at?: string
          status?: 'draft' | 'completed'
        }
        Update: {
          id?: string
          filename?: string
          file_url?: string
          signature_areas?: Json[]
          short_url?: string
          created_at?: string
          status?: 'draft' | 'completed'
        }
        Relationships: []
      }
      signatures: {
        Row: {
          id: string
          document_id: string
          area_index: number
          signature_data: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          area_index: number
          signature_data: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          area_index?: number
          signature_data?: string
          created_at?: string
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

export type Signature = Database['public']['Tables']['signatures']['Row']
export type SignatureInsert = Database['public']['Tables']['signatures']['Insert']
export type SignatureUpdate = Database['public']['Tables']['signatures']['Update']

// Type for signature areas stored in JSON
export interface SignatureArea {
  x: number
  y: number
  width: number
  height: number
}