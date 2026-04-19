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
    priceBand,
    flyTarget,
    setFlyTarget,
    bloomLatlng,
    selectedRadiusMi,
    comparableSalePoints,
    filter,
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
      addNeighborhoodPolyLayer(map);
      addYoyChangeLayer(map);
      addNeighborhoodLayer(map);
      addCompsHighlightLayer(map);
      addSimulationOverlayLayer(map);
      addSaleScatterLayer(map);
      addKdeLayer(map);
      addAiClusterLayer(map);
      addGwrLayer(map);
      addCompsRadiusLayer(map);
      addParcelPointsLayer(map);
      addMarketTrendLayer(map);

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

      // Sale dot hover tooltip
      map.on('mouseenter', 'sale-circles', (e) => {
        map.getCanvas().style.cursor = 'crosshair';
        const props = e.features?.[0]?.properties;
        if (!props || !e.lngLat) return;
        const ratio = Number(props.ratio);
        const ratioColor = ratio > 1.15 ? '#f87171' : ratio > 1.05 ? '#fb923c'
          : ratio < 0.85 ? '#60a5fa' : ratio < 0.95 ? '#93c5fd' : '#4ade80';
        const dq = props.qualificationDecision === 'qualified' ? '' : `<div style="color:#fbbf24;font-size:9px">${props.qualificationDecision?.toUpperCase()}</div>`;
        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="background:#0f172a;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:11px;line-height:1.6;border:1px solid #334155;min-width:130px"><div style="color:#00FFFF;font-weight:700;font-family:monospace;margin-bottom:3px">${props.parcelId}</div><div>Ratio <span style="color:${ratioColor};font-weight:700;font-family:monospace">${ratio.toFixed(3)}</span></div><div>Sale <span style="color:#fff;font-family:monospace">$${(Number(props.salePrice)/1000).toFixed(0)}k</span></div><div style="color:#64748b;font-size:9px">${props.saleDate ?? ''}${dq}</div></div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'sale-circles', () => {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Parcel dot hover tooltip
      map.on('mouseenter', 'parcel-pts-dots', (e) => {
        map.getCanvas().style.cursor = 'crosshair';
        const props = e.features?.[0]?.properties;
        if (!props || !e.lngLat) return;
        const av = Number(props.assessedValue);
        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="background:#0f172a;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:11px;line-height:1.6;border:1px solid #334155;min-width:130px"><div style="color:#00FFFF;font-weight:700;font-family:monospace;margin-bottom:3px">${props.parcelId}</div><div>AV <span style="color:#fff;font-family:monospace">$${(av/1000).toFixed(0)}k</span></div></div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'parcel-pts-dots', () => {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // YoY bubble hover tooltip
      map.on('mouseenter', 'yoy-change-circles', (e) => {
        map.getCanvas().style.cursor = 'help';
        const props = e.features?.[0]?.properties;
        if (!props || !e.lngLat) return;
        const pct = Number(props.pctChange);
        const pctColor = pct > 5 ? '#4ade80' : pct > 0 ? '#86efac' : pct > -5 ? '#93c5fd' : '#60a5fa';
        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="background:#0f172a;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:11px;line-height:1.6;border:1px solid #334155;min-width:140px"><div style="color:#00FFFF;font-weight:700;margin-bottom:3px">${props.neighborhoodCode}</div><div>ΔAV <span style="color:${pctColor};font-weight:700;font-family:monospace">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</span></div><div style="color:#64748b;font-size:9px">n = ${props.parcelCount} parcels</div></div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'yoy-change-circles', () => {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Market-trend hover tooltip
      map.on('mouseenter', 'market-trend-circles', (e) => {
        map.getCanvas().style.cursor = 'help';
        const props = e.features?.[0]?.properties;
        if (!props || !e.lngLat) return;
        const pct = Number(props.pctChange);
        const pctColor = pct > 5 ? '#4ade80' : pct > 0 ? '#86efac' : pct > -5 ? '#fca5a5' : '#f87171';
        const curr = Number(props.currMedianPrice);
        const prev = Number(props.prevMedianPrice);
        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="background:#0f172a;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:11px;line-height:1.6;border:1px solid #334155;min-width:160px"><div style="color:#00FFFF;font-weight:700;margin-bottom:3px">${props.neighborhoodCode}</div><div>Mkt Δ <span style="color:${pctColor};font-weight:700;font-family:monospace">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</span></div><div style="color:#94a3b8;font-size:9px">${prev > 0 ? `$${(prev/1000).toFixed(0)}k → ` : ''}$${(curr/1000).toFixed(0)}k median</div><div style="color:#64748b;font-size:9px">n=${props.saleCount} sales</div></div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'market-trend-circles', () => {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });
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
            qualificationDecision: sp.qualificationDecision,
            propertyClass: sp.propertyClass,
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

  // Comparable sale highlights — yellow rings on top-scored comp dots
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource('comps-highlight') as mapboxgl.GeoJSONSource | undefined;
    if (!comparableSalePoints || comparableSalePoints.length === 0) {
      src?.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    src?.setData({
      type: 'FeatureCollection',
      features: comparableSalePoints.map((pt, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
        properties: { score: pt.score, rank: i + 1 },
      })),
    });
  }, [comparableSalePoints]);

  // Neighborhood polygon boundaries — reload when taxYear or poly layer visibility changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    if (!activeLayers.has('neighborhood-poly')) return;
    const src = map.getSource('neighborhoods-poly') as mapboxgl.GeoJSONSource | undefined;
    src?.setData(`/api/geoforge/neighborhoods/boundaries?taxYear=${filter.taxYear}`);
  }, [filter.taxYear, activeLayers]);

  // YoY AV change bubbles — fetch when layer toggled on
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource('yoy-change') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;

    if (!activeLayers.has('yoy-change')) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    fetch(`/api/geoforge/neighborhoods/av-change?taxYear=${filter.taxYear}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: import('./types/geoforge.types').YoyChangePoint[]) => {
        const fc: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: rows
            .filter(r => r.centroidLat !== 0)
            .map(r => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [r.centroidLng, r.centroidLat] },
              properties: {
                neighborhoodCode: r.neighborhoodCode,
                pctChange: r.pctChange,
                pctLabel: (r.pctChange >= 0 ? '+' : '') + r.pctChange.toFixed(1) + '%',
                parcelCount: r.parcelCount,
              },
            })),
        };
        src.setData(fc);
      })
      .catch(() => { /* data not available */ });
  }, [filter.taxYear, activeLayers]);

  // Market sale-price trend — fetch when layer toggled on
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource('market-trend') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;

    if (!activeLayers.has('market-trend')) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    fetch(`/api/geoforge/neighborhoods/sale-price-trend?taxYear=${filter.taxYear}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: import('./types/geoforge.types').MarketTrendPoint[]) => {
        src.setData({
          type: 'FeatureCollection',
          features: rows
            .filter(r => r.centroidLat !== 0)
            .map(r => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [r.centroidLng, r.centroidLat] },
              properties: {
                neighborhoodCode: r.neighborhoodCode,
                pctChange: r.pctChange,
                pctLabel: (r.pctChange >= 0 ? '+' : '') + r.pctChange.toFixed(1) + '%',
                currMedianPrice: r.currMedianPrice,
                prevMedianPrice: r.prevMedianPrice,
                saleCount: r.saleCount,
              },
            })),
        });
      })
      .catch(() => { /* unavailable */ });
  }, [filter.taxYear, activeLayers]);

  // Parcel points — loads when layer toggled on + a neighborhood is selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const src = map.getSource('parcel-pts') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;

    if (!activeLayers.has('parcel-polygons') || !selectedNeighborhoodCode) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const url = `/api/geoforge/parcels/points?taxYear=${filter.taxYear}&neighborhoodCode=${encodeURIComponent(selectedNeighborhoodCode)}`;
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: { parcelId: string; lat: number; lng: number; assessedValue: number }[]) => {
        src.setData({
          type: 'FeatureCollection',
          features: rows
            .filter(r => r.lat !== 0)
            .map(r => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
              properties: { parcelId: r.parcelId, assessedValue: r.assessedValue },
            })),
        });
      })
      .catch(() => { /* unavailable */ });
  }, [activeLayers, selectedNeighborhoodCode, filter.taxYear]);

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

  // Sale filter — month + price band
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const monthFilter = selectedMonth
      ? ['==', ['slice', ['get', 'saleDate'], 0, 7], selectedMonth]
      : true;

    const priceFilter = priceBand === '0-200' ? ['<', ['get', 'salePrice'], 200000]
      : priceBand === '200-400' ? ['all', ['>=', ['get', 'salePrice'], 200000], ['<', ['get', 'salePrice'], 400000]]
      : priceBand === '400-700' ? ['all', ['>=', ['get', 'salePrice'], 400000], ['<', ['get', 'salePrice'], 700000]]
      : priceBand === '700+' ? ['>=', ['get', 'salePrice'], 700000]
      : true;

    const classFilter = filter.propertyClass
      ? ['==', ['get', 'propertyClass'], filter.propertyClass]
      : true;

    const saleBase = ['all', ['!', ['has', 'point_count']], monthFilter, priceFilter, classFilter];

    if (map.getLayer('sale-circles')) {
      map.setFilter('sale-circles', saleBase as mapboxgl.FilterSpecification);
    }
    if (map.getLayer('sale-outlier-ring')) {
      map.setFilter('sale-outlier-ring', [
        ...saleBase,
        ['==', ['get', 'isOutlier'], true],
      ] as mapboxgl.FilterSpecification);
    }
  }, [selectedMonth, priceBand, filter.propertyClass]);

  // Toggle layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const layerMap: Partial<Record<MapLayer, string[]>> = {
      choropleth: ['neighborhood-fill', 'neighborhood-label'],
      'neighborhood-poly': ['neighborhood-poly-fill', 'neighborhood-poly-outline', 'neighborhood-poly-label'],
      'sale-scatter': ['sale-cluster-bubble', 'sale-cluster-count', 'sale-circles', 'sale-outlier-ring'],
      'yoy-change': ['yoy-change-circles', 'yoy-change-labels'],
      'market-trend': ['market-trend-circles', 'market-trend-labels'],
      'parcel-polygons': ['parcel-pts-dots'],
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

function addYoyChangeLayer(map: mapboxgl.Map) {
  map.addSource('yoy-change', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'yoy-change-circles',
    type: 'circle',
    source: 'yoy-change',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 20],
      'circle-color': [
        'step', ['get', 'pctChange'],
        '#3b82f6',  // < -5: blue (declining)
        -5, '#93c5fd',
        0,  '#86efac',
        5,  '#22c55e',
        10, '#15803d',
      ],
      'circle-opacity': 0.82,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#0f172a',
      'circle-stroke-opacity': 0.6,
    },
  });

  map.addLayer({
    id: 'yoy-change-labels',
    type: 'symbol',
    source: 'yoy-change',
    layout: {
      visibility: 'none',
      'text-field': ['get', 'pctLabel'],
      'text-size': 10,
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-anchor': 'center',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#0f172a',
      'text-halo-width': 1.5,
    },
  });
}

function addNeighborhoodPolyLayer(map: mapboxgl.Map) {
  map.addSource('neighborhoods-poly', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'neighborhood-poly-fill',
    type: 'fill',
    source: 'neighborhoods-poly',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.20, 13, 0.12],
    },
  });

  map.addLayer({
    id: 'neighborhood-poly-outline',
    type: 'line',
    source: 'neighborhoods-poly',
    layout: { visibility: 'none' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 13, 2.5],
      'line-opacity': 0.85,
    },
  });

  map.addLayer({
    id: 'neighborhood-poly-label',
    type: 'symbol',
    source: 'neighborhoods-poly',
    minzoom: 9,
    layout: {
      visibility: 'none',
      'text-field': ['get', 'neighborhoodCode'],
      'text-size': 10,
      'text-anchor': 'center',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 1.5,
    },
  });
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

  // Cluster bubble — visible at zoom < 12 before dots appear
  map.addLayer({
    id: 'sale-cluster-bubble',
    type: 'circle',
    source: 'sales',
    filter: ['has', 'point_count'],
    maxzoom: 12,
    paint: {
      'circle-color': [
        'step', ['get', 'point_count'],
        '#22d3ee', 10,
        '#06b6d4', 50,
        '#0891b2',
      ],
      'circle-radius': [
        'step', ['get', 'point_count'],
        14, 10, 20, 50, 26,
      ],
      'circle-opacity': 0.75,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#00FFFF',
      'circle-stroke-opacity': 0.5,
    },
  });

  map.addLayer({
    id: 'sale-cluster-count',
    type: 'symbol',
    source: 'sales',
    filter: ['has', 'point_count'],
    maxzoom: 12,
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 10,
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#0f172a',
      'text-halo-width': 1,
    },
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

function addCompsHighlightLayer(map: mapboxgl.Map) {
  map.addSource('comps-highlight', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'comps-highlight-ring',
    type: 'circle',
    source: 'comps-highlight',
    paint: {
      'circle-color': 'transparent',
      'circle-radius': 13,
      'circle-stroke-width': 3,
      'circle-stroke-color': '#facc15',
      'circle-stroke-opacity': 0.95,
    },
  });
  map.addLayer({
    id: 'comps-highlight-rank',
    type: 'symbol',
    source: 'comps-highlight',
    layout: {
      'text-field': ['get', 'rank'],
      'text-size': 9,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#facc15',
      'text-halo-color': '#000',
      'text-halo-width': 1.5,
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

function addMarketTrendLayer(map: mapboxgl.Map) {
  map.addSource('market-trend', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'market-trend-circles',
    type: 'circle',
    source: 'market-trend',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 11, 13, 22],
      'circle-color': [
        'step', ['get', 'pctChange'],
        '#f87171',   // < -5%: red (declining market)
        -5, '#fca5a5',
        0,  '#86efac',
        5,  '#22c55e',
        10, '#15803d',
      ],
      'circle-opacity': 0.80,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#0f172a',
      'circle-stroke-opacity': 0.5,
    },
  });

  map.addLayer({
    id: 'market-trend-labels',
    type: 'symbol',
    source: 'market-trend',
    layout: {
      visibility: 'none',
      'text-field': ['get', 'pctLabel'],
      'text-size': 10,
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-anchor': 'center',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#0f172a',
      'text-halo-width': 1.5,
    },
  });
}

function addParcelPointsLayer(map: mapboxgl.Map) {
  map.addSource('parcel-pts', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'parcel-pts-dots',
    type: 'circle',
    source: 'parcel-pts',
    minzoom: 13,
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 2.5, 17, 5],
      'circle-color': [
        'step', ['get', 'assessedValue'],
        '#60a5fa',    // < $150k: blue
        150000, '#4ade80',  // $150k-$300k: green
        300000, '#a3e635',  // $300k-$500k: lime
        500000, '#fb923c',  // $500k-$800k: orange
        800000, '#f87171',  // > $800k: red
      ],
      'circle-opacity': 0.72,
      'circle-stroke-width': 0.5,
      'circle-stroke-color': '#0f172a',
      'circle-stroke-opacity': 0.6,
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
