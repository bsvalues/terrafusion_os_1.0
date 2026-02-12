import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface GISLayer {
  id: number;
  name: string;
  description: string | null;
  type: string;
  url: string | null;
  attribution: string | null;
  format: string | null;
  style: object | null;
  is_visible: boolean;
  is_basemap: boolean;
  min_zoom: number | null;
  max_zoom: number | null;
  opacity: number;
  z_index: number;
  created_at: string;
  updated_at: string;
  user_id: number | null;
}

interface GISFeatureCollection {
  id: number;
  layer_id: number;
  name: string;
  description: string | null;
  feature_type: string;
  features: any;
  properties: any | null;
  bbox: number[] | null;
  created_at: string;
  updated_at: string;
  user_id: number | null;
}

interface GISMapProject {
  id: number;
  name: string;
  description: string | null;
  center: number[] | null;
  zoom: number | null;
  active_layers: number[] | null;
  settings: object | null;
  created_at: string;
  updated_at: string;
  user_id: number | null;
}

export function useGISServices() {
  // Get all GIS layers
  const useLayers = () => {
    return useQuery<GISLayer[]>({
      queryKey: ['/api/gis/layers'],
      staleTime: 60000,
    });
  };

  // Get a specific GIS layer
  const useLayer = (id: number) => {
    return useQuery<GISLayer>({
      queryKey: ['/api/gis/layers', id],
      staleTime: 60000,
    });
  };

  // Create a new GIS layer
  const useCreateLayer = () => {
    return useMutation({
      mutationFn: async (layerData: Omit<GISLayer, 'id' | 'created_at' | 'updated_at'>) => {
        const response = await fetch('/api/gis/layers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(layerData),
        });

        if (!response.ok) {
          throw new Error('Failed to create GIS layer');
        }

        return await response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/gis/layers'] });
      },
    });
  };

  // Update a GIS layer
  const useUpdateLayer = () => {
    return useMutation({
      mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
        const response = await fetch(`/api/gis/layers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update GIS layer');
        }

        return await response.json();
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/gis/layers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/gis/layers', variables.id] });
      },
    });
  };

  // Get all feature collections
  const useFeatureCollections = (layerId?: number) => {
    return useQuery<GISFeatureCollection[]>({
      queryKey: layerId ? ['/api/gis/features', { layerId }] : ['/api/gis/features'],
      staleTime: 60000,
    });
  };

  // Get a specific feature collection
  const useFeatureCollection = (id: number) => {
    return useQuery<GISFeatureCollection>({
      queryKey: ['/api/gis/features', id],
      staleTime: 60000,
    });
  };

  // Get all map projects
  const useMapProjects = () => {
    return useQuery<GISMapProject[]>({
      queryKey: ['/api/gis/projects'],
      staleTime: 60000,
    });
  };

  // Get a specific map project
  const useMapProject = (id: number) => {
    return useQuery<GISMapProject>({
      queryKey: ['/api/gis/projects', id],
      staleTime: 60000,
    });
  };

  // Request schema conversion
  const useSchemaConversion = () => {
    return useMutation({
      mutationFn: async (conversionData: any) => {
        const response = await fetch('/api/gis/convert-schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversionData),
        });

        if (!response.ok) {
          throw new Error('Failed to convert schema');
        }

        return await response.json();
      },
    });
  };

  // Normalize data
  const useDataNormalization = () => {
    return useMutation({
      mutationFn: async (normalizationData: any) => {
        const response = await fetch('/api/gis/normalize-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalizationData),
        });

        if (!response.ok) {
          throw new Error('Failed to normalize data');
        }

        return await response.json();
      },
    });
  };

  return {
    useLayers,
    useLayer,
    useCreateLayer,
    useUpdateLayer,
    useFeatureCollections,
    useFeatureCollection,
    useMapProjects,
    useMapProject,
    useSchemaConversion,
    useDataNormalization,
  };
}
