# WO-TUOP-001 — First Live Product Reality Matrix

| Field | Value |
| --- | --- |
| Status | `IN_PROGRESS` — activation merged at `88a4629ea`; matrix v1 recorded at `docs/brain/evidence/WO-TUOP-001-product-reality-matrix-v1.md`; derived child `WO-TUOP-002` registered |
| Program | TerraFusion Owner-Usable Product V1 |
| Goal | `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Loop | `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Owner authority source | Issue #1589 via `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` |
| Risk | R3 — observation, lab-internal launch of an existing candidate, evidence recording; no product/runtime mutation in this WO |
| Terminal condition | `PRODUCT_REALITY_MATRIX_V1_RECORDED_WITH_CLASSIFIED_VERDICTS_AND_DERIVED_CHILDREN` |

## Objective

Produce the first live Product Reality Matrix **from the screen, not from source**, over the current exact release candidate launched inside the personal lab. This is the program's Observe step and the single dependency-cleared first execution of the mission. **This is not a rebuild and not a code review.**

## Required outcome

1. Identify the exact current candidate: deployed revision (git sha / image digest), launch surface, and runtime identity — the browser must be able to prove which candidate it is exercising.
2. Launch/verify the candidate in the lab-internal pre-production runtime (existing self-host stack or the freshest exact candidate build; record which, and why).
3. For every major capability surface — OS desktop/windowing/navigation, Counties HUB, Property Workbench, TerraForge (Cost/Comps/Sales/Income), TerraAtlas, TerraDais, TerraDossier, TerraGPT, TerraCanon, persistence, cross-suite handoff, UX honesty — walk the chain:
   `VISIBLE → OPENS → REAL DATA → OPERATES → WRITES/PERSISTS → RELOADS → HANDS OFF → PASS`
4. Record a verdict per capability using the discipline: `PASS / PARTIAL / SHELL_ONLY / WRONG_SURFACE / HONEST_UNAVAILABLE / MISSING / FAIL`, with the exact observed evidence (screenshot/route/response) and the exact broken stage for every non-PASS.
5. Classify each non-PASS through Cortex discipline: authority resolution → contradiction scan → canon reconciliation. Decide: existing bounded recovery child (dispatch), new exact TUOP child (derive + register), WAL-owned seam (route to WAL coordination rule), or genuine owner authority wall (stop + surface).
6. Persist the matrix as canonical evidence: `docs/brain/evidence/WO-TUOP-001-product-reality-matrix-v1.md` with candidate identity header, per-capability rows, verdicts, evidence pointers, and the derived child list.
7. Register the derived repair children (exact bounded WOs) in the registry with reservations; do not implement them inside this WO.

## Hard walls

No product/runtime code mutation inside this WO. No Benton production access. No external county-system write. No protected county data or credentials. No unsupported capability claims in the matrix — an unobserved stage is recorded unobserved, never assumed. `HONEST_UNAVAILABLE` is a truthful verdict; a shell presented as working is mission failure.

## Validation

- matrix evidence file parses and names the exact candidate identity;
- every capability row carries a verdict from the fixed enum and an evidence pointer;
- every FAIL/PARTIAL/SHELL_ONLY/MISSING row maps to exactly one of: existing child, derived child, WAL-routed, owner wall;
- derived children exist as registered WO records with reservations;
- no product/runtime files changed by this WO.

## Continuation

On completion, the loop continues automatically into the highest-severity dependency-cleared repair child. Do not return to the owner to ask what is next; the matrix is the queue.
