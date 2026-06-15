/**
 * TerraFusion OS — Benton County GIS Map
 *
 * Adapted from QUARANTINE/top-level-dirs/applications/bcbs-gis-pro-production/
 * client/src/components/TerraFusionMap.tsx
 *
 * Real Leaflet map:
 * - No-token OSM basemap centered on Benton County WA
 * - County boundary overlay
 * - Parcel layer from /api/benton-county/parcels (graceful offline fallback)
 * - Click-to-select parcel → opens PropertyWorkbench
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BENTON_CENTER: [number, number] = [46.2619, -119.2687];
const BENTON_ZOOM = 10;
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';

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
  const mapRef = useRef<L.Map | null>(null);
  const [parcelLayerStatus, setParcelLayerStatus] = useState<string>('Loading parcel layer...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const parcelLayerTimeout = window.setTimeout(() => {
      setParcelLayerStatus((current) =>
        current === 'Loading parcel layer...'
          ? 'Parcel layer unavailable: source check timed out'
          : current
      );
    }, 5000);

    const map = L.map(containerRef.current, {
      center: BENTON_CENTER,
      zoom: BENTON_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    mapRef.current = map;

    const tileLayer = L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    });

    tileLayer.on('tileerror', () => {
      setParcelLayerStatus('Map layer unavailable: tile provider request failed');
      setLoading(false);
    });

    tileLayer.addTo(map);
    setLoading(false);

    queueMicrotask(() => {
      map.invalidateSize();
    });

    // Resolve accent color from CSS token.
    const accentHs = getComputedStyle(document.documentElement)
      .getPropertyValue('--tf-transcend-cyan-hs')
      .trim() || '190 100%';
    const accentColor = `hsl(${accentHs} 60%)`;

    // County boundary outline.
    L.geoJSON(
      {
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
      {
        style: {
          color: accentColor,
          weight: 2.5,
          opacity: 0.7,
          fillOpacity: 0,
        },
      },
    ).addTo(map);

    // Parcel layer — load from backend. Missing geometry is reported, never fabricated.
    fetch('/api/benton-county/parcels?limit=500')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((parcels: unknown[]) => {
        setLoading(false);

        if (!Array.isArray(parcels) || parcels.length === 0) {
          setParcelLayerStatus('Parcel layer unavailable: no parcel features returned');
          return;
        }

        const features = parcels
          .filter((p: any) => p?.geometry)
          .map((p: any) => ({
            type: 'Feature' as const,
            properties: {
              id: p.parcelNumber || String(p.objectId),
              address: p.situsAddress || p.address || '',
              owner: p.ownerName || '',
              value: p.assessedValue || '',
            },
            geometry: p.geometry,
          }));

        if (features.length === 0) {
          setParcelLayerStatus('Parcel layer unavailable: source returned no geometry');
          return;
        }

        setParcelLayerStatus(`Parcel layer loaded: ${features.length} source geometries`);

        L.geoJSON(
          {
            type: 'FeatureCollection',
            features,
          },
          {
            style: {
              color: accentColor,
              weight: 1.5,
              opacity: 0.78,
              fillColor: accentColor,
              fillOpacity: 0.12,
            },
            onEachFeature: (feature, layer) => {
              layer.on({
                mouseover: () => {
                  if ('setStyle' in layer) {
                    layer.setStyle({ fillOpacity: 0.35 });
                  }
                },
                mouseout: () => {
                  if ('setStyle' in layer) {
                    layer.setStyle({ fillOpacity: 0.12 });
                  }
                },
                click: () => {
                  const parcelId = feature.properties?.id;
                  if (parcelId && onParcelSelect) {
                    onParcelSelect(String(parcelId));
                  }
                },
              });
            },
          },
        ).addTo(map);
      })
      .catch(() => {
        setLoading(false);
        setParcelLayerStatus('Parcel layer unavailable: API request failed');
      });

    return () => {
      window.clearTimeout(parcelLayerTimeout);
      map.remove();
      mapRef.current = null;
    };
  }, [onParcelSelect]);

  return (
    <div data-testid='benton-county-map' className={`relative w-full h-full ${className ?? ''}`}>
      <div
        data-testid='benton-map-status'
        className='absolute left-3 top-3 z-20 rounded-md px-3 py-2 text-xs'
        style={{
          border: '1px solid hsl(var(--tf-border) / 0.65)',
          background: 'hsl(var(--tf-bg) / 0.84)',
          color: 'hsl(var(--tf-text))',
        }}
      >
        <div className='font-semibold'>Benton County GIS Orientation</div>
        <div style={{ color: 'hsl(var(--tf-muted))' }}>{parcelLayerStatus}</div>
      </div>
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
