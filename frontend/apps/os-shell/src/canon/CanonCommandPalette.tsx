/**
 * CanonCommandPalette — quick-command overlay with live tool search.
 *
 * Phase 20 introduced the import in CanonHome; Phase A wires search/filter
 * to the live tool list from GET /pilot/tools.
 *
 * @module canon/CanonCommandPalette
 */

import React, { useMemo, useState } from 'react';
import type { PilotTool } from '../api/pilotApi';

export interface CanonCommand {
  id: string;
  label: string;
  group?: string;
  onRun: () => void;
  disabled?: boolean;
}

export interface CanonCommandPaletteProps {
  commands: CanonCommand[];
  tools?: PilotTool[];
  onToolInvoke?: (toolId: string) => void;
}

export function CanonCommandPalette({ commands, tools = [], onToolInvoke }: CanonCommandPaletteProps) {
  const [filter, setFilter] = useState('');

  const filteredCommands = useMemo(() => {
    if (!filter) return commands;
    const lc = filter.toLowerCase();
    return commands.filter(
      (cmd) => cmd.label.toLowerCase().includes(lc) || cmd.id.toLowerCase().includes(lc)
    );
  }, [commands, filter]);

  const filteredTools = useMemo(() => {
    if (!filter || tools.length === 0) return [];
    const lc = filter.toLowerCase();
    return tools.filter(
      (t) =>
        t.risk === 'read_only' &&
        (t.toolId.toLowerCase().includes(lc) ||
          (t.displayName ?? '').toLowerCase().includes(lc) ||
          (t.description ?? '').toLowerCase().includes(lc))
    );
  }, [tools, filter]);

  return (
    <div data-testid="terracanon-command-palette" aria-label="Command palette">
      <input
        data-testid="terracanon-palette-input"
        placeholder="Search commands…"
        className="w-full px-2 py-1 text-sm border-b"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {filteredCommands.map((cmd) => (
        <button
          key={cmd.id}
          data-testid={`terracanon-cmd-${cmd.id}`}
          onClick={cmd.onRun}
          disabled={cmd.disabled}
          className="block w-full text-left px-2 py-1 text-sm hover:bg-muted"
        >
          {cmd.label}
        </button>
      ))}
      {filteredTools.length > 0 && (
        <div data-testid="terracanon-palette-tools" className="border-t mt-1 pt-1">
          <span className="block px-2 py-0.5 text-[10px] text-gray-500 uppercase tracking-wider">
            Tools
          </span>
          {filteredTools.slice(0, 10).map((tool) => (
            <button
              key={tool.toolId}
              data-testid={`terracanon-tool-${tool.toolId}`}
              onClick={() => onToolInvoke?.(tool.toolId)}
              className="block w-full text-left px-2 py-1 text-sm hover:bg-muted"
            >
              <span>{tool.displayName ?? tool.toolId}</span>
              <span className="ml-2 text-[10px] text-gray-500">{tool.suite}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
