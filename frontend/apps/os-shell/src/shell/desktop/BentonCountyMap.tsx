/**
 * TerraFusion OS — Benton County GIS Map
 *
 * Adapted from QUARANTINE/top-level-dirs/applications/bcbs-gis-pro-production/
 * client/src/components/TerraFusionMap.tsx
 *
 * Real Mapbox GL map:
 * - Satellite-streets style centered on Benton County WA
 * - County boundary overlay
 * - Parcel layer from /api/benton-county/parcels (graceful offline fallback)
 * - Click-to-select parcel → opens PropertyWorkbench
 *
 * Token: VITE_MAPBOX_ACCESS_TOKEN in .env.development
 */

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

    if (!token) {
      setError('Map requires VITE_MAPBOX_ACCESS_TOKEN — add it to .env.development');
      setLoading(false);
      return;
    }

    if (mapRef.current || !containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: BENTON_CENTER,
      zoom: BENTON_ZOOM,
      projection: 'mercator',
    });

    mapRef.current = map;

    map.on('load', () => {
      setLoading(false);

      // Resolve accent color from CSS token (Mapbox GL cannot use CSS custom properties)
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

  if (error) {
    return (
      <div
        className='w-full h-full flex items-center justify-center'
        style={{ background: 'hsl(var(--tf-bg))' }}
      >
        <span className='text-xs text-center px-6' style={{ color: 'hsl(var(--tf-destructive))' }}>
          {error}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      {loading && (
        <div
          className='absolute inset-0 flex items-center justify-center z-10'
          style={{ background: 'hsl(var(--tf-bg))' }}
        >
          <span className='text-xs' style={{ color: 'hsl(var(--tf-text-primary-hs) 35%)' }}>
            Loading map…
          </span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
