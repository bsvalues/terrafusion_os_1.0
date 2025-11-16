import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGIS } from '@/modules/gis/contexts/GISContext';
import { Maximize, Layers, Compass  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Just use a free public token here for demonstration
// In production, this would be from an environment variable
const MAPBOX_TOKEN =
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

// Set the token for mapboxgl
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapboxMapProps {
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
  styleUrl?: string;
}

const MapboxMap = ({
  className = '',
  showControls = true,
  interactive = true,
  styleUrl = 'mapbox://styles/mapbox/streets-v12',
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    center,
    setCenter,
    zoom,
    setZoom,
    isFullScreen,
    toggleFullScreen,
    isLayersPanelOpen,
    toggleLayersPanel,
    visibleLayers,
    layerOpacity,
  } = useGIS();

  // Initialize map
  useEffect(() => {
    if (map.current) return; // initialize map only once

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: center,
        zoom: zoom,
        interactive: interactive,
        attributionControl: false,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('move', () => {
        if (map.current) {
          const newCenter = map.current.getCenter().toArray() as [number, number];
          setCenter(newCenter);
          setZoom(map.current.getZoom());
        }
      });

      // Add navigation control
      if (showControls) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map when center or zoom changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setCenter(center);
      map.current.setZoom(zoom);
    }
  }, [center, zoom, mapLoaded]);

  // Toggle fullscreen mode
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (isFullScreen) {
      // This would implement actual fullscreen API integration
      // For now we just simulate by updating styling
      if (mapContainer.current) {
        mapContainer.current.style.position = 'fixed';
        mapContainer.current.style.top = '0';
        mapContainer.current.style.left = '0';
        mapContainer.current.style.width = '100vw';
        mapContainer.current.style.height = '100vh';
        mapContainer.current.style.zIndex = '9999';
      }
    } else {
      if (mapContainer.current) {
        mapContainer.current.style.position = '';
        mapContainer.current.style.top = '';
        mapContainer.current.style.left = '';
        mapContainer.current.style.width = '';
        mapContainer.current.style.height = '';
        mapContainer.current.style.zIndex = '';
      }
    }

    // Resize map after changing fullscreen state
    if (map.current) {
      map.current.resize();
    }
  }, [isFullScreen, mapLoaded]);

  // Draw custom controls
  const renderControls = () => {
    if (!showControls) return null;

    return (
      <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white bg-opacity-80 hover:bg-opacity-100 text-black"
          onClick={toggleLayersPanel}
        ><>

          <Layers className="h-4 w-4" />
        </Button>

        <Button
</>
          variant="secondary"
          size="icon"
          className="bg-white bg-opacity-80 hover:bg-opacity-100 text-black"
          onClick={toggleFullScreen}
        ><>

          <Maximize className="h-4 w-4" />
        </Button>

        <Button
</>
          variant="secondary"
          size="icon"
          className="bg-white bg-opacity-80 hover:bg-opacity-100 text-black"
          onClick={() => {
            if (map.current) {
              map.current.easeTo({
                center: center,
                zoom: zoom,
                bearing: 0,
                pitch: 0,
              });
            }
          }}
        >
          <Compass className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Render layers panel
  const renderLayersPanel = () => {
    if (!isLayersPanelOpen) return null;

    return (
      <div className="absolute top-3 left-3 z-10 bg-white bg-opacity-90 p-4 rounded-md shadow-md max-h-[80vh] overflow-y-auto w-64"><>

        <h3 className="text-sm font-medium mb-2">Layers</h3>
        <div
</> className="space-y-3">
          {/* This would be populated from actual layer data */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs flex items-center"><>

                <input
                  type="checkbox"
                  className="mr-2 h-3 w-3"
                  checked={true}
                  onChange={() => {}}
                />
                Parcels
              </label>
              <div
</> className="w-24">
                <Slider defaultValue={[100]} max={100} step={1} className="h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs flex items-center"><>

                <input
                  type="checkbox"
                  className="mr-2 h-3 w-3"
                  checked={true}
                  onChange={() => {}}
                />
                Zoning
              </label>
              <div
</> className="w-24">
                <Slider defaultValue={[70]} max={100} step={1} className="h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs flex items-center"><>

                <input
                  type="checkbox"
                  className="mr-2 h-3 w-3"
                  checked={false}
                  onChange={() => {}}
                />
                Flood Zones
              </label>
              <div
</> className="w-24">
                <Slider defaultValue={[80]} max={100} step={1} className="h-2" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200"><>

            <h4 className="text-xs font-medium mb-1">Base Maps</h4>
            <div
</> className="space-y-1">
              <label className="text-xs flex items-center"><>

                <input
                  type="radio"
                  name="basemap"
                  className="mr-2 h-3 w-3"
                  checked={true}
                  onChange={() => {}}
                />
                Streets
              </label>

              <label
</> className="text-xs flex items-center"><>

                <input
                  type="radio"
                  name="basemap"
                  className="mr-2 h-3 w-3"
                  checked={false}
                  onChange={() => {}}
                />
                Satellite
              </label>

              <label
</> className="text-xs flex items-center">
                <input
                  type="radio"
                  name="basemap"
                  className="mr-2 h-3 w-3"
                  checked={false}
                  onChange={() => {}}
                />
                Topographic
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('relative w-full h-full min-h-[300px]', className)}>
      <div ref={mapContainer} className="absolute inset-0" />
      {renderControls()}
      {renderLayersPanel()}
    </div>
  );
};

export default MapboxMap;
