export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          customer_id: string
          email: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          email: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          created_month: string
          file_url: string
          filename: string
          id: string
          publication_id: string | null
          signed_file_url: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_month: string
          file_url: string
          filename: string
          id?: string
          publication_id?: string | null
          signed_file_url?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_month?: string
          file_url?: string
          filename?: string
          id?: string
          publication_id?: string | null
          signed_file_url?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_usage: {
        Row: {
          created_at: string | null
          documents_created: number | null
          id: string
          published_completed_count: number | null
          updated_at: string | null
          user_id: string
          year_month: string
        }
        Insert: {
          created_at?: string | null
          documents_created?: number | null
          id?: string
          published_completed_count?: number | null
          updated_at?: string | null
          user_id: string
          year_month: string
        }
        Update: {
          created_at?: string | null
          documents_created?: number | null
          id?: string
          published_completed_count?: number | null
          updated_at?: string | null
          user_id?: string
          year_month?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          name: string
          password: string | null
          short_url: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          name: string
          password?: string | null
          short_url: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          name?: string
          password?: string | null
          short_url?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          area_index: number
          created_at: string
          document_id: string | null
          height: number | null
          id: string
          signature_data: string | null
          signed_at: string | null
          signer_name: string | null
          status: string | null
          width: number | null
          x: number | null
          y: number | null
        }
        Insert: {
          area_index: number
          created_at?: string
          document_id?: string | null
          height?: number | null
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_name?: string | null
          status?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
        }
        Update: {
          area_index?: number
          created_at?: string
          document_id?: string | null
          height?: number | null
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_name?: string | null
          status?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active_document_limit: number
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_hidden: boolean
          is_popular: boolean | null
          monthly_document_limit: number
          monthly_price: number | null
          name: string
          order: number
          updated_at: string | null
          yearly_price: number | null
        }
        Insert: {
          active_document_limit?: number
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean
          is_popular?: boolean | null
          monthly_document_limit: number
          monthly_price?: number | null
          name: string
          order?: number
          updated_at?: string | null
          yearly_price?: number | null
        }
        Update: {
          active_document_limit?: number
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean
          is_popular?: boolean | null
          monthly_document_limit?: number
          monthly_price?: number | null
          name?: string
          order?: number
          updated_at?: string | null
          yearly_price?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          paddle_customer_id: string | null
          paddle_price_id: string | null
          paddle_subscription_id: string | null
          payment_provider: string | null
          plan_id: string
          starts_at: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          paddle_customer_id?: string | null
          paddle_price_id?: string | null
          paddle_subscription_id?: string | null
          payment_provider?: string | null
          plan_id: string
          starts_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          paddle_customer_id?: string | null
          paddle_price_id?: string | null
          paddle_subscription_id?: string | null
          payment_provider?: string | null
          plan_id?: string
          starts_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_subscription_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_subscription_id?: string | null
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_subscription_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_current_subscription_id_fkey"
            columns: ["current_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_documents_created: {
        Args: { target_user_id: string; target_year_month: string }
        Returns: undefined
      }
      increment_documents_created: {
        Args: { target_user_id: string; target_year_month: string }
        Returns: undefined
      }
      notify_signup: {
        Args: { event: Json }
        Returns: Json
      }
      update_published_completed_count: {
        Args: { target_user_id: string; target_year_month: string }
        Returns: undefined
      }
      update_signature_areas_transaction: {
        Args: { p_document_id: string; p_signature_areas: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for documents
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

// Client-side Document type (excludes password hash)
export type ClientDocument = Omit<Document, "password"> & {
  requiresPassword?: boolean;
};

// Helper types for publications
export type Publication = Database["public"]["Tables"]["publications"]["Row"];
export type PublicationInsert = Database["public"]["Tables"]["publications"]["Insert"];
export type PublicationUpdate = Database["public"]["Tables"]["publications"]["Update"];

// Extended type with documents
export interface PublicationWithDocuments extends Publication {
  documents?: Document[];
}

// Client-side Publication type (excludes password hash)
export type ClientPublication = Omit<Publication, "password"> & {
  requiresPassword?: boolean;
  documentCount?: number;
};

// Helper types for signatures
export type Signature = Database["public"]["Tables"]["signatures"]["Row"];
export type SignatureInsert = Database["public"]["Tables"]["signatures"]["Insert"];
export type SignatureUpdate = Database["public"]["Tables"]["signatures"]["Update"];

// Type for signature areas
export interface SignatureArea {
  x: number;
  y: number;
  width: number;
  height: number;
}
