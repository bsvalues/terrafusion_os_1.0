/**
 * ManagementDashboard.tsx (ADR-003)
 *
 * County-wide assessor operations oversight dashboard.
 * Standalone window component for the TerraDais suite.
 * Tabs: Overview, Certification, Appeals, Workload.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Tab = 'overview' | 'certification' | 'appeals' | 'workload';

// --- Props ---

interface ManagementDashboardProps {
  onNavigate?: (target: { type: 'area' | 'appeal' | 'appraiser'; id: string }) => void;
}

// --- Sample Data ---

const overviewStats = [
  { label: 'Total Parcels', value: '89,247' },
  { label: 'Assessment Completion', value: '87.3%' },
  { label: 'Active Appeals', value: '23' },
  { label: 'Pending Reviews', value: '156' },
  { label: 'Days to Deadline', value: '42' },
  { label: 'Staff Utilization', value: '94%' },
];

const keyDeadlines = [
  { date: '2026-04-15', description: 'Residential preliminary values due' },
  { date: '2026-05-01', description: 'Commercial reassessment filing deadline' },
  { date: '2026-05-15', description: 'Board of Equalization hearing start' },
  { date: '2026-06-01', description: 'Final certified roll submission' },
];

interface CertArea {
  name: string;
  completion: number;
  status: 'on-track' | 'at-risk' | 'overdue';
}

const certificationAreas: CertArea[] = [
  { name: 'Richland', completion: 94, status: 'on-track' },
  { name: 'Kennewick', completion: 88, status: 'on-track' },
  { name: 'Pasco', completion: 76, status: 'at-risk' },
  { name: 'West Richland', completion: 91, status: 'on-track' },
  { name: 'Prosser', completion: 62, status: 'at-risk' },
  { name: 'Benton City', completion: 45, status: 'overdue' },
];

const appealsSummary = {
  totalFiled: 23,
  pendingHearing: 8,
  decided: 12,
  avgDaysToResolution: 34,
};

interface RecentAppeal {
  id: string;
  parcel: string;
  owner: string;
  status: 'filed' | 'scheduled' | 'hearing' | 'decided' | 'withdrawn';
  filedDate: string;
}

const recentAppeals: RecentAppeal[] = [
  { id: 'AP-2026-041', parcel: '1-0529-100-0001', owner: 'Johnson Holdings LLC', status: 'hearing', filedDate: '2026-02-28' },
  { id: 'AP-2026-040', parcel: '1-0833-200-0015', owner: 'Ramirez Family Trust', status: 'scheduled', filedDate: '2026-03-02' },
  { id: 'AP-2026-039', parcel: '1-0422-300-0042', owner: 'Columbia Basin Realty', status: 'decided', filedDate: '2026-02-15' },
  { id: 'AP-2026-038', parcel: '1-0716-100-0008', owner: 'Tri-Cities Commercial Inc', status: 'filed', filedDate: '2026-03-10' },
  { id: 'AP-2026-037', parcel: '1-0925-400-0023', owner: 'Greenfield Estates', status: 'withdrawn', filedDate: '2026-02-20' },
];

interface Appraiser {
  name: string;
  area: string;
  assigned: number;
  completed: number;
}

const appraisers: Appraiser[] = [
  { name: 'Sarah Mitchell', area: 'Richland', assigned: 4120, completed: 3873 },
  { name: 'David Park', area: 'Kennewick', assigned: 3850, completed: 3388 },
  { name: 'Maria Torres', area: 'Pasco', assigned: 3200, completed: 2432 },
  { name: 'James Chen', area: 'West Richland / Prosser', assigned: 2980, completed: 2295 },
  { name: 'Lisa Nguyen', area: 'Benton City / Rural', assigned: 2640, completed: 1478 },
];

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

// --- Component ---

export function ManagementDashboard({ onNavigate }: ManagementDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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
