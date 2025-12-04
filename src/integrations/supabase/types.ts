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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string | null
          created_at: string | null
          created_by: string | null
          donor_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          donor_id: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          donor_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          donor_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_notes_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          alcohol_use: boolean | null
          assigned_sex: Database["public"]["Enums"]["sex_type"]
          birth_date: string
          bmi: number | null
          cell_phone: string | null
          chosen_name: string | null
          city: string | null
          cmv_positive: string | null
          created_at: string | null
          created_by: string | null
          donor_id: string
          eligibility_status:
            | Database["public"]["Enums"]["eligibility_status"]
            | null
          email: string | null
          ethnicity: string | null
          first_name: string
          height_inches: number | null
          home_phone: string | null
          id: string
          ineligibility_reason: string | null
          last_name: string
          middle_initial: string | null
          postal_code: string | null
          pronouns: string | null
          social_security_encrypted: string | null
          state: string | null
          tobacco_use: boolean | null
          updated_at: string | null
          weight_pounds: number | null
          work_phone: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          alcohol_use?: boolean | null
          assigned_sex: Database["public"]["Enums"]["sex_type"]
          birth_date: string
          bmi?: number | null
          cell_phone?: string | null
          chosen_name?: string | null
          city?: string | null
          cmv_positive?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id: string
          eligibility_status?:
            | Database["public"]["Enums"]["eligibility_status"]
            | null
          email?: string | null
          ethnicity?: string | null
          first_name: string
          height_inches?: number | null
          home_phone?: string | null
          id?: string
          ineligibility_reason?: string | null
          last_name: string
          middle_initial?: string | null
          postal_code?: string | null
          pronouns?: string | null
          social_security_encrypted?: string | null
          state?: string | null
          tobacco_use?: boolean | null
          updated_at?: string | null
          weight_pounds?: number | null
          work_phone?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          alcohol_use?: boolean | null
          assigned_sex?: Database["public"]["Enums"]["sex_type"]
          birth_date?: string
          bmi?: number | null
          cell_phone?: string | null
          chosen_name?: string | null
          city?: string | null
          cmv_positive?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id?: string
          eligibility_status?:
            | Database["public"]["Enums"]["eligibility_status"]
            | null
          email?: string | null
          ethnicity?: string | null
          first_name?: string
          height_inches?: number | null
          home_phone?: string | null
          id?: string
          ineligibility_reason?: string | null
          last_name?: string
          middle_initial?: string | null
          postal_code?: string | null
          pronouns?: string | null
          social_security_encrypted?: string | null
          state?: string | null
          tobacco_use?: boolean | null
          updated_at?: string | null
          weight_pounds?: number | null
          work_phone?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webform_submissions: {
        Row: {
          acknowledge_health_screening: boolean | null
          acknowledge_info_accurate: boolean | null
          acknowledge_time_commitment: boolean | null
          address_line_2: string | null
          assigned_sex: string | null
          birth_date: string | null
          blood_disorder_details: string | null
          chronic_illness_details: string | null
          city: string | null
          created_at: string | null
          email: string | null
          ethnicity: string[] | null
          first_name: string
          had_surgery: boolean | null
          has_been_incarcerated: boolean | null
          has_been_pregnant: boolean | null
          has_blood_disorder: boolean | null
          has_chronic_illness: boolean | null
          has_received_transfusion: boolean | null
          has_tattoos_piercings: boolean | null
          has_traveled_internationally: boolean | null
          height_feet: number | null
          height_inches: number | null
          id: string
          incarceration_details: string | null
          last_name: string
          linked_donor_id: string | null
          medication_details: string | null
          phone: string | null
          pregnancy_details: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          state: string | null
          status: Database["public"]["Enums"]["submission_status"] | null
          street_address: string | null
          submission_id: string
          surgery_details: string | null
          takes_medications: boolean | null
          tattoo_piercing_details: string | null
          transfusion_details: string | null
          travel_details: string | null
          weight: number | null
          zip_code: string | null
        }
        Insert: {
          acknowledge_health_screening?: boolean | null
          acknowledge_info_accurate?: boolean | null
          acknowledge_time_commitment?: boolean | null
          address_line_2?: string | null
          assigned_sex?: string | null
          birth_date?: string | null
          blood_disorder_details?: string | null
          chronic_illness_details?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          ethnicity?: string[] | null
          first_name: string
          had_surgery?: boolean | null
          has_been_incarcerated?: boolean | null
          has_been_pregnant?: boolean | null
          has_blood_disorder?: boolean | null
          has_chronic_illness?: boolean | null
          has_received_transfusion?: boolean | null
          has_tattoos_piercings?: boolean | null
          has_traveled_internationally?: boolean | null
          height_feet?: number | null
          height_inches?: number | null
          id?: string
          incarceration_details?: string | null
          last_name: string
          linked_donor_id?: string | null
          medication_details?: string | null
          phone?: string | null
          pregnancy_details?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          street_address?: string | null
          submission_id: string
          surgery_details?: string | null
          takes_medications?: boolean | null
          tattoo_piercing_details?: string | null
          transfusion_details?: string | null
          travel_details?: string | null
          weight?: number | null
          zip_code?: string | null
        }
        Update: {
          acknowledge_health_screening?: boolean | null
          acknowledge_info_accurate?: boolean | null
          acknowledge_time_commitment?: boolean | null
          address_line_2?: string | null
          assigned_sex?: string | null
          birth_date?: string | null
          blood_disorder_details?: string | null
          chronic_illness_details?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          ethnicity?: string[] | null
          first_name?: string
          had_surgery?: boolean | null
          has_been_incarcerated?: boolean | null
          has_been_pregnant?: boolean | null
          has_blood_disorder?: boolean | null
          has_chronic_illness?: boolean | null
          has_received_transfusion?: boolean | null
          has_tattoos_piercings?: boolean | null
          has_traveled_internationally?: boolean | null
          height_feet?: number | null
          height_inches?: number | null
          id?: string
          incarceration_details?: string | null
          last_name?: string
          linked_donor_id?: string | null
          medication_details?: string | null
          phone?: string | null
          pregnancy_details?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          street_address?: string | null
          submission_id?: string
          surgery_details?: string | null
          takes_medications?: boolean | null
          tattoo_piercing_details?: string | null
          transfusion_details?: string | null
          travel_details?: string | null
          weight?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webform_submissions_linked_donor_id_fkey"
            columns: ["linked_donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin_or_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "readonly"
      appointment_status: "scheduled" | "completed" | "cancelled" | "no_show"
      eligibility_status: "eligible" | "ineligible" | "pending_review"
      sex_type: "male" | "female"
      submission_status: "pending" | "approved" | "rejected" | "linked_to_donor"
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
      app_role: ["admin", "staff", "readonly"],
      appointment_status: ["scheduled", "completed", "cancelled", "no_show"],
      eligibility_status: ["eligible", "ineligible", "pending_review"],
      sex_type: ["male", "female"],
      submission_status: ["pending", "approved", "rejected", "linked_to_donor"],
    },
  },
} as const
