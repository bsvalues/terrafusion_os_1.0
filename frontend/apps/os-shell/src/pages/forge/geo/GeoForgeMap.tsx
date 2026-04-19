import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './geoforge.css';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { medianRatioColor, ratioPointColor, salePointRadius } from './utils/choropleths';
import { makeCircleGeoJson, haversineDistanceMi } from './utils/geoMath';
import type { MapLayer } from './types/geoforge.types';

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) ?? '';

const BENTON_CENTER: [number, number] = [-119.3, 46.2];
const BENTON_ZOOM = 10;

interface Props {
  onNeighborhoodClick: (code: string) => void;
  onSaleClick: (parcelId: string) => void;
}

export function GeoForgeMap({ onNeighborhoodClick, onSaleClick }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null);
  const {
    neighborhoodStats,
    salePoints,
    activeLayers,
    gwrSurface,
    simulationDeltaMap,
    selectedNeighborhoodCode,
    selectedMonth,
    flyTarget,
    setFlyTarget,
    bloomLatlng,
    selectedRadiusMi,
  } = useGeoForgeStore();

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

    const hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'geoforge-hover-popup',
    });
    hoverPopupRef.current = hoverPopup;

    map.on('load', () => {
      addNeighborhoodLayer(map);
      addSimulationOverlayLayer(map);
      addSaleScatterLayer(map);
      addKdeLayer(map);
      addAiClusterLayer(map);
      addGwrLayer(map);
      addCompsRadiusLayer(map);

      // Neighborhood click
      map.on('click', 'neighborhood-fill', (e) => {
        const code = e.features?.[0]?.properties?.neighborhoodCode as string | undefined;
        if (code) onNeighborhoodClick(code);
      });

      // Neighborhood hover tooltip
      map.on('mouseenter', 'neighborhood-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const props = e.features?.[0]?.properties;
        if (!props || !e.lngLat) return;
        const med = Number(props.medianRatio).toFixed(3);
        const cod = Number(props.cod).toFixed(1);
        const n = props.saleCount;
        const simDelta = props.simulationDelta;
        const simRow = simDelta != null
          ? `<div style="margin-top:4px;color:#f59e0b;">⬡ Sim: ${Number(simDelta) >= 0 ? '+' : ''}${Number(simDelta).toFixed(1)}%</div>`
          : '';
        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="background:#0f172a;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:11px;line-height:1.6;border:1px solid #334155;min-width:120px"><div style="color:#00FFFF;font-weight:700;margin-bottom:3px;letter-spacing:.05em">${props.neighborhoodCode}</div><div>MED <span style="color:#fff;font-weight:600">${med}</span></div><div>COD <span style="color:#fff">${cod}</span></div><div style="color:#94a3b8">n = ${n}${simRow}</div></div>`)
          .addTo(map);
      });

      map.on('mouseleave', 'neighborhood-fill', () => {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Sale dot click — opens parcel bloom card
      map.on('click', 'sale-circles', (e) => {
        e.preventDefault();
        const feat = e.features?.[0];
        if (!feat) return;
        const parcelId = feat.properties?.parcelId as string | undefined;
        if (parcelId) onSaleClick(parcelId);
      });

      map.on('mouseenter', 'sale-circles', () => { map.getCanvas().style.cursor = 'crosshair'; });
      map.on('mouseleave', 'sale-circles', () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;
    return () => {
      hoverPopup.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Selection dim — non-selected neighborhoods fade to 25% opacity
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    if (selectedNeighborhoodCode) {
      map.setPaintProperty('neighborhood-fill', 'circle-opacity', [
        'case',
        ['==', ['get', 'neighborhoodCode'], selectedNeighborhoodCode], 0.90,
        0.22,
      ]);
      map.setPaintProperty('neighborhood-label', 'text-opacity', [
        'case',
        ['==', ['get', 'neighborhoodCode'], selectedNeighborhoodCode], 1.0,
        0.35,
      ]);
      map.setPaintProperty('neighborhood-fill', 'circle-stroke-opacity', [
        'case',
        ['==', ['get', 'neighborhoodCode'], selectedNeighborhoodCode], 0.95,
        0.15,
      ]);
    } else {
      map.setPaintProperty('neighborhood-fill', 'circle-opacity', 0.70);
      map.setPaintProperty('neighborhood-label', 'text-opacity', 1.0);
      map.setPaintProperty('neighborhood-fill', 'circle-stroke-opacity', 0.4);
    }
  }, [selectedNeighborhoodCode]);

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
            parcelId: sp.parcelId,
            ratio: sp.ratio,
            salePrice: sp.salePrice,
            saleDate: sp.saleDate,
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

  // Fly to parcel when search result selected
  useEffect(() => {
    const map = mapRef.current;
    if (!flyTarget || !map?.isStyleLoaded()) return;
    map.flyTo({ center: [flyTarget.lng, flyTarget.lat], zoom: 16, duration: 1400, essential: true });
    setFlyTarget(null);
  }, [flyTarget, setFlyTarget]);

  // Comp radius ring — amber dashed polygon + cyan highlight on in-radius sales
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const ringSrc = map.getSource('comps-radius-ring') as mapboxgl.GeoJSONSource | undefined;
    const inSrc = map.getSource('comps-radius-sales') as mapboxgl.GeoJSONSource | undefined;
    const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

    if (!bloomLatlng || !selectedRadiusMi) {
      ringSrc?.setData(empty);
      inSrc?.setData(empty);
      return;
    }

    ringSrc?.setData(makeCircleGeoJson(bloomLatlng.lat, bloomLatlng.lng, selectedRadiusMi));

    const inRadius = salePoints.filter(
      (sp) =>
        sp.lat !== 0 &&
        sp.lng !== 0 &&
        haversineDistanceMi(bloomLatlng.lat, bloomLatlng.lng, sp.lat, sp.lng) <= selectedRadiusMi,
    );
    inSrc?.setData({
      type: 'FeatureCollection',
      features: inRadius.map((sp) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [sp.lng, sp.lat] },
        properties: { ratio: sp.ratio },
      })),
    });
  }, [bloomLatlng, selectedRadiusMi, salePoints]);

  // Month filter — narrows sale-circles and outlier-ring to a single YYYY-MM
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const monthFilter = selectedMonth
      ? ['==', ['slice', ['get', 'saleDate'], 0, 7], selectedMonth]
      : true;

    if (map.getLayer('sale-circles')) {
      map.setFilter('sale-circles', [
        'all',
        ['!', ['has', 'point_count']],
        monthFilter,
      ] as mapboxgl.FilterSpecification);
    }
    if (map.getLayer('sale-outlier-ring')) {
      map.setFilter('sale-outlier-ring', [
        'all',
        ['!', ['has', 'point_count']],
        ['==', ['get', 'isOutlier'], true],
        monthFilter,
      ] as mapboxgl.FilterSpecification);
    }
  }, [selectedMonth]);

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

function addCompsRadiusLayer(map: mapboxgl.Map) {
  map.addSource('comps-radius-ring', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'comps-radius-fill',
    type: 'fill',
    source: 'comps-radius-ring',
    paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.07 },
  });
  map.addLayer({
    id: 'comps-radius-outline',
    type: 'line',
    source: 'comps-radius-ring',
    paint: {
      'line-color': '#f59e0b',
      'line-width': 2,
      'line-dasharray': [4, 3],
      'line-opacity': 0.85,
    },
  });

  map.addSource('comps-radius-sales', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'comps-radius-dots',
    type: 'circle',
    source: 'comps-radius-sales',
    paint: {
      'circle-color': 'transparent',
      'circle-radius': 11,
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#00FFFF',
      'circle-stroke-opacity': 0.9,
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
