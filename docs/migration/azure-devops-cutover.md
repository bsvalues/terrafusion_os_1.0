# Azure DevOps Cutover Notes

This migration adds the minimum viable Azure DevOps CI surface for TerraFusion OS. It does not restructure the monorepo, rename folders, split repositories, or change application logic.

## What Changed

The repository now includes two Azure Pipelines definitions:

- `azure-pipelines/pr-validation.yml`
- `azure-pipelines/build-main.yml`

The repository also includes migration documentation:

- `docs/migration/azure-devops-cutover.md`
- `docs/migration/build-truth-sheet.md`

## What Stayed The Same

- `main` remains the protected default branch.
- `master` remains untouched.
- Existing GitHub workflows remain in place.
- Existing build and test commands remain the source of truth.
- No deployment behavior changed.
- No Azure resources were provisioned.
- No service connections, variable groups, or secret store integrations were added.
- No monorepo restructuring occurred.

## PR Flow In Azure DevOps

First-pass PR validation should use `azure-pipelines/pr-validation.yml`.

The PR validation pipeline is intentionally limited to:

- Node 20 and pnpm 9 setup
- dependency installation with `pnpm install --frozen-lockfile`
- core TypeScript validation
- phase 8.3, 8.5, and 8.6 core tool tests
- frontend type checking
- frontend Tier-1 validation

Azure DevOps branch policy should be configured in the Azure DevOps web UI to require this pipeline for pull requests into `main`.

## Main Branch Build Flow

First-pass main branch build validation should use `azure-pipelines/build-main.yml`.

The main branch build pipeline is intentionally limited to:

- backend restore
- backend build with warnings as errors
- frontend build
- generated core JavaScript check

It does not run deployments, publish releases, or promote environments.

## Deferred Work

The following are explicitly deferred:

- deployment pipelines
- staging and production release flow
- Azure service connections
- Azure variable groups
- secret store integration
- Azure resource provisioning
- agent pool strategy beyond Microsoft-hosted Ubuntu
- GitHub workflow retirement
- deleting or modifying `master`
- repository cleanup outside migration scope
- backend `.NET` test inclusion in Azure DevOps

Backend tests may be added later only after they are confirmed stable, low-friction, and free of hidden service, secret, or environment dependencies.

## Manual Azure DevOps Web UI Configuration

The human operator still needs to configure Azure DevOps manually:

- Create or select the Azure DevOps project `TerraFusion`.
- Confirm the Azure Repo `terrafusion-monorepo` is connected.
- Confirm `main` is the default branch.
- Create a pipeline from `azure-pipelines/pr-validation.yml`.
- Create a pipeline from `azure-pipelines/build-main.yml`.
- Add a branch policy on `main` requiring the PR validation pipeline.
- Decide whether the main build pipeline should run automatically on pushes to `main`.
- Leave `master` untouched during this migration phase.

No service connections or secrets are required for the Phase 2 pipeline files.
