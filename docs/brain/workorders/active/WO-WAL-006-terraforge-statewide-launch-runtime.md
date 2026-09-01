# WO-WAL-006 — TerraForge Statewide Launch Runtime

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WAL_001_004_CONTRACTS` |
| Program | Washington Assessor Launch V1 |
| Risk | R4 county-scoped assessor product runtime |
| Terminal condition | `TERRAFORGE_COUNTY_AWARE_TRUST_DISCLOSED_NO_BENTON_FALLBACK_LAUNCH_WORKFLOWS_PROVEN` |

## Objective

Turn the real TerraForge suite runtime into a statewide launch product that uses the correct county context and only exposes valuation capabilities supported by observed county inputs.

## Required outcome

1. Remove/reconcile obsolete June-10 proof-freeze and Benton-demo assumptions from launch paths only where current evidence permits.
2. Eliminate silent/default Benton runtime behavior; county context must be explicit and lawful under WAL-004.
3. Drive TerraForge inputs from WAL public/upload/connected canonical county data rather than county-specific demo constants.
4. Define a machine-readable per-county/per-module input-capability matrix. A module is available only when all required observed inputs and trust constraints are satisfied.
5. Launch useful statewide workflows supported by public data first (for example parcel/sales/comparable/market workflows where actual data exists), while honestly gating cost/income/calibration functions where county-specific characteristics/schedules are missing.
6. Show data trust/source/freshness in the assessor workflow so PUBLIC data cannot be mistaken for county-certified data.
7. Preserve canonical Forge ownership and OS integration from the completed Five-Suite mission.
8. Bind every protected read/action to authenticated county scope and audit/trace identity.
9. Prove same-county results and deliberate cross-county denial; stale county/session state must not reuse prior results.
10. Handle source gaps/degraded data without fabricating values or silently switching datasets.

## Launch workflow proof

Select a finite set of assessor workflows that demonstrates TerraForge's value statewide and exercise them over all 39 public contexts where their required inputs exist. Also prove richer COUNTY_PROVIDED and CONNECTED examples after WAL-002/003. Record capability gaps by county/module rather than blocking the statewide HUB launch.

## Denials

No claim of full TerraForge module coverage in all 39 counties without inputs, no fallback to Benton, no external source writes, no reopening Forge repository ownership, no unrelated suite expansion.

## Continuation

May overlap WAL-005 after WAL-001–004 contracts are stable. WAL-007 owns the integrated 39-county acceptance gate.
