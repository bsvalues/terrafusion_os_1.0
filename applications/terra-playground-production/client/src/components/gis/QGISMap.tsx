import { useRef, useEffect, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import '@/styles/map-branding.css'; // Import our custom map styling
import '@/styles/qgis-showcase.css'; // Import QGIS showcase styling
import { useGIS } from '@/contexts/gis-context';
import { Maximize, Layers, Compass, Info  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { defaults as defaultControls } from 'ol/control';
import PropertyLayer from './PropertyLayer';
import QGISFeaturesShowcase from './QGISFeaturesShowcase';

interface QGISMapProps {
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
  baseMapType?: 'osm' | 'satellite' | 'terrain';
  onMapInit?: (map: Map) => void;
}

const QGISMap = ({
  className = '',
  showControls = true,
  interactive = true,
  baseMapType: initialBaseMapType = 'osm',
  onMapInit,
}: QGISMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showQGISFeatures, setShowQGISFeatures] = useState(false);
  // Use context baseMapType instead of local state to ensure synchronization across components

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
    baseMapType: contextBaseMapType,
    setBaseMapType: contextSetBaseMapType,
  } = useGIS();

  // Convert center coordinates from [longitude, latitude] to OpenLayers projection
  const olCenter = fromLonLat(center);

  // Create base layer based on type
  const createBaseLayer = (type: 'osm' | 'satellite' | 'terrain') => {
    switch (type) {
      case 'satellite':
        return new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19,
            attributions:
              'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer">ArcGIS</a>',
          }),
        });
      case 'terrain':
        return new TileLayer({
          source: new XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19,
            attributions:
              'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
          }),
        });
      case 'osm':
      default:
        return new TileLayer({
          source: new OSM(),
        });
    }
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return; // initialize map only once

    if (mapRef.current) {
      // Create base layer
      const baseLayer = createBaseLayer(contextBaseMapType);

      // Create vector source for GIS features
      const vectorSource = new VectorSource({
        format: new GeoJSON(),
      });

      // Create vector layer for GIS features
      const vectorLayer = new VectorLayer({
        source: vectorSource,
      });

      // Create the map
      map.current = new Map({
        target: mapRef.current,
        layers: [baseLayer, vectorLayer],
        view: new View({
          center: olCenter,
          zoom: zoom,
          minZoom: 2,
          maxZoom: 20,
        }),
        controls: defaultControls({
          zoom: showControls,
          rotate: showControls,
          attribution: true,
        }),
      });

      // Set map as loaded
      setMapLoaded(true);

      // Call onMapInit callback if provided
      if (onMapInit && map.current) {
        onMapInit(map.current);
      }

      // Update center and zoom when view changes
      map.current.getView().on('change:center', () => {
        if (map.current) {
          // Convert from OpenLayers projection back to [longitude, latitude]
          const view = map.current.getView();
          const center = view.getCenter();
          if (center) {
            // This will need proper conversion in a real implementation
            // setCenter(toLonLat(center) as [number, number]);
          }
        }
      });

      map.current.getView().on('change:resolution', () => {
        if (map.current) {
          setZoom(map.current.getView().getZoom() || zoom);
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.setTarget(undefined);
        map.current = null;
      }
    };
  }, [contextBaseMapType, center, zoom, onMapInit]);

  // Update map when center or zoom changes
  useEffect(() => {
    if (map.current) {
      const view = map.current.getView();
      view.animate({
        center: olCenter,
        zoom: zoom,
        duration: 250,
      });
    }
  }, [center, zoom]);

  // Handle visible layers
  useEffect(() => {
    if (map.current && mapLoaded) {
      // This would be where you'd add/remove layers based on visibleLayers
      // For a real implementation, you'd need to fetch the actual layer data
    }
  }, [visibleLayers, mapLoaded]);

  // Handle layer opacity
  useEffect(() => {
    if (map.current && mapLoaded) {
      // This would be where you'd update layer opacity
    }
  }, [layerOpacity, mapLoaded]);

  // Handle base map type changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      // Get all layers
      const layers = map.current.getLayers();
      // Remove the base layer (first layer)
      layers.removeAt(0);
      // Create and add the new base layer at position 0
      const newBaseLayer = createBaseLayer(contextBaseMapType);
      layers.insertAt(0, newBaseLayer);
    }
  }, [contextBaseMapType, mapLoaded]);

  return (
    <div
      className={cn(
        'relative h-full w-full bg-gray-100 tf-map-container',
        className,
        isFullScreen ? 'fixed inset-0 z-50' : ''
      )}
    >
      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* QGIS Open Source Badge */}
      <div className="tf-map-overlay top-left tf-qgis-badge">
        <span className="text-green-600 mr-1">▲</span> QGIS Open Source
      </div>

      {/* Terrafusion Attribution */}
      <div className="tf-map-attribution">
        Terrafusion | Powered by QGIS | © OpenStreetMap contributors
      </div>

      {/* Map Controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 tf-zoom-control">
          <Button
            variant="outline"
            size="icon"
            className="tf-zoom-button"
            onClick={toggleFullScreen}
          ><>

            <Maximize className="h-4 w-4" />
          </Button>

          <div
</> className="tf-zoom-divider"></div>

          <Button
            variant="outline"
            size="icon"
            className="tf-zoom-button"
            onClick={toggleLayersPanel}
          ><>

            <Layers className="h-4 w-4" />
          </Button>

          <div
</> className="tf-zoom-divider"></div>

          <Button
            variant="outline"
            size="icon"
            className="tf-zoom-button"
            onClick={() => {
              if (map.current) {
                map.current.getView().animate({
                  rotation: 0,
                  duration: 250,
                });
              }
            }}
          ><>

            <Compass className="h-4 w-4" />
          </Button>

          <div
</> className="tf-zoom-divider"></div>

          <Button
            variant="outline"
            size="icon"
            className="tf-zoom-button tf-qgis-info-button"
            onClick={() => setShowQGISFeatures(!showQGISFeatures)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* QGIS Features Showcase Panel */}
      {showQGISFeatures && (
        <QGISFeaturesShowcase map={map.current} onClose={() => setShowQGISFeatures(false)} />
      )}

      {/* Add Property Layer if map is loaded */}
      {mapLoaded && map.current && (
        <PropertyLayer map={map.current} visualizationMode="value" opacity={0.7} />
      )}

      {/* Layer Control Panel */}
      {isLayersPanelOpen && (
        <div className="absolute left-4 top-12 bg-white p-4 rounded shadow-lg w-64">
          <h3 className="font-medium mb-3 text-primary flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Map Controls
          </h3>

          {/* Base Map Type Selector */}
          <div className="mb-4"><>

            <div className="tf-layer-group-header mb-2">Base Map Type</div>
            <div
</> className="grid grid-cols-3 gap-2"><>

              <button
                className={`px-2 py-1 text-xs rounded ${contextBaseMapType === 'osm' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => contextSetBaseMapType('osm')}
              >
                Streets
              </button>
              <button
</>
                className={`px-2 py-1 text-xs rounded ${contextBaseMapType === 'satellite' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => contextSetBaseMapType('satellite')}
              >
                Satellite
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${contextBaseMapType === 'terrain' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                onClick={() => contextSetBaseMapType('terrain')}
              >
                Terrain
              </button>
            </div>
          </div>

          {/* Layer groups */}
          <div className="space-y-3">
            <div className="tf-layer-group"><>

              <div className="tf-layer-group-header">Base Maps</div>
              <div
</> className="space-y-2">
                {Object.keys(visibleLayers)
                  .slice(0, 2)
                  .map(layerId => (
                    <div key={layerId} className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between"><>

                        <span className="text-sm">{layerId}</span>
                        <input
</>
                          type="checkbox"
                          checked={visibleLayers[layerId]}
                          onChange={() => {
                            // Toggle layer visibility
                          }}
                        />
                      </div>
                      <Slider
                        value={[layerOpacity[layerId] || 100]}
                        min={0}
                        max={100}
                        step={1}
                        className="mt-2"
                        onValueChange={value => {
                          // Update layer opacity
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="tf-layer-group"><>

              <div className="tf-layer-group-header">Property Data</div>
              <div
</> className="space-y-2">
                {Object.keys(visibleLayers)
                  .slice(2)
                  .map(layerId => (
                    <div key={layerId} className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between"><>

                        <span className="text-sm">{layerId}</span>
                        <input
</>
                          type="checkbox"
                          checked={visibleLayers[layerId]}
                          onChange={() => {
                            // Toggle layer visibility
                          }}
                        />
                      </div>
                      <Slider
                        value={[layerOpacity[layerId] || 100]}
                        min={0}
                        max={100}
                        step={1}
                        className="mt-2"
                        onValueChange={value => {
                          // Update layer opacity
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* QGIS Features Reminder */}
          <div className="mt-4 text-xs text-gray-600"><>

            <p className="italic">Using QGIS open-source GIS technology</p>
            <p
</> className="mt-1 flex items-center">
              <span className="text-green-600 mr-1">▲</span>
              Terrafusion leverages QGIS for maximum flexibility and customization
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QGISMap;
