# TerraFusion OS Repo Map

This is the practical map of the repository, not a historical architecture
manifest.

## Top-Level Layout

| Path | Purpose |
| --- | --- |
| `.github/` | workflows, issue templates, branch-protection and maintainer docs |
| `backend/` | .NET 8 backend services and solution assets |
| `frontend/` | frontend workspace, including OS Shell |
| `docs/` | repo-hosted documentation hub and wiki substitute |
| `ops/` | operational tooling, rollout, recovery, security, observability |
| `os-platform/` | platform internals, including governed `core/` surface |
| `tools/` | CLIs, generators, registry tooling, audits |
| `tests/` | root-level test infrastructure |
| `config/` | shared config and environment examples |
| `compose/` | compose docs and related resources |
| `docker/` | additional Docker assets |
| `database/` | schema and DB-related assets |
| `packages/` | shared package workspaces |
| `scripts/` | utility scripts and governance helpers |
| `grafana/` | Grafana dashboards and provisioning assets |
| `golden/` | golden corpus/reference data |
| `QUARANTINE/` | preserved historical material, not active source |

## High-Signal Operational Paths

- Release truth: [os-platform/core/pilot/ops/hostinger-control-plane.md](./os-platform/core/pilot/ops/hostinger-control-plane.md)
- GitHub automation: [.github/README.md](./.github/README.md)
- Contributor workflow: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Docs hub: [docs/README.md](./docs/README.md)
- Wiki home: [docs/TERRAFUSION_WIKI.md](./docs/TERRAFUSION_WIKI.md)

## TerraCanon Surfaces

Use `TerraCanon` as the canonical name. `TerraCannon` is not the standard repo
term.

- CLI and diagnostics: [tools/canon/](./tools/canon/)
- governed core canon surface: [os-platform/core/canon/](./os-platform/core/canon/)
- OS Shell canon workspace: [frontend/apps/os-shell/src/canon/](./frontend/apps/os-shell/src/canon/)
- canon landing page: [frontend/apps/os-shell/src/pages/CanonHome.tsx](./frontend/apps/os-shell/src/pages/CanonHome.tsx)
- strategy and scope docs: [docs/TerraCanon/](./docs/TerraCanon/)

## Governed Surface

The protected core governance edit surface is defined in [AGENTS.md](./AGENTS.md).
In practice, the most sensitive in-repo areas are:

- `os-platform/core/pilot/**`
- `os-platform/core/types/**`
- `tools/registry/**`
- `tsconfig.core.json`
- `package.json`
- `.github/workflows/**`

## Useful Local Commands

```bash
pnpm install
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm run governance:check
pnpm run dev:os:shell
pnpm run backend:dev
```

## Current Deployment Shape

- default branch: `main`
- repo visibility: private
- staging and production currently target the same Hostinger box
- release/rollback workflows live under `.github/workflows/`
- current package and deploy contract is documented in the Hostinger control-plane runbook

## Quarantine Rule

`QUARANTINE/` is preserved history. Do not silently move content back into the
active tree. If something must return, do it deliberately through a reviewed PR.
