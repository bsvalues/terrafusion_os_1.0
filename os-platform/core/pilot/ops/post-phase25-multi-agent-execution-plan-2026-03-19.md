# Post-Phase-25 Multi-Agent Execution Plan

Date: 2026-03-19
Status: READY
Scope: Post-Phase-25 operating plan after CP-19 and Phases 21-25 are sealed

Companion artifacts:

- `os-platform/core/pilot/ops/post-phase25-operator-checklist-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-agent-assignment-matrix-2026-03-19.md`

## Truth Source

Current operating truth from the repository is:

- Phase 20 UAT: COMPLETE (`GO`)
- Phases 21-25: COMPLETE (`GO`)
- Full-root Vitest: NOT green due to separate leak-guard governance drift
- Security hard blocker still called out in the post-go-live checklist: `SEC-005-ROTATE`

This plan does not claim a new sealed phase yet. It defines the next executable work as parallel operating lanes with explicit blockers, evidence, and merge criteria.

## Proposed Next Phases

### Phase 26 -- Production Blocker Closure

Exit target:

- close production-blocking security and access items that still prevent production-traffic authorization

Primary blocker in current truth:

- `SEC-005-ROTATE` (JWT key rotation)

### Phase 27 -- Governance Green Restoration

Exit target:

- restore full-root governance green without mixing unrelated repairs into already-sealed frontend contract work

Primary blocker in current truth:

- `os-platform/core/tests/leak-guard-strict-components-coverage.test.ts`

### Phase 28 -- Release Authorization Packet

Exit target:

- produce one release-decision packet that binds the sealed operational phases, the security rotation receipt, and restored governance green into a single go/no-go record

## Parallel Execution Model

Three top-level agents run in parallel after a short coordination pass.

| Agent | Lane | Parallelizable | Blocking output |
|---|---|---|---|
| Agent A | Security hard blocker closure | Yes | JWT rotation receipt + access-hardening evidence |
| Agent B | Governance green restoration | Yes | leak-guard remediation proof + full-root vitest rerun |
| Agent C | Release truth / evidence packet | Partial | release authorization packet using outputs from A and B |

Agent C can prepare packet structure and evidence placeholders immediately, but final release authorization cannot close until Agents A and B finish.

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
- post-go-live checklist can truthfully remove `SEC-005-ROTATE` as a hard blocker

### Evidence Targets

- rotation receipt document
- post-rotation verification log
- updated operating checklist truth line

## Agent B -- Governance Green Restoration

### Objective

- remediate the separate leak-guard drift as its own governed slice and restore full-root Vitest green

### Subagents In Parallel

1. Subagent B1 -- Coverage inventory
   - de-duplicate the reported 63 unguarded files
   - cluster them by area: atlas, canon, dais, dossier, forge, levy, pilot, etc.

2. Subagent B2 -- Rule-model diagnosis
   - determine whether the correct fix is missing guard files, coverage mapping drift, or eligibility narrowing
   - explicitly reject any repair that weakens the gate without justification

3. Subagent B3 -- Remediation wave planning
   - sequence the actual fix set into bounded waves
   - define proof commands for each wave and the final full-root rerun

### Exit Criteria

- leak-guard strict coverage test passes
- no unrelated previously-sealed frontend proof is rewritten or reclassified
- full-root Vitest rerun is green, or any remaining blocker is newly discovered and separately documented

### Evidence Targets

- leak-guard remediation ledger
- wave-by-wave proof notes
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
  ├─ Agent B: leak-guard remediation
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
- do not claim production-ready status before `SEC-005-ROTATE` and governance green are both closed
- do not weaken leak-guard policy merely to achieve a cosmetic pass