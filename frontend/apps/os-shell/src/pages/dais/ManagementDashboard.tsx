/**
 * ManagementDashboard.tsx (ADR-003 → Wave 3)
 *
 * County-wide assessor operations oversight dashboard.
 * Standalone window component for the TerraDais suite.
 * Tabs: Overview, Certification, Appeals, Workload.
 *
 * API-first: composes from DaisController + QueueService endpoints.
 * Falls back to fixtures when backend is unavailable.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';
import { useSession } from '@/auth/useSession';
import { getCertificationStatus, getAllAppeals } from '@/services/suites/daisService';
import { getQueueMetrics, getAppraiserProductivity } from '@/services/suites/queueService';
import type { CertificationStatus, Appeal } from '@/services/suites/daisService';
import type { QueueMetrics, AppraiserProductivity } from '@/data/queueFixtures';
import {
  OVERVIEW_STATS_FIXTURE,
  KEY_DEADLINES_FIXTURE,
  CERT_AREAS_FIXTURE,
  APPEALS_SUMMARY_FIXTURE,
  RECENT_APPEALS_FIXTURE,
  APPRAISERS_FIXTURE,
} from '@/data/managementDashboardFixtures';
import type {
  OverviewStat,
  KeyDeadline,
  CertArea,
  AppealsSummary,
  RecentAppeal,
  Appraiser,
} from '@/data/managementDashboardFixtures';

type Tab = 'overview' | 'certification' | 'appeals' | 'workload';
type LaneStatus = 'loading' | 'live' | 'degraded';
type LaneKey = 'certification' | 'appeals' | 'queueMetrics' | 'productivity';

interface LaneProvenanceState {
  status: LaneStatus;
  detail: string;
}

interface LaneDescriptor {
  key: LaneKey;
  label: string;
  testId: string;
}

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
    avgDaysToResolution: APPEALS_SUMMARY_FIXTURE.avgDaysToResolution, // Not calculable from appeal list alone
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

function laneBadgeVariant(status: LaneStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'live': return 'default';
    case 'loading': return 'secondary';
    case 'degraded': return 'destructive';
    default: return 'outline';
  }
}

function laneStatusLabel(status: LaneStatus): string {
  switch (status) {
    case 'live': return 'Live';
    case 'loading': return 'Loading';
    case 'degraded': return 'Degraded';
    default: return 'Unknown';
  }
}

function getErrorDetail(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unknown error';
}

function createInitialLaneProvenance(): Record<LaneKey, LaneProvenanceState> {
  return {
    certification: {
      status: 'loading',
      detail: 'Attempting live certification readiness data.',
    },
    appeals: {
      status: 'loading',
      detail: 'Attempting live appeals activity data.',
    },
    queueMetrics: {
      status: 'loading',
      detail: 'Attempting live queue metrics data.',
    },
    productivity: {
      status: 'loading',
      detail: 'Attempting live productivity data.',
    },
  };
}

const LANE_DESCRIPTORS: LaneDescriptor[] = [
  { key: 'certification', label: 'Certification', testId: 'certification' },
  { key: 'appeals', label: 'Appeals', testId: 'appeals' },
  { key: 'queueMetrics', label: 'Queue Metrics', testId: 'queue-metrics' },
  { key: 'productivity', label: 'Productivity', testId: 'productivity' },
];

// --- Component ---

export function ManagementDashboard({ onNavigate }: ManagementDashboardProps) {
  const session = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // State with fixture defaults — replaced by API data when available
  const [overviewStats, setOverviewStats] = useState<OverviewStat[]>(OVERVIEW_STATS_FIXTURE);
  const [keyDeadlines] = useState<KeyDeadline[]>(KEY_DEADLINES_FIXTURE);
  const [certificationAreas, setCertificationAreas] = useState<CertArea[]>(CERT_AREAS_FIXTURE);
  const [appealsSummary, setAppealsSummary] = useState<AppealsSummary>(APPEALS_SUMMARY_FIXTURE);
  const [recentAppeals, setRecentAppeals] = useState<RecentAppeal[]>(RECENT_APPEALS_FIXTURE);
  const [appraisers, setAppraisers] = useState<Appraiser[]>(APPRAISERS_FIXTURE);
  const [isFixture, setIsFixture] = useState(true);
  const [laneProvenance, setLaneProvenance] = useState<Record<LaneKey, LaneProvenanceState>>(() => createInitialLaneProvenance());

  const fetchDashboardData = useCallback(async () => {
    setLaneProvenance(createInitialLaneProvenance());

    await Promise.allSettled([
      (async () => {
        try {
          const certData = await getCertificationStatus();
          if (certData && certData.length > 0) {
            setCertificationAreas(certData.map(mapCertToArea));
            setLaneProvenance((prev) => ({
              ...prev,
              certification: {
                status: 'live',
                detail: 'Live county certification endpoint resolved.',
              },
            }));
          } else {
            setLaneProvenance((prev) => ({
              ...prev,
              certification: {
                status: 'degraded',
                detail: 'Certification endpoint returned no live records; showing fixture readiness.',
              },
            }));
          }
        } catch (error) {
          setLaneProvenance((prev) => ({
            ...prev,
            certification: {
              status: 'degraded',
              detail: `Certification endpoint unavailable: ${getErrorDetail(error)}. Showing fixture readiness.`,
            },
          }));
        }
      })(),
      (async () => {
        try {
          const appealsData = await getAllAppeals();
          if (appealsData && appealsData.length > 0) {
            setRecentAppeals(mapAppealsToRecent(appealsData));
            setAppealsSummary(computeAppealsSummary(appealsData));
            setLaneProvenance((prev) => ({
              ...prev,
              appeals: {
                status: 'live',
                detail: 'Live county appeals endpoint resolved.',
              },
            }));

            setOverviewStats((prev) =>
              prev.map((s) =>
                s.label === 'Active Appeals'
                  ? { ...s, value: String(appealsData.filter((a) => a.status !== 'decided' && a.status !== 'withdrawn').length) }
                  : s,
              ),
            );
          } else {
            setLaneProvenance((prev) => ({
              ...prev,
              appeals: {
                status: 'degraded',
                detail: 'Appeals endpoint returned no live records; showing fixture appeal activity.',
              },
            }));
          }
        } catch (error) {
          setLaneProvenance((prev) => ({
            ...prev,
            appeals: {
              status: 'degraded',
              detail: `Appeals endpoint unavailable: ${getErrorDetail(error)}. Showing fixture appeal activity.`,
            },
          }));
        }
      })(),
      (async () => {
        try {
          const prodData = await getAppraiserProductivity({ throwOnError: true });
          if (prodData && prodData.length > 0) {
            setAppraisers(mapProductivityToAppraisers(prodData));
            setLaneProvenance((prev) => ({
              ...prev,
              productivity: {
                status: 'live',
                detail: 'Live county productivity endpoint resolved.',
              },
            }));
          } else {
            setLaneProvenance((prev) => ({
              ...prev,
              productivity: {
                status: 'degraded',
                detail: 'Productivity endpoint returned no live records; showing fixture workload assignments.',
              },
            }));
          }
        } catch (error) {
          setLaneProvenance((prev) => ({
            ...prev,
            productivity: {
              status: 'degraded',
              detail: `Productivity endpoint unavailable: ${getErrorDetail(error)}. Showing fixture workload assignments.`,
            },
          }));
        }
      })(),
      (async () => {
        try {
          const metrics = await getQueueMetrics({ throwOnError: true });
          if (metrics) {
            setOverviewStats((prev) =>
              prev.map((s) =>
                s.label === 'Pending Reviews' ? { ...s, value: String(metrics.totalPendingReview ?? s.value) } : s,
              ),
            );
            setLaneProvenance((prev) => ({
              ...prev,
              queueMetrics: {
                status: 'live',
                detail: 'Live county queue metrics endpoint resolved.',
              },
            }));
          } else {
            setLaneProvenance((prev) => ({
              ...prev,
              queueMetrics: {
                status: 'degraded',
                detail: 'Queue metrics endpoint returned no live metrics; showing fixture overview counts.',
              },
            }));
          }
        } catch (error) {
          setLaneProvenance((prev) => ({
            ...prev,
            queueMetrics: {
              status: 'degraded',
              detail: `Queue metrics endpoint unavailable: ${getErrorDetail(error)}. Showing fixture overview counts.`,
            },
          }));
        }
      })(),
    ]);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'certification', label: 'Certification' },
    { key: 'appeals', label: 'Appeals' },
    { key: 'workload', label: 'Workload' },
  ];
  const hasNonLiveLane = Object.values(laneProvenance).some((lane) => lane.status !== 'live');

  useEffect(() => {
    setIsFixture(hasNonLiveLane);
  }, [hasNonLiveLane]);

  return (
    <div
      data-testid="management-dashboard"
      className="space-y-4 p-4"
      style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}
    >
      {isFixture && <DemoDataBanner module="Management Dashboard" />}
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

      <Card data-testid="management-dashboard-provenance">
        <CardHeader>
          <CardTitle>Read Lane Provenance</CardTitle>
        </CardHeader>
        <CardContent>
          <p data-testid="management-dashboard-provenance-note" className="text-sm text-muted-foreground">
            Certification, appeals, queue metrics, and productivity disclose their own live, loading, or degraded state.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {LANE_DESCRIPTORS.map((lane) => {
              const state = laneProvenance[lane.key];
              return (
                <Card key={lane.key} data-testid={`management-dashboard-lane-${lane.testId}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{lane.label}</span>
                      <Badge
                        data-testid={`management-dashboard-lane-${lane.testId}-status`}
                        variant={laneBadgeVariant(state.status)}
                      >
                        {laneStatusLabel(state.status)}
                      </Badge>
                    </div>
                    <p
                      data-testid={`management-dashboard-lane-${lane.testId}-detail`}
                      className="mt-2 text-xs text-muted-foreground"
                    >
                      {state.detail}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div data-testid="tab-overview">
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
              <CardTitle>Certification Readiness by Area</CardTitle>
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
              <CardTitle>Staff Workload Assignments</CardTitle>
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
                    const pct = ((appraiser.completed / appraiser.assigned) * 100).toFixed(1);
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
