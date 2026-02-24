/**
 * AuditEnvelope — renders an audit result summary.
 *
 * Phase 20 introduced the import in CanonHome; the rich implementation
 * is deferred to a future phase.  This placeholder renders a minimal
 * pass/fail badge so unit tests can mount CanonHome without a
 * missing-module crash.
 */

import React from 'react';

export interface AuditEnvelopeData {
  toolId: string;
  startedAt: string;
  overallOk: boolean;
  error?: string;
  correlationId?: string;
}

export interface AuditEnvelopeProps {
  data: AuditEnvelopeData;
}

export function AuditEnvelope({ data }: AuditEnvelopeProps) {
  return (
    <div
      data-testid={`audit-envelope-${data.toolId}`}
      className="text-xs p-1 rounded"
    >
      <span>{data.overallOk ? '✅' : '❌'} {data.toolId}</span>
      {data.error && (
        <span className="ml-1 text-muted-foreground">({data.error})</span>
      )}
    </div>
  );
}
