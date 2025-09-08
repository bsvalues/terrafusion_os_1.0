import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchBuildingFootprints, boundsToTileCoordinates } from '@/lib/building-footprint-service';

interface BuildingFootprintsLayerProps {
  enabled?: boolean;
  fillColor?: string;
  strokeColor?: string;
  opacity?: number;
  weight?: number;
}

/**
 * Dynamic layer component that shows building footprints on the map.
 * Automatically loads data when the map is moved or zoomed.
 */
export function BuildingFootprintsLayer({
  enabled = true,
  fillColor = '#3388ff',
  strokeColor = '#2b6cb0',
  opacity = 0.2,
  weight = 1
}: BuildingFootprintsLayerProps) {
  const map = useMap();
  const [geoJsonLayer, setGeoJsonLayer] = useState<L.GeoJSON | null>(null);
  
  // Set up the GeoJSON layer with the desired styling
  useEffect(() => {
    const layer = L.geoJSON([], {
      style: {
        fillColor,
        color: strokeColor,
        weight,
        opacity: 1,
        fillOpacity: opacity
      }
    });
    
    if (enabled) {
      layer.addTo(map);
    }
    
    setGeoJsonLayer(layer);
    
    return () => {
      map.removeLayer(layer);
    };
  }, [map, enabled, fillColor, strokeColor, opacity, weight]);
  
  // Load building footprints when the map changes
  useEffect(() => {
    if (!geoJsonLayer || !enabled) return;
    
    let isMounted = true;
    
    // Function to update building data
    const updateBuildingData = async () => {
      try {
        // Clear existing data
        geoJsonLayer.clearLayers();
        
        // Get visible map bounds and convert to tile coordinates
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        
        // Skip if zoom is too low (to avoid excessive API calls)
        if (zoom < 14) return;
        
        // Get tile coordinates
        const tiles = boundsToTileCoordinates(bounds, zoom);
        
        // Fetch data for each tile
        for (const [z, x, y] of tiles) {
          const data = await fetchBuildingFootprints(z, x, y);
          
          if (data && isMounted) {
            geoJsonLayer.addData(data as any);
          }
        }
      } catch (error) {
        console.error('Error updating building footprints:', error);
      }
    };
    
    // Update on moveend (pan or zoom)
    const handleMoveEnd = () => {
      updateBuildingData();
    };
    
    // Initial load
    updateBuildingData();
    
    // Add event listener
    map.on('moveend', handleMoveEnd);
    
    // Cleanup
    return () => {
      isMounted = false;
      map.off('moveend', handleMoveEnd);
    };
  }, [map, geoJsonLayer, enabled]);
  
  // This component doesn't render anything directly,
  // it just adds a layer to the map
  return null;
}