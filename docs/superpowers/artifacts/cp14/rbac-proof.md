# CP-14 RBAC Proof

Date: 2026-03-19
Phase: Phase 1 — Security & Isolation Closure
Gate: G4 (RBAC Contract Closure)
Status: FAILED AUDIT — controller-layer RBAC incomplete

## RBAC Requirements

All privileged actions require valid claim + policy allowance per TerraFusion OS permission model.

### Two-Layer Authorization Model

1. RBAC claims (what user CAN do)
2. Tool allowlists (which tools ENABLED for county/license/policy)

### Risk Tiers

| Risk Level | Requirement |
|---|---|
| read_only | valid JWT |
| write_low | valid JWT + role claim |
| write_high | valid JWT + role claim + confirmation + reason |
| irreversible | valid JWT + role claim + confirmation + reason + supervisor |

## Required Closure Items

- `[Authorize]` attribute on all controller classes that handle mutations
- JWT `countyId` claim extracted and matched at controller entry — not in service layer only
- All write_high tool invocations (from TerraPilot) require `HumanApproverId` — `HITL_DRAFTER` sealed at `e78d1262c`
- MarketplaceController stub endpoints removed — `[Authorize]` added at class level

## Phase 20 Governance Baseline (already confirmed green)

| Check | Result |
|---|---|
| phase83-tools (duplicate definition scan) | 56/56 |
| phase85-tools (office scope policy) | 22/22 |
| phase86-toolrunner (canonical execution) | 9/9 |
| HITL drafter | sealed e78d1262c |

## Evidence Fields (current state)

| Check | Status |
|---|---|
| All controllers with mutations carry `[Authorize]` | FAIL (`MarketplaceController` missing class `[Authorize]`) |
| JWT countyId extraction mandatory | FAIL (`PropertiesController` supports optional countyId query) |
| write_high confirmation/reason enforced by ToolRunner | PASS (phase83 tool-layer enforcement confirmed) |
| Supervisor required for irreversible | PASS (phase83 tool-layer enforcement confirmed) |
| MarketplaceController stubs removed | FAIL (`GetDownloadCount`, `GetRating`, `GetRatingCount` still present) |

## Line-Level RBAC Findings

- `MarketplaceController` lacks class-level `[Authorize]` (controller declaration starts at line 12 after `[ApiController]`/`[Route]` only)
- synthetic governance-unsafe metrics still injected in plugin payload mapping (lines 42-44)
- stub helper methods still active (lines 150, 160, 170)
- write endpoints exposed at controller surface:
	- `SubmitPlugin` (line 191)
	- `PublishPlugin` (line 215)
- `PropertiesController` and `DaisController` are `[Authorize]`, but county-claim enforcement is inconsistent at endpoint boundary (see CP-14 isolation proof)

## Pass Condition (G4)

All privileged actions require valid claim + policy allowance.
Phase 83 tool-layer enforcement: CONFIRMED (56/56 — write_high and irreversible risk levels verified).
Controller-layer RBAC: NOT YET COMPLIANT. Backend writer lane must close controller gaps before G4 can pass.

## Implementation Acceptance Checks (backend lane)

- all privileged controller classes include `[Authorize]`
- submit/publish marketplace actions are policy-gated to internal admin claims
- county claim extraction is required at controller boundary for county-scoped endpoints
- negative-path integration tests exist for:
	- unauthenticated => 401
	- missing county claim => 401
	- county mismatch => 403
