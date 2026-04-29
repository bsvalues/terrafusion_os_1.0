# PACS Schema Catalog as Code — Policy

**Slice:** C48-A (docs-only — defines the policy for converting
PACS-vendor-published schema files (Harris PACS in the operator's
Benton environment) into a versioned, queryable
**`pacs_schema_catalog`** that downstream Sync readers, transforms,
and dictionary loaders compile against. This slice writes the
contract; C48-B will land the parser + catalog data model + tests.).
**Lifecycle layer:** Core Sync — schema infrastructure (per
`docs/sync/sync-surface-inventory.md` Category 8 cross-cutting; new
row added on C48-B implementation).
**Status:** policy locked; C48-B implementation deferred.

**Authoritative cross-references:**
- `docs/architecture/terrafusion-domain-boundaries.md` (SCOPE-2)
- `docs/sync/sync-boundary-policy.md` (SCOPE-1)
- `docs/sync/sync-surface-inventory.md` (SCOPE-3)
- `docs/sync/pacs-canonical-dictionaries-reference.md` (existing
  dictionary compendium that the catalog complements)
- `docs/sync/pacs-canonical-dataflow-identity-policy.md` (canonical
  identity tuples that the catalog must preserve)

## Source / target model (binding)

This catalog and every slice that consumes it MUST observe the
following corrected source/target model. Earlier C48 wording briefly
inverted this and that error is forbidden going forward.

```text
Harris PACS 9.0  ──── TerraFusion Sync ────►  TerraFusion DB
   (legacy source)        (bridge)              (target)
```

- **Harris PACS 9.0** is Benton's legacy CAMA/PACS database. It is
  the **source** TerraFusion Sync converts FROM. The catalog
  describes Harris PACS schema; nothing about the catalog implies
  PACS is a destination.
- **TerraFusion DB** is the modern destination TerraFusion Sync
  writes INTO. Canonical landing tables
  (`CanonicalSaleQualifications` and future lanes) live here.
- **ProVal** and **Ascend** are part of Benton's historical
  conversion provenance — the prior valuation and tax systems that
  shaped the data semantics now visible in PACS. They are NOT the
  active source of TerraFusion Sync. References to ProVal/Ascend in
  Sync code or docs are limited to **historical-provenance
  footnotes** (explaining why a PACS column has the shape it has),
  never as runtime source connections.
- **Tyler Vision** is NOT in Benton's stack and never was. Any
  reference to Tyler in C48 surfaces is a vestigial error from
  earlier slices that has been swept by C48-FIX and C48-FIX2.

Future catalog work, downstream readers, and any new
`IPacsSchemaSource` implementation MUST cite this section when
describing where the catalog gets its bytes. The catalog reflects
the live Harris PACS DB schema (read via reflection / introspection
in production; via fixture in tests). It does not parse vendor
documentation files except where the operator explicitly provides
them as supplementary input.

## Why this slice

The C-series proved the bridge works — but every reader, transform,
and dictionary loader written so far compiles against **column names
and types learned by inspection**, not against a typed source of
truth. That worked while the surface was small. It does not scale.
Symptoms already observed:

- Recurring "column not found" failures when a reader assumed a
  column name from one PACS install and ran against another.
- Repeated manual rediscovery of identity tuples
  (`(CountyId, ChgOfOwnerId)`, `(CountyId, PropertyId)`,
  `(CountyId, ImprvId, ImprvDetId)`) per lane.
- A 2017 PACS conversion that introduced **shape drift** between
  pre-2017 and post-2017 column populations; readers that mix
  histories silently get partial data.
- Dictionary loaders rediscover the same lookup table shapes per
  lane; canonical decoding (`hood_cd`, `i_attr_id`,
  `imprv_det_type_cd`) is implemented N times.

The PACS-vendor schema-describing artifacts exist on disk (per the recent
discovery pass). They are the manufacturer's truth. C48-A defines
how those files become a typed, versioned, conversion-aware catalog
that every Sync reader compiles against.

> "Lock schema as code, not lore."

## What `pacs_schema_catalog` is

A versioned, in-process, **read-only** catalog object that exposes
the PACS schema as typed, queryable metadata. It is **not** a
runtime data store; it is a metadata store. It carries no parcel
data, no PII, no county-specific business state.

Conceptually, the catalog answers four questions for any caller:

1. **"Does column X exist on table Y in PACS schema vN?"**
2. **"What is its declared type, nullability, and PII classification?"**
3. **"Was this column populated before the 2017 conversion, after it,
   or both?"**
4. **"What identity tuple does this table use, and what dictionary
   tables does it foreign-key into?"**

Callers ask the catalog these questions at startup (so misconfigured
readers fail closed, not silently). The catalog is constructed once
per process from the parsed PACS schema files plus the conversion
manifest.

### Hard guards

The catalog enforces these invariants by construction. Any C48-B
implementation that violates one of these is rejected at policy
review.

- **HG1 — PII-free.** The catalog stores schema metadata only. No
  parcel rows, no owner names, no addresses, no transactional
  values. A parser that pulls sample data into the catalog is
  rejected.
- **HG2 — County-agnostic.** PACS ships the same schema across
  PACS installs. The catalog reflects that schema. County-specific
  dialect / mapping decisions are **Mapping Workbook** territory,
  not catalog territory. The catalog has no `CountyId` field.
- **HG3 — Read-only at runtime.** The catalog is constructed once
  and never mutated by any service after construction. No "patch
  the catalog at runtime" affordance. Schema corrections require a
  new catalog version + redeploy.
- **HG4 — Versioned.** The catalog carries an explicit `SchemaVersion`
  derived from the source schema files' provenance (PACS vendor release
  identifier when available, file hash + ingest date as fallback).
  Two catalogs with different `SchemaVersion` MUST NOT be
  interchanged silently; readers that pin to a specific version
  fail closed when run against a different one.
- **HG5 — Conversion-aware.** Every column carries a
  `ConversionEra` ∈ `{ Pre2017, Post2017, Both, Unknown }`. Readers
  that span the 2017 cut MUST consult this field; the catalog
  refuses to answer "is this column safe to read for any date?"
  without it.
- **HG6 — Source-traceable.** Every catalog entry carries provenance
  back to the file path + line/section that declared it. A reader
  that gets a wrong answer from the catalog can always identify
  which PACS schema file authored that answer.
- **HG7 — Failure surfaces explicitly.** A reader querying for an
  unknown column receives a typed `Result.NotFound` (or equivalent)
  — not a null, not an empty string, not a silent fallback. The
  catalog never lies about its coverage.

## Data model (logical shape — C48-B materializes these)

The shapes below are logical. C48-B chooses the concrete
representation (typed C# records, EF read-models, in-memory objects,
generated source — all are compatible with this policy as long as
the hard guards hold).

### `PacsTable`

```text
- TableName              : string  (e.g. "imprv", "sale", "chg_of_owner")
- IdentityTuple          : ordered list of column names that uniquely identify a row
- ConversionEra          : Pre2017 | Post2017 | Both | Unknown
- DictionaryReferences   : list of (LocalColumn, DictionaryTable, DictionaryKeyColumn)
- ProvenancePath         : string  (source schema file + section)
- PiiClassification      : None | Indirect | Direct
```

### `PacsColumn`

```text
- TableName              : string
- ColumnName             : string
- DeclaredType           : PACS-typed (string|int|decimal|date|bool|enum<dictionary>)
- Nullable               : bool
- ConversionEra          : Pre2017 | Post2017 | Both | Unknown
- DictionaryRef          : (DictionaryTable, DictionaryKeyColumn) | null
- PiiClassification      : None | Indirect | Direct
- ProvenanceLine         : string  (source schema file + line)
- Notes                  : string  (operator-readable; verbatim from PACS vendor docs)
```

### `PacsDictionary`

```text
- DictionaryName         : string  (e.g. "hood_cd_lookup", "i_attr_lookup")
- KeyColumn              : string  (e.g. "hood_cd", "i_attr_id")
- DescriptionColumn      : string  (e.g. "hood_descr", "i_attr_descr")
- ValueDomainSize        : int | null  (declared cardinality if the PACS vendor provides one)
- ConversionEra          : Pre2017 | Post2017 | Both | Unknown
- ProvenancePath         : string
```

### `SchemaVersion`

```text
- PacsRelease            : string | null  (e.g. "Harris PACS 9.0.4.2" if discoverable)
- SourceFileHashes       : map<file_path, sha256>
- IngestedAt             : DateTime
- ConversionManifestHash : sha256       (the 2017 shim bundle that pairs with this version)
```

## The 2017 conversion shim

PACS underwent a schema conversion in 2017 that altered the
population pattern of several columns (most notably across the
`imprv_*` family, the sales chain, and the abstract subdivision
references). Readers that ingest data spanning the cut without
accounting for this drift produce **silently partial** results — the
worst possible failure mode (no error, wrong answer).

The catalog handles this via three mechanisms:

1. **Per-column `ConversionEra` field** (HG5). Readers that span the
   cut MUST branch on this.
2. **A `ConversionManifest`** — a sibling artifact to the schema
   files that documents the column-level drift between Pre2017 and
   Post2017. C48-B parses this into the catalog.
3. **Reader-side `RequireEra` opt-in.** A reader MAY declare "I
   only handle Post2017 data" at construction; the catalog refuses
   to answer Pre2017 column queries from that reader. Defense in
   depth against accidentally reading pre-conversion columns.

If the conversion manifest is missing for a particular column,
`ConversionEra = Unknown` is recorded and a warning is logged at
catalog construction. A reader querying an `Unknown` column gets a
typed result indicating ambiguity — never a silent default.

## Where the source files come from

The catalog's source of truth is a fixed set of PACS-vendor-published
schema artifacts (Harris PACS in the operator's environment). C48-A does not enumerate the exact paths (those
are install-specific and county-specific to the operator's working
environment); C48-B records the actual paths used in its own policy
addendum. The classes of file expected:

- **Table-definition files** — PACS schema declaration documents
  (CSV / XML / SQL DDL exports / vendor reference PDFs converted to
  text).
- **Dictionary files** — lookup-table declarations for PACS code
  domains (`hood_cd`, `i_attr_id`, `imprv_det_type_cd`,
  `property_use_cd`, `sale_*_use_cd`, etc.).
- **Identity-tuple references** — declarations of primary-key
  shapes per table (vendor-published or extracted from PACS install
  metadata).
- **2017 conversion manifest** — the change log that documents
  which columns shifted population pattern across the cut.

C48-B's parser MUST NOT reach across the operator's filesystem
beyond these declared paths. No filesystem-walk discovery, no glob
shotgun. Explicit paths only.

## Relationship to existing Sync artifacts

The catalog is **upstream** of every existing Sync reader, transform,
and dictionary loader. It does **not** replace any of them; it
de-duplicates the schema knowledge they currently encode.

| Existing artifact | Today | After C48-B |
|---|---|---|
| `pacs-canonical-dictionaries-reference.md` | Markdown reference compendium | Stays as the human-readable narrative; cross-references the catalog as the machine-readable source |
| `pacs-canonical-dataflow-identity-policy.md` | Identity-tuple policy doc | Stays as the policy; catalog enforces it mechanically per `PacsTable.IdentityTuple` |
| Per-dictionary loader policies (11 dictionaries in SCOPE-3 Category 6) | Each loader hardcodes its source table + key/value columns | Loaders consume `PacsDictionary` entries from the catalog instead of hardcoding |
| Mapping Workbook column terminalization | Hardcoded list of canonical column shapes | Workbook columns map to `PacsColumn` entries by name + version |
| Source-to-canonical transforms (sales runner today; future valuation/improvement/land) | Each transform hardcodes its read-side column names | Transforms reference `PacsColumn` entries; catalog version is captured in the canonical landing row's provenance |

The migration from "knowledge encoded in code" to "knowledge encoded
in catalog" is **incremental**. C48-B lands the catalog and its
parser. Subsequent slices (C48-C, C48-D, …) migrate one consumer at
a time. No big-bang refactor. Each migrated consumer gets its own
slice with its own regression gate.

## SCOPE-3 row classification

Per the inventory in `docs/sync/sync-surface-inventory.md`:

- **Category:** 8 — Cross-cutting infrastructure.
- **Classification:** Core Sync.
- **Long-term owner:** Sync.
- **Rule:** Catalog construction, parsing, and querying are
  Sync-owned. The catalog is consumed by Sync readers and
  transforms; its scope MUST NOT expand to host Forge / TerraFlow /
  Studio / Atlas concerns. If a downstream domain needs schema
  metadata, it queries the catalog through the existing
  Sync-provided interface — it does not extend the catalog with
  domain-specific fields.

C48-B will add the explicit row to the SCOPE-3 inventory as part of
its own policy doc.

## C48-B implementation contract (preview)

C48-B is the implementation slice that will follow C48-A. Its
acceptance shape:

1. **Parser.** Reads the PACS schema files declared by C48-B's
   own path manifest into typed `PacsTable` / `PacsColumn` /
   `PacsDictionary` records.
2. **Versioning.** Computes `SchemaVersion` from source-file hashes
   + ingest timestamp; surfaces it on the catalog object.
3. **Conversion manifest.** Parses the 2017 shim into per-column
   `ConversionEra` flags.
4. **Catalog object.** Single in-process `IPacsSchemaCatalog`
   service registered in DI; constructed once at startup.
5. **Hard-guard tests.** Each of HG1–HG7 has at least one unit test.
6. **Provenance test.** Every catalog entry surfaces a non-empty
   `ProvenancePath` / `ProvenanceLine`.
7. **Coverage gate.** A startup self-check counts known PACS tables
   covered by the catalog and logs the count; below a configured
   floor, startup fails loudly. (Floor TBD by C48-B.)
8. **No production reader migration in C48-B.** C48-B lands the
   catalog only; readers/transforms/loaders migrate in subsequent
   slices.

C48-B is **not** part of this slice's allowed-files list. C48-A is
docs-only.

## Acceptance for C48-A

- `docs/sync/pacs-schema-catalog-as-code-policy.md` exists and
  defines the catalog's identity, hard guards, logical data model,
  conversion shim, source-of-truth boundary, relationship to
  existing artifacts, SCOPE-3 row classification, and C48-B
  implementation contract.
- No code is modified. No tests added. No regression run required.
- The "Future-slice gate" from SCOPE-3 §Future-slice gate applies
  to C48-B and every downstream consumer-migration slice.
- Future agents that touch PACS-schema knowledge MUST cite this
  doc when proposing where the knowledge lives (in code vs. in
  catalog).

## Non-goals

- **No parser implementation.** C48-B will land it.
- **No reader / transform migration.** Future slices will migrate
  consumers one at a time.
- **No frontend.** No UI represents the catalog in C48-A or C48-B.
  If catalog browsing as operator UX is later useful, it is a
  Workbench/Studio surface per SCOPE-2 §3, not a Sync feature.
- **No domain bring-up.** Forge / TerraFlow / Atlas / Dossier /
  Dais all remain at their current implementation level.
- **No PII ingest.** The catalog never holds parcel data, owner
  data, or transactional values. (HG1.)
- **No county scoping.** PACS schema is county-agnostic. (HG2.)
- **No runtime mutation.** The catalog is constructed once and
  never patched. (HG3.)

## Open questions (deferred to C48-B)

- **Concrete representation.** Typed C# records (compile-time
  safety, lots of generated code) vs. EF read-models (queryable but
  database-heavy) vs. in-memory dictionaries (lightweight but
  weakly typed). Tradeoff between developer ergonomics and runtime
  flexibility.
- **Source-file canonical paths.** C48-B records the actual
  filesystem paths used; SCOPE policy is to keep the path manifest
  out of source control if it leaks operator workstation layout,
  or in source control with redaction if it's safely abstract.
- **Coverage floor.** What percentage of known PACS tables must be
  covered before C48-B's startup self-check stops failing
  loudly? Operator + product call.
- **Schema upgrade story.** When the PACS vendor ships a new release,
  what's the workflow to re-ingest? Manual re-run + redeploy
  (simplest) vs. catalog hot-swap with version negotiation
  (complex). Defer to operational experience.
- **Catalog-version pinning by canonical landing rows.** Should
  `CanonicalSaleQualifications` and future canonical tables carry a
  `SourceSchemaVersion` column alongside `SourceWorkbookId` for
  full provenance? Likely yes; defer to the canonical-table
  evolution slice that lands first.
