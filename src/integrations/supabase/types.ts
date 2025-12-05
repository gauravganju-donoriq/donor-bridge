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
          donor_letter: string | null
          id: string
          location: Database["public"]["Enums"]["appointment_location"] | null
          notes: string | null
          prescreened_by: string | null
          prescreened_date: string | null
          purpose: Database["public"]["Enums"]["appointment_purpose"] | null
          rescheduled_from: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          uber_needed: boolean | null
          uber_ordered: boolean | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id: string
          donor_letter?: string | null
          id?: string
          location?: Database["public"]["Enums"]["appointment_location"] | null
          notes?: string | null
          prescreened_by?: string | null
          prescreened_date?: string | null
          purpose?: Database["public"]["Enums"]["appointment_purpose"] | null
          rescheduled_from?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          uber_needed?: boolean | null
          uber_ordered?: boolean | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_type?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_id?: string
          donor_letter?: string | null
          id?: string
          location?: Database["public"]["Enums"]["appointment_location"] | null
          notes?: string | null
          prescreened_by?: string | null
          prescreened_date?: string | null
          purpose?: Database["public"]["Enums"]["appointment_purpose"] | null
          rescheduled_from?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          uber_needed?: boolean | null
          uber_ordered?: boolean | null
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
          {
            foreignKeyName: "appointments_prescreened_by_fkey"
            columns: ["prescreened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_results: {
        Row: {
          appointment_id: string
          cell_count: number | null
          clots_vol_ml: number | null
          created_at: string
          departure_time: string | null
          doctor_comments: string | null
          doctor_id: string | null
          exam_room_time: string | null
          final_vol_ml: number | null
          id: string
          lab_tech_id: string | null
          lot_number: string | null
          lot_number_2: string | null
          lot_number_3: string | null
          lot_number_4: string | null
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          appointment_id: string
          cell_count?: number | null
          clots_vol_ml?: number | null
          created_at?: string
          departure_time?: string | null
          doctor_comments?: string | null
          doctor_id?: string | null
          exam_room_time?: string | null
          final_vol_ml?: number | null
          id?: string
          lab_tech_id?: string | null
          lot_number?: string | null
          lot_number_2?: string | null
          lot_number_3?: string | null
          lot_number_4?: string | null
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          appointment_id?: string
          cell_count?: number | null
          clots_vol_ml?: number | null
          created_at?: string
          departure_time?: string | null
          doctor_comments?: string | null
          doctor_id?: string | null
          exam_room_time?: string | null
          final_vol_ml?: number | null
          id?: string
          lab_tech_id?: string | null
          lot_number?: string | null
          lot_number_2?: string | null
          lot_number_3?: string | null
          lot_number_4?: string | null
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_results_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_results_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_results_lab_tech_id_fkey"
            columns: ["lab_tech_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_consents: {
        Row: {
          access_token: string
          consent_type: string
          created_at: string
          created_by: string | null
          donor_id: string
          id: string
          ip_address: string | null
          signature_data: string | null
          signed_at: string | null
          signed_document_path: string | null
          status: string
          token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          consent_type: string
          created_at?: string
          created_by?: string | null
          donor_id: string
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_document_path?: string | null
          status?: string
          token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          consent_type?: string
          created_at?: string
          created_by?: string | null
          donor_id?: string
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_document_path?: string | null
          status?: string
          token_expires_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_consents_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          donor_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: string
          donor_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          donor_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_documents_donor_id_fkey"
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
          last_donation_date: string | null
          last_name: string
          middle_initial: string | null
          next_eligible_date: string | null
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
          last_donation_date?: string | null
          last_name: string
          middle_initial?: string | null
          next_eligible_date?: string | null
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
          last_donation_date?: string | null
          last_name?: string
          middle_initial?: string | null
          next_eligible_date?: string | null
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
      follow_ups: {
        Row: {
          appointment_id: string
          aspiration_sites_notes: string | null
          checked_aspiration_sites: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          current_pain_level: number | null
          doctor_rating: number | null
          donor_id: string
          id: string
          infection_details: string | null
          notes: string | null
          nurse_rating: number | null
          pain_level: number | null
          pain_medication_details: string | null
          procedure_feedback: string | null
          signs_of_infection: boolean | null
          staff_rating: number | null
          status: Database["public"]["Enums"]["follow_up_status"]
          symptoms_details: string | null
          took_pain_medication: boolean | null
          unusual_symptoms: boolean | null
          updated_at: string
          would_donate_again: boolean | null
        }
        Insert: {
          appointment_id: string
          aspiration_sites_notes?: string | null
          checked_aspiration_sites?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          current_pain_level?: number | null
          doctor_rating?: number | null
          donor_id: string
          id?: string
          infection_details?: string | null
          notes?: string | null
          nurse_rating?: number | null
          pain_level?: number | null
          pain_medication_details?: string | null
          procedure_feedback?: string | null
          signs_of_infection?: boolean | null
          staff_rating?: number | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          symptoms_details?: string | null
          took_pain_medication?: boolean | null
          unusual_symptoms?: boolean | null
          updated_at?: string
          would_donate_again?: boolean | null
        }
        Update: {
          appointment_id?: string
          aspiration_sites_notes?: string | null
          checked_aspiration_sites?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          current_pain_level?: number | null
          doctor_rating?: number | null
          donor_id?: string
          id?: string
          infection_details?: string | null
          notes?: string | null
          nurse_rating?: number | null
          pain_level?: number | null
          pain_medication_details?: string | null
          procedure_feedback?: string | null
          signs_of_infection?: boolean | null
          staff_rating?: number | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          symptoms_details?: string | null
          took_pain_medication?: boolean | null
          unusual_symptoms?: boolean | null
          updated_at?: string
          would_donate_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      health_questionnaires: {
        Row: {
          access_token: string
          appointment_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          donor_id: string
          id: string
          responses: Json | null
          started_at: string | null
          status: string
          token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          appointment_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          donor_id: string
          id?: string
          responses?: Json | null
          started_at?: string | null
          status?: string
          token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          appointment_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          donor_id?: string
          id?: string
          responses?: Json | null
          started_at?: string | null
          status?: string
          token_expires_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_questionnaires_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_questionnaires_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
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
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          check_date: string | null
          check_issued: boolean | null
          check_mailed: boolean | null
          check_number: string | null
          check_voided: boolean | null
          comment: string | null
          created_at: string
          created_by: string | null
          date_issued: string | null
          date_ordered: string | null
          donor_id: string
          id: string
          memo: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          received_date: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          check_date?: string | null
          check_issued?: boolean | null
          check_mailed?: boolean | null
          check_number?: string | null
          check_voided?: boolean | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          date_issued?: string | null
          date_ordered?: string | null
          donor_id: string
          id?: string
          memo?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          received_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          check_date?: string | null
          check_issued?: boolean | null
          check_mailed?: boolean | null
          check_number?: string | null
          check_voided?: boolean | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          date_issued?: string | null
          date_ordered?: string | null
          donor_id?: string
          id?: string
          memo?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          received_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
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
      screening_rules: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          field_path: string
          id: string
          is_active: boolean | null
          rule_key: string
          rule_name: string
          rule_type: string
          rule_value: Json
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          field_path: string
          id?: string
          is_active?: boolean | null
          rule_key: string
          rule_name: string
          rule_type: string
          rule_value: Json
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          field_path?: string
          id?: string
          is_active?: boolean | null
          rule_key?: string
          rule_name?: string
          rule_type?: string
          rule_value?: Json
          severity?: string | null
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
          ai_evaluation: Json | null
          ai_recommendation: string | null
          ai_score: number | null
          assigned_sex: string | null
          birth_date: string | null
          blood_disorder_details: string | null
          chronic_illness_details: string | null
          city: string | null
          created_at: string | null
          email: string | null
          ethnicity: string[] | null
          evaluated_at: string | null
          evaluation_flags: Json | null
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
          ai_evaluation?: Json | null
          ai_recommendation?: string | null
          ai_score?: number | null
          assigned_sex?: string | null
          birth_date?: string | null
          blood_disorder_details?: string | null
          chronic_illness_details?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          ethnicity?: string[] | null
          evaluated_at?: string | null
          evaluation_flags?: Json | null
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
          ai_evaluation?: Json | null
          ai_recommendation?: string | null
          ai_score?: number | null
          assigned_sex?: string | null
          birth_date?: string | null
          blood_disorder_details?: string | null
          chronic_illness_details?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          ethnicity?: string[] | null
          evaluated_at?: string | null
          evaluation_flags?: Json | null
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
      restore_donor_eligibility: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "staff" | "readonly"
      appointment_location: "bethesda" | "germantown"
      appointment_purpose: "research" | "clinical"
      appointment_status:
        | "scheduled"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
        | "deferred"
        | "sample_not_taken"
      eligibility_status: "eligible" | "ineligible" | "pending_review"
      follow_up_status:
        | "pending"
        | "attempted_1"
        | "attempted_2"
        | "completed"
        | "email_sent"
      payment_type: "screening" | "donation"
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
      appointment_location: ["bethesda", "germantown"],
      appointment_purpose: ["research", "clinical"],
      appointment_status: [
        "scheduled",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
        "deferred",
        "sample_not_taken",
      ],
      eligibility_status: ["eligible", "ineligible", "pending_review"],
      follow_up_status: [
        "pending",
        "attempted_1",
        "attempted_2",
        "completed",
        "email_sent",
      ],
      payment_type: ["screening", "donation"],
      sex_type: ["male", "female"],
      submission_status: ["pending", "approved", "rejected", "linked_to_donor"],
    },
  },
} as const
