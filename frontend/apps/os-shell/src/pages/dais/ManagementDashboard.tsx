/**
 * ManagementDashboard.tsx (ADR-003 → Wave 3 / Phase 8)
 *
 * County-wide assessor operations oversight dashboard.
 * Standalone window component for the TerraDais suite.
 * Tabs: Overview, Certification, Appeals, Workload.
 *
 * Phase 8: wired to live hooks (useSwarmLive, usePacsStatus,
 * useAppealsQueue, useWorkloadSummary) via MorningBriefingStrip.
 * Falls back to fixtures for tab data when backend is unavailable.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';
import { WorkbenchSourceBadge } from '@/components/workbench/WorkbenchSourceBadge';
import type { DisclosureSource } from '@/components/workbench/WorkbenchSourceBadge';
import { invokeTool } from '@/api/pilotApi';
import { useSession } from '@/auth/useSession';
import { getCertificationStatus, getAllAppeals } from '@/services/suites/daisService';
import { getQueueMetrics, getAppraiserProductivity } from '@/services/suites/queueService';
import type { CertificationStatus, Appeal } from '@/services/suites/daisService';
import type { QueueMetrics, AppraiserProductivity } from '@/data/queueFixtures';
import type {
  OverviewStat,
  KeyDeadline,
  CertArea,
  AppealsSummary,
  RecentAppeal,
  Appraiser,
} from '@/data/managementDashboardFixtures';
import {
  OVERVIEW_STATS_FIXTURE,
  KEY_DEADLINES_FIXTURE,
  CERT_AREAS_FIXTURE,
  RECENT_APPEALS_FIXTURE,
  APPEALS_SUMMARY_FIXTURE,
  APPRAISERS_FIXTURE,
} from '@/data/managementDashboardFixtures';
import { useSwarmLive } from '../../hooks/useSwarmLive';
import { usePacsStatus } from '../../hooks/usePacsStatus';
import { useAppealsQueue } from '../../hooks/useAppealsQueue';
import { useWorkloadSummary } from '../../hooks/useWorkloadSummary';
import { MorningBriefingStrip } from '../../components/dashboard/MorningBriefingStrip';

type Tab = 'overview' | 'certification' | 'appeals' | 'workload';
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

// --- Props ---

interface ManagementDashboardProps {
  onNavigate?: (target: { type: 'area' | 'appeal' | 'appraiser'; id: string }) => void;
}

// --- Helpers ---

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'on-track': return 'default';
    case 'at-risk': return 'secondary';
    case 'overdue': return 'destructive';
    case 'filed': return 'outline';
    case 'scheduled': return 'secondary';
    case 'hearing': return 'default';
    case 'decided': return 'default';
    case 'withdrawn': return 'outline';
    default: return 'outline';
  }
}

function mapCertToArea(cert: CertificationStatus): CertArea {
  return {
    name: cert.area,
    completion: cert.percentComplete,
    status: cert.status,
  };
}

function mapAppealsToRecent(appeals: Appeal[]): RecentAppeal[] {
  return appeals.slice(0, 5).map((a) => ({
    id: a.appealId,
    parcel: a.parcelId,
    owner: a.petitionerName,
    status: a.status,
    filedDate: a.filedDate,
  }));
}

function computeAppealsSummary(appeals: Appeal[]): AppealsSummary {
  return {
    totalFiled: appeals.length,
    pendingHearing: appeals.filter((a) => a.status === 'filed' || a.status === 'scheduled').length,
    decided: appeals.filter((a) => a.status === 'decided').length,
    avgDaysToResolution: 0, // Not calculable from appeal list alone — Phase 9 will wire a real metric
  };
}

function mapProductivityToAppraisers(prod: AppraiserProductivity[]): Appraiser[] {
  return prod.map((p) => ({
    name: p.name,
    area: p.area,
    assigned: p.assigned,
    completed: p.completed,
  }));
}

function parseToolOutput<T>(output: unknown, fallback: T): T {
  try {
    return typeof output === 'string' ? JSON.parse(output) as T : output as T;
  } catch {
    return fallback;
  }
}

function mapSessionRoleToStaffRole(role: string | undefined): AssessorStaffRole {
  switch (role) {
    case 'admin':
    case 'supervisor':
      return 'assessor_leadership';
    case 'clerk':
      return 'appeals_specialist';
    default:
      return 'chief_appraiser';
  }
}

// --- Component ---

export function ManagementDashboard({ onNavigate }: ManagementDashboardProps) {
  const session = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedRole, setSelectedRole] = useState<AssessorStaffRole>(() => mapSessionRoleToStaffRole(session?.role));
  const [briefState, setBriefState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: MorningBriefResult;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });

  // Phase 8: live data hooks for MorningBriefingStrip
  const swarm    = useSwarmLive();
  const pacs     = usePacsStatus();
  const appeals  = useAppealsQueue();
  const workload = useWorkloadSummary();

  // Seeded from fixtures — API calls update individual fields when backend is available
  const [overviewStats, setOverviewStats] = useState<OverviewStat[]>(OVERVIEW_STATS_FIXTURE);
  const [keyDeadlines] = useState<KeyDeadline[]>(KEY_DEADLINES_FIXTURE);
  const [certificationAreas, setCertificationAreas] = useState<CertArea[]>(CERT_AREAS_FIXTURE);
  const [appealsSummary, setAppealsSummary] = useState<AppealsSummary>(APPEALS_SUMMARY_FIXTURE);
  const [recentAppeals, setRecentAppeals] = useState<RecentAppeal[]>(RECENT_APPEALS_FIXTURE);
  const [appraisers, setAppraisers] = useState<Appraiser[]>(APPRAISERS_FIXTURE);
  const [isFixture, setIsFixture] = useState(true);

  // Per-section source tracking for WorkbenchSourceBadge
  const [overviewSource, setOverviewSource] = useState<DisclosureSource>('fallback');
  const [certSource, setCertSource] = useState<DisclosureSource>('fallback');
  const [appealsSource, setAppealsSource] = useState<DisclosureSource>('fallback');
  const [workloadSource, setWorkloadSource] = useState<DisclosureSource>('fallback');

  const fetchDashboardData = useCallback(async () => {
    let anyApi = false;

    // Certification — compose from getCertificationStatus
    try {
      const certData = await getCertificationStatus();
      if (certData) {
        setCertificationAreas(certData.map(mapCertToArea));
        setCertSource('live');
        anyApi = true;
      }
    } catch { /* fixture fallback — already set */ }

    // Appeals — compose from getAllAppeals (empty array = live, no appeals on file)
    try {
      const appealsData = await getAllAppeals();
      if (appealsData != null) {
        setRecentAppeals(mapAppealsToRecent(appealsData));
        setAppealsSummary(computeAppealsSummary(appealsData));
        setAppealsSource('live');
        anyApi = true;

        // Update overview stats with real appeal count
        setOverviewStats((prev) =>
          prev.map((s) =>
            s.label === 'Active Appeals'
              ? { ...s, value: String(appealsData.filter((a) => a.status !== 'decided' && a.status !== 'withdrawn').length) }
              : s,
          ),
        );
      }
    } catch { /* fixture fallback */ }

    // Workload — compose from getAppraiserProductivity (empty array = live)
    try {
      const prodData = await getAppraiserProductivity({ throwOnError: true });
      if (prodData != null) {
        if (prodData.length > 0) setAppraisers(mapProductivityToAppraisers(prodData));
        setWorkloadSource('live');
        anyApi = true;
      }
    } catch { /* fixture fallback */ }

    // Queue metrics → overview stats
    try {
      const metrics = await getQueueMetrics({ throwOnError: true });
      if (metrics) {
        setOverviewStats((prev) =>
          prev.map((s) =>
            s.label === 'Pending Reviews' ? { ...s, value: String(metrics.totalPendingReview ?? s.value) } : s,
          ),
        );
        setOverviewSource('live');
        anyApi = true;
      }
    } catch { /* fixture fallback */ }

    if (anyApi) setIsFixture(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    setSelectedRole(mapSessionRoleToStaffRole(session?.role));
  }, [session?.role]);

  useEffect(() => {
    let cancelled = false;

    const loadGovernedBrief = async () => {
      setBriefState({ status: 'loading' });
      try {
        const response = await invokeTool({
          toolId: 'generate_morning_brief',
          params: {
            county: session?.countyId ?? 'benton',
            taxYear: 2026,
            role: selectedRole,
          },
        });

        if (cancelled) {
          return;
        }

        if (response.success && response.result) {
          setBriefState({
            status: 'success',
            correlationId: response.correlationId,
            result: parseToolOutput<MorningBriefResult>(response.result.output, {
              role: selectedRole,
              queueType: 'morning_brief',
              priority: 'medium',
              dueWindow: 'next business day',
              blockingDependencies: [],
              recommendedTool: 'generate_morning_brief',
              readyToAct: false,
              findings: [],
            }),
          });
        } else {
          setBriefState({
            status: 'error',
            correlationId: response.correlationId,
            error: response.error?.message || 'Governed role queue unavailable.',
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setBriefState({
          status: 'error',
          correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
          error: error instanceof Error ? error.message : 'Governed role queue unavailable.',
        });
      }
    };

    void loadGovernedBrief();

    return () => {
      cancelled = true;
    };
  }, [selectedRole, session?.countyId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'certification', label: 'Certification' },
    { key: 'appeals', label: 'Appeals' },
    { key: 'workload', label: 'Workload' },
  ];

  return (
    <div
      data-testid="management-dashboard"
      className="space-y-4 p-4"
      style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}
    >
      <MorningBriefingStrip swarm={swarm} pacs={pacs} appeals={appeals} workload={workload} />
      <Card data-testid="management-governed-brief">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Governed Staff Queue</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                County role briefing is generated from governed Pilot tools and routes staff to the correct working lane before certification or appeal action.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="management-role-select">
                Staff lane
              </label>
              <select
                id="management-role-select"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as AssessorStaffRole)}
              >
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border) / 0.2)' }}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Queue Type</div>
              <div className="mt-2 text-sm font-semibold">
                {briefState.status === 'success' ? briefState.result?.queueType ?? 'morning_brief' : briefState.status === 'loading' ? 'Loading governed queue...' : 'Governed queue unavailable'}
              </div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border) / 0.2)' }}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Priority Window</div>
              <div className="mt-2 text-sm font-semibold">
                {briefState.status === 'success'
                  ? `${briefState.result?.priority ?? 'medium'} | due ${briefState.result?.dueWindow ?? 'next business day'}`
                  : briefState.status === 'loading'
                    ? 'Loading due window...'
                    : 'Awaiting governed response'}
              </div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border) / 0.2)' }}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Recommended Tool</div>
              <div className="mt-2 text-sm font-semibold">
                {briefState.status === 'success'
                  ? briefState.result?.recommendedTool ?? 'generate_morning_brief'
                  : briefState.status === 'loading'
                    ? 'Loading tool recommendation...'
                    : 'No recommendation'}
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-3 text-sm" style={{ borderColor: 'hsl(var(--tf-border) / 0.2)' }}>
            {briefState.status === 'success' && briefState.result ? (
              <>
                <div>
                  {ROLE_LABELS[briefState.result.role]} has {briefState.result.findings.length} queued finding{briefState.result.findings.length === 1 ? '' : 's'} and is {briefState.result.readyToAct ? 'ready to act' : 'waiting on blockers'}.
                </div>
                {briefState.result.findings[0] && (
                  <div className="mt-2 text-muted-foreground">
                    Top finding: {briefState.result.findings[0].findingType} {'->'} {briefState.result.findings[0].recommendedAction}
                  </div>
                )}
                {briefState.result.blockingDependencies.length > 0 && (
                  <div className="mt-2 text-muted-foreground">
                    Blocking dependencies: {briefState.result.blockingDependencies.join(', ')}
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">
                {briefState.status === 'loading' ? 'Loading governed role queue...' : briefState.error ?? 'Governed role queue unavailable.'}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{briefState.correlationId ? `corr ${briefState.correlationId}` : 'corr pending'}</span>
            <span>County-wide operational work stays governed here; parcel corrections still route to the Property Workbench.</span>
          </div>
        </CardContent>
      </Card>
      {/* Show fixture banner while any section is still on fallback data */}
      {(overviewSource !== 'live' || certSource !== 'live' || appealsSource !== 'live' || workloadSource !== 'live') && (
        <DemoDataBanner module="Management Dashboard" />
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Management Dashboard</h1>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div data-testid="tab-overview">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overview Stats</span>
            <WorkbenchSourceBadge source={overviewSource} />
          </div>
          <div data-testid="overview-stats" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {overviewStats.map((stat) => (
              <Card key={stat.label} data-material="bento">
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="key-deadlines" className="mt-4">
            <CardHeader>
              <CardTitle>Key Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keyDeadlines.map((dl) => (
                  <div
                    key={dl.date}
                    className="flex items-center justify-between p-3 rounded hover:bg-white/5"
                    style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }}
                  >
                    <span className="text-sm">{dl.description}</span>
                    <Badge variant="outline">{dl.date}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certification Tab */}
      {activeTab === 'certification' && (
        <div data-testid="tab-certification">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Certification Readiness by Area</CardTitle>
                <WorkbenchSourceBadge source={certSource} />
              </div>
            </CardHeader>
            <CardContent>
              <table data-testid="cert-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                    <th className="text-left py-2">Area</th>
                    <th className="text-right py-2">Completion</th>
                    <th className="text-center py-2">Status</th>
                    <th className="py-2 w-1/3">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {certificationAreas.map((area) => (
                    <tr
                      key={area.name}
                      role="link"
                      className="cursor-pointer hover:bg-white/5"
                      style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                      onClick={() => onNavigate?.({ type: 'area', id: area.name.toLowerCase() })}
                    >
                      <td className="py-3 font-medium">{area.name}</td>
                      <td className="py-3 text-right font-mono">{area.completion}%</td>
                      <td className="py-3 text-center">
                        <Badge variant={statusBadgeVariant(area.status)}>{area.status}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              area.status === 'overdue'
                                ? 'bg-red-500'
                                : area.status === 'at-risk'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${area.completion}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appeals Tab */}
      {activeTab === 'appeals' && (
        <div data-testid="tab-appeals">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Appeals Data</span>
            <WorkbenchSourceBadge source={appealsSource} />
          </div>
          <div data-testid="appeals-summary" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{appealsSummary.totalFiled}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Filed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{appealsSummary.pendingHearing}</div>
                <div className="text-xs text-muted-foreground mt-1">Pending Hearing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{appealsSummary.decided}</div>
                <div className="text-xs text-muted-foreground mt-1">Decided</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{appealsSummary.avgDaysToResolution}</div>
                <div className="text-xs text-muted-foreground mt-1">Avg Days to Resolution</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Recent Appeals</CardTitle>
            </CardHeader>
            <CardContent>
              <table data-testid="appeals-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                    <th className="text-left py-2">Appeal ID</th>
                    <th className="text-left py-2">Parcel</th>
                    <th className="text-left py-2">Owner</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-right py-2">Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppeals.map((appeal) => (
                    <tr
                      key={appeal.id}
                      role="link"
                      className="cursor-pointer hover:bg-white/5"
                      style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                      onClick={() => onNavigate?.({ type: 'appeal', id: appeal.parcel })}
                    >
                      <td className="py-2 font-mono text-xs">{appeal.id}</td>
                      <td className="py-2 font-mono text-xs">{appeal.parcel}</td>
                      <td className="py-2">{appeal.owner}</td>
                      <td className="py-2 text-center">
                        <Badge variant={statusBadgeVariant(appeal.status)}>{appeal.status}</Badge>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{appeal.filedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workload Tab */}
      {activeTab === 'workload' && (
        <div data-testid="tab-workload">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Staff Workload Assignments</CardTitle>
                <WorkbenchSourceBadge source={workloadSource} />
              </div>
            </CardHeader>
            <CardContent>
              <table data-testid="workload-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                    <th className="text-left py-2">Appraiser</th>
                    <th className="text-left py-2">Assigned Area</th>
                    <th className="text-right py-2">Parcels Assigned</th>
                    <th className="text-right py-2">Parcels Completed</th>
                    <th className="text-right py-2">Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {appraisers.map((appraiser) => {
                    const pct = ((appraiser.completed / Math.max(appraiser.assigned, 1)) * 100).toFixed(1);
                    return (
                      <tr
                        key={appraiser.name}
                        role="link"
                        className="cursor-pointer hover:bg-white/5"
                        style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                        onClick={() => onNavigate?.({ type: 'appraiser', id: appraiser.name.toLowerCase().replace(/\s+/g, '-') })}
                      >
                        <td className="py-3 font-medium">{appraiser.name}</td>
                        <td className="py-3 text-muted-foreground">{appraiser.area}</td>
                        <td className="py-3 text-right font-mono">{appraiser.assigned.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono">{appraiser.completed.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ManagementDashboard;
