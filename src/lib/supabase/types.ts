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
      admin_notifications: {
        Row: {
          application_id: string | null
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: Database["public"]["Enums"]["admin_notification_kind"]
          read_at: string | null
          read_by: string | null
          title: string
          trip_id: string | null
        }
        Insert: {
          application_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: Database["public"]["Enums"]["admin_notification_kind"]
          read_at?: string | null
          read_by?: string | null
          title: string
          trip_id?: string | null
        }
        Update: {
          application_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["admin_notification_kind"]
          read_at?: string | null
          read_by?: string | null
          title?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "my_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          comment: string | null
          created_at: string
          current_medication: boolean
          current_medication_detail: string | null
          email: string
          full_name: string
          id: string
          mental_health_treatment: boolean
          mental_health_treatment_detail: string | null
          paid_at: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string | null
          previous_ceremonies: number
          reviewed_at: string | null
          reviewed_by: string | null
          serious_illness: boolean
          serious_illness_detail: string | null
          status: Database["public"]["Enums"]["application_status"]
          theme: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          current_medication: boolean
          current_medication_detail?: string | null
          email: string
          full_name: string
          id?: string
          mental_health_treatment: boolean
          mental_health_treatment_detail?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          previous_ceremonies?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          serious_illness: boolean
          serious_illness_detail?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          theme?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          current_medication?: boolean
          current_medication_detail?: string | null
          email?: string
          full_name?: string
          id?: string
          mental_health_treatment?: boolean
          mental_health_treatment_detail?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          previous_ceremonies?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          serious_illness?: boolean
          serious_illness_detail?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          theme?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["article_category"]
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["article_category"]
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["article_category"]
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          application_id: string
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
          application_id: string
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
          application_id?: string
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
            foreignKeyName: "consents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "my_applications"
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
      health_form_first_time: {
        Row: {
          age: number
          allergies: boolean
          allergies_detail: string | null
          application_id: string
          comment: string | null
          country: string
          created_at: string
          fears: boolean
          fears_detail: string | null
          first_time_plants: boolean
          has_themes: boolean
          health_condition: boolean
          health_condition_detail: string | null
          height: string
          id: string
          occupation: string
          plants_detail: string | null
          spiritual_practice: boolean
          spiritual_practice_detail: string | null
          stress_anxiety: boolean
          stress_anxiety_detail: string | null
          substance_use: boolean
          substance_use_detail: string | null
          themes_detail: string | null
          trauma: boolean
          trauma_detail: string | null
          weight: string
        }
        Insert: {
          age: number
          allergies: boolean
          allergies_detail?: string | null
          application_id: string
          comment?: string | null
          country: string
          created_at?: string
          fears: boolean
          fears_detail?: string | null
          first_time_plants: boolean
          has_themes: boolean
          health_condition: boolean
          health_condition_detail?: string | null
          height: string
          id?: string
          occupation: string
          plants_detail?: string | null
          spiritual_practice: boolean
          spiritual_practice_detail?: string | null
          stress_anxiety: boolean
          stress_anxiety_detail?: string | null
          substance_use: boolean
          substance_use_detail?: string | null
          themes_detail?: string | null
          trauma: boolean
          trauma_detail?: string | null
          weight: string
        }
        Update: {
          age?: number
          allergies?: boolean
          allergies_detail?: string | null
          application_id?: string
          comment?: string | null
          country?: string
          created_at?: string
          fears?: boolean
          fears_detail?: string | null
          first_time_plants?: boolean
          has_themes?: boolean
          health_condition?: boolean
          health_condition_detail?: string | null
          height?: string
          id?: string
          occupation?: string
          plants_detail?: string | null
          spiritual_practice?: boolean
          spiritual_practice_detail?: string | null
          stress_anxiety?: boolean
          stress_anxiety_detail?: string | null
          substance_use?: boolean
          substance_use_detail?: string | null
          themes_detail?: string | null
          trauma?: boolean
          trauma_detail?: string | null
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_form_first_time_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_form_first_time_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "my_applications"
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
      payment_methods: {
        Row: {
          audience: string | null
          currency: string | null
          id: string
          instructions: string
          is_active: boolean
          label: string
          link_url: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience?: string | null
          currency?: string | null
          id?: string
          instructions: string
          is_active?: boolean
          label: string
          link_url?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: string | null
          currency?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          label?: string
          link_url?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          application_id: string
          created_at: string
          id: string
          note: string | null
          storage_path: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          note?: string | null
          storage_path: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          note?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "my_applications"
            referencedColumns: ["id"]
          },
        ]
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
      testimonials: {
        Row: {
          author_location: string | null
          author_name: string
          created_at: string
          id: string
          is_published: boolean
          placement: Database["public"]["Enums"]["testimonial_placement"]
          quote: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_location?: string | null
          author_name: string
          created_at?: string
          id?: string
          is_published?: boolean
          placement: Database["public"]["Enums"]["testimonial_placement"]
          quote: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_location?: string | null
          author_name?: string
          created_at?: string
          id?: string
          is_published?: boolean
          placement?: Database["public"]["Enums"]["testimonial_placement"]
          quote?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
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
      my_applications: {
        Row: {
          consent_submitted: boolean | null
          created_at: string | null
          health_form_submitted: boolean | null
          id: string | null
          is_first_time: boolean | null
          payment_proof_at: string | null
          payment_proof_submitted: boolean | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          trip_id: string | null
        }
        Insert: {
          consent_submitted?: never
          created_at?: string | null
          health_form_submitted?: never
          id?: string | null
          is_first_time?: never
          payment_proof_at?: never
          payment_proof_submitted?: never
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          trip_id?: string | null
        }
        Update: {
          consent_submitted?: never
          created_at?: string | null
          health_form_submitted?: never
          id?: string | null
          is_first_time?: never
          payment_proof_at?: never
          payment_proof_submitted?: never
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_trip_id_fkey"
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
      admin_notification_kind:
        | "application_new"
        | "application_health_flag"
        | "email_failed"
        | "payment_proof"
      application_status: "pending_review" | "approved" | "rejected" | "expired"
      article_category: "biblioteca" | "ciencia" | "testimonios"
      article_status: "draft" | "published"
      payment_status: "pending" | "paid" | "waived"
      testimonial_placement: "home" | "sesiones" | "viajes"
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
      admin_notification_kind: [
        "application_new",
        "application_health_flag",
        "email_failed",
        "payment_proof",
      ],
      application_status: ["pending_review", "approved", "rejected", "expired"],
      article_category: ["biblioteca", "ciencia", "testimonios"],
      article_status: ["draft", "published"],
      trip_status: ["draft", "open", "closed", "completed"],
      trip_type: ["retiro", "ceremonia"],
    },
  },
} as const
