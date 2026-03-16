/**
 * TerraQueue.tsx (ADR-003)
 *
 * Cross-parcel work queue for Deputy/Chief Appraiser.
 * Standalone window component for the TerraDais suite.
 * Tabs: Unassigned, In Progress, Review, Metrics.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQueueStore } from '@/stores/queueStore';
import { APPRAISERS } from '@/data/queueFixtures';

type Tab = 'unassigned' | 'in-progress' | 'review' | 'metrics';

// --- Helpers ---

function priorityVariant(p: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (p) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'assigned': return 'outline';
    case 'inspection-pending': return 'secondary';
    case 'inspected': return 'default';
    case 'valued': return 'default';
    case 'flagged': return 'destructive';
    case 'review-pending': return 'secondary';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

function currency(n: number): string {
  return '$' + n.toLocaleString();
}

// --- Component ---

export function TerraQueue() {
  const [activeTab, setActiveTab] = useState<Tab>('unassigned');
  const [assignDropdown, setAssignDropdown] = useState<string | null>(null);

  const {
    items, metrics, productivity, loading,
    selectedItemIds, fetchQueue,
    toggleSelection, selectAll, clearSelection,
    assignItems, reviewItem,
  } = useQueueStore();

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const unassigned = items.filter((i) => i.status === 'unassigned');
  const inProgress = items.filter((i) =>
    ['assigned', 'inspection-pending', 'inspected', 'valued', 'flagged'].includes(i.status)
  );
  const reviewPending = items.filter((i) => i.status === 'review-pending');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'unassigned', label: `Unassigned (${unassigned.length})` },
    { key: 'in-progress', label: `In Progress (${inProgress.length})` },
    { key: 'review', label: `Review (${reviewPending.length})` },
    { key: 'metrics', label: 'Metrics' },
  ];

  const handleAssign = (appraiser: string) => {
    assignItems(appraiser);
    setAssignDropdown(null);
  };

  if (loading) {
    return (
      <div data-testid="terra-queue" className="p-4" style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}>
        <p>Loading queue...</p>
      </div>
    );
  }

  return (
    <div
      data-testid="terra-queue"
      className="space-y-4 p-4"
      style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))' }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">TerraQueue</h1>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              data-testid={`tab-btn-${tab.key}`}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Unassigned Tab */}
      {activeTab === 'unassigned' && (
        <div data-testid="tab-unassigned">
          <div className="flex items-center gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                selectedItemIds.size === unassigned.length
                  ? clearSelection()
                  : selectAll(unassigned.map((i) => i.workItemId))
              }
            >
              {selectedItemIds.size === unassigned.length ? 'Deselect All' : 'Select All'}
            </Button>

            {selectedItemIds.size > 0 && (
              <div className="relative">
                <Button
                  size="sm"
                  data-testid="assign-btn"
                  onClick={() => setAssignDropdown(assignDropdown ? null : 'open')}
                >
                  Assign Selected ({selectedItemIds.size})
                </Button>
                {assignDropdown && (
                  <div
                    data-testid="assign-dropdown"
                    className="absolute top-full left-0 mt-1 rounded shadow-lg z-10 py-1"
                    style={{ background: 'hsl(var(--tf-card))', border: '1px solid hsl(var(--tf-border) / 0.3)', minWidth: '200px' }}
                  >
                    {APPRAISERS.map((name) => (
                      <button
                        key={name}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-white/10"
                        onClick={() => handleAssign(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <table data-testid="unassigned-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                    <th className="w-8 py-2 px-3"></th>
                    <th className="text-left py-2">Parcel ID</th>
                    <th className="text-left py-2">Address</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Value</th>
                    <th className="text-center py-2">Priority</th>
                    <th className="text-left py-2">Area</th>
                    <th className="text-right py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map((item) => (
                    <tr
                      key={item.workItemId}
                      className="hover:bg-white/5"
                      style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.has(item.workItemId)}
                          onChange={() => toggleSelection(item.workItemId)}
                          aria-label={`Select ${item.parcelId}`}
                        />
                      </td>
                      <td className="py-2 font-mono text-xs">{item.parcelId}</td>
                      <td className="py-2">{item.address}</td>
                      <td className="py-2 capitalize">{item.propertyType}</td>
                      <td className="py-2 text-right font-mono">{currency(item.currentValue)}</td>
                      <td className="py-2 text-center">
                        <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                      </td>
                      <td className="py-2">{item.area}</td>
                      <td className="py-2 text-right text-muted-foreground">{item.createdDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* In Progress Tab */}
      {activeTab === 'in-progress' && (
        <div data-testid="tab-in-progress">
          {/* Group by appraiser */}
          {APPRAISERS.map((appraiser) => {
            const appraiserItems = inProgress.filter((i) => i.assignedTo === appraiser);
            if (appraiserItems.length === 0) return null;
            return (
              <Card key={appraiser} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base">{appraiser} ({appraiserItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table data-testid={`progress-table-${appraiser.toLowerCase().replace(/\s+/g, '-')}`} className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                        <th className="text-left py-2 px-3">Parcel ID</th>
                        <th className="text-left py-2">Address</th>
                        <th className="text-right py-2">Value</th>
                        <th className="text-center py-2">Status</th>
                        <th className="text-right py-2 px-3">Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appraiserItems.map((item) => (
                        <tr
                          key={item.workItemId}
                          className="hover:bg-white/5"
                          style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                        >
                          <td className="py-2 px-3 font-mono text-xs">{item.parcelId}</td>
                          <td className="py-2">{item.address}</td>
                          <td className="py-2 text-right font-mono">{currency(item.currentValue)}</td>
                          <td className="py-2 text-center">
                            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                          </td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{item.assignedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Tab */}
      {activeTab === 'review' && (
        <div data-testid="tab-review">
          <div data-testid="review-summary" className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{reviewPending.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Pending Review</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">
                  {items.filter((i) => i.status === 'approved').length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">
                  {items.filter((i) => i.status === 'rejected').length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Rejected</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Quality Review</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table data-testid="review-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                    <th className="text-left py-2 px-3">Parcel ID</th>
                    <th className="text-left py-2">Address</th>
                    <th className="text-left py-2">Appraiser</th>
                    <th className="text-right py-2">Value</th>
                    <th className="text-right py-2">Change</th>
                    <th className="text-right py-2">Confidence</th>
                    <th className="text-center py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewPending.map((item) => (
                    <tr
                      key={item.workItemId}
                      className="hover:bg-white/5"
                      style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                    >
                      <td className="py-2 px-3 font-mono text-xs">{item.parcelId}</td>
                      <td className="py-2">{item.address}</td>
                      <td className="py-2">{item.assignedTo}</td>
                      <td className="py-2 text-right font-mono">{currency(item.currentValue)}</td>
                      <td className="py-2 text-right font-mono">
                        {item.valueChangePercent !== undefined
                          ? `${item.valueChangePercent > 0 ? '+' : ''}${item.valueChangePercent}%`
                          : '—'}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {item.confidenceScore !== undefined ? `${item.confidenceScore}%` : '—'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => reviewItem(item.workItemId, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reviewItem(item.workItemId, 'reject')}
                          >
                            Reject
                          </Button>
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

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div data-testid="tab-metrics">
          {metrics && (
            <div data-testid="metrics-summary" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{metrics.totalUnassigned}</div>
                  <div className="text-xs text-muted-foreground mt-1">Unassigned</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{metrics.totalInProgress}</div>
                  <div className="text-xs text-muted-foreground mt-1">In Progress</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{metrics.totalPendingReview}</div>
                  <div className="text-xs text-muted-foreground mt-1">Pending Review</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{metrics.completedThisWeek}</div>
                  <div className="text-xs text-muted-foreground mt-1">Completed This Week</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{metrics.slaViolations}</div>
                  <div className="text-xs text-muted-foreground mt-1">SLA Violations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{metrics.avgDaysToComplete}</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg Days to Complete</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Appraiser Productivity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table data-testid="productivity-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                    <th className="text-left py-2 px-3">Appraiser</th>
                    <th className="text-left py-2">Area</th>
                    <th className="text-right py-2">Assigned</th>
                    <th className="text-right py-2">Completed</th>
                    <th className="text-right py-2">Avg Days</th>
                    <th className="text-right py-2 px-3">Reject Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {productivity.map((p) => (
                    <tr
                      key={p.name}
                      className="hover:bg-white/5"
                      style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}
                    >
                      <td className="py-3 px-3 font-medium">{p.name}</td>
                      <td className="py-3 text-muted-foreground">{p.area}</td>
                      <td className="py-3 text-right font-mono">{p.assigned.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono">{p.completed.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono">{p.avgDays}</td>
                      <td className="py-3 px-3 text-right font-mono">{p.reviewRejectRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TerraQueue;
