import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { ComparableSnapshot, PushSnapshotRequest } from "@shared/types/comps";

/**
 * Hook for working with property snapshot history and operations
 */
export function useSnapshotHistory(propertyId: string) {
  const queryClient = useQueryClient();

  // Query for fetching snapshots
  const {
    data: snapshots,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/properties/${propertyId}/snapshots`],
    queryFn: async () => {
      return apiRequest<ComparableSnapshot[]>(`/api/properties/${propertyId}/snapshots`);
    },
    enabled: !!propertyId,
  });

  // Mutation for pushing snapshot data to a form
  const pushToFormMutation = useMutation({
    mutationFn: async (params: {
      snapshot: ComparableSnapshot;
      formId: string;
      fieldMappings: Record<string, string>;
    }) => {
      const { snapshot, formId, fieldMappings } = params;

      const payload: PushSnapshotRequest = {
        snapshotId: snapshot.id,
        formId,
        fieldMappings,
      };

      return apiRequest("/api/snapshots/push-to-form", {
        method: "POST",
        data: payload,
      });
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch snapshot data
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/snapshots`] });

      // Show success message
      toast({
        title: "Success",
        description: "Snapshot data pushed to form successfully",
        variant: "default",
      });

      return data;
    },
    onError: (error: Error) => {
      console.error("Error pushing snapshot to form:", error);

      // Show error message
      toast({
        title: "Error",
        description: error.message || "Failed to push snapshot data to form",
        variant: "destructive",
      });
    },
  });

  // Function to push snapshot data to a form
  const pushToForm = async (
    snapshot: ComparableSnapshot,
    formId: string,
    fieldMappings: Record<string, string>
  ) => {
    try {
      await pushToFormMutation.mutateAsync({
        snapshot,
        formId,
        fieldMappings,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    snapshots,
    isLoading,
    error,
    pushToForm,
    refetch,
  };
}
