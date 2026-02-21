/**
 * RealityBoard — bottom panel placeholder.
 *
 * Phase 20 introduced the import in CanonHome; the rich implementation
 * is deferred to a future phase.  This placeholder renders a minimal
 * container so unit tests can mount CanonHome without a missing-module
 * crash.
 */

import React from 'react';

export function RealityBoard() {
  return (
    <div data-testid="reality-board" aria-label="Reality board">
      <span className="text-xs text-muted-foreground p-2">Reality Board</span>
    </div>
  );
}
