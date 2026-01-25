# Branch Hygiene Policy

> **Checkpoint:** `ci-governance-v1` (January 2026)

This document defines branch hygiene rules for TerraFusion OS, with emphasis on automated dependency upgrade PRs (Snyk).

## Problem Statement

Snyk (and similar tools) generate **one PR per manifest file**, causing duplicate PRs when the same module exists in multiple paths:
- Copied modules (deployment/, packages/, infrastructure/)
- Vendor drops
- Legacy workspaces

## Authoritative Manifest Policy

### Definition

A manifest is **authoritative** if:
1. Listed in `pnpm-workspace.yaml` (or root `package.json` workspaces), AND
2. Referenced in CI/build as a discrete deliverable

### Decision Process

For each dependency PR, apply these checks:

```powershell
# 1. Workspace membership
Get-Content pnpm-workspace.yaml

# 2. CI/build references
Get-ChildItem .github/workflows -Filter *.yml | Select-String -Pattern "<path>"

# 3. Canonical source exists
Test-Path "<canonical-path>/package.json"
```

### Current Authoritative Paths

| Category | Authoritative Path | Notes |
|----------|-------------------|-------|
| Frontend | `frontend/` | Listed in pnpm-workspace.yaml |
| TerraBuild | `terrabuild-modernization/` | Documented as separate repo |
| Dockerfiles | `infrastructure/docker/` | Referenced in production CI |
| Government Core | `marketplace/government-core/` | Per-app evaluation |
| Applications | `applications/` | Per-app evaluation |

### Derived/Non-Authoritative Paths

PRs targeting these paths should be closed with a link to the keeper:

- `deployment/*/` (copied modules)
- `packages/commercial/modules/*/championship-deployment/` (nested copies)
- `packages/government-edition-enhanced-MARKED-FOR-REVIEW/` (review copies)
- `*-PRODUCTION/` subdirectories (build artifacts)

## Duplicate PR Closure Process

### Standard Close Comment

```
Consolidating <dependency> upgrades to the authoritative manifest via **#<keeper>** 
(<canonical-path>). This target appears non-authoritative/derived in this repo. 
If this workspace becomes independently deployable, reopen and add it to the 
authoritative manifest registry.
```

### Closure Checklist

1. [ ] Identify keeper PR (authoritative path)
2. [ ] Comment on duplicate with standard message + keeper link
3. [ ] Close duplicate PR
4. [ ] Verify keeper PR remains open

## Prevention (Future)

Consider implementing:

1. **Snyk ignore paths** for known derived directories
2. **CI guard** that fails PRs touching non-authoritative manifests
3. **Scheduled stale-branch report** for branches without open PRs

## Related Documents

- [CANONICAL_DOTNET_TESTING.md](CANONICAL_DOTNET_TESTING.md) — CI governance checkpoint
- [README.md](README.md) — CI governance index
