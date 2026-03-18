/**
 * TerraGPT Suite Home -- AI Assistant & Natural Language Interface
 * ===================================================================
 * Constitutional Suite: gpt (Article V)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats, module launcher grid, recent parcel queue.
 * Does NOT host module execution — that routes to the Property Workbench.
 */

import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { useCountyStats } from '../../hooks/useCountyStats';
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Store,
  Settings,
  Wrench,
  BarChart3,
  Database,
} from 'lucide-react';

const GPT_MODULES: SuiteModuleDef[] = [
  { id: 'studio', label: 'GPT Studio', icon: MessageSquare, description: 'Interactive chat with AI assistants', launchMode: 'workbench', workbenchTab: 'pilot' },
  { id: 'marketplace', label: 'GPT Marketplace', icon: Store, description: 'Browse, install, and rate GPT configurations', launchMode: 'workbench', workbenchTab: 'pilot' },
  { id: 'management', label: 'GPT Management', icon: Settings, description: 'Dashboard for GPT usage, statistics, and configuration', launchMode: 'workbench', workbenchTab: 'pilot' },
  { id: 'builder', label: 'GPT Builder', icon: Wrench, description: 'Create custom GPT configurations with RAG', launchMode: 'workbench', workbenchTab: 'pilot' },
  { id: 'analytics', label: 'GPT Analytics', icon: BarChart3, description: 'Usage analytics and cost tracking', launchMode: 'workbench', workbenchTab: 'pilot' },
  { id: 'rag', label: 'RAG Datasets', icon: Database, description: 'Manage knowledge bases for RAG-enabled GPTs', launchMode: 'workbench', workbenchTab: 'pilot' },
];

const fmtNum = (n: number) => n.toLocaleString();
const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

export default function GptSuiteHome() {
  const navigate = useNavigate();
  const { stats } = useCountyStats();

  return (
    <div data-testid="suite-gpt-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="pilot" />

      {/* Stats Strip */}
      {stats && (
        <div className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Parcels</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.totalParcels)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Value</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(stats.totalAssessedValue)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Active Appeals</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-gpt))' }}>{fmtNum(stats.activeAppeals)}</span></div>
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
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-gpt) / 0.15)' }}>
            <Bot size={24} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
          </div>
          <div>
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraGPT</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>AI Assistant & Natural Language Interface</p>
          </div>
        </div>
      </header>

      {/* Module Grid + Operational Queue */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <SuiteModuleGrid modules={GPT_MODULES} accentVar="--tf-suite-gpt" />
        <OperationalQueue title="Recent AI Queries" accentVar="--tf-suite-gpt" emptyMessage="No recent AI activity" />
      </main>
    </div>
  );
}
