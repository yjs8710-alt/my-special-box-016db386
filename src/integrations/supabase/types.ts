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
          agency_phone: string | null
          agree_marketing: boolean
          allowed_pc_ip: string | null
          business_number: string
          created_at: string
          id: string
          is_active: boolean
          license_number: string
          member_type: string
          name: string
          parent_user_id: string | null
          phone: string
          representative_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_address: string
          agency_name: string
          agency_phone?: string | null
          agree_marketing?: boolean
          allowed_pc_ip?: string | null
          business_number: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number: string
          member_type?: string
          name: string
          parent_user_id?: string | null
          phone: string
          representative_name?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_address?: string
          agency_name?: string
          agency_phone?: string | null
          agree_marketing?: boolean
          allowed_pc_ip?: string | null
          business_number?: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string
          member_type?: string
          name?: string
          parent_user_id?: string | null
          phone?: string
          representative_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      building_summary: {
        Row: {
          approval_date: string | null
          building_area: string | null
          building_name: string | null
          created_at: string
          elevator: boolean | null
          floors_above: string | null
          floors_below: string | null
          id: string
          land_area: string | null
          main_purpose: string | null
          parking_count: string | null
          property_id: string
          total_area: string | null
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          building_area?: string | null
          building_name?: string | null
          created_at?: string
          elevator?: boolean | null
          floors_above?: string | null
          floors_below?: string | null
          id?: string
          land_area?: string | null
          main_purpose?: string | null
          parking_count?: string | null
          property_id: string
          total_area?: string | null
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          building_area?: string | null
          building_name?: string | null
          created_at?: string
          elevator?: boolean | null
          floors_above?: string | null
          floors_below?: string | null
          id?: string
          land_area?: string | null
          main_purpose?: string | null
          parking_count?: string | null
          property_id?: string
          total_area?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cheongju_contacts: {
        Row: {
          building_dong: string | null
          building_name: string | null
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
          building_dong?: string | null
          building_name?: string | null
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
          building_dong?: string | null
          building_name?: string | null
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
      land_summary: {
        Row: {
          created_at: string
          id: string
          land_area: string | null
          land_category: string | null
          lot_number: string | null
          official_price: string | null
          property_id: string
          road_access: string | null
          updated_at: string
          use_zone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          land_area?: string | null
          land_category?: string | null
          lot_number?: string | null
          official_price?: string | null
          property_id: string
          road_access?: string | null
          updated_at?: string
          use_zone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          land_area?: string | null
          land_category?: string | null
          lot_number?: string | null
          official_price?: string | null
          property_id?: string
          road_access?: string | null
          updated_at?: string
          use_zone?: string | null
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
      property_user_memos: {
        Row: {
          content: string
          created_at: string
          id: string
          memo_type: string
          property_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          memo_type: string
          property_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          memo_type?: string
          property_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_record_summary: {
        Row: {
          building_approval_date: string | null
          building_floors: string | null
          building_main_purpose: string | null
          building_register_url: string | null
          building_total_area: string | null
          created_at: string
          id: string
          land_address: string | null
          land_area: string | null
          land_category: string | null
          land_register_url: string | null
          land_use_zone: string | null
          memo: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          building_approval_date?: string | null
          building_floors?: string | null
          building_main_purpose?: string | null
          building_register_url?: string | null
          building_total_area?: string | null
          created_at?: string
          id?: string
          land_address?: string | null
          land_area?: string | null
          land_category?: string | null
          land_register_url?: string | null
          land_use_zone?: string | null
          memo?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          building_approval_date?: string | null
          building_floors?: string | null
          building_main_purpose?: string | null
          building_register_url?: string | null
          building_total_area?: string | null
          created_at?: string
          id?: string
          land_address?: string | null
          land_area?: string | null
          land_category?: string | null
          land_register_url?: string | null
          land_use_zone?: string | null
          memo?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_active_sessions: {
        Row: {
          created_at: string
          device_id: string
          device_type: string
          id: string
          ip_address: string | null
          last_seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_type: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_type?: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          user_agent?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_device_slot:
        | {
            Args: {
              _device_id: string
              _device_type: string
              _user_agent?: string
            }
            Returns: string
          }
        | {
            Args: {
              _device_id: string
              _device_type: string
              _ip_address?: string
              _user_agent?: string
            }
            Returns: string
          }
      get_reference_images: {
        Args: { _addresses: string[] }
        Returns: {
          address: string
          images: string[]
          room_type: string
          unit_number: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_property_images: {
        Args: { _images: string[]; _property_id: string }
        Returns: boolean
      }
      verify_device_slot: {
        Args: { _device_id: string; _device_type: string }
        Returns: boolean
      }
      verify_pc_ip: { Args: { _ip_address: string }; Returns: boolean }
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
