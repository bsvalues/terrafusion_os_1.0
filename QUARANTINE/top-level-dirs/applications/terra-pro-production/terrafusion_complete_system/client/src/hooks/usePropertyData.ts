import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

/**
 * Custom hook for fetching and updating property data
 */
export function usePropertyData() {
  // Fetch a single property
  const useProperty = (propertyId: number | undefined) => {
    return useQuery({
      queryKey: ["/api/properties", propertyId],
      queryFn: async () => {
        if (!propertyId) return null;
        return await apiRequest(`/api/properties/${propertyId}`);
      },
      enabled: !!propertyId,
    });
  };

  // Fetch properties for the current user
  const useProperties = () => {
    return useQuery({
      queryKey: ["/api/properties"],
      queryFn: async () => {
        return await apiRequest("/api/properties");
      },
    });
  };

  // Create a new property
  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      return await apiRequest("/api/properties", {
        method: "POST",
        data: propertyData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });

  // Update an existing property
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/properties/${id}`, {
        method: "PUT",
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.id] });
    },
  });

  // Delete a property
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/properties/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });

  // Trigger property data retrieval from public records
  const retrievePropertyDataMutation = useMutation({
    mutationFn: async ({ propertyId, reportId }: { propertyId: number; reportId?: number }) => {
      // First, get the property data
      const property = await apiRequest<any>(`/api/properties/${propertyId}`);

      // If we have a report ID, use that, otherwise get the first report for this property
      let targetReportId = reportId;
      if (!targetReportId) {
        const reports = await apiRequest<any[]>(`/api/reports?propertyId=${propertyId}`);
        if (reports && reports.length > 0) {
          targetReportId = reports[0].id;
        } else {
          // Create a new report if none exists
          const newReport = await apiRequest<any>(`/api/reports`, {
            method: "POST",
            data: {
              propertyId,
              status: "in_progress",
              reportType: "URAR",
              formType: "URAR",
              purpose: "Refinance",
              effectiveDate: new Date().toISOString(),
              reportDate: new Date().toISOString(),
            },
          });
          targetReportId = newReport.id;
        }
      }

      // Trigger the data analysis via the AI
      if (targetReportId) {
        await apiRequest("/api/ai/analyze-property", {
          method: "POST",
          data: { propertyId },
        });
      } else {
        throw new Error("Could not find or create a report for this property");
      }

      // Return the updated property
      return await apiRequest<any>(`/api/properties/${propertyId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
  });

  return {
    useProperty,
    useProperties,
    createProperty: createPropertyMutation.mutateAsync,
    updateProperty: updatePropertyMutation.mutateAsync,
    deleteProperty: deletePropertyMutation.mutateAsync,
    retrievePropertyData: retrievePropertyDataMutation.mutateAsync,

    // Loading states
    isCreatingProperty: createPropertyMutation.isPending,
    isUpdatingProperty: updatePropertyMutation.isPending,
    isDeletingProperty: deletePropertyMutation.isPending,
    isRetrievingPropertyData: retrievePropertyDataMutation.isPending,
  };
}
