# TerraFusion Canon Entry Point

This root index identifies the controlling semantic authority and subordinates specialized registers.
An authoritative title, generated digest, discovery order, or nested index does not create an
independent authority hierarchy.

## Authority Precedence

1. TerraFusion Constitution (`docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md`).
2. Active ratified owner decisions (`.governance/owner-decisions.json`).
3. Canonical Brain and root governance, including root `AGENTS.md` and ratified governance ADRs.
4. Active program and Work Order authority inside its recorded scope and duration.
5. Directory-local restrictions, which may narrow but never broaden authority.
6. Active playbooks and runbooks.
7. Existing implementation patterns.
8. Agent judgment.

[`ADR-EXEC-001`](docs/adr/ADR-EXEC-001-governance-authority-hierarchy.md) defines the complete
conflict-resolution semantics and mechanical-enforcement boundary.

## Ratified Architecture Decisions

- [`ADR-0016`](docs/adr/ADR-0016-washington-statewide-federated-deployment-topology.md) is the
  controlling physical deployment topology for Washington TerraFusion: federated statewide
  multi-tenancy by default, scalable deployment stamps/cells, strong county-specific data and
  identity isolation, county-local TerraFusion Edge/Sync for connected legacy systems, and a
  supported Sovereign County deployment profile. A later owner-ratified ADR is required to
  supersede this topology.

## Subordinate Registers

- [`PATH_CANON_REGISTER.md`](PATH_CANON_REGISTER.md) is the repository-identity register for
  cross-repository dispatch. A repository name alone never establishes path or remote identity.
- [`docs/brain/workorders/CANON_INDEX.md`](docs/brain/workorders/CANON_INDEX.md) is the subordinate
  Work Order governance register. It records controlling documents but cannot redefine this root
  precedence.
- [`docs/brain/canon/source-priority.json`](docs/brain/canon/source-priority.json) is source-discovery
  order only. It is not authority precedence.
- Generated wiki pages and canon digests explain or project governed sources; they do not outrank the
  sources or create a second hierarchy.

## Scheduling And Collision Control

- [`docs/branching/WORKORDER_PR_BOUNDARY.md`](docs/branching/WORKORDER_PR_BOUNDARY.md) preserves one
  Work Order per PR while permitting dependency-cleared, reservation-safe parallel execution.
- [`AGENT_OPERATING_MODEL.md`](AGENT_OPERATING_MODEL.md) is a superseded Phase 33A snapshot except for
  its preserved no-colliding-builders invariant.
