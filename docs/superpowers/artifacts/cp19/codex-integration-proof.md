# CP-19 TerraCanon Codex Integration Proof

Date: 2026-03-19
Phase: Phase 9 — TerraCanon IDE Codex Features (post-March 25th)
Gate: Codex Gate
Status: RESERVED — Codex service not yet live (earliest: 2026-03-25)

## Precondition

Codex service must be live before this phase opens.
This artifact is a placeholder — execution begins on or after 2026-03-25.

## Scope (Roadmap Phase 9)

| Step | Scope |
|---|---|
| 9-A | Wire `CodexController` + `CodexCollaborationController` to live Codex service |
| 9-B | Real-time co-editing session management |
| 9-C | TerraCanon IDE end-to-end integration tests pass |

## Existing TerraCanon Surfaces (must remain functional)

- IDSCommandCenter
- ImportWizard
- SyncDashboard

## Proof Commands (to run once Codex is live)

```bash
node --test os-platform/core/tests/canon-doctor.test.mjs
node --test os-platform/core/tests/canon-ping.test.mjs
node --test os-platform/core/tests/canon-reopen.contract.test.mjs
node --test os-platform/core/tests/canon-governance-barrel.contract.test.mjs
```

Manual proof:
- Codex collaboration session opens
- Co-edit round-trip completes without error

## Evidence Fields (to fill after 2026-03-25)

| Test | Expected | Actual | Status |
|---|---|---|---|
| canon-doctor.test.mjs | all pass | — | RESERVED |
| canon-ping.test.mjs | all pass | — | RESERVED |
| canon-reopen.contract.test.mjs | all pass | — | RESERVED |
| canon-governance-barrel.contract.test.mjs | all pass | — | RESERVED |
| Manual: Codex session opens | session established | — | RESERVED |
| Manual: Co-edit round-trip | no error | — | RESERVED |
| Existing surfaces: IDSCommandCenter | functional | — | RESERVED |
| Existing surfaces: ImportWizard | functional | — | RESERVED |
| Existing surfaces: SyncDashboard | functional | — | RESERVED |

## Pass Condition (Codex Gate)

All existing TerraCanon surfaces functional AND new Codex collaboration features proven end-to-end.
All 4 canon test suites pass.
Manual co-edit round-trip completes without error.
