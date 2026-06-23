export interface GateDefinition {
  gateId: string;
  label: string;
  command: string;
  riskCoverage: string[];
  requiredFor: string[];
}

export interface GateRegistry {
  version: string;
  gates: GateDefinition[];
}

export interface GateContext {
  taskId: string;
  repoPath: string;
  worktreePath?: string;
}

export interface GateResult {
  gateId: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  command?: string;
  stdoutPath?: string;
  stderrPath?: string;
  summary: string;
  startedAt: string;
  finishedAt: string;
}
