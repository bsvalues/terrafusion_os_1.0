import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { getMapboxToken, getMapboxTokenAsync } from '../lib/env';

// Initially set Mapbox access token from environment
// This might be empty, but will be updated in the hook
mapboxgl.accessToken = getMapboxToken();

export interface UseMapboxOptions {
  // Initial map center coordinates (longitude, latitude)
  center?: [number, number];
  
  // Initial zoom level
  zoom?: number;
  
  // Map container ID (defaults to 'map')
  containerId?: string;
  
  // Map style URL or predefined style
  style?: string;
  
  // Enable map controls (navigation, geolocate, scale, etc)
  controls?: boolean;
  
  // Draw controls (requires mapbox-gl-draw)
  drawControls?: boolean;
  
  // Initial data to load on the map
  initialData?: GeoJSON.FeatureCollection;
  
  // Callback when the map is fully loaded
  onMapLoaded?: (map: mapboxgl.Map) => void;
  
  // Callback when the map viewport changes
  onViewportChange?: (viewport: { center: [number, number]; zoom: number; }) => void;
}

export interface UseMapboxResult {
  // Mapbox instance (null until loaded)
  map: mapboxgl.Map | null;
  
  // Map loaded state
  loaded: boolean;
  
  // Map container ref to attach to a div
  mapContainer: React.RefObject<HTMLDivElement>;
  
  // Current viewport
  viewport: {
    center: [number, number];
    zoom: number;
  };
  
  // Map operations
  fitBounds: (bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => void;
  flyTo: (center: [number, number], zoom?: number, options?: any) => void;
  
  // Data operations  
  addSource: (id: string, source: any) => void;
  updateSource: (id: string, data: GeoJSON.FeatureCollection) => void;
  removeSource: (id: string) => void;
  
  // Layer operations
  addLayer: (layer: mapboxgl.AnyLayer) => void;
  removeLayer: (id: string) => void;
}

/**
 * React hook for Mapbox GL JS map integration
 */
export function useMapbox({
  center = [-123.1187, 44.0521], // Default: Benton County, Oregon
  zoom = 10,
  style = 'mapbox://styles/mapbox/streets-v11',
  controls = true,
  drawControls = false,
  initialData,
  onMapLoaded,
  onViewportChange
}: UseMapboxOptions = {}): UseMapboxResult {
  // Map instance state
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  
  // Map viewport state
  const [viewport, setViewport] = useState<{center: [number, number], zoom: number}>({
    center,
    zoom
  });
  
  // Container ref for map attachment
  const mapContainer = useRef<HTMLDivElement>(null);
  
  // Initialize map when component mounts
  useEffect(() => {
    let mapInstance: mapboxgl.Map | null = null;
    
    const initializeMap = async () => {
      // If token not already set, try to fetch it
      if (!mapboxgl.accessToken) {
        try {
          const token = await getMapboxTokenAsync();
          if (token) {
            mapboxgl.accessToken = token;
            console.log('Initializing Mapbox map with token:', token.substring(0, 10) + '...');
          } else {
            console.error('Mapbox access token is required but could not be retrieved.');
            return;
          }
        } catch (error) {
          console.error('Failed to get Mapbox token:', error);
          return;
        }
      }
      
      if (!mapContainer.current) return;
      
      // Create the map instance
      mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style,
        center,
        zoom,
        attributionControl: false,
        antialias: true
      });
      
      // Add navigation controls if requested
      if (controls) {
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapInstance.addControl(new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true
        }), 'top-right');
        mapInstance.addControl(new mapboxgl.ScaleControl({
          maxWidth: 150,
          unit: 'imperial'
        }), 'bottom-right');
        mapInstance.addControl(new mapboxgl.AttributionControl({
          compact: true
        }), 'bottom-left');
      }
      
      // Handle map load event
      mapInstance.on('load', () => {
        console.log('Map loaded successfully');
        setLoaded(true);
        
        // Add initial data source if provided
        if (initialData) {
          mapInstance?.addSource('initial-data', {
            type: 'geojson',
            data: initialData
          });
          
          // Add a layer for points
          mapInstance?.addLayer({
            id: 'initial-points',
            type: 'circle',
            source: 'initial-data',
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
              'circle-radius': 6,
              'circle-color': '#ff0000'
            }
          });
          
          // Add a layer for lines
          mapInstance?.addLayer({
            id: 'initial-lines',
            type: 'line',
            source: 'initial-data',
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: {
              'line-color': '#ff0000',
              'line-width': 2
            }
          });
          
          // Add a layer for polygons
          mapInstance?.addLayer({
            id: 'initial-polygons',
            type: 'fill',
            source: 'initial-data',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
              'fill-color': '#ff0000',
              'fill-opacity': 0.4,
              'fill-outline-color': '#ff0000'
            }
          });
        }
        
        // Call onMapLoaded callback if provided
        if (onMapLoaded && mapInstance) {
          onMapLoaded(mapInstance);
        }
      });
      
      // Track viewport changes
      mapInstance.on('moveend', () => {
        if (!mapInstance) return;
        
        const mapCenter = mapInstance.getCenter();
        const newCenter: [number, number] = [mapCenter.lng, mapCenter.lat];
        const newZoom = mapInstance.getZoom();
        
        setViewport({
          center: newCenter,
          zoom: newZoom
        });
        
        // Call onViewportChange callback if provided
        if (onViewportChange) {
          onViewportChange({
            center: newCenter,
            zoom: newZoom
          });
        }
      });
      
      // Store map instance
      setMap(mapInstance);
    };
    
    // Call the async initialization function
    initializeMap();
    
    // Clean up map on unmount
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMap(null);
        setLoaded(false);
      }
    };
  }, [center, zoom, style, controls, initialData, onMapLoaded, onViewportChange]);
  
  // Fit bounds to a given area
  const fitBounds = useCallback((bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => {
    if (!map) return;
    
    map.fitBounds(bounds, options);
  }, [map]);
  
  // Fly to a given position
  const flyTo = useCallback((center: [number, number], zoom?: number, options?: any) => {
    if (!map) return;
    
    map.flyTo({
      center,
      zoom,
      ...options
    });
  }, [map]);
  
  // Add a new source
  const addSource = useCallback((id: string, source: any) => {
    if (!map || !loaded) return;
    
    if (!map.getSource(id)) {
      map.addSource(id, source);
    }
  }, [map, loaded]);
  
  // Update source data
  const updateSource = useCallback((id: string, data: GeoJSON.FeatureCollection) => {
    if (!map || !loaded) return;
    
    const source = map.getSource(id) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(data);
    }
  }, [map, loaded]);
  
  // Remove a source
  const removeSource = useCallback((id: string) => {
    if (!map || !loaded) return;
    
    if (map.getSource(id)) {
      // First remove any layers that might be using this source
      map.getStyle().layers.forEach(layer => {
        if (layer.source === id) {
          map.removeLayer(layer.id);
        }
      });
      
      map.removeSource(id);
    }
  }, [map, loaded]);
  
  // Add a new layer
  const addLayer = useCallback((layer: mapboxgl.AnyLayer) => {
    if (!map || !loaded) return;
    
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer);
    }
  }, [map, loaded]);
  
  // Remove a layer
  const removeLayer = useCallback((id: string) => {
    if (!map || !loaded) return;
    
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
  }, [map, loaded]);
  
  return {
    map,
    loaded,
    mapContainer,
    viewport,
    fitBounds,
    flyTo,
    addSource,
    updateSource,
    removeSource,
    addLayer,
    removeLayer
  };
}