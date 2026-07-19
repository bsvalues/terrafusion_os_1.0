# WO-LOCAL-094 - Docker WSL Disk Path Repair Evidence

> **Portfolio classification:** `OUT_OF_SCOPE_CROSS_PROJECT` / `NO_TERRAFUSION_CAPABILITY_DELIVERED`.
> Preserved as historical audit material only. WilliamOS/TerraGroq must authorize any transfer or
> continuation in its own repository and canon.
> Every follow-on recommendation below is withdrawn and has no current TerraFusion authority.

## Verdict

**FOLLOW_ON_PROTECTED_BOUNDARY.** Existing Docker state cannot be located, read, or preserved while
its historical external data volume is disconnected. The mandatory data-preservation gate therefore
prohibits junction replacement and Docker startup.

## Authority And Safety

- Base SHA: `13f0eabea7c4975e14818bbace84856f3ba823d9`.
- Clean worktree: `C:\Users\bsval\.codex-worktrees\local-094-docker-wsl-path-repair-2`.
- The owner authorized bounded local Docker storage repair only when existing state could be
  preserved.
- No factory reset, reinstall, deletion, empty-store initialization, image/container/volume/network
  removal, prune, pull, rebuild, Compose change, environment change, credential read, database access,
  county/PACS/SQL access, or deployment occurred.

## Pre-Mutation Preservation Gate

| Required evidence | Observed result |
| --- | --- |
| Junction path | `C:\Users\bsval\AppData\Local\Docker\wsl\disk` |
| Junction target | `E:\DockerData` |
| Reparse type | Microsoft mount-point junction (`0xa0000003`) |
| Junction timestamps | Created and last written 2026-03-31 20:06:46 local time |
| Junction ACL | User and SYSTEM/Administrators full control; sandbox group read/execute |
| Historical target identity | Mount-manager volume `{359cf739-10c6-4534-98b0-07fc3c6de7fb}` |
| Target availability | `E:` absent; historical volume not connected |
| Connected physical disks | One internal Samsung NVMe system disk only |
| Connected filesystem volumes | `C:` plus system/recovery partitions; no candidate Docker data volume |
| `C:` free space | 59,287,363,584 bytes at inspection time |
| Source size/inventory | UNKNOWN because source volume is unavailable |
| Docker data copy on `C:` | None found in standard Docker, Docker Desktop, WSL, `.docker`, `C:\DockerData`, or operator-local locations |
| Docker engine VHDX | `Docker\wsl\main\ext4.vhdx`, 100,663,296 bytes; engine distro only |
| Docker/WSL process state | Docker service running; Docker distributions stopped; Linux engine pipe absent |
| Rollback before mutation | Preserve original junction unchanged; no mutation performed |

Windows PnP history lists several disconnected external disks, including G-DRIVE mobile SSD,
SanDisk Extreme, and Seagate devices. The available metadata does not prove which device owns the
historical volume GUID, so no device identity is inferred.

## Data-Preservation Decision

The source volume is not merely unlettered or offline: it is not represented among connected disks
or volumes. The source data size and file inventory therefore cannot be established. The connected
system disk has only about 55.2 GiB free, so destination capacity cannot be proven adequate for an
unknown source. Replacing the junction or starting Docker could create a new empty data store and
violate the explicit preservation rule.

Accordingly, these authorized actions were deliberately **not** taken:

- Docker Desktop/backend stop or start;
- `wsl --shutdown`;
- junction removal, replacement, or repointing;
- replacement directory creation;
- data copy or move;
- Docker engine initialization;
- container start or inspection.

## Follow-On Protected Boundary

### Historical Proposed Work Order (Withdrawn)

`WO-LOCAL-095 - Historical Docker Data Volume Recovery and Verified Remount` (withdrawn; non-routable)

### Exact Failing Component

The physical volume previously mounted as `E:` and identified by
`{359cf739-10c6-4534-98b0-07fc3c6de7fb}` is unavailable. Docker's existing data root cannot be
read or preserved without that volume.

### Exact Proposed Action

1. Physically reconnect the external storage device that contains the historical volume.
2. Confirm its volume GUID matches `{359cf739-10c6-4534-98b0-07fc3c6de7fb}` before any write.
3. If it mounts under another letter, inspect `DockerData` read-only and record source size,
   `docker_data.vhdx` presence, timestamps, ACLs, and target free space.
4. Assign or restore `E:` only when the GUID and Docker data inventory match.
5. Resume the WO-LOCAL-094 repair procedure: verify the unchanged junction, start Docker once, and
   re-observe existing OMEN state.

Do not initialize, format, repair, or write to an unmatched external device.

### Data-Loss Risk

HIGH if Docker starts against a replacement empty target, or if the wrong external device is assigned
`E:`. LOW only after exact volume-GUID and Docker-data inventory match.

### Blast Radius

- Historical local Docker images, containers, volumes, and networks stored on the missing volume.
- Docker Desktop WSL engine initialization.
- No repository, TerraFusion database, cloud, county, PACS, SQL, or production resource.

### Rollback

- Keep the original junction unchanged until the source is verified.
- Record any restored drive-letter mapping before changing it.
- If Docker does not initialize against the verified source, stop Docker and restore the prior
  drive-letter/mount mapping; do not alter source files.

### Validation Plan

- Match exact historical volume GUID.
- Verify source inventory and source/destination capacity before any copy.
- Verify critical Docker data VHDX presence and size consistency.
- Verify junction resolution and ACL usability.
- Start Docker once and confirm engine pipe plus `docker info`.
- Inspect existing named OMEN containers and expected ports without recreation.
- Return a container-specific packet if existing state is unhealthy.

### Operator Recommendation

Reconnect the historical external devices one at a time and stop when the exact volume GUID appears.
Prioritize SSD-class devices operationally, but do not assume G-DRIVE or SanDisk ownership without the
GUID match. Do not authorize factory reset, fresh Docker state, or generic cleanup.

## Portfolio Recompute

WO-LOCAL-094 is complete at the preservation gate. No dependency-cleared Work Order exists within
current authority. The exact next protected candidate is WO-LOCAL-095; all other program boundaries
remain unchanged.

## Repository Validation

| Validation | Result |
| --- | --- |
| Registry JSON parse | PASS |
| `git diff --check` | PASS |
| Work Order query tests | PASS - 12/12 |
| Wave planner tests | PASS - 29/29 |
| Work Order query JSON | PASS - 35 records, all terminal, no recommendation |
| Wave planner JSON at R3 | PASS - no executable set or waves |
| `corepack pnpm run type-check` | PASS |
| Phase 8.3 core tool tests | PASS - 56/56 |
| Brain protected-path and hardcoded-port checks | PASS |
| Brain Work Order scope check | PASS - all ten changed files authorized after review remediation |
| Brain aggregate write-lane check | BLOCK on unchanged repository baseline; no suite or implementation files changed by WO-LOCAL-094 |

The fresh validation worktree required repository-local packages for the planner. A frozen bootstrap
ran with `corepack pnpm install --frozen-lockfile --ignore-scripts`. SHA-256 hashes for
`package.json` (`AE1B423C...B500C0D6`) and `pnpm-lock.yaml`
(`D23687DD...15489A0`) were identical before and after, and no tracked dependency file changed.

The Brain aggregate write-lane failure is not hidden or waived. Its scoped output independently
confirms that every WO-LOCAL-094 change is inside the authorized governance set and that no
suite was touched. The repository's unchanged write-lane baseline remains outside this bounded
evidence Work Order.

## Final Result

```text
RESULT: FOLLOW_ON_PROTECTED_BOUNDARY
WORK_ORDER: WO-LOCAL-094
EXACT_FAILING_COMPONENT: historical external Docker data volume is disconnected
EXACT_EVIDENCE: volume GUID exists in mount history but not among connected disks or volumes
PROPOSED_ACTION: reconnect and GUID-match the historical volume before any repair or Docker start
DATA_LOSS_RISK: high if empty or wrong storage is substituted
RUNTIME_MUTATION_PERFORMED: no
SECRETS_READ: no
NEXT_WORK_ORDER: NONE_IN_TERRAFUSION
```
