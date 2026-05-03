# TerraFusion OS — Repository Map

**Slice:** REPO-MAP-1 (docs-only — top-level orientation map for the
TerraFusion OS repository. The goblin built sixteen hallways and
forgot exit signs; this doc is the exit signs.).
**Status:** living index; updated as new domains stand up. Not a
binding contract — the binding contracts are SCOPE-1 / SCOPE-2 /
SCOPE-3 (see `docs/architecture/BOUNDARY_INDEX.md`).

## How to use this doc

- **You're a developer or agent looking for "where does X live?"** Start
  here. Find the surface, follow the path link, follow any per-domain
  README cross-reference (e.g. `docs/sync/README.md`).
- **You're an agent about to add a new surface.** Check the boundary
  index first (`docs/architecture/BOUNDARY_INDEX.md`). If your new
  surface doesn't fit cleanly into an existing domain row, that is
  the signal to STOP and re-frame, not to invent a new one.
- **You need a fast text search.** Use
  `scripts/dev/find-terrafusion-surface.sh <topic>` (bash) or
  `scripts/dev/find-terrafusion-surface.ps1 <topic>` (PowerShell).
  Topics: `sync` / `workbook` / `comps` / `schema` / `terraflow`.

## Source/target binding (always true)

```text
Harris PACS 9.0  ────► TerraFusion Sync ────►  TerraFusion DB  ────►  { Forge, TerraFlow, Dais, Dossier, Atlas }
   (legacy source)        (bridge)              (target)              (consumers, peers)
```

ProVal / Ascend appear only as historical conversion-provenance
footnotes. Tyler Vision is NOT in Benton's stack and never was.
See `docs/sync/sync-boundary-policy.md` (SCOPE-1) and
`docs/sync/pacs-schema-catalog-as-code-policy.md` ("Source / target
model (binding)" section, C48-FIX2 anchored) for authority.

## Top-level layout

| Tree | Purpose | Key entry point |
|---|---|---|
| `backend/src/` | .NET 8 backend projects (16) | `TerraFusion.sln` |
| `backend/tests/` | .NET test projects | `TerraFusion.sln` |
| `backend/tools/` | Standalone .NET CLI tools (proof + admin) | per-tool `.csproj` |
| `backend/artifacts/` | Generated proof + smoke artifacts (mostly gitignored except slice-allowed dirs) | per-slice subdirs |
| `frontend/apps/` | React UI apps | `os-shell` (the OS shell), `terraforge` |
| `docs/` | Authoritative docs + policies + slice cards | `docs/REPO_MAP.md` (this file) |
| `docs/sync/` | Sync domain docs (per-slice policies + reference) | `docs/sync/README.md` |
| `docs/architecture/` | Architecture-level boundary docs | `docs/architecture/BOUNDARY_INDEX.md` |
| `scripts/dev/` | Developer-facing search + maintenance scripts | `scripts/dev/find-terrafusion-surface.sh` |
| `os-platform/` | AI swarm + testing suite + pilot evidence | (see CLAUDE.md) |
| `migrations/` | (per-project EF Core migrations live in `backend/src/TerraFusion.Data/Migrations/`) | n/a |

## Backend projects

All in `backend/src/`. Reference these by exact name (case-sensitive
on Linux CI).

| Project | Role |
|---|---|
| `TerraFusion.API` | The Kernel — ASP.NET Core API host, controllers, Program.cs, middleware. Port 5000. |
| `TerraFusion.Core` | Domain entities, DTOs, interfaces. Includes `Entities/Canonical/` (canonical landing rows). |
| `TerraFusion.Data` | EF Core `TerraFusionDbContext`, migrations, entity configurations, `AuditableEntityInterceptor`. |
| `TerraFusion.Sync` | Sync workbench (the bridge). Subnamespaces under `Workbench/`: `Atlas`, `Comps`, `Mapping`, `Pacs`, `Schema`, `Transforms`. |
| `TerraFusion.AI` | AI command service, ML services, model orchestration. |
| `TerraFusion.Consciousness` | AI swarm orchestration microservice. Port 3004. |
| `TerraFusion.CostForge` | CostForge AI valuation logic (Forge backend home). |
| `TerraFusion.Levy` | Levy / tax computation. |
| `TerraFusion.Operations` | Operational + scheduler services. |
| `TerraFusion.Security` | Security, audit, compliance. |
| `TerraFusion.Abstractions` | Shared interfaces and contracts. |
| `TerraFusion.DataMining` | Data-mining + analytics tools. |
| `ai-models/`, `mcp-core/` | AI model integration / MCP support. |

## Backend tools

All in `backend/tools/`. Standalone .NET console apps; not part of the
main API runtime.

| Tool | Purpose | Status |
|---|---|---|
| `SyncAtlas` | Source profiling + atlas administration. Internal admin tool, not consumer UX. | Active proof/admin tool |
| `SalesCompProof` | Proves canonical sale-qualification output end-to-end. Regression / proof harness. | Active proof tool |
| `CostForgePerfHarness` | CostForge performance harness. | Active perf tool |
| `TerraFusion.CiHints` | CI / regression hint helper used by tests. | Active CI tool |
| `check_core_health.ps1` | Operator-level core-health probe script. | Active script |

## Surface index — by domain

Coarse-grained "where is X" map. For per-row classification (Core
Sync vs. Proof/Admin vs. handoff), see `docs/sync/sync-surface-inventory.md`.

### TerraFusion Sync (the bridge)

| Surface | Path | Status |
|---|---|---|
| Mapping Workbook services | `backend/src/TerraFusion.Sync/Workbench/Mapping/` | Active (Core Sync) |
| Sales comp readers | `backend/src/TerraFusion.Sync/Workbench/Comps/Sales/` | Active (Core Sync + handoffs) |
| PACS schema catalog | `backend/src/TerraFusion.Sync/Workbench/Schema/` | Active (Core Sync) — C48-A through C48-D |
| Source-to-canonical transforms | `backend/src/TerraFusion.Sync/Workbench/Transforms/` | Active (Core Sync) |
| Atlas profiling | `backend/src/TerraFusion.Sync/Workbench/Atlas/` | Active (Core Sync) |
| PACS dictionary loaders | `backend/src/TerraFusion.Sync/Workbench/Pacs/` | Active (Core Sync) |
| Sync API endpoints | `backend/src/TerraFusion.API/Controllers/SyncController.cs` | Active (mixed Core + handoff classification) |
| Canonical landing entities | `backend/src/TerraFusion.Core/Entities/Canonical/` | Active (Core Sync canonical) |
| Canonical EF configurations | `backend/src/TerraFusion.Data/Configurations/Canonical/` | Active (Core Sync canonical) |
| C48-E live-introspection smoke | `backend/artifacts/sync-atlas/c48-e/` | Standalone smoke harness (operator-runnable) |

### Forge (valuation / comps / ratio)

| Surface | Path | Status |
|---|---|---|
| CostForge backend | `backend/src/TerraFusion.CostForge/` | Active (Forge backend lane) |
| CostForge in Core | `backend/src/TerraFusion.Core/CostForge/` | Active (shared types) |
| Forge UI (county studio + statistics) | `frontend/apps/os-shell/src/pages/forge/` | Active (Forge UI lane) |
| Consumer-facing comp API | (not yet built) | Future — will replace `GET /api/sync/comps/eligible` as the consumer surface per `docs/forge/sync-comp-eligibility-handoff.md` |

### TerraFlow (workflow engine)

| Surface | Path | Status |
|---|---|---|
| TerraFlow backend project | (not yet built) | Future product surface |
| TerraFlow handoff contract | `docs/terraflow/sync-handoff.md` | Documented (SCOPE-1) |
| String references in code | 5 files in `backend/src/` mention "TerraFlow" as a concept | Conceptual only — no engine code yet |

### Workbench / Studio (operator shell)

| Surface | Path | Status |
|---|---|---|
| OS shell app | `frontend/apps/os-shell/` | Active (the operator-facing shell) |
| TerraForge UI app | `frontend/apps/terraforge/` | Active |
| Frontend manifests | `frontend/apps/manifests/` | Active |

### Dais / Dossier / TerraAtlas

Not yet implemented as code. Documented in
`docs/architecture/terrafusion-domain-boundaries.md` as future
domains. No backend projects or frontend apps for them today.

## Documentation index

The binding docs (always cite these in new policy work):

| Doc | What it locks |
|---|---|
| `docs/sync/sync-boundary-policy.md` (SCOPE-1) | What Sync owns and does not own |
| `docs/architecture/terrafusion-domain-boundaries.md` (SCOPE-2) | All seven domains + 25-row forbidden-leak table |
| `docs/sync/sync-surface-inventory.md` (SCOPE-3) | Per-surface classification of every existing Sync artifact + future-slice gate |
| `docs/sync/pacs-schema-catalog-as-code-policy.md` (C48-A + binding "Source/target model" section) | PACS schema catalog policy + the corrected vendor framing |
| `docs/terraflow/sync-handoff.md` | TerraFlow consumer-side contract |
| `docs/forge/sync-comp-eligibility-handoff.md` | Forge consumer-side contract |
| `docs/architecture/BOUNDARY_INDEX.md` (REPO-MAP-1) | Top-level cross-reference of every binding boundary doc |

Per-slice policy docs (one per C-series slice) live under `docs/sync/`.
Count: 35+ files. See `docs/sync/README.md` for the indexed list.

## Status conventions

- **Active** — surface is wired and used today.
- **Active (Core Sync)** — Sync-owned permanent responsibility per SCOPE-1.
- **Active (Proof / Admin)** — read-only diagnostic surface; not consumer-facing product API.
- **Active (handoff)** — Sync surface today, consumer-domain long-term.
- **Future** — surface name is reserved / contract documented / no code yet.
- **Parked** — work paused; do not extend unless explicitly resumed.
- **Deprecated** — slated for retirement.

## What this map is NOT

- Not a binding contract. The binding contracts are SCOPE-1, SCOPE-2,
  SCOPE-3, and the per-slice policy docs.
- Not auto-generated. Updated by hand as new domains/surfaces stand up.
  If you find this map stale relative to disk, the next REPO-MAP-N
  slice should refresh it — do not silently let it drift.
- Not a roadmap. See per-domain bring-up slices for sequencing.
