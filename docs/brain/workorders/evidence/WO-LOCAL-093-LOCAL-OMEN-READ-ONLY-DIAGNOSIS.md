# WO-LOCAL-093 - Local OMEN Read-Only Diagnosis Evidence

> **Portfolio classification:** `OUT_OF_SCOPE_CROSS_PROJECT` / `NO_TERRAFUSION_CAPABILITY_DELIVERED`.
> Preserved as historical audit material only. WilliamOS/TerraGroq must authorize any transfer or
> continuation in its own repository and canon.
> Every follow-on recommendation below is withdrawn and has no current TerraFusion authority.

## Verdict

**FOLLOW_ON_PROTECTED_BOUNDARY.** The immediate failure is Docker Desktop WSL engine storage
initialization, not a proven defect in the OMEN application or database container. Docker runtime
mutation is required before container-level health can be observed.

## Scope And Safety

- Base SHA: `d334c679a59a596810a9055dc168c20b589adc9f`.
- Dedicated worktree: `C:\Users\bsval\.codex-worktrees\local-093-omen-readonly-diagnosis`.
- Named proof containers: `williamos-postgres-proof` and `williamos-omen-app-proof`.
- Expected image: `williamos-app-proof:omen`.
- Expected local bindings: `127.0.0.1:15432`, `127.0.0.1:3100`, or fallback `127.0.0.1:3101`.
- No start, stop, restart, recreate, remove, kill, prune, pull, build, network, volume, port,
  configuration, credential, database, or external-resource mutation occurred.
- Environment file names were inventoried; no environment or secret values were read or recorded.

## Observed State

This live observation supersedes the older WO-PORTFOLIO-012 snapshot claim that Docker Desktop had
recovered and that the database container was merely unhealthy. With no daemon pipe, current
container existence and health are `UNKNOWN`, not absent or unhealthy.

| Surface | Read-only observation | Operational meaning |
| --- | --- | --- |
| Docker client | Version `29.5.3`; context `desktop-linux` | Client is installed, but this does not prove daemon health. |
| Docker API | `dockerDesktopLinuxEngine` and `docker_engine` named pipes are absent | Container inventory, inspect, health, and logs are not currently observable. |
| Docker services | `com.docker.service` is running; Docker Desktop and backend processes are absent | Windows service presence does not imply Linux engine availability. |
| WSL | Docker and user distributions are stopped | No active Docker Linux VM is available. |
| Expected ports | No listener or owner on `15432`, `3100`, or `3101` | Neither proof binding is currently serving locally. |
| Docker WSL disk path | `%LOCALAPPDATA%\Docker\wsl\disk` is a junction targeting `E:\DockerData` | Docker storage depends on an external local drive target. |
| Junction target | `E:` is unavailable in the diagnostic session | The configured storage target cannot be resolved. |
| Docker settings | Settings file exists; only key names were inspected; no storage-location key is present | No secret value or mutable setting was read. |
| Local proof artifacts | Compose, env-name, backup, log, and prior proof artifact names exist under `williamos-local-runtime` | Operator artifacts remain present, but they do not prove current runtime health. |

## Failure Evidence

Sanitized Docker backend logs from 2026-07-16 identify one repeatable startup failure in Docker
Desktop 4.79.0:

```text
engine linux/wsl failed to start
creating distribution storage
creating vhdx directory
mkdir <HOME>\AppData\Local\Docker\wsl\disk
Cannot create a file when that file already exists
```

Recovery repeats the same error and the backend cancels. The path is an existing junction whose
target drive is unavailable. This explains both the create-directory collision and the missing
daemon pipe. Historical container claims cannot be promoted to current truth while the daemon is
unavailable.

## Root-Cause Classification

| Field | Evidence-backed value |
| --- | --- |
| Exact failing component | Docker Desktop 4.79.0 Linux/WSL engine distribution-storage initialization |
| Immediate cause | Existing `disk` junction conflicts with Docker's attempted directory creation |
| Dependency failure | Junction target `E:\DockerData` is unavailable |
| OMEN application status | UNKNOWN; app container cannot be observed until Docker engine recovery |
| OMEN database status | UNKNOWN; database container cannot be observed until Docker engine recovery |
| Runtime mutation required | YES, outside WO-LOCAL-093 authority |

## Follow-On Protected Boundary

### Historical Proposed Work Order (Withdrawn)

`WO-LOCAL-094 - Docker WSL Disk Path Repair and OMEN Re-observation` (withdrawn; non-routable)

### Exact Proposed Mutation

1. Preserve and inventory the current junction and any reachable `E:\DockerData` metadata before
   mutation.
2. Stop only the Docker Desktop/backend/WSL components required for a safe storage-path repair.
3. Restore availability of the intended `E:` target **or** replace the stale junction with one
   supported Docker Desktop storage location selected in the packet.
4. Start Docker Desktop once and verify the Linux engine pipe and `docker info`.
5. Re-observe, but do not automatically recreate, the two named proof containers and expected ports.

No factory reset, Docker prune, image pull/build, container recreate, volume deletion, database
mutation, credential read, or TerraFusion Postgres access should be included.

### Blast Radius

- Docker Desktop local WSL engine startup.
- The local Docker data-root path and any images, containers, or volumes stored at the target.
- No product repository, cloud resource, county system, PACS source, production runtime, or
  TerraFusion database is in scope.

### Rollback

- Record the junction metadata and target before change.
- If a path change does not restore the engine, stop Docker and restore the original junction/path
  mapping exactly.
- Do not delete or format the target drive or Docker data.

### Validation Plan

- Confirm target drive/path availability and free space before mutation.
- Confirm Docker WSL disk path resolves after mutation.
- Confirm Docker engine pipe and `docker info` succeed.
- Confirm no unauthorized port, network, volume, image, or container mutation occurred.
- Inspect the named proof containers and `15432`/`3100`/`3101` only after engine recovery.
- Return a separate bounded packet if container repair is then necessary.

### Operator Recommendation

Authorize `WO-LOCAL-094` only if restoring this local proof environment is currently valuable. The
lowest-risk first choice is to make the intended `E:` storage target available and verify the
existing junction before changing the junction itself. Do not authorize a factory reset or generic
Docker cleanup.

## Portfolio Recompute

WO-LOCAL-093 is complete. The read-only diagnosis dependency is satisfied, but no repair authority
exists. `WO-LOCAL-094` is the exact next protected candidate. Other portfolio lanes remain in their
previous protected or strategic states; no dependency-cleared node exists inside current authority.

## Final Result

```text
RESULT: FOLLOW_ON_PROTECTED_BOUNDARY
WORK_ORDER: WO-LOCAL-093
EXACT_FAILING_COMPONENT: Docker Desktop 4.79.0 Linux/WSL distribution storage initialization
EXACT_PROPOSED_MUTATION: repair availability or mapping of the Docker WSL disk target, then re-observe
RUNTIME_MUTATION_PERFORMED: no
SECRETS_READ: no
NEXT_WORK_ORDER: NONE_IN_TERRAFUSION
```

## Validation

- `git diff --check`: PASS.
- Work Order query tests: PASS, 12/12.
- Wave planner tests: PASS, 29/29.
- Work Order query JSON: PASS; 34 records, WO-LOCAL-093 terminal, no active lane or recommended
  executable Work Order.
- R3 wave plan JSON: PASS; no executable set or projected wave.
- Core type-check: PASS.
- Phase 8.3 core tools: PASS, 56/56.
- Frozen bootstrap: `corepack pnpm install --frozen-lockfile --ignore-scripts` changed no tracked file;
  `package.json` and `pnpm-lock.yaml` hashes were unchanged.
- Brain scope review: all nine changed files are within WO-LOCAL-093 scope. The aggregate review
  remains blocked only by the unchanged write-lane baseline (`summarize_collection_stats` uses the
  invalid suite `treasury`, plus six additional pre-existing violations); this Work Order neither
  changes nor suppresses that baseline.
- Runtime/backend/frontend/tools-sync/CI/deployment changes: none.
- Docker/WSL/container/network/volume/port/configuration/database mutations: none.
- County/PACS/SQL/secrets/live-resource access: none.
