# Post-Phase-25 Operator Checklist

Date: 2026-03-19
Status: READY
Scope: Task-by-task operator checklist for the post-Phase-25 execution plan

Related artifacts:

- `os-platform/core/pilot/ops/post-phase25-multi-agent-execution-plan-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-agent-assignment-matrix-2026-03-19.md`
- `os-platform/core/pilot/ops/post-phase25-release-authorization-packet-2026-03-19.md`
- `os-platform/core/pilot/ops/cp17-sre-o1-ops-operator-checklist-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-ops-closure-delta-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-ops-next-attempt-inputs-2026-03-20.md`
- `os-platform/core/pilot/ops/sec-005-jwt-rotation-runbook-2026-03-19.md`
- `os-platform/core/pilot/ops/sec-005-jwt-rotation-verification-2026-03-20.md`
- `os-platform/core/pilot/ops/leak-guard-governance-drift-2026-03-19.md`
- `os-platform/core/pilot/ops/leak-guard-remediation-status-2026-03-20.md`
- `os-platform/core/pilot/ops/sre-o1-pager-oncall-evidence-path-2026-03-20.md`

## Update -- 2026-03-20

- Agent A is complete and `SEC-005-ROTATE` is closed.
- Leak-guard drift is remediated; the strict coverage gate is green.
- Current active lane is `SRE-O1-OPS` execution-surface verification plus the authorized pager/on-call closure path, followed by the later live rehearsal bundle.
- The exact next attempt inputs now have a dedicated authority artifact: `os-platform/core/pilot/ops/sre-o1-ops-next-attempt-inputs-2026-03-20.md`.
- The unrelated frontend contract/accessibility cluster still keeps full-root Vitest non-green, but that lane is not active by default from this checklist.

## Pass 0 -- Coordination Freeze

- [ ] Confirm baseline SHA and branch state are recorded before any remediation work starts.
- [ ] Confirm current blocker set is unchanged: `SRE-O1-OPS` and the later live rehearsal execution bundle.
- [ ] Confirm the next `SRE-O1-OPS` attempt has concrete execution-surface values for the input bundle recorded in `os-platform/core/pilot/ops/sre-o1-ops-next-attempt-inputs-2026-03-20.md`.
- [ ] Confirm Phases 20-25 remain sealed and are not being reopened.
- [ ] Create or update execution log for Agent A, Agent B, and Agent C.
- [ ] Assign human owner role for each agent lane.
- [ ] Assign primary AI subagent for each lane.

Evidence output:

- coordination freeze note
- baseline SHA snapshot
- lane owner table

## Pass 1A -- Agent A Security Blocker Closure

### A1 Rotation Inventory

- [ ] Use `os-platform/core/pilot/ops/sec-005-jwt-rotation-runbook-2026-03-19.md` as the execution note for this lane.
- [ ] Inventory every JWT signing secret source.
- [ ] Inventory every consumer that validates JWT signatures.
- [ ] Inventory deployment surfaces that receive the secret.
- [ ] Record current storage authority and rotation authority.
- [ ] Confirm whether Hostinger dev/test and Benton local runtime share or differ in secret handling.

Evidence output:

- JWT rotation inventory
- secret-source and consumer map

### A2 Rotation Execution

- [ ] Generate replacement JWT signing secret in the approved authority.
- [ ] Update deployment injection points and secret references, prioritizing the live `JwtSettings:SecretKey` path.
- [ ] Ensure old secret is no longer the active signing key.
- [ ] Record timestamp, operator, and target surfaces changed.
- [ ] Record rollback material and expiration policy.

Evidence output:

- rotation receipt
- environment update ledger
- rollback instructions

### A3 Post-Rotation Verification

- [ ] Verify auth issuance works after rotation.
- [ ] Verify auth validation works after rotation.
- [ ] Verify the runtime did not fall back to a random default signing key.
- [ ] Verify stale signatures are rejected where required.
- [ ] Verify no accidental auth outage was introduced.
- [ ] Update the post-go-live checklist truth line for `SEC-005-ROTATE`.

Evidence output:

- post-rotation auth verification log
- updated blocker status note

## Pass 1B -- Agent B Frontend Contract/Accessibility Restoration

### B1 Failure Inventory

- [ ] Preserve the leak-guard closure receipt and strict-green proof.
- [ ] Reproduce the seven-file frontend contract/accessibility cluster.
- [ ] Confirm none of the remaining failures are leak-guard-related.
- [ ] Group the failures by TerraCanon persistence/switching vs shell accessibility/keyboard behavior.
- [ ] Record the exact proof commands for each failing file.

Evidence output:

- isolated failing-file ledger
- proof-command ledger

### B2 Frontend Diagnosis

- [ ] Determine the smallest bounded fixes for the TerraCanon and shell accessibility/keyboard cluster.
- [ ] Preserve previously sealed frontend contract proof slices.
- [ ] Reject any proposal that weakens leak-guard policy or relabels this cluster as leak-guard.
- [ ] Write diagnosis note before implementation begins.

Evidence output:

- frontend diagnosis memo
- approved remediation pattern

### B3 Frontend Remediation Waves

- [ ] Sequence the seven frontend failures into bounded waves.
- [ ] Run proof after each wave.
- [ ] Keep previously sealed frontend contract proof untouched.
- [ ] Preserve the already-green leak-guard strict coverage result.
- [ ] Re-run full-root `pnpm exec vitest run` after the frontend cluster pass.

Evidence output:

- wave proof notes
- preserved strict leak-guard pass proof
- final full-root Vitest summary

## Pass 1C -- Agent C Release Truth Packet Preparation

### C1 Evidence Collation

- [ ] Gather CP-19 packet artifacts.
- [ ] Gather Phase 20 UAT signoff and packet.
- [ ] Gather Phase 21-25 evidence artifacts.
- [ ] Gather scoped frontend contract proof commits and proof note.
- [ ] Gather leak-guard closure note, SRE pager-path note, and security blocker references.

Evidence output:

- evidence manifest draft

### C2 Truth Reconciliation

- [ ] Separate sealed work from open blockers.
- [ ] Remove any stale statement that implies full green today.
- [ ] Ensure release truth matches the operating checklist and latest proofs.
- [ ] Mark optional PACS write-back as separate from release authorization.
- [ ] Mark release packet as provisional until Agents A and B close.

Evidence output:

- truth reconciliation memo

### C3 Authorization Packet Draft

- [ ] Draft release authorization memo skeleton.
- [ ] Add placeholder fields for JWT rotation evidence.
- [ ] Add placeholder fields for governance-green evidence.
- [ ] Define final GO / HOLD decision rule.
- [ ] Prepare the final sign-off checklist.

Evidence output:

- authorization packet draft
- sign-off checklist

## Pass 2 -- Convergence

- [ ] Agent A publishes rotation receipt and verification bundle.
- [ ] Agent B publishes leak-guard remediation proof and the full-root rerun summary naming the remaining unrelated failures.
- [ ] Agent C replaces provisional blocker language with final truth.
- [ ] Confirm all evidence artifacts point to exact files and exact SHAs.

Evidence output:

- converged release packet draft

## Pass 3 -- Final Decision

- [ ] Re-run required gates for the final decision snapshot.
- [ ] Confirm blocker list is empty or explicitly marked HOLD.
- [ ] Issue final GO / HOLD memo.
- [ ] Archive the final packet under the governed evidence path.

Evidence output:

- final release decision memo
- final evidence packet

## Hard Guardrails

- [ ] Do not reopen the sealed four-suite frontend contract repair lane.
- [ ] Do not reopen the separate frontend contract/accessibility lane from this checklist unless it is explicitly chosen as a new bounded lane.
- [ ] Do not claim full green before the remaining unrelated full-root failures are resolved or explicitly waived.
- [ ] Do not claim production-ready before the remaining live blockers are closed.
- [ ] Do not weaken leak-guard policy to get a cosmetic pass.