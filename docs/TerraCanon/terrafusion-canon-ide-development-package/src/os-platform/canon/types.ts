export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RuleStatus = 'active' | 'draft' | 'deprecated';
export type RuleAuthority = 'constitutional' | 'os-platform' | 'engineering-policy' | 'advisory';
export type EnforcementLevel = 'block' | 'warn' | 'require-approval' | 'inform';

export interface CanonRule {
  ruleId: string;
  version: string;
  status: RuleStatus;
  authority: RuleAuthority;
  title: string;
  description: string;
  source?: string;
  appliesTo: {
    paths?: string[];
    taskIntents?: string[];
    surfaces?: string[];
  };
  enforcement: {
    level: EnforcementLevel;
    requiredGates?: string[];
    requiresManualReview?: boolean;
  };
}

export interface CanonIndex {
  version: string;
  effectiveDate: string;
  rules: CanonRule[];
}

export interface PathPolicy {
  pattern: string;
  owner: string;
  risk: RiskLevel;
  requiredGates: string[];
  manualReview: boolean;
  defaultAction?: 'allow' | 'block' | 'require-approval';
}

export interface EngineeringWriteLaneIndex {
  version: string;
  paths: PathPolicy[];
}

export interface CanonTask {
  taskId: string;
  intent: string;
  surface: 'os-canon' | 'canon-desktop' | 'cli' | 'ci';
  state: string;
  risk: RiskLevel;
  scope: {
    allowedPaths: string[];
    forbiddenPaths: string[];
  };
  requiredGates: string[];
  approvals?: unknown[];
}

export interface CanonAnswer {
  summary: string;
  rules: CanonRule[];
  requiredGates: string[];
  risk: RiskLevel;
  blockers: string[];
}

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GitDiff {
  files: DiffFile[];
}

export interface CanonRiskReport {
  risk: RiskLevel;
  score: number;
  touchedRules: string[];
  requiredGates: string[];
  blockers: string[];
  manualReviewRequired: boolean;
}
