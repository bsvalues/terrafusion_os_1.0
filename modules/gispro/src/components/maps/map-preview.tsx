import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Search  } from '@mui/icons-material';
import { DEFAULT_MAP_LAYERS, MapLayer } from "@/lib/map-utils";
import { BasicMapViewer } from "./basic-map-viewer";

type MapPreviewProps = {
  workflowId?: number;
  parcelId?: string;
  enableFullMap?: boolean;
  onOpenFullMap?: () => void;
};

export function MapPreview({ workflowId, parcelId, enableFullMap = false, onOpenFullMap }: MapPreviewProps) {
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(DEFAULT_MAP_LAYERS);
  
  // Fetch map layers from API
  const { data: apiLayers, isLoading } = useQuery<MapLayer[]>({
    queryKey: ["/api/map-layers"],
    // Always fetch map layers, whether in workflow context or public portal
  });
  
  useEffect(() => {
    if (apiLayers) {
      setMapLayers(apiLayers);
    }
  }, [apiLayers]);
  
  const toggleLayerVisibility = (layerId: number) => {
    setMapLayers(layers => 
      layers.map(layer => 
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };
  
  // Determine if this is in public portal context
  const isPublicPortal = !workflowId && typeof onOpenFullMap === 'undefined';
  
  // For the public portal, we don't wrap in a Card
  if (isPublicPortal) {
    return (
      <div className="h-full w-full">
        <div className="h-full bg-neutral-100 rounded-md border border-neutral-300 overflow-hidden relative">
          <BasicMapViewer
            mapLayers={mapLayers}
            parcelId={parcelId}
            enableLayerControl={false}
          />
        </div>
      </div>
    );
  }
  
  // Standard version with Card for workflow context
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-neutral-800">Parcel Map Preview</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="h-64 bg-neutral-100 rounded-md border border-neutral-300 overflow-hidden relative">
          {/* Using our simplified map viewer first */}<>

          <BasicMapViewer
            mapLayers={mapLayers}
            parcelId={parcelId}
            enableLayerControl={false}
          />
        </div>
        
        <div
</> className="flex justify-between items-center">
          <span className="text-sm text-neutral-600">
            {parcelId ? `Parcel ID: ${parcelId}` : "Preview only. Full editing in next step."}
          </span>
          {enableFullMap && (
            <Button 
              size="sm" 
              className="bg-secondary-500 text-white rounded-md px-3 py-1.5 font-medium hover:bg-secondary-600 flex items-center"
              onClick={onOpenFullMap}
            >
              <Search className="h-4 w-4 mr-1.5" /> Open Full Map
            </Button>
          )}
        </div>
        
        {/* Layer Controls */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-700">Map Layers</h3>
          {mapLayers.map((layer) => (
            <div key={layer.id} className="flex items-center justify-between">
              <Label className="text-xs text-neutral-600 flex items-center"><>

                <Checkbox
                  className="h-3.5 w-3.5 mr-1.5"
                  checked={layer.visible}
                  onCheckedChange={() => toggleLayerVisibility(layer.id)}
                />
                {layer.name}
              </Label>
              <span
</> className="text-xs text-neutral-400">
                {layer.source === 'county_gis' ? 'From county GIS' : 
                 layer.source === 'arcgis' ? 'ArcGIS Pro' :
                 layer.source?.includes('imagery') ? `${layer.source} imagery` : 'External'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
