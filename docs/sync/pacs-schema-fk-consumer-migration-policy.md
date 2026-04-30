# PACS Schema Catalog — FK Consumer Migration Policy

**Slice:** C49-FK-C (docs-only — defines the contract for the first
production consumer to bind to the C49-FK-B foreign-key edge data.
C49-FK-D will land the implementation against this contract.).
**Lifecycle layer:** Core Sync — schema-catalog consumer policy.
Extends the C49-FK arc; does NOT reopen C48.
**Status:** policy locked; C49-FK-D implementation deferred.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-foreign-key-inference-policy.md` —
  C49-FK-A (FK data model + confidence levels + advisory-only
  rule). Hard guards HG-FK-1 / HG-FK-2 from there continue to
  apply unchanged.
- `docs/sync/pacs-schema-catalog-completion-handoff.md` —
  C48-CLOSE marker + deferred-scope index.
- `docs/sync/sync-boundary-policy.md` (SCOPE-1).
- `docs/architecture/terrafusion-domain-boundaries.md` (SCOPE-2).

## Why this slice

C49-FK-B added 1633 FK edges (912 declared + 721 inferred) to the
catalog. No production code path uses any of them yet. Before any
reader, transform, dictionary loader, or canonical writer binds
itself to FK metadata, this slice locks:

1. **Which consumer migrates first.** Picking deliberately, with
   reasons, to avoid the same drift the C48 catalog was designed to
   prevent — agents confidently consuming the wrong edges.
2. **What confidence level production code may consult.** Per
   HG-FK-2: never `InferredByName`. This slice writes the rule
   down explicitly so a future migration cannot accidentally bypass
   it.
3. **What "FK missing" means** at runtime. Two cases — required FK
   missing is fail-closed; advisory FK missing is diagnostic-only
   — and the consumer declares which is which per call site.
4. **The C49-FK-D test matrix** so implementation lands against a
   pre-locked acceptance shape, not vibes.

## First consumer category (binding)

**Dictionary-loader preflight validation** is the first authorized
FK consumer. C49-FK-D will implement it.

Rationale, in order of importance:

1. **Already catalog-driven.** Per C48-G + C48-H through C48-P, all
   ten SyncAtlas dictionary-loader configKey arms now construct
   their `DictionaryLoaderTargetConfig` + `DictionaryColumnConfig`
   from the catalog. Adding a preflight FK check is one more
   catalog lookup at the same call site — no new architecture.
2. **Already heavily tested.** Schema-namespace test count is
   62/62 unit + 13 new C49-FK-B = 75; full Sync regression is
   233/233. The migration target is one of the best-instrumented
   surfaces in the repo.
3. **Read-only by design.** Dictionary loaders never mutate PACS
   (per the C22-A through C30-A policy chain). FK preflight
   validation does not change that — it adds a startup-time check,
   nothing else.
4. **Low blast radius.** A failed preflight fails closed before
   any dictionary read happens. No partial state to clean up.
5. **Demonstrates the pattern small.** If dictionary-loader
   preflight works, the same pattern stamps out across future
   readers (sales-comp, ratio-study, mapping-workbook seed) with
   a tight equivalence test on each migration, mirroring the
   C48-H → C48-P stamp-out.

## What the migrated consumer may do

Per C49-FK-A's HG-FK-1 / HG-FK-2:

- **Production code paths MUST call `TryGetDeclaredForeignKeysFor`.**
  This returns `Declared` + `Exported` edges only. `InferredByName`
  edges are explicitly excluded from this lookup path.
- **Diagnostic / admin / human-facing surfaces MAY call
  `TryGetAllForeignKeysFor`** to surface inferred edges with a
  visible advisory tag. The dictionary-loader preflight is
  production code, so it MUST use the declared path.

The migrated consumer takes one of two stances per FK call site:

```text
Required FK:
  Caller declares "the loader cannot run without this FK being present
  as Declared or Exported." If the catalog does not return such an
  edge, the loader fails closed with a typed error citing the missing
  FK. The error names the (SourceTable, SourceColumns, TargetTable)
  triple so an operator can either declare the FK in PACS or supply
  it via an Exported file (C49-FK-A's allowed Exported source).

Advisory FK:
  Caller declares "the loader benefits from FK metadata but can run
  without it." If the catalog does not return such an edge, the
  loader logs a structured warning naming the (SourceTable,
  SourceColumns, TargetTable) triple, then proceeds. The loader
  MUST NOT alter its runtime behavior based on whether the FK is
  present — the warning is for operator awareness, not for
  control flow.
```

The required-vs-advisory choice is per-call-site, not global. The
caller picks based on what the FK protects.

## What the migrated consumer must NOT do

- **MUST NOT consult `InferredByName` edges for any control-flow
  decision.** Including not for "fall-back" behavior, not for
  "best-effort" routing, not for diagnostics that block. The only
  way an inferred edge becomes authoritative is through the
  C49-FK-PROMOTE-* explicit operator workflow.
- **MUST NOT cache FK lookup results across catalog rebuilds.** The
  catalog's `Version` stamp is the cache key. Future slices that
  add caching MUST invalidate on version change.
- **MUST NOT modify FK records.** The catalog is HG3 read-only at
  runtime. Consumers consume; they don't extend.
- **MUST NOT widen the call site's scope** — preflight stays
  preflight. A loader that "while we're at it, lets also walk the
  FK graph and prefetch related dictionaries" is a different
  slice with a different policy.

## Missing-FK behavior

When `TryGetDeclaredForeignKeysFor(sourceTable)` returns `HasValue =
true` but the returned list contains no FK matching the caller's
expected `(SourceColumns, TargetTable)`:

- **Required FK missing →** throw `InvalidOperationException` with
  message of the form:

  ```text
  [DictionaryLoaderPreflight] Required FK missing for
  '{sourceTable}({sourceColumns}) → {targetTable}'. Declare the
  constraint in PACS or supply it via an operator-supplied Exported
  FK file (per C49-FK-A). The loader will not run without this
  edge present.
  ```

  Loader fails before any PACS query runs.

- **Advisory FK missing →** log a structured warning of the form:

  ```text
  [DictionaryLoaderPreflight] Advisory FK absent for
  '{sourceTable}({sourceColumns}) → {targetTable}'. Loader will
  proceed; consider declaring the constraint in PACS or supplying
  an Exported FK file for stronger guarantees.
  ```

  Loader continues. Behavior unchanged.

When `TryGetDeclaredForeignKeysFor(sourceTable)` returns `HasValue =
false` (source table not in catalog at all):

- **Both required and advisory cases →** the loader has a deeper
  configuration error (the source table itself isn't catalog-known).
  This is already handled by the C48-G `DictionaryConfigFromCatalog`
  helper's missing-dictionary path. The FK preflight does NOT need
  to add a new error class for this; the existing missing-table
  failure surfaces it.

## C49-FK-D implementation target

C49-FK-D is the implementation slice. Its acceptance shape:

1. **New service: `IDictionaryLoaderPreflight`** in
   `TerraFusion.Sync.Workbench.Pacs/`. One method:
   `Task<DictionaryLoaderPreflightResult> ValidateAsync(
       IPacsSchemaCatalog catalog,
       DictionaryLoaderTargetConfig target,
       DictionaryColumnConfig columns,
       DictionaryLoaderPreflightStance stance,
       CancellationToken ct)`.
2. **`DictionaryLoaderPreflightStance` enum**: `RequiredFk` /
   `AdvisoryFk`. Caller picks per call site.
3. **`DictionaryLoaderPreflightResult` record**: indicates pass /
   warn / fail with the structured message per the policy above.
4. **`DictionaryConfigFromCatalog` extension** (or a sibling
   helper): given a catalog + target config, produces the expected
   `(SourceTable, SourceColumns, TargetTable)` triple the
   preflight checks against. Workbook-side source schema/table is
   already in `DictionaryLoaderTargetConfig.WorkbookSource*`; FK
   target side maps from `DictionaryLoaderTargetConfig.PacsDictionaryTable`.
5. **Tests** (binding minimum):
   - `DeclaredFk_RequiredStance_Passes`
   - `DeclaredFk_AdvisoryStance_PassesAndDoesNotWarn`
   - `MissingFk_RequiredStance_FailsClosedWithStructuredMessage`
   - `MissingFk_AdvisoryStance_LogsWarningAndProceeds`
   - `InferredByNameFk_RequiredStance_TreatedAsMissing` (HG-FK-2 —
     inferred edges MUST NOT satisfy a required-FK check)
   - `InferredByNameFk_AdvisoryStance_AlsoTreatedAsMissing` (same
     guard; advisory still doesn't promote inferred to authoritative)
   - `MissingSourceTable_FailsWithExistingMissingTableError` (the
     C48-G missing-dictionary path handles this; preflight does
     not duplicate)
   - `CatalogVersionChange_InvalidatesPreflightCache` (if any
     caching is added; otherwise this test asserts no caching)
6. **Live PACS smoke** in C49-FK-D's execution card: run the
   preflight against one already-migrated SyncAtlas dictionary
   loader (e.g. `property_use`); verify the FK between
   `property_val.property_use_cd` and `property_use.property_use_cd`
   is found as Declared. Capture the result as an artifact under
   `backend/artifacts/sync-atlas/c49-fk-d/`.

C49-FK-D does NOT migrate any SyncAtlas call site to actually
invoke the preflight. That's a follow-on slice (C49-FK-E or
similar) so the preflight ships with tests + smoke proof first,
then call sites adopt it one at a time mirroring the C48-H → C48-P
stamp-out pattern.

## Test matrix (binding for C49-FK-D)

The 8 test cases above are the minimum. Additional coverage that
SHOULD be present:

- **Composite FK passes** when caller's expected SourceColumns has
  multiple columns and the catalog's edge matches in arity AND
  ordinal-stable order.
- **Composite FK arity mismatch** is treated as a missing FK
  (catalog has `(a, b)` but caller expected `(a, b, c)` → required
  fails closed, advisory warns).
- **Multiple FKs from same source table** to different target
  tables: preflight matches by `(SourceColumns, TargetTable)` not
  just by `SourceTable`.
- **TableWithNoFks** scenario: the catalog returns an empty list
  for a known table; required → fail-closed, advisory → warn.

## Out of scope (deferred)

- **Migrating actual SyncAtlas call sites.** C49-FK-E onwards;
  per-arm migration with equivalence tests.
- **FK promotion workflow** (`InferredByName` → `Exported`).
  Reserved `C49-FK-PROMOTE-*`.
- **Cross-loader FK validation** (e.g. checking that two
  dictionary loaders sharing a target dictionary agree on the FK
  shape). Future slice.
- **FK graph traversal / cycle detection.** Future slice if it
  becomes useful; not for first consumer.
- **Caching strategy for preflight results across multiple
  loader invocations.** C49-FK-D may add a simple version-keyed
  cache; aggressive caching is its own concern.
- **Surface in `GET /api/sync/schema/catalog/summary`** of FK
  preflight failures. The summary endpoint stays Proof/Admin
  per SCOPE-3; preflight is a per-loader check, not a catalog
  health metric.
- **Frontend / UI surfaces.** No FK preflight UX in C49 family.

## Acceptance for C49-FK-C

- `docs/sync/pacs-schema-fk-consumer-migration-policy.md` exists
  and locks the first consumer category, the
  declared/exported-only rule, the required/advisory stance model,
  the missing-FK behavior, the C49-FK-D implementation contract,
  and the test matrix.
- The C48-CLOSE handoff cross-references this doc as the
  C49-FK-C entry in the deferred-scope status column.
- No code is modified. No tests added. No regression run required.
- Future slices migrating loaders / readers to consult FK metadata
  MUST cite this doc when proposing the migration.

## Hard guards (from C49-FK-A, restated)

These are the contracts every FK consumer migration inherits:

```text
HG-FK-1: declared FKs are queryable, advisory FKs surface separately
         (TryGetDeclaredForeignKeysFor vs TryGetAllForeignKeysFor).
HG-FK-2: inferred FKs are advisory only.
         No transform, dictionary loader, canonical writer, or
         comp consumer may take a runtime decision based on an
         InferredByName edge unless explicitly promoted via
         C49-FK-PROMOTE-*.
```

C49-FK-C adds one operational guard:

```text
HG-FK-3: each FK call site MUST declare its stance (RequiredFk or
         AdvisoryFk) explicitly. Default-on-omission is forbidden;
         the stance is a deliberate per-loader policy choice.
```

## Non-goals (explicit)

- No FK preflight implementation in this slice. C49-FK-D lands it.
- No SyncAtlas migration. C49-FK-E+.
- No promotion workflow. `C49-FK-PROMOTE-*`.
- No frontend. No UI. No domain bring-up.
- No PACS mutation. No TerraFusion DB FK changes.
- No new Sync surface beyond the preflight service and its tests.

## Open questions (deferred to C49-FK-D)

- **Concrete result shape for `DictionaryLoaderPreflightResult`.**
  Sum-type-style record (`Pass`, `Warn(message)`, `Fail(message)`)
  vs. flag struct. C49-FK-D picks; the policy is silent.
- **Logging facade.** Whether preflight warnings go through
  `ILogger<T>` or the existing Sync diagnostic surface.
  C49-FK-D picks.
- **Async vs sync.** The preflight is fast (in-memory catalog
  lookup); async-only matches the existing
  `IPacsDictionaryReader` pattern but adds ceremony. C49-FK-D
  picks; either is acceptable.
- **Cache invalidation.** Whether to expose the catalog `Version`
  stamp as the cache key. Defer until preflight is actually
  invoked from many call sites; first version uses no cache.
