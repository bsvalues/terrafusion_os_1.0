import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { MapTool, MeasurementType, MeasurementUnit, MapLayer } from '@/lib/map-utils';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

// Reference type for EnhancedMapViewer component
export interface EnhancedMapViewerRef {
  getMap: () => any;
  panTo: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  map?: any;
}

export interface EnhancedMapViewerProps {
  /**
   * Width of the map container
   */
  width?: string | number;
  
  /**
   * Height of the map container
   */
  height?: string | number;
  
  /**
   * Center coordinates [latitude, longitude]
   */
  center?: [number, number];
  
  /**
   * Zoom level
   */
  zoom?: number;
  
  /**
   * Map layers to display
   */
  mapLayers?: MapLayer[];
  
  /**
   * Currently active tool
   */
  activeTool?: MapTool;
  
  /**
   * Callback when a parcel is selected
   */
  onParcelSelect?: (parcelId: string) => void;
  
  /**
   * Whether to show drawing tools
   */
  showDrawTools?: boolean;
  
  /**
   * Whether to show measurement tools
   */
  showMeasureTools?: boolean;
  
  /**
   * Current measurement type
   */
  measurementType?: MeasurementType | null;
  
  /**
   * Measurement unit to use
   */
  measurementUnit?: MeasurementUnit;
  
  /**
   * Callback when a measurement is made
   */
  onMeasure?: (value: number, type?: MeasurementType) => void;
  
  /**
   * Children components to render inside the map
   */
  children?: React.ReactNode;
  
  /**
   * Initial features to display on the map
   */
  initialFeatures?: any[];
  
  /**
   * Callback when features are changed
   */
  onFeaturesChanged?: (features: any[]) => void;
}

/**
 * Enhanced Map Viewer component with support for measurements, drawing, and layer control
 */
export const EnhancedMapViewer = forwardRef<EnhancedMapViewerRef, EnhancedMapViewerProps>(
  ({
    width = '100%',
    height = '100%',
    center = [46.23, -119.16], // Benton County, WA
    zoom = 11,
    mapLayers = [],
    activeTool = MapTool.PAN,
    onParcelSelect,
    showDrawTools = false,
    showMeasureTools = false,
    measurementType = null,
    measurementUnit = MeasurementUnit.FEET,
    onMeasure,
    children,
    initialFeatures = [],
    onFeaturesChanged
  }, ref) => {
    const mapRef = useRef<any>(null);
    
    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
      panTo: (lat: number, lng: number) => {
        console.log(`Pan to: ${lat}, ${lng}`);
        // In a real implementation, this would pan the map
      },
      setZoom: (zoom: number) => {
        console.log(`Set zoom: ${zoom}`);
        // In a real implementation, this would set the map zoom
      },
      map: mapRef.current
    }));
    
    // Now using actual Leaflet MapContainer
    return (
      <div
        ref={mapRef}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Actual Leaflet Map with MapContainer */}
        <MapContainer 
          center={[center[0], center[1]]} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          {/* Base tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Child components (including ParcelOverlay) can now use Leaflet context */}
          {children}
        </MapContainer>
        
        {/* Debug Info */}
        <div 
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          <div>Tool: {activeTool}</div>
          {activeTool === MapTool.MEASURE && measurementType && (
            <div>Measuring: {measurementType} in {measurementUnit}</div>
          )}
        </div>
      </div>
    );
  }
);

EnhancedMapViewer.displayName = 'EnhancedMapViewer';

export default EnhancedMapViewer;