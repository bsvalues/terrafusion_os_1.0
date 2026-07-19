# WO-LOCAL-096 - OMEN Proof Container Recovery Evidence

> **Portfolio classification:** `OUT_OF_SCOPE_CROSS_PROJECT` / `NO_TERRAFUSION_CAPABILITY_DELIVERED`.
> Preserved as historical audit material only. WilliamOS/TerraGroq must authorize any transfer or
> continuation in its own repository and canon.

## Verdict

**FOLLOW_ON_PROTECTED_BOUNDARY.** The preserved database volume and prior proof topology are
identifiable, but both required local images are absent. The explicit fail-closed gate prohibits
pulling/building images or creating either container under this envelope.

## Mandatory Preflight

| Surface | Verified truth |
| --- | --- |
| Postgres container | `williamos-postgres-proof`; absent, so no overwrite risk |
| Application container | `williamos-omen-app-proof`; absent, so no overwrite risk |
| Postgres image | `postgres:16-bookworm`; absent; exact inspect returns `No such image` |
| Application image | `williamos-app-proof:omen`; absent; exact inspect returns `No such image` |
| Preserved volume | `williamos-local-runtime_williamos_pgdata` |
| Volume identity | Created 2026-07-03; Compose project `williamos-local-runtime`; volume key `williamos_pgdata` |
| Volume allocation | 47.66 MB; zero current container links |
| Database mount | `/var/lib/postgresql/data` |
| Docker network | `williamos-local-runtime_default`; bridge network; no target containers attached |
| Postgres binding | `127.0.0.1:15432:5432`; port clear |
| App binding | preferred `127.0.0.1:3100:3000`, fallback `127.0.0.1:3101:3000`; both clear |
| Postgres restart policy | `unless-stopped` |
| Postgres health | `pg_isready -U williamos -d williamos_local`, 10s interval, 5s timeout, 5 retries |
| App restart policy | not defined by the current start script |
| App command | image default `node server.js` from `Dockerfile.local-app-proof` |
| App network | current start script does not pass `--network`; exact prior relationship is not encoded |

### Environment Names

Postgres source: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

Application source: `AUTH_SIGNUP_MODE`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_TRUSTED_ORIGINS`,
`BETTER_AUTH_URL`, `DATABASE_URL`, `HOSTNAME`, `PORT`.

Only names and source-file metadata were emitted. No values were logged, copied, committed, or
disclosed.

## Startup Contract Review

- The Postgres Compose service uses the exact named volume and does not declare an anonymous volume.
- Normal PostgreSQL startup would perform ordinary recovery/WAL/checkpoint activity, which the
  envelope permits, but startup cannot occur without the absent image.
- The application Dockerfile runs a production Next.js standalone server and does not itself declare
  a migration, seed, restore, or credential reset command.
- The current application start script uses `docker run` with an env file and localhost port binding,
  but no named network or restart policy. That topology must be reconciled before a future start.

## Fail-Closed Decision

The owner packet states that Codex must not recreate a container when its required existing local
image cannot be verified and explicitly prohibits image pull/build. Both exact image checks failed.
Creating either container would therefore exceed authority, even though the volume, network, and
ports are otherwise ready.

## Runtime Mutation Ledger

| Mutation | Result |
| --- | --- |
| Container records created | 0 |
| Containers started/restarted | 0 |
| Images pulled/built/tagged | 0 |
| Volumes created/replaced/mounted | 0 |
| Networks created/changed | 0 |
| Database connections or writes | 0 |
| Secret values read/disclosed | 0 |

## Follow-On Protected Boundary

### Proposed Work Order

`WO-LOCAL-097 - OMEN Proof Image Acquisition and Topology Reconstitution`

### Exact Failing Components

1. `postgres:16-bookworm` is absent and requires an external image pull or a verified local archive.
2. `williamos-app-proof:omen` is absent and requires a controlled build from current canonical
   WilliamOS source or a verified local image archive.
3. The application start definition lacks an explicit named network and restart policy, so the prior
   database relationship is not reproducible from the current script alone.

### Exact Proposed Mutation

1. Authorize one digest-recorded pull of `postgres:16-bookworm`, or import an owner-verified local
   archive, without running a container.
2. Authorize one reproducible build of `williamos-app-proof:omen` from
   `Dockerfile.local-app-proof`, recording source SHA, base-image digests, output image ID, and
   package/lockfile invariants; or import an owner-verified local archive.
3. Reconcile the app proof command to the existing named network and an explicit restart policy
   without exposing it beyond localhost.
4. Re-run WO-LOCAL-096 preflight before any container creation.

### Data-Loss Risk

LOW while image acquisition/build remains container-free. HIGH if a later Postgres run substitutes
an anonymous/replacement volume or invokes repair beyond normal crash recovery.

### Blast Radius

- Local Docker image store and the exact two proof-container definitions.
- No database volume mutation until a later preflight passes.
- No TerraFusion Postgres, county, PACS, production, or external operational system.

### Rollback

- Remove only newly acquired/built image tags if validation fails and no container used them.
- Preserve the historical Docker VHDX, named Postgres volume, existing networks, and unrelated
  containers/images.
- Revert only a narrowly approved topology-definition change through its own source-control diff.

### Validation Plan

- Exact image IDs/digests and provenance.
- No container created during image acquisition/build.
- No tracked package or lockfile mutation.
- No secret values in build arguments, image history, logs, or evidence.
- Static proof that application startup does not migrate, seed, restore, or contact external systems.
- Repeat exact volume/network/port/container-name preflight before startup.

### Operator Recommendation

Authorize a single bounded image-acquisition/build envelope for both exact tags, with no container
startup implied. Prefer digest-pinned Postgres acquisition and a local reproducible app build from
current canonical source. Require the app network/restart topology to be explicit before returning to
container recreation.

## Repository Validation

| Validation | Result |
| --- | --- |
| Registry JSON parse | PASS |
| `git diff --check` | PASS |
| Work Order query tests | PASS - 12/12 |
| Wave planner tests | PASS - 29/29 |
| Work Order query JSON | PASS - 37 records, all terminal, no recommendation |
| Wave planner JSON at R3 | PASS - no executable set or waves |
| `corepack pnpm run type-check` | PASS |
| Phase 8.3 core tool tests | PASS - 56/56 |
| Brain Work Order scope check | PASS - all ten changed files authorized; no suite touched |
| Brain aggregate protected-path/write-lane checks | BLOCK on unchanged repository baseline; no implementation files changed by WO-LOCAL-096 |

The isolated validation worktree used
`corepack pnpm install --frozen-lockfile --ignore-scripts`. SHA-256 hashes for `package.json`
(`AE1B423C...B500C0D6`) and `pnpm-lock.yaml` (`D23687DD...15489A0`) were identical before and after,
and no tracked dependency file changed.

The Brain aggregate baseline block is not hidden or waived. Its scoped result confirms that every
WO-LOCAL-096 change is inside the authorized governance set and no suite was touched.

## Final Result

```text
RESULT: FOLLOW_ON_PROTECTED_BOUNDARY
WORK_ORDER: WO-LOCAL-096
PREFLIGHT: FAIL_CLOSED
PRESERVED_VOLUME: verified, unchanged, 47.66 MB
POSTGRES_IMAGE: absent
APPLICATION_IMAGE: absent
CONTAINERS_CREATED: 0
RUNTIME_MUTATION_PERFORMED: no
SECRETS_READ_OR_DISCLOSED: no
NEXT_WORK_ORDER: WO-LOCAL-097
```
