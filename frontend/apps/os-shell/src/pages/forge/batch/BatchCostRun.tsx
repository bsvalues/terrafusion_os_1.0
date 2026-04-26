/**
 * BatchCostRun.tsx
 *
 * Standalone Forge module: Batch cost model runs.
 *
 * DATA POSTURE:
 * - The governed batch preview engine is not available on this surface.
 * - `/api/forge/cost/batch/preview` is documented by the backend as a dev stub.
 * - No governed `/api/forge/cost/batch/apply` endpoint exists in the current API.
 * - No persisted governed batch run history exists for this lane.
 *
 * This module therefore renders an explicit unavailable state instead of
 * calling stub routes or implying that batch apply is operational.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const GOVERNED_BLOCKERS = [
  {
    lane: 'Preview Engine',
    status: 'Unavailable',
    detail: 'The current backend preview route is a development stub, not a governed batch valuation engine.',
  },
  {
    lane: 'Apply Endpoint',
    status: 'Unavailable',
    detail: 'No governed /api/forge/cost/batch/apply endpoint exists in the current API surface.',
  },
  {
    lane: 'Run History',
    status: 'Unavailable',
    detail: 'There is no persisted batch run history store for this lane, so prior runs cannot be audited here.',
  },
] as const;

export function BatchCostRun() {
  return (
    <div data-testid="batch-cost-run" className="space-y-4 p-4">
      <div
        data-testid="batch-cost-run-unavailable"
        className="rounded-lg border px-4 py-3"
        style={{
          background: 'hsl(var(--tf-warning) / 0.08)',
          borderColor: 'hsl(var(--tf-warning) / 0.35)',
        }}
      >
        <p className="text-sm font-medium">Governed batch cost run unavailable.</p>
        <p className="text-xs text-muted-foreground mt-1">
          This surface no longer calls the stub batch preview/history routes or pretends the
          batch apply lane is operational.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batch Cost Model Runs</h1>
          <p className="text-muted-foreground">Governed batch engine unavailable</p>
        </div>
        <Badge variant="outline">Blocked</Badge>
      </div>

      <div className="text-xs text-muted-foreground">
        Source: No governed batch valuation engine is currently wired for this module.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blocked Execution Lanes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {GOVERNED_BLOCKERS.map((blocker) => (
            <div
              key={blocker.lane}
              className="rounded-lg border px-3 py-3"
              style={{
                background: 'hsl(var(--tf-card-bg) / 0.35)',
                borderColor: 'hsl(var(--tf-border) / 0.25)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{blocker.lane}</span>
                <Badge variant="outline">{blocker.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{blocker.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operator Guidance</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Use Cost Manual for governed Benton schedule review.</li>
            <li>Use Coefficient Preview for controlled coefficient what-if work until a real batch engine exists.</li>
            <li>Do not treat batch preview, apply, or history output from this lane as production evidence until the backend is replaced with governed endpoints.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default BatchCostRun;
