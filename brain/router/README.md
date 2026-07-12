# TerraFusion Brain — Path Router (v1)

> **Work Order:** WO-BRAIN-0014 — Brain Path Router
> **Type:** File-backed routing manifest. **Data/documentation only — no runtime behavior.**
> **Depends on:** WO-BRAIN-0013 domain packs (`brain/packs/**`).

## What this is

Given a **changed file path** (or a work-order scope), the Path Router tells an agent — without
asking the human owner:

- **Domain** — which TerraFusion domain the path belongs to.
- **Pack** — the `brain/packs/**` knowledge pack to read first.
- **Risk floor** — the minimum risk class for any change here.
- **Forbidden boundaries** — what a change here must never do.
- **Proof** — the real commands to run before the change is trusted.
- **Escalation triggers** — when to stop and get human approval.

The router is **one manifest**: [`path-router.yaml`](path-router.yaml). It **points at** the domain
packs; it is **not** a queue and **not** a second authority. One Brain, many packs — the router is a
lookup table, nothing more.

## Why a manifest and not a `pnpm brain route` command

`corepack pnpm brain` exists and resolves `scripts/brain/brain.mjs` (see `brain/packs/README.md` ->
*Verification Notes*), but it has no path-router verb. V1 remains **manifest-first**:

- The **consumer is the agent**, which reads files natively — so a YAML manifest is directly usable
  today with **zero new dependencies and no `package.json`/build/deploy changes**.
- An executable resolver (`pnpm brain route --path …`, or an equivalent built on the real
  `canon`/`tf`/`truth`/`trace` surface) is a **deferred, optional follow-up** (call it WO-BRAIN-0014.1).
  It was intentionally **not** added here because a robust YAML-parsing CLI would require a parser
  dependency or a `package.json` change — neither is low-friction, and both are out of scope.

## How an agent resolves a path

1. Take the path you are about to modify.
2. Find the **most specific** matching route in `routes:` (longest glob wins; a file route beats a
   directory glob).
3. If routes tie on specificity, the **higher `risk_floor`** wins.
4. If nothing matches, use `fallback:` — **escalate to the human**.
5. Read the route's `pack`, honor every `forbidden` entry, run the `proof` commands, and stop on any
   `escalate` condition.

### Worked example

Changed path: `frontend/apps/os-shell/src/shell/desktop/zIndex.ts`

| Field | Resolved value |
|-------|----------------|
| Domain | `shell` |
| Pack | `brain/packs/shell/README.md` |
| Risk floor | **R3** (z-index authority) |
| Forbidden | hardcoded z-index anywhere else; this file is the single authority |
| Proof | `pnpm run type-check`, `pnpm canon:gatefast` |
| Escalate | restructuring the z-index layer hierarchy |

Changed path: `packages/terrabuild/src/models/cost.ts`

| Field | Resolved value |
|-------|----------------|
| Domain | `forge` |
| Pack | `brain/packs/forge/README.md` |
| Risk floor | **R2** (write_high, county-scoped) |
| Forbidden | workflow (Dais), documents (Dossier), GIS (Atlas); persistence without `CountyId` |
| Proof | `pnpm run type-check`, `pnpm canon:gatefast` |
| Escalate | valuation methodology / CAMA single-writer boundary change |

## Path risk floors (legacy router profile)

The `risk_floor` is the **minimum path severity** for any change matching a route — a specific change
can be higher (then escalate), never lower. This R0-R3 profile predates and is **not interchangeable
with** the canonical WOE R0-R5 execution-risk model in
`docs/brain/workorders/schema/WORK_ORDER_DATA_MODEL.md`. The operator must apply both; the higher
effective constraint wins. This profile is aligned with the TerraPilot risk classes
(`read_only` / `write_low` / `write_high` / `irreversible`):

| Floor | Meaning |
|-------|---------|
| **R0** | read-only — docs / data / governance text. No code mutation. |
| **R1** | write_low — local, reversible, not county-scoped (shell chrome, pack docs). |
| **R2** | write_high — county-scoped persistence, write-lane writes, suite domain data, core-governance-surface edits. `CountyId` isolation + TerraTrace emission required. |
| **R3** | irreversible / constitutional / production — tab order, z-index hierarchy, write-lane boundary changes, certification logic, deploys, secrets. Always human-approved. |

## `authoritative` vs `candidate`

- **`authoritative`** routes use **real, verified** repository paths (confirmed to exist).
- **`candidate`** routes are uncertain (dual shell/suite ownership) or **anticipated-but-unconfirmed**
  paths — including the paths the original WO-BRAIN-0013 work order assumed (`apps/terrafusion-shell/`,
  `suites/**`, `services/terrapilot/`) which **do not exist**. Candidates are kept so future work and
  stale references route somewhere sane, but they **must not** be treated as authoritative — confirm
  with a human before relying on them.

## Proof command vocabulary (real commands only)

`path-router.yaml` references proof commands by key (`proof_commands:`); the real commands are:

| Key | Command |
|-----|---------|
| `type_check` | `pnpm run type-check` |
| `canon` | `pnpm canon` |
| `canon_gatefast` | `pnpm canon:gatefast` |
| `canon_ping` | `pnpm canon:ping` |
| `core_tools_test` | `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| `trace_query` | `pnpm run trace:query --correlation <id>` |
| `prettier_check` | `pnpm exec prettier --check <changed.md>` |

## Maintenance

- When a path's ownership becomes certain (e.g. a real Dossier or GPT package lands), **promote** the
  matching `candidate_routes` entry into `routes:` with `status: authoritative` and a real glob.
- Keep routes pointing at **existing** packs; if a pack moves, update the `pack:` field.
- The router is governed by the same authority hierarchy as everything else (root `AGENTS.md`):
  Constitution → Brain → packs → directory `AGENTS.md` → patterns → judgment.

## Verification

This change is data/docs only. Verified at authoring time:

- Every `pack:` in `path-router.yaml` resolves to an existing file under `brain/packs/`.
- Every `authoritative` route's glob targets a path that exists in the repo today.
- `candidate_routes` are explicitly flagged and called out as non-existent / uncertain.
- `pnpm exec prettier --check` passes on the markdown in this directory.
