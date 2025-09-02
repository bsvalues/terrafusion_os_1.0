import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, MapContainerProps } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

export interface LeafletProviderProps extends MapContainerProps {
  children?: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
}

/**
 * Map events handler component
 * Handles map events and provides access to the map instance
 */
function MapEventsHandler({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  
  // Call onMapReady immediately since the map is already available
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
}

/**
 * LeafletProvider component
 * Provides a Leaflet map container with proper context for leaflet components
 */
export function LeafletProvider({
  children,
  onMapReady,
  center = [46.23, -119.16], // Benton County, WA
  zoom = 11,
  style,
  className,
  ...props
}: LeafletProviderProps) {
  return (
    <MapContainer
      center={center as [number, number]}
      zoom={zoom}
      style={{
        ...style,
        height: style?.height || '100%',
        width: style?.width || '100%'
      }}
      className={className}
      {...props}
    >
      {/* Default base layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Events handler */}
      <MapEventsHandler onMapReady={onMapReady} />
      
      {/* Children components */}
      {children}
    </MapContainer>
  );
}

export default LeafletProvider;