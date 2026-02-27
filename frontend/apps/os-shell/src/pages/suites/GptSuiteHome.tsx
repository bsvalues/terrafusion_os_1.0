/**
 * TerraGPT Suite Home -- AI Assistant & Natural Language Interface
 * ===================================================================
 * Constitutional Suite: gpt (Article I)
 * Standalone route: /gpt
 *
 * Modules:
 *   - GPT Studio: Interactive chat with AI assistants
 *   - GPT Builder: Create custom GPT configurations
 *   - GPT Marketplace: Browse and install GPTs
 */

import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, MessageSquare, Wrench, Store, BarChart3, Database, Settings } from 'lucide-react';

// Lazy load existing GPT components
const GptStudioView = lazy(() =>
  import('@/features/gpt/GptStudioView').catch(() => ({
    default: () => <GptPlaceholder module='GPT Studio' />,
  }))
);
const GPTMarketplace = lazy(() =>
  import('@/components/gpt/GPTMarketplace').catch(() => ({
    default: () => <GptPlaceholder module='GPT Marketplace' />,
  }))
);
const GPTManagementDashboard = lazy(() =>
  import('@/components/gpt/GPTManagementDashboard').catch(() => ({
    default: () => <GptPlaceholder module='GPT Management' />,
  }))
);
const GPTBuilderModule = lazy(() =>
  import('./modules/GPTBuilderModule').catch(() => ({
    default: () => <GptPlaceholder module='GPT Builder' />,
  }))
);
const GPTAnalyticsModule = lazy(() =>
  import('./modules/GPTAnalyticsModule').catch(() => ({
    default: () => <GptPlaceholder module='GPT Analytics' />,
  }))
);
const RAGDatasetsModule = lazy(() =>
  import('./modules/RAGDatasetsModule').catch(() => ({
    default: () => <GptPlaceholder module='RAG Datasets' />,
  }))
);

function GptPlaceholder({ module }: { module: string }) {
  return (
    <div className='p-6 flex items-center justify-center min-h-[400px]'>
      <div className='text-center'>
        <Bot size={48} className='mx-auto mb-3' style={{ color: 'hsl(var(--tf-suite-gpt) / 0.3)' }} />
        <p style={{ color: 'hsl(var(--tf-muted))' }}>{module} loading...</p>
      </div>
    </div>
  );
}

interface GptModuleDef {
  id: string;
  label: string;
  icon: typeof MessageSquare;
  status: 'active' | 'planned';
  description: string;
}

const GPT_MODULES: GptModuleDef[] = [
  { id: 'studio', label: 'GPT Studio', icon: MessageSquare, status: 'active', description: 'Interactive chat with AI assistants' },
  { id: 'marketplace', label: 'GPT Marketplace', icon: Store, status: 'active', description: 'Browse, install, and rate GPT configurations' },
  { id: 'management', label: 'GPT Management', icon: Settings, status: 'active', description: 'Dashboard for GPT usage, statistics, and configuration' },
  { id: 'builder', label: 'GPT Builder', icon: Wrench, status: 'active', description: 'Create custom GPT configurations with RAG' },
  { id: 'analytics', label: 'GPT Analytics', icon: BarChart3, status: 'active', description: 'Usage analytics and cost tracking' },
  { id: 'rag', label: 'RAG Datasets', icon: Database, status: 'active', description: 'Manage knowledge bases for RAG-enabled GPTs' },
];

function ModuleLoading() {
  return (
    <div className='flex items-center justify-center min-h-[400px]'>
      <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading module...</p>
    </div>
  );
}

export default function GptSuiteHome() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('studio');

  return (
    <div className='h-full flex flex-col' style={{ background: 'hsl(var(--tf-bg))' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }} className='backdrop-blur-xl'>
        <div className='max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4'>
          <button
            onClick={() => navigate('/')}
            className='p-2 rounded-lg hover:bg-white/5 transition-colors'
          >
            <ArrowLeft size={20} style={{ color: 'hsl(var(--tf-muted))' }} />
          </button>
          <div className='p-2 rounded-lg' style={{ background: 'hsl(var(--tf-suite-gpt) / 0.15)' }}>
            <Bot size={24} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
          </div>
          <div>
            <h1 className='text-xl font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>TerraGPT</h1>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>AI Assistant & Natural Language Interface</p>
          </div>
        </div>
      </header>

      <div className='flex flex-1 min-h-0'>
        {/* Module Sidebar */}
        <nav className='w-64 shrink-0 p-4 space-y-1 overflow-y-auto' style={{ borderRight: '1px solid hsl(var(--tf-border))' }}>
          <p className='text-xs font-medium uppercase tracking-wider px-3 py-2' style={{ color: 'hsl(var(--tf-muted))' }}>
            Modules
          </p>
          {GPT_MODULES.map((mod) => {
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
                  style={{ color: isActive ? 'hsl(var(--tf-suite-gpt))' : 'hsl(var(--tf-muted))' }}
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
            {activeModule === 'studio' && <GptStudioView />}
            {activeModule === 'marketplace' && <GPTMarketplace />}
            {activeModule === 'management' && <GPTManagementDashboard />}
            {activeModule === 'builder' && <GPTBuilderModule />}
            {activeModule === 'analytics' && <GPTAnalyticsModule />}
            {activeModule === 'rag' && <RAGDatasetsModule />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
