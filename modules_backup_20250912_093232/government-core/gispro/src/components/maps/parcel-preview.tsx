import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {BasicMapViewer} from './basic-map-viewer';
import {MapLayer} from '@/lib/map-utils';

type ParcelPreviewProps = {parcelIds: string[];
  mapLayers?: MapLayer[];};

export function ParcelPreview({parcelIds, mapLayers = []}: ParcelPreviewProps) {
  // We're showing a simplified view with just the first parcel for now
  const parcelId = parcelIds.length >0 ? parcelIds[0] : undefined;
  
  return (<Card><CardHeader className="pb-3"><CardTitle className="text-lg font-semibold text-neutral-800">Parcel Preview</CardTitle></CardHeader><CardContent className="space-y-3"><div className="h-64 bg-neutral-100 rounded-md border border-neutral-300 overflow-hidden relative">{parcelId ? (<BasicMapViewer
              mapLayers={mapLayers}
              parcelId={parcelId}
              enableLayerControl={false} />) : (<div className="w-full h-full flex items-center justify-center"><div className="text-center text-neutral-500"><><p>No parcels to display</p><p
</>
className="text-xs mt-1">Generate parcel IDs to see a preview</p></div></div>)}</div>{parcelId && (<div className="bg-neutral-50 border border-neutral-200 rounded p-3"><><h3 className="text-sm font-medium mb-2">Selected Parcel</h3><div
</>
className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-neutral-500">ID:</span><span className="font-mono">{parcelId}</span></div><div><span className="text-neutral-500">Type:</span><span>Residential</span></div><div><span className="text-neutral-500">Area:</span><span>0.25 acres</span></div><div><span className="text-neutral-500">Status:</span><span className="text-green-600">New</span></div></div></div>)}
        
        {parcelIds.length > 1 && (<div className="text-xs text-neutral-500 italic">Showing preview for first parcel. {parcelIds.length - 1} additional parcel(s) not shown.</div>)}</CardContent></Card>
  );
}