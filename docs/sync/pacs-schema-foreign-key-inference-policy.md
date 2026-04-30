# PACS Schema Catalog — Foreign-Key Edge Inference Policy

**Slice:** C49-FK-A (docs-only — first slice of the C49 family.
Defines the contract for adding foreign-key edge metadata to the
PACS schema catalog before any implementation. C49-FK-B will land
the parser + catalog data model + tests against this contract.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C49-FK-*`). Extends the C48 catalog with
relationship metadata; does NOT reopen C48.
**Status:** policy locked; C49-FK-B implementation deferred.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-catalog-completion-handoff.md` — C48-CLOSE
  closure marker + deferred-new-scope index that names this slice.
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A policy.
  All seven C48 hard guards continue to apply to FK metadata.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1. FK edges are Sync
  schema/provenance metadata, not Forge / TerraFlow / TerraAtlas
  concerns.
- `docs/architecture/terrafusion-domain-boundaries.md` — SCOPE-2.

## Why this slice

C48 cataloged tables, columns, and inferred dictionaries. The next
catalog concern is **table-to-table relationships**. Three concrete
benefits a FK edge layer enables:

- **Source-shape understanding.** An agent or operator looking at
  `sale.chg_of_owner_id` can see at startup that it points at
  `chg_of_owner.chg_of_owner_id`, without that knowledge living
  only in tribal memory or `pacs-canonical-dataflow-identity-policy.md`.
- **Join validation.** Future readers that join PACS tables can
  ask the catalog whether the join shape they're using matches a
  declared FK; mismatches fail closed at startup rather than as
  silently-empty result sets at runtime.
- **Dictionary FK binding.** C48-F infers WHICH tables are
  dictionaries; C49-FK answers WHICH `*_cd` / `*_code` / `*Code`
  columns on non-dictionary tables point at WHICH dictionary. This
  closes the loop the C48-F policy left open
  (`PacsTable.DictionaryReferences` is currently always empty for
  live-introspected tables — declared FK edges fill this in for
  the cases where PACS itself records the relationship).

These are catalog-side capabilities only. Whether and how a
downstream reader / transform / consumer uses FK metadata is a
separate slice with its own gate (per "Hard Guard 2 — inferred FKs
are advisory only" below).

## FK edge data model (logical shape)

C49-FK-B materializes the concrete records. The shape below is the
binding contract; C49-FK-B may choose typed C# records or any
representation that satisfies it.

### `PacsForeignKey`

```text
- ConstraintName     : string?            (nullable: missing for InferredByName)
- SourceTable        : string             (the table holding the FK column(s))
- SourceColumns      : ordered list<string> (composite-aware; ordinal-stable)
- TargetTable        : string             (the table the FK references)
- TargetColumns      : ordered list<string> (composite-aware; same arity as SourceColumns)
- ProvenanceSource   : enum { InformationSchema, SysCatalog, ExportFile, Heuristic }
- ProvenancePath     : string             (HG6: every FK record carries a non-empty path back to its source)
- Confidence         : enum { Declared, Exported, InferredByName }
- ConversionEra      : PacsConversionEra  (default Both; future C50 manifest may override)
```

### `PacsTable.ForeignKeys` (additive)

`PacsTable` gains a new field listing the FKs whose `SourceTable`
matches this table's name. Read-only (HG3). Empty when the table
declares no FKs — never null.

### `PacsForeignKeyConfidence`

Three levels, with explicit semantics:

| Level | What it means | Where it comes from |
|---|---|---|
| `Declared` | The relational engine itself enforces this FK. Joining `Source` to `Target` on the listed columns is guaranteed referentially-correct. | `INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS` + `KEY_COLUMN_USAGE` (cross-engine portable) OR `sys.foreign_keys` + `sys.foreign_key_columns` (SQL Server specific; richer detail). |
| `Exported` | An operator-supplied artifact (typically a pre-export from a different environment, vendor doc, or manual JSON file) declares this FK, but the live engine does NOT enforce it. Treat as authoritative documentation, not as a runtime referential guarantee. | A file path the operator points the parser at; format defined by C49-FK-B. |
| `InferredByName` | No declared or exported FK exists, but column-name patterns + the C48-F dictionary-inference output suggest a relationship (e.g. a non-dictionary table's `imprv_det_class_cd` column matches a dictionary table's name + `KeyColumn`). Advisory only. | C49-FK-B name-matching pass; never authoritative. |

## Hard guards

The seven C48 hard guards continue to apply (HG1 PII-free, HG2
county-agnostic, HG3 read-only at runtime, HG4 versioned, HG5
conversion-aware, HG6 source-traceable, HG7 fail-closed). C49-FK-A
adds two additional guards specific to FK metadata:

### Hard Guard 1 — declared FKs are queryable, advisory FKs surface separately

The catalog exposes two query paths:

- `TryGetDeclaredForeignKeysFor(tableName)` returns only edges with
  `Confidence ∈ { Declared, Exported }`.
- `TryGetAllForeignKeysFor(tableName)` returns the full set
  including `InferredByName`.

Consumers that need referential correctness MUST use the declared
path. The all-edges path exists for diagnostic / browsing surfaces
only.

### Hard Guard 2 — inferred FKs are advisory only

**No transform, dictionary loader, canonical writer, comp consumer,
or any other production code path may take a runtime decision based
on a `Confidence = InferredByName` edge unless a separate slice
explicitly promotes that edge to a governed contract.**

This is the single most important rule in C49-FK. An inferred FK
that drives transform logic without explicit promotion has the same
failure mode the C48-A policy was designed to prevent: lore that
nobody verified, encoded as code that nobody questioned.

Promotion path (out of scope for C49-FK-A; reserved prefix
`C49-FK-PROMOTE-*`):

1. Operator reviews the inferred edge.
2. Adds it to an exported FK file.
3. The next catalog build picks it up as `Exported` confidence.
4. Production code consults `TryGetDeclaredForeignKeysFor` and
   sees it.

This explicit promotion gate exists so an inferred FK can become
authoritative only through deliberate operator action, never silent
heuristic drift.

## Allowed sources

C49-FK-B's parser MUST NOT reach across the operator's filesystem
beyond these declared sources. No filesystem-walk discovery, no
glob shotgun (per the C48-A non-goals).

### `InformationSchema` source (Declared)

```sql
-- INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS + KEY_COLUMN_USAGE
SELECT
  rc.CONSTRAINT_NAME,
  src_kcu.TABLE_NAME   AS SOURCE_TABLE,
  src_kcu.COLUMN_NAME  AS SOURCE_COLUMN,
  src_kcu.ORDINAL_POSITION AS SOURCE_POSITION,
  tgt_kcu.TABLE_NAME   AS TARGET_TABLE,
  tgt_kcu.COLUMN_NAME  AS TARGET_COLUMN,
  tgt_kcu.ORDINAL_POSITION AS TARGET_POSITION
FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE src_kcu
  ON rc.CONSTRAINT_NAME = src_kcu.CONSTRAINT_NAME
INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE tgt_kcu
  ON rc.UNIQUE_CONSTRAINT_NAME = tgt_kcu.CONSTRAINT_NAME
 AND src_kcu.ORDINAL_POSITION = tgt_kcu.ORDINAL_POSITION
WHERE src_kcu.TABLE_SCHEMA = @schema
  AND tgt_kcu.TABLE_SCHEMA = @schema;
```

Cross-engine portable. Composite-aware via `ORDINAL_POSITION`. The
preferred default for `Declared` confidence.

### `SysCatalog` source (Declared, SQL Server)

```sql
-- sys.foreign_keys + sys.foreign_key_columns
SELECT
  fk.name                          AS ConstraintName,
  src_t.name                       AS SourceTable,
  src_c.name                       AS SourceColumn,
  fkc.constraint_column_id         AS SourcePosition,
  tgt_t.name                       AS TargetTable,
  tgt_c.name                       AS TargetColumn,
  fkc.constraint_column_id         AS TargetPosition
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
INNER JOIN sys.tables   src_t ON src_t.object_id = fkc.parent_object_id
INNER JOIN sys.columns  src_c ON src_c.object_id = src_t.object_id AND src_c.column_id = fkc.parent_column_id
INNER JOIN sys.tables   tgt_t ON tgt_t.object_id = fkc.referenced_object_id
INNER JOIN sys.columns  tgt_c ON tgt_c.object_id = tgt_t.object_id AND tgt_c.column_id = fkc.referenced_column_id
INNER JOIN sys.schemas  s ON s.schema_id = src_t.schema_id
WHERE s.name = @schema;
```

SQL Server specific. Same data as `InformationSchema` for FK
purposes; available as a fallback or comparison source if a future
deployment needs it.

### `ExportFile` source (Exported)

A JSON or CSV file the operator points the parser at. Format
defined by C49-FK-B; minimum required fields per row are
`(ConstraintName, SourceTable, SourceColumns, TargetTable,
TargetColumns)`. Used for environments where the live engine has
no enforced FKs but the schema is documented externally (e.g. some
PACS installs disable FK enforcement for performance and rely on
application-layer integrity).

### `Heuristic` source (InferredByName)

C49-FK-B name-matching pass. Conservative starting heuristic:

- Source column ends in `_cd`, `_code`, or `Code` (matches
  C48-F+P dictionary-key convention).
- A `PacsDictionary` from C48-F has a `KeyColumn` whose name
  matches the source column verbatim.
- That dictionary's `DictionaryName` becomes the `TargetTable`,
  and its `KeyColumn` becomes the (single) `TargetColumns` entry.
- `Confidence = InferredByName`.

Composite-key heuristics are deferred — the conservative single-
column rule is enough to make the dictionary-FK binding case work
without overreach. C49-FK-B may add tighter rules; rules looser
than this require an explicit policy update.

## Out of scope (deferred)

These belong in subsequent slices, NOT in C49-FK-A or C49-FK-B:

- **FK-driven join validation in readers.** A reader using
  `IPacsSchemaCatalog` to verify its hardcoded join shape against
  the catalog's declared FKs is a separate consumer-migration
  slice.
- **Promotion workflow** for moving an `InferredByName` edge to
  `Exported`. Reserved prefix `C49-FK-PROMOTE-*`.
- **Cross-county FK catalogs.** Multi-county is reserved
  `C54-MULTI-*` per the C48-CLOSE deferred-scope index.
- **Cycle detection** in the FK graph.
- **Cascade rules** (`ON DELETE`, `ON UPDATE`). The catalog
  records that an FK exists; what the engine does on referential
  events is not Sync's concern.
- **View-based pseudo-FKs.** Views are filtered out per C48-E's
  TABLE_TYPE = 'BASE TABLE' rule; view-only edges are not FKs in
  this catalog's sense.

## C49-FK-B implementation contract

C49-FK-B is the implementation slice that follows. Its acceptance
shape:

1. **Data model.** `PacsForeignKey` record with the 9 fields above;
   `PacsForeignKeyConfidence` enum; `PacsForeignKeySource` enum.
   `PacsTable` gets a new `IReadOnlyList<PacsForeignKey>
   ForeignKeys` field (read-only collection per HG3).
2. **Source layer.** `IPacsForeignKeySource` interface analogous to
   `IPacsSchemaIntrospector`; production implementation reads the
   `INFORMATION_SCHEMA` query above; in-memory fixture for tests.
3. **Catalog API.**
   - `IPacsSchemaCatalog.TryGetDeclaredForeignKeysFor(string tableName)
      → PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>`
   - `IPacsSchemaCatalog.TryGetAllForeignKeysFor(string tableName)
      → PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>`
   - Both methods preserve C48's typed-result-on-miss pattern (HG7).
4. **Inference pass.** `LivePacsSchemaSource` (or a new sibling)
   runs the conservative `InferredByName` heuristic against the
   already-inferred dictionary list.
5. **Tests** (binding minimum):
   - Reads declared FK edge from a `sys.foreign_keys` (or
     `INFORMATION_SCHEMA`) fixture.
   - Supports composite FK shape — multi-column FK preserves
     ordinal-stable column pairs.
   - Refuses to register a FK where `SourceTable` is not in the
     catalog's table list (HG7 dangling-table guard).
   - Refuses to register a FK where `SourceColumns` includes a
     column not in the catalog's column list for that table (HG7
     dangling-column guard).
   - Every FK record carries a non-empty `ProvenancePath` (HG6).
   - Every FK record carries an explicit `Confidence` value.
   - View-only edges are NOT included as declared base-table FKs.
   - The FK pass does NOT mutate `PacsTable` /
     `PacsColumn` / `PacsDictionary` records produced by C48-B.
6. **Live PACS smoke** (in the C49-FK-B execution card, not part
   of C49-FK-A): re-run the C48-E smoke against live Harris PACS,
   capture an updated artifact showing the FK edge count. Number
   is whatever it is on Benton's PACS — this is verification, not
   a target.
7. **No consumer migration in C49-FK-B.** Future slices migrate
   readers / transforms / loaders to consult declared FK edges;
   C49-FK-B lands the catalog only.

## Acceptance for C49-FK-A

- `docs/sync/pacs-schema-foreign-key-inference-policy.md` exists
  and locks the data model, confidence levels, allowed sources,
  hard guards, and C49-FK-B contract above.
- No code is modified. No tests added. No regression run required.
- The C48-CLOSE handoff cross-references this doc as the C49-FK
  family entry point.
- Future slices touching FK metadata MUST cite this doc when
  proposing additions to the FK surface.

## Non-goals (explicit)

- **No FK parser in this slice.** C49-FK-B lands it.
- **No FK reader migration.** Future slices.
- **No promotion workflow.** Reserved `C49-FK-PROMOTE-*`.
- **No frontend.** No UI represents FK edges; if FK browsing as
  operator UX becomes useful, it is a Workbench / Studio surface
  per SCOPE-2, not a Sync feature.
- **No domain bring-up.** Forge / TerraFlow / Atlas / Dossier /
  Dais all remain unaffected by C49-FK.
- **No PACS mutation.** No FK creation, deletion, or alteration
  on PACS itself. Read-only metadata only.
- **No TerraFusion DB FK changes.** Different schema, different
  concern.

## Open questions (deferred to C49-FK-B)

- **Concrete representation of `ConstraintName` for inferred edges.**
  Options: `null`, a synthesized string like
  `"INFERRED::sale.sl_ratio_type_cd→sl_ratio_type_cd_lookup"`, or
  a separate field. C49-FK-B picks one; the policy is silent.
- **JSON vs CSV for `ExportFile` source.** JSON is more strict
  (composite columns trivially expressible); CSV is more
  operator-friendly. C49-FK-B picks one.
- **Caching strategy.** The FK pass adds another query at catalog
  build time. Acceptable if it stays under ~5s on real Harris PACS;
  C49-FK-B measures and adjusts the introspector's CommandTimeout
  if needed (precedent: C48-E already bumped command timeout for
  the column query).
- **Conversion-era for FKs.** A FK might be declared on a
  post-2017 column. Default era is `Both`; per-FK era inference is
  out of scope unless the C50 conversion manifest covers it.
