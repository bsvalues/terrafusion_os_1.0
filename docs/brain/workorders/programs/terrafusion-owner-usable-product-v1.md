# TerraFusion Owner-Usable Product V1

**Goal:** `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1`

**Loop:** `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1`

**Owner directive:** GitHub Issue #1589 (recorded owner directive, 2026-09-11)

**Authority:** `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` in `.governance/owner-decisions.json`

**Deadline:** none fixed; WAL V1 retains the 2026-09-28 production deadline. TUOP-V1 feeds WAL: only a TUOP-accepted candidate should be carried through WAL's production gates.

**Status:** ACTIVE on protected merge of the activation PR. `WO-TUOP-000` (mission activation) completes on protected merge; `WO-TUOP-001` (first live Product Reality Matrix) is then dependency-cleared and is the first execution.

## Mission

Turn the existing TerraFusion body of work into a coherent, usable product. HERMES continuously inspects, repairs, integrates, deploys and browser-verifies TerraFusion OS, Counties HUB, Property Workbench, TerraForge, TerraAtlas, TerraDais, TerraDossier, TerraGPT and TerraCanon until the intended assessor workflows work in the launched application. Tests, PRs, routes, source ownership, contracts and backend functionality are supporting evidence only — never the terminal condition.

This is a mission-level program. A child WO, a merged PR, a green test suite, or a backend proof is not the task boundary. The lead operator continues through the dependency graph until the terminal condition is observed or a genuine authority wall is reached.

## Why this program exists (the recorded defect it closes)

1. No prior mission-level authority had the terminal condition "TerraFusion OS and the suites are an owner-usable product." WAL V1 carries the 39-county launch path; the Five-Suite program completed canonical ownership/contracts/adapters/parity at the pure-unwired layer — a "suite complete" state that was never product completeness. Months of micro-completions happened because narrow WOs escalated broader work and no parent product loop existed to catch the escalation. This program is that loop.
2. The owner is the authority wall, not the dispatcher (`GOAL_LOOP_AUTONOMY_RULES.md`). TUOP-V1 is structured so HERMES owns plan/dispatch/recovery and the owner makes actual owner decisions only.

## The loop (HERMES owns it)

```text
Launch exact candidate
        ↓
Exercise actual product (browser, from the screen)
        ↓
Find first real product defect
        ↓
Cortex classify (authority resolution → contradiction scan → canon reconciliation)
        ↓
Derive exact bounded child WO
        ↓
Implement / build / test (isolated worktree, exact reservations)
        ↓
Independent review / remediate
        ↓
Protected merge
        ↓
Deploy exact candidate (lab-internal pre-production)
        ↓
Browser acceptance (OMEN / agent-driven)
        ↓
PASS? — NO → next exact repair child (KEEP GOING)
      — YES per surface → record capability, continue journey
```

Forbidden loop exits: "PR complete, come ask William what's next." "Tests pass, mission complete." "Backend done, UI later." Owner prompt relay between children.

## Product Reality Matrix (the measurement standard)

The first execution is **not** a rebuild and **not** a source review. HERMES launches the current exact candidate and observes it **from the screen**, producing the live Product Reality Matrix. For every major capability:

`VISIBLE → OPENS → REAL DATA → OPERATES → WRITES/PERSISTS → RELOADS → HANDS OFF → PASS`

Verdict discipline (expanded from the TerraForge canonical-inventory acceptance code to the whole product):

| Verdict | Meaning |
| --- | --- |
| `PASS` | Full chain observed on the launched candidate |
| `PARTIAL` | Real but incomplete chain; name the exact broken stage |
| `SHELL_ONLY` | Surface renders but performs nothing real |
| `WRONG_SURFACE` | Capability exists on a different surface than the product journey requires |
| `HONEST_UNAVAILABLE` | Surface truthfully declares unavailability (acceptable interim state, not a defect) |
| `MISSING` | Not present |
| `FAIL` | Present and broken, or a normal-looking affordance leads nowhere |

An empty-looking shell never counts as working capability. The matrix is continuously refreshed; it is the program's Observe step.

## Terminal acceptance (single receipt)

**`TERRAFUSION_OWNER_USABLE_PRODUCT_V1: PASS`** — required from an actual launched candidate, browser-proven at an exact deployed revision:

- **OS:** desktop/windowing/navigation/context is coherent and usable.
- **Counties HUB:** Benton and statewide county context behaves truthfully.
- **Workbench:** search parcel → open parcel → state/context survives.
- **Forge:** useful Cost/Comps/Sales/Income workflow works.
- **Atlas:** actual useful spatial workflow — not cards advertising nonexistent GIS tools.
- **Dais:** real assessor workflow can be performed and persisted.
- **Dossier:** evidence/document handoff and retrieval works.
- **GPT:** useful grounded assessor interaction in the correct county/property context.
- **TerraCanon:** support can identify running release, runtime health, suite health, Edge/Sync/data condition and produce useful diagnostics.
- **Persistence:** reload/restart/re-entry works.
- **Cross-suite:** context and workflow handoffs work.
- **UX:** no normal-looking button leads to a nonexistent product; queued capability is disabled/hidden, never broken-looking.
- **Release identity:** the browser proves the exact deployed candidate.

Only after this PASS should WAL V1 carry the accepted candidate through its real production gates (WO-WAL-007 exact-candidate acceptance → WO-WAL-008 production/external assessor acceptance).

## Work Order graph

| WO | Outcome | Dependency |
| --- | --- | --- |
| `WO-TUOP-000` | Canonicalize Issue #1589 mission authority, register this program, reconcile `docs/brain/canon/current-release.json` to the active owner decision set | owner directive |
| `WO-TUOP-001` | Launch the current exact candidate in the lab and produce the first live Product Reality Matrix from the screen; classify every non-PASS verdict; derive the exact bounded repair children for defects inside this authority | 000 protected merge |
| `WO-TUOP-0xx` (derived) | One exact bounded product-usability repair child per classified defect, created under `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` child policy — never floating, always registered | 001 matrix verdicts |
| `WO-TUOP-099` | Terminal acceptance: full-journey browser proof on the exact deployed candidate; record `TERRAFUSION_OWNER_USABLE_PRODUCT_V1: PASS`; hand the accepted candidate identity to WAL V1 | all repair children |

Child WOs are derived from observed defects (the matrix), not invented from source archaeology. The morning deep-dive feeds the same loop: for each finding, dispatch an existing bounded recovery child or derive the exact child inside this authority; stop only at a genuine owner authority wall.

## Hard walls (mandatory, unchanged)

External county-system write-back; Benton production access (Benton remains outside the personal lab; HERMES must not become Benton production); protected county data/credentials/secrets without exact recorded authorization; cross-county disclosure; silent Benton fallback; unsupported capability claims; fabricated evidence; required-control/branch-protection/review/exact-head/reservation bypass; suite redesign beyond product-usability repair; work outside Issue #1589. Lab-internal candidate deployment for browser acceptance is authorized; public production promotion remains the WAL V1 gated path (SW-01/SW-04).

## Authority-resolution rule (the Brain-safety clause)

Any agent executing under this program must first run: **authority resolution → contradiction scan → canon reconciliation → execution.** Owner decisions outrank Brain canon. A Wiki or canon artifact generated from stale truth is not authority. The activation under `WO-TUOP-000` reconciles `current-release.json` (which still recorded the pre-WAL Phase 0 gate and deferred statewide interoperability) to the active owner decision set.

## Relationship to WAL V1

WAL V1 (`OWNER-WAL-V1-MISSION-AUTHORITY-20260827`, deadline 2026-09-28) remains ACTIVE and owns the production launch path. Coordination rule: TUOP-V1 children touching Counties HUB, county data trust modes, Sync, or the WAL launch path must not duplicate or contradict an open WAL child; where both programs claim the same seam, the WAL child owns the merge and TUOP-V1 consumes its result. TUOP-V1 owns the product-usability recovery seams WAL does not cover, including usability repair (not redesign) in the four suite repositories.

## Continuation

On protected merge of the activation, continue automatically into `WO-TUOP-001` and then the repair-child wave. Do not return to the owner merely because activation or an individual child PR completed. Reaching a real wall is success; emit the standard RESULT block and wait.
