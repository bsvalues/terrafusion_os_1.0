# Azure Branch Policy Proposal

This document records the first-pass Azure DevOps branch policy proposal after the initial pipeline registration and first manual runs completed successfully.

## Current State

- Azure DevOps organization: `https://dev.azure.com/bsvalues`
- Project: `TerraFusion`
- Repository: `terrafusion-monorepo`
- Default branch: `main`
- PR validation pipeline:
  - name: `TerraFusion - PR Validation`
  - pipeline ID: `2`
  - first manual run: build `8`
  - result: `succeeded`
- Main build pipeline:
  - name: `TerraFusion - Main Build`
  - pipeline ID: `1`
  - first manual run: build `9`
  - result: `succeeded`

## Proposal

Attach only the PR validation pipeline as a required Azure branch policy check for pull requests targeting `main`.

Do not attach the main build pipeline as a required PR check in the first pass.

## Required Check To Attach

- `TerraFusion - PR Validation`

## Check To Leave Non-Required

- `TerraFusion - Main Build`

## Rationale

- `TerraFusion - PR Validation` is the pipeline designed for pull request feedback.
- `TerraFusion - Main Build` is broader and better treated as a branch build signal than a first-pass PR gate.
- The first successful manual runs establish that both YAML entrypoints are valid enough to proceed to policy discussion without inferring broader deployment readiness.

## First-Pass Azure UI Recommendation

1. Open Azure DevOps project `TerraFusion`.
2. Navigate to `Repos` -> `Branches`.
3. Open branch policy settings for `main`.
4. Add a build validation policy for `TerraFusion - PR Validation`.
5. Keep `TerraFusion - Main Build` out of required PR validation for this phase.
6. Save the policy only after operator review of the successful first-run evidence.

## Explicit Non-Changes

- No deployment stages
- No service connections
- No variable groups
- No Key Vault
- No secrets handling changes
- No GitHub workflow changes
- No runtime code changes
- No merge authorization for PR `#1083`

## Operator Review Note

Attaching `TerraFusion - PR Validation` as a required check is now technically supportable based on the green first run, but it remains an operator policy decision rather than an automatic follow-on action.
