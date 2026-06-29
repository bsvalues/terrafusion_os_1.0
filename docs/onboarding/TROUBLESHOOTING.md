# Troubleshooting

Use this matrix for common local and Azure-first-pass setup failures. Keep fixes narrow and aligned to the active work order.

Start with `docs/onboarding/DEVELOPER_ONBOARDING.md`. For Docker-specific failures, use
`docs/onboarding/DOCKER_TROUBLESHOOTING.md`.

For local-dev command order and stop gates, use `docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md`.
For the smallest health check, use `docs/onboarding/LOCAL_DEV_SMOKE_GATE.md`.

## Troubleshooting Matrix

| Symptom | Likely cause | How to verify | Safe first action | Escalate when |
| --- | --- | --- | --- | --- |
| `pnpm` command missing | pnpm not installed or wrong shell session | `pnpm --version` | Install or activate pnpm `9.0.0` locally | package manager mismatch persists |
| Wrong Node version | incompatible Node runtime | `node --version`, check `.nvmrc`, `package.json` | switch to Node `20.x` for CI parity | repo scripts still fail on supported version |
| `dotnet` command missing | .NET SDK absent | `dotnet --info` | install .NET SDK `8.0.x` | `global.json` cannot be satisfied |
| `pnpm install --frozen-lockfile` fails | missing registry/network access or lock mismatch | rerun and inspect first error line | verify network and stay on committed lockfile | lockfile would need mutation outside scope |
| `pnpm -C frontend run type-check` fails from root | wrong working directory assumptions | confirm `frontend/package.json` exists | rerun exactly with `-C frontend` | script is missing or package metadata is broken |
| `dotnet restore backend/TerraFusion.sln` fails | NuGet/network issue or wrong path | `Test-Path backend/TerraFusion.sln` | restore from repo root with the documented path | project references are missing or feed auth is required |
| `pnpm run check:generated` fails | generated JS drift in `os-platform/core/**` | inspect the reported file paths | record drift; do not hand-edit generated `.js` | a separate code-fix work order is needed |
| Worktree shows unexpected files | wrong checkout or shared checkout contamination | `git status --short --branch` | stop and compare with work-order assumptions | any cleanup would touch foreign work |
| Azure pipeline run cannot start | Azure auth/session missing | `az devops project show ...` or `az pipelines list ...` | authenticate locally with approved local-only method | auth still fails or permission is missing |
| Azure YAML path error | pipeline points at wrong YAML path | inspect pipeline definition and repo path | correct pipeline registration or YAML path in a separate WO | runtime code or broader pipeline redesign is implied |
| Backend SDK mismatch | local SDK differs from repo baseline | compare `dotnet --info` with `global.json` | install/use .NET `8.0.x` | restore/build still selects the wrong SDK |
| Tier-1 tests fail unexpectedly | local deps incomplete or frontend environment drift | rerun after clean install and note first failure | capture exact command and first error line | issue appears deterministic and needs a scoped fix packet |
| Docker local dev fails | Docker Desktop, Compose, env, or port issue | `docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config` | use `docs/onboarding/DOCKER_TROUBLESHOOTING.md` | production Compose, Helm, PACS, county SQL, or secrets are implicated |
| Local smoke gate fails | readiness or bootstrap inspect found a local prerequisite problem | `pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/smoke.ps1` | inspect the first failed child command and use `docs/onboarding/LOCAL_DEV_SMOKE_GATE.md` | fixing it would require installs, Docker startup, dependency changes, runtime code, or secrets |
| Tool version is unclear | local tool differs from repo-declared or observed baseline | compare `package.json`, `.nvmrc`, `global.json`, and `docs/onboarding/TOOLCHAIN_TRUTH.md` | use the repo-declared version unless the active work order documents a local deviation | package-manager or SDK migration is implied |

## Common Failure Patterns

### Missing `node_modules`

Typical signs:

- `Cannot find module`
- missing frontend tooling
- test runner not found

Safe action:

```powershell
pnpm install --frozen-lockfile
```

### Wrong Working Directory

Typical signs:

- script exists but command says package or file is missing
- backend solution not found
- frontend scripts fail when run from the wrong folder

Safe action:

```powershell
git rev-parse --show-toplevel
Test-Path backend/TerraFusion.sln
Test-Path frontend/package.json
```

### Stale Generated Files

Typical sign:

- `pnpm run check:generated` reports diffs in `os-platform/core/**`

Safe action:

- capture the exact files reported
- do not hand-edit generated `.js`
- use a separate work order if regeneration is authorized

### YAML Path Failures

Typical signs:

- pipeline cannot locate `azure-pipelines/pr-validation.yml`
- pipeline cannot locate `azure-pipelines/build-main.yml`

Safe action:

- verify the file exists in the target repo and branch
- verify the pipeline definition references the correct path

### Azure First-Run Authorization Problems

Typical signs:

- run stays queued without progress
- repository permission prompt appears in Azure
- CLI returns auth or authorization errors

Safe action:

- verify local Azure DevOps auth
- inspect pipeline run metadata and timeline
- capture the exact Azure error before proposing any YAML fix

## Red-Line Reminder

- No secrets in logs or docs
- No PACS or county SQL
- No county data
- No production deployment
- No branch or merge strategy changes unless explicitly approved
