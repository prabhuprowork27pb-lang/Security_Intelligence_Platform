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
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          meta: Json
          path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          meta?: Json
          path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          meta?: Json
          path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      assessments: {
        Row: {
          created_at: string | null
          created_by_name: string
          created_by_role: string
          executive_summary: string | null
          id: string
          overall_maturity_1_5: number | null
          overall_score_0_100: number | null
          paid: boolean
          remediation_plan: string | null
          report_approved_at: string | null
          report_approved_by: string | null
          report_email_attempts: number
          report_error: string | null
          report_generated_at: string | null
          report_history: Json
          report_pdf_path: string | null
          report_ready_at: string | null
          report_sent_at: string | null
          report_status: string
          report_version: number
          review_status: string
          reviewed_by_name: string | null
          reviewed_by_role: string | null
          risk_posture: string | null
          site_id: string
          status: string | null
          submitted_at: string | null
          user_id: string | null
          validated_report_error: string | null
          validated_report_generated_by: string | null
          validated_report_payload: Json | null
          validated_report_ready_at: string | null
          validated_report_status: string
          validated_reviewer_name: string | null
          validated_share_expires_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by_name: string
          created_by_role: string
          executive_summary?: string | null
          id?: string
          overall_maturity_1_5?: number | null
          overall_score_0_100?: number | null
          paid?: boolean
          remediation_plan?: string | null
          report_approved_at?: string | null
          report_approved_by?: string | null
          report_email_attempts?: number
          report_error?: string | null
          report_generated_at?: string | null
          report_history?: Json
          report_pdf_path?: string | null
          report_ready_at?: string | null
          report_sent_at?: string | null
          report_status?: string
          report_version?: number
          review_status?: string
          reviewed_by_name?: string | null
          reviewed_by_role?: string | null
          risk_posture?: string | null
          site_id: string
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
          validated_report_error?: string | null
          validated_report_generated_by?: string | null
          validated_report_payload?: Json | null
          validated_report_ready_at?: string | null
          validated_report_status?: string
          validated_reviewer_name?: string | null
          validated_share_expires_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by_name?: string
          created_by_role?: string
          executive_summary?: string | null
          id?: string
          overall_maturity_1_5?: number | null
          overall_score_0_100?: number | null
          paid?: boolean
          remediation_plan?: string | null
          report_approved_at?: string | null
          report_approved_by?: string | null
          report_email_attempts?: number
          report_error?: string | null
          report_generated_at?: string | null
          report_history?: Json
          report_pdf_path?: string | null
          report_ready_at?: string | null
          report_sent_at?: string | null
          report_status?: string
          report_version?: number
          review_status?: string
          reviewed_by_name?: string | null
          reviewed_by_role?: string | null
          risk_posture?: string | null
          site_id?: string
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
          validated_report_error?: string | null
          validated_report_generated_by?: string | null
          validated_report_payload?: Json | null
          validated_report_ready_at?: string | null
          validated_report_status?: string
          validated_reviewer_name?: string | null
          validated_share_expires_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_scores: {
        Row: {
          assessment_id: string
          commentary: string | null
          domain_key: string
          domain_name: string
          id: string
          maturity_1_5: number | null
          score_0_100: number | null
          score_raw_0_4: number | null
        }
        Insert: {
          assessment_id: string
          commentary?: string | null
          domain_key: string
          domain_name: string
          id?: string
          maturity_1_5?: number | null
          score_0_100?: number | null
          score_raw_0_4?: number | null
        }
        Update: {
          assessment_id?: string
          commentary?: string | null
          domain_key?: string
          domain_name?: string
          id?: string
          maturity_1_5?: number | null
          score_0_100?: number | null
          score_raw_0_4?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      dslr_leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          organisation_id: string | null
          phone: string | null
          role: string
          site_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          organisation_id?: string | null
          phone?: string | null
          role: string
          site_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          organisation_id?: string | null
          phone?: string | null
          role?: string
          site_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dslr_leads_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dslr_leads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      intelligence_pulse_subscribers: {
        Row: {
          channel: string
          created_at: string
          email: string | null
          id: string
          name: string | null
          organisation: string | null
          phone: string | null
          role: string | null
          source: string | null
          status: string
        }
        Insert: {
          channel?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          organisation?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          organisation?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          industry: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_inr: number
          assessment_id: string | null
          created_at: string
          currency: string
          id: string
          provider: string
          provider_ref: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          assessment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          assessment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_smarty_answers: {
        Row: {
          answer: string
          assessment_id: string
          created_at: string
          domain_key: string | null
          domain_name: string | null
          id: string
          question: string
        }
        Insert: {
          answer: string
          assessment_id: string
          created_at?: string
          domain_key?: string | null
          domain_name?: string | null
          id?: string
          question: string
        }
        Update: {
          answer?: string
          assessment_id?: string
          created_at?: string
          domain_key?: string | null
          domain_name?: string | null
          id?: string
          question?: string
        }
        Relationships: []
      }
      profile_change_log: {
        Row: {
          actor: string
          created_at: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          actor?: string
          created_at?: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          actor?: string
          created_at?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          company_locked_at: string | null
          created_at: string
          designation: string | null
          designation_locked_at: string | null
          email: string
          full_name: string
          industry_other: string | null
          mobile: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          company?: string | null
          company_locked_at?: string | null
          created_at?: string
          designation?: string | null
          designation_locked_at?: string | null
          email: string
          full_name: string
          industry_other?: string | null
          mobile?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          company?: string | null
          company_locked_at?: string | null
          created_at?: string
          designation?: string | null
          designation_locked_at?: string | null
          email?: string
          full_name?: string
          industry_other?: string | null
          mobile?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      pulse_deliveries: {
        Row: {
          channel: string
          created_at: string
          edition_id: string
          error: string | null
          id: string
          provider_ref: string | null
          recipient_count: number
          sent_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          edition_id: string
          error?: string | null
          id?: string
          provider_ref?: string | null
          recipient_count?: number
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          edition_id?: string
          error?: string | null
          id?: string
          provider_ref?: string | null
          recipient_count?: number
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_deliveries_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "pulse_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_edition_items: {
        Row: {
          created_at: string
          edition_id: string
          id: string
          position: number
          raw_item_id: string
          section_key: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          id?: string
          position?: number
          raw_item_id: string
          section_key: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          id?: string
          position?: number
          raw_item_id?: string
          section_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_edition_items_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "pulse_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_edition_items_raw_item_id_fkey"
            columns: ["raw_item_id"]
            isOneToOne: false
            referencedRelation: "pulse_raw_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_editions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archived: boolean
          created_at: string
          edition_date: string
          featured_until: string | null
          id: string
          issue_number: number
          sections: Json
          sent_at: string | null
          status: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archived?: boolean
          created_at?: string
          edition_date: string
          featured_until?: string | null
          id?: string
          issue_number: number
          sections?: Json
          sent_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archived?: boolean
          created_at?: string
          edition_date?: string
          featured_until?: string | null
          id?: string
          issue_number?: number
          sections?: Json
          sent_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pulse_raw_items: {
        Row: {
          ai_tagged_at: string | null
          ai_tags: Json
          created_at: string
          external_id: string
          fetched_at: string
          id: string
          language: string | null
          published_at: string | null
          source_id: string
          status: string
          summary: string | null
          title: string
          url: string
        }
        Insert: {
          ai_tagged_at?: string | null
          ai_tags?: Json
          created_at?: string
          external_id: string
          fetched_at?: string
          id?: string
          language?: string | null
          published_at?: string | null
          source_id: string
          status?: string
          summary?: string | null
          title: string
          url: string
        }
        Update: {
          ai_tagged_at?: string | null
          ai_tags?: Json
          created_at?: string
          external_id?: string
          fetched_at?: string
          id?: string
          language?: string | null
          published_at?: string | null
          source_id?: string
          status?: string
          summary?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_raw_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "pulse_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_sources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          last_error: string | null
          last_fetched_at: string | null
          name: string
          notes: string | null
          region: string
          sector: string[]
          updated_at: string
          url: string
          weight: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          last_fetched_at?: string | null
          name: string
          notes?: string | null
          region?: string
          sector?: string[]
          updated_at?: string
          url: string
          weight?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          last_fetched_at?: string | null
          name?: string
          notes?: string | null
          region?: string
          sector?: string[]
          updated_at?: string
          url?: string
          weight?: number
        }
        Relationships: []
      }
      question_responses: {
        Row: {
          assessment_id: string
          assessor_comment: string | null
          comment: string | null
          created_at: string | null
          domain_key: string
          evidence_note: string | null
          id: string
          question_code: string
          question_text: string
          rating_0_4: number
        }
        Insert: {
          assessment_id: string
          assessor_comment?: string | null
          comment?: string | null
          created_at?: string | null
          domain_key: string
          evidence_note?: string | null
          id?: string
          question_code: string
          question_text: string
          rating_0_4: number
        }
        Update: {
          assessment_id?: string
          assessor_comment?: string | null
          comment?: string | null
          created_at?: string | null
          domain_key?: string
          evidence_note?: string | null
          id?: string
          question_code?: string
          question_text?: string
          rating_0_4?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      report_audit_log: {
        Row: {
          action: string
          actor_label: string | null
          actor_user_id: string | null
          assessment_id: string
          created_at: string
          id: string
          metadata: Json
          report_version: number | null
        }
        Insert: {
          action: string
          actor_label?: string | null
          actor_user_id?: string | null
          assessment_id: string
          created_at?: string
          id?: string
          metadata?: Json
          report_version?: number | null
        }
        Update: {
          action?: string
          actor_label?: string | null
          actor_user_id?: string | null
          assessment_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          report_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_audit_log_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          city: string
          country: string | null
          created_at: string | null
          criticality: string | null
          headcount_band: string | null
          id: string
          name: string
          organisation_id: string | null
          site_type: string | null
          site_type_other: string | null
          state: string | null
          user_id: string | null
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string | null
          criticality?: string | null
          headcount_band?: string | null
          id?: string
          name: string
          organisation_id?: string | null
          site_type?: string | null
          site_type_other?: string | null
          state?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string | null
          criticality?: string | null
          headcount_band?: string | null
          id?: string
          name?: string
          organisation_id?: string | null
          site_type?: string | null
          site_type_other?: string | null
          state?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      admin_platform_kpis: {
        Args: { _from?: string; _to?: string }
        Returns: Json
      }
      can_user_start_assessment: {
        Args: { _site_id: string; _user_id: string }
        Returns: Json
      }
      current_user_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      pulse_rotate_expired: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "client" | "guest" | "beta_tester"
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
      app_role: ["admin", "client", "guest", "beta_tester"],
    },
  },
} as const
