/**
 * CanonAgentsPanel — Tool inventory by suite.
 *
 * Phase 20 introduced the import in CanonHome; Phase A wires the
 * panel to the live tool list from GET /pilot/tools, grouped by suite.
 *
 * @module canon/CanonAgentsPanel
 */

import React, { useMemo } from 'react';
import type { PilotTool } from '../api/pilotApi';
import type { ConnectionStatus } from './useCanonConnection';

export interface CanonAgentsPanelProps {
  workspaceId: string | null;
  tools?: PilotTool[];
  connectionStatus?: ConnectionStatus;
}

const RISK_BADGE: Record<string, string> = {
  read_only: '🟢',
  write_low: '🟡',
  write_high: '🟠',
  irreversible: '🔴',
};

export function CanonAgentsPanel({
  workspaceId,
  tools = [],
  connectionStatus = 'connecting',
}: CanonAgentsPanelProps) {
  const bySuite = useMemo(() => {
    const map: Record<string, PilotTool[]> = {};
    for (const t of tools) {
      const s = t.suite ?? 'unknown';
      (map[s] ??= []).push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [tools]);

  return (
    <div data-testid="terracanon-agents-panel" aria-label="Agents panel">
      <div className="px-2 py-1 border-b border-gray-700/50">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Tool Registry
        </span>
        {tools.length > 0 && (
          <span
            className="ml-2 text-[10px] text-gray-500"
            data-testid="terracanon-tool-count"
          >
            {tools.length} tools
          </span>
        )}
      </div>

      {connectionStatus === 'disconnected' && (
        <p className="text-xs text-red-400 p-2" data-testid="terracanon-agents-offline">
          Pilot offline — tool list unavailable
        </p>
      )}

      {connectionStatus === 'connecting' && tools.length === 0 && (
        <p className="text-xs text-gray-500 p-2">Connecting…</p>
      )}

      {bySuite.length > 0 && (
        <div className="flex flex-col gap-0.5 p-1 overflow-y-auto" style={{ maxHeight: '100%' }}>
          {bySuite.map(([suite, suiteTools]) => (
            <details key={suite} open={suite === 'os'} data-testid={`terracanon-suite-${suite}`}>
              <summary className="cursor-pointer px-1 py-0.5 text-xs font-medium text-gray-300 hover:bg-gray-800 rounded">
                {suite}
                <span className="ml-1 text-[10px] text-gray-500">({suiteTools.length})</span>
              </summary>
              <div className="pl-2 flex flex-col gap-px">
                {suiteTools.map((t) => (
                  <div
                    key={t.toolId}
                    className="px-1 py-px text-[11px] text-gray-400 truncate"
                    title={`${t.toolId} — ${t.risk}`}
                  >
                    <span className="mr-1">{RISK_BADGE[t.risk] ?? '⚪'}</span>
                    {t.displayName ?? t.toolId}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {workspaceId && tools.length === 0 && connectionStatus === 'connected' && (
        <p className="text-xs text-muted-foreground p-2">
          No tools loaded
        </p>
      )}
    </div>
  );
}
