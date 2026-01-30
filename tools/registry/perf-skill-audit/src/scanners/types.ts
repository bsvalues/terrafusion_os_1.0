/**
 * Type definitions for the Performance Skill Audit
 */

export type Severity = 'critical' | 'high' | 'medium';

/**
 * Waterfall classification types for v2 scanner
 */
export type WaterfallKind = 
  | 'safe-parallel'      // Independent awaits, safe to Promise.all()
  | 'dependent'          // Data dependency between awaits
  | 'batch-candidate'    // Repeated calls to same service/endpoint
  | 'loop-seq'           // Sequential in loop (may be intentional)
  | 'retry-seq';         // Sequential in try/catch retry block

/**
 * Evidence item for detailed findings
 */
export interface EvidenceItem {
  line: number;
  snippet: string;
  varName?: string;
}

export interface Finding {
  severity: Severity;
  rule: string;
  file: string;
  lineStart?: number;
  lineEnd?: number;
  message: string;
  snippet?: string;
  suggestedFix?: string;
  
  // v2 additions for waterfall scanner
  functionName?: string;
  kind?: WaterfallKind;
  priorityScore?: number;  // 0-100, higher = fix first
  evidence?: EvidenceItem[];
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
