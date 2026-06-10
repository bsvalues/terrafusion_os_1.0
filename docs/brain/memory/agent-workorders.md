# Agent Work Orders

> One work order at a time. **Not five. One.** Every order names its lane, its allowed/forbidden
> writes, and its stop conditions. This is how agent sprawl is prevented.

## The agent roster (6 roles, narrow lanes)
| Role | Job | Does NOT |
|------|-----|----------|
| **Architect** | Classify: layer, suite owner, data owner, allowed/forbidden writes, 1.0-or-defer | Build |
| **Graph** | Run drift detectors; report blast radius, drift, coverage gaps; classify P0–P3 | Fix |
| **Builder** | Implement **only** the work order | Re-architect, cross lanes, "while here" fixes |
| **Reviewer** | Check diff vs canon/write-lanes/workbench/honesty/tests → Approve/Changes/Block | Build |
| **QA** | Verify build/type-check/persistence/CountyId/honesty/routing; run tests | Propose features |
| **Docs** | Update this vault, ADRs, release evidence, deferrals | Expand architecture |

## "Do not let agents do this" (hard list)
1. Re-architect the OS · 2. Create new suites · 3. Rename canonical components · 4. Cross write lanes
5. Touch shell routing while fixing Dais · 6. Touch Dais while fixing Forge · 7. Present mock as real
8. Add dependencies casually · 9. Rewrite working components · 10. Fix unrelated files "while here"
11. Ignore failing tests · 12. Create governance docs without updating [[canon-digest]] · 13. Bypass Property Workbench for parcel-scoped actions

---

## Work Order Template
```md
# WO-NNN: <title>
## Task
## Agent Role        Architect / Builder / Reviewer / QA / Docs / Graph
## Layer             1 OS Shell / 2 Home / 3 Suite / 4 Workbench / 5 App
## Suite / Owner     OS / Forge / Atlas / Dais / Dossier / GPT
## Allowed Files     - <paths>
## Forbidden Files   - <paths>
## Allowed Writes    - <data/lane>
## Forbidden Writes  - <data/lane>
## Required Checks   - <commands + expected evidence>
## Stop Conditions
Stop if: another suite must change · shell routing must change · data ownership unclear ·
build failure is unrelated · mock data appears on a governed path.
```

---

## Active

### WO-001: Verify TerraDais persistence (do NOT rebuild)
**Why:** Drift D-002 — the planned "build Dais persistence" is already implemented. Close the
release gate by *proving behavior*, not by re-writing existing code.

- **Agent Role:** QA
- **Layer:** 3 (TerraDais) — backend only
- **Suite / Owner:** Dais
- **Allowed Files:** read-only across `backend/src/TerraFusion.Core/Entities/{Appeal,Exemption,CertificationStep,Notice,QueueItem}.cs`, `backend/src/TerraFusion.Core/Services/{AppealService,ExemptionService}.cs`, `backend/src/TerraFusion.API/Controllers/DaisController.cs`; run-only the Dais test suites.
- **Forbidden Files:** Forge valuation, Atlas geometry, Dossier documents, shell routing, any migration creation, any new entity.
- **Allowed Writes:** the test run + results into [[release-gates]] and [[drift-ledger]]. **No production code changes** unless a test reveals a real defect — then a *new* work order.
- **Forbidden Writes:** new Dais entities (they exist), other suites' data.
- **Required Checks (evidence required):**
  - `cd backend && dotnet test --filter DaisPersistence` → record pass/fail + count
  - `cd backend && dotnet test --filter DaisCountyIsolation` → confirm CountyId isolation enforced
  - Confirm `Appeal`/`Exemption` carry audit fields (CreatedAt/UpdatedAt/CreatedBy/UpdatedBy) and `CountyId`
- **Stop Conditions:** if a test reveals a real persistence/isolation defect → STOP, open a drift row + a *new* Builder work order scoped to that defect only. Do not fix opportunistically.
- **Status:** ✅ **DONE 2026-06-09.** Ran via `dotnet test --no-build` (in-memory; avoided the D-001 lock + the live agent fleet). **31** Dais persistence tests (API.Tests) + **6** CountyId-isolation tests (Integration.Tests) = **37 green**. `Appeal`/`Exemption` confirmed carrying `CountyId` + audit fields. Stop-condition note: found 34 fake-green stub tests → filed **D-008** (own slice, did not fix). D-002 resolved.

## Done
- **WO-001 — Verify TerraDais persistence** ✅ 2026-06-09: 37 real tests green (31 persistence + 6 county-isolation), entities carry CountyId + audit fields. Verified-not-rebuilt. Surfaced D-008 (stub tests).

---

## Agent Handoff Protocol
Every handoff uses this — it is how agents keep continuity across sessions.
```md
# Agent Handoff
## Current Task
## Current State
## Files Touched
## What Passed
## What Failed
## Open Risks
## Do Not Touch
## Next Agent     Architect / Builder / Reviewer / QA / Docs
```
