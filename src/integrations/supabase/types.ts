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
      activities: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_code: string | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_code?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_code?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      costing_items: {
        Row: {
          category: Database["public"]["Enums"]["cost_category"]
          costing_id: string
          created_at: string
          description: string
          id: string
          quantity: number
          total: number | null
          unit_cost: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["cost_category"]
          costing_id: string
          created_at?: string
          description: string
          id?: string
          quantity?: number
          total?: number | null
          unit_cost?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["cost_category"]
          costing_id?: string
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          total?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "costing_items_costing_id_fkey"
            columns: ["costing_id"]
            isOneToOne: false
            referencedRelation: "costings"
            referencedColumns: ["id"]
          },
        ]
      }
      costings: {
        Row: {
          additional_costs: number
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          approved_price: number | null
          costed_by: string | null
          created_at: string
          delivery_days: number | null
          direct_cost: number
          id: string
          is_submitted: boolean
          notes: string | null
          request_id: string
          requires_approval: boolean
          submitted_at: string | null
          suggested_price: number
          target_margin: number
          total_cost: number
          updated_at: string
        }
        Insert: {
          additional_costs?: number
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_price?: number | null
          costed_by?: string | null
          created_at?: string
          delivery_days?: number | null
          direct_cost?: number
          id?: string
          is_submitted?: boolean
          notes?: string | null
          request_id: string
          requires_approval?: boolean
          submitted_at?: string | null
          suggested_price?: number
          target_margin?: number
          total_cost?: number
          updated_at?: string
        }
        Update: {
          additional_costs?: number
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_price?: number | null
          costed_by?: string | null
          created_at?: string
          delivery_days?: number | null
          direct_cost?: number
          id?: string
          is_submitted?: boolean
          notes?: string | null
          request_id?: string
          requires_approval?: boolean
          submitted_at?: string | null
          suggested_price?: number
          target_margin?: number
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "costings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "sales_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          assigned_to: string | null
          city: string | null
          code: string
          company_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          governorate: string | null
          id: string
          is_archived: boolean
          notes: string | null
          phone: string
          referred_by: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          code?: string
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          governorate?: string | null
          id?: string
          is_archived?: boolean
          notes?: string | null
          phone: string
          referred_by?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          city?: string | null
          code?: string
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          governorate?: string | null
          id?: string
          is_archived?: boolean
          notes?: string | null
          phone?: string
          referred_by?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          code: string
          created_at: string
          customer_id: string | null
          doc_type: string | null
          file_path: string | null
          id: string
          name: string
          notes: string | null
          order_id: string | null
          quotation_id: string | null
          request_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          customer_id?: string | null
          doc_type?: string | null
          file_path?: string | null
          id?: string
          name: string
          notes?: string | null
          order_id?: string | null
          quotation_id?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          customer_id?: string | null
          doc_type?: string | null
          file_path?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_id?: string | null
          quotation_id?: string | null
          request_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_financials"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sales_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          target_role: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          actual_delivery: string | null
          assigned_to: string | null
          code: string
          created_at: string
          created_by: string | null
          customer_id: string
          department: string | null
          description: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          quantity: number
          quotation_id: string | null
          request_id: string | null
          specs: Json
          status: Database["public"]["Enums"]["order_status"]
          title: string
          total_price: number
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          assigned_to?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          department?: string | null
          description?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          quotation_id?: string | null
          request_id?: string | null
          specs?: Json
          status?: Database["public"]["Enums"]["order_status"]
          title: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          assigned_to?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          department?: string | null
          description?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          quotation_id?: string | null
          request_id?: string | null
          specs?: Json
          status?: Database["public"]["Enums"]["order_status"]
          title?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sales_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          code: string
          created_at: string
          customer_id: string
          id: string
          is_void: boolean
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          order_id: string | null
          payment_date: string
          received_by: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          code?: string
          created_at?: string
          customer_id: string
          id?: string
          is_void?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          received_by?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_void?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          received_by?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_financials"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          approval_sla_hours: number
          approval_threshold: number
          costing_sla_hours: number
          followup_sla_hours: number
          id: string
          is_active: boolean
          max_discount: number
          min_margin: number
          name: string
          standard_margin: number
          updated_at: string
        }
        Insert: {
          approval_sla_hours?: number
          approval_threshold?: number
          costing_sla_hours?: number
          followup_sla_hours?: number
          id?: string
          is_active?: boolean
          max_discount?: number
          min_margin?: number
          name?: string
          standard_margin?: number
          updated_at?: string
        }
        Update: {
          approval_sla_hours?: number
          approval_threshold?: number
          costing_sla_hours?: number
          followup_sla_hours?: number
          id?: string
          is_active?: boolean
          max_discount?: number
          min_margin?: number
          name?: string
          standard_margin?: number
          updated_at?: string
        }
        Relationships: []
      }
      products_services: {
        Row: {
          category: string | null
          code: string
          created_at: string
          default_cost: number
          default_margin: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          reference_price: number
          typical_delivery_days: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code?: string
          created_at?: string
          default_cost?: number
          default_margin?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          reference_price?: number
          typical_delivery_days?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          default_cost?: number
          default_margin?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reference_price?: number
          typical_delivery_days?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          change_reason: string | null
          code: string
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_days: number | null
          discount: number
          id: string
          is_current: boolean
          notes: string | null
          payment_terms: string | null
          previous_price: number | null
          request_id: string
          selling_price: number
          status: Database["public"]["Enums"]["quotation_status"]
          tax: number
          total: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          change_reason?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_days?: number | null
          discount?: number
          id?: string
          is_current?: boolean
          notes?: string | null
          payment_terms?: string | null
          previous_price?: number | null
          request_id: string
          selling_price?: number
          status?: Database["public"]["Enums"]["quotation_status"]
          tax?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          change_reason?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_days?: number | null
          discount?: number
          id?: string
          is_current?: boolean
          notes?: string | null
          payment_terms?: string | null
          previous_price?: number | null
          request_id?: string
          selling_price?: number
          status?: Database["public"]["Enums"]["quotation_status"]
          tax?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sales_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_templates: {
        Row: {
          created_at: string
          fields: Json
          id: string
          is_active: boolean
          name: string
          product_service_id: string | null
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          is_active?: boolean
          name: string
          product_service_id?: string | null
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          product_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_templates_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_request_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          request_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          request_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          request_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sales_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_requests: {
        Row: {
          code: string
          color: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          customer_notes: string | null
          description: string | null
          dimensions: string | null
          estimated_value: number
          finish: string | null
          id: string
          internal_notes: string | null
          lost_notes: string | null
          lost_reason: Database["public"]["Enums"]["lost_reason"] | null
          material: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          product_service_id: string | null
          quantity: number
          required_delivery_date: string | null
          salesperson_id: string | null
          specs: Json
          status: Database["public"]["Enums"]["request_status"]
          status_changed_at: string
          submitted_at: string | null
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          code?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_notes?: string | null
          description?: string | null
          dimensions?: string | null
          estimated_value?: number
          finish?: string | null
          id?: string
          internal_notes?: string | null
          lost_notes?: string | null
          lost_reason?: Database["public"]["Enums"]["lost_reason"] | null
          material?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          product_service_id?: string | null
          quantity?: number
          required_delivery_date?: string | null
          salesperson_id?: string | null
          specs?: Json
          status?: Database["public"]["Enums"]["request_status"]
          status_changed_at?: string
          submitted_at?: string | null
          title: string
          unit?: string
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_notes?: string | null
          description?: string | null
          dimensions?: string | null
          estimated_value?: number
          finish?: string | null
          id?: string
          internal_notes?: string | null
          lost_notes?: string | null
          lost_reason?: Database["public"]["Enums"]["lost_reason"] | null
          material?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          product_service_id?: string | null
          quantity?: number
          required_delivery_date?: string | null
          salesperson_id?: string | null
          specs?: Json
          status?: Database["public"]["Enums"]["request_status"]
          status_changed_at?: string
          submitted_at?: string | null
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_requests_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          request_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          request_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          request_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_financials"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sales_requests"
            referencedColumns: ["id"]
          },
        ]
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
      order_financials: {
        Row: {
          order_id: string | null
          paid_amount: number | null
          remaining_amount: number | null
          total_price: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_see_costs: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: never; Returns: boolean }
      next_code: { Args: { prefix: string; seq: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "management" | "sales" | "costing" | "staff"
      cost_category:
        | "raw_materials"
        | "labor"
        | "production"
        | "transportation"
        | "external_services"
        | "packaging"
        | "other"
      customer_status:
        | "prospect"
        | "active"
        | "inactive"
        | "returning"
        | "vip"
        | "lost"
      document_status:
        | "required"
        | "requested"
        | "received"
        | "verified"
        | "rejected"
        | "missing"
      lead_source:
        | "facebook"
        | "instagram"
        | "tiktok"
        | "whatsapp"
        | "website"
        | "google"
        | "referral"
        | "existing_customer"
        | "walk_in"
        | "other"
      lost_reason:
        | "price"
        | "competitor"
        | "delivery_time"
        | "specification"
        | "customer_budget"
        | "changed_mind"
        | "no_response"
        | "other"
      order_status:
        | "new"
        | "confirmed"
        | "in_progress"
        | "waiting_customer"
        | "waiting_documents"
        | "ready"
        | "delivered"
        | "completed"
        | "on_hold"
        | "cancelled"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "instapay"
        | "vodafone_cash"
        | "card"
        | "other"
      priority_level: "low" | "normal" | "high" | "urgent"
      quotation_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "viewed"
        | "negotiation"
        | "accepted"
        | "rejected"
        | "expired"
        | "superseded"
      request_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "waiting_information"
        | "costing_in_progress"
        | "costing_completed"
        | "pending_approval"
        | "quotation_ready"
        | "quotation_sent"
        | "negotiation"
        | "customer_approved"
        | "customer_rejected"
        | "expired"
        | "converted_to_order"
        | "cancelled"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "management", "sales", "costing", "staff"],
      cost_category: [
        "raw_materials",
        "labor",
        "production",
        "transportation",
        "external_services",
        "packaging",
        "other",
      ],
      customer_status: [
        "prospect",
        "active",
        "inactive",
        "returning",
        "vip",
        "lost",
      ],
      document_status: [
        "required",
        "requested",
        "received",
        "verified",
        "rejected",
        "missing",
      ],
      lead_source: [
        "facebook",
        "instagram",
        "tiktok",
        "whatsapp",
        "website",
        "google",
        "referral",
        "existing_customer",
        "walk_in",
        "other",
      ],
      lost_reason: [
        "price",
        "competitor",
        "delivery_time",
        "specification",
        "customer_budget",
        "changed_mind",
        "no_response",
        "other",
      ],
      order_status: [
        "new",
        "confirmed",
        "in_progress",
        "waiting_customer",
        "waiting_documents",
        "ready",
        "delivered",
        "completed",
        "on_hold",
        "cancelled",
      ],
      payment_method: [
        "cash",
        "bank_transfer",
        "instapay",
        "vodafone_cash",
        "card",
        "other",
      ],
      priority_level: ["low", "normal", "high", "urgent"],
      quotation_status: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "viewed",
        "negotiation",
        "accepted",
        "rejected",
        "expired",
        "superseded",
      ],
      request_status: [
        "draft",
        "submitted",
        "under_review",
        "waiting_information",
        "costing_in_progress",
        "costing_completed",
        "pending_approval",
        "quotation_ready",
        "quotation_sent",
        "negotiation",
        "customer_approved",
        "customer_rejected",
        "expired",
        "converted_to_order",
        "cancelled",
      ],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
