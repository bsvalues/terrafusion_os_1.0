# CP-15 Workbench Host Proof

Date: 2026-03-19
Phase: Phase 2 — Runtime Completeness / Shell Contract
Gate: G6 (WorkbenchHost Integrity)
Status: PENDING — real tab surface verification required

## Shell Contract Requirements

- `PropertyWorkbench` hosts Forge, Atlas, and Dais as real tab surfaces
- No fake-host fallbacks in any required tab position
- Parcel-scoped work collapses into the Workbench — nothing escapes to standalone routes
- OS features (admin, governance, trace) remain in-shell

## Required Tab Surfaces

| Suite | Tab Slug | Host Required | Status |
|---|---|---|---|
| TerraForge | `forge` | PropertyWorkbench | PENDING verification |
| TerraAtlas | `atlas` | PropertyWorkbench | PENDING verification |
| TerraDais | `dais` | PropertyWorkbench | PENDING verification |
| TerraDossier | `dossier` | PropertyWorkbench | PENDING verification |
| TerraPilot | `pilot` | PropertyWorkbench | PENDING verification |

## Canonical Workbench Route

Route: `/property/:parcelId` with tabs: `summary|forge|atlas|dais|dossier|pilot`

Each tab must:
1. Render inside PropertyWorkbench (not as standalone page)
2. Pass parcelId context into the hosted suite surface
3. Show real data from the suite backend — no hardcoded fallbacks without DemoDataBanner
4. Not escape parcel scope to OS-level standalone routes

## Integration Test Evidence

Test: `SystemIntegrationTests` — 29 currently failing against live staging API
Command: `dotnet test --filter SystemIntegrationTests`
Status: NOT RUN (requires live staging environment)

Test: `r1-demo-proof.mjs` — run against staging
Status: NOT RUN (requires live staging environment)

## Pass Condition (G6)

All 5 required tab surfaces host real behavior inside PropertyWorkbench.
No placeholder `<div>Coming soon</div>` or equivalent.
Zero stub API responses (hardcoded JSON without real service call).
