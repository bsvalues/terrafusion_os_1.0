/**
 * TerraDossier Suite Home -- Evidence & Document Management
 * ===================================================================
 * Constitutional Suite: dossier (Article I)
 * Standalone route: /dossier
 *
 * Modules:
 *   - Documents: File repository with search & type filtering
 *   - Evidence: Chain-of-custody evidence viewer
 *   - Defense Packets, Photo Manager (planned)
 */

import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileStack, FolderOpen, Shield, Link2, Camera, Package, FileSearch } from 'lucide-react';
import { usePacsConnection } from '@/hooks/usePacsConnection';
import { PacsStatusBadge } from '@/components/PacsStatusBadge';

const DocumentsModule = lazy(() => import('./modules/DocumentsModule'));
const EvidenceModule = lazy(() => import('./modules/EvidenceModule'));

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
  { id: 'defense', label: 'Defense Packets', icon: Package, status: 'planned', description: 'BOE appeal defense packet assembly' },
  { id: 'chain', label: 'Chain of Custody', icon: Link2, status: 'planned', description: 'Full custody chain explorer with hash verification' },
  { id: 'photos', label: 'Photo Manager', icon: Camera, status: 'planned', description: 'Geotagged property photos with metadata' },
  { id: 'search', label: 'Deep Search', icon: FileSearch, status: 'planned', description: 'Full-text search across all documents and evidence' },
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
          <div className='p-2 rounded-lg' style={{ background: 'hsl(var(--tf-suite-dossier) / 0.15)' }}>
            <FileStack size={24} style={{ color: 'hsl(var(--tf-suite-dossier))' }} />
          </div>
          <div>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>TerraDossier</h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Document Management & Evidence Archive</p>
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
          {DOSSIER_MODULES.map((mod) => {
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
                  style={{ color: isActive ? 'hsl(var(--tf-suite-dossier))' : 'hsl(var(--tf-muted))' }}
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
            {activeModule === 'documents' && <DocumentsModule />}
            {activeModule === 'evidence' && <EvidenceModule />}
            {!['documents', 'evidence'].includes(activeModule) && (
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
