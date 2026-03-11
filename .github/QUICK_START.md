# GitHub Maintainer Quick Start

This is the shortest current path for contributors and maintainers working
through GitHub.

## 1. Sync and Branch

```bash
git checkout main
git pull origin main
git checkout -b docs/update-github-frontpage
```

## 2. Run the Minimum Local Checks

For governance-surface changes:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

For a broader governed/core pass:

```bash
pnpm run governance:check
```

## 3. Open a PR to `main`

```bash
git push -u origin <branch-name>
gh pr create --base main --fill
```

Watch required checks:

```bash
gh pr checks --watch
```

## 4. Know What Must Pass

Current required checks on `main`:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

## 5. Run the Release Lane

Dispatch a specific SHA to staging:

```bash
gh workflow run release-lane.yml \
  -f target_env=staging \
  -f release_sha=<full-sha>
```

Rollback staging:

```bash
gh workflow run rollback-staging.yml
```

Dispatch to production:

```bash
gh workflow run release-lane.yml \
  -f target_env=production \
  -f release_sha=<full-sha>
```

Rollback production:

```bash
gh workflow run rollback-production.yml
```

## 6. Current Operational Reality

As of 2026-03-11:

- staging proof sequence is complete
- production proof sequence is still pending
- production SSH is blocked until `DEPLOY_SSH_KEY` is replaced with a valid
  unencrypted `ed25519` key
- GHCR has been cut over in workflows to internal package names

Operational truth lives here:

- [hostinger-control-plane.md](../os-platform/core/pilot/ops/hostinger-control-plane.md)

## 7. Verify Repo Features

```bash
gh api repos/bsvalues/terrafusion_os_1.0 --jq \
  "{default_branch: .default_branch, private: .private, has_issues: .has_issues, has_wiki: .has_wiki, has_discussions: .has_discussions}"
```
