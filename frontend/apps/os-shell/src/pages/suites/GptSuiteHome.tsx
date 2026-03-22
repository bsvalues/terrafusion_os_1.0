/**
 * TerraGPT Suite Home -- bounded GPT workspace host
 * ===================================================================
 * Constitutional Suite: gpt (Article V)
 * Layer 3: county-wide GPT workspace
 *
 * Hosts the live Wave 2 surfaces directly in /gpt.
 * Management and RAG dataset flows are live here.
 * Chat, builder, analytics, and marketplace stay explicitly queued.
 */

import { startTransition, useDeferredValue } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { GPTManagementDashboard } from '../../components/gpt/GPTManagementDashboard';
import { RAGDatasetManager } from '../../components/gpt/RAGDatasetManager';
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

type WorkspaceView = 'management' | 'rag' | 'studio' | 'marketplace' | 'builder' | 'analytics';

type WorkspaceCard = {
  id: WorkspaceView;
  label: string;
  icon: typeof Settings;
  description: string;
  status: 'live' | 'queued';
};

const WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    id: 'management',
    label: 'GPT Management',
    icon: Settings,
    description: 'Manage GPT configurations, installs, and usage from the canonical service lane.',
    status: 'live',
  },
  {
    id: 'rag',
    label: 'RAG Datasets',
    icon: Database,
    description: 'Operate dataset, document, and chunk flows directly against confirmed RAG endpoints.',
    status: 'live',
  },
  {
    id: 'studio',
    label: 'GPT Studio',
    icon: MessageSquare,
    description: 'Conversation workspace remains queued until chat contract truth is opened.',
    status: 'queued',
  },
  {
    id: 'marketplace',
    label: 'GPT Marketplace',
    icon: Store,
    description: 'Marketplace flow remains behind the canonical management lane for this slice.',
    status: 'queued',
  },
  {
    id: 'builder',
    label: 'GPT Builder',
    icon: Wrench,
    description: 'Builder stays queued until create/edit flows are opened as a separate bounded slice.',
    status: 'queued',
  },
  {
    id: 'analytics',
    label: 'GPT Analytics',
    icon: BarChart3,
    description: 'Analytics stays queued until management and dataset truth are stable end-to-end.',
    status: 'queued',
  },
];

const LIVE_WORKSPACE_VIEWS: WorkspaceView[] = ['management', 'rag'];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');
const fmtCurrency = (n: number | undefined | null) => (n != null ? `$${n.toLocaleString()}` : '—');

function coerceWorkspaceView(value: string | null): WorkspaceView {
  if (value && WORKSPACE_CARDS.some((card) => card.id === value)) {
    return value as WorkspaceView;
  }
  return 'management';
}

export default function GptSuiteHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { stats, loading, error } = useCountyStats();
  const activeView = coerceWorkspaceView(searchParams.get('view'));
  const deferredView = useDeferredValue(activeView);
  const activeCard = WORKSPACE_CARDS.find((card) => card.id === deferredView) ?? WORKSPACE_CARDS[0];

  const setWorkspaceView = (nextView: WorkspaceView) => {
    startTransition(() => {
      setSearchParams({ view: nextView });
    });
  };

  const renderQueuedPanel = (card: WorkspaceCard) => {
    return (
      <div className="flex h-full flex-col justify-between gap-8 rounded-2xl border p-6" style={{ borderColor: 'hsl(var(--tf-border) / 0.2)', background: 'linear-gradient(180deg, hsl(var(--tf-card-bg) / 0.72), hsl(var(--tf-card-bg) / 0.42))' }}>
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'hsl(var(--tf-suite-gpt))', background: 'hsl(var(--tf-suite-gpt) / 0.12)' }}>
            Queued Slice
          </div>
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{card.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'hsl(var(--tf-muted))' }}>
              {card.description}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--tf-border) / 0.18)', background: 'hsl(var(--tf-bg) / 0.4)' }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--tf-muted))' }}>Now Live</p>
              <p className="mt-2 text-sm font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>Management and datasets run here inside `/gpt`.</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--tf-border) / 0.18)', background: 'hsl(var(--tf-bg) / 0.4)' }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--tf-muted))' }}>Held Back</p>
              <p className="mt-2 text-sm font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>No hidden Pilot detour and no prototype GPT client fallback.</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--tf-border) / 0.18)', background: 'hsl(var(--tf-bg) / 0.4)' }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--tf-muted))' }}>Next Gate</p>
              <p className="mt-2 text-sm font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>Open chat or builder only after contract truth is explicitly cleared.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setWorkspaceView('management')}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: 'hsl(var(--tf-suite-gpt) / 0.16)', color: 'hsl(var(--tf-suite-gpt))' }}
          >
            Open GPT Management
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceView('rag')}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: 'hsl(var(--tf-border) / 0.2)', color: 'hsl(var(--tf-fg))' }}
          >
            Open RAG Datasets
          </button>
        </div>
      </div>
    );
  };

  const renderWorkspacePanel = () => {
    switch (deferredView) {
      case 'management':
        return (
          <GPTManagementDashboard
            onCreateGPT={() => setWorkspaceView('builder')}
            onEditGPT={() => setWorkspaceView('builder')}
            onChatWithGPT={() => setWorkspaceView('studio')}
          />
        );
      case 'rag':
        return <RAGDatasetManager />;
      default:
        return renderQueuedPanel(activeCard);
    }
  };

  return (
    <div data-testid="suite-gpt-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="pilot" />

      {loading && !stats && (
        <div data-testid="gpt-loading" role="status" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
          Loading GPT workspace metrics...
        </div>
      )}
      {error && (
        <div data-testid="gpt-error" role="alert" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-suite-gpt))' }}>
          {error}
        </div>
      )}

      {stats && (
        <div className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Parcels</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.totalParcels)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Value</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(stats.totalAssessedValue)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Active Appeals</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-gpt))' }}>{fmtNum(stats.activeAppeals)}</span></div>
        </div>
      )}

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
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraGPT</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Bounded GPT workspace for configuration and county knowledge operations</p>
          </div>
          <div className="hidden rounded-xl border px-4 py-2 text-right md:block" style={{ borderColor: 'hsl(var(--tf-border) / 0.18)', background: 'hsl(var(--tf-bg) / 0.35)' }}>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--tf-muted))' }}>Active Surface</p>
            <p className="mt-1 text-sm font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>{activeCard.label}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="mx-auto grid h-full max-w-[1600px] gap-6 px-6 py-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto" data-testid="gpt-workspace-nav">
            <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--tf-border) / 0.18)', background: 'hsl(var(--tf-card-bg) / 0.5)' }}>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'hsl(var(--tf-muted))' }}>Workspace</p>
                <h2 className="mt-2 text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>Operate inside `/gpt`</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Management and dataset flows are hosted here directly. Later surfaces stay visible but explicitly queued.
                </p>
              </div>

              <div className="space-y-2">
                {WORKSPACE_CARDS.map((card) => {
                  const Icon = card.icon;
                  const isActive = card.id === deferredView;
                  const isLive = LIVE_WORKSPACE_VIEWS.includes(card.id);

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setWorkspaceView(card.id)}
                      className="w-full rounded-xl border p-3 text-left transition-colors"
                      style={{
                        borderColor: isActive ? 'hsl(var(--tf-suite-gpt) / 0.45)' : 'hsl(var(--tf-border) / 0.16)',
                        background: isActive ? 'hsl(var(--tf-suite-gpt) / 0.12)' : 'hsl(var(--tf-bg) / 0.28)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg p-2" style={{ background: isActive ? 'hsl(var(--tf-suite-gpt) / 0.18)' : 'hsl(var(--tf-card-bg) / 0.7)' }}>
                          <Icon size={18} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>{card.label}</p>
                            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: isLive ? 'hsl(var(--tf-suite-gpt))' : 'hsl(var(--tf-muted))', background: isLive ? 'hsl(var(--tf-suite-gpt) / 0.12)' : 'hsl(var(--tf-card-bg) / 0.72)' }}>
                              {card.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5" style={{ color: 'hsl(var(--tf-muted))' }}>{card.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border" style={{ borderColor: 'hsl(var(--tf-border) / 0.18)', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
              <OperationalQueue title="Recent Parcels" accentVar="--tf-suite-gpt" emptyMessage="No recent parcel activity" />
            </div>
          </aside>

          <section className="min-h-0 overflow-hidden rounded-2xl border" data-testid="gpt-workspace-panel" style={{ borderColor: 'hsl(var(--tf-border) / 0.18)', background: 'hsl(var(--tf-card-bg) / 0.45)' }}>
            <div className="border-b px-6 py-4" style={{ borderColor: 'hsl(var(--tf-border) / 0.16)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'hsl(var(--tf-muted))' }}>Bounded Host</p>
                  <h2 className="mt-1 text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{activeCard.label}</h2>
                  <p className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>{activeCard.description}</p>
                </div>
                <div className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: activeCard.status === 'live' ? 'hsl(var(--tf-suite-gpt))' : 'hsl(var(--tf-muted))', background: activeCard.status === 'live' ? 'hsl(var(--tf-suite-gpt) / 0.12)' : 'hsl(var(--tf-bg) / 0.4)' }}>
                  {activeCard.status === 'live' ? 'Live now' : 'Queued'}
                </div>
              </div>
            </div>

            <div className="h-full overflow-y-auto p-4 md:p-6">
              {renderWorkspacePanel()}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
