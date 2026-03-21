# Post-Phase-25 Agent Assignment Matrix

Date: 2026-03-19
Status: READY
Scope: Concrete agent and subagent ownership matrix for the post-Phase-25 execution plan

## Update -- 2026-03-20

- Agent A is complete.
- Sanitized closure artifact: `os-platform/core/pilot/ops/sec-005-jwt-rotation-verification-2026-03-20.md`
- Agent B has remediated the leak-guard drift; strict coverage is green and the rerun artifact is `os-platform/core/pilot/ops/leak-guard-remediation-status-2026-03-20.md`.
- Agent C repo-local reconciliation is complete through the current release packet and SRE operator chain.
- Remaining active lane is `SRE-O1-OPS` execution-surface verification plus the authorized pager/on-call closure path, followed by later live rehearsals.
- The unrelated frontend full-root failures named by Agent B remain a separate optional lane and are not active by default.

## Top-Level Agents

| Agent | Human owner role | AI owner | Mission | Blocking deliverable |
|---|---|---|---|---|
| Agent A | Security owner | Copilot-A | Completed `SEC-005-ROTATE` and published rotation proof | JWT rotation receipt + verification bundle |
| Agent B | Governance owner | Copilot-B | Optional later lane to restore honest full-root Vitest green by fixing only the separate frontend contract/accessibility cluster | targeted frontend proof + full-root Vitest rerun summary |
| Agent C | Release truth owner | Copilot-C | Completed repo-local release reconciliation and now points operators to the active `SRE-O1-OPS` execution-surface verification and closure chain | reconciled release authorization packet |

Agent A execution note:

- `os-platform/core/pilot/ops/sec-005-jwt-rotation-runbook-2026-03-19.md`

## Subagent Matrix

| Subagent | Parent | Owner role | Objective | Primary commands | Evidence outputs |
|---|---|---|---|---|---|
| A1 Rotation inventory | Agent A | Security owner | Map JWT secret sources, consumers, and deployment surfaces | environment-specific inventory commands; repo grep over auth and deployment surfaces | JWT inventory, source/consumer map |
| A2 Rotation execution | Agent A | Security owner | Rotate JWT signing material in the approved authority | environment-specific rotation commands and deployment update commands; must update the live `JwtSettings:SecretKey` path | rotation receipt, update ledger, rollback instructions |
| A3 Post-rotation verification | Agent A | Security owner | Verify issuance and validation after rotation | service auth smoke commands; surface verification commands; confirm no default-key fallback | auth verification log, blocker closure note |
| B1 Failure inventory | Agent B | Governance owner | Isolate the seven remaining frontend failures and confirm leak-guard stays closed | targeted Vitest commands for the seven failing files | isolated failure ledger |
| B2 Frontend diagnosis | Agent B | Governance owner | Decide the bounded fix for the TerraCanon and shell accessibility/keyboard cluster | test-source inspection; target file reads; failure proof review | diagnosis memo, approved repair pattern |
| B3 Frontend remediation waves | Agent B | Governance owner | Execute bounded frontend proof waves and restore honest full-root green | targeted seven-file Vitest reruns; `pnpm exec vitest run` | wave proofs, final rerun summary |
| C1 Evidence collation | Agent C | Release truth owner | Collect all sealed artifacts and remediation references | repo evidence inventory commands; packet artifact reads | evidence manifest draft |
| C2 Truth reconciliation | Agent C | Release truth owner | Align release packet claims with repo truth | artifact comparison and checklist reconciliation | truth reconciliation memo |
| C3 Authorization draft | Agent C | Release truth owner | Prepare final GO / HOLD packet and sign-off checklist | document assembly commands only | authorization packet draft, sign-off checklist |

## Parallelism Rules

### Can run immediately in parallel

- A1, B1, and C1
- A2 can start once A1 identifies authoritative rotation surfaces
- B2 can start once B1 produces the de-duplicated inventory
- C2 can start once C1 has the evidence manifest draft

### Must wait on prior outputs

- A3 waits on A2
- B3 waits on B2 diagnosis
- C3 waits on C2 truth reconciliation and needs final inputs from A3 and B3 before closeout

## Required Commands By Lane

### Governance lane anchor commands

```powershell
pnpm exec vitest run os-platform/core/tests/leak-guard-strict-components-coverage.test.ts --reporter=verbose
pnpm exec vitest run
```

### Frontend cluster restoration commands

```powershell
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonCrossTabSyncContract.test.tsx --reporter=verbose
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonMultiWorkspaceSwitcherContract.test.tsx --reporter=verbose
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonRenameWorkspaceIntentContract.test.tsx --reporter=verbose
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonReopenWorkspaceIntentContract.test.tsx --reporter=verbose
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonWorkspacePersistenceSpineContract.test.tsx --reporter=verbose
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/shell/shellAccessibility.contract.test.tsx --reporter=verbose
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/shell/shellKeyboardFocus.contract.test.ts --reporter=verbose
pnpm exec vitest run --reporter=verbose
```

### Frontend proof preservation anchor

```powershell
pnpm exec vitest run frontend/apps/os-shell/src/__tests__/desktop/TerraCanonCrossTabSyncContract.test.tsx frontend/apps/os-shell/src/pages/workbench/__tests__/WorkbenchTabBar.test.tsx frontend/apps/os-shell/src/__tests__/desktop/DesktopIntentContract.test.tsx frontend/apps/os-shell/src/__tests__/desktop/AuthBoundaryIntent.test.tsx --reporter=verbose
```

### Security lane command policy

Security rotation commands are environment-specific and must be taken from the authoritative runtime runbook for the target surface. Do not substitute guessed commands into the final execution packet.

## Decision Gates

| Gate | Owner | Pass condition |
|---|---|---|
| Security blocker closure | Agent A | PASS on 2026-03-20: `SEC-005-ROTATE` no longer listed as hard blocker and verification bundle exists |
| Frontend cluster restoration | Agent B | seven named frontend failures are fixed while leak-guard remains green and the full-root Vitest rerun is honest |
| Release truth closure | Agent C | packet contains no placeholder blocker lines and all evidence references exact artifacts |

## Non-Goals

- no reuse of the sealed contract-repair lane as evidence for leak-guard remediation
- no weakening of governance policy to obtain a pass
- no release-ready claim until the remaining live blockers close and the current full-root failure cluster is resolved or explicitly dispositioned