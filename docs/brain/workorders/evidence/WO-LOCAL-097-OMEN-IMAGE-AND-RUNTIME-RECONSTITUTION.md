# WO-LOCAL-097 - OMEN Image and Runtime Reconstitution Evidence

## Verdict

**FOLLOW_ON_PROTECTED_BOUNDARY.** Both images are ready with immutable provenance and PostgreSQL is
healthy against preserved persistence. OMEN was not started because credential rotation became
mandatory and application startup therefore failed closed.

Technical sub-result: `POSTGRES_HEALTHY_OMEN_BUILD_OR_START_DEFECT`.

## Supply-Chain Proof

| Surface | Verified truth |
| --- | --- |
| PostgreSQL registry | `docker.io/library/postgres` official image |
| PostgreSQL tag | `postgres:16-bookworm` |
| PostgreSQL index digest | `sha256:92620daddcd947f8d5ab5ba66e848702fe443d87fed30c4cea8e389fd78dfc55` |
| PostgreSQL `linux/amd64` manifest | `sha256:c95fd5346040eba2de3c435e14874af18f5d681fb5848d4f081dbead0878af28` |
| PostgreSQL local image ID | `sha256:67d1da22f4037b29cdd93e03d870a4a1c4d079358367d0cbc56459e52cde205e` |
| PostgreSQL version annotation | `16.14-bookworm` |
| OMEN source repository | `C:/Users/bsval/william-os-devops` isolated build worktree |
| OMEN source commit | `da3d67aaa93afd74c4c3a72ecb67ae3265387f33` |
| Build context | `C:/Users/bsval/.codex-worktrees/local-097-omen-app-build` |
| Context index hash | `6250748C6638D536C23C8D9F5526B882D244905167682813EFAAB47C05B0EA3B` over 1,784 tracked entries |
| Dockerfile hash | `86E29B5D29A6BAC07FF1CDC94C664BCA5745B57EE344750ED243B9DCBEABD97D` |
| `package.json` hash | `41425109AC1391BA5B03981D71897DF0E08BD62D74A0D6AE0CD9CBDB55114BC3` |
| `pnpm-lock.yaml` hash | `70AE45A62924ACE42E7EDFDADDF5A59B75BE3A33AD6A439492993CA43AB6823E` |
| Node base index digest | `sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3` |
| Node `linux/amd64` manifest | `sha256:8607a9064d4a571140998ae9e52a3b3fcf9cff361d04642d5971e6cd76d39e27` |
| OMEN build command | `docker build --pull=false --progress=plain -f Dockerfile.local-app-proof -t williamos-app-proof:omen .` |
| OMEN local image ID | `sha256:21685ba482b9e7694aaac4afcf2c96ae83ffde5108bcb985e926196d996c7f38` |
| Platform | `linux/amd64` for both final images |

The tag digests were resolved before acquisition. The exact official PostgreSQL and Node index
digests were pulled, locally tagged for topology compatibility, and then used without an unbounded
pull during the OMEN build. No undocumented OMEN image was pulled.

## Build Invariants

- The Dockerfile uses frozen-lockfile dependency installation and produced the Next standalone image.
- `package.json` and `pnpm-lock.yaml` hashes were unchanged before and after both the image build and
  the isolated local inspection bootstrap.
- The governed source worktree retained no tracked changes.
- No build argument or image-history entry contains a local credential source.
- The final image runs the base entrypoint with `node server.js` in `/app` and exposes only port 3000.

## Reconstructed Topology

| Surface | Reconstructed value | Evidence source |
| --- | --- | --- |
| Postgres container | `williamos-postgres-proof` | preserved Compose definition and WO-LOCAL-096 |
| OMEN container | `williamos-omen-app-proof` | governed start script and WO-LOCAL-096 |
| Postgres volume | `williamos-local-runtime_williamos_pgdata` | Docker volume labels and Compose definition |
| Database mount | `/var/lib/postgresql/data` | Compose definition and live mount inspection |
| Network | `williamos-local-runtime_default` | existing Compose network identity |
| Postgres binding | `127.0.0.1:15432:5432` | Compose definition and live port inspection |
| OMEN binding | `127.0.0.1:3100:3000`, fallback host port 3101 | governed start script |
| Postgres restart | `unless-stopped` | Compose definition and live HostConfig |
| OMEN restart | none | governed start script |
| Postgres health | `pg_isready -U williamos -d williamos_local` | Compose definition and live health result |
| OMEN command | image entrypoint plus `node server.js` | Dockerfile, image config, and image history |
| OMEN environment source | operator-local `app-container.env` | governed start script; names only were inventoried |
| Telemetry safety override | `OTEL_SDK_DISABLED=true` required for the next local proof start | installed `@vercel/otel` implementation defaults to loopback OTLP port 4318 |

No secret value is present in this topology or evidence.

## Startup Gate Review

Independent read-only assurance reviewed exact source commit `da3d67a` and found:

- no Dockerfile migration, seed, restore, or credential-reset startup command; the final image runs
  only `node server.js` (`Dockerfile.local-app-proof:14-26`);
- database initialization creates a pool without issuing a query (`lib/db/index.ts:1-7`);
- health/readiness database probes are read-only `SELECT` operations
  (`lib/auth-readiness.ts:74-81`);
- credential provisioning is request-triggered, not startup-triggered;
- no county or PACS startup connection;
- the explicit `registerOTel()` startup call is present (`instrumentation.ts:1-12`) and the installed
  package implementation defaults to a loopback OTLP exporter at port 4318 when not disabled;
- the governed start script uses an env-file and localhost-only binding and does not declare a
  restart policy (`scripts/local/williamos-omen-start.ps1:40-70`).

The safe future probes are `/api/auth/origin-diagnostics`, `/api/auth/readiness`, and `/api/health`;
all three expose GET handlers (`app/api/auth/origin-diagnostics/route.ts:6-19`,
`app/api/auth/readiness/route.ts:4-28`, and `app/api/health/route.ts:11-54`). The application container
was not created, so these endpoints were not invoked.

## PostgreSQL Runtime Proof

| Check | Result |
| --- | --- |
| Existing target collision | none before creation |
| Image | exact local ID `sha256:67d1da22...205e` |
| Named volume | exact preserved `williamos-local-runtime_williamos_pgdata` |
| Anonymous database volume | none created |
| Network | exact existing `williamos-local-runtime_default` |
| Localhost binding | `127.0.0.1:15432` only |
| Restart policy | `unless-stopped` |
| Recovery | ordinary automatic crash recovery, redo, and checkpoint completed |
| Initialization | existing database detected; initialization skipped |
| Health | `healthy`; accepting connections |
| OMEN container | absent; never created or started |

## Secret-Safety Incident

An over-broad local `docker inspect` used during metadata capture emitted the Postgres environment
array into transient operator-only command output. This violated the packet's no-secret-inspection
invariant. The value is intentionally not repeated, copied into a file, committed, placed in a PR,
or included in this evidence.

The operator stopped before OMEN creation or startup. Safe continuation now requires rotating that
credential across the database role and the two local secret-bearing configuration sources. The
current envelope explicitly prohibits credential changes, so no rotation was attempted.

## Runtime Mutation Ledger

| Mutation | Result |
| --- | --- |
| Official images acquired | PostgreSQL and exact Node base, both digest recorded |
| Local images built | one: `williamos-app-proof:omen` |
| Postgres containers created | one exact named proof container |
| OMEN containers created | zero |
| Existing volume replaced/deleted | zero |
| Anonymous database volumes created | zero |
| Networks created/changed | zero; existing named network reused |
| Database effects | ordinary PostgreSQL crash-recovery/WAL/checkpoint activity only |
| Manual migration/seed/restore/admin data operations | zero |
| County/PACS/production/external operational access | zero |

## Follow-On Protected Boundary

### Proposed Work Order

`WO-LOCAL-098 - OMEN Credential Rotation and Safe Application Startup`

### Exact Requested Mutation

1. Generate one replacement local proof credential without emitting it.
2. Update the preserved Postgres role and the operator-local Postgres and OMEN credential sources
   atomically, without placing values in command output or repository evidence.
3. Verify the old credential no longer authenticates and the new credential works, reporting only
   booleans/status.
4. Create `williamos-omen-app-proof` on the existing named network with localhost port 3100,
   `OTEL_SDK_DISABLED=true`, the existing env-file reference, no restart policy, and the verified
   image ID.
5. Run only the approved liveness/readiness/health GET probes and one ordinary restart if needed.

### Risk and Rollback

Credential rotation can temporarily break database connectivity if the role and both local sources
do not transition atomically. Roll back by restoring the prior credential through protected secret
handling only if it has not been treated as compromised; otherwise generate a second replacement.
Do not replace the volume, rebuild the database, or run schema/data repair.

### Operator Recommendation

Authorize one bounded credential-rotation and safe-start envelope. Keep PostgreSQL on the preserved
volume, keep OMEN stopped until rotation completes, and prohibit secret values in all command output,
logs, evidence, commits, and PR text.

## Repository Validation

| Validation | Result |
| --- | --- |
| `git diff --check` | PASS |
| Secret-assignment scan across the exact changed-file set | PASS; no credential assignments found |
| Registry JSON parse | PASS; 38 records and `WO-LOCAL-097` is the final record |
| `node --test docs/brain/workorders/tools/wo-query.test.mjs` | PASS; 12/12 |
| `node --test docs/brain/workorders/tools/wo-wave-plan.test.mjs` | PASS; 29/29 |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS; terminal registry, no executable successor |
| `node docs/brain/workorders/tools/wo-wave-plan.mjs --json --authority R3` | PASS; no executable waves |
| `corepack pnpm brain review-diff --workorder WO-LOCAL-097` | Scoped-file check PASS; aggregate verdict blocked only by the unchanged 21-item write-lanes baseline |
| `corepack pnpm run type-check` | PASS |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | PASS; 56/56 |

The aggregate Brain block is not waived or represented as green. Its protected-path check confirms
the scoped changed files are allowed, while the global write-lanes check reports the pre-existing
manifest baseline in unchanged `tools/registry/terrapilot.tools.json`. WO-LOCAL-097 does not modify
that manifest or the write-lanes policy.

## Final Result

```text
RESULT: FOLLOW_ON_PROTECTED_BOUNDARY
WORK_ORDER: WO-LOCAL-097
IMAGES_READY: yes
POSTGRES_HEALTHY: yes
PRESERVED_VOLUME_USED: yes
OMEN_IMAGE_READY: yes
OMEN_CONTAINER_CREATED: no
OMEN_STARTED: no
SECRET_VALUE_IN_REPOSITORY_EVIDENCE: no
NEXT_WORK_ORDER: WO-LOCAL-098
```
