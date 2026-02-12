import React, { useState, useCallback } from 'react';
import { ArcGISProvider } from './arcgis-provider';

interface ArcGISMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapCreated?: (view: any) => void;
  width?: string | number;
  height?: string | number;
  children?: React.ReactNode;
  interactive?: boolean;
}

/**
 * ArcGIS Map Component
 * 
 * This component provides a simplified interface for creating ArcGIS maps
 */
export function ArcGISMap({
  initialCenter = [-123.3617, 44.5646], // Benton County, Oregon
  initialZoom = 10,
  onMapCreated,
  width = '100%',
  height = '500px',
  children,
  interactive = true
}: ArcGISMapProps) {
  const [mapReady, setMapReady] = useState(false);

  // Handle map load event
  const handleMapLoaded = useCallback((map: any, view: any) => {
    console.log('ArcGIS map created');
    setMapReady(true);
    
    if (onMapCreated) {
      onMapCreated(view);
    }
  }, [onMapCreated]);

  // Configure the style for the map container
  const mapStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <ArcGISProvider
      initialViewState={{
        longitude: initialCenter[0],
        latitude: initialCenter[1],
        zoom: initialZoom
      }}
      style={mapStyle}
      onMapLoaded={handleMapLoaded}
      interactive={interactive}
    >
      {mapReady && children}
    </ArcGISProvider>
  );
}

export default ArcGISMap;