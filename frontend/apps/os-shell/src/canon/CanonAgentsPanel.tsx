/**
 * CanonAgentsPanel — TerraPilot right sidebar stub.
 *
 * Phase 20 introduced the import in CanonHome; the implementation is
 * deferred to a future phase.  This placeholder renders a minimal
 * shell so unit tests can mount CanonHome without a missing-module
 * crash.
 */

import React from 'react';

export interface CanonAgentsPanelProps {
  workspaceId: string | null;
}

export function CanonAgentsPanel({ workspaceId }: CanonAgentsPanelProps) {
  return (
    <div data-testid="terracanon-agents-panel" aria-label="Agents panel">
      <input
        data-testid="terracanon-agent-task-input"
        placeholder="Assign agent task…"
        className="w-full px-2 py-1 text-sm border-b"
      />
      {workspaceId ? (
        <p className="text-xs text-muted-foreground p-2">
          Agents: workspace {workspaceId}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground p-2">No workspace selected</p>
      )}
    </div>
  );
}
