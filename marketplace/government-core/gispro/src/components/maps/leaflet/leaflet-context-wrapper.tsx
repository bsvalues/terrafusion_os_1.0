import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

// Fix for the "Map is not found in the element's scope" error
import { Map } from 'leaflet';

interface LeafletContextWrapperProps {
  children: React.ReactNode;
  center?: [number, number];
  zoom?: number;
  width?: string | number;
  height?: string | number;
  visible?: boolean;
  mapboxInstance?: mapboxgl.Map | null;
  onLeafletMapReady?: (leafletMap: L.Map) => void;
}

/**
 * LeafletContextWrapper
 * 
 * This component provides a Leaflet map context for components that depend on it,
 * such as ParcelOverlay, when using non-Leaflet map providers like Mapbox or ArcGIS.
 * 
 * It creates an invisible or partially transparent Leaflet map on top of the
 * existing map, allowing Leaflet-dependent components to function properly.
 */
export function LeafletContextWrapper({
  children,
  center = [46.23, -119.16], // Benton County, WA
  zoom = 11,
  width = '100%',
  height = '100%',
  visible = false,
  mapboxInstance = null,
  onLeafletMapReady
}: LeafletContextWrapperProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [position, setPosition] = useState<[number, number]>(center);
  const [zoomLevel, setZoomLevel] = useState<number>(zoom);
  
  // Sync Mapbox position with Leaflet map position if Mapbox instance is provided
  useEffect(() => {
    if (!mapboxInstance) return;
    
    const syncMapPosition = () => {
      const center = mapboxInstance.getCenter();
      setPosition([center.lat, center.lng]);
      setZoomLevel(mapboxInstance.getZoom());
    };
    
    // Sync initially
    syncMapPosition();
    
    // Add event listeners for synchronization
    mapboxInstance.on('move', syncMapPosition);
    mapboxInstance.on('zoom', syncMapPosition);
    
    return () => {
      mapboxInstance.off('move', syncMapPosition);
      mapboxInstance.off('zoom', syncMapPosition);
    };
  }, [mapboxInstance]);
  
  // Call onLeafletMapReady callback when map is created
  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
    if (onLeafletMapReady) {
      onLeafletMapReady(map);
    }
  };
  
  // Determine the wrapper style based on visibility
  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    zIndex: 400, // Above the base map but below UI elements
    opacity: visible ? 0.5 : 0,
    pointerEvents: 'none', // Don't intercept mouse events
  };
  
  return (
    <div style={wrapperStyle} className="leaflet-context-wrapper">
      <MapContainer
        center={position}
        zoom={zoomLevel}
        style={{ width: '100%', height: '100%' }}
        ref={(map) => map && handleMapReady(map)}
        attributionControl={false}
        zoomControl={false}
        whenReady={() => {
          if (mapRef.current && onLeafletMapReady) {
            onLeafletMapReady(mapRef.current);
          }
        }}
      >
        {/* Add a transparent tile layer if the wrapper should be visible */}
        {visible && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.3}
          />
        )}
        
        {/* Render children within the Leaflet context */}
        {children}
      </MapContainer>
    </div>
  );
}

export default LeafletContextWrapper;