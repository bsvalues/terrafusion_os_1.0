/**
 * Phase 20 — TerraQueue Operational Spine
 * WorkQueuePanel
 *
 * Cross-parcel work queue summary surface for TerraDais standalone.
 * Shows live counts by status, SLA violations, and "Open Queue" button.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/stores/queueStore';

interface WorkQueuePanelProps {
  onDrillThrough?: (parcelId: string) => void;
  onOpenQueue?: () => void;
}

export default function WorkQueuePanel({ onDrillThrough, onOpenQueue }: WorkQueuePanelProps) {
  const { items, metrics } = useQueueStore();

  const unassignedCount = items.filter((i) => i.status === 'unassigned').length;
  const inProgressCount = items.filter((i) =>
    ['assigned', 'inspection-pending', 'inspected', 'valued', 'flagged'].includes(i.status)
  ).length;
  const reviewCount = items.filter((i) => i.status === 'review-pending').length;
  const slaViolations = metrics?.slaViolations ?? 0;

  return (
    <div data-testid="work-queue-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Work Queue</div>
          <div className="text-xs text-muted-foreground">
            Cross-parcel assignment, escalation, and progress tracking
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenQueue}>
          Open Queue
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-md border border-border px-2 py-1.5 text-center">
          <div data-testid="wqp-unassigned-count" className="text-lg font-bold">
            {unassignedCount}
          </div>
          <div className="text-xs text-muted-foreground">Unassigned</div>
        </div>
        <div className="rounded-md border border-border px-2 py-1.5 text-center">
          <div data-testid="wqp-in-progress-count" className="text-lg font-bold">
            {inProgressCount}
          </div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="rounded-md border border-border px-2 py-1.5 text-center">
          <div data-testid="wqp-review-count" className="text-lg font-bold">
            {reviewCount}
          </div>
          <div className="text-xs text-muted-foreground">Review</div>
        </div>
        <div className="rounded-md border border-border px-2 py-1.5 text-center">
          <div data-testid="wqp-sla-violations" className="text-lg font-bold">
            {slaViolations > 0 ? (
              <Badge variant="destructive">{slaViolations}</Badge>
            ) : (
              <span>0</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">SLA Violations</div>
        </div>
      </div>
    </div>
  );
}
