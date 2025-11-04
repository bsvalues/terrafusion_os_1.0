import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const VisualizationConfigSchema = z.object({
  mapboxToken: z.string(),
  initialCenter: z.object({
    lng: z.number(),
    lat: z.number()
  }),
  initialZoom: z.number().min(0).max(22),
  style: z.string(),
  layers: z.array(z.object({
    id: z.string(),
    type: z.enum(['fill', 'line', 'circle', 'symbol']),
    source: z.string(),
    paint: z.record(z.any())
  }))
});

type VisualizationConfig = z.infer<typeof VisualizationConfigSchema>;

interface VisualizationLayerProps {
  config: VisualizationConfig;
  data?: any[];
  onFeatureClick?: (feature: any) => void;
}

export const VisualizationLayer: React.FC<VisualizationLayerProps> = ({
  config,
  data,
  onFeatureClick
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const { data: mapData } = useQuery({
    queryKey: ['mapData'],
    queryFn: async () => {
      const response = await fetch('/api/map-data');
      return response.json();
    },
    enabled: loaded
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = config.mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.style,
      center: [config.initialCenter.lng, config.initialCenter.lat],
      zoom: config.initialZoom
    });

    map.current.on('load', () => {
      setLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [config]);

  useEffect(() => {
    if (!map.current || !loaded || !data) return;

    config.layers.forEach(layer => {
      if (map.current?.getSource(layer.source)) {
        (map.current.getSource(layer.source) as mapboxgl.GeoJSONSource)
          .setData({
            type: 'FeatureCollection',
            features: data
          });
      } else {
        map.current?.addSource(layer.source, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: data
          }
        });

        map.current?.addLayer({
          id: layer.id,
          type: layer.type,
          source: layer.source,
          paint: layer.paint
        });
      }
    });

    map.current.on('click', (e) => {
      const features = map.current?.queryRenderedFeatures(e.point);
      if (features && features.length > 0) {
        setSelectedFeature(features[0]);
        onFeatureClick?.(features[0]);
      }
    });
  }, [loaded, data, config.layers, onFeatureClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div><>

                <h3 className="text-lg font-semibold">
                  {selectedFeature.properties?.name || 'Selected Feature'}
                </h3>
                <p
</> className="text-gray-600">
                  {selectedFeature.properties?.description || 'No description available'}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2"><>

        <button
          onClick={() => map.current?.zoomIn()}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          +
        </button>
        <button
</>
          onClick={() => map.current?.zoomOut()}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        >
          -
        </button>
      </div>
    </div>
  );
}; 