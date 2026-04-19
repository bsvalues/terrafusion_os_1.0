import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { medianRatioColor, ratioPointColor, salePointRadius } from './utils/choropleths';
import type { MapLayer } from './types/geoforge.types';

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) ?? '';

const BENTON_CENTER: [number, number] = [-119.3, 46.2];
const BENTON_ZOOM = 10;

interface Props {
  onNeighborhoodClick: (code: string) => void;
}

export function GeoForgeMap({ onNeighborhoodClick }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { neighborhoodStats, salePoints, activeLayers, gwrSurface, simulationDeltaMap } = useGeoForgeStore();

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: BENTON_CENTER,
      zoom: BENTON_ZOOM,
      minZoom: 8,
      maxZoom: 18,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left');

    map.on('load', () => {
      addNeighborhoodLayer(map);
      addSimulationOverlayLayer(map);
      addSaleScatterLayer(map);
      addKdeLayer(map);
      addAiClusterLayer(map);
      addGwrLayer(map);

      map.on('click', 'neighborhood-fill', (e) => {
        const code = e.features?.[0]?.properties?.neighborhoodCode as string | undefined;
        if (code) onNeighborhoodClick(code);
      });

      map.on('mouseenter', 'neighborhood-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'neighborhood-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update neighborhood choropleth + simulation overlay data
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: neighborhoodStats
        .filter((ns) => ns.centroidLat !== 0 && ns.centroidLng !== 0)
        .map((ns) => {
          const delta = simulationDeltaMap?.[ns.neighborhoodCode] ?? null;
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [ns.centroidLng, ns.centroidLat],
            },
            properties: {
              neighborhoodCode: ns.neighborhoodCode,
              medianRatio: ns.stats.medianRatio,
              cod: ns.stats.cod,
              saleCount: ns.saleCount,
              color: medianRatioColor(ns.stats.medianRatio),
              simulationDelta: delta,
              hasSimulation: delta !== null,
            },
          };
        }),
    };

    const src = map.getSource('neighborhoods') as mapboxgl.GeoJSONSource | undefined;
    src?.setData(geojson);
  }, [neighborhoodStats, simulationDeltaMap]);

  // Update sale scatter data
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: salePoints
        .filter((sp) => sp.lat !== 0 && sp.lng !== 0)
        .map((sp) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [sp.lng, sp.lat] },
          properties: {
            ratio: sp.ratio,
            salePrice: sp.salePrice,
            isOutlier: sp.isOutlier,
            color: ratioPointColor(sp.ratio),
            radius: salePointRadius(sp.salePrice),
          },
        })),
    };

    const src = map.getSource('sales') as mapboxgl.GeoJSONSource | undefined;
    src?.setData(geojson);

    // Mirror to KDE source
    const kdeSrc = map.getSource('sales-kde') as mapboxgl.GeoJSONSource | undefined;
    kdeSrc?.setData(geojson);
  }, [salePoints]);

  // Update GWR heatmap data
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !gwrSurface) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: gwrSurface.cells
        .filter((c) => c.localMedianRatio > 0)
        .map((c) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
          properties: {
            localMedianRatio: c.localMedianRatio,
            localCod: c.localCod,
            deviation: Math.abs(c.localMedianRatio - 1),
          },
        })),
    };

    const src = map.getSource('gwr-cells') as mapboxgl.GeoJSONSource | undefined;
    src?.setData(geojson);
  }, [gwrSurface]);

  // Toggle layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const layerMap: Partial<Record<MapLayer, string[]>> = {
      choropleth: ['neighborhood-fill', 'neighborhood-label'],
      'sale-scatter': ['sale-circles', 'sale-outlier-ring'],
      kde: ['kde-heat'],
      'ai-cluster': ['ai-cluster-circles'],
      gwr: ['gwr-heat'],
    };

    for (const [key, layers] of Object.entries(layerMap) as [MapLayer, string[]][]) {
      const vis = activeLayers.has(key) ? 'visible' : 'none';
      for (const l of layers) {
        if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', vis);
      }
    }
  }, [activeLayers]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}

function addNeighborhoodLayer(map: mapboxgl.Map) {
  map.addSource('neighborhoods', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'neighborhood-fill',
    type: 'circle',
    source: 'neighborhoods',
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 14, 14, 44],
      'circle-opacity': 0.70,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#00FFFF',
      'circle-stroke-opacity': 0.4,
    },
  });

  map.addLayer({
    id: 'neighborhood-label',
    type: 'symbol',
    source: 'neighborhoods',
    minzoom: 9,
    layout: {
      'text-field': ['get', 'neighborhoodCode'],
      'text-size': 11,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1.5,
    },
  });
}

function addSaleScatterLayer(map: mapboxgl.Map) {
  map.addSource('sales', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterMaxZoom: 12,
    clusterRadius: 40,
  });

  map.addLayer({
    id: 'sale-circles',
    type: 'circle',
    source: 'sales',
    filter: ['!', ['has', 'point_count']],
    minzoom: 11,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['coalesce', ['get', 'radius'], 6],
      'circle-opacity': 0.75,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.5,
    },
  });

  map.addLayer({
    id: 'sale-outlier-ring',
    type: 'circle',
    source: 'sales',
    filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isOutlier'], true]],
    minzoom: 11,
    paint: {
      'circle-color': 'transparent',
      'circle-radius': ['+', ['coalesce', ['get', 'radius'], 6], 5],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ff4444',
      'circle-stroke-opacity': 0.9,
    },
  });
}

function addKdeLayer(map: mapboxgl.Map) {
  map.addSource('sales-kde', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer(
    {
      id: 'kde-heat',
      type: 'heatmap',
      source: 'sales-kde',
      maxzoom: 13,
      layout: { visibility: 'none' },
      paint: {
        'heatmap-weight': [
          'interpolate', ['linear'], ['get', 'ratio'],
          0.7, 0, 1.0, 0.5, 1.3, 1,
        ],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1, 13, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,255,0)',
          0.2, '#1d4ed8',
          0.5, '#22c55e',
          0.8, '#eab308',
          1, '#ef4444',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 20, 13, 40],
        'heatmap-opacity': 0.65,
      },
    },
    'neighborhood-fill' // insert below neighborhood layer
  );
}

function addAiClusterLayer(map: mapboxgl.Map) {
  map.addSource('ai-clusters', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'ai-cluster-circles',
    type: 'circle',
    source: 'ai-clusters',
    layout: { visibility: 'none' },
    paint: {
      'circle-color': '#a855f7',
      'circle-radius': 24,
      'circle-opacity': 0.25,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#a855f7',
      'circle-stroke-opacity': 0.7,
    },
  });
}

function addSimulationOverlayLayer(map: mapboxgl.Map) {
  // Reuses the 'neighborhoods' source — draws amber rings on features with hasSimulation=true
  map.addLayer({
    id: 'simulation-ring',
    type: 'circle',
    source: 'neighborhoods',
    filter: ['==', ['get', 'hasSimulation'], true],
    paint: {
      'circle-color': 'transparent',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 22, 14, 56],
      'circle-stroke-width': 3,
      'circle-stroke-color': '#f59e0b',
      'circle-stroke-opacity': 0.95,
      'circle-opacity': 0,
    },
  });

  // Inner amber tint: positive delta = warm green, negative = warm red
  map.addLayer({
    id: 'simulation-fill',
    type: 'circle',
    source: 'neighborhoods',
    filter: ['==', ['get', 'hasSimulation'], true],
    paint: {
      'circle-color': [
        'case',
        ['>', ['get', 'simulationDelta'], 0], '#f59e0b',
        '#ef4444',
      ],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 18, 14, 50],
      'circle-opacity': 0.18,
      'circle-stroke-width': 0,
    },
  });
}

function addGwrLayer(map: mapboxgl.Map) {
  map.addSource('gwr-cells', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer(
    {
      id: 'gwr-heat',
      type: 'heatmap',
      source: 'gwr-cells',
      maxzoom: 14,
      layout: { visibility: 'none' },
      paint: {
        // weight by deviation from 1.0 — neighborhoods far from parity glow brighter
        'heatmap-weight': [
          'interpolate', ['linear'], ['get', 'deviation'],
          0, 0,
          0.05, 0.3,
          0.15, 0.7,
          0.30, 1,
        ],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 4],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.1, '#1d4ed8',
          0.3, '#06b6d4',
          0.5, '#22c55e',
          0.7, '#eab308',
          0.9, '#f97316',
          1, '#dc2626',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 8, 35, 14, 65],
        'heatmap-opacity': 0.70,
      },
    },
    'neighborhood-fill'
  );
}
