/**
 * TerraDossier Suite Home -- Evidence & Document Management
 * ===================================================================
 * Constitutional Suite: dossier (Article I)
 * Standalone route: /dossier
 * Layout: Stage Tabs (horizontal) + content area
 * Phase 7 Design Manifesto: replaces sidebar navigation with Stage Tabs
 *
 * Modules (ALL 6 ACTIVE):
 *   - Documents: File repository with search & type filtering
 *   - Evidence: Chain-of-custody evidence viewer
 *   - Defense Packets: BOE appeal defense packet assembly
 *   - Chain of Custody: Full custody chain with hash verification
 *   - Photo Manager: Geotagged property photos
 *   - Deep Search: Full-text search across all content
 */

import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { ArrowLeft, FileStack, FolderOpen, Shield, Link2, Camera, Package, FileSearch } from 'lucide-react';

const DocumentsModule = lazy(() => import('./modules/DocumentsModule'));
const EvidenceModule = lazy(() => import('./modules/EvidenceModule'));
const DefensePacketsModule = lazy(() => import('./modules/DefensePacketsModule'));
const ChainOfCustodyModule = lazy(() => import('./modules/ChainOfCustodyModule'));
const PhotoManagerModule = lazy(() => import('./modules/PhotoManagerModule'));
const DeepSearchModule = lazy(() => import('./modules/DeepSearchModule'));

interface DossierModuleDef {
  id: string;
  label: string;
  icon: typeof FolderOpen;
  status: 'active' | 'planned';
  description: string;
}

const DOSSIER_MODULES: DossierModuleDef[] = [
  { id: 'documents', label: 'Document Manager', icon: FolderOpen, status: 'active', description: 'File repository with search, type filtering, custody chain' },
  { id: 'evidence', label: 'Evidence Viewer', icon: Shield, status: 'active', description: 'Chain-of-custody evidence registry and timeline' },
  { id: 'defense', label: 'Defense Packets', icon: Package, status: 'active', description: 'BOE appeal defense packet assembly' },
  { id: 'chain', label: 'Chain of Custody', icon: Link2, status: 'active', description: 'Full custody chain explorer with hash verification' },
  { id: 'photos', label: 'Photo Manager', icon: Camera, status: 'active', description: 'Geotagged property photos with metadata' },
  { id: 'search', label: 'Deep Search', icon: FileSearch, status: 'active', description: 'Full-text search across all documents and evidence' },
];

function ModuleLoading() {
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading module...</p>
    </div>
  );
}

export default function DossierSuiteHome() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('documents');

  return (
    <div data-testid="suite-dossier-root" className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Parcel Context Banner — shows when parcel is active */}
      <ParcelContextBanner suiteTabId="dossier" />
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
          <div className='p-2 rounded-lg' style={{ background: 'hsl(var(--tf-suite-dossier) / 0.15)' }}>
            <FileStack size={24} style={{ color: 'hsl(var(--tf-suite-dossier))' }} />
          </div>
          <div>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>TerraDossier</h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Document Management & Evidence Archive</p>
          </div>
        </div>

        {/* Stage Tabs */}
        <nav
          role='tablist'
          aria-label='TerraDossier modules'
          className='max-w-[1600px] mx-auto px-6 flex gap-1 mt-3 overflow-x-auto'
        >
          {DOSSIER_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isPlanned = mod.status === 'planned';
            return (
              <button
                key={mod.id}
                role='tab'
                aria-selected={isActive}
                aria-controls={`dossier-panel-${mod.id}`}
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
                    ? '2px solid hsl(var(--tf-suite-dossier))'
                    : '2px solid transparent',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    color: isActive
                      ? 'hsl(var(--tf-suite-dossier))'
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
          {activeModule === 'documents' && (
            <div role='tabpanel' id='dossier-panel-documents'><DocumentsModule /></div>
          )}
          {activeModule === 'evidence' && (
            <div role='tabpanel' id='dossier-panel-evidence'><EvidenceModule /></div>
          )}
          {activeModule === 'defense' && (
            <div role='tabpanel' id='dossier-panel-defense'><DefensePacketsModule /></div>
          )}
          {activeModule === 'chain' && (
            <div role='tabpanel' id='dossier-panel-chain'><ChainOfCustodyModule /></div>
          )}
          {activeModule === 'photos' && (
            <div role='tabpanel' id='dossier-panel-photos'><PhotoManagerModule /></div>
          )}
          {activeModule === 'search' && (
            <div role='tabpanel' id='dossier-panel-search'><DeepSearchModule /></div>
          )}
          {!['documents', 'evidence', 'defense', 'chain', 'photos', 'search'].includes(activeModule) && (
            <div className='p-6 flex items-center justify-center min-h-[400px]'>
              <p style={{ color: 'hsl(var(--tf-muted))' }}>
                Module under development
              </p>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
