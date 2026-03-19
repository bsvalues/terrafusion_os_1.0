# CP-14 RBAC Proof

Date: 2026-03-19
Phase: Phase 1 — Security & Isolation Closure
Gate: G4 (RBAC Contract Closure)
Status: PENDING IMPLEMENTATION

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

## Evidence Fields (to fill after implementation)

| Check | Status |
|---|---|
| All controllers with mutations carry `[Authorize]` | PENDING |
| JWT countyId extraction mandatory | PENDING |
| write_high confirmation/reason enforced by ToolRunner | PENDING (phase83 covers tool layer, controller layer pending) |
| Supervisor required for irreversible | PENDING |
| MarketplaceController stubs removed | PENDING |

## Pass Condition (G4)

All privileged actions require valid claim + policy allowance.
Phase 83 tool-layer enforcement: CONFIRMED (56/56 — write_high and irreversible risk levels verified).
Controller-layer RBAC: PENDING implementation by backend writer lane.
