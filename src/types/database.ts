/**
 * DIGITAX — Generated Supabase Database Types
 * 
 * Accurately mirrors the PostgreSQL 17 schema deployed on Supabase.
 * Generated via Supabase TypeScript Generator.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string;
          actor_id: string;
          changes: Json | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json | null;
          reason: string | null;
          shop_id: string | null;
        };
        Insert: {
          action: string;
          actor_id: string;
          changes?: Json | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          reason?: string | null;
          shop_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string;
          changes?: Json | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          reason?: string | null;
          shop_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          content_hash: string | null;
          content_type: string;
          created_at: string;
          document_type: string;
          extracted_data: Json | null;
          extraction_attempts: number;
          file_size: number;
          id: string;
          last_extraction_error: string | null;
          original_filename: string;
          processing_status: string;
          shop_id: string;
          storage_path: string;
          updated_at: string;
          uploaded_by: string | null;
          uploader_id: string;
        };
        Insert: {
          content_hash?: string | null;
          content_type: string;
          created_at?: string;
          document_type?: string;
          extracted_data?: Json | null;
          extraction_attempts?: number;
          file_size: number;
          id?: string;
          last_extraction_error?: string | null;
          original_filename: string;
          processing_status?: string;
          shop_id: string;
          storage_path: string;
          updated_at?: string;
          uploaded_by?: string | null;
          uploader_id: string;
        };
        Update: {
          content_hash?: string | null;
          content_type?: string;
          created_at?: string;
          document_type?: string;
          extracted_data?: Json | null;
          extraction_attempts?: number;
          file_size?: number;
          id?: string;
          last_extraction_error?: string | null;
          original_filename?: string;
          processing_status?: string;
          shop_id?: string;
          storage_path?: string;
          updated_at?: string;
          uploaded_by?: string | null;
          uploader_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      filing_periods: {
        Row: {
          created_at: string;
          financial_year: string;
          id: string;
          period_end: string;
          period_start: string;
          return_type: string;
          shop_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          financial_year: string;
          id?: string;
          period_end: string;
          period_start: string;
          return_type?: string;
          shop_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          financial_year?: string;
          id?: string;
          period_end?: string;
          period_start?: string;
          return_type?: string;
          shop_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "filing_periods_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      gst_summaries: {
        Row: {
          calculated_at: string;
          calculation_version: string;
          created_at: string;
          details: Json | null;
          engine_version: string;
          exempt_sales: number;
          filing_period_id: string | null;
          financial_year: string;
          generated_at: string;
          generated_by: string | null;
          id: string;
          input_cess: number;
          input_cgst: number;
          input_igst: number;
          input_sgst: number;
          invoices_included: number;
          net_tax_liability: number;
          output_cess: number;
          output_cgst: number;
          output_igst: number;
          output_sgst: number;
          return_type: string;
          review_state: string;
          ruleset_version: string;
          shop_id: string;
          source_record_counts: Json;
          status: string;
          tax_period: string;
          taxable_purchases: number;
          taxable_sales: number;
          total_purchases: number;
          total_sales: number;
          transactions_included: number;
          unresolved_issues: number;
          warnings: Json;
        };
        Insert: {
          calculated_at?: string;
          calculation_version?: string;
          created_at?: string;
          details?: Json | null;
          engine_version?: string;
          exempt_sales?: number;
          filing_period_id?: string | null;
          financial_year: string;
          generated_at?: string;
          generated_by?: string | null;
          id?: string;
          input_cess?: number;
          input_cgst?: number;
          input_igst?: number;
          input_sgst?: number;
          invoices_included?: number;
          net_tax_liability?: number;
          output_cess?: number;
          output_cgst?: number;
          output_igst?: number;
          output_sgst?: number;
          return_type?: string;
          review_state?: string;
          ruleset_version?: string;
          shop_id: string;
          source_record_counts?: Json;
          status?: string;
          tax_period: string;
          taxable_purchases?: number;
          taxable_sales?: number;
          total_purchases?: number;
          total_sales?: number;
          transactions_included?: number;
          unresolved_issues?: number;
          warnings?: Json;
        };
        Update: {
          calculated_at?: string;
          calculation_version?: string;
          created_at?: string;
          details?: Json | null;
          engine_version?: string;
          exempt_sales?: number;
          filing_period_id?: string | null;
          financial_year?: string;
          generated_at?: string;
          generated_by?: string | null;
          id?: string;
          input_cess?: number;
          input_cgst?: number;
          input_igst?: number;
          input_sgst?: number;
          invoices_included?: number;
          net_tax_liability?: number;
          output_cess?: number;
          output_cgst?: number;
          output_igst?: number;
          output_sgst?: number;
          return_type?: string;
          review_state?: string;
          ruleset_version?: string;
          shop_id?: string;
          source_record_counts?: Json;
          status?: string;
          tax_period?: string;
          taxable_purchases?: number;
          taxable_sales?: number;
          total_purchases?: number;
          total_sales?: number;
          transactions_included?: number;
          unresolved_issues?: number;
          warnings?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "gst_summaries_filing_period_id_fkey";
            columns: ["filing_period_id"];
            isOneToOne: false;
            referencedRelation: "filing_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gst_summaries_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      import_batches: {
        Row: {
          created_at: string;
          duplicate_count: number;
          error_count: number;
          filename: string;
          id: string;
          imported_by: string;
          imported_count: number;
          shop_id: string;
          skipped_count: number;
          source_type: string;
          status: string;
          total_rows: number;
        };
        Insert: {
          created_at?: string;
          duplicate_count?: number;
          error_count?: number;
          filename: string;
          id?: string;
          imported_by: string;
          imported_count?: number;
          shop_id: string;
          skipped_count?: number;
          source_type?: string;
          status?: string;
          total_rows?: number;
        };
        Update: {
          created_at?: string;
          duplicate_count?: number;
          error_count?: number;
          filename?: string;
          id?: string;
          imported_by?: string;
          imported_count?: number;
          shop_id?: string;
          skipped_count?: number;
          source_type?: string;
          status?: string;
          total_rows?: number;
        };
        Relationships: [
          {
            foreignKeyName: "import_batches_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          cess_amount: number;
          cgst_amount: number;
          created_at: string;
          description: string;
          discount: number;
          gst_rate: number;
          hsn_sac_code: string | null;
          id: string;
          igst_amount: number;
          invoice_id: string;
          line_number: number;
          line_total: number | null;
          quantity: number | null;
          review_state: string;
          sgst_amount: number;
          taxable_value: number;
          total_amount: number;
          unit: string | null;
          unit_price: number | null;
        };
        Insert: {
          cess_amount?: number;
          cgst_amount?: number;
          created_at?: string;
          description: string;
          discount?: number;
          gst_rate?: number;
          hsn_sac_code?: string | null;
          id?: string;
          igst_amount?: number;
          invoice_id: string;
          line_number?: number;
          line_total?: number | null;
          quantity?: number | null;
          review_state?: string;
          sgst_amount?: number;
          taxable_value?: number;
          total_amount?: number;
          unit?: string | null;
          unit_price?: number | null;
        };
        Update: {
          cess_amount?: number;
          cgst_amount?: number;
          created_at?: string;
          description?: string;
          discount?: number;
          gst_rate?: number;
          hsn_sac_code?: string | null;
          id?: string;
          igst_amount?: number;
          invoice_id?: string;
          line_number?: number;
          line_total?: number | null;
          quantity?: number | null;
          review_state?: string;
          sgst_amount?: number;
          taxable_value?: number;
          total_amount?: number;
          unit?: string | null;
          unit_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount_due: number;
          amount_paid: number;
          buyer_gstin: string | null;
          buyer_name: string | null;
          cess_total: number;
          cgst_total: number;
          created_at: string;
          customer_address: string | null;
          customer_gstin: string | null;
          customer_legal_name: string | null;
          customer_trade_name: string | null;
          direction: string;
          discount_total: number;
          document_id: string | null;
          due_date: string | null;
          extraction_confidence: number | null;
          id: string;
          igst_total: number;
          invoice_date: string;
          invoice_number: string;
          invoice_total: number | null;
          invoice_type: string;
          is_inter_state: boolean | null;
          is_reverse_charge: boolean;
          notes: string | null;
          payment_status: string;
          place_of_supply_state_code: string | null;
          review_state: string;
          round_off_amount: number;
          sgst_total: number;
          shop_id: string;
          source: string | null;
          status: string;
          subtotal: number;
          supplier_address: string | null;
          supplier_gstin: string | null;
          supplier_legal_name: string | null;
          supplier_name: string | null;
          supplier_trade_name: string | null;
          taxable_amount: number | null;
          taxable_value: number;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          amount_due?: number;
          amount_paid?: number;
          buyer_gstin?: string | null;
          buyer_name?: string | null;
          cess_total?: number;
          cgst_total?: number;
          created_at?: string;
          customer_address?: string | null;
          customer_gstin?: string | null;
          customer_legal_name?: string | null;
          customer_trade_name?: string | null;
          direction?: string;
          discount_total?: number;
          document_id?: string | null;
          due_date?: string | null;
          extraction_confidence?: number | null;
          id?: string;
          igst_total?: number;
          invoice_date: string;
          invoice_number: string;
          invoice_total?: number | null;
          invoice_type?: string;
          is_inter_state?: boolean | null;
          is_reverse_charge?: boolean;
          notes?: string | null;
          payment_status?: string;
          place_of_supply_state_code?: string | null;
          review_state?: string;
          round_off_amount?: number;
          sgst_total?: number;
          shop_id: string;
          source?: string | null;
          status?: string;
          subtotal?: number;
          supplier_address?: string | null;
          supplier_gstin?: string | null;
          supplier_legal_name?: string | null;
          supplier_name?: string | null;
          supplier_trade_name?: string | null;
          taxable_amount?: number | null;
          taxable_value?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          amount_due?: number;
          amount_paid?: number;
          buyer_gstin?: string | null;
          buyer_name?: string | null;
          cess_total?: number;
          cgst_total?: number;
          created_at?: string;
          customer_address?: string | null;
          customer_gstin?: string | null;
          customer_legal_name?: string | null;
          customer_trade_name?: string | null;
          direction?: string;
          discount_total?: number;
          document_id?: string | null;
          due_date?: string | null;
          extraction_confidence?: number | null;
          id?: string;
          igst_total?: number;
          invoice_date?: string;
          invoice_number?: string;
          invoice_total?: number | null;
          invoice_type?: string;
          is_inter_state?: boolean | null;
          is_reverse_charge?: boolean;
          notes?: string | null;
          payment_status?: string;
          place_of_supply_state_code?: string | null;
          review_state?: string;
          round_off_amount?: number;
          sgst_total?: number;
          shop_id?: string;
          source?: string | null;
          status?: string;
          subtotal?: number;
          supplier_address?: string | null;
          supplier_gstin?: string | null;
          supplier_legal_name?: string | null;
          supplier_name?: string | null;
          supplier_trade_name?: string | null;
          taxable_amount?: number | null;
          taxable_value?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          preferred_language: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          preferred_language?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          preferred_language?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reconciliation_matches: {
        Row: {
          allocated_amount: number;
          confidence_score: number | null;
          confirmation_status: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          evidence: string | null;
          id: string;
          invoice_id: string;
          manual_review_status: string;
          match_method: string;
          match_status: string;
          match_type: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
          shop_id: string;
          transaction_id: string;
          updated_at: string;
        };
        Insert: {
          allocated_amount: number;
          confidence_score?: number | null;
          confirmation_status?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          evidence?: string | null;
          id?: string;
          invoice_id: string;
          manual_review_status?: string;
          match_method?: string;
          match_status?: string;
          match_type?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          shop_id: string;
          transaction_id: string;
          updated_at?: string;
        };
        Update: {
          allocated_amount?: number;
          confidence_score?: number | null;
          confirmation_status?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          evidence?: string | null;
          id?: string;
          invoice_id?: string;
          manual_review_status?: string;
          match_method?: string;
          match_status?: string;
          match_type?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          shop_id?: string;
          transaction_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reconciliation_matches_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reconciliation_matches_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reconciliation_matches_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      review_issues: {
        Row: {
          created_at: string;
          description: string;
          entity_id: string;
          entity_type: string;
          evidence: Json | null;
          id: string;
          issue_type: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          shop_id: string;
          status: string;
          suggested_action: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          entity_id: string;
          entity_type: string;
          evidence?: Json | null;
          id?: string;
          issue_type: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          shop_id: string;
          status?: string;
          suggested_action?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          entity_id?: string;
          entity_type?: string;
          evidence?: Json | null;
          id?: string;
          issue_type?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          shop_id?: string;
          status?: string;
          suggested_action?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_issues_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shop_members: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          shop_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: string;
          shop_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          shop_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shops: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          business_type: string | null;
          city: string | null;
          created_at: string;
          email: string | null;
          financial_year_start_month: number;
          gst_registration_type: string | null;
          gstin: string | null;
          id: string;
          name: string;
          onboarding_completed: boolean;
          owner_id: string;
          phone: string | null;
          pincode: string | null;
          preferred_language: string;
          state: string | null;
          state_code: string | null;
          taxpayer_scheme: string | null;
          updated_at: string;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          business_type?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          financial_year_start_month?: number;
          gst_registration_type?: string | null;
          gstin?: string | null;
          id?: string;
          name: string;
          onboarding_completed?: boolean;
          owner_id: string;
          phone?: string | null;
          pincode?: string | null;
          preferred_language?: string;
          state?: string | null;
          state_code?: string | null;
          taxpayer_scheme?: string | null;
          updated_at?: string;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          business_type?: string | null;
          city?: string | null;
          created_at?: string;
          email?: string | null;
          financial_year_start_month?: number;
          gst_registration_type?: string | null;
          gstin?: string | null;
          id?: string;
          name?: string;
          onboarding_completed?: boolean;
          owner_id?: string;
          phone?: string | null;
          pincode?: string | null;
          preferred_language?: string;
          state?: string | null;
          state_code?: string | null;
          taxpayer_scheme?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          bank_reference: string | null;
          category: string;
          created_at: string;
          description: string;
          direction: string;
          external_txn_id: string | null;
          id: string;
          import_batch_id: string | null;
          notes: string | null;
          original_row_data: Json | null;
          payment_method: string | null;
          reconciliation_status: string;
          review_state: string;
          shop_id: string;
          source_account: string | null;
          transaction_date: string;
          transaction_timestamp: string | null;
          updated_at: string;
          upi_reference: string | null;
        };
        Insert: {
          amount: number;
          bank_reference?: string | null;
          category?: string;
          created_at?: string;
          description: string;
          direction: string;
          external_txn_id?: string | null;
          id?: string;
          import_batch_id?: string | null;
          notes?: string | null;
          original_row_data?: Json | null;
          payment_method?: string | null;
          reconciliation_status?: string;
          review_state?: string;
          shop_id: string;
          source_account?: string | null;
          transaction_date: string;
          transaction_timestamp?: string | null;
          updated_at?: string;
          upi_reference?: string | null;
        };
        Update: {
          amount?: number;
          bank_reference?: string | null;
          category?: string;
          created_at?: string;
          description?: string;
          direction?: string;
          external_txn_id?: string | null;
          id?: string;
          import_batch_id?: string | null;
          notes?: string | null;
          original_row_data?: Json | null;
          payment_method?: string | null;
          reconciliation_status?: string;
          review_state?: string;
          shop_id?: string;
          source_account?: string | null;
          transaction_date?: string;
          transaction_timestamp?: string | null;
          updated_at?: string;
          upi_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_import_batch_id_fkey";
            columns: ["import_batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      invoice_lines: {
        Row: {
          cess_amount: number | null;
          cgst_amount: number | null;
          created_at: string | null;
          description: string | null;
          discount: number | null;
          gst_rate: number | null;
          hsn_sac_code: string | null;
          id: string | null;
          igst_amount: number | null;
          invoice_id: string | null;
          line_number: number | null;
          quantity: number | null;
          review_state: string | null;
          sgst_amount: number | null;
          taxable_value: number | null;
          total_amount: number | null;
          unit: string | null;
          unit_price: number | null;
        };
        Insert: {
          cess_amount?: number | null;
          cgst_amount?: number | null;
          created_at?: string | null;
          description?: string | null;
          discount?: number | null;
          gst_rate?: number | null;
          hsn_sac_code?: string | null;
          id?: string | null;
          igst_amount?: number | null;
          invoice_id?: string | null;
          line_number?: number | null;
          quantity?: number | null;
          review_state?: string | null;
          sgst_amount?: number | null;
          taxable_value?: number | null;
          total_amount?: number | null;
          unit?: string | null;
          unit_price?: number | null;
        };
        Update: {
          cess_amount?: number | null;
          cgst_amount?: number | null;
          created_at?: string | null;
          description?: string | null;
          discount?: number | null;
          gst_rate?: number | null;
          hsn_sac_code?: string | null;
          id?: string | null;
          igst_amount?: number | null;
          invoice_id?: string | null;
          line_number?: number | null;
          quantity?: number | null;
          review_state?: string | null;
          sgst_amount?: number | null;
          taxable_value?: number | null;
          total_amount?: number | null;
          unit?: string | null;
          unit_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_matches: {
        Row: {
          allocated_amount: number | null;
          confidence_score: number | null;
          confirmation_status: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string | null;
          evidence: string | null;
          id: string | null;
          invoice_id: string | null;
          match_type: string | null;
          shop_id: string | null;
          transaction_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          allocated_amount?: number | null;
          confidence_score?: number | null;
          confirmation_status?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string | null;
          evidence?: string | null;
          id?: string | null;
          invoice_id?: string | null;
          match_type?: string | null;
          shop_id?: string | null;
          transaction_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          allocated_amount?: number | null;
          confidence_score?: number | null;
          confirmation_status?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string | null;
          evidence?: string | null;
          id?: string | null;
          invoice_id?: string | null;
          match_type?: string | null;
          shop_id?: string | null;
          transaction_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reconciliation_matches_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reconciliation_matches_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reconciliation_matches_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      is_shop_admin: { Args: { p_shop_id: string }; Returns: boolean };
      is_shop_member: { Args: { p_shop_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience type aliases for direct table row access
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbShop = Database['public']['Tables']['shops']['Row'];
export type DbShopMember = Database['public']['Tables']['shop_members']['Row'];
export type DbDocument = Database['public']['Tables']['documents']['Row'];
export type DbInvoice = Database['public']['Tables']['invoices']['Row'];
export type DbInvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type DbInvoiceLine = Database['public']['Tables']['invoice_items']['Row'];
export type DbImportBatch = Database['public']['Tables']['import_batches']['Row'];
export type DbTransaction = Database['public']['Tables']['transactions']['Row'];
export type DbReconciliationMatch = Database['public']['Tables']['reconciliation_matches']['Row'];
export type DbTransactionMatch = Database['public']['Tables']['reconciliation_matches']['Row'];
export type DbFilingPeriod = Database['public']['Tables']['filing_periods']['Row'];
export type DbGstSummary = Database['public']['Tables']['gst_summaries']['Row'];
export type DbReviewIssue = Database['public']['Tables']['review_issues']['Row'];
export type DbAuditEvent = Database['public']['Tables']['audit_events']['Row'];
