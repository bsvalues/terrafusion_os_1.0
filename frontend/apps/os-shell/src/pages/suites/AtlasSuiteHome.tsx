/**
 * TerraAtlas Suite Home -- Geographic Intelligence & Mapping
 * ===================================================================
 * Constitutional Suite: atlas (Article I)
 * Standalone route: /atlas
 *
 * Layout: Stage Tabs (horizontal) + content area
 * Phase 7 Design Manifesto: replaces sidebar navigation with Stage Tabs
 *   - TerraGIS: Parcel boundaries, aerial, zoning overlays
 *   - ParcelLens: Detailed parcel inspection with measurement tools
 *   - LayerWorks: Advanced layer management & spatial analysis
 *   - TerraSketch: Parcel geometry editing tools
 *   - TerraPrint: Map printing & PDF export
 *   - TerraExport: GIS data export (Shapefile, GeoJSON, KML)
 *   - TerraQuery: SQL-like spatial queries across county data
 */

import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { ArrowLeft, Globe, Map, Search, Layers, Crosshair, Printer, Download, Database } from 'lucide-react';

const GISModule = lazy(() => import('./modules/GISModule'));
const ParcelLensModule = lazy(() => import('./modules/ParcelLensModule'));
const LayerWorksModule = lazy(() => import('./modules/LayerWorksModule'));
const TerraSketchModule = lazy(() => import('./modules/TerraSketchModule'));
const TerraPrintModule = lazy(() => import('./modules/TerraPrintModule'));
const TerraExportModule = lazy(() => import('./modules/TerraExportModule'));
const TerraQueryModule = lazy(() => import('./modules/TerraQueryModule'));

interface AtlasModuleDef {
  id: string;
  label: string;
  icon: typeof Map;
  status: 'active' | 'planned';
  description: string;
}

const ATLAS_MODULES: AtlasModuleDef[] = [
  { id: 'gis', label: 'TerraGIS', icon: Map, status: 'active', description: 'Full GIS viewer with parcel boundaries, aerial imagery, and overlays' },
  { id: 'parcel-lens', label: 'ParcelLens', icon: Search, status: 'active', description: 'Detailed parcel inspection with measurement tools' },
  { id: 'layer-works', label: 'LayerWorks', icon: Layers, status: 'active', description: 'Advanced layer management and spatial analysis' },
  { id: 'terra-sketch', label: 'TerraSketch', icon: Crosshair, status: 'active', description: 'Parcel sketch and geometry editing tools' },
  { id: 'terra-print', label: 'TerraPrint', icon: Printer, status: 'active', description: 'Map printing and PDF export for field work' },
  { id: 'terra-export', label: 'TerraExport', icon: Download, status: 'active', description: 'GIS data export (Shapefile, GeoJSON, KML)' },
  { id: 'terra-query', label: 'TerraQuery', icon: Database, status: 'active', description: 'SQL-like spatial queries across county data' },
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

  return (
    <div data-testid="suite-atlas-root" className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Parcel Context Banner — shows when parcel is active */}
      <ParcelContextBanner suiteTabId="atlas" />
      {/* Header + Stage Tabs */}
      <header
        style={{
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-card-bg) / 0.5)',
        }}
        className='backdrop-blur-xl shrink-0'
      >
        <div className='max-w-[1600px] mx-auto px-6 pt-4 pb-0 flex items-center gap-4'>
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
        </div>

        {/* Stage Tabs */}
        <nav
          role='tablist'
          aria-label='TerraAtlas modules'
          className='max-w-[1600px] mx-auto px-6 flex gap-1 mt-3 overflow-x-auto'
        >
          {ATLAS_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isPlanned = mod.status === 'planned';
            return (
              <button
                key={mod.id}
                role='tab'
                aria-selected={isActive}
                aria-controls={`atlas-panel-${mod.id}`}
                onClick={() => !isPlanned && setActiveModule(mod.id)}
                disabled={isPlanned}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10'
                    : isPlanned
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-white/5'
                }`}
                style={{
                  color: isActive
                    ? 'hsl(var(--tf-fg))'
                    : 'hsl(var(--tf-muted))',
                  borderBottom: isActive
                    ? '2px solid hsl(var(--tf-suite-atlas))'
                    : '2px solid transparent',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    color: isActive
                      ? 'hsl(var(--tf-suite-atlas))'
                      : 'hsl(var(--tf-muted))',
                  }}
                />
                {mod.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Module Content */}
      <main className='flex-1 min-h-0 overflow-y-auto'>
        <Suspense fallback={<ModuleLoading />}>
          {activeModule === 'gis' && (
            <div role='tabpanel' id='atlas-panel-gis'><GISModule /></div>
          )}
          {activeModule === 'parcel-lens' && (
            <div role='tabpanel' id='atlas-panel-parcel-lens'><ParcelLensModule /></div>
          )}
          {activeModule === 'layer-works' && (
            <div role='tabpanel' id='atlas-panel-layer-works'><LayerWorksModule /></div>
          )}
          {activeModule === 'terra-sketch' && (
            <div role='tabpanel' id='atlas-panel-terra-sketch'><TerraSketchModule /></div>
          )}
          {activeModule === 'terra-print' && (
            <div role='tabpanel' id='atlas-panel-terra-print'><TerraPrintModule /></div>
          )}
          {activeModule === 'terra-export' && (
            <div role='tabpanel' id='atlas-panel-terra-export'><TerraExportModule /></div>
          )}
          {activeModule === 'terra-query' && (
            <div role='tabpanel' id='atlas-panel-terra-query'><TerraQueryModule /></div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
