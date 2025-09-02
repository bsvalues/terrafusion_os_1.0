import React from 'react';
import { cn } from '@/lib/utils';
import LeafletProvider from './leaflet-provider';

export interface LeafletMapProps {
  id?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  longitude?: number;
  latitude?: number;
  zoom?: number;
  children?: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
}

/**
 * LeafletMap component
 * A wrapper around LeafletProvider that provides a consistent interface
 * for both Leaflet and Mapbox maps.
 */
export function LeafletMap({
  id = 'leaflet-map',
  className,
  width = '100%',
  height = '100%',
  longitude = -119.16, // Benton County, WA
  latitude = 46.23,
  zoom = 11,
  children,
  onMapReady
}: LeafletMapProps) {
  // Configure styles
  const mapContainerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div className={cn('leaflet-map-container relative', className)} style={mapContainerStyle}>
      <LeafletProvider
        id={id}
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        onMapReady={onMapReady}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {children}
      </LeafletProvider>
    </div>
  );
}

export default LeafletMap;