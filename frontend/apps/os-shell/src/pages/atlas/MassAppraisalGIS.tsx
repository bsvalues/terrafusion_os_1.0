/**
 * BIV-094: Mass Appraisal GIS Page
 * GIS visualization for mass appraisal spatial display.
 * Parcel map with color-coded overlays (neighborhood, zoning, property type).
 * Atlas renders spatial data -- it does NOT compute values or run sync.
 */
import { useCallback, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParcelFeature {
  id: string;
  parcelNumber: string;
  address: string;
  neighborhood: string;
  zoning: string;
  propertyType: string;
  sqft: number;
  lotSize: number;
  yearBuilt: number;
  stories: number;
  bedrooms: number;
  bathrooms: number;
  coordinates: [number, number];
  polygon?: [number, number][];
}

type OverlayMode = 'neighborhood' | 'zoning' | 'propertyType' | 'none';

interface LayerConfig {
  id: string;
  label: string;
  visible: boolean;
  color: string;
}

// ---------------------------------------------------------------------------
// Color palettes for overlays
// ---------------------------------------------------------------------------

const NEIGHBORHOOD_COLORS: Record<string, string> = {
  Downtown: '#3B82F6',
  Riverside: '#10B981',
  'West Hills': '#F59E0B',
  Eastgate: '#EF4444',
  Southridge: '#8B5CF6',
  Northview: '#EC4899',
  default: '#6B7280',
};

const ZONING_COLORS: Record<string, string> = {
  'R-1': '#22C55E',
  'R-2': '#16A34A',
  'R-3': '#15803D',
  'C-1': '#3B82F6',
  'C-2': '#2563EB',
  'C-3': '#1D4ED8',
  'I-1': '#F59E0B',
  'I-2': '#D97706',
  AG: '#A3E635',
  PUD: '#A855F7',
  default: '#9CA3AF',
};

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  Residential: '#22C55E',
  Commercial: '#3B82F6',
  Industrial: '#F59E0B',
  Agricultural: '#A3E635',
  Vacant: '#9CA3AF',
  'Multi-Family': '#8B5CF6',
  default: '#6B7280',
};

function getOverlayColor(mode: OverlayMode, parcel: ParcelFeature): string {
  if (mode === 'none') return '#00FFFF';
  const palettes: Record<string, Record<string, string>> = {
    neighborhood: NEIGHBORHOOD_COLORS,
    zoning: ZONING_COLORS,
    propertyType: PROPERTY_TYPE_COLORS,
  };
  const key =
    mode === 'neighborhood'
      ? parcel.neighborhood
      : mode === 'zoning'
        ? parcel.zoning
        : parcel.propertyType;
  return palettes[mode][key] ?? palettes[mode].default ?? '#6B7280';
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_PARCELS: ParcelFeature[] = [
  {
    id: 'p1',
    parcelNumber: '1-0234-100-0001',
    address: '123 Main St',
    neighborhood: 'Downtown',
    zoning: 'C-1',
    propertyType: 'Commercial',
    sqft: 4200,
    lotSize: 8500,
    yearBuilt: 1985,
    stories: 2,
    bedrooms: 0,
    bathrooms: 2,
    coordinates: [46.2304, -119.2],
  },
  {
    id: 'p2',
    parcelNumber: '1-0234-100-0002',
    address: '456 Oak Ave',
    neighborhood: 'Riverside',
    zoning: 'R-1',
    propertyType: 'Residential',
    sqft: 1850,
    lotSize: 7200,
    yearBuilt: 2001,
    stories: 1,
    bedrooms: 3,
    bathrooms: 2,
    coordinates: [46.235, -119.21],
  },
  {
    id: 'p3',
    parcelNumber: '1-0234-100-0003',
    address: '789 Industrial Pkwy',
    neighborhood: 'Eastgate',
    zoning: 'I-1',
    propertyType: 'Industrial',
    sqft: 12000,
    lotSize: 35000,
    yearBuilt: 1972,
    stories: 1,
    bedrooms: 0,
    bathrooms: 1,
    coordinates: [46.225, -119.19],
  },
  {
    id: 'p4',
    parcelNumber: '1-0234-100-0004',
    address: '321 Elm St',
    neighborhood: 'West Hills',
    zoning: 'R-2',
    propertyType: 'Multi-Family',
    sqft: 3600,
    lotSize: 5000,
    yearBuilt: 1995,
    stories: 2,
    bedrooms: 6,
    bathrooms: 4,
    coordinates: [46.24, -119.22],
  },
  {
    id: 'p5',
    parcelNumber: '1-0234-100-0005',
    address: '555 Country Rd',
    neighborhood: 'Southridge',
    zoning: 'AG',
    propertyType: 'Agricultural',
    sqft: 2200,
    lotSize: 180000,
    yearBuilt: 1960,
    stories: 1,
    bedrooms: 4,
    bathrooms: 2,
    coordinates: [46.215, -119.23],
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface LayerTogglePanelProps {
  layers: LayerConfig[];
  overlayMode: OverlayMode;
  onToggleLayer: (id: string) => void;
  onSetOverlayMode: (mode: OverlayMode) => void;
}

function LayerTogglePanel({
  layers,
  overlayMode,
  onToggleLayer,
  onSetOverlayMode,
}: LayerTogglePanelProps) {
  const overlayOptions: { value: OverlayMode; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'neighborhood', label: 'Neighborhood' },
    { value: 'zoning', label: 'Zoning' },
    { value: 'propertyType', label: 'Property Type' },
  ];

  return (
    <Card variant="glass" className="w-64">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-terra-cyan">Layers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {layers.map((layer) => (
          <label key={layer.id} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => onToggleLayer(layer.id)}
              className="accent-terra-cyan"
            />
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: layer.color }}
            />
            <span className="text-white/80">{layer.label}</span>
          </label>
        ))}

        <div className="border-t border-white/10 pt-3 mt-3">
          <p className="text-xs text-white/50 mb-2 uppercase tracking-wider">Color Overlay</p>
          {overlayOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm mb-1">
              <input
                type="radio"
                name="overlay"
                checked={overlayMode === opt.value}
                onChange={() => onSetOverlayMode(opt.value)}
                className="accent-terra-cyan"
              />
              <span className="text-white/80">{opt.label}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ParcelSidebarProps {
  parcel: ParcelFeature;
  onClose: () => void;
}

function ParcelSidebar({ parcel, onClose }: ParcelSidebarProps) {
  const details: { label: string; value: string | number }[] = [
    { label: 'Parcel #', value: parcel.parcelNumber },
    { label: 'Address', value: parcel.address },
    { label: 'Neighborhood', value: parcel.neighborhood },
    { label: 'Zoning', value: parcel.zoning },
    { label: 'Property Type', value: parcel.propertyType },
    { label: 'Sq Ft', value: parcel.sqft.toLocaleString() },
    { label: 'Lot Size', value: `${parcel.lotSize.toLocaleString()} sq ft` },
    { label: 'Year Built', value: parcel.yearBuilt },
    { label: 'Stories', value: parcel.stories },
    { label: 'Bedrooms', value: parcel.bedrooms },
    { label: 'Bathrooms', value: parcel.bathrooms },
  ];

  return (
    <Card variant="glass" className="w-72">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-terra-cyan">Parcel Details</CardTitle>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-lg leading-none"
            aria-label="Close parcel details"
          >
            x
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {details.map((d) => (
            <div key={d.label} className="flex justify-between text-sm">
              <dt className="text-white/50">{d.label}</dt>
              <dd className="text-white font-medium">{d.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function MassAppraisalGIS() {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('neighborhood');
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null);
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'parcels', label: 'Parcels', visible: true, color: '#00FFFF' },
    { id: 'roads', label: 'Roads', visible: true, color: '#94A3B8' },
    { id: 'water', label: 'Water Bodies', visible: false, color: '#3B82F6' },
    { id: 'flood', label: 'Flood Zones', visible: false, color: '#EF4444' },
    { id: 'contours', label: 'Contour Lines', visible: false, color: '#A3E635' },
  ]);

  const handleToggleLayer = useCallback((id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  }, []);

  const legendItems = useMemo(() => {
    const palettes: Record<string, Record<string, string>> = {
      neighborhood: NEIGHBORHOOD_COLORS,
      zoning: ZONING_COLORS,
      propertyType: PROPERTY_TYPE_COLORS,
    };
    if (overlayMode === 'none') return [];
    const palette = palettes[overlayMode];
    return Object.entries(palette)
      .filter(([k]) => k !== 'default')
      .map(([label, color]) => ({ label, color }));
  }, [overlayMode]);

  return (
    <div className="flex h-full bg-terra-midnight text-white">
      {/* Layer panel */}
      <aside className="flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-white/10">
        <LayerTogglePanel
          layers={layers}
          overlayMode={overlayMode}
          onToggleLayer={handleToggleLayer}
          onSetOverlayMode={setOverlayMode}
        />

        {legendItems.length > 0 && (
          <Card variant="glass" className="w-64">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-white/50">
                Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-white/70">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </aside>

      {/* Map area */}
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-terra-midnight">
          {/* Placeholder map grid */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="gis-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gis-grid)" />
            </svg>
          </div>

          {/* Parcel markers */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-6 p-8">
            {DEMO_PARCELS.map((parcel) => {
              const color = getOverlayColor(overlayMode, parcel);
              const isSelected = selectedParcel?.id === parcel.id;
              return (
                <button
                  key={parcel.id}
                  onClick={() => setSelectedParcel(isSelected ? null : parcel)}
                  className="relative group transition-transform hover:scale-105"
                  style={{
                    width: Math.max(60, Math.min(parcel.lotSize / 500, 180)),
                    height: Math.max(40, Math.min(parcel.lotSize / 800, 120)),
                  }}
                  aria-label={`Select parcel ${parcel.parcelNumber}`}
                >
                  <div
                    className="absolute inset-0 rounded border-2 transition-all"
                    style={{
                      backgroundColor: `${color}22`,
                      borderColor: isSelected ? '#FFFFFF' : `${color}88`,
                      boxShadow: isSelected ? `0 0 12px ${color}` : 'none',
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/70 group-hover:text-white truncate px-1">
                    {parcel.address}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1">
            <button
              className="w-8 h-8 rounded bg-terra-slate/60 border border-white/10 text-white/80 hover:bg-terra-slate hover:text-white transition-colors text-lg leading-none"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              className="w-8 h-8 rounded bg-terra-slate/60 border border-white/10 text-white/80 hover:bg-terra-slate hover:text-white transition-colors text-lg leading-none"
              aria-label="Zoom out"
            >
              -
            </button>
          </div>

          {/* Coordinate display */}
          <div className="absolute bottom-4 left-4 text-[10px] text-white/40 font-mono bg-terra-midnight/60 px-2 py-1 rounded">
            46.2304 N, 119.2000 W | Benton County, WA
          </div>
        </div>
      </main>

      {/* Parcel detail sidebar */}
      {selectedParcel && (
        <aside className="flex-shrink-0 p-4 border-l border-white/10">
          <ParcelSidebar parcel={selectedParcel} onClose={() => setSelectedParcel(null)} />
        </aside>
      )}
    </div>
  );
}
