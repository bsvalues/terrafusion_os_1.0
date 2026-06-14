/**
 * TerraFusion OS — Benton County GIS Map (MapLibre GL JS — ADR-0021)
 *
 * ESRI satellite basemap centered on Benton County WA.
 * County boundary overlay + parcel layer from /api/benton-county/parcels.
 * Click-to-select parcel → opens PropertyWorkbench.
 */

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BENTON_CENTER: [number, number] = [-119.2687, 46.2619];
const BENTON_ZOOM = 10;

/** Approximate Benton County WA bounding box */
const BENTON_BOUNDARY_COORDS: [number, number][] = [
  [-119.875, 45.773],
  [-118.987, 45.773],
  [-118.987, 46.594],
  [-119.875, 46.594],
  [-119.875, 45.773],
];

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [{ id: 'esri-tiles', type: 'raster', source: 'esri', minzoom: 0, maxzoom: 19 }],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BentonCountyMapProps {
  onParcelSelect?: (parcelId: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BentonCountyMap({ onParcelSelect, className }: BentonCountyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: BENTON_CENTER,
      zoom: BENTON_ZOOM,
    });

    mapRef.current = map;

    map.on('load', () => {
      setLoading(false);

      const accentHs = getComputedStyle(document.documentElement)
        .getPropertyValue('--tf-transcend-cyan-hs')
        .trim() || '190 100%';
      const accentColor = `hsl(${accentHs} 60%)`;

      // County boundary outline
      map.addSource('county-boundary', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Benton County, WA', FIPS: '53005' },
              geometry: {
                type: 'Polygon',
                coordinates: [BENTON_BOUNDARY_COORDS],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: 'county-boundary-line',
        type: 'line',
        source: 'county-boundary',
        paint: {
          'line-color': accentColor,
          'line-width': 2.5,
          'line-opacity': 0.7,
        },
      });

      // Parcel layer — load from backend, graceful fallback if offline
      fetch('/api/benton-county/parcels?limit=500')
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((parcels: unknown[]) => {
          if (!Array.isArray(parcels) || parcels.length === 0) return;

          map.addSource('parcels', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: parcels.map((p: any) => ({
                type: 'Feature',
                properties: {
                  id: p.parcelNumber || String(p.objectId),
                  address: p.situsAddress || p.address || '',
                  owner: p.ownerName || '',
                  value: p.assessedValue || '',
                },
                geometry: p.geometry ?? {
                  type: 'Point',
                  coordinates: [
                    -119.2687 + (Math.random() - 0.5) * 0.6,
                    46.2619 + (Math.random() - 0.5) * 0.4,
                  ],
                },
              })),
            },
          });

          map.addLayer({
            id: 'parcel-fills',
            type: 'fill',
            source: 'parcels',
            paint: {
              'fill-color': accentColor,
              'fill-opacity': 0.12,
              'fill-outline-color': accentColor,
            },
          });

          map.addLayer({
            id: 'parcel-fills-hover',
            type: 'fill',
            source: 'parcels',
            paint: {
              'fill-color': accentColor,
              'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.35, 0],
            },
          });

          let hoveredId: string | number | null = null;

          map.on('mousemove', 'parcel-fills', (e) => {
            if (e.features && e.features.length > 0) {
              if (hoveredId !== null) {
                map.setFeatureState({ source: 'parcels', id: hoveredId }, { hover: false });
              }
              hoveredId = e.features[0].id ?? null;
              if (hoveredId !== null) {
                map.setFeatureState({ source: 'parcels', id: hoveredId }, { hover: true });
              }
              map.getCanvas().style.cursor = 'pointer';
            }
          });

          map.on('mouseleave', 'parcel-fills', () => {
            if (hoveredId !== null) {
              map.setFeatureState({ source: 'parcels', id: hoveredId }, { hover: false });
              hoveredId = null;
            }
            map.getCanvas().style.cursor = '';
          });

          map.on('click', 'parcel-fills', (e) => {
            const props = e.features?.[0]?.properties;
            if (props?.id && onParcelSelect) {
              onParcelSelect(String(props.id));
            }
          });
        })
        .catch(() => {
          // Backend offline — map shows satellite tiles without parcel layer
        });
    });

    map.on('error', () => {
      setLoading(false);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onParcelSelect]);

  return (
    <div data-testid='benton-county-map' className={`relative w-full h-full ${className ?? ''}`}>
      {loading && (
        <div
          className='absolute inset-0 flex items-center justify-center z-10'
          style={{ background: 'hsl(var(--tf-bg))' }}
        >
          <span className='text-xs' style={{ color: 'hsl(var(--tf-text))' }}>
            Loading map…
          </span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
