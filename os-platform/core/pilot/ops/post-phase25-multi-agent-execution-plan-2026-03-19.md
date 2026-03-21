# Post-Phase-25 Multi-Agent Execution Plan

Date: 2026-03-19
Status: READY
Scope: Post-Phase-25 operating plan after CP-19 and Phases 21-25 are sealed

Companion artifacts:

- `os-platform/core/pilot/ops/post-phase25-operator-checklist-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-agent-assignment-matrix-2026-03-19.md`

## Update -- 2026-03-20

- Agent A completed `SEC-005-ROTATE` on the live Hostinger runtime path.
- Sanitized closure artifact: `os-platform/core/pilot/ops/sec-005-jwt-rotation-verification-2026-03-20.md`
- Leak-guard governance drift is closed and its strict gate is green.
- The current active lane is `SRE-O1-OPS` live closure via the off-box pager/on-call path plus the later live rehearsal bundle.
- The exact operator-side prerequisites for the next off-box attempt are now narrowed in `os-platform/core/pilot/ops/sre-o1-ops-next-attempt-inputs-2026-03-20.md`.
- The separate frontend contract/accessibility restoration lane remains optional and is not active by default in this plan revision.

## Truth Source

Current operating truth from the repository is:

- Phase 20 UAT: COMPLETE (`GO`)
- Phases 21-25: COMPLETE (`GO`)
- Full-root Vitest: NOT green due to a separate frontend contract/accessibility failure cluster
- `SEC-005-ROTATE` is closed; production traffic still remains `HOLD` for other live conditions
- Current CP-17 source of truth is the release packet plus the SRE operator chain, not the earlier provisional parallel-plan posture

This plan does not claim a new sealed phase yet. It defines the next executable work as parallel operating lanes with explicit blockers, evidence, and merge criteria.

## Proposed Next Phases

### Phase 26 -- Production Blocker Closure

Exit target:

- close production-blocking security and access items that still prevent production-traffic authorization

Primary blocker in current truth:

- `SRE-O1-OPS` and the remaining live rehearsal bundle

### Phase 27 -- Governance Green Restoration

Exit target:

- restore honest full-root Vitest green without mixing unrelated repairs into already-sealed proof slices

Primary blocker in current truth:

- seven-file frontend contract/accessibility failure cluster

Current posture:

- optional later lane only
- not part of the active CP-17 off-box closure sequence

### Phase 27B -- Frontend Contract/Accessibility Cluster Restoration

Owner: Agent B (separate lane)
Goal: restore honest full-root Vitest green without reclassifying leak-guard or reopening sealed proof slices

Success criteria:

- reproduce and fix only the seven named frontend failures
- preserve previously sealed frontend contract proof slices
- rerun:
   - `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonCrossTabSyncContract.test.tsx --reporter=verbose`
   - `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonMultiWorkspaceSwitcherContract.test.tsx --reporter=verbose`
   - `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonRenameWorkspaceIntentContract.test.tsx --reporter=verbose`
   - `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonReopenWorkspaceIntentContract.test.tsx --reporter=verbose`
   - `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonWorkspacePersistenceSpineContract.test.tsx --reporter=verbose`
   - `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/shell/shellAccessibility.contract.test.tsx --reporter=verbose`
   - `pnpm exec vitest run frontend/apps/os-shell/src/__tests__/shell/shellKeyboardFocus.contract.test.ts --reporter=verbose`
   - `pnpm exec vitest run --reporter=verbose`

Guardrails:

- do not weaken leak-guard policy
- do not relabel this cluster as leak-guard
- do not claim production-ready from this lane alone

### Phase 28 -- Release Authorization Packet

Exit target:

- produce one release-decision packet that binds the sealed operational phases, the security rotation receipt, and restored governance green into a single go/no-go record

## Parallel Execution Model

Three top-level agents run in parallel after a short coordination pass.

| Agent | Lane | Parallelizable | Blocking output |
|---|---|---|---|
| Agent A | Security hard blocker closure | Yes | JWT rotation receipt + access-hardening evidence |
| Agent B | Frontend contract/accessibility restoration | Yes | targeted frontend proof + full-root Vitest rerun summary |
| Agent C | Release truth / evidence packet | Partial | release authorization packet using outputs from A and B |

Agent C can prepare packet structure and evidence placeholders immediately, but final release authorization cannot close until Agents A and B finish.
Agent A is now complete; current release truth remains blocked by the remaining live SRE/rehearsal items. Agent B is a separate optional lane, not part of the active off-box closure sequence.

## Agent A -- Security Hard Blocker Closure

### Objective

- execute and prove `SEC-005-ROTATE` without disturbing already-sealed contract-test proof
- use `os-platform/core/pilot/ops/sec-005-jwt-rotation-runbook-2026-03-19.md` as the lane-specific execution packet

### Subagents In Parallel

1. Subagent A1 -- Rotation inventory
   - identify every JWT signing secret source, consumer, and deployment surface
   - verify Benton local runtime, Hostinger dev/test surfaces, and any promotion receipts that embed release identity

2. Subagent A2 -- Rotation implementation
   - perform the actual secret rotation path
   - update env storage, deployment injection points, and any rotation runbook deltas

3. Subagent A3 -- Post-rotation verification
   - verify auth still works on intended surfaces
   - verify no stale tokens or invalid issuer/signature mismatches remain

### Exit Criteria

- new JWT secret is generated and stored in the authoritative location
- old secret is no longer accepted on intended production surfaces
- rotation evidence is written and linked from the operating packet
- post-go-live checklist truth line is updated and `SEC-005-ROTATE` is no longer listed as a hard blocker

### Evidence Targets

- rotation receipt document
- post-rotation verification log
- updated operating checklist truth line

## Agent B -- Governance Green Restoration

### Objective

- preserve the closed leak-guard result and restore honest full-root Vitest green by fixing only the separate frontend contract/accessibility cluster

### Subagents In Parallel

1. Subagent B1 -- Coverage inventory
   - preserve the leak-guard closure receipt and isolate the remaining seven frontend failures
   - confirm that none of the remaining failures are leak-guard-related

2. Subagent B2 -- Rule-model diagnosis
   - determine the smallest bounded fix for the TerraCanon and shell accessibility/keyboard cluster
   - explicitly reject any repair that weakens leak-guard or reclassifies this cluster

3. Subagent B3 -- Remediation wave planning
   - sequence the seven failing files into bounded proof waves
   - define proof commands for each wave and the final full-root rerun

### Exit Criteria

- leak-guard strict coverage remains green
- no unrelated previously-sealed frontend proof is rewritten or reclassified
- full-root Vitest rerun is green, or any remaining blocker is newly discovered and separately documented

### Evidence Targets

- leak-guard closure receipt
- wave-by-wave frontend proof notes
- final full-root Vitest summary

## Agent C -- Release Truth And Authorization Packet

### Objective

- prepare the release-decision packet while A and B execute so final authorization is a short closeout, not a fresh research pass

### Subagents In Parallel

1. Subagent C1 -- Evidence collation
   - gather CP-19, Phases 20-25, scoped frontend contract proof, and current operating checklist references

2. Subagent C2 -- Truth reconciliation
   - ensure all packet statements remain consistent with current repo truth
   - explicitly separate sealed work, open blockers, and deferred optional work

3. Subagent C3 -- Final authorization draft
   - prepare the final release decision memo template with placeholder status lines for Agent A and Agent B outputs

### Exit Criteria

- all sealed phases and remediation outputs are referenced by exact artifact
- release packet contains no false claim of full green until Agent B closes governance drift
- packet can move directly to GO / HOLD once A and B land

## Dependency Graph

```text
Coordination pass
  ├─ Agent A: SEC-005 rotation
  │    ├─ A1 inventory
  │    ├─ A2 rotate
  │    └─ A3 verify
   ├─ Agent B: frontend contract/accessibility restoration
  │    ├─ B1 inventory
  │    ├─ B2 diagnose
  │    └─ B3 wave plan / execute
  └─ Agent C: release packet prep
       ├─ C1 evidence collation
       ├─ C2 truth reconciliation
       └─ C3 authorization draft

Final closeout requires:
  A complete + B complete + C packet updated with final receipts
```

## Recommended Execution Order

### Pass 0 -- Coordination

- freeze current truth sources
- pin baseline SHAs and current blocker list
- assign owners per agent

### Pass 1 -- Parallel Work

- Agent A and Agent B run at the same time
- Agent C starts packet preparation immediately with placeholder blocker lines

### Pass 2 -- Convergence

- Agent A publishes rotation receipt
- Agent B publishes governance-green proof
- Agent C replaces placeholders and assembles the final release packet

### Pass 3 -- Release Decision

- re-run required gates
- issue final GO / HOLD memo from the packet

## Commands To Anchor The Plan

Security lane commands are environment-specific and must use the authoritative runbook for the target surface.

Governance lane anchor command:

```powershell
pnpm exec vitest run os-platform/core/tests/leak-guard-strict-components-coverage.test.ts --reporter=verbose
```

Final green verification command:

```powershell
pnpm exec vitest run
```

## Non-Goals

- do not reopen the already-sealed four-suite frontend contract repair lane
- do not claim production-ready status before the remaining live blockers and governance green are both closed
- do not weaken leak-guard policy merely to achieve a cosmetic pass
- do not relabel the seven-file frontend cluster as leak-guard