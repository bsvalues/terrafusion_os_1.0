# CP-14 Checkpoint Seal

Date: 2026-03-19
Phase: CP-14
Gate: G3 + G4
Status: open — implementation pending

## Seal Decision

- Entry criteria met: partial
- Gate result: open
- Next entry condition: G3 + G4 both green → Phase 2 (CP-15) opens.
- Blockers:
  - PropertiesController: optional `countyId` and missing claim/request mismatch enforcement (400/403 contract not met)
  - DaisController: missing-claim path returns 403 `Forbid()` instead of required 401 fail-closed behavior
  - MarketplaceController: missing class-level `[Authorize]`; stub metrics helpers still present
  - PACS live integration tests: blocked on environment (S0-B/C)

## Audit Note (2026-03-19)

- Controller audit completed against current code in `backend/src/TerraFusion.API/Controllers/*`.
- G3/G4 remain open and require backend writer-lane implementation.
- Line-level evidence and backend patch checklist are captured in:
  - `docs/superpowers/artifacts/cp14/isolation-proof.md`
  - `docs/superpowers/artifacts/cp14/rbac-proof.md`

## Sprint 0 Completed Items

- S0-A: DONE (6 PACS views in SQL file, committed 7e647caad)
- S0-E: DONE (tool count 53→93, manifest v2.0.0 with 93 tools verified)
- S0-F: DONE (deploy-sovereign.sh run, committed 7e647caad)
- SpecLock v1.0.0 amended to declare all 6 views: DONE

## Progress Ledger

| Gate | Status |
|---|---|
| G1 (Truth Gate) | PASS — .governance/workflow/TRUTH_GATE_2026-03-19.md |
| G2 (Production Gate Catalog) | PASS — cp13 catalog confirmed |
| G3 (Tenant Isolation Coverage) | PENDING |
| G4 (RBAC Contract Closure) | PENDING |

## Approvals

| Role | Name | Approval | Timestamp |
|---|---|---|---|
| Platform Security Owner | | pending | |
