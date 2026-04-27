// GeoForge v2 — Mapbox surface.
//
// Three layers, in Lumin Bridge palette:
//   1. Neighborhood outlines (concave-hull, from /v2/neighborhoods/outline)
//   2. Parcel polygons at zoom >= 13 (from /v2/parcels/tiles, bbox-filtered)
//   3. Selected neighborhood halo + parcel hover
//
// Basemap: Mapbox light-v11 (warm-leaning, approximate linen).
// Click neighborhood → select. Click parcel → emit.

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { NbhdOutlineCollection, ParcelTileCollection, ParcelTileProps } from './v2Api';
import type { V2LayerId } from './LeftPanel';
import type { MapContextPayload } from './mapContext';

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ?? '';
mapboxgl.accessToken = MAPBOX_TOKEN;

const DEFAULT_CENTER: [number, number] = [-120.9, 47.35];
const DEFAULT_ZOOM = 6.6;
const PARCEL_ZOOM_MIN = 13;

interface Props {
  mapRef?: React.RefObject<unknown>;
  onMapReady?: (map: unknown | null) => void;
  outlines: NbhdOutlineCollection | null;
  parcels: ParcelTileCollection | null;
  selectedNeighborhoodCode: string | null;
  onNeighborhoodClick: (code: string) => void;
  onParcelClick: (parcel: ParcelTileProps) => void;
  onViewportChange: (bbox: [number, number, number, number], zoom: number) => void;
  visibleLayers: Set<V2LayerId>;
  mapCtx: MapContextPayload;
  initialViewport?: {
    center: [number, number];
    zoom: number;
  };
}

export function GeoForgeV2Map({
  mapRef: externalMapRef,
  onMapReady,
  outlines,
  parcels,
  selectedNeighborhoodCode,
  onNeighborhoodClick,
  onParcelClick,
  onViewportChange,
  visibleLayers,
  mapCtx,
  initialViewport,
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // ── Init map once ─────────────────────────────────────────
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialViewport?.center ?? DEFAULT_CENTER,
      zoom: initialViewport?.zoom ?? DEFAULT_ZOOM,
      minZoom: 6,
      maxZoom: 18,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-right');

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
      className: 'gf2-popup',
    });

    map.on('load', () => {
      // Sources
      map.addSource('nbhd-outlines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addSource('parcels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'parcelId',
      });

      // Layer: neighborhood fill (under parcels)
      map.addLayer({
        id: 'nbhd-fill',
        type: 'fill',
        source: 'nbhd-outlines',
        paint: {
          'fill-color': [
            'match',
            ['get', 'grade'],
            'A', 'hsl(140, 22%, 56%)',
            'B', 'hsl(140, 28%, 60%)',
            'C', 'hsl(32, 58%, 55%)',
            'D', 'hsl(16, 55%, 56%)',
            'F', 'hsl(16, 62%, 48%)',
            /* default */ 'hsl(38, 18%, 78%)',
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'neighborhoodCode'], ['literal', '']],
            0.08,
            0.18,
          ],
        },
      });

      // Layer: neighborhood outline
      map.addLayer({
        id: 'nbhd-line',
        type: 'line',
        source: 'nbhd-outlines',
        paint: {
          'line-color': [
            'match',
            ['get', 'grade'],
            'A', 'hsl(140, 22%, 38%)',
            'B', 'hsl(140, 28%, 42%)',
            'C', 'hsl(32, 58%, 40%)',
            'D', 'hsl(16, 55%, 40%)',
            'F', 'hsl(16, 62%, 32%)',
            /* default */ 'hsl(38, 18%, 55%)',
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            9, 0.6,
            13, 1.2,
            16, 2,
          ],
          'line-opacity': 0.65,
        },
      });

      // Layer: selected neighborhood halo (terracotta)
      map.addLayer({
        id: 'nbhd-halo',
        type: 'line',
        source: 'nbhd-outlines',
        filter: ['==', ['get', 'neighborhoodCode'], '__none__'],
        paint: {
          'line-color': 'hsl(16, 55%, 50%)',
          'line-width': 3.5,
          'line-blur': 1,
        },
      });

      // Parcel polygons — only visible at zoom >= 13
      map.addLayer({
        id: 'parcel-fill',
        type: 'fill',
        source: 'parcels',
        minzoom: PARCEL_ZOOM_MIN,
        paint: {
          // Color by ratioDeviation: sage if under, terracotta if over, parchment if no sale
          'fill-color': [
            'coalesce',
            ['feature-state', 'atlasColor'],
            [
              'case',
              ['==', ['get', 'ratio'], null],
              'hsl(42, 18%, 88%)',
              ['<=', ['get', 'ratioDeviation'], -0.10], 'hsl(140, 22%, 42%)',
              ['<=', ['get', 'ratioDeviation'], -0.05], 'hsl(140, 28%, 58%)',
              ['<=', ['get', 'ratioDeviation'],  0.05], 'hsl(44, 16%, 92%)',
              ['<=', ['get', 'ratioDeviation'],  0.10], 'hsl(16, 55%, 66%)',
              'hsl(16, 62%, 48%)',
            ],
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'atlasOverlayActive'], false],
            0.82,
            0.55,
          ],
          'fill-outline-color': 'hsla(30, 20%, 25%, 0.25)',
        },
      });

      // Parcel outlier glow (amber stroke)
      map.addLayer({
        id: 'parcel-outlier',
        type: 'line',
        source: 'parcels',
        minzoom: PARCEL_ZOOM_MIN,
        filter: ['==', ['get', 'isOutlier'], true],
        paint: {
          'line-color': 'hsl(32, 90%, 45%)',
          'line-width': 2,
          'line-blur': 0.5,
        },
      });

      // Viewport change → emit bbox for parcel fetch
      const emitViewport = () => {
        const b = map.getBounds();
        onViewportChange(
          [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
          map.getZoom(),
        );
      };
      map.on('moveend', emitViewport);
      map.on('zoomend', emitViewport);
      emitViewport();

      // Clicks
      map.on('click', 'parcel-fill', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        e.preventDefault();
        onParcelClick(f.properties as unknown as ParcelTileProps);
      });

      map.on('click', 'nbhd-fill', (e) => {
        if (e.defaultPrevented) return;
        const f = e.features?.[0];
        if (!f) return;
        const code = (f.properties as { neighborhoodCode?: string }).neighborhoodCode;
        if (code) onNeighborhoodClick(code);
      });

      // Hover
      map.on('mousemove', 'nbhd-fill', (e) => {
        if (map.getZoom() >= PARCEL_ZOOM_MIN) return;
        const f = e.features?.[0];
        if (!f || !popupRef.current) return;
        const props = f.properties as { neighborhoodCode?: string; medianRatio?: number; saleCount?: number; grade?: string };
        map.getCanvas().style.cursor = 'pointer';
        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family: var(--font-primary); font-size: 10px;">
              <div style="font-weight:700; letter-spacing: 0.14em; text-transform: uppercase; color: hsl(var(--tf-muted));">Neighborhood ${props.neighborhoodCode ?? ''}</div>
              <div style="font-family: var(--font-mono); margin-top: 3px; color: hsl(var(--tf-text));">
                Grade ${props.grade ?? '-'} · med ${(props.medianRatio ?? 0).toFixed(3)} · n=${props.saleCount ?? 0}
              </div>
            </div>`,
          )
          .addTo(map);
      });

      map.on('mouseleave', 'nbhd-fill', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });

      map.on('mouseenter', 'parcel-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'parcel-fill', () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;
    if (externalMapRef) {
      (externalMapRef as { current: unknown }).current = map;
    }
    onMapReady?.(map);

    return () => {
      if (externalMapRef) {
        (externalMapRef as { current: unknown }).current = null;
      }
      onMapReady?.(null);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMapRef, initialViewport, onMapReady]);

  // ── Push outlines to source ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !outlines) return;
    const src = map.getSource('nbhd-outlines') as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData(outlines as unknown as GeoJSON.FeatureCollection);
  }, [outlines]);

  // ── Push parcels to source ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !parcels) return;
    const src = map.getSource('parcels') as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData(parcels as unknown as GeoJSON.FeatureCollection);
  }, [parcels]);

  // ── Update selected halo + optional fly ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) return;

    const filterCode = selectedNeighborhoodCode ?? '__none__';
    if (map.getLayer('nbhd-halo')) {
      map.setFilter('nbhd-halo', ['==', ['get', 'neighborhoodCode'], filterCode]);
    }

    // Fly to selected if we have outline
    if (selectedNeighborhoodCode && outlines) {
      const f = outlines.features.find(
        (x) => x.properties.neighborhoodCode === selectedNeighborhoodCode,
      );
      if (f) {
        const coords = f.geometry.coordinates[0];
        if (coords.length) {
          let minX = coords[0][0], minY = coords[0][1];
          let maxX = coords[0][0], maxY = coords[0][1];
          for (const [x, y] of coords) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
          map.fitBounds([[minX, minY], [maxX, maxY]], {
            padding: 60,
            maxZoom: 14,
            duration: 900,
          });
        }
      }
    }
  }, [selectedNeighborhoodCode, outlines]);

  // ── Recenter when the caller upgrades route scope after mount ─────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialViewport || selectedNeighborhoodCode) return;

    map.jumpTo({
      center: initialViewport.center,
      zoom: initialViewport.zoom,
    });
  }, [initialViewport, selectedNeighborhoodCode]);

  // ── Sync layer visibility ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const setVis = (layerId: string, visible: boolean) => {
        if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      };
      setVis('nbhd-fill', visibleLayers.has('nbhd'));
      setVis('nbhd-line', visibleLayers.has('nbhd'));
      setVis('nbhd-halo', visibleLayers.has('nbhd'));
      setVis('parcel-fill', visibleLayers.has('parcels'));
      setVis('parcel-outlier', visibleLayers.has('outliers'));
    };
    if (map.isStyleLoaded()) { apply(); } else { map.once('styledata', apply); }
  }, [visibleLayers]);

  // ── Apply map context render mode ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
    switch (mapCtx.mode) {
      case 'county-grade':
        // Boost nbhd opacity, hide parcels
        if (map.getLayer('nbhd-fill'))
          map.setPaintProperty('nbhd-fill', 'fill-opacity', 0.45);
        if (map.getLayer('parcel-fill'))
          map.setLayoutProperty('parcel-fill', 'visibility', 'none');
        break;

      case 'outliers':
        // Dim nbhd fill, two-color parcels: amber for outliers, near-invisible for rest
        if (map.getLayer('nbhd-fill'))
          map.setPaintProperty('nbhd-fill', 'fill-opacity', 0.08);
        if (map.getLayer('parcel-fill')) {
          map.setLayoutProperty('parcel-fill', 'visibility', 'visible');
          map.setPaintProperty('parcel-fill', 'fill-color', [
            'case',
            ['==', ['get', 'isOutlier'], true], 'hsl(32, 90%, 50%)',
            'hsla(42, 18%, 88%, 0.2)',
          ]);
          map.setPaintProperty('parcel-fill', 'fill-opacity', 0.75);
        }
        break;

      case 'vintage-split': {
        const cut = mapCtx.vintageCut ?? 2015;
        if (map.getLayer('parcel-fill')) {
          map.setLayoutProperty('parcel-fill', 'visibility', 'visible');
          map.setPaintProperty('parcel-fill', 'fill-color', [
            'case',
            ['<', ['to-number', ['slice', ['get', 'saleDate'], 0, 4]], cut],
            'hsl(210, 70%, 55%)',   // pre-cut: blue
            'hsl(16, 62%, 52%)',    // post-cut: terracotta
          ]);
          map.setPaintProperty('parcel-fill', 'fill-opacity', 0.65);
        }
        break;
      }

      case 'sim-delta':
        // Color by whether ratio deviation is positive or negative
        if (map.getLayer('parcel-fill')) {
          map.setLayoutProperty('parcel-fill', 'visibility', 'visible');
          map.setPaintProperty('parcel-fill', 'fill-color', [
            'case',
            ['==', ['get', 'ratio'], null], 'hsl(42, 18%, 88%)',
            ['>', ['get', 'ratioDeviation'], 0], 'hsl(16, 62%, 52%)',
            'hsl(140, 22%, 42%)',
          ]);
          map.setPaintProperty('parcel-fill', 'fill-opacity', 0.7);
        }
        break;

      default: // 'default' — restore original ratio-deviation heat paint
        if (map.getLayer('nbhd-fill'))
          map.setPaintProperty('nbhd-fill', 'fill-opacity', [
            'case',
            ['==', ['get', 'neighborhoodCode'], ['literal', '']],
            0.08,
            0.18,
          ]);
        if (map.getLayer('parcel-fill')) {
          map.setLayoutProperty('parcel-fill', 'visibility', 'visible');
          map.setPaintProperty('parcel-fill', 'fill-color', [
            'case',
            ['==', ['get', 'ratio'], null], 'hsl(42, 18%, 88%)',
            ['<=', ['get', 'ratioDeviation'], -0.10], 'hsl(140, 22%, 42%)',
            ['<=', ['get', 'ratioDeviation'], -0.05], 'hsl(140, 28%, 58%)',
            ['<=', ['get', 'ratioDeviation'],  0.05], 'hsl(44, 16%, 92%)',
            ['<=', ['get', 'ratioDeviation'],  0.10], 'hsl(16, 55%, 66%)',
            'hsl(16, 62%, 48%)',
          ]);
          map.setPaintProperty('parcel-fill', 'fill-opacity', 0.55);
        }
    }

    // visibleLayers takes precedence over mapCtx for layer visibility
    if (!visibleLayers.has('parcels') && map.getLayer('parcel-fill'))
      map.setLayoutProperty('parcel-fill', 'visibility', 'none');
    if (!visibleLayers.has('outliers') && map.getLayer('parcel-outlier'))
      map.setLayoutProperty('parcel-outlier', 'visibility', 'none');
    if (!visibleLayers.has('nbhd')) {
      ['nbhd-fill', 'nbhd-line', 'nbhd-halo'].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
      });
    }
    };
    if (map.isStyleLoaded()) { apply(); } else { map.once('styledata', apply); }
  }, [mapCtx, visibleLayers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
        Mapbox token missing (VITE_MAPBOX_ACCESS_TOKEN).
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {mapCtx.mode !== 'default' && (
        <div className="absolute top-2 left-2 z-10 bg-slate-900/90 border border-slate-600/60 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded pointer-events-none">
          {mapCtx.label}
        </div>
      )}
    </div>
  );
}
