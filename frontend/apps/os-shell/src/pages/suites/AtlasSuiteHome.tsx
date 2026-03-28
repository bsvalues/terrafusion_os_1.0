/**
 * TerraAtlas Suite Home -- Geographic Intelligence & Mapping
 * ===================================================================
 * Constitutional Suite: atlas (Article II)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats, module launcher grid, recent parcel queue.
 * Does NOT host parcel execution — that lives in the Property Workbench.
 */

import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { useCountyStats } from '../../hooks/useCountyStats';
import {
  ArrowLeft,
  Map,
  Search,
  Layers,
  Crosshair,
  Printer,
  Download,
  Database,
  BarChart2,
  Globe,
} from 'lucide-react';

const ATLAS_MODULES: SuiteModuleDef[] = [
  // Workbench-mode (parcel-scoped, opens Property Workbench)
  { id: 'gis', label: 'TerraGIS', icon: Map, description: 'Full GIS viewer with parcel boundaries, aerial imagery, and overlays', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'parcel-lens', label: 'ParcelLens', icon: Search, description: 'Detailed parcel inspection with measurement tools', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'layer-works', label: 'LayerWorks', icon: Layers, description: 'Advanced layer management and spatial analysis', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-sketch', label: 'TerraSketch', icon: Crosshair, description: 'Parcel sketch and geometry editing tools', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-print', label: 'TerraPrint', icon: Printer, description: 'Map printing and PDF export for field work', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-export', label: 'TerraExport', icon: Download, description: 'GIS data export (Shapefile, GeoJSON, KML)', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-query', label: 'TerraQuery', icon: Database, description: 'SQL-like spatial queries across county data', launchMode: 'workbench', workbenchTab: 'atlas' },
  // Standalone-mode (county-wide, opens standalone window)
  { id: 'terra-gis-pro', label: 'TerraGIS Pro', icon: Map, description: 'Full county-wide GIS platform — advanced cartography & spatial analysis', launchMode: 'standalone', moduleId: 'terra-gis' },
  { id: 'geo-equity-dashboard', label: 'Geo Equity', icon: BarChart2, description: 'Geographic equity analysis — market-value equity by area, district, and property class', launchMode: 'standalone', moduleId: 'geo-equity-dashboard' },
  { id: 'mass-appraisal-gis', label: 'Appraisal GIS', icon: Globe, description: 'Mass appraisal spatial visualization — value heat maps, sale ratio overlays, and cluster analysis', launchMode: 'standalone', moduleId: 'mass-appraisal-gis' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');

export default function AtlasSuiteHome() {
  const navigate = useNavigate();
  const { stats, loading, error } = useCountyStats();

  return (
    <div data-testid="suite-atlas-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="atlas" />

      {loading && !stats && (
        <div data-testid="atlas-loading" role="status" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Loading stats...</div>
      )}
      {error && (
        <div data-testid="atlas-error" role="alert" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-suite-atlas))' }}>{error}</div>
      )}

      {/* Stats Strip */}
      {stats && (
        <div data-testid="atlas-stats" className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Parcels</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.totalParcels)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>By City</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{Object.keys(stats.parcelsByCity).length} cities</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Property Types</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{Object.keys(stats.parcelsByType).length} types</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Residential</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.parcelsByType.residential ?? 0)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Commercial</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.parcelsByType.commercial ?? 0)}</span></div>
        </div>
      )}

      {/* Header */}
      <header
        style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }}
        className="backdrop-blur-xl shrink-0"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-atlas) / 0.15)' }}>
            <Map size={24} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
          </div>
          <div>
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraAtlas</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Geographic Intelligence & Spatial Analysis</p>
          </div>
        </div>
      </header>

      {/* Module Grid + Operational Queue */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div data-testid="atlas-modules"><SuiteModuleGrid modules={ATLAS_MODULES} accentVar="--tf-suite-atlas" /></div>
        <div data-testid="atlas-queue"><OperationalQueue title="Recent Parcels" accentVar="--tf-suite-atlas" emptyMessage="No recent parcel activity" /></div>
      </main>
    </div>
  );
}
