# Azure DevOps Cutover Notes

This migration adds the minimum viable Azure DevOps CI surface for TerraFusion OS. This pass is CI activation only. It does not authorize deployment, release promotion, secret integration, service connections, variable groups, environments, or production behavior.

## Current Baseline

- Clean DevOps baseline worktree: `C:\Users\bsval\.codex-worktrees\devops-main-baseline`
- Baseline HEAD: `ff812aecc72c4b8b95e0a861ad7bdbee0781cc60`
- Live GitHub correction: PR `#133` is `MERGED`
- Build truth refresh completed in WO-DEVOPS-001:
  - `docs/migration/build-truth-sheet.md`

## What Changed

The repository includes two Azure Pipelines definitions intended for first-pass activation:

- `azure-pipelines/pr-validation.yml`
- `azure-pipelines/build-main.yml`

The repository also includes migration documentation:

- `docs/migration/azure-devops-cutover.md`
- `docs/migration/build-truth-sheet.md`
- `docs/migration/azure-pipelines-first-run.md`

## What Stayed The Same

- `main` remains the protected default branch.
- Existing GitHub workflows remain in place and are historical reference only for this migration.
- Existing build and test commands remain the source of truth until Azure first runs prove otherwise.
- No deployment behavior changed.
- No Azure resources were provisioned by this work order.
- No service connections, variable groups, Key Vault integrations, or secret stores were added.
- No monorepo restructuring occurred.
- No runtime code changed.

## Azure First-Pass Scope

The current Azure pass is intentionally limited to CI activation:

- create the PR validation pipeline in the Azure DevOps browser
- create the main build pipeline in the Azure DevOps browser
- run each pipeline manually once
- capture first-run output for later triage

The current Azure pass explicitly excludes:

- deployment stages
- release pipelines
- production environments
- service connections
- variable groups
- Key Vault
- secret store integration
- self-hosted agent pivots
- runtime feature changes

## PR Flow In Azure DevOps

First-pass PR validation uses `azure-pipelines/pr-validation.yml`.

The PR validation pipeline is intentionally limited to:

- Node 20 and pnpm 9 setup
- dependency installation with `pnpm install --frozen-lockfile`
- core TypeScript validation
- phase 8.3, 8.5, and 8.6 core tool tests
- frontend type checking
- frontend Tier-1 validation

Intended Azure DevOps pipeline name:

- `TerraFusion - PR Validation`

## Main Branch Build Flow

First-pass main build validation uses `azure-pipelines/build-main.yml`.

The main build pipeline is intentionally limited to:

- backend restore
- backend build with warnings as errors
- frontend build
- generated core JavaScript check

It does not run deployments, publish releases, or promote environments.

Intended Azure DevOps pipeline name:

- `TerraFusion - Main Build`

## Branch Policy Note

- Do not attach PR validation as required until it has run successfully at least once and the failure modes are understood.
- Once understood, attach only `TerraFusion - PR Validation` to `main` as the first-pass required Azure check.
- Do not require `TerraFusion - Main Build` for PR completion in the first pass.

## Deferred Work

The following remain explicitly deferred:

- deployment pipelines
- staging and production release flow
- Azure service connections
- Azure variable groups
- Key Vault and secret store integration
- Azure resource provisioning
- agent pool strategy beyond Microsoft-hosted Ubuntu
- GitHub workflow retirement
- repo cleanup outside migration scope
- backend `.NET` test inclusion in Azure DevOps

Backend tests may be added later only after they are confirmed stable, low-friction, and free of hidden service, secret, or environment dependencies.

## Operator Handoff

The operator should use `docs/migration/azure-pipelines-first-run.md` for the exact browser steps, first-run capture template, allowed fixes, and prohibited fixes for Azure activation.
