import React, { useMemo, useState } from 'react';
import type { WorkspaceCommand } from '../core/command/types';
import { useWorkspaceCommands } from '../core/command/useWorkspaceCommands';
import { useOmniIntent } from '../core/state/OmniIntentContext';

export interface WorkspaceCommandPaletteProps {
  workspaceId?: string;
}

/**
 * WorkspaceCommandPalette – OS-level command palette.
 *
 * Provides a searchable list of workspace commands with sections:
 * - Core commands (always available)
 * - Suggested commands (AI/heuristic-driven)
 *
 * Emits `workspace_command_invoked` intent when a command is selected.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */
export const WorkspaceCommandPalette: React.FC<WorkspaceCommandPaletteProps> = ({
  workspaceId,
}) => {
  const { setIntent } = useOmniIntent();
  const { commands, loading, error } = useWorkspaceCommands(workspaceId);
  const [query, setQuery] = useState('');

  // Filter commands by search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.description ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  // Split into core and suggested sections
  const coreCommands = useMemo(() => filtered.filter((c) => c.kind !== 'suggested'), [filtered]);

  const suggestedCommands = useMemo(
    () => filtered.filter((c) => c.kind === 'suggested'),
    [filtered]
  );

  const handleInvoke = (cmd: WorkspaceCommand) => {
    setIntent('workspace_command_invoked', {
      workspaceId,
      commandId: cmd.id,
      label: cmd.label,
    });
  };

  if (loading) {
    return (
      <div data-testid='workspace-command-palette-loading' className='p-4 text-slate-400'>
        Loading commands…
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid='workspace-command-palette-error' className='p-4 text-rose-400'>
        Unable to load commands.
      </div>
    );
  }

  return (
    <div
      data-testid='workspace-command-palette'
      className='p-3 bg-slate-800/50 rounded-xl border border-slate-700/50'
    >
      <input
        data-testid='workspace-command-palette-input'
        type='text'
        placeholder='Type a command…'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className='
          w-full px-3 py-2 mb-2 rounded-lg
          bg-slate-900/50 border border-slate-600/50
          text-slate-200 placeholder-slate-500
          focus:outline-none focus:border-cyan-500/50
          text-sm
        '
      />

      {filtered.length === 0 ? (
        <div data-testid='workspace-command-palette-empty' className='p-2 text-slate-500 text-sm'>
          No commands match this search.
        </div>
      ) : (
        <div data-testid='workspace-command-palette-groups'>
          {/* Core Commands Section */}
          {coreCommands.length > 0 && (
            <section data-testid='workspace-command-group-core' className='mb-3'>
              <div className='text-xs text-slate-500 mb-2 px-1'>Core commands</div>
              <ul data-testid='workspace-command-palette-list' className='space-y-1'>
                {coreCommands.map((cmd) => (
                  <li
                    key={cmd.id}
                    data-testid='workspace-command-palette-item'
                    data-command-id={cmd.id}
                    onClick={() => handleInvoke(cmd)}
                    className='
                      p-2 rounded-lg cursor-pointer
                      hover:bg-slate-700/50 transition-colors
                    '
                  >
                    <div className='text-sm text-slate-200'>{cmd.label}</div>
                    {cmd.description && (
                      <div className='text-xs text-slate-500'>{cmd.description}</div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Suggested Commands Section */}
          {suggestedCommands.length > 0 && (
            <section data-testid='workspace-command-group-suggested'>
              <div className='text-xs text-slate-500 mb-2 px-1'>Suggested for this workspace</div>
              <ul data-testid='workspace-command-palette-list-suggested' className='space-y-1'>
                {suggestedCommands.map((cmd) => (
                  <li
                    key={cmd.id}
                    data-testid='workspace-command-palette-item-suggested'
                    data-command-id={cmd.id}
                    onClick={() => handleInvoke(cmd)}
                    className='
                      p-2 rounded-lg cursor-pointer
                      hover:bg-cyan-900/30 transition-colors
                      border-l-2 border-cyan-500/30
                    '
                  >
                    <div className='text-sm text-slate-200'>{cmd.label}</div>
                    {cmd.description && (
                      <div className='text-xs text-slate-500'>{cmd.description}</div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
