# WO-TUOP-000 — TerraFusion Owner-Usable Product V1 Mission Activation

| Field | Value |
| --- | --- |
| Status | `ACTIVE_ON_PROTECTED_MERGE` |
| Program | TerraFusion Owner-Usable Product V1 |
| Goal | `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Loop | `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Owner authority source | Issue #1589 |
| Base | `cdb20e65338aa1d5eacc1da55f63ecf30e620129` |
| Risk | Governance activation; no product/runtime mutation |
| Terminal condition | `TUOP_V1_MISSION_AUTHORITY_CANONICAL_AND_FIRST_OBSERVATION_CHILD_DEPENDENCY_CLEARED` |

## Objective

Turn the direct owner mission directive recorded in Issue #1589 into canonical executable authority so the lead operator (HERMES) can run the product-recovery loop — observe the launched product, classify defects, derive exact bounded children, repair, merge, redeploy, browser-verify, continue — without a fresh owner relay for each mechanical child.

## Required outcome

1. Add `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` to `.governance/owner-decisions.json`, faithfully preserving Issue #1589 scope, hard walls, WAL coordination rule, child-WO autonomy, lab-deploy/browser-acceptance authorization, and the production gate that remains WAL V1's path.
2. Register `terrafusion-owner-usable-product-v1.md` in `PROGRAM_PLAYBOOK_REGISTER.md`, the active program playbook, and the current queue.
3. Register `WO-TUOP-000` and `WO-TUOP-001` in the canonical work-order registry and goal/loop routing surfaces.
4. Record `WO-TUOP-001` (first live Product Reality Matrix) as the single dependency-cleared first execution.
5. Reconcile `docs/brain/canon/current-release.json` to the active owner decision set: the stale Brain/Cortex Phase 0 active gate and the "statewide interoperability" deferral contradict the ratified 39-county Washington launch decision and this mission; owner decisions outrank Brain canon.
6. Preserve WAL V1 active state, completed Five-Suite terminal state, and every unrelated program exactly.
7. Run governance/WO query/registry validation required by the repository and merge the governance-only activation through protected main.

## Mission-level child policy

After this activation merges, the lead operator may create/refine exact child WOs inside TUOP-V1 without a fresh owner decision when they only decompose Issue #1589 (defects observed on the Product Reality Matrix, and the terminal acceptance proof). Exact repository/path/system reservations, tests, rollback, evidence and independent review remain required. A PR/WO is a synchronization boundary, not a human-return boundary.

## Hard walls

This activation grants no product implementation by itself and may not weaken branch protection, checks, isolation rules, evidence requirements, external-source read-only policy, county-data authorization, Benton production separation, or the WAL V1 production gates.

## Validation

- owner-decision JSON parses and contains the exact TUOP-V1 mission authority;
- work-order registry/query tools resolve all TUOP nodes and dependencies against the schema;
- `current-release.json` parses and its active gate reflects the ratified owner decision set;
- no existing completed or active program changes state;
- exact changed-path review;
- required governance checks pass;
- zero unresolved substantive review threads before merge.

## Continuation

On protected merge, continue automatically into `WO-TUOP-001`. Do not return to the owner merely because activation completed.
