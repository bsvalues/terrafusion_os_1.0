# Azure Pipelines First-Run Guide

This document is the operator runbook for the first manual Azure DevOps activation of the existing TerraFusion pipeline YAML files. It is documentation only. It does not authorize deployment, secrets work, service connections, variable groups, environments, Key Vault, self-hosted agents, or production changes.

## Baseline Context

- Clean worktree path: `C:\Users\bsval\.codex-worktrees\devops-main-baseline`
- Baseline HEAD: `ff812aecc72c4b8b95e0a861ad7bdbee0781cc60`
- Build truth sheet: `docs/migration/build-truth-sheet.md`
- Pipeline YAML files confirmed:
  - `azure-pipelines/pr-validation.yml`
  - `azure-pipelines/build-main.yml`
- PR `#133` live status correction: `MERGED`

## Intended Azure Pipeline Names

- `TerraFusion - PR Validation`
- `TerraFusion - Main Build`

## Pipeline 1: Create PR Validation

1. Open Azure DevOps in the browser.
2. Open the target project and go to `Pipelines`.
3. Choose `New pipeline`.
4. Select the existing repository that contains this baseline.
5. Choose `Existing Azure Pipelines YAML file`.
6. Select `azure-pipelines/pr-validation.yml`.
7. Name the pipeline `TerraFusion - PR Validation`.
8. Save the pipeline without adding stages, secrets, service connections, or variable groups.

## Pipeline 2: Create Main Build

1. Open `Pipelines`.
2. Choose `New pipeline`.
3. Select the same repository.
4. Choose `Existing Azure Pipelines YAML file`.
5. Select `azure-pipelines/build-main.yml`.
6. Name the pipeline `TerraFusion - Main Build`.
7. Save the pipeline without adding stages, secrets, service connections, variable groups, or environments.

## Manual First Run

Run each pipeline manually once from the browser before changing branch policy.

### Manual Run: PR Validation

1. Open `TerraFusion - PR Validation`.
2. Choose `Run pipeline`.
3. Select the branch intended for PR validation testing.
4. Start the run.
5. Record whether the run completes or fails.

### Manual Run: Main Build

1. Open `TerraFusion - Main Build`.
2. Choose `Run pipeline`.
3. Select `main` or the operator-approved baseline branch used for activation.
4. Start the run.
5. Record whether the run completes or fails.

## Failure Capture Template

Use this exact template for each first-run failure:

```text
Pipeline:
Branch:
Run URL:
Job name:
Step name:
Exact command:
First error line:
First 20-40 lines of output:
Deterministic on rerun? yes/no/unknown
Suspected category:
```

## Failure Categories

- YAML parse / pipeline definition
- tool bootstrap
- monorepo path / working-directory
- Linux portability
- hidden dependency / secret assumption
- generated artifact / build-order
- governance / policy collision

## Allowed First-Run Fixes

- YAML syntax correction
- path correction
- working directory correction
- harmless diagnostics such as `node --version`, `pnpm --version`, `dotnet --info`
- version pin refinement
- documentation clarification

## Prohibited First-Run Fixes

- deployment stages
- service connections
- variable groups
- Key Vault
- secret store integration
- self-hosted agent pivot
- production resources
- GitHub workflow deletion
- repo restructure
- runtime feature changes

## Branch Policy Note

- Do not attach PR validation as required until it has run at least once.
- Once the first-run behavior is understood, attach only `TerraFusion - PR Validation` to `main`.
- Do not require `TerraFusion - Main Build` for PR completion in the first pass.

## Operator Evidence To Return For WO-DEVOPS-003

For each pipeline run, return:

- pipeline name
- branch used
- run URL
- success or failure
- if failure, the completed failure capture template

WO-DEVOPS-003 begins only after the operator provides this evidence.
