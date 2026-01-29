/**
 * TerraFusion OS - Trace Events Schema (Drizzle ORM)
 * Phase 8.1: Append-only PostgreSQL persistence
 *
 * Design principles:
 *   - APPEND-ONLY: No UPDATE or DELETE operations
 *   - COUNTY ISOLATION: All queries scoped by county_id
 *   - AUDIT GRADE: Every event is immutable proof
 *
 * Government. Transcended.
 */

import { index, jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// ============================================================================
// Schema Namespace
// ============================================================================

export const terraTraceSchema = pgSchema('terra_trace');

// ============================================================================
// Trace Events Table
// ============================================================================

/**
 * Append-only trace event storage.
 *
 * Indexes optimized for:
 *   - MetricsService.getSummary(): county_id + created_at DESC
 *   - MetricsService.getHighRiskFeed(): county_id + created_at DESC
 *   - TraceService.getByCorrelationId(): county_id + correlation_id
 *   - Dashboard queries: county_id + tool_id, county_id + type
 */
export const traceEvents = terraTraceSchema.table(
  'trace_events',
  {
    // Primary key
    eventId: uuid('event_id').primaryKey().notNull(),

    // Correlation for invoke/result linkage
    correlationId: uuid('correlation_id').notNull(),

    // County isolation - MANDATORY for all queries
    countyId: text('county_id').notNull(),

    // Actor identification
    userId: text('user_id').notNull(),

    // Tool and event metadata
    toolId: text('tool_id').notNull(),
    type: text('type').notNull(), // tool_invoked, tool_completed, tool_failed, etc.
    mode: text('mode').notNull(), // pilot | muse

    // Audit content
    summary: text('summary').notNull(),

    // Full execution context (JSON)
    context: jsonb('context').notNull().$type<TraceEventContext>(),

    // Secure payload reference (optional)
    payloadRef: text('payload_ref'),
    payloadStore: text('payload_store'),

    // PII handling
    redactedFields: text('redacted_fields').array(),

    // Schema version for forward compatibility
    schemaVersion: text('schema_version').notNull(),

    // Immutable timestamp - NO updated_at, NO DELETE
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    // Primary query path: county + time-ordered (for dashboard metrics)
    index('idx_trace_county_ts').on(table.countyId, table.createdAt.desc()),

    // Correlation lookup (for trace viewer)
    index('idx_trace_county_corr').on(table.countyId, table.correlationId),

    // Tool-specific queries (for top tools)
    index('idx_trace_county_tool').on(table.countyId, table.toolId),

    // Type-specific queries (for filtering invoked vs completed)
    index('idx_trace_county_type').on(table.countyId, table.type),
  ]
);

// ============================================================================
// Types (matches os-platform/core/types/index.ts)
// ============================================================================

/**
 * Context JSON shape stored in the context column.
 * Mirrors ToolExecutionContext from types/index.ts.
 */
export interface TraceEventContext {
  countyId: string;
  userId: string;
  roles: string[];
  mode: 'pilot' | 'muse';
  parcelId?: string;
  dossierId?: string;
  confirmation?: boolean;
  reasonCode?: string;
  supervisorApproval?: {
    approvedBy: string;
    approvedAt: string;
    role: string;
  };
}

/**
 * Full row type for trace_events table.
 */
export type TraceEventRow = typeof traceEvents.$inferSelect;

/**
 * Insert type for trace_events table.
 */
export type TraceEventInsert = typeof traceEvents.$inferInsert;
