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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications_first_time: {
        Row: {
          age: number
          allergies: boolean
          allergies_detail: string | null
          comment: string | null
          country: string
          created_at: string
          email: string
          fears: boolean
          fears_detail: string | null
          first_time_plants: boolean
          full_name: string
          has_themes: boolean
          health_condition: boolean
          health_condition_detail: string | null
          height: string
          id: string
          occupation: string
          phone: string
          plants_detail: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          spiritual_practice: boolean
          spiritual_practice_detail: string | null
          status: Database["public"]["Enums"]["application_status"]
          stress_anxiety: boolean
          stress_anxiety_detail: string | null
          substance_use: boolean
          substance_use_detail: string | null
          themes_detail: string | null
          trauma: boolean
          trauma_detail: string | null
          trip_id: string
          user_id: string
          weight: string
        }
        Insert: {
          age: number
          allergies: boolean
          allergies_detail?: string | null
          comment?: string | null
          country: string
          created_at?: string
          email: string
          fears: boolean
          fears_detail?: string | null
          first_time_plants: boolean
          full_name: string
          has_themes: boolean
          health_condition: boolean
          health_condition_detail?: string | null
          height: string
          id?: string
          occupation: string
          phone: string
          plants_detail?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spiritual_practice: boolean
          spiritual_practice_detail?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          stress_anxiety: boolean
          stress_anxiety_detail?: string | null
          substance_use: boolean
          substance_use_detail?: string | null
          themes_detail?: string | null
          trauma: boolean
          trauma_detail?: string | null
          trip_id: string
          user_id: string
          weight: string
        }
        Update: {
          age?: number
          allergies?: boolean
          allergies_detail?: string | null
          comment?: string | null
          country?: string
          created_at?: string
          email?: string
          fears?: boolean
          fears_detail?: string | null
          first_time_plants?: boolean
          full_name?: string
          has_themes?: boolean
          health_condition?: boolean
          health_condition_detail?: string | null
          height?: string
          id?: string
          occupation?: string
          phone?: string
          plants_detail?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spiritual_practice?: boolean
          spiritual_practice_detail?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          stress_anxiety?: boolean
          stress_anxiety_detail?: string | null
          substance_use?: boolean
          substance_use_detail?: string | null
          themes_detail?: string | null
          trauma?: boolean
          trauma_detail?: string | null
          trip_id?: string
          user_id?: string
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_first_time_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      applications_returning: {
        Row: {
          ceremony_date: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          new_treatment: boolean
          new_treatment_detail: string | null
          previous_ceremonies: number
          purpose: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          stress_anxiety: boolean
          stress_anxiety_detail: string | null
          theme: string
          trip_id: string
          user_id: string
        }
        Insert: {
          ceremony_date?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          new_treatment: boolean
          new_treatment_detail?: string | null
          previous_ceremonies: number
          purpose: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          stress_anxiety: boolean
          stress_anxiety_detail?: string | null
          theme: string
          trip_id: string
          user_id: string
        }
        Update: {
          ceremony_date?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          new_treatment?: boolean
          new_treatment_detail?: string | null
          previous_ceremonies?: number
          purpose?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          stress_anxiety?: boolean
          stress_anxiety_detail?: string | null
          theme?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_returning_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          application_first_time_id: string | null
          application_returning_id: string | null
          confirmations: Json
          consent_version: string
          created_at: string
          date: string
          digital_signature: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          application_first_time_id?: string | null
          application_returning_id?: string | null
          confirmations: Json
          consent_version: string
          created_at?: string
          date?: string
          digital_signature: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          application_first_time_id?: string | null
          application_returning_id?: string | null
          confirmations?: Json
          consent_version?: string
          created_at?: string
          date?: string
          digital_signature?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_application_first_time_id_fkey"
            columns: ["application_first_time_id"]
            isOneToOne: false
            referencedRelation: "applications_first_time"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_application_first_time_id_fkey"
            columns: ["application_first_time_id"]
            isOneToOne: false
            referencedRelation: "my_applications_first_time"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_application_returning_id_fkey"
            columns: ["application_returning_id"]
            isOneToOne: false
            referencedRelation: "applications_returning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_application_returning_id_fkey"
            columns: ["application_returning_id"]
            isOneToOne: false
            referencedRelation: "my_applications_returning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          location: string | null
          price: number
          schedule: Json
          start_date: string
          status: Database["public"]["Enums"]["trip_status"]
          terms: string | null
          title: string
          type: Database["public"]["Enums"]["trip_type"]
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number
          schedule?: Json
          start_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          terms?: string | null
          title: string
          type?: Database["public"]["Enums"]["trip_type"]
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number
          schedule?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          terms?: string | null
          title?: string
          type?: Database["public"]["Enums"]["trip_type"]
        }
        Relationships: []
      }
    }
    Views: {
      my_applications_first_time: {
        Row: {
          created_at: string | null
          id: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_first_time_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      my_applications_returning: {
        Row: {
          created_at: string | null
          id: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_returning_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status: "pending_review" | "approved" | "rejected" | "expired"
      trip_status: "draft" | "open" | "closed" | "completed"
      trip_type: "retiro" | "ceremonia"
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
      application_status: ["pending_review", "approved", "rejected", "expired"],
      trip_status: ["draft", "open", "closed", "completed"],
      trip_type: ["retiro", "ceremonia"],
    },
  },
} as const
