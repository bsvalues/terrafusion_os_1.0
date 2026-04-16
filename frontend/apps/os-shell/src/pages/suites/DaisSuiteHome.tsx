/**
 * TerraDais Suite Home -- Workflow & Governance Dashboard
 * ===================================================================
 * Constitutional Suite: dais (Article III)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats (appeals, levy revenue), module launcher grid,
 * recent parcel queue. Does NOT host parcel execution.
 *
 * Note: TerraDais API metrics are composed via useDaisSuiteStats.
 * Falls back to county-provider aggregates when live Dais endpoints are unavailable.
 * Per-parcel appeal work routes to the Workbench Dais tab.
 */

import { useCallback, useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import NoticeBatchQueuePanel from '../../components/dais/NoticeBatchQueuePanel';
import CertRollPanel from '../../components/dais/CertRollPanel';
import ManagementDashboardPanel from '../../components/dais/ManagementDashboardPanel';
import SupervisorFlagQueue from '../../components/dais/SupervisorFlagQueue';
import { useDaisSuiteStats } from './useDaisSuiteStats';
import {
  Scale,
  Receipt,
  Landmark,
  CheckCircle2,
  HardHat,
  Calendar,
  Search,
  Bot,
  LayoutDashboard,
  ClipboardList,
  Mail,
  FileCheck,
} from 'lucide-react';

type AssessorStaffRole =
  | 'chief_appraiser'
  | 'residential_analyst'
  | 'commercial_analyst'
  | 'gis_analyst'
  | 'field_appraiser'
  | 'appeals_specialist'
  | 'assessor_leadership';

interface BriefFindingSummary {
  findingType: string;
  severity: string;
  recommendedAction: string;
  correlationId: string;
}

interface MorningBriefResult {
  role: AssessorStaffRole;
  queueType: string;
  priority: string;
  dueWindow: string;
  blockingDependencies: string[];
  recommendedTool: string;
  readyToAct: boolean;
  findings: BriefFindingSummary[];
}

const ROLE_LABELS: Record<AssessorStaffRole, string> = {
  chief_appraiser: 'Chief Appraiser',
  residential_analyst: 'Residential Analyst',
  commercial_analyst: 'Commercial Analyst',
  gis_analyst: 'GIS Analyst',
  field_appraiser: 'Field Appraiser',
  appeals_specialist: 'Appeals Specialist',
  assessor_leadership: 'Assessor Leadership',
};

const DAIS_MODULES: SuiteModuleDef[] = [
  // Workbench-mode (parcel-scoped, opens Property Workbench)
  { id: 'certification', label: 'Certification', icon: CheckCircle2, description: 'Assessment roll certification workflow & progress', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'appeals', label: 'Appeals', icon: Scale, description: 'BOE appeal tracking, scheduling, and outcomes', launchMode: 'workbench', workbenchTab: 'dais' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, description: 'Assessment cycle deadlines and scheduling', launchMode: 'workbench', workbenchTab: 'dais' },
  // Standalone-mode (county-wide, opens standalone window)
  { id: 'terra-levy', label: 'TerraLevy', icon: Receipt, description: 'County-wide property tax levy rates by district', launchMode: 'standalone', moduleId: 'terra-levy', truthState: 'queued' },
  { id: 'terra-pilt', label: 'TerraPILT', icon: Landmark, description: 'Payment In Lieu of Taxes — federal/state land values', launchMode: 'standalone', moduleId: 'terra-pilt', truthState: 'queued' },
  { id: 'terra-permit', label: 'TerraPermit', icon: HardHat, description: 'Building permit intake and workflow tracking', launchMode: 'standalone', moduleId: 'terra-permit', truthState: 'queued' },
  { id: 'vei', label: 'VEI', icon: Search, description: 'Vertical Equality Index — assessment equity & PRB analysis', launchMode: 'standalone', moduleId: 'vei', truthState: 'queued' },
  { id: 'property-tax-ai', label: 'PropertyTax AI', icon: Bot, description: 'AI-driven property tax analysis & anomaly detection', launchMode: 'standalone', moduleId: 'property-tax-ai', truthState: 'queued' },
  { id: 'management-dashboard', label: 'Management', icon: LayoutDashboard, description: 'Assessor operations — certification, workload, staff metrics (conditional-live: some views fall back to fixture data)', launchMode: 'standalone', moduleId: 'management-dashboard' },
  { id: 'terra-queue', label: 'TerraQueue', icon: ClipboardList, description: 'Cross-parcel work queue — assignment, progress, quality review', launchMode: 'standalone', moduleId: 'terra-queue', truthState: 'queued' },
  { id: 'terra-cert', label: 'TerraCert', icon: FileCheck, description: 'Roll sign-off, statutory export, and certification operations', launchMode: 'standalone', moduleId: 'terra-cert', truthState: 'queued' },
  { id: 'terra-notice', label: 'TerraNotice', icon: Mail, description: 'Batch notice dispatch — mail/print queue and delivery tracking', launchMode: 'standalone', moduleId: 'terra-notice', truthState: 'queued' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');
const fmtCurrency = (n: number | undefined | null) => (n != null ? `$${n.toLocaleString()}` : '—');

export default function DaisSuiteHome() {
  const { stats, loading, error, source } = useDaisSuiteStats();
  const [selectedRole, setSelectedRole] = useState<AssessorStaffRole>('chief_appraiser');
  const [briefState, setBriefState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: MorningBriefResult;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });

  const parseToolOutput = <T,>(output: unknown, fallback: T): T => {
    try {
      return typeof output === 'string' ? JSON.parse(output) as T : output as T;
    } catch {
      return fallback;
    }
  };

  const handleRefreshBrief = useCallback(async () => {
    setBriefState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'generate_morning_brief',
        params: { county: 'benton', taxYear: 2026, role: selectedRole },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<MorningBriefResult>(response.result.output, {
          role: selectedRole,
          queueType: 'morning_brief',
          priority: 'medium',
          dueWindow: 'next business day',
          blockingDependencies: [],
          recommendedTool: 'generate_morning_brief',
          readyToAct: false,
          findings: [],
        });
        setBriefState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setBriefState({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to load role briefing.',
        });
      }
    } catch (toolError) {
      setBriefState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to load role briefing.',
      });
    }
  }, [selectedRole]);

  return (
    <div data-testid="suite-dais-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="dais" />

      {loading && !stats && (
        <div data-testid="dais-loading" role="status" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Loading stats...</div>
      )}
      {error && (
        <div data-testid="dais-error" role="alert" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-suite-dais))' }}>{error}</div>
      )}

      {stats && source === 'county-provider' && (
        <div
          data-testid="dais-source-disclosure"
          role="status"
          className="px-6 py-3 text-sm"
          style={{
            color: 'hsl(var(--tf-warning))',
            background: 'hsl(var(--tf-warning) / 0.12)',
            borderBottom: '1px solid hsl(var(--tf-warning) / 0.24)',
          }}
        >
          County aggregate fallback active: TerraDais overview, certification, and notice panels are currently using county-wide provider aggregates, not TerraDais API metrics.
        </div>
      )}

      {/* Stats Strip */}
      {stats && (
        <div data-testid="dais-stats" className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Active Appeals</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-dais))' }}>{fmtNum(stats.activeAppeals)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Levy Revenue</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(stats.totalLevyRevenue)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Pending</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.pendingAssessments)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Completion</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{(stats.assessmentCompletionPercent ?? 0).toFixed(1)}%</span></div>
        </div>
      )}

      {/* Header */}
      <header
        style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }}
        className="backdrop-blur-xl shrink-0"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-dais) / 0.15)' }}>
            <Scale size={24} style={{ color: 'hsl(var(--tf-suite-dais))' }} />
          </div>
          <div>
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraDais</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Workflow, Governance & Appeals Management</p>
          </div>
        </div>
      </header>

      {/* Module Grid + Operational Queue */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <section
          data-testid="dais-role-briefs"
          className="px-6 pt-6"
        >
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: 'hsl(var(--tf-border))',
              background: 'hsl(var(--tf-card-bg) / 0.5)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'hsl(var(--tf-muted))' }}
                >
                  Staff Command Plane
                </p>
                <h2 className="mt-2 text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
                  Morning Briefs & Queue Posture
                </h2>
                <p className="mt-2 max-w-3xl text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Governed role briefings for Benton County staff lanes. Use this to rank work, see blockers, and route the next action before opening parcel execution surfaces.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshBrief}
                disabled={briefState.status === 'loading'}
                className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50"
                style={{
                  borderColor: 'hsl(var(--tf-suite-dais) / 0.35)',
                  background: 'hsl(var(--tf-suite-dais) / 0.12)',
                  color: 'hsl(var(--tf-suite-dais))',
                }}
              >
                {briefState.status === 'loading' ? 'Refreshing…' : 'Refresh Brief'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.entries(ROLE_LABELS) as Array<[AssessorStaffRole, string]>).map(([role, label]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: role === selectedRole ? 'hsl(var(--tf-suite-dais) / 0.45)' : 'hsl(var(--tf-border))',
                    background: role === selectedRole ? 'hsl(var(--tf-suite-dais) / 0.14)' : 'transparent',
                    color: role === selectedRole ? 'hsl(var(--tf-suite-dais))' : 'hsl(var(--tf-fg))',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {briefState.status === 'success' && briefState.result && (
              <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--tf-muted))' }}>Queue</div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{briefState.result.queueType.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--tf-muted))' }}>Priority</div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{briefState.result.priority}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--tf-muted))' }}>Recommended Tool</div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-suite-dais))' }}>{briefState.result.recommendedTool.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.4)' }}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--tf-muted))' }}>Due Window</div>
                    <div className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-fg))' }}>{briefState.result.dueWindow}</div>
                    <div className="mt-2 text-xs" style={{ color: briefState.result.readyToAct ? 'hsl(var(--tf-success))' : 'hsl(var(--tf-warning))' }}>
                      {briefState.result.readyToAct ? 'Ready to act' : 'Waiting on dependencies'}
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-lg border p-4"
                  style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--tf-muted))' }}>Blocking Dependencies</div>
                  {briefState.result.blockingDependencies.length === 0 ? (
                    <div className="mt-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>No blockers reported for this lane.</div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {briefState.result.blockingDependencies.map((dependency) => (
                        <span
                          key={dependency}
                          className="rounded-full border px-2 py-1 text-xs"
                          style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-warning))' }}
                        >
                          {dependency}
                        </span>
                      ))}
                    </div>
                  )}
                  {briefState.correlationId && (
                    <div className="mt-4 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                      Correlation: <code style={{ color: 'hsl(var(--tf-suite-dais))' }}>{briefState.correlationId.slice(0, 16)}...</code>
                    </div>
                  )}
                </div>

                <div
                  className="rounded-lg border p-4 xl:col-span-2"
                  style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'hsl(var(--tf-muted))' }}>Ranked Findings</div>
                    <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{ROLE_LABELS[briefState.result.role]}</div>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {briefState.result.findings.length === 0 ? (
                      <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>No findings returned for this role.</div>
                    ) : (
                      briefState.result.findings.slice(0, 4).map((finding) => (
                        <div
                          key={finding.correlationId}
                          className="rounded-lg border p-3"
                          style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{finding.findingType}</div>
                            <span
                              className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                              style={{
                                background: 'hsl(var(--tf-suite-dais) / 0.14)',
                                color: 'hsl(var(--tf-suite-dais))',
                              }}
                            >
                              {finding.severity}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6" style={{ color: 'hsl(var(--tf-muted))' }}>{finding.recommendedAction}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {briefState.status === 'error' && (
              <div
                className="mt-4 rounded-lg border px-4 py-3 text-sm"
                style={{
                  borderColor: 'hsl(var(--tf-suite-dais) / 0.24)',
                  background: 'hsl(var(--tf-suite-dais) / 0.08)',
                  color: 'hsl(var(--tf-suite-dais))',
                }}
              >
                {briefState.error}
              </div>
            )}
          </div>
        </section>

        <div data-testid="dais-modules">
          <SuiteModuleGrid modules={DAIS_MODULES} accentVar="--tf-suite-dais" />
        </div>
        <section className="px-6 pb-2" data-testid="dais-supervisor-queue">
          <SupervisorFlagQueue />
        </section>
        <div data-testid="dais-mgmt-ops">
          <ManagementDashboardPanel stats={stats} />
        </div>
        <div data-testid="dais-cert-ops">
          <CertRollPanel stats={stats} />
        </div>
        <div data-testid="dais-notice-ops">
          <NoticeBatchQueuePanel stats={stats} />
        </div>
        <div data-testid="dais-queue">
          <OperationalQueue title="Recent Parcels" accentVar="--tf-suite-dais" emptyMessage="No recent parcel activity" />
        </div>
      </main>
    </div>
  );
}
