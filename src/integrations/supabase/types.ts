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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          details: Json | null
          id: string
          timestamp: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          details?: Json | null
          id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voucher_batches: {
        Row: {
          auto_activate: boolean | null
          batch_id: string
          created_at: string | null
          failed: number | null
          failures: Json | null
          filename: string
          id: string
          locations: Json | null
          price_distribution: Json | null
          price_multiplier: number | null
          processed: number | null
          status_mapping: Json | null
          total_vouchers: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          auto_activate?: boolean | null
          batch_id: string
          created_at?: string | null
          failed?: number | null
          failures?: Json | null
          filename: string
          id?: string
          locations?: Json | null
          price_distribution?: Json | null
          price_multiplier?: number | null
          processed?: number | null
          status_mapping?: Json | null
          total_vouchers?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          auto_activate?: boolean | null
          batch_id?: string
          created_at?: string | null
          failed?: number | null
          failures?: Json | null
          filename?: string
          id?: string
          locations?: Json | null
          price_distribution?: Json | null
          price_multiplier?: number | null
          processed?: number | null
          status_mapping?: Json | null
          total_vouchers?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          created_at: string | null
          description: string | null
          download_speed: number | null
          duration_days: number | null
          duration_display: string | null
          duration_hours: number | null
          ecocash_ref: string | null
          id: string
          is_sold: boolean | null
          location: string | null
          omada_data: Json | null
          original_code: string
          price_currency: string
          price_display: string
          price_value: number
          sms_delivered: boolean | null
          sold_at: string | null
          sold_to: string | null
          speed_display: string | null
          status: Database["public"]["Enums"]["voucher_status"] | null
          updated_at: string | null
          upload_speed: number | null
          uploaded_batch: string | null
          validity_type: Database["public"]["Enums"]["validity_type"] | null
          voucher_code: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          download_speed?: number | null
          duration_days?: number | null
          duration_display?: string | null
          duration_hours?: number | null
          ecocash_ref?: string | null
          id?: string
          is_sold?: boolean | null
          location?: string | null
          omada_data?: Json | null
          original_code: string
          price_currency?: string
          price_display: string
          price_value: number
          sms_delivered?: boolean | null
          sold_at?: string | null
          sold_to?: string | null
          speed_display?: string | null
          status?: Database["public"]["Enums"]["voucher_status"] | null
          updated_at?: string | null
          upload_speed?: number | null
          uploaded_batch?: string | null
          validity_type?: Database["public"]["Enums"]["validity_type"] | null
          voucher_code: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          download_speed?: number | null
          duration_days?: number | null
          duration_display?: string | null
          duration_hours?: number | null
          ecocash_ref?: string | null
          id?: string
          is_sold?: boolean | null
          location?: string | null
          omada_data?: Json | null
          original_code?: string
          price_currency?: string
          price_display?: string
          price_value?: number
          sms_delivered?: boolean | null
          sold_at?: string | null
          sold_to?: string | null
          speed_display?: string | null
          status?: Database["public"]["Enums"]["voucher_status"] | null
          updated_at?: string | null
          upload_speed?: number | null
          uploaded_batch?: string | null
          validity_type?: Database["public"]["Enums"]["validity_type"] | null
          voucher_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      validity_type: "Permanent" | "Temporary"
      voucher_status: "active" | "sold" | "expired" | "reserved"
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
    Enums: {
      app_role: ["admin", "user"],
      validity_type: ["Permanent", "Temporary"],
      voucher_status: ["active", "sold", "expired", "reserved"],
    },
  },
} as const
