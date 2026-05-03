# PACS Schema Catalog — Conversion-Manifest Policy

**Slice:** C50-CONV-A + C50-CONV-A1 corrigendum (docs-only — first
slice of the C50 family plus its narrow corrigendum. Defines the
contract for adding conversion-provenance metadata to the PACS
schema catalog before any implementation. C50-CONV-B will land the
parser + catalog data model + tests against this contract.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C50-CONV-*`). Extends the C48 catalog
with conversion-era metadata; does NOT reopen C48.
**Status:** policy locked (C50-CONV-A merged at f653821c7;
reconciled with shipped enum at C50-CONV-A1); C50-CONV-B
implementation deferred.

## C50-CONV-A1 corrigendum

The original C50-CONV-A draft of this doc proposed a
`PacsConversionEra` enum with values `Operational /
ConversionOnly / Both / Unknown`. That conflicted with the enum
that already ships from C48-B at
`backend/src/TerraFusion.Sync/Workbench/Schema/PacsConversionEra.cs`,
which uses time-of-population semantics: `Pre2017 / Post2017 /
Both / Unknown`. C49-FK-A's data-model snippet also references
that existing enum name.

C50-CONV-A1 reconciles this doc with the shipped enum. The hard
guards (CONV-1 operator-supplied, CONV-2 Unknown-is-sentinel,
CONV-3 explicit-RequireConversionManifest) are unchanged — they
govern manifest *sourcing*, not enum values. The data-model
section below uses the shipped names. C50-CONV-B implements
against the shipped enum verbatim.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-catalog-completion-handoff.md` — C48-CLOSE
  closure marker + deferred-new-scope index that names this slice.
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A policy.
  All seven C48 hard guards continue to apply to conversion metadata.
- `docs/sync/pacs-schema-foreign-key-inference-policy.md` — C49-FK-A.
  This slice mirrors C49-FK-A's policy-then-implementation cadence
  and reuses the operator-supplied "exported file" pattern.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1. Conversion metadata
  is Sync schema/provenance only, not Forge / TerraFlow / TerraAtlas.
- `docs/architecture/terrafusion-domain-boundaries.md` — SCOPE-2.

## Why this slice

C48 catalogs PACS as it is: every base table, every column, every
inferred dictionary, every declared FK. C49-FK extended this with
relationship metadata. What the catalog still does not know is which
of those tables and columns are **operational truth** versus
**conversion-provenance artifacts**.

Benton County's Harris PACS install is the result of a 2017 data
conversion FROM the prior systems (ProVal — historical CAMA, and
Ascend — historical tax) INTO PACS. The conversion preserved
schema-level artifacts so historical lookups remained possible:

- Tables like `pp_seg_history` and `pacs_oltp_v_*` views that hold
  pre-conversion snapshots, not current operational rows.
- Columns like `proval_*`, `ascend_*`, or `_legacy_*` prefixes that
  were copied from the old systems but are not maintained by current
  PACS workflows.
- Wide "shadow" columns that exist on operational tables but were
  populated only during the conversion run and never updated since.

Without a manifest, the catalog treats these identically to active
operational columns. Three concrete failure modes follow:

- **Dictionary inference noise.** The C48-F heuristic might pick up
  a conversion-only `*_cd` / `*_desc` pair as a fresh dictionary,
  surfacing a dictionary the operator hasn't touched in eight years
  as if it were live.
- **Loader allowlist drift.** A future SyncAtlas allowlist expansion
  might bind to a column that hasn't been written to since 2017,
  producing technically-valid empty / stale loads.
- **Comp / valuation reader confusion.** Forge readers that walk
  PACS for sales context might pull rows from `pp_seg_history` and
  treat them as recent activity.

A conversion manifest fixes this by tagging tables and columns with
their **ConversionEra**, so consumers that need operational truth
can filter to `Post2017` or `Both`, and consumers that need
historical lookup (rare) can opt in to `Pre2017`.

The manifest does NOT mutate PACS, drop catalog rows, or block the
loader — it is a metadata layer the catalog carries and that
consumers may consult, in line with the "catalog stays honest, code
gets explicit" principle.

## Conversion era data model (logical shape)

C50-CONV-B materializes the concrete records. The shape below is the
binding contract.

### `PacsConversionEra` (shipped from C48-B; not redefined here)

The enum already exists in
`backend/src/TerraFusion.Sync/Workbench/Schema/PacsConversionEra.cs`
with these values:

```text
- Unknown   = 0  : sentinel. The catalog records this when the
                   conversion manifest does not declare the column
                   or table. NEVER treated as a default.
- Pre2017   = 1  : column / table was populated only before the
                   2017 conversion. Equivalent to "conversion-only"
                   in plain language: not maintained by current
                   PACS workflows. Readers running against post-
                   2017 data MUST treat as effectively absent.
- Post2017  = 2  : column / table was introduced or re-populated
                   after the 2017 conversion. Equivalent to
                   "operational" in plain language: maintained by
                   current workflows. Readers running against
                   pre-2017 data MUST treat as effectively absent.
- Both      = 3  : column / table was populated continuously
                   across the 2017 conversion cut. Safe for
                   readers spanning the cut. The default era for
                   stable identity columns (e.g., PK columns).
```

C50-CONV-B does NOT add a new enum. It adds the manifest layer
that lets the operator assign one of the four values above to
each catalog item explicitly, and wires the catalog to apply those
assignments at build time.

### `PacsTable.ConversionEra` (additive)

`PacsTable` gains a single `ConversionEra` field summarizing the
table-level designation. Read-only (HG3). Defaults to `Unknown` when
no manifest is loaded.

### `PacsColumn.ConversionEra` (additive)

`PacsColumn` gains a single `ConversionEra` field summarizing the
column-level designation. Read-only (HG3). Inherits from the
parent table's era unless the manifest overrides it explicitly.
Defaults to `Unknown` when no manifest is loaded.

### `PacsConversionManifest`

```text
- ManifestPath        : string             (HG6: source-traceable)
- ManifestVersion     : string             (semver-shaped, operator-controlled)
- ConversionEvent     : string             (e.g., "Benton-2017-Harris-PACS-9.0-conversion")
- TableEntries        : ordered list<PacsConversionTableEntry>
- ColumnEntries       : ordered list<PacsConversionColumnEntry>
```

### `PacsConversionTableEntry`

```text
- TableName           : string
- Era                 : PacsConversionEra  (must NOT be Unknown)
- Reason              : string             (one-line operator note; required)
- LastWriteEvidence   : string?            (optional path to evidence; e.g., a SQL probe artifact)
```

### `PacsConversionColumnEntry`

```text
- TableName           : string
- ColumnName          : string
- Era                 : PacsConversionEra  (must NOT be Unknown)
- Reason              : string             (one-line operator note; required)
- LastWriteEvidence   : string?            (optional path to evidence)
```

The manifest is **operator-curated**, never inferred. There is no
heuristic equivalent of C48-F or C49-FK's `InferredByName` for
conversion-era. Inferring an item as `Pre2017` from naming
patterns alone (e.g., "any column starting with `proval_`") would
miss real-world cases where conversion artifacts wear operational
names, and would catch real-world cases where operational columns
happen to wear conversion-shaped names. Per HG-CONV-1, the only
valid sources are operator-supplied manifests.

## Hard guards

The seven C48 hard guards continue to apply. C49-FK's two guards
(HG-FK-1 declared/all split; HG-FK-2 inferred-advisory-only) also
continue to apply within the FK domain. C50-CONV-A adds three
additional guards specific to conversion metadata:

### Hard Guard CONV-1 — manifests are operator-supplied, never inferred

There is no auto-discovery path for conversion-era. The catalog
loads conversion metadata only from explicitly-named manifest files
that the operator has curated and committed (or kept gitignored, per
the same `.local.json` pattern C49-FK uses for exported FKs).

C50-CONV-B's parser MUST NOT:

- Walk the filesystem looking for manifest-shaped files.
- Glob across multiple manifest locations.
- Infer ConversionEra from column-name patterns
  (no `proval_*` / `ascend_*` / `_legacy_*` heuristic).
- Read SQL Server `sys.dm_db_index_usage_stats` or any other live
  signal as a proxy for "this column hasn't been written to."

Why: every previous PACS-schema heuristic the team has tried to
auto-derive (FK inference, dictionary pair inference) has needed an
explicit advisory-vs-promoted gate. Conversion-era is more dangerous
to auto-infer than either of those because a wrong tag silently
shifts the meaning of catalog items downstream. The simplest correct
posture is: operator writes it, catalog reads it.

### Hard Guard CONV-2 — `Unknown` is a sentinel, never a default

The `PacsConversionEra.Unknown` value exists ONLY to represent the
state where no manifest is loaded for the source. It MUST NOT be
written into a manifest, MUST NOT be the result of merging two
manifests with different opinions (that's a manifest-validation
failure), and MUST NOT be promoted to any other era silently.

When a column is annotated in the manifest, its era is whatever the
manifest says (`Pre2017`, `Post2017`, or `Both`). When a column is
NOT annotated and the manifest IS loaded, the column's era stays
`Unknown` for that column — the manifest only narrows what it
explicitly covers; un-annotated columns are NOT auto-promoted to
`Both` or `Post2017` (per HG-CONV-1 there is no inference step).
When the manifest is NOT loaded at all, every catalog item's era is
`Unknown`.

This guard exists so that "no manifest loaded" or "this column not
in the manifest" both produce an obviously broken read pattern
(Unknown propagates), not a quietly incorrect read pattern (Unknown
silently aliasing `Both` or `Post2017`).

### Hard Guard CONV-3 — manifest absence is explicit, not implied

Catalog-build callers MUST decide explicitly whether to require a
manifest:

- `LivePacsSchemaSourceOptions.RequireConversionManifest = true`:
  catalog build fails closed if no manifest path is configured or
  if the manifest fails to parse. This is the production posture.
- `LivePacsSchemaSourceOptions.RequireConversionManifest = false`:
  catalog builds successfully without a manifest; every column and
  table receives `Era = Unknown`. Consumers that depend on era
  metadata (per the future C50-CONV-C consumer-migration policy)
  see `Unknown` and must surface that as a failure or a degraded
  mode — they MUST NOT treat `Unknown` as `Both` or `Post2017`.

There is no default. The flag must be set explicitly at the call
site. (Same shape as C49-FK-C's `DictionaryLoaderPreflightStance`
HG-FK-3: explicit-or-error, never default-on-omission.)

## Allowed sources

C50-CONV-B's parser MUST NOT reach beyond these declared sources.

### `OperatorManifestFile` source

A JSON or YAML file at a path explicitly configured via
`LivePacsSchemaSourceOptions.ConversionManifestPath`. No glob, no
search. The path is HG6-source-traceable: every entry the catalog
exposes traces back to a specific file path + line range.

Suggested file layout (final shape decided by C50-CONV-B; this is
the binding contract for the SHAPE, not the syntax):

```json
{
  "manifestVersion": "1.0.0",
  "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
  "tables": [
    {
      "name": "pp_seg_history",
      "era": "Pre2017",
      "reason": "Pre-2017 personal-property segment snapshots; never written to by current PACS workflow.",
      "lastWriteEvidence": "evidence/pp_seg_history-last-write-probe-2026-04-30.json"
    }
  ],
  "columns": [
    {
      "table": "imprv_detail",
      "column": "ascend_orig_meth_cd",
      "era": "Pre2017",
      "reason": "Carried over from Ascend during 2017 conversion; PACS uses imprv_det_meth_cd now."
    }
  ]
}
```

Operator-curated, gitignored if it carries county-specific names
(per HG2 / HG6), or county-agnostic and committed if it carries
only conversion-event metadata that applies to every Harris PACS
install of the same vintage.

### Disallowed sources (out of scope; never to be added)

- INFORMATION_SCHEMA.COLUMNS (no era information available).
- `sys.dm_db_index_usage_stats` or any live-write-tracking surface
  (would violate HG3 read-only and would tag columns based on the
  catalog-build window, not actual conversion provenance).
- Naming-convention heuristics (per HG-CONV-1).
- ProVal or Ascend export files. Those systems are off the runtime
  path; the catalog should not learn to read them, and the
  conversion manifest is an operator-authored summary of what the
  conversion left behind, not a re-read of the source systems.

## Out of scope (deferred)

The following are explicitly NOT in scope for C50-CONV-A or
C50-CONV-B. Each gets its own future slice with its own gate:

### C50-CONV-C — consumer migration policy

Mirrors C49-FK-C. Defines how downstream readers (dictionary
loaders, comp readers, mapping workbench) consult `ConversionEra`.
Includes:

- A per-call-site stance enum: `RequirePost2017OrBoth` /
  `AllowPre2017` / `AllowAny`.
- An explicit failure mode for `Unknown` (caller MUST surface).
- A scoreboard of which consumers have migrated.

Until C50-CONV-C lands, no production consumer is permitted to
take a runtime decision based on `ConversionEra`. The catalog may
expose the field; consumers may not act on it.

### C50-CONV-D — manifest authoring tooling

A SyncAtlas command that helps the operator author the initial
manifest by:

- Listing tables that have not received an `INSERT` / `UPDATE` on
  any audit-tracked column since a configurable cutoff date.
- Listing columns whose name matches operator-supplied legacy
  patterns (input from the operator, not auto-derived) so the
  operator can review and decide.
- Producing a dry-run diff between a proposed manifest and the
  catalog's current state.

This tool produces operator review material, not catalog truth.
The operator is always the gate.

### C50-CONV-E — multi-conversion-event support

Some counties have multiple conversions stacked over time
(Ascend → ProVal → Harris PACS, for example). C50-CONV-A models
exactly one `ConversionEvent` per manifest. Multi-event chronology
is deferred until a county actually needs it.

### C50-CONV-F — cross-county manifest sharing

A central registry where counties can share conversion patterns
they've identified (e.g., "every Harris PACS install converted
from ProVal pre-2017 has these `ascend_*` columns from Ascend").
Out of scope until at least two counties have manifests.

## C50-CONV-B implementation contract

C50-CONV-B is the next slice in this family. Its scope:

1. **Add `PacsConversionEra` enum** to
   `backend/src/TerraFusion.Sync/Workbench/Schema/`.
2. **Add `PacsConversionManifest`, `PacsConversionTableEntry`,
   `PacsConversionColumnEntry` records** in the same namespace.
3. **Extend `PacsTable` and `PacsColumn`** with a `ConversionEra`
   field (additive, defaults to `Unknown`).
4. **Add `LivePacsSchemaSourceOptions.ConversionManifestPath` and
   `LivePacsSchemaSourceOptions.RequireConversionManifest`**.
5. **Add `IPacsConversionManifestSource` + default JSON
   implementation**, mirroring the structure of
   `IPacsSchemaIntrospector`. Pure file-IO, no SQL.
6. **Wire into `LivePacsSchemaSource.BuildAsync`**: load manifest
   (when configured), apply era tags to catalog records, fail
   closed if `RequireConversionManifest = true` and load fails.
7. **Unit tests**: at minimum cover
   - manifest absent + RequireConversionManifest=false → all eras
     `Unknown`, build succeeds.
   - manifest absent + RequireConversionManifest=true → build
     fails with structured error naming the missing path.
   - manifest with table-only entry → table tagged, columns
     inherit.
   - manifest with column override on tagged table → column wins.
   - manifest with `Unknown` written explicitly → manifest-load
     fails (HG-CONV-2).
   - manifest with conflicting duplicate entries → manifest-load
     fails (deterministic comparison).
   - manifest version mismatch → manifest-load fails.
8. **No live PACS smoke required** for C50-CONV-B. The unit tests
   plus a hand-authored fixture manifest are sufficient. The first
   live-DB-sourced manifest will be authored as part of C50-CONV-D.
9. **No consumer migration**. Per HG-CONV-3 deferred-to-C50-CONV-C,
   no production code path consults `ConversionEra` until that
   policy lands.

## Acceptance for C50-CONV-A

This slice is docs-only. Acceptance criteria:

- [x] Policy file lands at
  `docs/sync/pacs-schema-conversion-manifest-policy.md`.
- [x] All three hard guards (CONV-1, CONV-2, CONV-3) are stated
  explicitly with rationale.
- [x] The data model is binding (C50-CONV-B may choose record
  representation but not field shape).
- [x] The allowed-sources list is closed; new sources require a
  separate slice.
- [x] The deferred-scope list is enumerated.
- [x] Cross-references to C48-A, C48-CLOSE, C49-FK-A, sync-boundary
  policy.
- [x] No code changes; no test changes; no catalog changes.

## Non-goals (explicit)

- C50-CONV-A is not a manifest. The manifest is what C50-CONV-D will
  help produce; this doc only specifies the *shape* the manifest
  must have.
- C50-CONV-A does not authorize any consumer to act on era
  metadata. That gate lives in C50-CONV-C.
- C50-CONV-A does not retire ProVal or Ascend mention from the
  CLAUDE.md provenance footnote. Those systems remain
  conversion-provenance only; the manifest is what makes that
  status mechanically queryable, not just documentation lore.
- C50-CONV-A does not add a new identity tuple to
  `pacs-canonical-dataflow-identity-policy.md`. Identity is the
  same; era is metadata about identity.
- C50-CONV-A does not change the C48 hard-guard set; it adds three
  new guards specific to its domain.

## Open questions (deferred to C50-CONV-B)

- Should the manifest format be JSON or YAML? (Binding decision:
  C50-CONV-B picks one; the shape is fixed regardless.)
- Should the manifest support per-source-label overrides
  (different conversion events per county on a multi-tenant
  install)? Probably yes, but the shape stays per-event.
- Should `LastWriteEvidence` be required or optional? Currently
  optional; C50-CONV-B may strengthen.
- Should conversion-era propagation through views be surfaced?
  (Views are already excluded from the catalog per C48-E
  base-table-only filter, so the question is moot for now.)

## Slice ledger note

This is the first slice of the C50-CONV family. Anticipated arc:

- C50-CONV-A  : this doc (policy lock; merged f653821c7).
- C50-CONV-A1 : corrigendum reconciling the doc's data model with
                the shipped C48-B `PacsConversionEra` enum.
- C50-CONV-B  : parser + catalog data model + unit tests.
- C50-CONV-C : consumer migration policy (analog of C49-FK-C).
- C50-CONV-D : manifest authoring tooling.
- C50-CONV-E : multi-conversion-event support (deferred).
- C50-CONV-F : cross-county manifest sharing (deferred).

Promotion happens slice-by-slice; nothing in C50-CONV-A should be
read as authorizing any of B / C / D / E / F until each lands.
