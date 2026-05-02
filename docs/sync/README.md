# `docs/sync/` — TerraFusion Sync Documentation Index

**Slice:** REPO-MAP-1 (docs-only — single entry point into the
TerraFusion Sync documentation tree. Replaces the implicit "grep and
hope" workflow with a curated index of every Sync policy and
reference doc on disk.).
**Status:** living index. Refreshed when new Sync slices land.

## Reading order for first-time agents

If you're an agent or developer touching Sync for the first time,
read these four docs in order. Skip nothing. They are the binding
contracts every Sync slice must obey.

1. `sync-boundary-policy.md` — SCOPE-1. What Sync owns and what it
   does NOT own. The original boundary correction.
2. `../architecture/terrafusion-domain-boundaries.md` — SCOPE-2.
   All seven TerraFusion domains, six cross-domain rules, 25-row
   forbidden-leak table.
3. `sync-surface-inventory.md` — SCOPE-3. Per-surface classification
   of every existing Sync artifact + the future-slice gate.
4. `pacs-schema-catalog-as-code-policy.md` — C48-A + the binding
   "Source / target model" section (C48-FIX2 anchored). The
   Harris-PACS-as-legacy-source vs. TerraFusion-DB-as-target
   framing.

After those four, return here for per-slice policy docs as needed.

## Source / target binding (always true)

```text
Harris PACS 9.0  ────► TerraFusion Sync ────►  TerraFusion DB
   (legacy source)        (bridge)              (target)
```

ProVal / Ascend appear ONLY as historical conversion-provenance
footnotes. Tyler Vision is NOT in Benton's stack and never was.
Vestigial drift was swept by C48-FIX, C48-FIX2, and C48-HYGIENE.

## Where Sync code lives

| Layer | Path |
|---|---|
| Sync workbench (the bridge mechanics) | `backend/src/TerraFusion.Sync/Workbench/` |
| Mapping workbook services | `backend/src/TerraFusion.Sync/Workbench/Mapping/` |
| Sales comp readers | `backend/src/TerraFusion.Sync/Workbench/Comps/Sales/` |
| PACS schema catalog | `backend/src/TerraFusion.Sync/Workbench/Schema/` |
| Source-to-canonical transforms | `backend/src/TerraFusion.Sync/Workbench/Transforms/` |
| Atlas profiling | `backend/src/TerraFusion.Sync/Workbench/Atlas/` |
| PACS dictionary loaders | `backend/src/TerraFusion.Sync/Workbench/Pacs/` |
| Sync HTTP endpoints | `backend/src/TerraFusion.API/Controllers/SyncController.cs` |
| Canonical landing entities | `backend/src/TerraFusion.Core/Entities/Canonical/` |
| Canonical EF configurations | `backend/src/TerraFusion.Data/Configurations/Canonical/` |
| Sync proof / admin tools | `backend/tools/SyncAtlas/`, `backend/tools/SalesCompProof/` |
| Sync unit tests | `backend/tests/TerraFusion.Unit.Tests/Sync/` |
| Sync integration tests | `backend/tests/TerraFusion.Integration.Tests/Sync/` |
| C48-E live-introspection smoke | `backend/artifacts/sync-atlas/c48-e/` |

## Doc family

### Boundary + scope (binding)

- `sync-boundary-policy.md` — SCOPE-1 — what Sync owns / does not own
- `sync-surface-inventory.md` — SCOPE-3 — per-surface classification
  + future-slice gate
- `benton-core-sync-next-need.md` — BENTON-SYNC-1 — current Benton
  Core Sync next-need inventory + named default implementation slice
- `benton-pacs-catalog-health-baseline.md` — BENTON-SYNC-4 — committed
  evidence baseline of the live Benton schema-catalog health output
- `dictionary-loader-preflight-evidence-policy.md` — BENTON-SYNC-6-A —
  artifact shape and CLI engagement model for rolling per-loader FK /
  era / PII preflight outcomes into byte-stable JSON evidence
- `benton-dictionary-loader-preflight-evidence-baseline.md` —
  BENTON-SYNC-6-C — committed evidence baseline of the live Benton
  preflight evidence artifact, with the BENTON-SYNC-6-A policy /
  BENTON-SYNC-6-B implementation drift reconciliation
- `sales-qualification-coverage-continuity-smoke-policy.md` —
  BENTON-SYNC-7-A — read-only smoke that proves every PACS sale row
  the C8-B transform would persist has a matching canonical row, and
  every canonical row traces back to its PACS source. CLI surface,
  report shape, hard guards, and BENTON-SYNC-7-B test matrix.
- `benton-sales-qualification-coverage-baseline.md` —
  BENTON-SYNC-7-C — committed evidence baseline of the live Benton
  coverage smoke artifact (CLEAN Training run + GAPS OLTP run),
  with deferred-test-matrix-gate resolution table.
- `benton-sync-diagnostic-track-completion-handoff.md` —
  **BENTON-SYNC-8 — closeout handoff capping the diagnostic-first
  Benton Sync track.** Pins the four completed diagnostic surfaces,
  per-surface re-open conditions, parked-item gates, and the
  default-promotion-rule note that no engineering-sequence default
  remains post-closeout.

### Schema catalog (C48 family — COMPLETE)

The C48 implementation arc is complete. See
`pacs-schema-catalog-completion-handoff.md` for the closure marker
and the deferred-new-scope index. Reopen C48 only on hard-guard
violation; new work uses new slice prefixes.

- `pacs-schema-catalog-completion-handoff.md` — **C48-CLOSE
  completion handoff** (closure marker, deferred-scope index, full
  C48-A→C48-P arc table)
- `pacs-schema-catalog-as-code-policy.md` — C48-A policy + binding
  source/target model + the seven hard guards
- `pacs-canonical-dictionaries-reference.md` — human-readable
  dictionary compendium
- `pacs-canonical-dataflow-identity-policy.md` — canonical identity
  tuples (D0-D)

### Comps API / read surfaces (C37–C46 family)

- `sync-comps-api-endpoint-policy.md`
- `sync-comps-api-pagination-policy.md`
- `sync-comps-api-caching-headers-policy.md`
- `sync-comps-stale-diagnostic-endpoint-policy.md`
- `sync-comps-stale-summary-endpoint-policy.md`
- `sync-comps-stale-summary-workbook-name-enrichment-policy.md`
- `sales-comp-eligibility-filter-policy.md`
- `sales-qualification-transform-policy.md`
- `canonical-sales-qualification-landing-schema-policy.md`

### Active workbook pointer

- `sync-county-active-workbook-pointer-policy.md`
- `workbook-lock-lifecycle-and-canonical-staleness-policy.md`

### Mapping workbook

- `mapping-workbook-seed.md`
- `mapping-workbook-edit-cli-policy.md`
- `mapping-workbook-batch-edit-policy.md`
- `mapping-workbook-lock-cli-policy.md`
- `mapping-workbook-column-terminalization-policy.md`
- `mapping-workbook-review-progress-policy.md`

### Dictionary loaders

- `imprv-det-class-dictionary-loader-policy.md`
- `imprv-det-meth-dictionary-loader-policy.md`
- `imprv-det-sub-class-dictionary-loader-policy.md`
- `imprv-primary-use-dictionary-loader-policy.md`
- `imprv-secondary-use-dictionary-loader-policy.md`
- `land-soil-dictionary-loader-policy.md`
- `property-use-dictionary-loader-policy.md`
- `property-val-secondary-use-dictionary-loader-policy.md`
- `sale-primary-use-dictionary-loader-policy.md`
- `sale-secondary-use-dictionary-loader-policy.md`

### Review / CSV exports

- `improvement-review-csv-policy.md`
- `land-review-csv-policy.md`
- `neighborhood-review-csv-policy.md`
- `sales-review-csv-policy.md`
- `valuation-review-csv-policy.md`

### Atlas profiling

- `atlas-profile.md`

## Sync HTTP endpoints (current state)

All under `/api/sync/`. Authoritative source is
`backend/src/TerraFusion.API/Controllers/SyncController.cs`.

| Method + Route | Purpose | Classification |
|---|---|---|
| `POST /api/sync/requalify/{countyId}` | Recompute QualificationRecommendation for a county | Core Sync |
| `GET /api/sync/qualification-status/{countyId}` | Pipeline-status diagnostic | Core Sync |
| `POST /api/sync/backfill-ratios/{countyId}` | Backfill cached ratios | Core Sync |
| `POST /api/sync/backfill-neighborhoods/{countyId}` | Backfill neighborhood denormalizations | Core Sync |
| `GET /api/sync/comps/eligible` (+ HEAD) | Paginated read of Qualified canonical sales | Forge handoff (transitional) |
| `GET /api/sync/active-workbook` (+ HEAD) | Read pointer | Core Sync |
| `PUT /api/sync/active-workbook` | Promote workbook (Mapped-only, county-scoped) | Core Sync |
| `DELETE /api/sync/active-workbook` | Clear pointer | Core Sync |
| `GET /api/sync/comps/stale` (+ HEAD) | Per-row staleness diagnostic | TerraFlow handoff |
| `GET /api/sync/comps/stale/summary` (+ HEAD) | Per-group summary | TerraFlow handoff |
| `GET /api/sync/schema/catalog/summary` | Schema catalog admin/diagnostic | Proof / Admin (C48-D) |

For per-route hard guards, identity tuples, and cache contracts,
see the per-slice policy doc named above.

## How to find Sync code fast

```bash
# Bash:
./scripts/dev/find-terrafusion-surface.sh sync
./scripts/dev/find-terrafusion-surface.sh workbook
./scripts/dev/find-terrafusion-surface.sh comps
./scripts/dev/find-terrafusion-surface.sh schema

# PowerShell:
.\scripts\dev\find-terrafusion-surface.ps1 sync
```

Topics: `sync` / `workbook` / `comps` / `schema` / `terraflow`.

## When to extend this index

- A new Sync slice lands a new policy doc → add it here under the
  appropriate section.
- A new Sync code namespace stands up under `Workbench/` → add it to
  the "Where Sync code lives" table.
- A new endpoint lands → add it to the endpoint table.

If a doc is referenced by binding policy but missing here, that's a
findability bug. Open a follow-on REPO-MAP-N slice to fix it.
