/**
 * OutlierReviewPanel.tsx — Phase 16
 * ===================================================================
 * Flagged-parcel table with IQR/trim indicators, confirm/dismiss
 * actions, and drill-through to Property Workbench.
 *
 * Renders as a tab within StatisticsStudio.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useForgeStatisticsStore } from '@/stores/forgeStatisticsStore';
import { activateModule } from '@/orchestration/moduleActivation';

// ============================================================================
// Component
// ============================================================================

export function OutlierReviewPanel() {
  const outliers = useForgeStatisticsStore((s) => s.outliers);
  const reviewOutlier = useForgeStatisticsStore((s) => s.reviewOutlier);

  const pendingCount = outliers.filter((o) => o.reviewStatus === 'pending').length;
  const confirmedCount = outliers.filter((o) => o.reviewStatus === 'confirmed').length;
  const dismissedCount = outliers.filter((o) => o.reviewStatus === 'dismissed').length;

  const handleDrillThrough = (parcelId: string) => {
    activateModule('property-workbench', {
      source: 'deep_link',
      metadata: { parcelId },
    });
  };

  const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div data-testid="outlier-review" className="space-y-4">
      {/* Summary Cards */}
      <div data-testid="outlier-summary" className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Total Flagged</div>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-fg))' }}>{outliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Pending Review</div>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-suite-forge))' }}>{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Reviewed</div>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-fg))' }}>{confirmedCount + dismissedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Outlier Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Parcels</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="outlier-table" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Address</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Ratio</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Deviation</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Method</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Flag Reason</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Confidence</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Status</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outliers.map((o) => (
                  <tr key={o.parcelId} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                    <td className="py-2 px-2 font-mono text-xs" style={{ color: 'hsl(var(--tf-fg))' }}>{o.parcelId}</td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'hsl(var(--tf-fg))' }}>{o.address}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{o.ratio.toFixed(3)}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: o.ratioDeviation < 0 ? 'hsl(var(--tf-error, 0 80% 60%))' : 'hsl(var(--tf-warning, 40 80% 60%))' }}>
                      {o.ratioDeviation > 0 ? '+' : ''}{o.ratioDeviation.toFixed(3)}
                    </td>
                    <td className="py-2 px-2"><Badge>{o.outlierMethod}</Badge></td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{o.flagReason}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{o.confidence}%</td>
                    <td className="py-2 px-2"><Badge>{o.reviewStatus}</Badge></td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex gap-1 justify-end">
                        {o.reviewStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              aria-label={`Confirm ${o.parcelId}`}
                              onClick={() => reviewOutlier(o.parcelId, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`Dismiss ${o.parcelId}`}
                              onClick={() => reviewOutlier(o.parcelId, 'dismissed')}
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`View parcel ${o.parcelId}`}
                          onClick={() => handleDrillThrough(o.parcelId)}
                        >
                          Drill
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OutlierReviewPanel;
