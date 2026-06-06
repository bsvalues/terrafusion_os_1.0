export type TaskState =
  | 'Draft'
  | 'CanonContextLoaded'
  | 'ScopeProposed'
  | 'PlanProposed'
  | 'RiskScored'
  | 'AwaitingApproval'
  | 'WorktreeCreated'
  | 'Executing'
  | 'DiffReady'
  | 'GatesRunning'
  | 'ReviewRequired'
  | 'CommitReady'
  | 'TraceSealed'
  | 'PRReady'
  | 'Closed'
  | 'Failed';

const TRANSITIONS: Record<TaskState, TaskState[]> = {
  Draft: ['CanonContextLoaded', 'Failed'],
  CanonContextLoaded: ['ScopeProposed', 'Failed'],
  ScopeProposed: ['PlanProposed', 'Failed'],
  PlanProposed: ['RiskScored', 'AwaitingApproval', 'Failed'],
  RiskScored: ['AwaitingApproval', 'WorktreeCreated', 'Failed'],
  AwaitingApproval: ['WorktreeCreated', 'Failed'],
  WorktreeCreated: ['Executing', 'Failed'],
  Executing: ['DiffReady', 'Failed'],
  DiffReady: ['GatesRunning', 'ReviewRequired', 'Failed'],
  GatesRunning: ['ReviewRequired', 'CommitReady', 'Failed'],
  ReviewRequired: ['CommitReady', 'Executing', 'Failed'],
  CommitReady: ['TraceSealed', 'Failed'],
  TraceSealed: ['PRReady', 'Closed', 'Failed'],
  PRReady: ['Closed', 'Failed'],
  Closed: [],
  Failed: []
};

export function canTransition(from: TaskState, to: TaskState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: TaskState, to: TaskState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid Canon task transition: ${from} → ${to}`);
  }
}

export function nextStates(from: TaskState): TaskState[] {
  return TRANSITIONS[from] ?? [];
}
