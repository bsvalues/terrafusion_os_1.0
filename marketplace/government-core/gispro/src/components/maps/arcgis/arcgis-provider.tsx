import React, { useState, useCallback } from 'react';
import { Map as ArcGISMap } from '@esri/react-arcgis';
import { Card } from '@/components/ui/card';

// Define TypeScript interfaces for ArcGIS types
declare global {
  namespace __esri {
    interface Map {
      add: (layer: any) => void;
      remove: (layer: any) => void;
    }

    interface MapView {
      center: [number, number];
      zoom: number;
      ui: {
        components: string[];
      };
    }
  }
}

interface ArcGISProviderProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onMapLoaded?: (map: any, view: any) => void;
  interactive?: boolean;
}

/**
 * ArcGIS Provider Component
 * 
 * This component initializes an ArcGIS map and provides it to child components
 */
export const ArcGISProvider: React.FC<ArcGISProviderProps> = ({
  initialViewState = { longitude: -123.3617, latitude: 44.5646, zoom: 10 }, // Benton County, Oregon
  style = { width: '100%', height: '100%' },
  children,
  onMapLoaded,
  interactive = true
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle map load
  const handleMapLoad = useCallback((map: any, view: any) => {
    console.log('ArcGIS map loaded');
    setMapLoaded(true);
    
    if (onMapLoaded) {
      onMapLoaded(map, view);
    }
  }, [onMapLoaded]);

  // Handle map error
  const handleMapError = useCallback((err: any) => {
    console.error('Error loading ArcGIS map:', err);
    setError('Failed to load ArcGIS map');
  }, []);

  return (
    <div style={style}>
      {error ? (
        <Card className="p-4 text-center"><>

          <p className="text-red-500">{error}</p>
          <p
</>
className="text-sm mt-2">
            Falling back to alternative map provider if available.
          </p>
        </Card>
      ) : (
        <ArcGISMap
          style={{ width: '100%', height: '100%' }}
          mapProperties={{
            basemap: 'streets-vector'
          }}
          viewProperties={{
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom,
            ui: {
              components: interactive ? ['zoom', 'compass', 'attribution'] : []
            }
          }}
          onLoad={handleMapLoad}
          onFail={handleMapError}
        >
          {mapLoaded && children}
        </ArcGISMap>
      )}
    </div>
  );
};

export default ArcGISProvider;