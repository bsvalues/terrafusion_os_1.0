# TerraFusion Documentation Hub

This `docs/` tree is the repository-hosted documentation surface for
TerraFusion OS. GitHub Wiki is currently disabled on the repository, so this
directory is the effective wiki and docs home.

## Start Here

If you only open one page, open:

- [TERRAFUSION_WIKI.md](./TERRAFUSION_WIKI.md)

That page is the curated index for operators, contributors, and maintainers.

## Current High-Signal Docs

### Repository and Governance

- [../README.md](../README.md): repo overview and current status
- [../CONTRIBUTING.md](../CONTRIBUTING.md): PR flow and verification rules
- [../AGENTS.md](../AGENTS.md): governed edit surface and agent constraints
- [../SUSTAINMENT.md](../SUSTAINMENT.md): sustainment and workflow troubleshooting

### Deployment and Operations

- [../os-platform/core/pilot/ops/hostinger-control-plane.md](../os-platform/core/pilot/ops/hostinger-control-plane.md):
  current staging/production truth, release lane status, blockers
- [evidence/README.md](./evidence/README.md): evidence artifact conventions
- [ci/README.md](./ci/README.md): CI-focused documentation entrypoint

### System Areas

- [backend/README.md](./backend/README.md): backend docs entrypoint
- [frontend/README.md](./frontend/README.md): frontend docs entrypoint
- [testing/README.md](./testing/README.md): testing docs entrypoint
- [ARCHITECTURE.md](./ARCHITECTURE.md): top-level architecture narrative
- [TerraCanon/](./TerraCanon/): TerraCanon strategy, charter, and implementation mapping

### TerraCanon Entry Points

If you are trying to understand the canonical truth or operator-facing surfaces,
start with:

- [TERRAFUSION_WIKI.md](./TERRAFUSION_WIKI.md): practical TerraCanon overview
- [TerraCanon/PILLAR_MAPPING.md](./TerraCanon/PILLAR_MAPPING.md): concrete mapping to codebase surfaces
- [../tools/canon/](../tools/canon/): TerraCanon CLI and diagnostics
- [../os-platform/core/canon/](../os-platform/core/canon/): governed canon surface
- [../frontend/apps/os-shell/src/canon/](../frontend/apps/os-shell/src/canon/): frontend canon workspace

## Documentation Rules

- Prefer updating existing hub docs rather than creating one-off top-level
  status docs.
- If workflow or deployment behavior changes, update the matching runbook in the
  same PR.
- If a document is historical, mark it clearly instead of leaving it looking
  current.
- Never store secrets or live credentials in documentation.

## Recommended Documentation Flow

- New contributor: [../README.md](../README.md) ->
  [../CONTRIBUTING.md](../CONTRIBUTING.md)
- GitHub maintainer: [../.github/README.md](../.github/README.md) ->
  [../.github/QUICK_START.md](../.github/QUICK_START.md)
- Release/operator: [../os-platform/core/pilot/ops/hostinger-control-plane.md](../os-platform/core/pilot/ops/hostinger-control-plane.md)
- Evidence review: [evidence/README.md](./evidence/README.md)

## Known State

As of 2026-03-11:

- staging proof is complete
- production proof is still pending
- GitHub Wiki is disabled
- this `docs/` tree is the canonical in-repo documentation surface
