import React from 'react';
import {MapLayer, GeoJSONFeature} from '@/lib/map-utils';

// This is a simplified version that doesn't use Leaflet yet
// We'll use this as a fallback until we resolve the Leaflet integration
type BasicMapViewerProps = {mapLayers?: MapLayer[];
  parcelId?: string;
  enableLayerControl?: boolean;
  onParcelSelect?: (parcelId: string) =>void;};

export function BasicMapViewer({mapLayers = [],
  parcelId,
  enableLayerControl = false,
  onParcelSelect}: BasicMapViewerProps) {
  // Show which layers would be visible
  const visibleLayers = mapLayers.filter(layer => layer.visible);
  
  return (<div className="w-full h-full bg-neutral-50 rounded-md flex flex-col items-center justify-center p-4"><div className="text-center mb-4"><><h3 className="text-lg font-medium text-neutral-700">Interactive Map</h3><p
</>
className="text-sm text-neutral-500">Geographic Information System</p></div>{parcelId && (<div className="bg-white border border-neutral-200 rounded-md p-3 mb-4 w-full max-w-md"><><h4 className="font-medium text-neutral-800 mb-1">Selected Parcel</h4><p
</>
className="text-neutral-600 text-sm">Parcel ID: {parcelId}</p></div>)}<div className="bg-white border border-neutral-200 rounded-md p-3 w-full max-w-md"><><h4 className="font-medium text-neutral-800 mb-1">Active Map Layers</h4><ul
</>className="text-sm space-y-1">
          {visibleLayers.length > 0 ? (
            visibleLayers.map(layer => (<li key={layer.id} className="text-neutral-600">• {layer.name} ({layer.type})</li>))
          ) : (<li className="text-neutral-500 italic">No active layers</li>)}</ul></div>{enableLayerControl && (<div className="mt-4 text-sm text-neutral-600">Layer controls available in full map view</div>)}</div>
  );
}