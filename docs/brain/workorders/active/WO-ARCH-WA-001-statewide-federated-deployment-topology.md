# WO-ARCH-WA-001 — Washington Statewide Federated Deployment Topology

| Field | Value |
| --- | --- |
| Status | `OWNER_AUTHORIZED_IMPLEMENTATION` |
| Risk | R4 architecture/governance decision; no live resource mutation |
| Owner authority | GitHub Issue #1532, issued directly by the owner on 2026-09-01 |
| Base | `6cfc93907a3153111115ca3468990753ffb8ae6e` |
| Terminal condition | `WASHINGTON_STATEWIDE_FEDERATED_DEPLOYMENT_TOPOLOGY_RATIFIED_IN_CANON` |

## Objective

Resolve the long-standing physical deployment ambiguity for Washington TerraFusion without changing
runtime code, provisioning cloud resources, touching county systems, or inventing a second statewide
program. Ratify the owner-selected deployment topology as a canonical ADR and make it discoverable
from the root canon entry point.

## Decision being ratified

Washington TerraFusion is a **federated statewide multi-tenant platform** by default.

It is **not**:

- one literal statewide physical server;
- 39 unrelated full-stack TerraFusion installations;
- a requirement that every county use the same legacy vendor, network, or hosting substrate.

The statewide platform uses **deployment stamps/cells**. One stamp may serve multiple counties; more
stamps may be added when measured load, blast radius, residency, procurement, operational isolation,
or county-specific requirements justify them.

County production data remains strongly isolated. The default government-data target is a
county-specific operational database boundary (tenant-per-database), with separate secrets,
credentials, Edge identity, storage and audit context, plus fail-closed county authorization inside
the TerraFusion application/runtime.

TerraFusion Edge / TerraFusion Sync remains county-local near legacy systems. External county source
systems remain authoritative and read-only unless a later explicit county adoption/write-back
authorization changes that boundary.

A **Sovereign County** profile remains supported for a county that requires dedicated infrastructure
or on-prem operation. It uses the same TerraFusion product/release contract rather than a county fork.

Cross-county/statewide features are explicit federation capabilities. Shared infrastructure never
implies shared protected data access.

Cloud implementation is subordinate to this architecture. Azure is a first-class target, but AKS,
App Service, Container Apps, VMs, or another supported substrate are implementation choices rather
than the topology decision itself.

The HERMES lab may prove the topology with synthetic/public data. Protected county data is excluded
without separate authority.

## Existing architecture preserved

This decision does not replace the current Washington Assessor Launch V1 product model. It preserves:

- all 39 counties as first-class launch contexts;
- `PUBLIC -> COUNTY_PROVIDED -> CONNECTED` county trust/data modes;
- TerraFusion Sync as ingestion/validation boundary;
- TerraFusion DB as product runtime truth;
- TerraFusion API as the product runtime access layer;
- fail-closed county identity/isolation and no silent Benton fallback;
- external legacy systems as read-only upstream sources until later county adoption authority;
- Counties HUB and county-aware TerraForge as statewide product surfaces.

## Exact write scope

This Work Order authorizes only:

- `docs/adr/ADR-0020-washington-statewide-federated-deployment-topology.md`
- `docs/brain/workorders/active/WO-ARCH-WA-001-statewide-federated-deployment-topology.md`
- `CANON_INDEX.md`

No other repository path is authorized by this Work Order.

## Explicit denials

- no Azure, AKS, App Service, Container Apps, VM, VNet, database, DNS, certificate, billing, or other
  live resource creation/change;
- no production deployment;
- no PACS/CAMA/GIS/county SQL connection or credential use;
- no county data movement;
- no runtime, backend, frontend, Sync, schema, migration, package or CI behavior change;
- no decision that one specific Azure service is mandatory;
- no requirement that every county share one stamp;
- no requirement that every county receive a dedicated stamp;
- no cross-county protected-data sharing;
- no new statewide program or duplicate 39-county registry.

## Validation

- ADR text must faithfully implement Issue #1532.
- Root `CANON_INDEX.md` must name the ADR as the controlling statewide physical deployment topology.
- `git diff` scope must remain the exact three-path allowlist above.
- Markdown must remain syntactically valid and free of secret/protected data.
- Normal protected-branch PR and required checks remain mandatory.

## Rollback

Revert the eventual protected merge through a normal protected PR. This Work Order creates no live
resource, data migration, external dependency, or irreversible effect.

## Completion

Complete only when the ADR and root canon reference are on protected `main`. Opening a PR alone does
not satisfy the terminal condition.
