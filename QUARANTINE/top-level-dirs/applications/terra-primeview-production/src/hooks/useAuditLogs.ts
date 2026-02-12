
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AuditLog = Tables<"audit_logs">;

export function useAuditLogs(filters?: {
  tableName?: string;
  recordId?: string;
  changedBy?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["audit_logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          users:changed_by (
            first_name,
            last_name,
            email
          )
        `)
        .order("changed_at", { ascending: false });

      if (filters?.tableName) {
        query = query.eq("table_name", filters.tableName);
      }
      if (filters?.recordId) {
        query = query.eq("record_id", filters.recordId);
      }
      if (filters?.changedBy) {
        query = query.eq("changed_by", filters.changedBy);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to fetch audit logs:", error);
        // Return empty array if table doesn't exist yet
        return [];
      }
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePropertyAuditLogs(propertyId: string) {
  return useAuditLogs({
    tableName: "properties",
    recordId: propertyId,
    limit: 50
  });
}

export function useAssessmentAuditLogs(assessmentId: string) {
  return useAuditLogs({
    tableName: "assessment_history",
    recordId: assessmentId,
    limit: 20
  });
}
