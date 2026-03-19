# Multi-Agent + Subagent Parallel Execution Plan (Post Slice 35)

Date: 2026-03-19  
Branch: post-r3/w5f-registry-edge-cleanup  
Classification: Planning-only (no execution authorization)

## Objective

Define the next governed execution sequence using a multi-agent topology with parallel subagent lanes, while preserving single-writer safety and hard-stop discipline.

## Current Truth Baseline

- Slice 35 is closed: Lane 1, Lane 2, Lane 3, and SW-2 are closed in workflow status.
- Historical publication baseline: 7E was dependency-gated until 7C closure (and 7D only if invoked).
- Execution update (2026-03-19, Phase D.1): 7C closure has now been recorded; dependency-prep blocker for 7E is cleared with 7D still optional/not-invoked.
- This plan does not lift any existing go/no-go checkpoints.

## Governance Constraints

- Single writer lane for any write phase.
- Parallel subagents are read-only by default.
- Write access for non-writer subagents requires explicit disjoint file-set grants.
- Hard stop on any failed gate, scope violation, or missing evidence artifact.
- No forbidden-scope edits.

## Agent Topology

- Orchestrator Agent
  - Controls phase entry/exit and barrier decisions.
- Copilot Writer Lane
  - Only lane that writes in standard execution.
- Contract-Truth Subagent Lane (parallel, read-only)
  - Confirms contract and governance truth.
- Proof-Audit Subagent Lane (parallel, read-only)
  - Runs proof commands and captures evidence.
- Checkpoint Agent
  - Enforces closure wall and hard-stop checkpoints.

## RACI Matrix

| Work Item | Copilot Writer | Contract-Truth | Proof-Audit | Checkpoint |
|---|---|---|---|---|
| Charter and phase intent | A | C | C | R |
| Scope and policy validation | C | R/A | I | C |
| Evidence command execution | I | C | R/A | C |
| Barrier admission prep | C | R | R | A |
| File modifications | R/A | I | I | C |
| Closure validation | C | C | R | A |
| Hard-stop enforcement | I | C | C | R/A |

Legend: R=Responsible, A=Accountable, C=Consulted, I=Informed

## Phase Sequence

### Phase A - Bootstrap

Entry:
- Active checkpoint state confirmed.
- Allowed/forbidden paths reaffirmed.

Output:
- One execution charter with objective, scope, and proof wall.

### Phase B - Parallel Read-Only Sweep

Run in parallel:

- Contract-Truth subagent:
  - Validate dependency gates and scope boundaries.
  - Produce blocker map for 7E preconditions.

- Proof-Audit subagent:
  - Run command wall on current state.
  - Produce pass/fail and delta list.

- Workflow Sync subagent (optional, read-only):
  - Identify stale workflow statements that conflict with current closure truth.

Output:
- Truth report + proof report + stale-statement report.

### Phase C - Synchronization Barrier

Admission requires all:
- No unresolved forbidden-scope conflict.
- Mandatory command wall complete.
- Dependency posture explicitly classified (open vs blocked).

Decision:
- Pass -> Phase D.
- Fail -> hard stop and checkpoint update.

### Phase D - Single Writer Execution

Writer lane executes one bounded slice at a time. Suggested queue order:

1. Dependency-first preparation for 7E (no 7E execution until dependencies clear).
2. Conditional next bounded slice if unblocked.
3. Optional mechanical cleanup lane only after explicit approval.

Rules:
- No overlapping writes across agents.
- If disjoint write grants are issued, grants must list exact files and expiration.

### Phase E - Closure Wall

Minimum required evidence commands:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Recommended additions for active lane:

```bash
# Optional targeted lane proof
pnpm vitest run <targeted-tests>
```

Exit:
- Green closure wall + checkpoint artifact recorded.

### Phase F - Hard Stop and Re-Entry

Trigger hard stop on:
- Any failed mandatory gate.
- Scope violation.
- Missing evidence artifact.

Re-entry requires:
- Explicit checkpoint note with failure reason.
- Updated bounded charter for retry.

## Subagent Parallel Batch Template

Use this template at each phase opening:

1. Launch Contract-Truth subagent (read-only).
2. Launch Proof-Audit subagent (read-only).
3. Optionally launch Workflow Sync subagent (read-only).
4. Wait for all reports.
5. Run synchronization barrier checklist.
6. Open writer lane only if barrier passes.

## Disjoint Write Grant Template (Only If Needed)

Grant ID:  
Subagent:  
Mode: write-disjoint  
Files:
- path/one
- path/two
Start:
End:
Approved by:

## Deliverables

- Execution charter for the active bounded slice.
- Parallel truth/proof report bundle.
- Closure wall evidence bundle.
- Checkpoint note with explicit next entry condition.

## Acceptance Criteria

- Single-writer integrity preserved for write phases.
- Parallel subagents used only for read-only truth/proof unless explicitly granted disjoint writes.
- Mandatory command wall captured in closure evidence.
- Dependency-gated items do not execute early.
- Hard-stop checkpoints remain authoritative.
