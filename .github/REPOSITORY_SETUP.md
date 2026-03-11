# Repository Setup and Maintenance

This document describes the current GitHub-side setup for the existing
repository. It is not a "how to create a brand-new repo" guide.

## Verified Repository Flags

Verified on 2026-03-11:

- visibility: private
- default branch: `main`
- issues: enabled
- projects: enabled
- discussions: disabled
- wiki: disabled
- allow forking: enabled by GitHub for this personal-account repository

Verify again with:

```bash
gh api repos/bsvalues/terrafusion_os_1.0 --jq \
  "{default_branch: .default_branch, private: .private, has_issues: .has_issues, has_projects: .has_projects, has_wiki: .has_wiki, has_discussions: .has_discussions, allow_forking: .allow_forking}"
```

## Branch Protection

`main` is protected. Required checks:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

See:

- [branch-protection.md](./branch-protection.md)
- [../.governance/main.protection.json](../.governance/main.protection.json)

## GitHub Environments

Current deploy environments:

- `staging`
- `production`

Both currently target the same Hostinger box and use:

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `PUBLIC_URL`
- `APP_ROOT`
- `DEPLOY_SSH_KEY`

Operational truth and blockers:

- [hostinger-control-plane.md](../os-platform/core/pilot/ops/hostinger-control-plane.md)

## GHCR Naming Contract

Current workflow contract uses these internal package families:

- `ghcr.io/bsvalues/terrafusion-os-backend-internal`
- `ghcr.io/bsvalues/terrafusion-os-frontend-internal`
- `ghcr.io/bsvalues/terrafusion-os-slsa-backend-internal`
- `ghcr.io/bsvalues/terrafusion-os-slsa-frontend-internal`
- `ghcr.io/bsvalues/terrafusion-api-internal`
- `ghcr.io/bsvalues/terrafusion-os-prod-api-internal`
- `ghcr.io/bsvalues/terrafusion-os-prod-frontend-internal`
- `ghcr.io/bsvalues/terrafusion-os-prod-ai-swarm-internal`

Do not reintroduce the old public package names in workflows or docs.

## Maintainer Checklist

- keep issue templates aligned with current repo features
- keep PR template aligned with current required checks
- update docs when workflow contracts change
- verify deploy runbooks when environment variables or package names change
