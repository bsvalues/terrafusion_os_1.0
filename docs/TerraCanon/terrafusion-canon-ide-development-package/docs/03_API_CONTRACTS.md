# Canon/IDE API Contracts

## Canon Runtime

```ts
queryCanon(input: CanonQueryInput): CanonAnswer
getRulesForPath(path: string): CanonRule[]
getRulesForTask(task: CanonTask): CanonRule[]
getAllowedPaths(task: CanonTask): PathPolicy[]
getForbiddenPaths(task: CanonTask): PathPolicy[]
scoreDiff(diff: GitDiff, task: CanonTask): CanonRiskReport
explainViolation(ruleId: string): CanonExplanation
```

## Agent Runtime

```ts
createTask(input: CreateTaskInput): CanonTask
loadCanonContext(taskId: string): CanonTask
proposePlan(taskId: string): TaskPlan
approvePlan(taskId: string, approval: Approval): CanonTask
createWorktree(taskId: string): WorktreeBinding
runTask(taskId: string): TaskRunResult
reviewDiff(taskId: string): CanonRiskReport
runGates(taskId: string): GateRunSummary
sealEvidence(taskId: string): EvidenceBundle
```

## Hook Runtime

```ts
registerHook(event: HookEvent, handler: HookHandler): void
runHooks(event: HookEvent, context: HookContext): HookDecision[]
```

Hook events:

```txt
BeforeTaskCreate
AfterCanonLoad
BeforeFileRead
BeforeFileEdit
BeforeCommandRun
AfterDiffCreated
BeforeGateRun
AfterGateRun
BeforeCommit
BeforePRCreate
AfterTraceSeal
```

## Gate Runtime

```ts
runGate(gateId: string, context: GateContext): Promise<GateResult>
runRequiredGates(task: CanonTask): Promise<GateRunSummary>
```

## Evidence Runtime

```ts
createEvidenceBundle(task: CanonTask, inputs: EvidenceInputs): EvidenceBundle
redactEvidence(bundle: EvidenceBundle): EvidenceBundle
sealTrace(bundle: EvidenceBundle): TraceSeal
```

## Git Runtime

```ts
createWorktree(task: CanonTask): WorktreeBinding
getDiff(worktreePath: string): GitDiff
stageHunk(hunkId: string): GitOperationResult
revertHunk(hunkId: string): GitOperationResult
commit(task: CanonTask, message: string): GitCommitResult
createPr(task: CanonTask, summary: string): PullRequestDraft
```
