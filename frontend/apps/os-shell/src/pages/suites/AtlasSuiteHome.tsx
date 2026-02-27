/**
 * TerraAtlas Suite Home -- Geographic Intelligence & Mapping
 * ===================================================================
 * Constitutional Suite: atlas (Article I)
 * Standalone route: /atlas
 *
 * Modules:
 *   - TerraGIS: Parcel boundaries, aerial, zoning overlays
 *   - ParcelLens: Detailed parcel inspection
 *   - LayerWorks: Layer management & analysis
 */

import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Map, Search, Layers, Crosshair, Printer, Download, Database } from 'lucide-react';
import { usePacsConnection } from '@/hooks/usePacsConnection';
import { PacsStatusBadge } from '@/components/PacsStatusBadge';

const GISModule = lazy(() => import('./modules/GISModule'));

interface AtlasModuleDef {
  id: string;
  label: string;
  icon: typeof Map;
  status: 'active' | 'planned';
  description: string;
}

const ATLAS_MODULES: AtlasModuleDef[] = [
  { id: 'gis', label: 'TerraGIS', icon: Map, status: 'active', description: 'Full GIS viewer with parcel boundaries, aerial imagery, and overlays' },
  { id: 'parcel-lens', label: 'ParcelLens', icon: Search, status: 'planned', description: 'Detailed parcel inspection with measurement tools' },
  { id: 'layer-works', label: 'LayerWorks', icon: Layers, status: 'planned', description: 'Advanced layer management and spatial analysis' },
  { id: 'terra-sketch', label: 'TerraSketch', icon: Crosshair, status: 'planned', description: 'Parcel sketch and geometry editing tools' },
  { id: 'terra-print', label: 'TerraPrint', icon: Printer, status: 'planned', description: 'Map printing and PDF export for field work' },
  { id: 'terra-export', label: 'TerraExport', icon: Download, status: 'planned', description: 'GIS data export (Shapefile, GeoJSON, KML)' },
  { id: 'terra-query', label: 'TerraQuery', icon: Database, status: 'planned', description: 'SQL-like spatial queries across county data' },
];

function ModuleLoading() {
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading module...</p>
    </div>
  );
}

export default function AtlasSuiteHome() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('gis');
  const { status: pacsStatus, loading: pacsLoading } = usePacsConnection();

  return (
    <div className='min-h-screen' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }} className='backdrop-blur-xl'>
        <div className='max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4'>
          <button
            onClick={() => navigate('/')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className='p-2 rounded-lg' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.15)' }}>
            <Globe size={24} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
          </div>
          <div>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>TerraAtlas</h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Geographic Intelligence & Parcel Mapping</p>
          </div>
          <div className='ml-auto'>
            <PacsStatusBadge status={pacsStatus} loading={pacsLoading} />
          </div>
        </div>
      </header>

      <div className='flex'>
        {/* Module Sidebar */}
        <nav className='w-64 shrink-0 p-4 space-y-1' style={{ borderRight: '1px solid hsl(var(--tf-border))' }}>
          <p className='text-xs font-medium uppercase tracking-wider px-3 py-2' style={{ color: 'hsl(var(--tf-muted))' }}>
            Modules
          </p>
          {ATLAS_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isPlanned = mod.status === 'planned';
            return (
              <button
                key={mod.id}
                onClick={() => !isPlanned && setActiveModule(mod.id)}
                disabled={isPlanned}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-white/10'
                    : isPlanned
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/5'
                }`}
              >
                <Icon
                  size={18}
                  style={{ color: isActive ? 'hsl(var(--tf-suite-atlas))' : 'hsl(var(--tf-muted))' }}
                />
                <div>
                  <span
                    className='text-sm font-medium'
                    style={{ color: isActive ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))' }}
                  >
                    {mod.label}
                  </span>
                  {isPlanned && (
                    <span className='ml-2 text-xs px-1.5 py-0.5 rounded' style={{ background: 'hsl(var(--tf-muted) / 0.15)', color: 'hsl(var(--tf-muted))' }}>
                      Planned
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Module Content */}
        <main className='flex-1 min-w-0'>
          <Suspense fallback={<ModuleLoading />}>
            {activeModule === 'gis' && <GISModule />}
            {activeModule !== 'gis' && (
              <div className='p-6 flex items-center justify-center min-h-[400px]'>
                <p style={{ color: 'hsl(var(--tf-muted))' }}>
                  Module under development
                </p>
              </div>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
