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
import type { Risk } from '../types/index.js';
import type { TraceService } from './TraceService.js';
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
export declare class MetricsService {
    private traceService;
    constructor(traceService: TraceService);
    /**
     * Get time window boundaries.
     */
    private getWindowBounds;
    /**
     * Filter events by time window.
     */
    private filterByWindow;
    /**
     * Extract risk level from trace event.
     * The trace event summary contains risk info, or we can derive from tool pattern.
     */
    private extractRisk;
    /**
     * Get metrics summary for a time window.
     */
    getSummary(window: TimeWindow, countyId?: string): MetricsSummary;
    /**
     * Compatibility alias for getSummary.
     * @deprecated Use getSummary() instead.
     */
    computeDashboardMetrics(countyId?: string, window?: TimeWindow): MetricsSummary;
    /**
     * Get recent high-risk activity.
     */
    getHighRiskFeed(limit?: number, countyId?: string): HighRiskFeed;
}
export declare function createMetricsService(traceService: TraceService): MetricsService;
export declare function getMetricsService(): MetricsService | null;
