/**
 * CanonCommandPalette — quick-command overlay stub.
 *
 * Phase 20 introduced the import in CanonHome; the full implementation
 * is deferred to a future phase.  This placeholder renders the
 * command list so unit tests can mount CanonHome without a
 * missing-module crash.
 */

import React from 'react';

export interface CanonCommand {
  id: string;
  label: string;
  group?: string;
  onRun: () => void;
  disabled?: boolean;
}

export interface CanonCommandPaletteProps {
  commands: CanonCommand[];
}

export function CanonCommandPalette({ commands }: CanonCommandPaletteProps) {
  return (
    <div data-testid="canon-command-palette" aria-label="Command palette">
      {commands.map((cmd) => (
        <button
          key={cmd.id}
          data-testid={`canon-cmd-${cmd.id}`}
          onClick={cmd.onRun}
          disabled={cmd.disabled}
          className="block w-full text-left px-2 py-1 text-sm hover:bg-muted"
        >
          {cmd.label}
        </button>
      ))}
    </div>
  );
}
