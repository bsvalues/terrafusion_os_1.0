# TerraFusion Architecture — Boundary Index

**Slice:** REPO-MAP-1 (docs-only — single index of every binding
boundary doc in the TerraFusion repository. Use this when starting
new work to make sure you're citing the right contracts.).
**Status:** living index. Refreshed when new boundary docs land.

## Why this doc exists

The repo accumulated boundary corrections across multiple slices
(SCOPE-1, SCOPE-2, SCOPE-3, C48-FIX, C48-FIX2, C48-HYGIENE). Future
slices need a single landing page that says "these are the binding
contracts; cite them or get rejected." This is that landing page.

If you're an agent about to add a new surface, follow this index
top to bottom before writing any policy doc or code.

## The binding ladder (read in order)

Read these from outermost (architecture) to innermost (per-domain).
Each layer constrains the next.

### 1. Architecture-wide domain map

`docs/architecture/terrafusion-domain-boundaries.md` (SCOPE-2)

- Diagram: Sync (bridge) → canonical DB → Forge / TerraFlow / Dais /
  Dossier / Atlas (peers) → Workbench/Studio (shell hosting them).
- Seven domain identity paragraphs (owns / does NOT own / handoff
  cross-references).
- Six cross-domain rules (data flow direction, workflow direction,
  UX direction, evidence/provenance append-only, authn/authz county
  isolation, audit FISMA universal).
- 25-row forbidden ownership leaks table — the explicit "X must not
  implement Y" list.

### 2. Sync-domain boundary

`docs/sync/sync-boundary-policy.md` (SCOPE-1)

- What Sync owns: connections, profiling, dictionary discovery,
  mapping workbook, transforms, canonical landing, provenance,
  active pointer, stale diagnostics, proof endpoints.
- What Sync does NOT own: comp UX, valuation, ratio studies, review
  queues, approvals, notifications, task assignment, consumer
  dashboards.
- Reclassification of every C35–C47 artifact.
- Future binding rule: no new workflow / UX / business-product
  features inside Sync.

### 3. Sync-surface inventory + future-slice gate

`docs/sync/sync-surface-inventory.md` (SCOPE-3)

- Per-surface row: Surface / Location / Classification / Long-term
  owner / Rule. 8 categories: tables, transforms, in-process
  services, HTTP endpoints, CLI tools, dictionary loaders, review
  exports, cross-cutting infra.
- Six classification labels (Core Sync / Proof-Admin / Forge handoff
  / TerraFlow handoff / Studio handoff / Deprecated).
- Aggregate handoff matrix.
- Future-slice gate: every future Sync-adjacent slice MUST cite its
  inventory row, match the classification's allowed-work envelope,
  and cross-reference the right SCOPE-1/SCOPE-2/SCOPE-3 doc.

### 4. Per-domain handoff contracts

| Doc | Pair |
|---|---|
| `docs/terraflow/sync-handoff.md` | TerraFlow ↔ Sync (workflow engine consumer side) |
| `docs/forge/sync-comp-eligibility-handoff.md` | Forge ↔ Sync (comp data consumer side) |

Future per-domain handoff docs land here as new domains stand up
(Dais, Dossier, TerraAtlas, Workbench/Studio).

### 5. PACS schema catalog (C48 family)

`docs/sync/pacs-schema-catalog-as-code-policy.md` (C48-A + binding
"Source / target model" section, C48-FIX2 anchored)

- Catalog identity: read-only metadata, NOT runtime data store.
- Seven hard guards (HG1 PII-free / HG2 county-agnostic /
  HG3 read-only at runtime / HG4 versioned / HG5 conversion-aware /
  HG6 source-traceable / HG7 fail-closed).
- The corrected source/target model (binding):

  ```text
  Harris PACS 9.0  ────► TerraFusion Sync ────►  TerraFusion DB
     (legacy source)        (bridge)              (target)
  ```

- ProVal / Ascend = historical-provenance footnotes only.
- Tyler Vision = NOT in Benton's stack and never was. Vestigial
  drift swept by C48-FIX, C48-FIX2, C48-HYGIENE.

### 6. Per-slice policy docs

For domain-specific work, also read the per-slice policy doc cited
by the surface inventory row. Examples:

- Comp eligibility filter: `docs/sync/sales-comp-eligibility-filter-policy.md`
- Stale-summary endpoint: `docs/sync/sync-comps-stale-summary-endpoint-policy.md`
- HTTP cache headers: `docs/sync/sync-comps-api-caching-headers-policy.md`
- Active workbook pointer: `docs/sync/sync-county-active-workbook-pointer-policy.md`
- Canonical sale qualification landing schema: `docs/sync/canonical-sales-qualification-landing-schema-policy.md`

See `docs/sync/README.md` for the full per-slice doc list.

## Stale-lore tombstones (do not resurrect)

These are the C48-FIX2 / C48-HYGIENE corrected-framing anchors. If
a future agent or doc tries to say any of the LEFT side, they must
cite this index and use the RIGHT side instead.

| Stale lore (forbidden) | Corrected truth (binding) |
|---|---|
| Tyler Vision is a Benton integration | Tyler Vision is NOT in Benton's stack and never was. Benton's stack is Harris PACS 9.0 + ProVal (historical) + Ascend (historical). |
| PACS is a destination | PACS is the **legacy source** TerraFusion Sync converts FROM. TerraFusion DB is the destination Sync writes INTO. |
| ProVal / Ascend are active runtime sources | ProVal / Ascend are **historical conversion provenance only** — they explain PACS data semantics but are not active runtime sources. |
| `TylerRelease` field on schema metadata | `PacsRelease` (renamed in C48-FIX). |
| TerraFlow is a Sync console / Sync UI wrapper | TerraFlow is its own AI-native workflow engine + product surface. NOT a console for any other domain. |
| Sync owns comp scoring / ranking / valuation | Forge owns comp scoring / ranking / valuation. Sync is the bridge that emits canonical rows. |
| Sync owns workflow / approvals / task routing | TerraFlow owns workflow / approvals / task routing. |

Any doc or code that contradicts the right column gets a follow-on
correction slice. The hygiene chain (C48-FIX → C48-FIX2 →
C48-HYGIENE) is the template.

## Cross-cutting rules (always true)

These apply regardless of which domain you're working in.

- **Sovereign-county isolation.** Every API enforces server-side
  `CountyId` from the authenticated principal — never from a
  request body. Multi-county operations require explicit compliance
  approval. (See SCOPE-2 §8.5.)
- **FISMA-HIGH audit fields.** `CreatedAt` / `CreatedBy` /
  `UpdatedAt` / `UpdatedBy` auto-populated by
  `AuditableEntityInterceptor`. Never modified from outside. (See
  CLAUDE.md and SCOPE-2 §8.6.)
- **Provenance is append-only across handoffs.** Downstream products
  surface provenance verbatim (`SourceWorkbookId`,
  `SourceWorkbookLockedAt`, future `SourceSchemaVersion`); they
  never strip or re-stamp it. (See SCOPE-2 §8.4.)
- **Read-only proof endpoints stay read-only.** Surfaces classified
  Proof / Admin in the SCOPE-3 inventory MUST NOT be repositioned
  as consumer-facing product APIs. The classification IS the
  contract.

## Quick lookup

| Question | Answer |
|---|---|
| Where does Sync code live? | `backend/src/TerraFusion.Sync/Workbench/` (subnamespaces: Atlas / Comps / Mapping / Pacs / Schema / Transforms) |
| Where do Sync HTTP endpoints live? | `backend/src/TerraFusion.API/Controllers/SyncController.cs` |
| Where do canonical landing entities live? | `backend/src/TerraFusion.Core/Entities/Canonical/` |
| Where are Sync proof tools? | `backend/tools/SyncAtlas/`, `backend/tools/SalesCompProof/` |
| Which domain owns comp scoring? | Forge (`docs/forge/sync-comp-eligibility-handoff.md`) |
| Which domain owns workflow? | TerraFlow (`docs/terraflow/sync-handoff.md`) |
| Where is the schema catalog? | `backend/src/TerraFusion.Sync/Workbench/Schema/` (C48-A through C48-D) |
| Where is the C48-E live-introspection smoke? | `backend/artifacts/sync-atlas/c48-e/` |
| Is Tyler Vision in Benton? | No. Never was. |
| Is PACS a destination? | No. PACS is the legacy SOURCE. TerraFusion DB is the destination. |

## How to extend this index

When a new boundary doc lands:
1. Add it to the appropriate section above.
2. If it introduces a new corrected-framing anchor, add a row to
   the "Stale-lore tombstones" table.
3. Update the "Quick lookup" table if it answers a frequently-asked
   navigation question.

When a doc becomes stale or is superseded:
1. Mark it deprecated in `docs/sync/README.md`.
2. Add a forward-pointer to the replacement doc.
3. Do not delete — preserve for git-archaeology.
