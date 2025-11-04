
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;
export type PropertyInsert = TablesInsert<"properties">;
export type PropertyUpdate = TablesUpdate<"properties">;
export type PropertyOwner = Tables<"property_owners">;
export type AssessmentHistory = Tables<"assessment_history">;
export type AgentExecution = Tables<"agent_executions">;

// Mock types for tables that don't exist yet
export type Exemption = {
  id: string;
  property_id: string;
  exemption_type: string;
  exemption_amount: number;
  percentage_exempt?: number;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
};

export type SalesComparable = {
  id: string;
  property_id: string;
  sale_date: string;
  sale_price: number;
  sale_type: string;
  verified: boolean;
  verification_source?: string;
  validity_score?: number;
};

export function useProperty(propertyId: string | null) {
  return useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          counties (
            name,
            state,
            fips_code,
            timezone,
            assessment_cycle,
            contact_info,
            configuration
          ),
          neighborhoods (
            id,
            name,
            characteristics,
            market_statistics
          ),
          property_owners (
            id,
            owner_name,
            owner_type,
            mailing_address,
            mailing_city,
            mailing_state,
            mailing_zip,
            percentage_owned,
            primary_owner
          )
        `)
        .eq("id", propertyId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch property:", error);
        throw error;
      }
      return data;
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePropertyByParcel(parcelId: string, countyId: string) {
  return useQuery({
    queryKey: ["property", "parcel", parcelId, countyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          counties (
            name,
            state,
            fips_code,
            timezone,
            assessment_cycle,
            contact_info,
            configuration
          ),
          neighborhoods (
            id,
            name,
            characteristics,
            market_statistics
          ),
          property_owners (
            id,
            owner_name,
            owner_type,
            mailing_address,
            mailing_city,
            mailing_state,
            mailing_zip,
            percentage_owned,
            primary_owner
          )
        `)
        .eq("parcel_id", parcelId)
        .eq("county_id", countyId)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch property by parcel:", error);
        throw error;
      }
      return data;
    },
    enabled: !!parcelId && !!countyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAssessmentHistory(propertyId: string) {
  return useQuery({
    queryKey: ["assessment_history", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_history")
        .select("*")
        .eq("property_id", propertyId)
        .order("assessment_date", { ascending: false });

      if (error) {
        console.error("Failed to fetch assessment history:", error);
        throw error;
      }
      return data as AssessmentHistory[];
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useAgentExecutions(propertyId: string) {
  return useQuery({
    queryKey: ["agent_executions", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_executions")
        .select("*")
        .eq("property_id", propertyId)
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to fetch agent executions:", error);
        throw error;
      }
      return data as AgentExecution[];
    },
    enabled: !!propertyId,
    refetchInterval: 5000,
    staleTime: 5 * 1000,
    gcTime: 30 * 1000,
  });
}

export function useExemptions(propertyId: string) {
  return useQuery({
    queryKey: ["exemptions", propertyId],
    queryFn: async () => {
      // Return empty array since exemptions table doesn't exist yet
      console.log("Exemptions table not available yet - returning empty array");
      return [] as Exemption[];
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useSalesComparables(propertyId: string) {
  return useQuery({
    queryKey: ["sales_comparables", propertyId],
    queryFn: async () => {
      // Return empty array since sales_comparables table doesn't exist yet
      console.log("Sales comparables table not available yet - returning empty array");
      return [] as SalesComparable[];
    },
    enabled: !!propertyId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useCreateAgentExecution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (execution: TablesInsert<"agent_executions">) => {
      const { data, error } = await supabase
        .from("agent_executions")
        .insert(execution)
        .select()
        .single();

      if (error) {
        console.error("Failed to create agent execution:", error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent_executions", data.property_id] });
    },
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assessment: TablesInsert<"assessment_history">) => {
      const { data, error } = await supabase
        .from("assessment_history")
        .insert(assessment)
        .select()
        .single();

      if (error) {
        console.error("Failed to create assessment:", error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assessment_history", data.property_id] });
      queryClient.invalidateQueries({ queryKey: ["property", data.property_id] });
    },
  });
}

// Mock function for spatial queries until PostGIS functions are available
export function usePropertiesNearby(latitude: number, longitude: number, radiusKm: number = 1) {
  return useQuery({
    queryKey: ["properties", "nearby", latitude, longitude, radiusKm],
    queryFn: async () => {
      console.log("PostGIS functions not available yet - returning empty array");
      return [] as Property[];
    },
    enabled: !!(latitude && longitude),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
