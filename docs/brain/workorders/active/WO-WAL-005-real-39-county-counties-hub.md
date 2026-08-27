# WO-WAL-005 — Real 39-County Counties HUB

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WAL_001_004_CONTRACTS` |
| Program | Washington Assessor Launch V1 |
| Risk | R4 assessor-facing control-plane runtime product |
| Terminal condition | `COUNTIES_HUB_ALL_39_REAL_CONTROL_PLANE_PUBLIC_UPLOAD_CONNECTED` |

## Objective

Replace the unavailable guardrail with the real Washington Counties HUB: all 39 counties, real data/control-plane state, and the path from public baseline to county-provided data to read-only Sync.

## Required outcome

1. Add the canonical `/counties` route and entry point in the OS shell without reviving unrelated historical UI.
2. Render all 39 canonical counties from governed runtime/control-plane data, not a duplicated hard-coded readiness list.
3. For each county show at least: public baseline status, source/provenance, freshness, landed/runtime evidence, upload state, Sync connection state, trust tier and TerraForge capability/readiness.
4. Provide actions appropriate to real state:
   - `Use Public Data`
   - `Upload County Data`
   - `Connect TerraFusion Sync`
   - `Enter TerraFusion` / `Launch TerraForge` when the selected capability's prerequisites are met.
5. County selection is navigation/context, not authority. Protected operations remain bound to authenticated county identity under WAL-004.
6. Public mode clearly labels data as public/TerraFusion-acquired rather than county-certified.
7. Upload/Sync flows show real progress, errors, provenance and remediation status from WAL-002/003.
8. Never display seeded readiness percentages, parcel totals, migration counts, or connection claims as live truth.
9. Surface explicit unavailable/source-gap states without making a county disappear from the statewide product.
10. Support usable responsive keyboard/screen-reader flows and browser-level error recovery sufficient for conference/production use.

## Browser proof

Exercise every county option and verify county identity, displayed source/trust state and route persistence. Execute full public, upload and connected journeys against representative states. Prove stale county state does not bleed across navigation/session changes.

## Denials

No permission grant from county picker, no hard-coded Benton runtime state, no blind merge of closed PR #1461, no fake onboarding completion, no external source writes.

## Continuation

May overlap with WAL-006 once WAL-001–004 contracts are stable. Completion contributes to WAL-007 but does not authorize production by itself.
