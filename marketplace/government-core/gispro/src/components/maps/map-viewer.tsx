import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  LayersControl, 
  ScaleControl,
  ZoomControl,
  useMap
} from 'react-leaflet';
import { LatLngBounds, LatLngTuple } from 'leaflet';
import { MapLayer } from '@/lib/map-utils';
import { 
  getDummyParcelData, 
  createViewportForParcels, 
  GeoJSONFeature,
  GeoJSONCollection
} from '@/lib/map-utils';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { illustrations } from '@/lib/illustrations';
import { HelpCircle  } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';

// This will be used to focus map on a specific feature or location
const MapUpdater = ({ 
  center, 
  zoom, 
  parcelData 
}: { 
  center?: LatLngTuple, 
  zoom?: number,
  parcelData?: GeoJSONFeature
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    } else if (parcelData) {
      // If we have parcel data, create a viewport that encompasses the parcel
      const viewport = createViewportForParcels([parcelData]);
      map.setView(viewport.center, viewport.zoom);
    }
  }, [map, center, zoom, parcelData]);
  
  return null;
};

type MapViewerProps = {
  mapLayers?: MapLayer[];
  parcelId?: string;
  center?: LatLngTuple;
  zoom?: number;
  enableLayerControl?: boolean;
  onParcelSelect?: (parcelId: string) => void;
};

export function MapViewer({ 
  mapLayers = [], 
  parcelId,
  center = [46.2087, -119.1360], // Default to Benton County
  zoom = 12,
  enableLayerControl = false,
  onParcelSelect
}: MapViewerProps) {
  const [parcelData, setParcelData] = useState<GeoJSONFeature | undefined>();
  
  // When parcelId changes, fetch the parcel data
  useEffect(() => {
    if (parcelId) {
      // In a real implementation, we would fetch this from the API
      // For now, use the dummy data generator
      setParcelData(getDummyParcelData(parcelId));
    } else {
      setParcelData(undefined);
    }
  }, [parcelId]);
  
  // Function to handle clicking on a parcel
  const handleParcelClick = (feature: GeoJSONFeature) => {
    if (onParcelSelect && feature.properties && feature.properties.parcelId) {
      onParcelSelect(feature.properties.parcelId);
    }
  };
  
  return (
    <div className="w-full h-full min-h-[400px] rounded-md overflow-hidden border border-neutral-200 relative">
      <div className="absolute top-2 right-2 z-[1000]">
        <IllustratedTooltip
          illustration={illustrations.map.general}
          title="Map Navigation Help"
          content={
            <div><>

              <p className="mb-1">• Click and drag to pan around the map</p>
              <p
</>
className="mb-1">• Use the zoom controls in the top right or scroll to zoom in/out</p><>

              <p className="mb-1">• Click on parcels to select them</p>
              <p
</>
</>>• View different layers using the layer control if enabled</p>
            </div>
          }
          position="left"
          iconSize={18}
        />
      </div>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" />
        
        {/* Base Layers */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Dynamic Layers */}
        {enableLayerControl ? (
          <LayersControl position="topright">
            {mapLayers.map(layer => (
              <LayersControl.Overlay 
                key={layer.id} 
                name={layer.name}
                checked={layer.visible}
              >
                <GeoJSON 
                  data={{
                    type: 'FeatureCollection',
                    features: layer.name === 'Parcels' && parcelData ? [parcelData] : []
                  }}
                  eventHandlers={{
                    click: (e) => handleParcelClick(e.target.feature)
                  }}
                />
              </LayersControl.Overlay>
            ))}
          </LayersControl>
        ) : (
          // When layer control is disabled, just show the visible layers
          mapLayers
            .filter(layer => layer.visible)
            .map(layer => (
              <GeoJSON 
                key={layer.id}
                data={{
                  type: 'FeatureCollection',
                  features: layer.name === 'Parcels' && parcelData ? [parcelData] : []
                }}
                eventHandlers={{
                  click: (e) => handleParcelClick(e.target.feature)
                }}
              />
            ))
        )}
        
        {/* Map updater that will focus on the selected parcel */}
        <MapUpdater parcelData={parcelData} />
        
        {/* Display parcel info if needed */}
        {parcelId && (
          <div 
            className="absolute bottom-0 left-0 z-[1000] bg-white p-2 m-2 rounded shadow"
            style={{ pointerEvents: 'none' }}
          >
            Parcel ID: {parcelId}
          </div>
        )}
      </MapContainer>
    </div>
  );
}