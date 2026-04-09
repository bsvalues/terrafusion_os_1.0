/**
 * Supabase Types
 * 
 * This file contains TypeScript types for the Supabase database schema.
 * These types help provide type safety when interacting with the database.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          property_id: string;
          address: string;
          parcel_number: string;
          property_type: string;
          status: string;
          acres: number;
          value: number | null;
          extra_fields: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          address: string;
          parcel_number: string;
          property_type: string;
          status: string;
          acres: number;
          value?: number | null;
          extra_fields?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          address?: string;
          parcel_number?: string;
          property_type?: string;
          status?: string;
          acres?: number;
          value?: number | null;
          extra_fields?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_analyses: {
        Row: {
          id: string;
          property_id: string;
          analysis_id: string;
          title: string;
          description: string | null;
          methodology: string;
          value_conclusion: number | null;
          confidence_level: string | null;
          comparable_properties: string[] | null;
          adjustment_notes: string | null;
          created_by: string;
          approved_by: string | null;
          review_date: string | null;
          created_at: string;
          updated_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          analysis_id: string;
          title: string;
          description?: string | null;
          methodology: string;
          value_conclusion?: number | null;
          confidence_level?: string | null;
          comparable_properties?: string[] | null;
          adjustment_notes?: string | null;
          created_by: string;
          approved_by?: string | null;
          review_date?: string | null;
          created_at?: string;
          updated_at?: string;
          status: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          analysis_id?: string;
          title?: string;
          description?: string | null;
          methodology?: string;
          value_conclusion?: number | null;
          confidence_level?: string | null;
          comparable_properties?: string[] | null;
          adjustment_notes?: string | null;
          created_by?: string;
          approved_by?: string | null;
          review_date?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: string;
        };
      };
      property_appeals: {
        Row: {
          id: string;
          property_id: string;
          user_id: string;
          appeal_number: string;
          appeal_type: string;
          reason: string;
          evidence_urls: string[] | null;
          hearing_date: string | null;
          decision: string | null;
          decision_date: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          notification_sent: boolean | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          user_id: string;
          appeal_number: string;
          appeal_type: string;
          reason: string;
          evidence_urls?: string[] | null;
          hearing_date?: string | null;
          decision?: string | null;
          decision_date?: string | null;
          notes?: string | null;
          status: string;
          created_at?: string;
          updated_at?: string;
          notification_sent?: boolean | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          user_id?: string;
          appeal_number?: string;
          appeal_type?: string;
          reason?: string;
          evidence_urls?: string[] | null;
          hearing_date?: string | null;
          decision?: string | null;
          decision_date?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          notification_sent?: boolean | null;
        };
      };
      property_data_changes: {
        Row: {
          id: string;
          property_id: string;
          field_name: string;
          old_value: string;
          new_value: string;
          change_timestamp: string;
          source: string;
          user_id: string;
          source_details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          field_name: string;
          old_value: string;
          new_value: string;
          change_timestamp: string;
          source: string;
          user_id: string;
          source_details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          field_name?: string;
          old_value?: string;
          new_value?: string;
          change_timestamp?: string;
          source?: string;
          user_id?: string;
          source_details?: Json | null;
          created_at?: string;
        };
      };
      property_insight_shares: {
        Row: {
          id: string;
          share_id: string;
          property_id: string;
          property_name: string;
          property_address: string;
          analysis_ids: string[] | null;
          created_by: string;
          access_token: string;
          expires_at: string | null;
          created_at: string;
          access_count: number;
          last_accessed_at: string | null;
        };
        Insert: {
          id?: string;
          share_id: string;
          property_id: string;
          property_name: string;
          property_address: string;
          analysis_ids?: string[] | null;
          created_by: string;
          access_token: string;
          expires_at?: string | null;
          created_at?: string;
          access_count?: number;
          last_accessed_at?: string | null;
        };
        Update: {
          id?: string;
          share_id?: string;
          property_id?: string;
          property_name?: string;
          property_address?: string;
          analysis_ids?: string[] | null;
          created_by?: string;
          access_token?: string;
          expires_at?: string | null;
          created_at?: string;
          access_count?: number;
          last_accessed_at?: string | null;
        };
      };
      agent_experiences: {
        Row: {
          id: string;
          agent_id: string;
          agent_name: string;
          experience_id: string;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          state: Json;
          reward: number;
          priority: number;
          feedback: string | null;
          timestamp: string;
          created_at: string;
          used_for_training: boolean;
        };
        Insert: {
          id?: string;
          agent_id: string;
          agent_name: string;
          experience_id: string;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          state: Json;
          reward: number;
          priority: number;
          feedback?: string | null;
          timestamp: string;
          created_at?: string;
          used_for_training?: boolean;
        };
        Update: {
          id?: string;
          agent_id?: string;
          agent_name?: string;
          experience_id?: string;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          state?: Json;
          reward?: number;
          priority?: number;
          feedback?: string | null;
          timestamp?: string;
          created_at?: string;
          used_for_training?: boolean;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          auth_id: string;
          email: string;
          display_name: string;
          role: string;
          organization_id: string | null;
          preferences: Json | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          auth_id: string;
          email: string;
          display_name: string;
          role: string;
          organization_id?: string | null;
          preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          auth_id?: string;
          email?: string;
          display_name?: string;
          role?: string;
          organization_id?: string | null;
          preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          type: string;
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          subscription_tier: string;
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          subscription_tier: string;
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          subscription_tier?: string;
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_market_trends: {
        Row: {
          id: string;
          property_id: string;
          timestamp: string;
          value: number;
          percent_change: number;
          comparable_sales: string[] | null;
          market_indicators: Json;
          prediction_factors: Json | null;
          confidence_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          timestamp: string;
          value: number;
          percent_change: number;
          comparable_sales?: string[] | null;
          market_indicators: Json;
          prediction_factors?: Json | null;
          confidence_score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          timestamp?: string;
          value?: number;
          percent_change?: number;
          comparable_sales?: string[] | null;
          market_indicators?: Json;
          prediction_factors?: Json | null;
          confidence_score?: number;
          created_at?: string;
        };
      };
      compliance_reports: {
        Row: {
          id: string;
          report_id: string;
          year: number;
          county_code: string;
          report_type: string;
          generated_at: string;
          submitted_by: string | null;
          submitted_at: string | null;
          status: string;
          issues: Json | null;
          summary: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          year: number;
          county_code: string;
          report_type: string;
          generated_at: string;
          submitted_by?: string | null;
          submitted_at?: string | null;
          status: string;
          issues?: Json | null;
          summary: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          year?: number;
          county_code?: string;
          report_type?: string;
          generated_at?: string;
          submitted_by?: string | null;
          submitted_at?: string | null;
          status?: string;
          issues?: Json | null;
          summary?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}