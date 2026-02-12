
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type SystemConfig = Tables<"system_config">;

export function useSystemConfig(countyId: string, category?: string) {
  return useQuery({
    queryKey: ["system_config", countyId, category],
    queryFn: async () => {
      let query = supabase
        .from("system_config")
        .select("*")
        .eq("county_id", countyId)
        .eq("is_active", true)
        .order("config_key");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!countyId,
  });
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"system_config"> }) => {
      const { data, error } = await supabase
        .from("system_config")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["system_config", data.county_id] });
    },
  });
}

export function useCreateSystemConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: TablesInsert<"system_config">) => {
      const { data, error } = await supabase
        .from("system_config")
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["system_config", data.county_id] });
    },
  });
}
