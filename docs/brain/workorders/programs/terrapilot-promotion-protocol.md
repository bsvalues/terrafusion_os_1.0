# TerraPilot Tool Promotion Protocol

**WO:** WO-TERRAPILOT-P2
**Program:** P5 - TerraPilot Tool Maturity
**Date:** 2026-07-02
**Authority:** Work Order Operator doctrine
**Classification:** Protocol. No runtime change, no backend integration, no tool promotion.

## Purpose

TerraPilot must not present manifest registration, contract coverage, or a stub response as live
product capability. This protocol defines the minimum evidence required before a tool can move from
`stub-contract` to `backend-integrated` or `promoted`.

## Maturity States

| State | Meaning | Minimum evidence |
|-------|---------|------------------|
| `declared` | Tool exists in the manifest only. | Manifest entry with risk, write lane, and schema fields. |
| `stub-contract` | Handler exists and returns an honest stub or deterministic contract response. | Handler registration, contract-shaped response, and stub disclosure. |
| `contract-covered` | Contract and integration target are documented, but handler is not proven live. | Request/response contract, owning service, integration target, and verification plan. |
| `backend-integrated` | Handler calls a real backend/API and returns real data. | Handler evidence, backing service, auth model, trace evidence, and live/focused validation. |
| `promoted` | Backend-integrated tool is approved for operator-facing use. | All backend-integrated evidence plus operator approval, date, owner, rollback path, and UI disclosure update. |

Protocol state mapping:

- L0 `Declared` maps to `declared`.
- L1 `Runnable` maps to `stub-contract`.
- L2 `Contract-covered` maps to `contract-covered`.
- L3 `Live-integrated` maps to `backend-integrated`.
- L4 `Promoted` maps to `promoted`.

Tools may not skip states. A tool cannot be marked `backend-integrated` until `contract-covered`
evidence exists, and it cannot be marked `promoted` until `backend-integrated` evidence and operator
approval exist.

## Required Promotion Evidence

Every promotion request must name:

- Current state and target state.
- Tool ID and manifest location.
- Owner and owning service.
- Backing endpoint, service, or data source.
- Integration surface and auth boundary.
- Verification method and exact command/probe.
- TerraTrace/correlation evidence requirement.
- UI/operator disclosure rule.
- Rollback or demotion path.
- Promotion date and approving operator for `promoted`.

## Stop Gates

A tool may not move to `backend-integrated` or `promoted` inside a docs/evidence work order. Stop and
open a separate authorized implementation work order if promotion requires:

- Runtime behavior changes.
- Backend integration or handler rewiring.
- Deployment or service startup changes.
- Secrets, credentials, Key Vault, PACS, county SQL, county data, or live database access.
- Schema migration or data mutation.
- New auth scope or protected data exposure.

## Disclosure Rule

Until a tool is `backend-integrated`, every UI, operator packet, and demo script must describe it as
not live. Acceptable labels include:

- `stub-contract`
- `contract-covered, not live`
- `tool layer in development`

Green manifest validation is not a live-capability claim.

## Completion

WO-TERRAPILOT-P2 is complete when this protocol exists and subsequent P5 evidence uses it as the
promotion gate.
