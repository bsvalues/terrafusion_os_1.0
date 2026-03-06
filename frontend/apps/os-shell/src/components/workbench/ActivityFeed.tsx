/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — UNIFIED ACTIVITY FEED
 * Phase I: Parcel-scoped activity stream for Property Workbench
 *
 * Shows a chronological feed of events for the focused parcel:
 * - Value changes (Forge)
 * - Map/spatial updates (Atlas)
 * - Administrative actions (Dais)
 * - Document events (Dossier)
 * - AI/automation events (Pilot)
 *
 * Uses LiquidPanel for glass rendering, design tokens for color.
 * Entries are typed by suite owner and severity.
 *
 * @see contracts/workbench.ts — BadgeOwner (reused for event sources)
 * @see InvocationHistory — Sibling pattern for tool invocations
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useMemo } from 'react';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import type { BadgeOwner } from '../../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

export type ActivitySeverity = 'info' | 'success' | 'warn' | 'danger';

export interface ActivityEntry {
  id: string;
  /** Which suite produced this event */
  source: BadgeOwner;
  /** Human-readable event summary */
  summary: string;
  /** When it happened */
  timestamp: Date;
  /** Visual severity */
  severity: ActivitySeverity;
  /** Optional detail (shown on expand — future) */
  detail?: string;
}

export interface ActivityFeedProps {
  /** Entries to display (newest first) */
  entries: ActivityEntry[];
  /** Maximum entries to render (default: 20) */
  maxEntries?: number;
  /** Optional header override */
  title?: string;
  /** Show empty state if no entries */
  emptyMessage?: string;
}

// ============================================================================
// Source Icons + Colors
// ============================================================================

const SOURCE_META: Record<BadgeOwner, { icon: string; label: string }> = {
  forge: { icon: '🔨', label: 'Forge' },
  atlas: { icon: '🗺️', label: 'Atlas' },
  dais: { icon: '⚖️', label: 'Dais' },
  dossier: { icon: '📋', label: 'Dossier' },
  os: { icon: '🖥️', label: 'System' },
};

function severityColor(severity: ActivitySeverity): {
  bg: string;
  dot: string;
  text: string;
} {
  switch (severity) {
    case 'danger':
      return {
        bg: 'hsl(var(--tf-error) / 0.08)',
        dot: 'hsl(var(--tf-error))',
        text: 'hsl(var(--tf-error))',
      };
    case 'warn':
      return {
        bg: 'hsl(var(--tf-warning) / 0.08)',
        dot: 'hsl(var(--tf-warning))',
        text: 'hsl(var(--tf-warning))',
      };
    case 'success':
      return {
        bg: 'hsl(var(--tf-success-hs) 40% / 0.08)',
        dot: 'hsl(var(--tf-success-hs) 50%)',
        text: 'hsl(var(--tf-success-hs) 70%)',
      };
    default:
      return {
        bg: 'transparent',
        dot: 'hsl(var(--tf-text) / 0.3)',
        text: 'hsl(var(--tf-text) / 0.7)',
      };
  }
}

// ============================================================================
// Component
// ============================================================================

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  entries,
  maxEntries = 20,
  title = 'Activity',
  emptyMessage = 'No activity for this parcel yet.',
}) => {
  const displayEntries = useMemo(
    () => entries.slice(0, maxEntries),
    [entries, maxEntries]
  );

  return (
    <LiquidPanel variant="infrastructure" radius="lg" className="p-4">
      <h3
        className="text-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: 'hsl(var(--tf-text))' }}
      >
        <span>📡</span> {title}
      </h3>

      {displayEntries.length === 0 ? (
        <p
          className="text-sm text-center py-6"
          style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
        >
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1" role="log" aria-label={title}>
          {displayEntries.map((entry) => {
            const colors = severityColor(entry.severity);
            const meta = SOURCE_META[entry.source] ?? SOURCE_META.os;

            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 px-3 py-2 rounded-md transition-colors"
                style={{ background: colors.bg }}
                data-testid={`activity-entry-${entry.id}`}
              >
                {/* Timeline dot */}
                <div className="pt-1.5 shrink-0">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: colors.dot }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm leading-snug"
                    style={{ color: 'hsl(var(--tf-text) / 0.85)' }}
                  >
                    {entry.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs"
                      style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
                    >
                      {meta.icon} {meta.label}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'hsl(var(--tf-text) / 0.3)' }}
                    >
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </LiquidPanel>
  );
};

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default ActivityFeed;
