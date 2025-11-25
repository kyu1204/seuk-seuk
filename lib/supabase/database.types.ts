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
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      credit_balance: {
        Row: {
          create_credits: number
          id: string
          publish_credits: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          create_credits?: number
          id?: string
          publish_credits?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          create_credits?: number
          id?: string
          publish_credits?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          create_credits: number
          created_at: string | null
          id: string
          paddle_transaction_id: string | null
          publish_credits: number
          related_document_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          create_credits?: number
          created_at?: string | null
          id?: string
          paddle_transaction_id?: string | null
          publish_credits?: number
          related_document_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          create_credits?: number
          created_at?: string | null
          id?: string
          paddle_transaction_id?: string | null
          publish_credits?: number
          related_document_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          customer_id: string
          email: string
          first_trial_date: string | null
          has_used_free_trial: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          email: string
          first_trial_date?: string | null
          has_used_free_trial?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string
          first_trial_date?: string | null
          has_used_free_trial?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          alias: string | null
          created_at: string
          created_month: string
          deleted_at: string | null
          file_url: string
          filename: string
          id: string
          is_deleted: boolean
          publication_id: string | null
          signed_file_url: string | null
          signed_pdf_url: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string
          created_month: string
          deleted_at?: string | null
          file_url: string
          filename: string
          id?: string
          is_deleted?: boolean
          publication_id?: string | null
          signed_file_url?: string | null
          signed_pdf_url?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string
          created_month?: string
          deleted_at?: string | null
          file_url?: string
          filename?: string
          id?: string
          is_deleted?: boolean
          publication_id?: string | null
          signed_file_url?: string | null
          signed_pdf_url?: string | null
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
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_deleted: boolean
          name: string
          password: string | null
          short_url: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          password?: string | null
          short_url: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_deleted?: boolean
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
          privacy_accepted_at: string | null
          privacy_accepted_version: string | null
          terms_accepted_at: string | null
          terms_accepted_version: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_subscription_id?: string | null
          id: string
          name: string
          privacy_accepted_at?: string | null
          privacy_accepted_version?: string | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_subscription_id?: string | null
          id?: string
          name?: string
          privacy_accepted_at?: string | null
          privacy_accepted_version?: string | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
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
      add_credits_atomic: {
        Args: {
          p_paddle_transaction_id: string
          p_quantity: number
          p_user_id: string
        }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      decrement_documents_created: {
        Args: { target_user_id: string; target_year_month: string }
        Returns: undefined
      }
      deduct_credit_atomic: {
        Args: { p_document_id: string; p_type: string; p_user_id: string }
        Returns: boolean
      }
      increment_documents_created: {
        Args: { target_user_id: string; target_year_month: string }
        Returns: undefined
      }
      notify_signup: { Args: { event: Json }; Returns: Json }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
