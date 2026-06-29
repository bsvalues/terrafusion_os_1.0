# Local Dev Operating Rollup

This rollup is the `WO-DEVOPS-006O` closure artifact for the local-dev operating packet chain. It
records merged proof through `WO-DEVOPS-006N`, separates that proof from remaining work, and keeps
the lane local-first.

It does not authorize release, deployment, runtime feature work, production Docker, Helm,
Kubernetes, image publishing, secrets, county data, PACS, or county SQL.

## Merged Evidence

| WO | PR | Merge commit | Scope | Runtime impact |
| --- | --- | --- | --- | --- |
| `WO-DEVOPS-006J` | `#1096` | `8a61100452c9b54bb91f70e5dae924e4fdab804a` | Added local-dev smoke gate docs and `scripts/dev/smoke.ps1`. | None |
| `WO-DEVOPS-006K` | `#1097` | `eb10f947394e0debfa39d2ae22a9b19a8b12363b` | Added local toolchain truth and linked it from onboarding. | None |
| `WO-DEVOPS-006L` | `#1098` | `dd1d7f4bbccbd2e714bca843a1a7429ba7a6aade` | Added the local-dev operating packet. | None |
| `WO-DEVOPS-006M` | `#1099` | `af1d5ba47c3b85d8b18a44966defc5fda7e1910c` | Aligned onboarding/setup/troubleshooting links. | None |
| `WO-DEVOPS-006N` | `#1100` | `9772ea1314bc4f92d6b3769f698ac46c4c8ec26e` | Added consistent `-Help` usage output to local-dev scripts. | None |

## Current Canonical Path

The local-dev path is:

1. Read `AGENTS.md`.
2. Read `docs/onboarding/DEVELOPER_ONBOARDING.md`.
3. Read `docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md`.
4. Check tools and repo state with `scripts/dev/readiness.ps1`.
5. Run inspect-only bootstrap with `scripts/dev/bootstrap.ps1`.
6. Run the local smoke gate with `scripts/dev/smoke.ps1`.
7. Validate Docker dev Compose config with placeholder env values before starting any service.

## Verified Commands

The chain repeatedly validated these commands from dedicated worktrees:

```powershell
git diff --check
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/smoke.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1 -Help
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1 -Help
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/smoke.ps1 -Help
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config
```

The smoke gate was also verified from `docs/` using a relative script path.

## What This Proves

This evidence proves:

- local-dev onboarding now has one operating packet
- local scripts have discoverable usage output
- readiness, bootstrap inspect, and smoke commands remain read-only
- Docker dev Compose config renders with placeholder env values
- Docker dev services remain profile-gated
- local-dev docs point to the current toolchain, smoke, Docker, and troubleshooting surfaces

## What This Does Not Prove

This evidence does not prove:

- production readiness
- release readiness
- backend restore or build correctness
- frontend build correctness
- dependency install correctness
- runtime application behavior
- Docker service startup correctness
- Kubernetes or Helm readiness
- county runtime readiness

## Remaining Risks

- Clean-worktree materialization is slow and has left incomplete worktrees in previous WOs; worktree
  deletion candidates require a separate hygiene cleanup WO.
- Local Docker `.env` remains intentionally absent by default; placeholder values live in
  `docker/dev/.env.example`.
- Node and pnpm local versions may differ from repo-declared baselines; use
  `docs/onboarding/TOOLCHAIN_TRUTH.md` before changing package-manager behavior.

## Recommended Next Lane

Run a dedicated worktree hygiene cleanup packet before expanding platform scope. That packet may
inspect and remove completed or incomplete DevOps worktrees only after explicit cleanup
authorization.
