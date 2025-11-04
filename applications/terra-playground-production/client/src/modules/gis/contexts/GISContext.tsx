import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useGISServices } from '@/hooks/use-gis-services';

// Updated GIS Layer interface to work with different map backends
interface GISLayer {
  id: string; // Use string to be more flexible with multiple backends
  name: string;
  type: 'base' | 'vector' | 'raster';
  visible: boolean;
  opacity: number;
  source?: string;
  metadata?: Record<string, any>;
}

// Interface for GIS context
interface GISContextType {
  // Mapbox and loading state properties
  isMapLoaded: boolean;
  mapboxTokenAvailable: boolean;
  setMapLoaded: (loaded: boolean) => void;
  mapboxToken?: string;
  mapLoadErrors: string[];
  addMapError: (error: string) => void;
  clearMapErrors: () => void;
  useOpenStreetMapFallback: boolean;

  // Layer management
  visibleLayers: Record<string, boolean>; // Changed to map of layer IDs to visibility
  toggleLayerVisibility: (layerId: string) => void;
  baseMapType: 'osm' | 'satellite' | 'terrain'; // For OpenLayers/QGIS integration
  setBaseMapType: (type: 'osm' | 'satellite' | 'terrain') => void;

  // Map state
  center: [number, number];
  setCenter: (center: [number, number]) => void;
  zoom: number;
  setZoom: (zoom: number) => void;

  // Feature selection
  selectedFeatureId: string | null;
  setSelectedFeatureId: (id: string | null) => void;

  // Layer manipulation
  layerOpacity: Record<string, number>; // Changed to use string IDs
  setLayerOpacity: (layerId: string, opacity: number) => void;

  // User interface state
  isLayersPanelOpen: boolean;
  toggleLayersPanel: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;

  // GIS operations
  createSnapshot: () => Promise<string>;
  exportCurrentView: (format: 'png' | 'jpg' | 'pdf') => Promise<string>;
}

// Create context with default values
const GISContext = createContext<GISContextType>({
  // Mapbox and loading
  isMapLoaded: false,
  mapboxTokenAvailable: false,
  setMapLoaded: () => {},
  mapboxToken: undefined,
  mapLoadErrors: [],
  addMapError: () => {},
  clearMapErrors: () => {},
  useOpenStreetMapFallback: true,

  // Layer management
  visibleLayers: {},
  toggleLayerVisibility: () => {},
  baseMapType: 'osm',
  setBaseMapType: () => {},

  // Map state
  center: [-119.7, 46.2], // Benton County, WA coordinates
  setCenter: () => {},
  zoom: 10,
  setZoom: () => {},

  // Feature selection
  selectedFeatureId: null,
  setSelectedFeatureId: () => {},

  // Layer manipulation
  layerOpacity: {},
  setLayerOpacity: () => {},

  // User interface state
  isLayersPanelOpen: false,
  toggleLayersPanel: () => {},
  isFullScreen: false,
  toggleFullScreen: () => {},

  // Loading states
  isLoading: false,
  loadingMessage: null,

  // GIS operations
  createSnapshot: async () => '',
  exportCurrentView: async () => '',
});

// Provider component
export const GISProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { useLayers } = useGISServices();
  const { data: layers, isLoading: isLayersLoading } = useLayers();

  // Mapbox and loading state
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | undefined>(undefined);
  const [mapLoadErrors, setMapLoadErrors] = useState<string[]>([]);
  const [useOpenStreetMapFallback, setUseOpenStreetMapFallback] = useState(true);

  // Layer management
  const [visibleLayers, setVisibleLayersState] = useState<Record<string, boolean>>({});
  const [baseMapType, setBaseMapType] = useState<'osm' | 'satellite' | 'terrain'>('osm');

  // Map state
  const [center, setCenter] = useState<[number, number]>([-119.7, 46.2]); // Benton County, WA
  const [zoom, setZoom] = useState<number>(10);

  // Feature selection
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  // Layer manipulation
  const [layerOpacity, setLayerOpacityState] = useState<Record<string, number>>({});

  // UI state
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(isLayersLoading);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(
    isLayersLoading ? 'Loading GIS layers...' : null
  );

  // Check if Mapbox token is available
  useEffect(() => {
    try {
      // Check for both possible env variable names
      const token = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.MAPBOX_TOKEN || '';

      if (token && token.trim().length > 0) {
        setMapboxToken(token);
        setUseOpenStreetMapFallback(false);
      } else {
        setMapboxToken(undefined);
        setUseOpenStreetMapFallback(true);
      }
    } catch (error) {
      console.error('Error accessing environment variables:', error);
      setMapboxToken(undefined);
      setUseOpenStreetMapFallback(true);
      addMapError('Failed to access environment variables for map configuration');
    }
  }, []);

  // Set initial visible layers when layers are loaded
  useEffect(() => {
    if (layers) {
      // Convert old layer format to new format
      const visibilityMap: Record<string, boolean> = {};
      const opacityMap: Record<string, number> = {};

      layers.forEach(layer => {
        const layerId = String(layer.id);
        visibilityMap[layerId] = layer.is_visible && !layer.is_basemap;
        opacityMap[layerId] = layer.opacity / 100; // Convert from percentage to decimal
      });

      setVisibleLayersState(visibilityMap);
      setLayerOpacityState(opacityMap);
    }
  }, [layers]);

  // Update loading state when layers are loading
  useEffect(() => {
    setIsLoading(isLayersLoading);
    setLoadingMessage(isLayersLoading ? 'Loading GIS layers...' : null);
  }, [isLayersLoading]);

  const setMapLoaded = (loaded: boolean) => {
    setIsMapLoaded(loaded);
  };

  const addMapError = (error: string) => {
    setMapLoadErrors(prev => [...prev, error]);
  };

  const clearMapErrors = () => {
    setMapLoadErrors([]);
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setVisibleLayersState(prev => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  // Set layer opacity
  const setLayerOpacity = (layerId: string, opacity: number) => {
    setLayerOpacityState(prev => ({
      ...prev,
      [layerId]: opacity,
    }));
  };

  // Toggle layers panel
  const toggleLayersPanel = () => {
    setIsLayersPanelOpen(prev => !prev);
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  // Create snapshot
  const createSnapshot = async (): Promise<string> => {
    // This would call a method on the map instance to create a snapshot
    // For now, just return a placeholder
    return Promise.resolve('snapshot.png');
  };

  // Export current view
  const exportCurrentView = async (format: 'png' | 'jpg' | 'pdf'): Promise<string> => {
    // This would call a method to export the current view in the specified format
    // For now, just return a placeholder
    return Promise.resolve(`export.${format}`);
  };

  const value: GISContextType = {
    // Mapbox and loading
    isMapLoaded,
    mapboxTokenAvailable: !!mapboxToken,
    setMapLoaded,
    mapboxToken,
    mapLoadErrors,
    addMapError,
    clearMapErrors,
    useOpenStreetMapFallback,

    // Layer management
    visibleLayers,
    toggleLayerVisibility,
    baseMapType,
    setBaseMapType,

    // Map state
    center,
    setCenter,
    zoom,
    setZoom,

    // Feature selection
    selectedFeatureId,
    setSelectedFeatureId,

    // Layer manipulation
    layerOpacity,
    setLayerOpacity,

    // User interface state
    isLayersPanelOpen,
    toggleLayersPanel,
    isFullScreen,
    toggleFullScreen,

    // Loading states
    isLoading,
    loadingMessage,

    // GIS operations
    createSnapshot,
    exportCurrentView,
  };

  return <GISContext.Provider value={value}>{children}</GISContext.Provider>;
};

// Custom hook for using GIS context
export const useGIS = () => useContext(GISContext);
