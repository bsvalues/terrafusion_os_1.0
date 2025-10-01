import React, {useState, useEffect} from 'react';
import {MapboxMap} from './mapbox/mapbox-map';
import {ArcGISMap} from './arcgis/arcgis-map';
import {useMapboxToken} from '@/hooks/use-mapbox-token';
import {Card, CardContent} from '@/components/ui/card';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import {Globe, Map as MapIcon, AlertCircle} from '@mui/icons-material';
import {Button} from '@/components/ui/button';

export type MapProviderType = 'mapbox' | 'arcgis';

interface MapProviderSelectorProps {initialCenter?: [number, number];
  initialZoom?: number;
  width?: string | number;
  height?: string | number;
  defaultProvider?: MapProviderType;
  onMapboxMapCreated?: (map: mapboxgl.Map) => void;
  onArcGISMapCreated?: (view: any) => void;
  children?: React.ReactNode | ((provider: MapProviderType) => React.ReactNode);}

/**
 * Map Provider Selector Component
 *
 * This component allows switching between different map providers (Mapbox and ArcGIS)
 */
export function MapProviderSelector({initialCenter = [-123.3617, 44.5646], // Benton County, Oregon
  initialZoom = 10,
  width = '100%',
  height = '500px',
  defaultProvider = 'mapbox',
  onMapboxMapCreated,
  onArcGISMapCreated,
  children,}: MapProviderSelectorProps) {const [provider, setProvider] = useState<MapProviderType>(defaultProvider);
  const [mapboxFailed, setMapboxFailed] = useState(false);
  const { token: mapboxToken, error: mapboxError} = useMapboxToken();

  // Switch to ArcGIS if Mapbox token is not available
  useEffect(() =>{if ((mapboxError || !mapboxToken) && provider === 'mapbox') {
      console.warn('Mapbox token not available, switching to ArcGIS provider');
      setMapboxFailed(true);
      setProvider('arcgis');}
  }, [mapboxError, mapboxToken, provider]);

  // Setup the map container's styles
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
  };

  return (<div>{/* Provider selection interface */}<div className="mb-4 flex gap-2 items-center"><RadioGroup
          value={provider}
          onValueChange={value => setProvider(value as MapProviderType)}
          className="flex space-x-2"
        ><div className="flex items-center space-x-2"><RadioGroupItem value="mapbox" id="mapbox" disabled={mapboxFailed} /><Label htmlFor="mapbox" className="flex items-center space-x-1"><MapIcon className="h-4 w-4" /><span>Mapbox</span></Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="arcgis" id="arcgis" /><Label htmlFor="arcgis" className="flex items-center space-x-1"><Globe className="h-4 w-4" /><span>ArcGIS</span></Label></div></RadioGroup>{mapboxFailed && (<div className="flex items-center text-sm text-amber-500"><AlertCircle className="h-4 w-4 mr-1" /><span>Mapbox unavailable</span></div>)}</div>{/* Map container */}<div style={containerStyle}>{provider === 'mapbox' && !mapboxFailed && (<MapboxMap
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            width="100%"
            height="100%"
            onMapCreated={onMapboxMapCreated}
          >{typeof children === 'function' ? children('mapbox') : children}</MapboxMap>)}

        {(provider === 'arcgis' || mapboxFailed) && (<ArcGISMap
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            width="100%"
            height="100%"
            onMapCreated={onArcGISMapCreated}
          >{typeof children === 'function' ? children('arcgis') : children}</ArcGISMap>)}</div></div>
  );
}

export default MapProviderSelector;
