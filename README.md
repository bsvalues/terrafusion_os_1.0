# TerraFusion OS 1.0

TerraFusion OS is the private coordination repository for the TerraFusion
government property-assessment platform. It carries the governance spine,
deployment workflows, top-level build/test entrypoints, and the backend/frontend
workspaces used to operate the system.

## Current Status

Status below is current as of 2026-03-11.

| Area | Status |
| --- | --- |
| Repository visibility | Private |
| Default branch | `main` |
| Issues | Enabled |
| Discussions | Disabled |
| Wiki | Disabled |
| Staging release lane | Proven on live infrastructure |
| Production release lane | Pending final proof sequence |

Current authoritative deployment targets:
- Staging: `https://staging.terrafusionmarket.com`
- Production: `https://terrafusionmarket.com`

Current release proof baselines:
- Release candidate: `864d651a8b49ec1b2dc2cbca137091dbc1c3b29b`
- Engineering baseline: `24531f37a9ea785a99c1b7e4e1dd70c294af1a0c`

## What Lives Here

- `backend/`: .NET 8 solution and API/runtime services
- `frontend/`: frontend workspace, including OS Shell
- `os-platform/core/`: governed core pilot/types/test surface
- `tools/`: shared tooling, registries, developer utilities
- `.github/workflows/`: CI, governance gates, release/rollback automation
- `ops/` and `os-platform/core/pilot/ops/`: operational runbooks and control-plane truth

## TerraCanon

`TerraCanon` is the repo's canonical name for the truth/governance/operator
surface. It spans the command tooling, governed canon modules, and the canon UI
surfaces rather than living in one file.

Start here:

- [docs/TERRAFUSION_WIKI.md](./docs/TERRAFUSION_WIKI.md)
- [docs/TerraCanon/PILLAR_MAPPING.md](./docs/TerraCanon/PILLAR_MAPPING.md)
- [tools/canon/](./tools/canon/)
- [os-platform/core/canon/](./os-platform/core/canon/)
- [frontend/apps/os-shell/src/canon/](./frontend/apps/os-shell/src/canon/)

## Getting Started

### Prerequisites

- Git
- Node.js 20+
- `pnpm`
- .NET 8 SDK

### Bootstrap

```bash
git clone https://github.com/bsvalues/terrafusion_os_1.0.git
cd terrafusion_os_1.0
pnpm install
dotnet restore TerraFusion.sln
```

### Common Local Commands

```bash
pnpm run dev:os:shell
pnpm run backend:dev
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
pnpm run governance:check
```

Notes:
- Secrets do not belong in the repository. Use GitHub environment secrets,
  VPS-local env files, or your secure vault.
- Several tracked files were sanitized during the 2026-03-11 exposure response.
  Treat placeholders as nonfunctional until replaced out of band.

## Governance and Pull Requests

All changes land through pull requests into `main`. Branch protection is
configured around these required checks:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

Local minimum for governance-surface edits:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Recommended full local gate for governed/core changes:

```bash
pnpm run governance:check
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the actual PR flow and evidence
expectations.

## Deployment and Operations

The release lane currently targets a single Hostinger box shared by staging and
production. Current operational truth, remediation status, and live deployment
sequence are tracked in:

- [hostinger-control-plane.md](./os-platform/core/pilot/ops/hostinger-control-plane.md)

Important current deployment notes:
- Staging proof sequence is complete.
- Production proof is still blocked by environment and key rotation work.
- GHCR publishing/pull now uses internal package names wired through the
  workflow set.

## Key Documents

- [CONTRIBUTING.md](./CONTRIBUTING.md): contributor workflow and PR rules
- [AGENTS.md](./AGENTS.md): agent operating rules and governed edit surface
- [SUSTAINMENT.md](./SUSTAINMENT.md): sustainment and workflow troubleshooting
- [SEALED.md](./SEALED.md): Seal Gate context
- [docs/TERRAFUSION_WIKI.md](./docs/TERRAFUSION_WIKI.md): repo-hosted wiki home
- [docs/README.md](./docs/README.md): documentation hub
- [.github/README.md](./.github/README.md): GitHub automation and templates
- [hostinger-control-plane.md](./os-platform/core/pilot/ops/hostinger-control-plane.md): deploy truth surface

## License

This repository is proprietary. See [LICENSE](./LICENSE).
