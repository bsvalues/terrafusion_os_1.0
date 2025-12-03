/**
 * Health Summary – Computes workspace/OS health from activity items.
 *
 * This is a pure utility function that analyzes activity data
 * and produces a summary suitable for display in TerraSphere or health bars.
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 5.3 (Status Colors)
 */

import type { WorkspaceActivityItem } from './types';

export type HealthLevel = 'nominal' | 'degraded' | 'critical';

export interface WorkspaceHealthSummary {
  /** Overall health level */
  level: HealthLevel;
  /** Number of incidents in the last 24 hours */
  incidents24h: number;
  /** Number of warnings in the last 24 hours */
  warnings24h: number;
  /** Most recent incident (if any) */
  lastIncident: WorkspaceActivityItem | null;
  /** Human-readable summary text */
  summaryText: string;
}

/**
 * Compute health summary from activity items.
 *
 * Logic:
 * - `critical` if any incident in last 24h
 * - `degraded` if any warning (but no incidents) in last 24h
 * - `nominal` otherwise
 *
 * @param items Activity items to analyze
 * @param now Optional "current time" for testing (defaults to Date.now())
 */
export function computeWorkspaceHealthSummary(
  items: WorkspaceActivityItem[],
  now: number = Date.now()
): WorkspaceHealthSummary {
  const cutoff24h = now - 24 * 60 * 60 * 1000;

  // Filter to last 24h
  const recent = items.filter((item) => {
    const ts = new Date(item.timestamp).getTime();
    return ts >= cutoff24h;
  });

  // Count by type
  const incidents = recent.filter((item) => item.type === 'incident');
  const warnings = recent.filter((item) => item.type === 'warning');

  const incidents24h = incidents.length;
  const warnings24h = warnings.length;

  // Find most recent incident
  const sortedIncidents = [...incidents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const lastIncident = sortedIncidents[0] ?? null;

  // Determine level
  let level: HealthLevel;
  let summaryText: string;

  if (incidents24h > 0) {
    level = 'critical';
    summaryText =
      incidents24h === 1 ? '1 incident in last 24h' : `${incidents24h} incidents in last 24h`;
  } else if (warnings24h > 0) {
    level = 'degraded';
    summaryText =
      warnings24h === 1 ? '1 warning in last 24h' : `${warnings24h} warnings in last 24h`;
  } else {
    level = 'nominal';
    summaryText = 'All systems nominal';
  }

  return {
    level,
    incidents24h,
    warnings24h,
    lastIncident,
    summaryText,
  };
}
