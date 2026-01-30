/**
 * Type definitions for the Performance Skill Audit
 */

export type Severity = 'critical' | 'high' | 'medium';

export interface Finding {
  severity: Severity;
  rule: string;
  file: string;
  lineStart?: number;
  lineEnd?: number;
  message: string;
  snippet?: string;
  suggestedFix?: string;
}

export interface ScanContext {
  maxFindings: number;
  severityThreshold: Severity;
  forbiddenPaths: string[];
}

export interface Scanner {
  name: string;
  description: string;
  scan(content: string, filePath: string, ctx: ScanContext): Finding[];
}

export interface AuditReport {
  run: {
    ref: string;
    timestamp: string;
    rulesVersion: string;
    filesScanned: number;
    durationMs: number;
  };
  summary: {
    critical: number;
    high: number;
    medium: number;
    total: number;
  };
  findings: Finding[];
}

export interface AuditConfig {
  maxFindings: number;
  severityThreshold: Severity;
  includePaths: string[];
  excludePaths: string[];
  forbiddenPaths: string[];
}
