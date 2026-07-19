# WO-LOCAL-095 - Historical Docker Data Volume Recovery Evidence

> **Portfolio classification:** `OUT_OF_SCOPE_CROSS_PROJECT` / `NO_TERRAFUSION_CAPABILITY_DELIVERED`.
> Preserved as historical audit material only. WilliamOS/TerraGroq must authorize any transfer or
> continuation in its own repository and canon.

## Verdict

**FOLLOW_ON_PROTECTED_BOUNDARY.** The historical Docker data volume and Docker Engine were recovered
without replacing preserved state. The named OMEN proof containers and application image are absent,
so completing the proof runtime requires a separately bounded container-reconstitution mutation.

## Recovered Storage Identity

| Evidence | Observed result |
| --- | --- |
| Historical volume | `E:` (`Backup Plus`, exFAT) |
| Exact volume GUID | `\\?\Volume{359cf739-10c6-4534-98b0-07fc3c6de7fb}\` |
| Junction | `C:\Users\bsval\AppData\Local\Docker\wsl\disk` -> `E:\DockerData` |
| Docker data VHDX | `E:\DockerData\docker_data.vhdx` |
| VHDX byte size | `1009395957760` |
| Volume capacity | `5000669429760` bytes |
| Free space at recovery | `1074200838144` bytes |

The volume GUID exactly matches WO-LOCAL-094's historical mount-manager identity. The junction was
already correct and was not replaced, repointed, or recreated.

## Engine Recovery

Docker Desktop auto-started when the volume returned, but its first WSL bootstrap could not observe
the attached data disk WWID and remained in `starting` with HTTP 500 responses. A normal Desktop stop
timed out. Under the bounded recovery envelope, the operator:

1. stopped only the failed Docker Desktop/backend/build/proxy processes;
2. terminated the `docker-desktop` distribution and ran `wsl --shutdown`;
3. verified Docker distributions stopped; and
4. started Docker Desktop once.

The new Docker Desktop session reached `running`. `docker version` and `docker info` succeeded with
Docker Desktop 4.79.0 and Engine 29.5.3. The Docker data VHDX byte size remained unchanged; its write
timestamp advanced only after valid engine use.

## Preserved Runtime Inventory

- Existing running container: `williamos-runtime-operator-operator-1`.
- Restart policy: `unless-stopped`; restart count: `0`; no exposed ports; no healthcheck.
- Existing WilliamOS runtime-operator images survived.
- Existing volumes include `williamos-local-runtime_williamos_pgdata` and runtime-operator audit,
  state, and workspace volumes.
- Existing networks include `williamos-local-runtime_default` and
  `williamos-runtime-operator_default`.
- Secret values were not printed or inspected.

## OMEN Proof State

The expected containers are absent:

- `williamos-postgres-proof`;
- the OMEN application proof container.

No process listens on ports `15432`, `3100`, or `3101`. The local Compose source still defines the
Postgres proof container and its existing named data volume. The expected application proof image is
not present in the recovered image inventory. Therefore engine recovery does not prove the OMEN
application or database proof runtime healthy.

## Actions Deliberately Not Taken

- no container start, restart, recreation, or removal;
- no image pull, build, tag, or deletion;
- no volume or network creation, removal, or mutation;
- no Compose up/down operation;
- no port or binding change;
- no database connection or mutation;
- no environment or credential value inspection;
- no Docker reset, prune, purge, reinstall, or data-root replacement.

## Follow-On Protected Boundary

### Proposed Work Order

`WO-LOCAL-096 - OMEN Proof Container Recovery and Data-Preserving Reconstitution`

### Exact Missing Capability

The preserved Docker Engine is healthy, but the named Postgres and application proof containers do
not exist. The Postgres data volume survives; the application proof image does not.

### Exact Proposed Mutation

1. Validate the local Compose configuration without exposing secret values.
2. Recreate only `williamos-postgres-proof` using the existing
   `williamos-local-runtime_williamos_pgdata` volume.
3. Prove Postgres health and the localhost-only `15432` binding without mutating data.
4. Separately decide whether to rebuild the missing `williamos-app-proof:omen` image from the current
   canonical source before recreating the application proof container on localhost ports 3100/3101.

Generic build, pull, cleanup, or Docker authority is not implied.

### Blast Radius

- Local WilliamOS proof containers, localhost port bindings, and the existing named Postgres volume.
- No TerraFusion Postgres, cloud, county, PACS, SQL source system, production, or external resource.

### Rollback

- Stop and remove only a newly recreated proof container if validation fails.
- Preserve the existing named Postgres data volume and recovered Docker data VHDX.
- Do not remove images, networks, volumes, or unrelated containers.

### Validation Plan

- Exact Compose service and named-volume binding inspection.
- Postgres container health plus localhost-only port proof.
- Existing data-volume identity before and after recreation.
- Application image provenance and reproducible build proof before any app-container creation.
- App health on localhost only, with no LAN or external exposure.
- Re-observe all unrelated Docker state unchanged.

### Operator Recommendation

Authorize a narrow Postgres-container recovery first because its named data volume survives. Treat
the missing application image as a separate build/reconstitution step within the same packet only if
its current-source provenance and no-secret build contract are explicit.

## Repository Validation

| Validation | Result |
| --- | --- |
| Registry JSON parse | PASS |
| `git diff --check` | PASS |
| Work Order query tests | PASS - 12/12 |
| Wave planner tests | PASS - 29/29 |
| Work Order query JSON | PASS - 36 records, all terminal, no recommendation |
| Wave planner JSON at R3 | PASS - no executable set or waves |
| `corepack pnpm run type-check` | PASS |
| Phase 8.3 core tool tests | PASS - 56/56 |
| Brain Work Order scope check | PASS - all ten changed files authorized; no suite touched |
| Brain aggregate protected-path/write-lane checks | BLOCK on unchanged repository baseline; no implementation files changed by WO-LOCAL-095 |

The sparse validation worktree required repository-local packages for the planner. A frozen bootstrap
ran with `corepack pnpm install --frozen-lockfile --ignore-scripts`. SHA-256 hashes for
`package.json` (`AE1B423C...B500C0D6`) and `pnpm-lock.yaml`
(`D23687DD...15489A0`) were identical before and after, and no tracked dependency file changed.

The Brain aggregate baseline block is not hidden or waived. Its scoped result confirms that every
WO-LOCAL-095 change is inside the authorized governance set and no suite was touched.

## Final Result

```text
RESULT: FOLLOW_ON_PROTECTED_BOUNDARY
WORK_ORDER: WO-LOCAL-095
STORAGE_STATE: exact historical volume restored
DOCKER_ENGINE_STATE: running against preserved data store
OMEN_PROOF_STATE: named database and application proof containers absent
RUNTIME_MUTATION_PERFORMED: bounded failed-engine restart only
CONTAINERS_RECREATED: no
SECRETS_READ: no
NEXT_WORK_ORDER: WO-LOCAL-096
```
