# TerraFusion Sync Surface Inventory and Handoff Matrix

**Slice:** SCOPE-3 (docs-only — applies the SCOPE-1/SCOPE-2
boundary trilogy to every Sync-adjacent surface that exists on
disk today. One row per surface. Each row classifies the surface
as Core Sync, Proof/Admin, Forge handoff, TerraFlow handoff,
Studio handoff, or Deprecated, and names its long-term owner. No
code is moved, renamed, or deleted in this slice — classification
only.).
**Lifecycle layer:** Sync-domain inventory + cross-domain handoff
matrix. Cross-references SCOPE-1 boundary policy and SCOPE-2
architecture domain map.
**Status:** policy locked; classification of every existing
C-series and earlier Sync artifact recorded; binding on all
future Sync-adjacent slices.

**Authoritative cross-references:**
- `docs/architecture/terrafusion-domain-boundaries.md` (SCOPE-2,
  full seven-domain map, 25-row forbidden-leaks table)
- `docs/sync/sync-boundary-policy.md` (SCOPE-1, what Sync owns
  and does not own)
- `docs/terraflow/sync-handoff.md` (SCOPE-1, TerraFlow consumer
  contract)
- `docs/forge/sync-comp-eligibility-handoff.md` (SCOPE-1, Forge
  consumer contract for comp data)

## Why this slice

SCOPE-1 and SCOPE-2 fixed the architectural boundary. The repo
still holds dozens of C-series and pre-C-series artifacts that
were built **inside Sync** during a period when the boundary was
unclear. A future agent who sees `GET /api/sync/comps/eligible`
without context could reasonably conclude Sync owns the comp
product surface — and start extending it. SCOPE-3 closes that
hole by walking every surface and writing down what it is.

The boundary signs are installed. SCOPE-3 labels the doors so
the goblin does not wander into Forge wearing a Sync hat.

## Classification labels

Each row in the inventory carries one of six labels. The labels
are mutually exclusive.

| Label | Meaning |
|---|---|
| **Core Sync** | Permanent Sync responsibility per SCOPE-1. Sync owns this for its lifetime. New work in this category is allowed inside Sync. |
| **Proof / Admin** | Read-only surface that exists to verify or administer the bridge. May stay in Sync forever as a diagnostic surface. NOT a consumer-facing product API. New "proof / admin" surfaces are allowed but each MUST be tagged that way in its policy doc. |
| **Forge handoff** | Surface that downstream Forge consumers may use today as a transitional bridge. Long-term, Forge stands up its own consumer-facing equivalent. The Sync surface stays callable as admin/diagnostic; it is NOT extended with comp/valuation/ranking behavior. |
| **TerraFlow handoff** | Surface that produces signal which TerraFlow consumes for workflow purposes (e.g. stale rows feed remediation workflows). Sync emits; TerraFlow orchestrates. |
| **Studio handoff** | Surface that should ultimately be presented through Workbench/Studio (as operator UX) rather than as a raw API or CLI. Studio is the shell; Sync provides the data. |
| **Deprecated / do-not-expand** | Surface that is callable today for backward compatibility but MUST NOT receive new features. Slated for retirement when its consumer migrates. |

## "Do not expand inside Sync" rule

For any row classified as **Forge handoff**, **TerraFlow
handoff**, or **Studio handoff**, the binding rule is:

> The Sync surface stays at its current scope. New
> comp/workflow/UX features land in the long-term-owner domain,
> NOT inside Sync. The Sync surface MAY receive bug fixes,
> security patches, performance work, and additive caching, but
> NOT new product behavior.

For any row classified as **Proof / Admin**, the binding rule is:

> The surface MAY receive additive diagnostic capability (more
> fields, more drill-down, better cache control) but MUST NOT be
> repositioned as a consumer-facing product API. Its policy doc
> MUST keep the "proof / admin, not consumer-facing product API"
> tag.

## Inventory — by category

### Category 1 — Tables / data model

| Surface | Location | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| `SyncMappingWorkbook` (workbook header) | TerraFusion.Data — Sync schema | Core Sync | Sync | Mapping workbook data model. Permanent. |
| `SyncMappingWorkbookColumn` (per-column mapping rows) | TerraFusion.Data — Sync schema | Core Sync | Sync | Per-column mapping decisions. Permanent. |
| `SyncCountyActiveWorkbook` (active pointer table) | TerraFusion.Data — Sync schema | Core Sync | Sync | County-scoped active-workbook pointer. PK = CountyId. Permanent. |
| `CanonicalSaleQualifications` (sales canonical landing) | TerraFusion.Data — canonical schema | Core Sync | Sync | Canonical sale qualification landing rows with provenance. PII-free. Permanent. |
| Source connection records / atlas profiling artifacts | TerraFusion.Data — Sync schema | Core Sync | Sync | Source-connection metadata + profiling output. Permanent. |
| Future canonical valuation / improvement / land tables | (not yet on disk) | Core Sync (planned) | Sync | Same shape contract as `CanonicalSaleQualifications`. Future C-series. |

### Category 2 — Source-to-canonical transforms

| Surface | Location | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| `SalesQualificationCanonicalRunner` | TerraFusion.Sync.Workbench/Transforms/Sales | Core Sync | Sync | 5-status → 3-status mapping; idempotent upsert; supersession. Permanent. |
| Future valuation / improvement / land canonical runners | (not yet on disk) | Core Sync (planned) | Sync | Mirrors sales transform shape. |

### Category 3 — Resolvers + read services (in-process)

| Surface | Location | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| `WorkbookIdResolver` (explicit > pointer > fail-closed) | TerraFusion.Sync.Workbench/Mapping | Core Sync | Sync | Resolves the baseline workbook for any read. Permanent. |
| `SyncCountyActiveWorkbookService` | TerraFusion.Sync.Workbench/Mapping | Core Sync | Sync | Reads + mutates the pointer (Mapped-only, county-scoped). Permanent. |
| `ISalesCompEligibilityReader` | TerraFusion.Sync.Workbench/Comps/Sales | Forge handoff | Sync (today) → Forge (long-term) | Read-only canonical sale eligibility. Forge will eventually read directly from the canonical table. Sync reader stays as diagnostic. |
| `ISalesCompStaleReader` | TerraFusion.Sync.Workbench/Comps/Sales | TerraFlow handoff | Sync (detect) + TerraFlow (remediate) | Sync detects stale rows; TerraFlow's workflow decides what happens next. |
| `ISalesCompStaleSummaryReader` | TerraFusion.Sync.Workbench/Comps/Sales | TerraFlow handoff | Sync (detect) + TerraFlow (remediate) | Per-group summary; same handoff as the per-row stale reader. |
| `IPacsSchemaCatalog` (C48-B) | TerraFusion.Sync.Workbench/Schema | Core Sync | Sync | In-process metadata catalog for PACS schema. Singleton, read-only at runtime (HG3). Constructed once from an `IPacsSchemaSource`. |
| `IPacsSchemaSource` + `InMemoryPacsSchemaSource` (C48-B) | TerraFusion.Sync.Workbench/Schema | Core Sync | Sync | Source abstraction for the catalog. In-memory fixture variant for tests + initial wiring. |
| `LivePacsSchemaSource` + `IPacsSchemaIntrospector` + `SqlInformationSchemaIntrospector` (C48-C) | TerraFusion.Sync.Workbench/Schema | Core Sync | Sync | Live-DB introspection variant. Reads `INFORMATION_SCHEMA` from Harris PACS (the legacy SOURCE database, never TerraFusion DB). PII-free by query design (HG1). |
| `PacsSchemaCatalogHealthCheck` (C48-B) | TerraFusion.Sync.Workbench/Schema | Proof / Admin | Sync | Coverage-floor health check for the catalog. Reports Healthy when meets floor; Degraded when below. |

### Category 4 — HTTP endpoints

| Surface | Route | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| Comp eligibility read | `GET /api/sync/comps/eligible` | Forge handoff (transitional) | Forge (consumer-facing comp API) | Stays callable as admin/diagnostic. Forge will stand up its own consumer-facing comp API on top of `CanonicalSaleQualifications`. **No comp scoring, ranking, or selection logic added to this Sync endpoint.** |
| Stale per-row diagnostic | `GET /api/sync/comps/stale` | TerraFlow handoff | Sync (signal) + TerraFlow (workflow) | Diagnostic surface; TerraFlow consumes the signal. |
| Stale summary | `GET /api/sync/comps/stale/summary` | TerraFlow handoff | Sync (signal) + TerraFlow (workflow) | Per-group summary, max 100 groups. Same handoff. |
| Active workbook GET | `GET /api/sync/active-workbook` | Core Sync | Sync | Read of pointer. Permanent. |
| Active workbook PUT | `PUT /api/sync/active-workbook` | Core Sync | Sync | Pointer mutation (Mapped-only, county-scoped). TerraFlow MAY call after approval workflows; Sync enforces the rules. |
| HEAD variants on cache-aware endpoints | `HEAD /api/sync/...` | Proof / Admin | Sync | Part of the C45 HTTP cache contract. Permanent. |
| Schema catalog summary (C48-D) | `GET /api/sync/schema/catalog/summary` | Proof / Admin | Sync | Surfaces catalog coverage counts + version stamp. Returns `Configured = false` when the live catalog has not been opt-in-registered (no `ConnectionStrings:HarrisPacs`). PII-free by construction (HG1). NOT a consumer-facing product API; long-term operator-facing schema browsing UX would belong to Workbench/Studio. |

### Category 5 — CLI tools

| Surface | Location | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| `SalesCompProof` | backend/tools/SalesCompProof | Proof / Admin | Sync (regression / proof harness) | Proves canonical output end-to-end. NOT a consumer UX. NOT a workflow surface. |
| `SyncAtlas` (multiple modes) | backend/tools/SyncAtlas | Proof / Admin | Sync (admin / profiling) | Source profiling + atlas administration. Internal admin tool. |
| Mapping workbook edit CLI | per-policy under docs/sync/mapping-workbook-edit-cli-policy.md | Proof / Admin → Studio handoff | Sync (today) → Workbench/Studio (long-term operator UX) | Today a CLI; long-term an operator-facing surface lives in Workbench/Studio. CLI stays callable. |
| Mapping workbook lock CLI | per-policy under docs/sync/mapping-workbook-lock-cli-policy.md | Proof / Admin → Studio handoff | Sync (today) → Workbench/Studio + TerraFlow (lock-approval workflow) | Today a CLI; long-term lock-approval is a TerraFlow workflow with a Studio UI; Sync still enforces the lock state. |
| Mapping workbook batch edit CLI | per-policy under docs/sync/mapping-workbook-batch-edit-policy.md | Proof / Admin → Studio handoff | Sync (today) → Workbench/Studio (long-term) | Same as edit CLI. |

### Category 6 — Dictionary loaders

| Surface | Policy doc | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| `imprv-det-class` dictionary loader | docs/sync/imprv-det-class-dictionary-loader-policy.md | Core Sync | Sync | Dictionary discovery is Sync-owned by SCOPE-1. |
| `imprv-det-meth` dictionary loader | docs/sync/imprv-det-meth-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `imprv-det-sub-class` dictionary loader | docs/sync/imprv-det-sub-class-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `imprv-primary-use` dictionary loader | docs/sync/imprv-primary-use-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `imprv-secondary-use` dictionary loader | docs/sync/imprv-secondary-use-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `land-soil` dictionary loader | docs/sync/land-soil-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `property-use` dictionary loader | docs/sync/property-use-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `property-val-secondary-use` dictionary loader | docs/sync/property-val-secondary-use-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `sale-primary-use` dictionary loader | docs/sync/sale-primary-use-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `sale-secondary-use` dictionary loader | docs/sync/sale-secondary-use-dictionary-loader-policy.md | Core Sync | Sync | Same. |
| `pacs-canonical-dictionaries-reference` | docs/sync/pacs-canonical-dictionaries-reference.md | Core Sync | Sync | Reference compendium for the loaders above. |

### Category 7 — Review / CSV export surfaces

| Surface | Policy doc | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| Improvement review CSV | docs/sync/improvement-review-csv-policy.md | Proof / Admin → Studio handoff | Sync emits; Studio surfaces (long-term) | CSV export is a transitional review surface; long-term operator UX lives in Studio. |
| Land review CSV | docs/sync/land-review-csv-policy.md | Proof / Admin → Studio handoff | Sync emits; Studio surfaces | Same. |
| Neighborhood review CSV | docs/sync/neighborhood-review-csv-policy.md | Proof / Admin → Studio handoff | Sync emits; Studio surfaces | Same. |
| Sales review CSV | docs/sync/sales-review-csv-policy.md | Proof / Admin → Studio handoff | Sync emits; Studio surfaces | Same. |
| Valuation review CSV | docs/sync/valuation-review-csv-policy.md | Proof / Admin → Studio handoff | Sync emits; Studio surfaces | Same. |
| Mapping workbook review progress | docs/sync/mapping-workbook-review-progress-policy.md | Proof / Admin → Studio handoff + TerraFlow handoff | Sync (signal) + Studio (presentation) + TerraFlow (queueing) | Progress signal feeds both operator UX (Studio) and review workflows (TerraFlow). |

### Category 8 — Cross-cutting infrastructure

| Surface | Location / Policy | Classification | Long-term owner | Rule |
|---|---|---|---|---|
| HTTP cache contract (C45 family) — strong scope-prefixed ETags, `If-None-Match`, `If-Modified-Since`, `If-Match`, `Vary: Authorization`, HEAD support, `stale-while-revalidate=120` on comps endpoints | docs/sync/sync-comps-api-caching-headers-policy.md + SyncHttpCacheHeaders.cs | Core Sync (pattern) | Sync (for Sync surfaces); Forge / TerraFlow / Studio MAY reuse the pattern on their own surfaces | The pattern is reusable. The infrastructure code lives in Sync because Sync's read endpoints were the first to need it. |
| Workbook-name enrichment on stale-summary (C46) | docs/sync/sync-comps-stale-summary-workbook-name-enrichment-policy.md | TerraFlow handoff (additive) | Sync (lookup) + TerraFlow (presentation context) | Diagnostic ergonomics. Cache-key invariant by design. Do not extend with operator-typed UX inside Sync. |
| Workbook-name enrichment on active-workbook (C47) | docs/sync/sync-county-active-workbook-pointer-policy.md (C47-A section) | Core Sync (additive) | Sync | Pointer ergonomics. Same cache-key invariance. |
| `AuditableEntityInterceptor` (FISMA `CreatedAt` / `CreatedBy` / `UpdatedAt` / `UpdatedBy` auto-population) | TerraFusion.Data | Cross-cutting (all domains) | All domains inherit; not Sync-specific | Universal contract per SCOPE-2 §8.6. |
| Sovereign-county isolation (server-side `CountyId` from principal claim) | every controller / service / reader | Cross-cutting (all domains) | All domains enforce | Universal contract per SCOPE-2 §8.5. |
| `pacs-canonical-dataflow-identity-policy.md` | docs/sync/pacs-canonical-dataflow-identity-policy.md | Core Sync (reference) | Sync | Identity semantics for canonical rows. Reference doc. |

## Aggregate handoff matrix

Compressed view of the inventory — which downstream domain each Sync surface ultimately lands in.

| Sync surface group | Stays in Sync forever | Forge handoff | TerraFlow handoff | Studio handoff | Deprecated |
|---|---|---|---|---|---|
| Tables / canonical landing | ✅ | — | — | — | — |
| Source-to-canonical transforms | ✅ | — | — | — | — |
| Resolvers (workbook id, pointer service) | ✅ | — | — | — | — |
| Comp eligibility reader / endpoint | ✅ (as diagnostic) | ✅ (consumer-facing API stands up in Forge) | — | — | — |
| Stale per-row + per-group readers | ✅ (as detection) | — | ✅ (workflow remediation) | — | — |
| Active workbook pointer (read + PUT) | ✅ | — | — (TerraFlow MAY call PUT after approval) | — | — |
| HTTP cache infrastructure (C45) | ✅ (pattern + impl) | reusable | reusable | reusable | — |
| Dictionary loaders | ✅ | — | — | — | — |
| Review / CSV exports | ✅ (as transitional) | — | partial (review queues) | ✅ (long-term operator UX) | — |
| CLI tools (mapping workbook edit / lock / batch) | ✅ (as admin) | — | partial (lock-approval workflow) | ✅ (long-term operator UX) | — |
| Proof tools (`SalesCompProof`, `SyncAtlas`) | ✅ | — | — | — | — |

No surface is currently in **Deprecated**. Every C-series and pre-C-series surface has a legitimate ongoing role; the question is only whether new product features land in Sync or in the consumer domain. For every "handoff" row, new product features land **in the consumer domain**, not in Sync.

## Future-slice gate (binding)

When a future slice proposes work that touches any surface in this inventory, the slice MUST answer:

1. **Which row in this inventory does the surface belong to?** If the answer is "none — it's a new surface," the slice MUST add the row in its own policy doc and classify it.
2. **Is the slice work consistent with the row's classification?**
   - **Core Sync** rows: any additive work is allowed.
   - **Proof / Admin** rows: only diagnostic / cache / additive work; no consumer-product repositioning.
   - **Forge / TerraFlow / Studio handoff** rows: only bug fixes, security, performance, and additive caching. **No new product behavior.** New product behavior opens a slice in the consumer domain.
   - **Deprecated** rows (currently empty): no new work; only retirement.
3. **Is the slice's policy doc cross-referencing the right SCOPE-1 / SCOPE-2 docs?** Forge work cites `docs/forge/sync-comp-eligibility-handoff.md`; TerraFlow work cites `docs/terraflow/sync-handoff.md`; architecture-touching work cites `docs/architecture/terrafusion-domain-boundaries.md`.

A slice that fails any of these checks is rejected on boundary grounds and reframed in the correct domain.

## Acceptance for SCOPE-3

- `docs/sync/sync-surface-inventory.md` exists with a per-surface row for every existing C-series and pre-C-series Sync artifact, organized by category.
- `docs/forge/sync-comp-eligibility-handoff.md` and `docs/terraflow/sync-handoff.md` carry a cross-reference at the top pointing to this inventory, so the doc family is discoverable.
- No code is modified. No tests added. No regression run required.
- Future-slice gate is now binding on all Sync-adjacent slices.

## Non-goals

- **No code moves.** No file is renamed, relocated, or retired.
- **No deprecation.** Every surface in the inventory stays callable.
- **No domain bring-up.** Forge consumer-facing comp API, TerraFlow workflow engine, and Studio operator UX all remain at their current implementation level (mostly unbuilt). SCOPE-3 only writes down where work goes when those domains stand up.
- **No new tests.** Documentation slice. Regression baseline preserved by construction.

## Open questions (deferred to per-domain bring-up slices)

- **Direct DB read vs. API consumption from Forge.** When Forge stands up its consumer-facing comp API, does it read `CanonicalSaleQualifications` directly via EF Core (same DB, separation by interface) or via a dedicated read API? Tradeoff between coupling and latency.
- **TerraFlow event subscription model.** When TerraFlow stands up its workflow engine, does it subscribe to Sync events ("workbook locked", "stale rows detected", "pointer rotated") via an in-process bus, a durable event log, or by polling existing read endpoints?
- **Studio surface for mapping workbook edits.** When Studio surfaces mapping-workbook editing as operator UX, does it embed the existing CLI's logic via a service interface, or reimplement against the same data model?
- **CSV export retirement timing.** When Studio's review surfaces are live, the CSV exports become legacy. SCOPE-3 keeps them as transitional; the deprecation slice happens later, not here.

These are bring-up concerns for the consumer domains and will be resolved in those domains' opening slices, not in Sync.
