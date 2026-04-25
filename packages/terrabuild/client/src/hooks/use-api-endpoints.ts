import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ApiEndpoint, InsertApiEndpoint } from '@/types/api';

// NOTE: No /api/endpoints exists in TerraFusion.API. Fails gracefully.

export function useApiEndpoints() {
  const { data: apiEndpoints, isLoading, error } = useQuery<ApiEndpoint[]>({
    queryKey: ["/api/endpoints"],
  });

  const createEndpoint = useMutation({
    mutationFn: (endpoint: InsertApiEndpoint) =>
      apiRequest("/api/endpoints", { method: "POST", body: JSON.stringify(endpoint) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
    }
  });

  const updateEndpointStatus = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) =>
      apiRequest(`/api/endpoints/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
    }
  });

  const deleteEndpoint = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/endpoints/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
    }
  });

  return {
    apiEndpoints,
    isLoading,
    error,
    createEndpoint,
    updateEndpointStatus,
    deleteEndpoint
  };
}
