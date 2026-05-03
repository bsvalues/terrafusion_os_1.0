/**
 * ManagementDashboard.tsx (ADR-003 → Wave 3 / Phase 8)
 *
 * County-wide assessor operations oversight dashboard.
 * Standalone window component for the TerraDais suite.
 * Tabs: Overview, Certification, Appeals, Workload.
 *
 * Phase 8: wired to live hooks (useSwarmLive, usePacsStatus,
 * useAppealsQueue, useWorkloadSummary) via MorningBriefingStrip.
 * Tabular dashboard sections read from Dais APIs and disclose
 * unavailable states when county data is not accessible.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkbenchSourceBadge } from '@/components/workbench/WorkbenchSourceBadge';
import type { DisclosureSource } from '@/components/workbench/WorkbenchSourceBadge';
import { invokeTool } from '@/api/pilotApi';
import { useSession } from '@/auth/useSession';
import {
  getCertificationStatus,
  getAllAppeals,
  type CertificationStatus,
  type Appeal,
} from '@/services/suites/daisService';
import {
  getQueueMetrics,
  getAppraiserProductivity,
  type QueueMetrics,
  type AppraiserProductivity,
} from '@/services/suites/queueService';
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

interface OverviewStat {
  label: string;
  value: string;
}

interface KeyDeadline {
  id: string;
  date: string;
  description: string;
}

interface DashboardReadState {
  certification: boolean;
  appeals: boolean;
  queue: boolean;
  workload: boolean;
}

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

interface ManagementDashboardProps {
  onNavigate?: (target: { type: 'area' | 'appeal' | 'appraiser'; id: string }) => void;
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'on-track':
      return 'default';
    case 'at-risk':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    case 'filed':
      return 'outline';
    case 'scheduled':
      return 'secondary';
    case 'hearing':
      return 'default';
    case 'decided':
      return 'default';
    case 'withdrawn':
      return 'outline';
    default:
      return 'outline';
  }
}

function parseToolOutput<T>(output: unknown, fallback: T): T {
  try {
    return typeof output === 'string' ? (JSON.parse(output) as T) : (output as T);
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

function getSectionSource(isLive: boolean): DisclosureSource {
  return isLive ? 'live' : 'unavailable';
}

function getOverviewSource(readState: DashboardReadState): DisclosureSource {
  const liveFields = [
    readState.certification,
    readState.appeals,
    readState.queue,
    readState.workload,
  ].filter(Boolean).length;

  if (liveFields === 0) {
    return 'unavailable';
  }

  if (liveFields === 4) {
    return 'live';
  }

  return 'partial';
}

function formatInteger(value: number | null): string {
  return value == null ? 'Unavailable' : value.toLocaleString();
}

function formatPercent(value: number | null): string {
  return value == null ? 'Unavailable' : `${value.toFixed(1)}%`;
}

function formatDeadlineValue(daysUntilDeadline: number | null): string {
  if (daysUntilDeadline == null) {
    return 'Unavailable';
  }

  if (daysUntilDeadline < 0) {
    return `${Math.abs(daysUntilDeadline)} overdue`;
  }

  return daysUntilDeadline.toLocaleString();
}

function formatIsoDate(value: string | undefined): string {
  if (!value) {
    return 'Unavailable';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function computeOverallCompletion(statuses: CertificationStatus[]): number | null {
  if (statuses.length === 0) {
    return null;
  }

  const totalParcels = statuses.reduce((sum, status) => sum + Math.max(status.totalParcels, 0), 0);
  const completedParcels = statuses.reduce((sum, status) => sum + Math.max(status.completedParcels, 0), 0);

  if (totalParcels > 0) {
    return (completedParcels / totalParcels) * 100;
  }

  return statuses.reduce((sum, status) => sum + Math.max(status.percentComplete, 0), 0) / statuses.length;
}

function computeDaysToDeadline(statuses: CertificationStatus[]): number | null {
  const deadlines = statuses
    .map((status) => new Date(status.deadline))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (deadlines.length === 0) {
    return null;
  }

  const now = Date.now();
  const minMs = Math.min(...deadlines.map((date) => date.getTime() - now));
  return Math.ceil(minMs / (1000 * 60 * 60 * 24));
}

function computeStaffUtilization(productivity: AppraiserProductivity[]): number | null {
  if (productivity.length === 0) {
    return null;
  }

  const assigned = productivity.reduce((sum, appraiser) => sum + Math.max(appraiser.assigned, 0), 0);
  const completed = productivity.reduce((sum, appraiser) => sum + Math.max(appraiser.completed, 0), 0);

  if (assigned <= 0) {
    return null;
  }

  return (completed / assigned) * 100;
}

function buildKeyDeadlines(statuses: CertificationStatus[]): KeyDeadline[] {
  const seen = new Set<string>();

  return [...statuses]
    .filter((status) => Boolean(status.deadline))
    .sort((left, right) => new Date(left.deadline).getTime() - new Date(right.deadline).getTime())
    .map((status) => ({
      id: `${status.area}-${status.deadline}`,
      date: status.deadline,
      description: `${status.area} certification deadline`,
    }))
    .filter((deadline) => {
      if (seen.has(deadline.id)) {
        return false;
      }

      seen.add(deadline.id);
      return true;
    });
}

function buildOverviewStats(
  readState: DashboardReadState,
  certificationStatuses: CertificationStatus[],
  appeals: Appeal[],
  queueMetrics: QueueMetrics | null,
  productivity: AppraiserProductivity[],
): OverviewStat[] {
  const totalParcels = readState.certification
    ? certificationStatuses.reduce((sum, status) => sum + Math.max(status.totalParcels, 0), 0)
    : null;
  const overallCompletion = readState.certification
    ? computeOverallCompletion(certificationStatuses)
    : null;
  const activeAppeals = readState.appeals
    ? appeals.filter((appeal) => appeal.status !== 'decided' && appeal.status !== 'withdrawn').length
    : null;
  const pendingReviews = readState.queue && queueMetrics
    ? queueMetrics.totalPendingReview
    : null;
  const daysToDeadline = readState.certification
    ? computeDaysToDeadline(certificationStatuses)
    : null;
  const staffUtilization = readState.workload
    ? computeStaffUtilization(productivity)
    : null;

  return [
    { label: 'Total Parcels', value: formatInteger(totalParcels) },
    { label: 'Assessment Completion', value: formatPercent(overallCompletion) },
    { label: 'Active Appeals', value: formatInteger(activeAppeals) },
    { label: 'Pending Reviews', value: formatInteger(pendingReviews) },
    { label: 'Days to Deadline', value: formatDeadlineValue(daysToDeadline) },
    { label: 'Staff Utilization', value: formatPercent(staffUtilization) },
  ];
}

function SectionMessage({ message }: { message: string }) {
  return (
    <div
      className="rounded-md px-3 py-3 text-sm text-muted-foreground"
      style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }}
    >
      {message}
    </div>
  );
}

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
  const [readState, setReadState] = useState<DashboardReadState>({
    certification: false,
    appeals: false,
    queue: false,
    workload: false,
  });
  const [certificationStatuses, setCertificationStatuses] = useState<CertificationStatus[]>([]);
  const [appealRows, setAppealRows] = useState<Appeal[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [productivityRows, setProductivityRows] = useState<AppraiserProductivity[]>([]);

  const swarm = useSwarmLive();
  const pacs = usePacsStatus();
  const appeals = useAppealsQueue();
  const workload = useWorkloadSummary();

  const fetchDashboardData = useCallback(async () => {
    setCertificationStatuses([]);
    setAppealRows([]);
    setQueueMetrics(null);
    setProductivityRows([]);
    setReadState({
      certification: false,
      appeals: false,
      queue: false,
      workload: false,
    });

    try {
      const certData = await getCertificationStatus();
      setCertificationStatuses(certData);
      setReadState((previous) => ({ ...previous, certification: true }));
    } catch {
      setCertificationStatuses([]);
    }

    try {
      const appealsData = await getAllAppeals();
      const sortedAppeals = [...appealsData].sort(
        (left, right) => new Date(right.filedDate).getTime() - new Date(left.filedDate).getTime(),
      );
      setAppealRows(sortedAppeals);
      setReadState((previous) => ({ ...previous, appeals: true }));
    } catch {
      setAppealRows([]);
    }

    try {
      const metrics = await getQueueMetrics({ throwOnError: true });
      if (metrics) {
        setQueueMetrics(metrics);
        setReadState((previous) => ({ ...previous, queue: true }));
      }
    } catch {
      setQueueMetrics(null);
    }

    try {
      const productivity = await getAppraiserProductivity({ throwOnError: true });
      setProductivityRows(productivity);
      setReadState((previous) => ({ ...previous, workload: true }));
    } catch {
      setProductivityRows([]);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
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

  const overviewSource = getOverviewSource(readState);
  const certSource = getSectionSource(readState.certification);
  const appealsSource = getSectionSource(readState.appeals);
  const workloadSource = getSectionSource(readState.workload);
  const overviewStats = buildOverviewStats(
    readState,
    certificationStatuses,
    appealRows,
    queueMetrics,
    productivityRows,
  );
  const keyDeadlines = readState.certification ? buildKeyDeadlines(certificationStatuses) : [];
  const recentAppeals = appealRows.slice(0, 5);
  const activeAppealCount = readState.appeals
    ? appealRows.filter((appeal) => ['filed', 'scheduled', 'hearing'].includes(appeal.status)).length
    : null;
  const decidedAppealCount = readState.appeals
    ? appealRows.filter((appeal) => appeal.status === 'decided').length
    : null;

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
                {briefState.status === 'success'
                  ? briefState.result?.queueType ?? 'morning_brief'
                  : briefState.status === 'loading'
                    ? 'Loading governed queue...'
                    : 'Governed queue unavailable'}
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

      {activeTab === 'overview' && (
        <div data-testid="tab-overview">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overview Stats</span>
            <WorkbenchSourceBadge
              source={overviewSource}
              liveFields={[
                readState.certification,
                readState.appeals,
                readState.queue,
                readState.workload,
              ].filter(Boolean).length}
              totalFields={4}
            />
          </div>
          <div data-testid="overview-stats" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {overviewStats.map((stat) => (
              <Card key={stat.label} data-material="bento">
                <CardContent className="pb-4 pt-4 text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="key-deadlines" className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Key Deadlines</CardTitle>
                <WorkbenchSourceBadge source={certSource} />
              </div>
            </CardHeader>
            <CardContent>
              {keyDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {keyDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between rounded p-3 hover:bg-white/5"
                      style={{ border: '1px solid hsl(var(--tf-border) / 0.15)' }}
                    >
                      <span className="text-sm">{deadline.description}</span>
                      <Badge variant="outline">{formatIsoDate(deadline.date)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <SectionMessage
                  message={readState.certification
                    ? 'No live certification deadlines returned.'
                    : 'Certification deadlines unavailable.'}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'certification' && (
        <div data-testid="tab-certification">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Certification Readiness</CardTitle>
                <WorkbenchSourceBadge source={certSource} />
              </div>
            </CardHeader>
            <CardContent>
              <table data-testid="cert-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                    <th className="py-2 text-left">Area</th>
                    <th className="py-2 text-right">Completed</th>
                    <th className="py-2 text-right">Total Parcels</th>
                    <th className="py-2 text-right">Completion</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {readState.certification && certificationStatuses.length > 0 ? (
                    certificationStatuses.map((status) => (
                      <tr
                        key={`${status.area}-${status.deadline}`}
                        role="link"
                        className="cursor-pointer hover:bg-white/5"
                        style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                        onClick={() => onNavigate?.({ type: 'area', id: slugify(status.area) })}
                      >
                        <td className="py-3 font-medium">{status.area}</td>
                        <td className="py-3 text-right font-mono">{status.completedParcels.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono">{status.totalParcels.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono">{status.percentComplete.toFixed(1)}%</td>
                        <td className="py-3 text-center">
                          <Badge variant={statusBadgeVariant(status.status)}>{status.status}</Badge>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{formatIsoDate(status.deadline)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-6 text-center text-muted-foreground" colSpan={6}>
                        {readState.certification
                          ? 'No live certification status returned.'
                          : 'Certification status unavailable.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'appeals' && (
        <div data-testid="tab-appeals">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Appeals Data</span>
            <WorkbenchSourceBadge source={appealsSource} />
          </div>
          <div data-testid="appeals-summary" className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pb-4 pt-4 text-center">
                <div className="text-2xl font-bold">
                  {readState.appeals ? appealRows.length.toLocaleString() : 'Unavailable'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Total Filed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4 text-center">
                <div className="text-2xl font-bold">
                  {readState.appeals ? formatInteger(activeAppealCount) : 'Unavailable'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Pending Hearing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4 text-center">
                <div className="text-2xl font-bold">
                  {readState.appeals ? formatInteger(decidedAppealCount) : 'Unavailable'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Decided</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4 text-center">
                <div className="text-2xl font-bold">
                  {readState.appeals ? (appealRows.length > 0 ? 'Not reported' : 'N/A') : 'Unavailable'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Avg Days to Resolution</div>
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
                    <th className="py-2 text-left">Appeal ID</th>
                    <th className="py-2 text-left">Parcel</th>
                    <th className="py-2 text-left">Owner</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {readState.appeals && recentAppeals.length > 0 ? (
                    recentAppeals.map((appeal) => (
                      <tr
                        key={appeal.appealId}
                        role="link"
                        className="cursor-pointer hover:bg-white/5"
                        style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                        onClick={() => onNavigate?.({ type: 'appeal', id: appeal.appealId })}
                      >
                        <td className="py-2 font-mono text-xs">{appeal.appealId}</td>
                        <td className="py-2 font-mono text-xs">{appeal.parcelId}</td>
                        <td className="py-2">{appeal.petitionerName}</td>
                        <td className="py-2 text-center">
                          <Badge variant={statusBadgeVariant(appeal.status)}>{appeal.status}</Badge>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">{formatIsoDate(appeal.filedDate)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-6 text-center text-muted-foreground" colSpan={5}>
                        {readState.appeals
                          ? 'No live appeals are currently on file.'
                          : 'Appeals data unavailable.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

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
                    <th className="py-2 text-left">Appraiser</th>
                    <th className="py-2 text-left">Assigned Area</th>
                    <th className="py-2 text-right">Parcels Assigned</th>
                    <th className="py-2 text-right">Parcels Completed</th>
                    <th className="py-2 text-right">Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {readState.workload && productivityRows.length > 0 ? (
                    productivityRows.map((appraiser) => {
                      const pct = appraiser.assigned > 0
                        ? ((appraiser.completed / appraiser.assigned) * 100).toFixed(1)
                        : 'N/A';

                      return (
                        <tr
                          key={appraiser.name}
                          role="link"
                          className="cursor-pointer hover:bg-white/5"
                          style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                          onClick={() => onNavigate?.({ type: 'appraiser', id: slugify(appraiser.name) })}
                        >
                          <td className="py-3 font-medium">{appraiser.name}</td>
                          <td className="py-3 text-muted-foreground">{appraiser.area}</td>
                          <td className="py-3 text-right font-mono">{appraiser.assigned.toLocaleString()}</td>
                          <td className="py-3 text-right font-mono">{appraiser.completed.toLocaleString()}</td>
                          <td className="py-3 text-right font-mono">{pct === 'N/A' ? pct : `${pct}%`}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="py-6 text-center text-muted-foreground" colSpan={5}>
                        {readState.workload
                          ? 'No live workload assignments returned.'
                          : 'Workload data unavailable.'}
                      </td>
                    </tr>
                  )}
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
