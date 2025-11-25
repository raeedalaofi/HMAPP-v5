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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          reported_job_id: string | null
          reported_review_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reported_job_id?: string | null
          reported_review_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reported_job_id?: string | null
          reported_review_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_reported_job_id_fkey"
            columns: ["reported_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          permissions: Json | null
          profile_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          permissions?: Json | null
          profile_id?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          permissions?: Json | null
          profile_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active_technicians: number
          address: string | null
          bank_account: string | null
          bank_name: string | null
          batch_size: number
          city: string | null
          commercial_register: string | null
          commission_rate: number
          completed_jobs: number
          cover_url: string | null
          cr_document_url: string | null
          cr_verified: boolean
          created_at: string
          description: string | null
          email: string | null
          iban: string | null
          id: string
          is_featured: boolean
          location: unknown
          logo_url: string | null
          name: string
          name_en: string | null
          owner_id: string
          phone: string | null
          profile_id: string | null
          rating: number
          status: Database["public"]["Enums"]["company_status"]
          tax_number: string | null
          total_jobs: number
          total_revenue: number
          total_reviews: number
          total_technicians: number
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          active_technicians?: number
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          batch_size?: number
          city?: string | null
          commercial_register?: string | null
          commission_rate?: number
          completed_jobs?: number
          cover_url?: string | null
          cr_document_url?: string | null
          cr_verified?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          is_featured?: boolean
          location?: unknown
          logo_url?: string | null
          name: string
          name_en?: string | null
          owner_id: string
          phone?: string | null
          profile_id?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["company_status"]
          tax_number?: string | null
          total_jobs?: number
          total_revenue?: number
          total_reviews?: number
          total_technicians?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          active_technicians?: number
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          batch_size?: number
          city?: string | null
          commercial_register?: string | null
          commission_rate?: number
          completed_jobs?: number
          cover_url?: string | null
          cr_document_url?: string | null
          cr_verified?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          is_featured?: boolean
          location?: unknown
          logo_url?: string | null
          name?: string
          name_en?: string | null
          owner_id?: string
          phone?: string | null
          profile_id?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["company_status"]
          tax_number?: string | null
          total_jobs?: number
          total_revenue?: number
          total_reviews?: number
          total_technicians?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_batches: {
        Row: {
          batch_number: string | null
          can_withdraw: boolean | null
          company_id: string
          company_share: number
          completed_at: string | null
          created_at: string
          id: string
          jobs_completed: number
          platform_fee: number
          status: Database["public"]["Enums"]["batch_status"]
          target_jobs: number
          technician_id: string
          total_revenue: number
          withdrawal_ref: string | null
          withdrawn_at: string | null
          withdrawn_by: string | null
        }
        Insert: {
          batch_number?: string | null
          can_withdraw?: boolean | null
          company_id: string
          company_share?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          jobs_completed?: number
          platform_fee?: number
          status?: Database["public"]["Enums"]["batch_status"]
          target_jobs: number
          technician_id: string
          total_revenue?: number
          withdrawal_ref?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          batch_number?: string | null
          can_withdraw?: boolean | null
          company_id?: string
          company_share?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          jobs_completed?: number
          platform_fee?: number
          status?: Database["public"]["Enums"]["batch_status"]
          target_jobs?: number
          technician_id?: string
          total_revenue?: number
          withdrawal_ref?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_batches_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          apartment_number: string | null
          building_number: string | null
          city: string
          created_at: string
          customer_id: string
          district: string | null
          floor_number: string | null
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          landmark: string | null
          location: unknown
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          apartment_number?: string | null
          building_number?: string | null
          city: string
          created_at?: string
          customer_id: string
          district?: string | null
          floor_number?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          landmark?: string | null
          location?: unknown
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          apartment_number?: string | null
          building_number?: string | null
          city?: string
          created_at?: string
          customer_id?: string
          district?: string | null
          floor_number?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          landmark?: string | null
          location?: unknown
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reviews: {
        Row: {
          comment: string | null
          communication_rating: number | null
          created_at: string
          customer_id: string
          id: string
          is_visible: boolean
          job_id: string
          location_accuracy_rating: number | null
          payment_rating: number | null
          rating: number
          technician_id: string
        }
        Insert: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          customer_id: string
          id?: string
          is_visible?: boolean
          job_id: string
          location_accuracy_rating?: number | null
          payment_rating?: number | null
          rating: number
          technician_id: string
        }
        Update: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          is_visible?: boolean
          job_id?: string
          location_accuracy_rating?: number | null
          payment_rating?: number | null
          rating?: number
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          blocked_at: string | null
          blocked_reason: string | null
          cancelled_jobs: number
          completed_jobs: number
          created_at: string
          id: string
          is_active: boolean
          is_blocked: boolean
          profile_id: string
          rating: number
          total_jobs: number
          total_reviews: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_reason?: string | null
          cancelled_jobs?: number
          completed_jobs?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          profile_id: string
          rating?: number
          total_jobs?: number
          total_reviews?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_reason?: string | null
          cancelled_jobs?: number
          completed_jobs?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          profile_id?: string
          rating?: number
          total_jobs?: number
          total_reviews?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          created_at: string
          event_type: string
          id: number
          ip_address: unknown
          payload: Json | null
          resource_id: string | null
          resource_type: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: number
          ip_address?: unknown
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: number
          ip_address?: unknown
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          job_id: string
          photo_type: string
          thumbnail_url: string | null
          uploaded_by: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id: string
          photo_type?: string
          thumbnail_url?: string | null
          uploaded_by: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string
          photo_type?: string
          thumbnail_url?: string | null
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reviews: {
        Row: {
          behavior_rating: number | null
          comment: string | null
          created_at: string
          customer_id: string
          flag_reason: string | null
          id: string
          is_flagged: boolean
          is_visible: boolean
          job_id: string
          photos: string[] | null
          price_rating: number | null
          quality_rating: number | null
          rating: number
          response: string | null
          response_at: string | null
          technician_id: string
          timing_rating: number | null
          updated_at: string
        }
        Insert: {
          behavior_rating?: number | null
          comment?: string | null
          created_at?: string
          customer_id: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          is_visible?: boolean
          job_id: string
          photos?: string[] | null
          price_rating?: number | null
          quality_rating?: number | null
          rating: number
          response?: string | null
          response_at?: string | null
          technician_id: string
          timing_rating?: number | null
          updated_at?: string
        }
        Update: {
          behavior_rating?: number | null
          comment?: string | null
          created_at?: string
          customer_id?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          is_visible?: boolean
          job_id?: string
          photos?: string[] | null
          price_rating?: number | null
          quality_rating?: number | null
          rating?: number
          response?: string | null
          response_at?: string | null
          technician_id?: string
          timing_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reviews_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address_id: string
          amount_paid: number | null
          amount_to_pay: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          category_id: number
          company_id: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          description: string | null
          estimated_price_max: number | null
          estimated_price_min: number | null
          final_price: number | null
          id: string
          job_address: string | null
          job_city: string | null
          job_location: unknown
          job_number: string | null
          offer_window_expires_at: string | null
          offers_count: number
          payment_expires_at: string | null
          platform_fee: number | null
          preferred_date: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          reward_discount: number | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          technician_id: string | null
          title: string
          updated_at: string
          urgency_level: number | null
        }
        Insert: {
          address_id: string
          amount_paid?: number | null
          amount_to_pay?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id: number
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          estimated_price_max?: number | null
          estimated_price_min?: number | null
          final_price?: number | null
          id?: string
          job_address?: string | null
          job_city?: string | null
          job_location?: unknown
          job_number?: string | null
          offer_window_expires_at?: string | null
          offers_count?: number
          payment_expires_at?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          reward_discount?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          technician_id?: string | null
          title: string
          updated_at?: string
          urgency_level?: number | null
        }
        Update: {
          address_id?: string
          amount_paid?: number | null
          amount_to_pay?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          category_id?: number
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          estimated_price_max?: number | null
          estimated_price_min?: number | null
          final_price?: number | null
          id?: string
          job_address?: string | null
          job_city?: string | null
          job_location?: unknown
          job_number?: string | null
          offer_window_expires_at?: string | null
          offers_count?: number
          payment_expires_at?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          reward_discount?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          technician_id?: string | null
          title?: string
          updated_at?: string
          urgency_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          job_id: string
          media_url: string | null
          message_type: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          job_id: string
          media_url?: string | null
          message_type?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          job_id?: string
          media_url?: string | null
          message_type?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean
          is_sent: boolean
          read_at: string | null
          recipient_id: string
          send_error: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_sent?: boolean
          read_at?: string | null
          recipient_id: string
          send_error?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_sent?: boolean
          read_at?: string | null
          recipient_id?: string
          send_error?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          gateway_response: Json | null
          id: string
          job_id: string
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_url: string | null
          platform_fee: number
          reward_discount: number
          status: Database["public"]["Enums"]["payment_link_status"]
          subtotal: number
          technician_id: string
          token: string | null
          total: number
          vat_amount: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          gateway_response?: Json | null
          id?: string
          job_id: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_url?: string | null
          platform_fee?: number
          reward_discount?: number
          status?: Database["public"]["Enums"]["payment_link_status"]
          subtotal: number
          technician_id: string
          token?: string | null
          total: number
          vat_amount?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          gateway_response?: Json | null
          id?: string
          job_id?: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_url?: string | null
          platform_fee?: number
          reward_discount?: number
          status?: Database["public"]["Enums"]["payment_link_status"]
          subtotal?: number
          technician_id?: string
          token?: string | null
          total?: number
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      price_offers: {
        Row: {
          amount: number
          breakdown: Json | null
          created_at: string
          decided_at: string | null
          estimated_duration_minutes: number | null
          expires_at: string | null
          id: string
          job_id: string
          message: string | null
          status: Database["public"]["Enums"]["offer_status"]
          technician_id: string
        }
        Insert: {
          amount: number
          breakdown?: Json | null
          created_at?: string
          decided_at?: string | null
          estimated_duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          job_id: string
          message?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          technician_id: string
        }
        Update: {
          amount?: number
          breakdown?: Json | null
          created_at?: string
          decided_at?: string | null
          estimated_duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          job_id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applicable_categories: number[] | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string
          id: string
          is_active: boolean
          max_discount: number | null
          min_order: number | null
          name: string
          per_user_limit: number | null
          starts_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          applicable_categories?: number[] | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          ends_at: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order?: number | null
          name: string
          per_user_limit?: number | null
          starts_at: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          applicable_categories?: number[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order?: number | null
          name?: string
          per_user_limit?: number | null
          starts_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      service_areas: {
        Row: {
          area_name: string
          center_point: unknown
          city: string
          company_id: string | null
          created_at: string
          district: string | null
          id: string
          is_active: boolean
          polygon: unknown
          radius_km: number | null
          technician_id: string | null
        }
        Insert: {
          area_name: string
          center_point?: unknown
          city: string
          company_id?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          polygon?: unknown
          radius_km?: number | null
          technician_id?: string | null
        }
        Update: {
          area_name?: string
          center_point?: unknown
          city?: string
          company_id?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          polygon?: unknown
          radius_km?: number | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_areas_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: number
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          name_en: string | null
          parent_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          name_en?: string | null
          parent_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          name_en?: string | null
          parent_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      technician_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          technician_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          technician_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_availability_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_skills: {
        Row: {
          category_id: number
          created_at: string
          id: string
          is_verified: boolean
          proficiency: number | null
          technician_id: string
          verified_at: string | null
          years_experience: number | null
        }
        Insert: {
          category_id: number
          created_at?: string
          id?: string
          is_verified?: boolean
          proficiency?: number | null
          technician_id: string
          verified_at?: string | null
          years_experience?: number | null
        }
        Update: {
          category_id?: number
          created_at?: string
          id?: string
          is_verified?: boolean
          proficiency?: number | null
          technician_id?: string
          verified_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          company_id: string
          created_at: string
          current_location: unknown
          employee_number: string | null
          experience_years: number | null
          id: string
          is_available: boolean
          is_online: boolean
          jobs_cancelled: number
          jobs_done: number
          license_document_url: string | null
          license_expiry: string | null
          license_number: string | null
          location_updated_at: string | null
          profile_id: string
          rating: number
          service_radius_km: number
          specialization: string | null
          status: Database["public"]["Enums"]["technician_status"]
          total_earnings: number
          total_reviews: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          company_id: string
          created_at?: string
          current_location?: unknown
          employee_number?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          jobs_cancelled?: number
          jobs_done?: number
          license_document_url?: string | null
          license_expiry?: string | null
          license_number?: string | null
          location_updated_at?: string | null
          profile_id: string
          rating?: number
          service_radius_km?: number
          specialization?: string | null
          status?: Database["public"]["Enums"]["technician_status"]
          total_earnings?: number
          total_reviews?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          company_id?: string
          created_at?: string
          current_location?: unknown
          employee_number?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          jobs_cancelled?: number
          jobs_done?: number
          license_document_url?: string | null
          license_expiry?: string | null
          license_number?: string | null
          location_updated_at?: string | null
          profile_id?: string
          rating?: number
          service_radius_km?: number
          specialization?: string | null
          status?: Database["public"]["Enums"]["technician_status"]
          total_earnings?: number
          total_reviews?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technicians_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technicians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          app_version: string | null
          created_at: string
          device_model: string | null
          device_name: string | null
          device_token: string
          id: string
          is_active: boolean
          last_used_at: string
          os_version: string | null
          platform: Database["public"]["Enums"]["device_platform"]
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          device_name?: string | null
          device_token: string
          id?: string
          is_active?: boolean
          last_used_at?: string
          os_version?: string | null
          platform: Database["public"]["Enums"]["device_platform"]
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          device_name?: string | null
          device_token?: string
          id?: string
          is_active?: boolean
          last_used_at?: string
          os_version?: string | null
          platform?: Database["public"]["Enums"]["device_platform"]
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          default_location: unknown
          district: string | null
          email: string | null
          email_verified: boolean
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          identity_number: string | null
          identity_verified_at: string | null
          is_active: boolean
          language: string
          last_active_at: string | null
          notification_settings: Json | null
          phone: string | null
          phone_verified: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          default_location?: unknown
          district?: string | null
          email?: string | null
          email_verified?: boolean
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          identity_number?: string | null
          identity_verified_at?: string | null
          is_active?: boolean
          language?: string
          last_active_at?: string | null
          notification_settings?: Json | null
          phone?: string | null
          phone_verified?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          default_location?: unknown
          district?: string | null
          email?: string | null
          email_verified?: boolean
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          identity_number?: string | null
          identity_verified_at?: string | null
          is_active?: boolean
          language?: string
          last_active_at?: string | null
          notification_settings?: Json | null
          phone?: string | null
          phone_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          purpose: string
          target: string
          target_type: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          max_attempts?: number
          purpose?: string
          target: string
          target_type: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          purpose?: string
          target?: string
          target_type?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          batch_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          direction: string
          id: number
          job_id: string | null
          metadata: Json | null
          reference: string | null
          status: string
          tx_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction: string
          id?: number
          job_id?: string | null
          metadata?: Json | null
          reference?: string | null
          status?: string
          tx_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction?: string
          id?: number
          job_id?: string | null
          metadata?: Json | null
          reference?: string | null
          status?: string
          tx_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "company_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          owner_id: string
          owner_type: string
          pending_balance: number
          total_earned: number
          total_spent: number
          total_withdrawn: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          owner_id: string
          owner_type: string
          pending_balance?: number
          total_earned?: number
          total_spent?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          owner_type?: string
          pending_balance?: number
          total_earned?: number
          total_spent?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_offer: {
        Args: { p_offer_id: string; p_user_id: string }
        Returns: Json
      }
      activate_technician: {
        Args: { p_technician_id: string; p_user_id: string }
        Returns: Json
      }
      add_customer_address: {
        Args: {
          p_address_line1: string
          p_apartment_number?: string
          p_building_number?: string
          p_city: string
          p_district?: string
          p_floor_number?: string
          p_is_default?: boolean
          p_label: string
          p_landmark?: string
          p_latitude?: number
          p_longitude?: number
          p_user_id: string
        }
        Returns: Json
      }
      add_technician_skill: {
        Args: {
          p_category_id: number
          p_user_id: string
          p_years_experience?: number
        }
        Returns: Json
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      cancel_job: {
        Args: { p_job_id: string; p_reason?: string; p_user_id: string }
        Returns: Json
      }
      complete_job: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: Json
      }
      confirm_payment: {
        Args: {
          p_gateway_response?: Json
          p_payment_method: string
          p_payment_reference: string
          p_payment_token: string
        }
        Returns: Json
      }
      create_job: {
        Args: {
          p_address_id: string
          p_auto_publish?: boolean
          p_category_id: number
          p_description?: string
          p_photo_urls?: string[]
          p_preferred_date?: string
          p_preferred_time_end?: string
          p_preferred_time_start?: string
          p_title: string
          p_urgency_level?: number
          p_user_id: string
        }
        Returns: Json
      }
      delete_all_notifications: { Args: { p_user_id: string }; Returns: Json }
      delete_customer_address: {
        Args: { p_address_id: string; p_user_id: string }
        Returns: Json
      }
      delete_notification: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: Json
      }
      disablelongtransactions: { Args: never; Returns: string }
      distance_km: {
        Args: { p_point1: unknown; p_point2: unknown }
        Returns: number
      }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      find_nearby_technicians: {
        Args: {
          p_category_id?: number
          p_latitude: number
          p_limit?: number
          p_longitude: number
          p_radius_km?: number
        }
        Returns: {
          avatar_url: string
          company_id: string
          company_logo: string
          company_name: string
          distance_km: number
          full_name: string
          is_available: boolean
          jobs_done: number
          phone: string
          rating: number
          specialization: string
          technician_id: string
          total_reviews: number
          user_id: string
        }[]
      }
      generate_batch_number: { Args: never; Returns: string }
      generate_job_number: { Args: never; Returns: string }
      generate_tx_reference: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_batch: { Args: { p_technician_id: string }; Returns: string }
      get_available_jobs: {
        Args: {
          p_category_id?: number
          p_latitude?: number
          p_limit?: number
          p_longitude?: number
          p_radius_km?: number
          p_user_id: string
        }
        Returns: Json
      }
      get_company_id: { Args: { p_user_id?: string }; Returns: string }
      get_company_jobs: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["job_status"]
          p_technician_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_company_stats: { Args: { p_user_id: string }; Returns: Json }
      get_company_technicians: {
        Args: {
          p_status?: Database["public"]["Enums"]["technician_status"]
          p_user_id: string
        }
        Returns: Json
      }
      get_customer_addresses: { Args: { p_user_id: string }; Returns: Json }
      get_customer_id: { Args: { p_user_id?: string }; Returns: string }
      get_customer_reviews: {
        Args: { p_customer_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_full_profile: { Args: { p_user_id: string }; Returns: Json }
      get_job_details: { Args: { p_job_id: string }; Returns: Json }
      get_job_messages: {
        Args: {
          p_before_id?: string
          p_job_id: string
          p_limit?: number
          p_user_id: string
        }
        Returns: Json
      }
      get_my_jobs_as_customer: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["job_status"]
          p_user_id: string
        }
        Returns: Json
      }
      get_my_jobs_as_technician: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["job_status"]
          p_user_id: string
        }
        Returns: Json
      }
      get_my_offers: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["offer_status"]
          p_user_id: string
        }
        Returns: Json
      }
      get_notifications: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_unread_only?: boolean
          p_user_id: string
        }
        Returns: Json
      }
      get_service_categories: {
        Args: { p_include_inactive?: boolean; p_parent_id?: number }
        Returns: Json
      }
      get_technician_id: { Args: { p_user_id?: string }; Returns: string }
      get_technician_reviews: {
        Args: { p_limit?: number; p_offset?: number; p_technician_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: { p_user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      gettransactionid: { Args: never; Returns: unknown }
      is_admin: { Args: never; Returns: boolean }
      is_company_manager: { Args: { p_company_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      make_point: {
        Args: { p_latitude: number; p_longitude: number }
        Returns: unknown
      }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[]; p_user_id: string }
        Returns: Json
      }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      publish_job: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: Json
      }
      reactivate_technician: {
        Args: { p_technician_id: string; p_user_id: string }
        Returns: Json
      }
      register_company: {
        Args: {
          p_city?: string
          p_commercial_register?: string
          p_company_name: string
          p_email?: string
          p_owner_name: string
          p_phone: string
          p_user_id: string
        }
        Returns: Json
      }
      register_customer: {
        Args: {
          p_email?: string
          p_full_name: string
          p_phone?: string
          p_user_id: string
        }
        Returns: Json
      }
      register_device: {
        Args: {
          p_app_version?: string
          p_device_model?: string
          p_device_name?: string
          p_device_token: string
          p_platform: Database["public"]["Enums"]["device_platform"]
          p_user_id: string
        }
        Returns: Json
      }
      register_technician: {
        Args: {
          p_company_id: string
          p_email?: string
          p_full_name: string
          p_phone: string
          p_specialization?: string
          p_user_id: string
        }
        Returns: Json
      }
      reject_offer: {
        Args: { p_offer_id: string; p_user_id: string }
        Returns: Json
      }
      respond_to_review: {
        Args: { p_response: string; p_review_id: string; p_user_id: string }
        Returns: Json
      }
      search_companies: {
        Args: {
          p_city?: string
          p_limit?: number
          p_min_rating?: number
          p_offset?: number
          p_search_term?: string
        }
        Returns: {
          active_technicians: number
          city: string
          company_id: string
          is_featured: boolean
          logo_url: string
          name: string
          rating: number
          total_jobs: number
          total_reviews: number
          total_technicians: number
        }[]
      }
      search_technicians: {
        Args: {
          p_category_id?: number
          p_city?: string
          p_limit?: number
          p_min_rating?: number
          p_offset?: number
          p_sort_by?: string
        }
        Returns: {
          avatar_url: string
          city: string
          company_name: string
          full_name: string
          is_available: boolean
          is_online: boolean
          jobs_done: number
          rating: number
          specialization: string
          technician_id: string
          total_reviews: number
        }[]
      }
      send_message: {
        Args: {
          p_body: string
          p_job_id: string
          p_media_url?: string
          p_message_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      send_verification_code: {
        Args: {
          p_purpose?: string
          p_target: string
          p_target_type: string
          p_user_id?: string
        }
        Returns: Json
      }
      set_technician_online_status: {
        Args: {
          p_is_available?: boolean
          p_is_online: boolean
          p_user_id: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      submit_customer_review: {
        Args: {
          p_comment?: string
          p_communication_rating?: number
          p_job_id: string
          p_location_accuracy_rating?: number
          p_payment_rating?: number
          p_rating: number
          p_user_id: string
        }
        Returns: Json
      }
      submit_offer: {
        Args: {
          p_amount: number
          p_estimated_duration_minutes?: number
          p_job_id: string
          p_message?: string
          p_user_id: string
        }
        Returns: Json
      }
      submit_technician_review: {
        Args: {
          p_behavior_rating?: number
          p_comment?: string
          p_job_id: string
          p_photos?: string[]
          p_price_rating?: number
          p_quality_rating?: number
          p_rating: number
          p_timing_rating?: number
          p_user_id: string
        }
        Returns: Json
      }
      suspend_technician: {
        Args: { p_reason?: string; p_technician_id: string; p_user_id: string }
        Returns: Json
      }
      unlockrows: { Args: { "": string }; Returns: number }
      unregister_device: {
        Args: { p_device_token: string; p_user_id: string }
        Returns: Json
      }
      update_customer_address: {
        Args: { p_address_id: string; p_data: Json; p_user_id: string }
        Returns: Json
      }
      update_profile: {
        Args: { p_data: Json; p_user_id: string }
        Returns: Json
      }
      update_technician_location: {
        Args: {
          p_is_available?: boolean
          p_is_online?: boolean
          p_latitude: number
          p_longitude: number
          p_user_id: string
        }
        Returns: Json
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      verify_code: {
        Args: { p_code: string; p_purpose?: string; p_target: string }
        Returns: Json
      }
      withdraw_batch: {
        Args: { p_batch_id: string; p_user_id: string }
        Returns: Json
      }
      withdraw_offer: {
        Args: { p_offer_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      batch_status: "active" | "ready" | "processing" | "completed"
      company_status:
        | "pending_verification"
        | "active"
        | "suspended"
        | "inactive"
      device_platform: "ios" | "android" | "web"
      gender_type: "male" | "female" | "not_specified"
      job_status:
        | "draft"
        | "waiting_for_offers"
        | "offers_expired"
        | "assigned"
        | "payment_pending"
        | "payment_expired"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      notification_type:
        | "new_job_nearby"
        | "offer_received"
        | "offer_accepted"
        | "offer_rejected"
        | "payment_received"
        | "job_started"
        | "job_completed"
        | "new_review"
        | "review_response"
        | "system_alert"
        | "promotion"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "withdrawn"
      payment_link_status:
        | "pending"
        | "paid"
        | "expired"
        | "cancelled"
        | "refunded"
      technician_status:
        | "pending_approval"
        | "active"
        | "suspended"
        | "inactive"
        | "banned"
      user_role:
        | "customer"
        | "technician"
        | "company_owner"
        | "admin"
        | "super_admin"
      verification_status:
        | "unverified"
        | "email_verified"
        | "phone_verified"
        | "fully_verified"
        | "identity_verified"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      batch_status: ["active", "ready", "processing", "completed"],
      company_status: [
        "pending_verification",
        "active",
        "suspended",
        "inactive",
      ],
      device_platform: ["ios", "android", "web"],
      gender_type: ["male", "female", "not_specified"],
      job_status: [
        "draft",
        "waiting_for_offers",
        "offers_expired",
        "assigned",
        "payment_pending",
        "payment_expired",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      notification_type: [
        "new_job_nearby",
        "offer_received",
        "offer_accepted",
        "offer_rejected",
        "payment_received",
        "job_started",
        "job_completed",
        "new_review",
        "review_response",
        "system_alert",
        "promotion",
      ],
      offer_status: ["pending", "accepted", "rejected", "expired", "withdrawn"],
      payment_link_status: [
        "pending",
        "paid",
        "expired",
        "cancelled",
        "refunded",
      ],
      technician_status: [
        "pending_approval",
        "active",
        "suspended",
        "inactive",
        "banned",
      ],
      user_role: [
        "customer",
        "technician",
        "company_owner",
        "admin",
        "super_admin",
      ],
      verification_status: [
        "unverified",
        "email_verified",
        "phone_verified",
        "fully_verified",
        "identity_verified",
      ],
    },
  },
} as const
