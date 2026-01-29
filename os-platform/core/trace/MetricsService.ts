/**
 * TerraFusion OS - GovernanceLock Metrics Service
 * Phase 7.4: Dashboard metrics aggregation
 *
 * Provides real-time metrics for the GovernanceLock dashboard:
 *   - Invocations by risk level
 *   - Access denials (from TraceAccessControl)
 *   - Top tools invoked
 *   - Recent high-risk activity
 *
 * Government. Transcended.
 */

import type { Risk, TraceEvent } from '../types/index.js';
import { getAccessDeniedMetrics } from './TraceAccessControl.js';
import type { TraceService } from './TraceService.js';

// ============================================================================
// Types
// ============================================================================

export type TimeWindow = '1h' | '24h' | '7d' | '30d';

export interface RiskBreakdown {
  read_only: number;
  write_low: number;
  write_high: number;
  irreversible: number;
}

export interface ModeBreakdown {
  pilot: number;
  muse: number;
}

export interface ToolUsage {
  toolId: string;
  count: number;
  mode?: string;
}

export interface HighRiskEvent {
  correlationId: string;
  toolId: string;
  risk: Risk;
  actor: string;
  countyId: string;
  reasonCode?: string;
  supervisorApprovedBy?: string;
  timestamp: string;
  type: string;
  summary: string;
}

export interface MetricsSummary {
  window: TimeWindow;
  windowStart: string;
  windowEnd: string;
  invocations: {
    total: number;
    byRisk: RiskBreakdown;
    byMode: ModeBreakdown;
  };
  denials: {
    total: number;
    crossCounty: number;
    userMismatch: number;
  };
  topTools: ToolUsage[];
  uniqueUsers: number;
  uniqueParcels: number;
}

export interface HighRiskFeed {
  events: HighRiskEvent[];
  hasMore: boolean;
}

// ============================================================================
// Metrics Service
// ============================================================================

export class MetricsService {
  constructor(private traceService: TraceService) {}

  /**
   * Get time window boundaries.
   */
  private getWindowBounds(window: TimeWindow): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end);

    switch (window) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }

    return { start, end };
  }

  /**
   * Filter events by time window.
   */
  private filterByWindow(events: TraceEvent[], start: Date, end: Date): TraceEvent[] {
    return events.filter(e => {
      const ts = new Date(e.timestamp);
      return ts >= start && ts <= end;
    });
  }

  /**
   * Extract risk level from trace event.
   * The trace event summary contains risk info, or we can derive from tool pattern.
   */
  private extractRisk(event: TraceEvent): Risk {
    const summary = event.summary.toLowerCase();

    // Check for explicit risk mentions in summary (from ToolRunner trace)
    if (summary.includes('irreversible') || summary.includes('supervisor approval')) {
      return 'irreversible';
    }
    if (summary.includes('write_high') || summary.includes('high-risk')) {
      return 'write_high';
    }
    if (summary.includes('write_low')) {
      return 'write_low';
    }

    // Default based on tool patterns
    const highRiskTools = ['run_valuation_model', 'assemble_boe_packet', 'request_trace_redaction'];
    const lowRiskTools = ['assign_task', 'draft_notice'];

    if (highRiskTools.includes(event.toolId)) {
      return event.toolId === 'request_trace_redaction' ? 'irreversible' : 'write_high';
    }
    if (lowRiskTools.includes(event.toolId)) {
      return 'write_low';
    }

    return 'read_only';
  }

  /**
   * Get metrics summary for a time window.
   */
  getSummary(window: TimeWindow, countyId?: string): MetricsSummary {
    const { start, end } = this.getWindowBounds(window);

    // Get all events (we'll filter in memory for MVP)
    // In production with PostgresTraceStore, this would be a DB query
    const allEvents = this.traceService.query({ limit: 100000 });

    // Filter by window and optionally by county
    let events = this.filterByWindow(allEvents, start, end);
    if (countyId) {
      events = events.filter(e => e.context.countyId.toLowerCase() === countyId.toLowerCase());
    }

    // Only count invoked events (not completed/failed)
    const invocations = events.filter(e => e.type === 'tool_invoked');

    // Count by risk
    const byRisk: RiskBreakdown = {
      read_only: 0,
      write_low: 0,
      write_high: 0,
      irreversible: 0,
    };

    for (const event of invocations) {
      const risk = this.extractRisk(event);
      byRisk[risk]++;
    }

    // Count by mode
    const byMode: ModeBreakdown = {
      pilot: 0,
      muse: 0,
    };

    for (const event of invocations) {
      const mode = event.context.mode ?? 'pilot';
      if (mode === 'pilot' || mode === 'muse') {
        byMode[mode]++;
      }
    }

    // Top tools
    const toolCounts = new Map<string, number>();
    for (const event of invocations) {
      toolCounts.set(event.toolId, (toolCounts.get(event.toolId) ?? 0) + 1);
    }

    const topTools: ToolUsage[] = Array.from(toolCounts.entries())
      .map(([toolId, count]) => ({ toolId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Unique users and parcels
    const uniqueUsers = new Set(invocations.map(e => e.context.userId)).size;
    const uniqueParcels = new Set(
      invocations.filter(e => e.context.parcelId).map(e => e.context.parcelId)
    ).size;

    // Get denial metrics
    const denials = getAccessDeniedMetrics();

    return {
      window,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      invocations: {
        total: invocations.length,
        byRisk,
        byMode,
      },
      denials,
      topTools,
      uniqueUsers,
      uniqueParcels,
    };
  }

  /**
   * Compatibility alias for getSummary.
   * @deprecated Use getSummary() instead.
   */
  computeDashboardMetrics(countyId?: string, window: TimeWindow = '24h'): MetricsSummary {
    return this.getSummary(window, countyId);
  }

  /**
   * Get recent high-risk activity.
   */
  getHighRiskFeed(limit: number = 50, countyId?: string): HighRiskFeed {
    // Get recent events
    const allEvents = this.traceService.query({ limit: 1000 });

    // Filter to high-risk and irreversible
    let highRisk = allEvents.filter(e => {
      const risk = this.extractRisk(e);
      return risk === 'write_high' || risk === 'irreversible';
    });

    // Filter by county if specified
    if (countyId) {
      highRisk = highRisk.filter(e => e.context.countyId.toLowerCase() === countyId.toLowerCase());
    }

    // Only show invoked events (not completed/failed)
    highRisk = highRisk.filter(e => e.type === 'tool_invoked');

    // Sort by timestamp descending (most recent first)
    highRisk.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Check if there are more
    const hasMore = highRisk.length > limit;

    // Take limit
    const limited = highRisk.slice(0, limit);

    // Map to HighRiskEvent format
    const events: HighRiskEvent[] = limited.map(e => ({
      correlationId: e.correlationId,
      toolId: e.toolId,
      risk: this.extractRisk(e),
      actor: e.context.userId,
      countyId: e.context.countyId,
      reasonCode: e.context.reasonCode,
      supervisorApprovedBy: e.context.supervisorApproval?.approvedBy,
      timestamp: e.timestamp,
      type: e.type,
      summary: e.summary,
    }));

    return { events, hasMore };
  }
}

// ============================================================================
// Factory
// ============================================================================

let metricsServiceInstance: MetricsService | null = null;

export function createMetricsService(traceService: TraceService): MetricsService {
  metricsServiceInstance = new MetricsService(traceService);
  return metricsServiceInstance;
}

export function getMetricsService(): MetricsService | null {
  return metricsServiceInstance;
}
