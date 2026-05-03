# PACS Schema Catalog — C48 Completion Handoff

**Slice:** C48-CLOSE (docs-only — completion record. Marks the C48
arc as DONE so future agents do not reopen it as if unfinished.).
**Status:** C48 implementation arc complete.
**Save state at completion:** `main = 51a340259`.

## Completion statement

C48 — the PACS schema catalog implementation arc — is complete.
Sixteen sub-slices (C48-A through C48-P, plus the C48-FIX /
C48-FIX2 / C48-HYGIENE corrections) shipped a live, vendor-neutral,
metadata-only catalog driven by `INFORMATION_SCHEMA` introspection
of Harris PACS, plus a fully-migrated dictionary-loader call site
in `SyncAtlas`. No mechanical C48 migration remains.

This doc is the closure marker. Reopen C48 only if a hard-guard
violation is found in the existing surface; new work goes under
new slice prefixes (see "Deferred new scope" below).

## Completed arc

| Slice | Result | Merge commit |
|---|---|---|
| C48-A | Schema-as-code policy | `4d1b13017` |
| C48-B | Catalog parser + DI service + 7 hard guards (51 tests) | `a7baf6db4` |
| C48-FIX | Tyler→PACS brand correction (vestigial drift swept) | `b6536e90b` |
| C48-FIX2 | Source/target framing (Harris PACS = legacy source; TerraFusion DB = target) | `11feef2b6` |
| C48-HYGIENE | Tyler Vision stale-lore cleanup across CLAUDE.md + architecture docs | `430d1f882` |
| C48-C | Live Harris PACS introspection (`IPacsSchemaSource` + `SqlInformationSchemaIntrospector`) | `0e172de1e` |
| C48-D | Production DI wiring (config-gated) + `GET /api/sync/schema/catalog/summary` admin endpoint | `69ab46166` |
| C48-E | Live endpoint proof — 2229 tables / 32750 columns from real PACS, smoke harness, real-bug fixes (CommandTimeout, view-filter), credential-rotation recovery | `81874aa89` |
| C48-F | Dictionary inference: 203 dicts caught from real PACS via `_cd`/`_desc`/`_dsc` heuristic | `5b391942e` |
| C48-G | `DictionaryConfigFromCatalog.Build` helper + bit-for-bit equivalence test | `ca3c3c2a4` |
| C48-H | First production call site swap (`SyncAtlas` `property_use`) | `3925c4300` |
| C48-I | `property_use:imprv.primary_use_cd` swap | `61755f34d` |
| C48-J | `property_use:sale.primary_use_cd` swap | `8d47ac1e0` |
| C48-K | `property_use:imprv.secondary_use_cd` swap (different `canonical_target`) | `2ea7c14d9` |
| C48-L | `property_use:property_val.secondary_use_cd` (property_use family closed) | `142a253ce` |
| C48-M | `imprv_det_class` (first non-`property_use` dictionary) | `53d69c5db` |
| C48-N | `imprv_det_sub_class` (sub_cls abbreviation; catalog handles verbatim) | `356d3bd89` |
| C48-O | `imprv_det_meth` (`_dsc` variant) | `1f2de600c` |
| C48-P | `land_soil` + heuristic extension for Hungarian-notation columns | `51a340259` |

## What the catalog OWNS

These are the catalog's permanent responsibilities. Code or
extensions that fall under any of these belong inside C48's surface
area and may evolve under future C48-Q+ slices, with the same hard
guards.

- **PACS table metadata.** `PacsTable` records: `TableName`,
  `IdentityTuple`, `ConversionEra`, `DictionaryReferences`,
  `PiiClassification`, `ProvenancePath`. Sourced from
  `INFORMATION_SCHEMA.TABLES`.
- **PACS column metadata.** `PacsColumn` records: type,
  nullability, ordinal position, conversion era, optional
  dictionary reference, PII classification, provenance line.
  Sourced from `INFORMATION_SCHEMA.COLUMNS` (filtered to
  `TABLE_TYPE='BASE TABLE'` per the C48-E view-filter fix).
- **Dictionary inference.** The conservative heuristic from C48-F
  (extended in C48-P): a table is a `PacsDictionary` IFF it has at
  least 2 columns AND its first column ends in `_cd`, `_code`,
  or `Code` (case-sensitive on the Hungarian variant) AND its
  second column ends in `_desc`, `_dsc`, or `Desc`.
- **PACS-side dictionary config.** Given a dictionary name,
  `DictionaryConfigFromCatalog.Build` produces the
  `PacsDictionaryTable` / `CodeColumn` / `DescriptionColumn`
  values for a `DictionaryLoaderTargetConfig` +
  `DictionaryColumnConfig` pair. PACS-side knowledge only.
- **Schema version stamp.** `PacsSchemaVersion` carries
  `PacsRelease`, `SourceFileHashes`, `IngestedAt`, and the
  conversion manifest hash placeholder.
- **Coverage health-check.** `PacsSchemaCatalogHealthCheck`
  reports Healthy when coverage meets a configurable floor;
  Degraded when below.
- **Admin summary surface.**
  `GET /api/sync/schema/catalog/summary` returns
  `SchemaCatalogSummaryDto` with the catalog's coverage counts +
  version stamp; `Configured = false` when no live catalog has
  been registered (operator opt-in via
  `ConnectionStrings:HarrisPacs`).
- **Live introspection source.** `LivePacsSchemaSource` driven by
  `SqlInformationSchemaIntrospector`. Vendor-neutral / Harris-safe
  per C48-FIX. Reads metadata only — no `SELECT *` against any
  user table (HG1 PII-free).

## What the catalog does NOT own

These are explicit non-responsibilities. Future work in any of
these areas does NOT extend C48 — it stands up under its own
slice prefix and may consume the catalog without expanding it.

- **Canonical taxonomy.** `canonical_target` strings like
  `"PropertyUse"` or `"ImprvDetailClass"` are caller-supplied per
  C48-G's design. The catalog has no opinion on canonical
  vocabulary; that's a Forge / TerraFlow / operator concern.
- **Workbook-side source binding.** The
  `(WorkbookSourceSchema, WorkbookSourceTable, WorkbookSourceColumn)`
  triple identifying the workbook column being mapped against a
  dictionary. Catalog has no view of workbook structure;
  `DictionaryWorkbookSource` arrives caller-supplied.
- **Active-flag conventions.** PACS installs vary in how they
  signal active vs inactive dictionary rows (`sys_flag <> 'I'`,
  `active_flag = 'Y'`, no flag at all, or — as on Benton —
  always `'F'` and unusable). The catalog records that columns
  exist and what they're called, not what their values mean. The
  active-flag column + predicate stays caller-supplied per
  per-deployment policy.
- **Year/version columns.** Year-keyed dictionaries (where the
  rows differ across appraisal years) require the operator to
  specify the year column and filter; the catalog does not infer
  this.
- **PII policy beyond the metadata `PiiClassification` flag.** The
  catalog records that a column is classified as `Direct` /
  `Indirect` / `None`, but does not enforce read-side filtering.
  Downstream consumers must consult the classification and refuse
  to surface `Direct`-classified columns on PII-free response
  shapes; this is consumer policy, not catalog policy.
- **Transform behavior.** Source-to-canonical transforms remain
  in `TerraFusion.Sync.Workbench.Transforms.*`. The catalog
  describes what the source looks like; the transform decides
  what to do with it.
- **TerraFusion DB knowledge.** Per the C48-FIX2 source/target
  binding: the catalog reads FROM Harris PACS (the legacy SOURCE),
  never FROM TerraFusion DB (the target).

## Hard guards verified end-to-end

All seven hard guards from `pacs-schema-catalog-as-code-policy.md`
are observed by the shipped surface:

```text
HG1 PII-free                    ✓ INFORMATION_SCHEMA-only queries; metadata only
HG2 county-agnostic             ✓ no CountyId in any catalog record
HG3 read-only at runtime        ✓ catalog built once at startup, never mutated
HG4 versioned                   ✓ PacsSchemaVersion stable across calls
HG5 conversion-aware            ✓ ConversionEra on every column (default Both;
                                  manifest-driven override is deferred new scope)
HG6 source-traceable            ✓ ProvenancePath/Line on every record
HG7 fail-closed                 ✓ missing dictionary throws InvalidOperationException
                                  with typed miss reason; never silent fallback
```

## Proof gates at completion

```text
Save state:                  main = 51a340259
Schema unit tests:           62/62 passing
Full Sync unit regression:   220/220 passing
Build:                       0 errors
Live PACS smoke (latest):    backend/artifacts/sync-atlas/c48-e/c48e-live-summary.20260430T175418Z.json
                             tableCount      = 2229
                             columnCount     = 32750
                             dictionaryCount = 210
                             elapsedMs       = 2268
SyncAtlas migration:         10 / 10 dictionary-loader configKey arms catalog-driven
PACS mutation:               none across the entire arc
TerraFusion DB mutation:     none across the entire arc
```

## Deferred new scope

These are NOT C48 follow-ons. They are genuinely new product
surfaces that consume or extend the catalog. Each gets its own
slice prefix (suggested below); each lands its own policy doc and
its own implementation arc.

| Concern | Suggested prefix | Status | One-line scope |
|---|---|---|---|
| Foreign-key edge inference | `C49-FK-*` | **C49-FK-A/B/C in flight** — policy + impl + consumer policy landed; C49-FK-D implementation pending. See `docs/sync/pacs-schema-foreign-key-inference-policy.md` (C49-FK-A) and `docs/sync/pacs-schema-fk-consumer-migration-policy.md` (C49-FK-C). | Walk every `*_cd` / `*_code` / `*Code` column and try to bind it to an inferred dictionary; expose declared+exported FKs separately from inferred-by-name; first consumer is dictionary-loader preflight validation. |
| Conversion-era manifest | `C50-CONV-*` | _deferred_ | Per-column `Pre2017` / `Post2017` / `Both` overrides driven by an operator-supplied manifest file. Today every column defaults to `Both`. |
| PII heuristic metadata | `C51-PII-*` | _deferred_ | Column-name-pattern rules that auto-classify `*_cv`, `*_addr`, `*_email`, etc. as `Direct` PII. Today every column defaults to `None`. |
| Operator dictionary overrides | `C52-OVR-*` | _deferred_ | Allowlist / denylist for the dictionary inference heuristic. Lets operators force-include shape-borderline tables (e.g. `ptd_tvb_codes` whose first column is just `code` with no underscore) or exclude false-positives. |
| Schema consistency invariants | `C53-CONS-*` | **C53-CONS-A landed** — policy locked; C53-CONS-B implementation deferred. See `docs/sync/pacs-schema-consistency-invariants-policy.md`. | Centralized invariant engine that asserts cross-record consistency across catalog tables, columns, dictionaries, FK edges, and the C50-CONV / C51-PII / C52-OVR manifest layers. Produces a versioned `PacsSchemaInvariantReport` with Error / Warning / Advisory severities. Fail-closed-on-Error by default. (The original "Consumer migrations beyond SyncAtlas" intent for this slot was implicitly satisfied by the C49-FK-PROMOTE / C50-CONV-PROMOTE / C51-PII-PROMOTE arcs that wired all 9 SyncAtlas dictionary loaders end-to-end; further consumer migrations would warrant a fresh prefix.) |
| Multi-county catalog set | `C54-MULTI-*` | **CLOSED for current scope** — A/B/C/D/CLOSE landed. See `docs/sync/pacs-schema-multi-county-catalog-completion-handoff.md`. C54-MULTI-E (cross-county aggregation) and C54-MULTI-PROMOTE-* (per-consumer migration) deferred until multi-county operational reality demands them. | Catalogs per county (so different counties' PACS schemas live side-by-side). Identity is `(CountyId, SourceConnectionId)`; manifests are per-catalog; no implicit default; four isolation rules (ISOL-1..ISOL-4) prevent cross-county manifest / dictionary / fallback / report-diff bleed. Functionally complete for the current Benton-only operating reality. |

If a future agent finds themselves about to "extend C48" — STOP.
Either it's a hard-guard violation (in which case a `C48-FIXn` is
appropriate) or it's deferred new scope (in which case use the
right prefix).

## Cross-reference index

For agents starting a new slice that touches the catalog, read in
order:

1. `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A
   policy + corrected source/target framing + hard guards.
2. `docs/sync/sync-boundary-policy.md` — SCOPE-1 boundary
   (Sync owns ingestion + canonicalization; consumers downstream).
3. `docs/architecture/terrafusion-domain-boundaries.md` — SCOPE-2
   architecture-wide map.
4. `docs/sync/sync-surface-inventory.md` — SCOPE-3 per-surface
   classification (catalog rows added under Category 3 +
   Category 4).
5. `docs/sync/README.md` — Sync doc index (this completion
   handoff is linked there).
6. THIS doc — closure marker.

## What stays committed (forever)

- All C48-A through C48-P source code and tests under
  `backend/src/TerraFusion.Sync/Workbench/Schema/` and
  `backend/tests/TerraFusion.Unit.Tests/Sync/Schema/`.
- The `DictionaryConfigFromCatalog` helper under
  `backend/src/TerraFusion.Sync/Workbench/Pacs/`.
- The C48-D production wiring in
  `backend/src/TerraFusion.API/Program.cs` and the admin endpoint
  in `backend/src/TerraFusion.API/Controllers/SyncController.cs`.
- The migrated `SyncAtlas/Program.cs` switch arms.
- The C48-E smoke harness under
  `backend/artifacts/sync-atlas/c48-e/`.
- All policy docs.
- This handoff.

## What stays operator-side (never committed)

- The Harris PACS `sa` password — lives at
  `~/.terrafusion/pacs-sa-password.tmp` (chmod 600), set into
  `appsettings.Development.local.json` (gitignored), and exported
  into the smoke runner via the `C48E_HARRIS_PACS_CONN` env var.
  Never written to chat, commits, or any tracked file.
- The `tf-mssql` container's volume mounts and runtime state.
- Any per-county PACS connection string variations.
