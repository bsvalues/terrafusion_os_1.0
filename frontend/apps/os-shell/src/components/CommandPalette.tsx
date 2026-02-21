/**
 * CommandPalette — overlay command launcher stub.
 *
 * Phase 20 introduced the import in CanonHome; the full keyboard-driven
 * implementation is deferred to a future phase.  This placeholder
 * renders a hidden container so unit tests can mount CanonHome without
 * a missing-module crash.
 */

import React from 'react';

export interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  run: () => void;
}

export interface CommandPaletteProps {
  items: CommandPaletteItem[];
  recentItems?: CommandPaletteItem[];
  onCommandRun?: (item: CommandPaletteItem) => void;
}

export function CommandPalette({ items, recentItems, onCommandRun }: CommandPaletteProps) {
  return (
    <div data-testid="command-palette" aria-label="Command palette" className="hidden">
      {/* Placeholder — Ctrl+K overlay deferred to future phase */}
    </div>
  );
}
