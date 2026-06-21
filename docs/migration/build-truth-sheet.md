# Azure DevOps Build Truth Sheet

This document records the first-pass build and validation truth for the Azure DevOps migration. It is intentionally limited to CI validation and build confidence. It does not define deployment, release promotion, service connections, or secret store integration.

## Toolchain

- Node.js: 20.x
- pnpm: 9.0.0
- .NET SDK: 8.0.x
- Hosted agent: Microsoft-hosted Ubuntu (`ubuntu-latest`)

## Canonical Install Command

```bash
pnpm install --frozen-lockfile
```

## Canonical Core Validation Commands

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

## Canonical Frontend Validation Commands

```bash
pnpm -C frontend run type-check
pnpm -C frontend run test:tier1
pnpm -C frontend run build
```

## Canonical Backend Build Commands

```bash
dotnet restore backend/TerraFusion.sln
dotnet build backend/TerraFusion.sln -c Release --no-restore /warnaserror
```

Backend tests are not included in the first Azure DevOps pass because they were not confirmed during Phase 2 as stable, low-friction, and free of hidden services, secrets, or environment dependencies.

## Generated Source Check

```bash
pnpm run check:generated
```

This command is included in the main build pipeline because `.ts` is the source of truth and generated `.js` files under `os-platform/core/**` must match their TypeScript source.

## Runtime And Stability Estimates

| Command | Runtime | Confidence | Phase 2 decision |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | medium | likely-good | included |
| `pnpm run type-check` | fast | likely-good | included |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | fast | likely-good | included |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | fast | likely-good | included |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | fast | likely-good | included |
| `pnpm -C frontend run type-check` | medium | likely-good | included |
| `pnpm -C frontend run test:tier1` | medium | likely-good | included |
| `dotnet restore backend/TerraFusion.sln` | medium | likely-good | included |
| `dotnet build backend/TerraFusion.sln -c Release --no-restore /warnaserror` | medium/heavy | likely-good | included |
| `pnpm -C frontend run build` | heavy | likely-good | included |
| `pnpm run check:generated` | fast | likely-good | included |
| `dotnet test backend/TerraFusion.sln -c Release --no-build -v:minimal` | heavy | uncertain | deferred |

## Required Environment Variables

The first-pass Azure pipelines define only non-secret toolchain variables:

- `nodeVersion`
- `pnpmVersion`
- `dotnetVersion` in the main build pipeline

No application runtime environment variables are required by the first-pass Azure DevOps CI surface.

## Required Secrets

No secrets are required for the Phase 2 Azure DevOps pipelines.

GitHub workflow discovery found many legacy secrets used by existing GitHub Actions, including Azure, AWS, GCP, deployment, Slack, Snyk, and GitHub tokens. Those are intentionally not migrated in Phase 2 because deployment, release, service connection, and secret store integration are deferred.

## Local Prerequisites

For a local operator or agent to run the same commands, the local environment needs:

- Git
- Node.js compatible with the repository engine range
- pnpm 9.0.0
- .NET SDK 8
- Network access to npm and NuGet package sources unless dependencies are already cached

## Known CI Assumptions

- Azure DevOps will run the YAML files from the repository root.
- The first pass uses Microsoft-hosted Ubuntu only.
- The first pass does not assume Azure DevOps variable groups.
- The first pass does not assume Azure service connections.
- The first pass does not publish build artifacts.
- The first pass does not perform deployment or environment promotion.
- Existing GitHub workflows remain untouched and should be treated as legacy during migration.
