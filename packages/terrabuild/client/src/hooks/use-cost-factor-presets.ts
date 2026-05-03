import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CostFactorPreset } from '@/types/api';
import { useMutation, useQuery } from "@tanstack/react-query";

// NOTE: No /api/costforge/cost-factor-presets endpoint exists yet in TerraFusion.API.
// Queries fail gracefully via React Query error state.

export function useCostFactorPresets() {
  const { toast } = useToast();

  const getAllPresets = useQuery<CostFactorPreset[]>({
    queryKey: ['/api/costforge/cost-factor-presets'],
    staleTime: 5 * 60 * 1000,
  });

  const getDefaultPresets = useQuery<CostFactorPreset[]>({
    queryKey: ['/api/costforge/cost-factor-presets/defaults'],
    staleTime: 5 * 60 * 1000,
  });

  const getUserPresets = (userId: number) => {
    return useQuery<CostFactorPreset[]>({
      queryKey: ['/api/costforge/cost-factor-presets/user', userId],
      staleTime: 5 * 60 * 1000,
    });
  };

  const getPreset = (id: number) => {
    return useQuery<CostFactorPreset>({
      queryKey: ['/api/costforge/cost-factor-presets', id],
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    });
  };

  const createPresetMutation = useMutation({
    mutationFn: (preset: Omit<CostFactorPreset, 'id'>) =>
      apiRequest('/api/costforge/cost-factor-presets', { method: 'POST', body: JSON.stringify(preset) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/costforge/cost-factor-presets'] });
      toast({ title: "Success", description: "Cost factor preset created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create cost factor preset", variant: "destructive" });
    }
  });

  const updatePresetMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Omit<CostFactorPreset, 'id'>>) =>
      apiRequest(`/api/costforge/cost-factor-presets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/costforge/cost-factor-presets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/costforge/cost-factor-presets', variables.id] });
      toast({ title: "Success", description: "Cost factor preset updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update cost factor preset", variant: "destructive" });
    }
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/costforge/cost-factor-presets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/costforge/cost-factor-presets'] });
      toast({ title: "Success", description: "Cost factor preset deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete cost factor preset", variant: "destructive" });
    }
  });

  const createPreset = (preset: Omit<CostFactorPreset, 'id'>) => createPresetMutation.mutateAsync(preset);
  const updatePreset = (args: { id: number } & Partial<Omit<CostFactorPreset, 'id'>>) => updatePresetMutation.mutateAsync(args);
  const deletePreset = (id: number) => deletePresetMutation.mutateAsync(id);

  return {
    getAllPresets,
    getDefaultPresets,
    getUserPresets,
    getPreset,
    createPreset,
    updatePreset,
    deletePreset,
  };
}
