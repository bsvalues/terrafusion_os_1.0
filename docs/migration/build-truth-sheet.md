# Azure DevOps Build Truth Sheet

This document is the current build-command truth for the Azure DevOps first pass. It is intentionally limited to validated command sources and migration planning. It does not authorize deployment, release promotion, secrets work, service connections, county runtime movement, PACS access, or production Kubernetes.

## Current DevOps Baseline

- Clean worktree path: `C:\Users\bsval\.codex-worktrees\devops-main-baseline`
- Baseline HEAD: `ff812aecc72c4b8b95e0a861ad7bdbee0781cc60`
- Source baseline: `origin/main`
- Azure pipeline files present:
  - `azure-pipelines/pr-validation.yml`
  - `azure-pipelines/build-main.yml`
- GitHub workflows count observed in this baseline: `102`
- Live GitHub correction: PR `#133` is `MERGED` and must not be treated as parked draft state

## Toolchain Truth

- Node.js: `20.x`
- pnpm: `9.0.0`
- .NET SDK: `8.0.x`
- Azure hosted runner target: `ubuntu-latest`
- Backend solution entrypoint: `backend/TerraFusion.sln`
- Frontend workspace entrypoint: `frontend/package.json`

## Command Matrix

| Command | Purpose | Source file(s) | Runtime | Confidence | Requires secrets | Requires external services | PR validation | Main build | Deferred / release-only | Notes / risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | Install Node dependencies deterministically from the repo root | `azure-pipelines/pr-validation.yml`, `azure-pipelines/build-main.yml`, `.github/workflows/ci.yml` | medium | likely-good | no | yes | yes | yes | no | Requires package registry access unless cached. Referenced repeatedly, but not executed in this WO. |
| `pnpm run type-check` | Validate core TypeScript boundary | `package.json`, `azure-pipelines/pr-validation.yml` | fast | likely-good | no | no | yes | no | no | Matches the governance-required core boundary command surface. |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | Core tool regression gate | `AGENTS.md`, `azure-pipelines/pr-validation.yml`, `package.json` | fast | likely-good | no | no | yes | no | no | Explicit required gate in repo governance. |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | Additional core tools gate | `azure-pipelines/pr-validation.yml`, `package.json` | fast | likely-good | no | no | yes | no | no | Present in current Azure PR validation YAML, but not in root AGENTS required-gates section. |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | Toolrunner regression gate | `azure-pipelines/pr-validation.yml`, `package.json` | fast | likely-good | no | no | yes | no | no | Referenced in current Azure PR validation YAML and composite governance script. |
| `pnpm -C frontend run type-check` | Validate frontend TypeScript | `frontend/package.json`, `azure-pipelines/pr-validation.yml` | medium | likely-good | no | no | yes | no | no | Frontend-local command used directly by Azure PR validation. |
| `pnpm -C frontend run test:tier1` | Run Tier-1 frontend harness subset | `frontend/package.json`, `azure-pipelines/pr-validation.yml`, `.github/workflows/tier1-ui-harness.yml` | medium | likely-good | no | no | yes | no | no | Historical GitHub reference shows this as a branch-protection-oriented UI gate. |
| `dotnet restore backend/TerraFusion.sln` | Restore backend solution dependencies | `azure-pipelines/build-main.yml`, `.github/workflows/build-validation.yml`, `.github/workflows/ci.yml` | medium | likely-good | no | yes | no | yes | no | Requires NuGet access unless cached. |
| `dotnet build backend/TerraFusion.sln -c Release --no-restore /warnaserror` | Backend release build with warning gate | `azure-pipelines/build-main.yml` | medium-heavy | likely-good | no | no | no | yes | no | Current Azure main-build contract uses `/warnaserror`. |
| `pnpm -C frontend run build` | Build frontend artifacts | `frontend/package.json`, `azure-pipelines/build-main.yml`, `.github/workflows/ci.yml` | heavy | likely-good | no | no | no | yes | no | Frontend package defines this as `tsc --noEmit && vite build`. |
| `pnpm run check:generated` | Verify generated JS matches TS source of truth | `package.json`, `azure-pipelines/build-main.yml`, `AGENTS.md` | fast | likely-good | no | no | no | yes | no | Required because `os-platform/core/**` generated `.js` must match `.ts`. |
| `pnpm run governance:check` | Composite local governance check | `package.json` | medium | likely-good | no | no | no | no | yes | Useful local operator shortcut, but not currently wired into Azure first pass. |
| `dotnet test "$TEST_TARGET" -c Release --no-build -v:minimal --blame-hang-timeout 8m --blame-hang-dump-type none` | Canonical backend test run via reusable workflow | `.github/workflows/dotnet-test.yml` | heavy | uncertain | no | yes | no | no | yes | Uses a Postgres service container and explicit connection string in GitHub Actions. Not yet adopted in Azure first pass. |
| `cd frontend && npx vitest run --reporter=verbose --reporter=json --outputFile=vitest-results.json` | Full frontend suite merge gate | `.github/workflows/ci.yml` | heavy | uncertain | no | no | no | no | yes | GitHub merge gate exists, but Azure parity is not yet established. |
| `playwright test tests/integration --config=tests/playwright.config.ts` | Integration browser tests | `package.json` | heavy | uncertain | no | yes | no | no | yes | Browser/runtime dependencies make this a poor Azure first-pass candidate. |
| `playwright test tests/e2e --config=tests/playwright.config.ts` | End-to-end browser tests | `package.json` | heavy | uncertain | no | yes | no | no | yes | Deferred until first-pass Azure build truth is stable. |
| `docker build -f backend/Dockerfile.API ...`, `docker build -f frontend/Dockerfile ...` | Container image builds | `.github/workflows/ci.yml` | heavy | uncertain | no | yes | no | no | yes | Docker presence does not authorize Docker adoption in Azure first pass. |
| `dotnet publish backend/src/TerraFusion.API/TerraFusion.API.csproj -c Release -o publish` | Publish backend deployment artifact | `package.json`, `.github/workflows/ci.yml`, `.github/workflows/ci-cd-main.yml` | heavy | uncertain | no | no | no | no | yes | Publish/package is a later-stage build concern, not current Azure activation scope. |

## PR Validation Command Set

These are the commands currently wired in `azure-pipelines/pr-validation.yml` and suitable for the Azure first pass:

1. `pnpm install --frozen-lockfile`
2. `pnpm run type-check`
3. `node --test os-platform/core/tests/phase83-tools.test.mjs`
4. `node --test os-platform/core/tests/phase85-tools.test.mjs`
5. `node --test os-platform/core/tests/phase86-toolrunner.test.mjs`
6. `pnpm -C frontend run type-check`
7. `pnpm -C frontend run test:tier1`

## Main Build Command Set

These are the commands currently wired in `azure-pipelines/build-main.yml`:

1. `dotnet restore backend/TerraFusion.sln`
2. `dotnet build backend/TerraFusion.sln -c Release --no-restore /warnaserror`
3. `pnpm install --frozen-lockfile`
4. `pnpm -C frontend run build`
5. `pnpm run check:generated`

## Local Developer Command Set

These commands are present in the local package surfaces and are reasonable for local/operator use when prerequisites already exist:

1. `pnpm run type-check`
2. `pnpm run governance:check`
3. `pnpm -C frontend run type-check`
4. `pnpm -C frontend run test:tier1`
5. `pnpm -C frontend run build`
6. `dotnet restore backend/TerraFusion.sln`
7. `dotnet build backend/TerraFusion.sln -c Release --no-restore /warnaserror`
8. `pnpm run check:generated`

## Deferred Release / Deployment Commands

These commands exist in current GitHub workflows or package scripts but are intentionally not part of Azure first-pass activation:

1. `dotnet test ... --no-build ...`
2. `cd frontend && npx vitest run --reporter=verbose --reporter=json --outputFile=vitest-results.json`
3. `playwright test tests/integration --config=tests/playwright.config.ts`
4. `playwright test tests/e2e --config=tests/playwright.config.ts`
5. `dotnet publish backend/src/TerraFusion.API/TerraFusion.API.csproj -c Release ...`
6. Docker image build commands from `.github/workflows/ci.yml`

## Commands Intentionally Excluded From Azure First Pass

- Reusable GitHub-only backend test flow in `.github/workflows/dotnet-test.yml`
  - Reason: introduces a Postgres service container and test-filter behavior not yet validated in Azure.
- Full Vitest suite merge gate in `.github/workflows/ci.yml`
  - Reason: heavier than the current Azure PR-validation objective.
- Playwright integration and end-to-end suites
  - Reason: browser/runtime setup increases first-run failure surface.
- Docker image builds and packaging steps
  - Reason: container truth belongs to later DevOps work orders.
- Deployment steps, artifact publishing, and release package creation
  - Reason: outside this WO and outside Azure first-pass activation.

## Required Non-Secret Inputs

- `nodeVersion`
- `pnpmVersion`
- `dotnetVersion`

No application secrets are required by the Azure first-pass YAML files inspected in this WO.

## Local Prerequisites

- Git
- Node.js compatible with `>=18.0.0 <25.0.0`
- pnpm `9.0.0`
- .NET SDK `8.0.x`
- Network access to npm and NuGet sources unless already cached

## Do Not Infer

- Green GitHub Actions history does not prove Azure DevOps will be green.
- Presence of `docker/`, `compose/`, or Docker build commands does not authorize Docker rollout in this lane.
- Presence of `backend/helm` does not authorize production Kubernetes or Helm adoption.
- Presence of county/env/config artifacts does not authorize secrets handling, county runtime use, PACS access, or SQL access.
- Reusable GitHub workflows are reference material, not automatic Azure parity.

## Notes On Confidence

This WO did not run installs, builds, or tests. Confidence ratings are therefore based on current source-of-truth references in:

- `azure-pipelines/pr-validation.yml`
- `azure-pipelines/build-main.yml`
- `package.json`
- `frontend/package.json`
- backend solution and project files
- selected `.github/workflows/*.yml` files as historical reference only
