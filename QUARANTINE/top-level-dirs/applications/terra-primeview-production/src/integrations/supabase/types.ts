export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_executions: {
        Row: {
          agent_id: string
          completed_at: string | null
          confidence_score: number | null
          created_by: string
          duration_ms: number | null
          error_message: string | null
          id: string
          parameters: Json
          property_id: string
          result: Json | null
          started_at: string
          status: Database["public"]["Enums"]["execution_status"]
          task_type: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          confidence_score?: number | null
          created_by: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          parameters?: Json
          property_id: string
          result?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["execution_status"]
          task_type: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_by?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          parameters?: Json
          property_id?: string
          result?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["execution_status"]
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_history: {
        Row: {
          ai_confidence_score: number | null
          appeal_status: Database["public"]["Enums"]["appeal_status"] | null
          assessed_value: number
          assessment_date: string
          assessment_method: string
          assessor_id: string
          created_at: string
          id: string
          improvement_value: number
          land_value: number
          notes: string | null
          property_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          appeal_status?: Database["public"]["Enums"]["appeal_status"] | null
          assessed_value: number
          assessment_date?: string
          assessment_method?: string
          assessor_id: string
          created_at?: string
          id?: string
          improvement_value: number
          land_value: number
          notes?: string | null
          property_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          appeal_status?: Database["public"]["Enums"]["appeal_status"] | null
          assessed_value?: number
          assessment_date?: string
          assessment_method?: string
          assessor_id?: string
          created_at?: string
          id?: string
          improvement_value?: number
          land_value?: number
          notes?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at: string
          changed_by: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at?: string
          changed_by: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changed_at?: string
          changed_by?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      counties: {
        Row: {
          active: boolean
          assessment_cycle: string
          configuration: Json | null
          contact_info: Json | null
          created_at: string
          fips_code: string
          id: string
          name: string
          state: string
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          assessment_cycle?: string
          configuration?: Json | null
          contact_info?: Json | null
          created_at?: string
          fips_code: string
          id?: string
          name: string
          state: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          assessment_cycle?: string
          configuration?: Json | null
          contact_info?: Json | null
          created_at?: string
          fips_code?: string
          id?: string
          name?: string
          state?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          error_log: Json | null
          error_records: number | null
          file_path: string | null
          id: string
          import_name: string
          import_type: string
          metadata: Json | null
          processed_records: number | null
          started_at: string | null
          status: string
          success_records: number | null
          total_records: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          error_log?: Json | null
          error_records?: number | null
          file_path?: string | null
          id?: string
          import_name: string
          import_type: string
          metadata?: Json | null
          processed_records?: number | null
          started_at?: string | null
          status?: string
          success_records?: number | null
          total_records?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          error_log?: Json | null
          error_records?: number | null
          file_path?: string | null
          id?: string
          import_name?: string
          import_type?: string
          metadata?: Json | null
          processed_records?: number | null
          started_at?: string | null
          status?: string
          success_records?: number | null
          total_records?: number | null
        }
        Relationships: []
      }
      data_mapping_configs: {
        Row: {
          config_name: string
          created_at: string | null
          field_mappings: Json
          id: string
          is_active: boolean | null
          source_type: string
          target_table: string
          transformation_rules: Json | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          config_name: string
          created_at?: string | null
          field_mappings: Json
          id?: string
          is_active?: boolean | null
          source_type: string
          target_table: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          config_name?: string
          created_at?: string | null
          field_mappings?: Json
          id?: string
          is_active?: boolean | null
          source_type?: string
          target_table?: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      import_errors: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          import_id: string | null
          raw_data: Json | null
          row_number: number | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          import_id?: string | null
          raw_data?: Json | null
          row_number?: number | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          import_id?: string | null
          raw_data?: Json | null
          row_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "data_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          active: boolean
          boundary: Json | null
          characteristics: Json
          county_id: string
          created_at: string
          id: string
          last_analyzed: string | null
          market_statistics: Json
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          boundary?: Json | null
          characteristics?: Json
          county_id: string
          created_at?: string
          id?: string
          last_analyzed?: string | null
          market_statistics?: Json
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          boundary?: Json | null
          characteristics?: Json
          county_id?: string
          created_at?: string
          id?: string
          last_analyzed?: string | null
          market_statistics?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          active: boolean
          address: string
          assessed_value: number
          coordinates: Json | null
          county_id: string
          created_at: string
          id: string
          improvement_value: number
          land_value: number
          last_assessment_date: string
          legal_description: string | null
          lot_size_acres: number | null
          market_value: number | null
          neighborhood_id: string | null
          next_assessment_due: string
          parcel_id: string
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet: number | null
          updated_at: string
          year_built: number | null
          zoning: string | null
        }
        Insert: {
          active?: boolean
          address: string
          assessed_value?: number
          coordinates?: Json | null
          county_id: string
          created_at?: string
          id?: string
          improvement_value?: number
          land_value?: number
          last_assessment_date?: string
          legal_description?: string | null
          lot_size_acres?: number | null
          market_value?: number | null
          neighborhood_id?: string | null
          next_assessment_due?: string
          parcel_id: string
          property_type?: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          updated_at?: string
          year_built?: number | null
          zoning?: string | null
        }
        Update: {
          active?: boolean
          address?: string
          assessed_value?: number
          coordinates?: Json | null
          county_id?: string
          created_at?: string
          id?: string
          improvement_value?: number
          land_value?: number
          last_assessment_date?: string
          legal_description?: string | null
          lot_size_acres?: number | null
          market_value?: number | null
          neighborhood_id?: string | null
          next_assessment_due?: string
          parcel_id?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          updated_at?: string
          year_built?: number | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_owners: {
        Row: {
          created_at: string
          id: string
          mailing_address: string
          mailing_city: string
          mailing_state: string
          mailing_zip: string
          owner_name: string
          owner_type: Database["public"]["Enums"]["owner_type"]
          percentage_owned: number
          primary_owner: boolean
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mailing_address: string
          mailing_city: string
          mailing_state: string
          mailing_zip: string
          owner_name: string
          owner_type?: Database["public"]["Enums"]["owner_type"]
          percentage_owned?: number
          primary_owner?: boolean
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mailing_address?: string
          mailing_city?: string
          mailing_state?: string
          mailing_zip?: string
          owner_name?: string
          owner_type?: Database["public"]["Enums"]["owner_type"]
          percentage_owned?: number
          primary_owner?: boolean
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_owners_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          category: string
          config_key: string
          config_value: Json
          county_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category: string
          config_key: string
          config_value: Json
          county_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          config_key?: string
          config_value?: Json
          county_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_config_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appeal_status:
        | "None"
        | "Filed"
        | "UnderReview"
        | "Approved"
        | "Denied"
        | "Withdrawn"
      audit_action: "Insert" | "Update" | "Delete" | "View"
      execution_status:
        | "Pending"
        | "Running"
        | "Completed"
        | "Failed"
        | "Cancelled"
        | "Timeout"
      owner_type:
        | "Individual"
        | "Corporation"
        | "Partnership"
        | "LLC"
        | "Trust"
        | "Government"
        | "Nonprofit"
        | "Other"
      property_type:
        | "Residential"
        | "Commercial"
        | "Industrial"
        | "Agricultural"
        | "Exempt"
        | "Utility"
        | "PublicUse"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appeal_status: [
        "None",
        "Filed",
        "UnderReview",
        "Approved",
        "Denied",
        "Withdrawn",
      ],
      audit_action: ["Insert", "Update", "Delete", "View"],
      execution_status: [
        "Pending",
        "Running",
        "Completed",
        "Failed",
        "Cancelled",
        "Timeout",
      ],
      owner_type: [
        "Individual",
        "Corporation",
        "Partnership",
        "LLC",
        "Trust",
        "Government",
        "Nonprofit",
        "Other",
      ],
      property_type: [
        "Residential",
        "Commercial",
        "Industrial",
        "Agricultural",
        "Exempt",
        "Utility",
        "PublicUse",
      ],
    },
  },
} as const
