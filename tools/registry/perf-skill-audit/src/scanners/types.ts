/**
 * Type definitions for the Performance Skill Audit
 */

export type Severity = 'critical' | 'high' | 'medium';

/**
 * Waterfall classification types for v2 scanner
 */
export type WaterfallKind =
  | 'safe-parallel' // Independent awaits, safe to Promise.all()
  | 'dependent' // Data dependency between awaits
  | 'batch-candidate' // Repeated calls to same service/endpoint
  | 'loop-seq' // Sequential in loop (may be intentional)
  | 'retry-seq'; // Sequential in try/catch retry block

/**
 * Bundle/Import classification types for Phase 4M1
 */
export type BundleKind =
  | 'barrel-import' // Import from barrel/index file
  | 'barrel-file' // Index file with many re-exports
  | 'heavy-import' // Import from known large library
  | 'duplicate-import' // Same module imported via multiple paths
  | 'dynamic-candidate'; // Could benefit from dynamic import

/**
 * Rerender classification types for Phase 4M2
 */
export type RerenderKind =
  | 'inline-object' // Inline object prop {{ }} - auto-fixable
  | 'inline-array' // Inline array prop {[]} - auto-fixable
  | 'inline-fn' // Inline function prop {() => } - auto-fixable
  | 'setstate-nonfunctional' // setState(x+1) vs setState(s => s+1) - auto-fixable
  | 'unstable-deps' // Missing/unstable useEffect deps - review-only
  | 'context-value' // Inline object in Provider value - review-only
  | 'list-hotspot' // .map() without memo/virtualization - review-only
  | 'missing-memo'; // Component should be memoized - review-only

/**
 * Fixability classification for Phase 4M2
 */
export type Fixability = 'auto' | 'review';

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
  kind?: WaterfallKind | BundleKind | RerenderKind;
  priorityScore?: number; // 0-100, higher = fix first
  evidence?: EvidenceItem[];

  // Phase 4M1: Bundle scanner additions
  importPath?: string;
  importChain?: string[];

  // Phase 4M2: Rerender scanner additions
  componentName?: string;
  hook?: string; // useEffect/useMemo/useCallback/useState
  fixability?: Fixability;
  propName?: string;
  depName?: string;
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

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4I: Auto-Remediation Plan Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Patch strategy for auto-remediation
 * P1: safe-parallel → Promise.all()
 * P2: batch-candidate → batch interface stub
 */
export type PatchStrategy =
  | 'promise-all' // P1: Convert to Promise.all()
  | 'batch-stub' // P2: Create batch interface TODO
  | 'review-only'; // Not auto-fixable, needs human review

/**
 * Risk level for applying patch
 */
export type PatchRisk = 'low' | 'medium' | 'high';

/**
 * Eligibility status for auto-fix
 */
export interface EligibilityCheck {
  eligible: boolean;
  reason?: string;
}

/**
 * Plan item for auto-remediation
 * This is the handoff contract to Ralph Loop / QC-019
 */
export interface PlanItem {
  id: string; // Unique finding ID
  file: string; // Relative file path
  functionName: string; // Function/method containing the issue
  startLine: number; // Start of function/await block
  endLine: number; // End of function/await block
  kind: WaterfallKind | BundleKind | RerenderKind; // Classification from scanner
  priorityScore: number; // 0-100, higher = fix first
  patchStrategy: PatchStrategy; // How to fix
  risk: PatchRisk; // Risk level
  eligibility: EligibilityCheck; // Can we auto-fix?
  verification: string[]; // Commands to run after patch
  evidence: EvidenceItem[]; // Line-by-line audit trail
  suggestedPatch?: string; // Promise.all() transformation
}

/**
 * Remediation plan output
 */
export interface RemediationPlan {
  generated: string; // ISO timestamp
  ref: string; // Git ref
  rulesVersion: string; // Scanner version
  summary: {
    total: number;
    eligible: number;
    promiseAll: number;
    batchStub: number;
    reviewOnly: number;
  };
  items: PlanItem[];
}
