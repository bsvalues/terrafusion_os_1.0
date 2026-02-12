
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type County = Tables<"counties">;

export function useCounties() {
  return useQuery({
    queryKey: ["counties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counties")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("Failed to fetch counties:", error);
        throw error;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCounty(countyId: string) {
  return useQuery({
    queryKey: ["county", countyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counties")
        .select("*")
        .eq("id", countyId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch county:", error);
        throw error;
      }
      return data;
    },
    enabled: !!countyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Mock function for county statistics until view is available
export function useCountyStats(countyId: string) {
  return useQuery({
    queryKey: ["county", "stats", countyId],
    queryFn: async () => {
      console.log("County assessment stats view not available yet - returning null");
      return null;
    },
    enabled: !!countyId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
