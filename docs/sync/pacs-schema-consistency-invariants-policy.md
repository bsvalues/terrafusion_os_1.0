# PACS Schema Catalog — Consistency Invariants Policy

**Slice:** C53-CONS-A (docs-only — first slice of the C53-CONS
family. Defines the cross-record consistency invariant set the
catalog and its manifest layers MUST hold, before any centralized
implementation. C53-CONS-B will land the invariant engine + report
+ tests against this contract.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C53-CONS-*`).
**Status:** policy locked; C53-CONS-B implementation deferred.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-catalog-completion-handoff.md` — C48-CLOSE
  closure marker + deferred-scope index. The C53-CONS-* row is
  repurposed by this slice to mean "schema consistency invariants"
  (the original "Consumer migrations beyond SyncAtlas" intent is
  now considered subsumed by the C49-FK / C50-CONV / C51-PII PROMOTE
  arcs that already migrated the only Sync consumer that mattered).
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A.
  HG7 (fail-closed) is the load-bearing guard this slice
  centralizes.
- `docs/sync/pacs-schema-foreign-key-inference-policy.md` — C49-FK-A.
  Some C49-FK-B integrity checks are subsumed here.
- `docs/sync/pacs-schema-conversion-manifest-policy.md` — C50-CONV-A.
- `docs/sync/pacs-schema-pii-classification-manifest-policy.md` —
  C51-PII-A.
- `docs/sync/pacs-schema-exported-fk-override-manifest-policy.md` —
  C52-OVR-A. Some C52-OVR-B integrity checks (HG-OVR-2 dedup) are
  subsumed here.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1.

## Why this slice

C48 built the catalog. C49-FK added FK edges (declared, exported,
inferred). C50-CONV added conversion-era manifests. C51-PII added
PII classification manifests. C52-OVR added Exported FK override
manifests. Each slice landed its own ad-hoc integrity checks:

- C48-B refuses dangling-column / dangling-table FK source/target
  references at catalog-build time.
- C48-B refuses composite-arity-mismatch FK edges at catalog-build
  time.
- C49-FK-B refuses InferredByName edges that name a missing
  dictionary.
- C50-CONV-B refuses manifest entries with `Era=Unknown`,
  duplicate keys, or empty Reason.
- C51-PII-B refuses TableExhaustiveFlags entries naming non-existent
  catalog tables (HG-PII-2).
- C52-OVR-B refuses Exported entries with arity mismatch / empty
  fields / shape-match against Declared.

These checks work, but they are scattered across five implementation
sites with no single authority describing **what catalog
consistency means as a whole**. Three concrete problems follow:

- **Drift risk.** The next manifest layer (C52-OVR-C non-FK
  overrides, etc.) will need its own ad-hoc checks. Without a
  centralized invariant set, the new layer's checks may overlap
  inconsistently with existing ones, or miss an invariant that the
  earlier layers caught.
- **Audit opacity.** "Is this catalog consistent?" today is
  answered by "every check that ran during build passed" — useful
  but not introspectable. An operator (or future agent) cannot ask
  the catalog to enumerate what it checked and what passed.
- **Repair friction.** When a manifest references a table that
  doesn't exist in the catalog, the operator gets one
  exception per check site. A unified invariant report would
  surface every issue at once, the way a typechecker reports every
  error before the build aborts.

C53-CONS-A defines the invariant set. C53-CONS-B will centralize
the implementation, surface a versioned report, and replace the
ad-hoc check sites where doing so doesn't break HG7 fail-closed
behavior. The invariant set itself is additive: this slice does
NOT remove or relax any existing check.

## Invariant categories (binding)

C53-CONS-B implements one or more invariants per category. The
list below is the binding scope; C53-CONS-B may add NEW invariants
within these categories (with this doc updated by a future
corrigendum slice if the addition changes severity), but it MUST
NOT silently remove invariants from this list.

### Table invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| TBL-001     | Error    | Every catalog table has a non-empty `TableName`. |
| TBL-002     | Error    | No two catalog tables share the same `TableName` (case-sensitive). |
| TBL-003     | Error    | Every catalog table has a non-empty `ProvenancePath` (HG6). |
| TBL-004     | Warning  | A catalog table has zero columns (catalog parser likely missed it). |
| TBL-005     | Advisory | A catalog table has zero `IdentityTuple` entries AND no fallback `<table>_id` column was found. |

### Column invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| COL-001     | Error    | Every catalog column has a non-empty `TableName` and `ColumnName`. |
| COL-002     | Error    | Every catalog column's `TableName` references an existing catalog table. |
| COL-003     | Error    | No two catalog columns share the same `(TableName, ColumnName)` tuple (case-sensitive). |
| COL-004     | Error    | Every catalog column has a non-empty `ProvenanceLine` (HG6). |
| COL-005     | Warning  | A catalog column declares a `DictionaryRef` whose `DictionaryTable` is not a known catalog table. |

### Dictionary invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| DICT-001    | Error    | Every catalog dictionary has a non-empty `DictionaryName`. |
| DICT-002    | Error    | No two catalog dictionaries share the same `DictionaryName` (case-sensitive). |
| DICT-003    | Error    | Every catalog dictionary's `DictionaryName` references an existing catalog table (the dictionary's source table). |
| DICT-004    | Error    | Every catalog dictionary's `KeyColumn` references an existing column on its source table. |
| DICT-005    | Warning  | A catalog dictionary's `DescriptionColumn` is null (operator may not be able to render lookup values). |
| DICT-006    | Advisory | A non-dictionary catalog table has a column ending in `_cd` / `_code` / `Code` but no FK edge to a known dictionary. |
| DICT-007    | Error    | Every catalog dictionary has a non-empty `ProvenancePath` (HG6). Added by C53-CONS-C; subsumes the per-slice ValidateProvenance check that previously fired at catalog-build time. Invariant set version bumped 1.0.0 → 1.1.0. |

### FK invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| FK-001      | Error    | Every catalog FK has a non-empty `ConstraintName`. |
| FK-002      | Error    | Every catalog FK's `SourceTable` and `TargetTable` reference existing catalog tables. |
| FK-003      | Error    | Every catalog FK's `SourceColumns` and `TargetColumns` reference existing catalog columns on their respective tables. |
| FK-004      | Error    | Every catalog FK has matching `SourceColumns.Count == TargetColumns.Count` (composite arity). |
| FK-005      | Error    | No two catalog FKs share the same `ConstraintName` (within a single source provenance). |
| FK-006      | Warning  | A catalog FK has `Confidence = InferredByName` and no Declared or Exported edge promotes the same shape. (Surfaces operator-promotion candidates.) |

### Conversion-era invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| CONV-001    | Error    | A `PacsConversionTableEntry` references a `TableName` that exists in the catalog. |
| CONV-002    | Error    | A `PacsConversionColumnEntry` references a `(TableName, ColumnName)` that exists in the catalog. |
| CONV-003    | Error    | Manifest era values are never `Unknown` (HG-CONV-2). |
| CONV-004    | Warning  | A column has `ConversionEra = Unknown` while the manifest is engaged. (Surfaces uncovered columns the operator may want to annotate.) |

### PII metadata invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| PII-001     | Error    | A `PacsPiiTableEntry` references a `TableName` that exists in the catalog. |
| PII-002     | Error    | A `PacsPiiColumnEntry` references a `(TableName, ColumnName)` that exists in the catalog. |
| PII-003     | Error    | Every name in `TableExhaustiveFlags` references a `TableName` that exists in the catalog (HG-PII-2). |
| PII-004     | Warning  | A table is in `TableExhaustiveFlags` but has columns with `PiiClassification = Direct` (operator should reconcile — exhaustiveness on a table containing Direct PII is unusual). |

### Exported FK manifest invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| OVR-001     | Error    | Every Exported FK manifest entry's `SourceTable` and `TargetTable` reference existing catalog tables. |
| OVR-002     | Error    | Every Exported FK manifest entry's `SourceColumns` and `TargetColumns` reference existing catalog columns on their respective tables. |
| OVR-003     | Error    | Exported FK manifest constraint names are unique within the manifest. |
| OVR-004     | Warning  | An Exported FK manifest entry shape-matches an existing Declared edge (HG-OVR-2 → entry was dropped at translate time; report surfaces this so the operator can clean up the manifest). |

### Cross-manifest invariants

| Code        | Severity | Statement |
|-------------|----------|-----------|
| XREF-001    | Error    | A column annotated as `PiiClassification = Direct` is also referenced as a dictionary `KeyColumn`. (Direct PII columns SHOULD NOT be dictionary keys; if they are, audit immediately.) |
| XREF-002    | Advisory | A column annotated `Pre2017` (in a maintained-table family) participates in an Exported FK edge. (Exported edges to historical-only columns are valid but unusual.) |

## Severity levels (binding)

```text
- Error    : invariant violation that compromises catalog
             correctness. By default, a catalog build fails
             closed when ANY Error invariant fires. Per HG7 the
             operator may opt to continue with explicit override,
             but consumers consulting the catalog SHOULD refuse to
             use it.

- Warning  : invariant violation that does not compromise
             correctness today but indicates a likely operator
             issue (un-promoted inference, missing description
             column, etc.). Catalog build succeeds; consumers
             may consult the report to surface in logs.

- Advisory : non-invariant observation that may help the operator
             improve the catalog (naming mismatch, lane mismatch,
             cross-county portability concern). Catalog build
             succeeds; report is purely informational.
```

## Fail-closed rules (binding)

C53-CONS-B's centralized implementation MUST honor:

1. **Default is fail-closed on Error.** Catalog build aborts with
   a structured exception when any Error invariant fires. The
   exception message MUST include every Error invariant fired in
   the build (not just the first), so the operator sees the full
   set in one shot.
2. **Warning and Advisory NEVER abort the build.** They surface
   in the invariant report only.
3. **No silent skip.** The implementation MUST run every invariant
   in scope for the catalog being built; selectively disabling
   invariants requires an explicit operator opt-out flag (proposed:
   `LivePacsSchemaSourceOptions.SuppressInvariants : IReadOnlySet<string>`)
   that lists the invariant codes to demote. Codes not in the set
   run normally. Per HG7, suppressing an Error invariant is
   operator-decision territory; the doc does not authorize any
   default suppression.
4. **Existing ad-hoc checks remain as backstop.** C53-CONS-B
   centralizes the invariant set but does NOT remove the existing
   C48-B / C49-FK-B / C50-CONV-B / C51-PII-B / C52-OVR-B integrity
   checks. They run first as before. The centralized check is
   additive — it catches what the per-slice checks may have missed
   and produces the unified report. (A future C53-CONS-C
   consolidation slice may absorb the per-slice checks once the
   centralized set proves equivalent.)
5. **Invariant set is versioned.** The report carries the C53-CONS
   invariant-set version. Consumers may pin to a version and refuse
   to run against a different one.

## Invariant report shape (binding)

```csharp
/// <summary>
/// One row in a PacsSchemaInvariantReport. Carries the violation
/// code, severity, message, optional table/column locator, and
/// HG6-source-traceable provenance.
/// </summary>
public sealed record PacsSchemaInvariantResult(
    PacsSchemaInvariantSeverity Severity,
    string Code,             // e.g. "TBL-002", "FK-003", "PII-003"
    string Message,          // human-readable
    string? TableName,       // when applicable
    string? ColumnName,      // when applicable (TableName must also be set)
    string Provenance);      // pointer back to the catalog record / manifest path

public enum PacsSchemaInvariantSeverity
{
    Advisory = 1,
    Warning  = 2,
    Error    = 3,
}

/// <summary>
/// The full report produced by the invariant engine for one
/// catalog build. Carries the invariant-set version, build
/// timestamp, and per-row results.
/// </summary>
public sealed record PacsSchemaInvariantReport(
    string InvariantSetVersion,           // e.g. "1.0.0"
    DateTime ProducedAtUtc,
    IReadOnlyList<PacsSchemaInvariantResult> Results)
{
    public IEnumerable<PacsSchemaInvariantResult> Errors    => Results.Where(r => r.Severity == PacsSchemaInvariantSeverity.Error);
    public IEnumerable<PacsSchemaInvariantResult> Warnings  => Results.Where(r => r.Severity == PacsSchemaInvariantSeverity.Warning);
    public IEnumerable<PacsSchemaInvariantResult> Advisories => Results.Where(r => r.Severity == PacsSchemaInvariantSeverity.Advisory);
}
```

The report SHOULD be exposed to consumers through the catalog
interface (proposed: `IPacsSchemaCatalog.InvariantReport { get; }`)
or the catalog version (`PacsSchemaVersion.InvariantReportSummary`).
C53-CONS-B picks one and documents it.

## C53-CONS-B implementation contract

C53-CONS-B is the next slice in this family. Its scope:

1. **Add `PacsSchemaInvariantResult`, `PacsSchemaInvariantSeverity`,
   `PacsSchemaInvariantReport`** to
   `backend/src/TerraFusion.Sync/Workbench/Schema/`.
2. **Add `IPacsSchemaInvariantEngine`** with a single method
   shape `PacsSchemaInvariantReport Evaluate(IPacsSchemaCatalog
   catalog, /* manifests passed through PacsSchemaSourceData */)`.
3. **Add default implementation** that runs every Error / Warning
   invariant in this doc's binding tables. Advisories may be
   deferred to a future C53-CONS-C slice.
4. **Wire into `PacsSchemaCatalog.BuildAsync`** after construction
   completes. On any Error result, throw a structured
   `InvalidOperationException` carrying the full report's error
   list. On Warnings / Advisories, attach the report to the
   catalog (via the surface picked in step 5 below).
5. **Pick the catalog surface** for the report: either
   (a) extend `PacsSchemaVersion` with `InvariantReportSummary` (one-
       line counts of Error/Warning/Advisory), or
   (b) add `IPacsSchemaCatalog.InvariantReport` carrying the full
       report.
   C53-CONS-B picks one; the doc allows either.
6. **Add `LivePacsSchemaSourceOptions.SuppressInvariants`** as
   `IReadOnlySet<string>?` (default null). When set, codes in the
   set are demoted from Error → Warning and from Warning →
   Advisory. Suppressing Advisory has no effect (already lowest).
7. **Pin the invariant-set version** to `"1.0.0"` in C53-CONS-B
   output. Future invariant additions bump per semver.
8. **Unit tests**: at minimum one test per Error invariant that
   constructs a violating fixture and asserts the report contains
   the expected code with Error severity. Plus tests for: report
   produced on clean catalog (zero Errors), suppression flag
   behavior, fail-closed exception message contains all errors.
9. **No live PACS smoke required.**
10. **No catalog-rewrite required.** Existing per-slice checks
    continue to run; the engine adds its layer.

## Out of scope (deferred)

- **C53-CONS-C** : consolidate per-slice checks into the
  centralized engine (remove duplicate work). Out of scope for
  C53-CONS-B; lands when the engine has proven itself in
  production.
- **C53-CONS-D** : invariant report persistence (write the report
  to a known artifact path so audits can consume it). Out of scope
  for now; the report can be log-emitted by C53-CONS-B's caller.
- **C53-CONS-E** : invariant report diffing across catalog builds
  (surface "what got worse / better"). Out of scope.
- **Cross-county invariant set** : whether different counties
  should run different invariant subsets. Out of scope until at
  least two counties are in scope.

## Acceptance for C53-CONS-A

This slice is docs-only. Acceptance criteria:

- [x] Policy file lands at
  `docs/sync/pacs-schema-consistency-invariants-policy.md`.
- [x] Seven invariant categories defined (table, column, dictionary,
  FK, conversion-era, PII, Exported FK manifest) plus cross-manifest.
- [x] Three severity levels defined (Error, Warning, Advisory).
- [x] Fail-closed rules stated explicitly.
- [x] Invariant report shape (record + enum) is binding.
- [x] C53-CONS-B implementation contract enumerated (10 scope items).
- [x] Cross-references to C48-A, C49-FK-A, C50-CONV-A, C51-PII-A,
  C52-OVR-A.
- [x] Handoff doc updated to repurpose the C53-CONS-* row.
- [x] No code changes; no test changes; no catalog changes.

## Non-goals (explicit)

- C53-CONS-A is not the invariant engine. It specifies which
  invariants exist; C53-CONS-B implements them.
- C53-CONS-A does not retire any existing per-slice integrity check.
  Backstop discipline: C53-CONS adds, the per-slice checks remain
  until C53-CONS-C consolidates.
- C53-CONS-A does not authorize default suppression of any Error
  invariant. The `SuppressInvariants` option is operator-decision
  territory.
- C53-CONS-A does not change `PacsForeignKey`, `PacsConversionEra`,
  `PiiClassification`, or any C48-B record shape.
- C53-CONS-A does not introduce a runtime invariant check (e.g.,
  re-validating after operator edits at runtime). The engine runs
  at catalog-build time only.

## Open questions (deferred to C53-CONS-B)

- Should the engine return Advisory results in C53-CONS-B, or
  defer Advisory to a future slice? Currently binding contract says
  Advisory may be deferred — C53-CONS-B's choice.
- Should the report carry the invariant-set version inline on each
  result (per-row), or only on the report header? Currently binding
  says report header; per-row may add in a future corrigendum.
- Should the report be deterministic-ordered (e.g., by code then
  table name)? Strongly suggested but not binding; C53-CONS-B may
  decide.
- Should the suppression flag accept regex / glob patterns
  (e.g., `"FK-*"` to suppress all FK invariants)? Currently no —
  exact codes only.

## Slice ledger note

Updates the C53-CONS arc:

- C53-CONS-A   : DONE — policy lock.
- C53-CONS-B   : DONE — invariant engine + report + tests (set 1.0.0).
- C53-CONS-C   : DONE — consolidated per-slice checks; added DICT-007;
                 invariant set bumped 1.0.0 → 1.1.0.
- C53-CONS-D   : DONE — invariant report persistence (JSON artifact
                 writer; caller-driven; see Persistence section).
- C53-CONS-E   : DONE — invariant report diffing
                 (PacsSchemaInvariantReportDiff.Compute; see
                 Diffing section below).

Promotion happens slice-by-slice; nothing in C53-CONS-A should be
read as authorizing later slices until each lands.

## Persistence (C53-CONS-D)

The `PacsSchemaInvariantReport` produced by the engine is in-memory
only. C53-CONS-D adds an opt-in artifact writer
(`PacsSchemaInvariantReportArtifact.WriteAsync`) for audits and
catalog-build telemetry that prefer not to scrape log output.

### Wire format (binding)

Indented JSON with camelCase fields:

```json
{
  "invariantSetVersion": "1.1.0",
  "producedAtUtc": "2026-04-30T16:34:11.1234567Z",
  "errorCount": 0,
  "warningCount": 2,
  "advisoryCount": 0,
  "isClean": true,
  "results": [
    {
      "severity": "Warning",
      "code": "DICT-005",
      "message": "...",
      "tableName": "owner",
      "columnName": null,
      "provenance": "..."
    }
  ]
}
```

Header summary fields (`errorCount` / `warningCount` /
`advisoryCount` / `isClean`) are derived from the engine's
projections; consumers may read just the header for triage and
skip the per-row `results` for compact dashboards.

### Hard guards

- **Caller-driven.** The catalog itself does not write the
  artifact; the helper is invoked by whoever owns the I/O context
  (operator console, API startup, test harness). Catalog stays
  HG3 read-only and free of file I/O.
- **Path is required and explicit.** No glob, no walk, no default
  location. Caller passes a path or doesn't call.
- **Fail-closed on I/O failure.** The writer throws; it does not
  swallow exceptions. Caller decides surfacing.

### Out of scope (C53-CONS-E and later)

- Append-only history (multiple reports in one file).
- Compression / hash-stable serialization.
- Any consumer that READS the artifact — downstream surface,
  not this slice.

## Diffing (C53-CONS-E)

Adds `PacsSchemaInvariantReportDiff.Compute(previous, current)` —
a pure function that compares two reports and returns a structured
diff. Used by catalog-build CI / audit dashboards to surface "what
got better, what got worse" between two builds.

### Diff identity (binding)

Result rows are keyed by `(Code, TableName, ColumnName)`. Two
reports may have semantically-identical rows whose `Message` or
`Provenance` strings differ (e.g., the engine's message wording
changed in a minor invariant-set bump); the diff treats those as
the same row to avoid noise.

### Three change categories

- **Added** — rows present in current but not previous. New
  violations surfaced (regression).
- **Removed** — rows present in previous but not current. Violations
  fixed (improvement).
- **SeverityChanged** — same `(Code, TableName, ColumnName)` but
  different `Severity`. Surfaces suppression-list changes (e.g.,
  Error → Warning) or unsuppressed regressions
  (Warning → Error).

Plus per-severity count deltas (`ErrorDelta`, `WarningDelta`,
`AdvisoryDelta`) for header-level dashboards. Each delta carries
`Previous` and `Current` counts plus a derived `Diff` (current −
previous; positive = regression on that severity tier).

### Null-baseline handling

When `previous` is `null` (first build of a catalog, no baseline
yet), every current row is reported as `Added`. The diff's
`PreviousInvariantSetVersion` surfaces as the literal string
`"(none)"` so downstream consumers can distinguish "no baseline"
from "baseline matches current."

### Hard guards

- **Pure function.** `Compute` does no I/O. Caller passes two
  reports, gets back a record. No side-effects, no logging, no
  persistence — the caller decides whether to write the diff
  somewhere.
- **No silent merging.** When the two reports have different
  `InvariantSetVersion` values, the diff surfaces both versions
  explicitly (`PreviousInvariantSetVersion` /
  `CurrentInvariantSetVersion`). Consumers may refuse to act on
  cross-version diffs if they need stable identity.
- **`null` current rejected.** `ArgumentNullException` for null
  current report; `null` previous IS allowed and treated as the
  baseline-empty case.

### Out of scope

- Persistence of the diff (downstream surface; caller writes if
  it wants).
- Cross-version semantic remapping (when an invariant code is
  renamed, the diff surfaces the rename as Added+Removed; consumers
  that want a "renamed" category build it on top of the diff).
- Time-windowed history (multiple prior reports diffed against
  one current).
