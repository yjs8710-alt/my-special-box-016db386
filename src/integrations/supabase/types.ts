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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_profiles: {
        Row: {
          agency_address: string
          agency_name: string
          agree_marketing: boolean
          business_number: string
          created_at: string
          id: string
          is_active: boolean
          license_number: string
          member_type: string
          name: string
          parent_user_id: string | null
          phone: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_address: string
          agency_name: string
          agree_marketing?: boolean
          business_number: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number: string
          member_type?: string
          name: string
          parent_user_id?: string | null
          phone: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_address?: string
          agency_name?: string
          agree_marketing?: boolean
          business_number?: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string
          member_type?: string
          name?: string
          parent_user_id?: string | null
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cheongju_contacts: {
        Row: {
          contact_broker: string | null
          contact_manager: string | null
          contact_owner: string | null
          created_at: string
          district: string
          dong: string
          id: string
          is_visible: boolean
          lot_number: string
          memo: string | null
          phone: string
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          contact_broker?: string | null
          contact_manager?: string | null
          contact_owner?: string | null
          created_at?: string
          district: string
          dong: string
          id?: string
          is_visible?: boolean
          lot_number?: string
          memo?: string | null
          phone?: string
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          contact_broker?: string | null
          contact_manager?: string | null
          contact_owner?: string | null
          created_at?: string
          district?: string
          dong?: string
          id?: string
          is_visible?: boolean
          lot_number?: string
          memo?: string | null
          phone?: string
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          agent_name: string
          area: string
          available_from: string
          build_year: string
          building_memo: string | null
          building_name: string | null
          building_password: string | null
          checked_date: string | null
          created_at: string
          deposit: string
          description: string
          district: string | null
          dong: string
          elevator: boolean
          floor: string
          id: string
          images: string[]
          is_hot: boolean
          is_new: boolean
          lat: number
          lng: number
          lot_number: string
          manage_fee: string
          monthly: string
          note: string | null
          options: string[]
          parking: string
          registered_by: string | null
          registered_date: string
          room_memo: string | null
          room_password: string | null
          room_type: string | null
          status: string
          title: string
          total_floors: string
          type: string
          unit_number: string | null
          updated_at: string
          vacate_date: string | null
          views: number
        }
        Insert: {
          address: string
          agent_name?: string
          area?: string
          available_from?: string
          build_year?: string
          building_memo?: string | null
          building_name?: string | null
          building_password?: string | null
          checked_date?: string | null
          created_at?: string
          deposit?: string
          description?: string
          district?: string | null
          dong?: string
          elevator?: boolean
          floor?: string
          id?: string
          images?: string[]
          is_hot?: boolean
          is_new?: boolean
          lat?: number
          lng?: number
          lot_number?: string
          manage_fee?: string
          monthly?: string
          note?: string | null
          options?: string[]
          parking?: string
          registered_by?: string | null
          registered_date?: string
          room_memo?: string | null
          room_password?: string | null
          room_type?: string | null
          status?: string
          title: string
          total_floors?: string
          type: string
          unit_number?: string | null
          updated_at?: string
          vacate_date?: string | null
          views?: number
        }
        Update: {
          address?: string
          agent_name?: string
          area?: string
          available_from?: string
          build_year?: string
          building_memo?: string | null
          building_name?: string | null
          building_password?: string | null
          checked_date?: string | null
          created_at?: string
          deposit?: string
          description?: string
          district?: string | null
          dong?: string
          elevator?: boolean
          floor?: string
          id?: string
          images?: string[]
          is_hot?: boolean
          is_new?: boolean
          lat?: number
          lng?: number
          lot_number?: string
          manage_fee?: string
          monthly?: string
          note?: string | null
          options?: string[]
          parking?: string
          registered_by?: string | null
          registered_date?: string
          room_memo?: string | null
          room_password?: string | null
          room_type?: string | null
          status?: string
          title?: string
          total_floors?: string
          type?: string
          unit_number?: string | null
          updated_at?: string
          vacate_date?: string | null
          views?: number
        }
        Relationships: []
      }
      property_reports: {
        Row: {
          admin_memo: string | null
          created_at: string
          deal_date: string | null
          deal_memo: string | null
          error_content: string | null
          id: string
          property_address: string
          property_id: string
          property_title: string
          proposal_content: string | null
          proposal_deposit: string | null
          proposal_monthly: string | null
          proposal_period: string | null
          proposer_company: string | null
          proposer_name: string | null
          proposer_phone: string | null
          report_type: string
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          admin_memo?: string | null
          created_at?: string
          deal_date?: string | null
          deal_memo?: string | null
          error_content?: string | null
          id?: string
          property_address: string
          property_id: string
          property_title: string
          proposal_content?: string | null
          proposal_deposit?: string | null
          proposal_monthly?: string | null
          proposal_period?: string | null
          proposer_company?: string | null
          proposer_name?: string | null
          proposer_phone?: string | null
          report_type: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          admin_memo?: string | null
          created_at?: string
          deal_date?: string | null
          deal_memo?: string | null
          error_content?: string | null
          id?: string
          property_address?: string
          property_id?: string
          property_title?: string
          proposal_content?: string | null
          proposal_deposit?: string | null
          proposal_monthly?: string | null
          proposal_period?: string | null
          proposer_company?: string | null
          proposer_name?: string | null
          proposer_phone?: string | null
          report_type?: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
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
    },
  },
} as const
