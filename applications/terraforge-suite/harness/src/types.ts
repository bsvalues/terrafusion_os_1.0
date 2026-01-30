/**
 * TerraForge Suite - Shared Types
 * ============================================================
 * Common type definitions used across harness modules
 */

/**
 * Audit event for tracking all operations
 * Required for FISMA-High compliance
 */
export interface AuditEvent {
  type: string;
  timestamp: string;
  subjectId: string;
  details: Record<string, unknown>;
}
