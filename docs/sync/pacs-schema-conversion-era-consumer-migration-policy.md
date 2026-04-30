# PACS Schema Catalog — Conversion-Era Consumer Migration Policy

**Slice:** C50-CONV-C (docs-only — third slice of the C50-CONV
family. Defines the contract by which downstream consumers
consult `PacsConversionEra` metadata at runtime. Mirrors
C49-FK-C in structure and discipline.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C50-CONV-*`).
**Status:** policy locked; per-consumer migration slices deferred
under the `C50-CONV-PROMOTE-*` reservation.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-conversion-manifest-policy.md` — C50-CONV-A
  + A1 corrigendum: catalog data model and the three CONV hard
  guards. This doc reuses CONV-2 (Unknown is sentinel) and CONV-3
  (callers MUST decide explicitly).
- `docs/sync/pacs-schema-fk-consumer-migration-policy.md` — C49-FK-C.
  This doc is the era-domain analog. The shape (per-call-site stance,
  Pass/Warn/Fail outcomes, fail-closed-on-Required) is intentionally
  identical so consumers learn the pattern once.
- `docs/sync/pacs-schema-foreign-key-inference-policy.md` — C49-FK-A.
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1.

## Why this slice

C50-CONV-A defined the manifest. C50-CONV-B implemented it: the
catalog now exposes `PacsConversionEra` on every `PacsTable` and
`PacsColumn`. The catalog can be queried, but no production
consumer reads the era yet (per the C50-CONV-A "Out of scope"
section: until C50-CONV-C lands, no production consumer is
permitted to take a runtime decision based on `ConversionEra`).

This slice opens that gate. It defines:

- The shape of the per-call-site stance.
- The three runtime outcomes (Pass / Warn / Fail) and their
  required caller responses.
- The structured message format consumers must surface.
- The mandatory test matrix any consumer migration slice must
  satisfy.
- The scoreboard tracking which consumers have migrated.

After this slice lands, individual consumer-migration slices
(`C50-CONV-PROMOTE-*`) wire specific call sites — dictionary
loaders, comp readers, mapping workbench — through the stance.
Each is an additive line per call site, same shape as the
C49-FK-PROMOTE arc (which moved from 0 to 10 SyncAtlas configs
across slices E through L without changing catalog or preflight
code).

## First consumer category (binding)

The first consumer category for era-aware preflight is the same
shape that C49-FK migrated: **dictionary loaders** in the
SyncAtlas allowlist, plus future comp / sale readers in the C49-FK-
adjacent layer.

The era preflight runs **alongside** the FK preflight, not as a
replacement:

```text
For each loader call site:
    1. FK preflight       (per C49-FK-C)        → Pass / Warn / Fail
    2. Era preflight      (per THIS doc)        → Pass / Warn / Fail
    3. Loader runs only if both Pass (or Warn under their respective
       advisory stances).
```

A consumer that has migrated FK but NOT era continues to behave as
before (era preflight is opt-in per HG-CONV-3 and per the per-
call-site stance enum below). Migration is incremental.

## What the migrated consumer may do

A migrated consumer:

- Reads `ConversionEra` from `PacsTable` and/or `PacsColumn` records
  via the existing catalog query surfaces. (No new query method is
  required; the field is already exposed.)
- Calls a new `IConversionEraPreflight.ValidateAsync` service
  (introduced in C50-CONV-D, the implementation slice for this
  policy) to apply the per-call-site stance to a target
  (table, columns) shape.
- Re-emits the structured message verbatim on Warn (log) or Fail
  (throw `InvalidOperationException`).
- Annotates the loader's structured logs with the matched era
  for downstream forensic queries.

## What the migrated consumer must NOT do

A migrated consumer MUST NOT:

- Inspect `ConversionEra` directly to make a runtime branching
  decision **without** going through the preflight. The preflight
  is the gate; direct field inspection bypasses HG-CONV-3.
- Treat `Unknown` as anything other than its declared meaning
  ("no manifest engagement for this catalog item"). Specifically,
  `Unknown` MUST NOT be silently aliased to `Both` or `Post2017`.
  Consumers that cannot proceed under `Unknown` MUST surface that
  via Fail; consumers that can proceed under `Unknown` MUST be
  using the `AllowAny` stance explicitly.
- Override the manifest's per-column `Pre2017` declaration with a
  consumer-specific override. The manifest is the source of truth;
  consumer-local rewrites of era are a defects-as-policy
  anti-pattern.
- Cache era between runs. The catalog is rebuilt per process
  start; era is whatever the catalog says at the time of preflight.

## Per-call-site stance (binding)

Every consumer that consults era metadata MUST pick one of three
stances per call site, explicitly. There is no default. This is
the era-domain analog of C49-FK-C's `DictionaryLoaderPreflightStance`
and follows HG-CONV-3.

```csharp
public enum ConversionEraPreflightStance
{
    /// <summary>
    /// Loader requires post-2017 operational data. The matched
    /// era MUST be Post2017 or Both. Pre2017 → Fail. Unknown →
    /// Fail. Caller MUST throw on Fail.
    /// </summary>
    RequirePost2017OrBoth = 1,

    /// <summary>
    /// Loader is OK with pre-2017-only data (e.g., a historical
    /// research surface). Any era except Unknown is acceptable;
    /// Unknown → Fail because the loader cannot proceed without
    /// knowing what era the data is from. Caller MUST throw on
    /// Fail.
    /// </summary>
    AllowPre2017 = 2,

    /// <summary>
    /// Loader treats every era as acceptable, including Unknown.
    /// This is the "diagnostic / browsing" stance. Production
    /// consumers SHOULD pick RequirePost2017OrBoth or AllowPre2017
    /// instead. AllowAny is for surfaces like the catalog browser
    /// itself, which by definition has to render every entry
    /// regardless of era.
    /// </summary>
    AllowAny = 3,
}
```

The enum has no `Unspecified` / `Default` member. Per HG-CONV-3,
caller MUST pick.

## Outcomes (binding)

The preflight returns one of three outcomes:

```csharp
public enum ConversionEraPreflightOutcome
{
    /// <summary>
    /// Era of the (table, columns) shape is acceptable under the
    /// caller's stance. Caller proceeds with no behavior change.
    /// </summary>
    Pass = 1,

    /// <summary>
    /// Era is acceptable but the catalog could not resolve a
    /// per-column era (only the table-level era was available),
    /// or the era was inferred from a single-column entry where
    /// a composite was requested. Caller logs and proceeds. There
    /// is intentionally no Warn-on-Pre2017-under-AllowPre2017 —
    /// that's a Pass.
    /// </summary>
    Warn = 2,

    /// <summary>
    /// Era is unacceptable under the caller's stance. Caller MUST
    /// throw InvalidOperationException with the structured
    /// message.
    /// </summary>
    Fail = 3,
}
```

The mapping is:

| Stance                  | Era=Both | Era=Post2017 | Era=Pre2017 | Era=Unknown |
|-------------------------|----------|--------------|-------------|-------------|
| RequirePost2017OrBoth   | Pass     | Pass         | Fail        | Fail        |
| AllowPre2017            | Pass     | Pass         | Pass        | Fail        |
| AllowAny                | Pass     | Pass         | Pass        | Pass        |

`Warn` is reserved for the table-only / composite-mismatch
diagnostics described above. The outcome table covers the
common runtime path.

## Structured message format (binding)

Fail and Warn results MUST carry a message of the form:

```text
[ConversionEraPreflight] <Outcome> for '<table>(<columns>)' under <stance>:
matched era <Era> from <provenance>. <reason>
```

`provenance` resolves to one of:

- `column-entry` — manifest's column-level annotation.
- `table-entry-inherited` — manifest's table-level entry, applied
  to a column without its own annotation.
- `manifest-not-engaged` — catalog built without
  `ConversionManifestPath` set; era is C48-B's `Both` default.
- `manifest-engaged-no-entry` — manifest engaged but neither table
  nor column was annotated; era is `Unknown`.

`reason` is the operator-supplied `Reason` string from the
manifest entry (when one applies), or the C50-CONV-B default
explanation when no manifest entry exists.

Consumers MUST re-emit this message verbatim. This is the same
discipline as the C49-FK-C structured message; identical pattern,
different domain.

## Test matrix (binding for C50-CONV-D implementation)

Any consumer-migration slice MUST satisfy this matrix at minimum.
Additional consumer-specific tests may layer on top.

| # | Scenario                                              | Stance                  | Expected outcome |
|---|-------------------------------------------------------|-------------------------|------------------|
| 1 | Catalog with manifest engaged, column annotated Both  | RequirePost2017OrBoth   | Pass             |
| 2 | Catalog with manifest engaged, column annotated P2017 | RequirePost2017OrBoth   | Pass             |
| 3 | Catalog with manifest engaged, column annotated Pre   | RequirePost2017OrBoth   | Fail             |
| 4 | Catalog with manifest engaged, column UNANNOTATED     | RequirePost2017OrBoth   | Fail (Unknown)   |
| 5 | Catalog NOT engaged (no manifest path)                | RequirePost2017OrBoth   | Pass (Both)      |
| 6 | Catalog with manifest engaged, column annotated Pre   | AllowPre2017            | Pass             |
| 7 | Catalog with manifest engaged, column UNANNOTATED     | AllowPre2017            | Fail (Unknown)   |
| 8 | Catalog with manifest engaged, column UNANNOTATED     | AllowAny                | Pass             |
| 9 | Stance value 0 / undefined                            | (any era)               | ArgumentException|
|10 | Null catalog / target / columns                       | (any)                   | ArgumentNullException |

The "manifest NOT engaged" case (#5) honors the C50-CONV-B
backwards-compat bridge: until call sites engage the manifest
layer, the catalog continues to report `Both` and the preflight
treats that honestly. Migration tightening is the
`C50-CONV-PROMOTE-*` arc per call site, exactly like C49-FK-PROMOTE.

## C50-CONV-D implementation target

C50-CONV-D is the implementation slice for this policy. Its scope:

1. **Add `IConversionEraPreflight` + `ConversionEraPreflight`** at
   `backend/src/TerraFusion.Sync/Workbench/Schema/`.
2. **Add `ConversionEraPreflightStance` enum** (the three values
   above).
3. **Add `ConversionEraPreflightOutcome` enum** (the three values
   above).
4. **Add `ConversionEraPreflightResult` record**:
   `(Outcome, Message, MatchedEra, Provenance)`.
5. **Validate stance at entry** per HG-CONV-3 (zero-value /
   undefined → ArgumentException).
6. **Resolve era from catalog** by precedence:
   column annotation → table annotation → manifest-engaged-no-
   entry (Unknown) → manifest-not-engaged (Both, C48-B legacy).
7. **Apply stance × era → outcome** per the table above.
8. **Build the structured message** per the binding format.
9. **Unit tests**: at minimum the 10 cases in the test matrix.
10. **No live PACS smoke required** for C50-CONV-D. The unit
    tests + a hand-authored fixture catalog are sufficient. The
    first live-DB invocation lands as part of the first
    `C50-CONV-PROMOTE-*` slice.
11. **No consumer migration**. Per HG-CONV-3 deferred-to-PROMOTE,
    no SyncAtlas / loader / reader code path consults the
    preflight in C50-CONV-D itself. The PROMOTE slices wire each
    consumer additively, the same way C49-FK-E…L wired the FK
    preflight one configKey at a time.

## Out of scope (deferred)

- **C50-CONV-PROMOTE-*** slices — per-consumer migration. Each
  picks RequirePost2017OrBoth, AllowPre2017, or AllowAny per call
  site, with the choice grounded in the call site's actual data
  needs. Pattern is identical to C49-FK-E…L; no policy gate
  needed beyond this doc.
- **Era propagation through views / synonyms** — out of scope
  because C48-E filters views out of the catalog.
- **Multi-era columns** — a column that holds Pre2017 data for
  some rows and Post2017 for others is not modeled. The manifest
  ascribes one era per (table, column); row-level era is a
  separate problem deferred to a future C50-CONV-G slice if and
  when a county hits it.
- **Era-aware sales filtering** — a comp reader that wants
  "post-2017 sales only" is conceptually different from this
  preflight: that's a value-domain filter, not a catalog-shape
  preflight. Stays in the C49-COMP family.

## Acceptance for C50-CONV-C

This slice is docs-only. Acceptance criteria:

- [x] Policy file lands at
  `docs/sync/pacs-schema-conversion-era-consumer-migration-policy.md`.
- [x] Per-call-site stance enum binding (3 values, no default).
- [x] Outcome enum binding (3 values).
- [x] Stance × era → outcome mapping table is complete (4 eras × 3
  stances = 12 cells; binding).
- [x] Structured-message format is binding.
- [x] Test matrix has at least 10 cases (binding for C50-CONV-D).
- [x] Implementation contract (C50-CONV-D scope) is enumerated.
- [x] Cross-references to C50-CONV-A1, C49-FK-C, C48-A.
- [x] No code changes; no test changes; no catalog changes.

## Non-goals (explicit)

- C50-CONV-C does not authorize any consumer to consult era
  metadata at runtime. That gate is `C50-CONV-PROMOTE-*` per
  call site.
- C50-CONV-C does not change the C50-CONV-A1 enum (the
  shipped C48-B `PacsConversionEra`).
- C50-CONV-C does not retire C49-FK preflight. The two preflights
  are independent and run side-by-side.
- C50-CONV-C does not change the backwards-compat bridge
  documented in C50-CONV-B's commit message. Un-engaged callers
  continue to see `Both` defaults; the preflight reports that
  honestly via `manifest-not-engaged` provenance.

## Open questions (deferred to C50-CONV-D)

- Should the preflight return per-column results (a list keyed
  by column) when the call site declares multiple columns, or a
  single combined result that picks the worst era? Currently
  binding contract says single combined result; C50-CONV-D may
  add a per-column variant if a real consumer needs it.
- Should `Warn` be issued for `manifest-not-engaged` provenance,
  to surface that the catalog is running on the C48-B legacy
  bridge? Currently binding contract says `Pass`; the bridge is
  intentional. C50-CONV-D may add an opt-in flag for surfaces
  that want to nudge the operator toward engaging the manifest.
- Should the structured message include the `LastWriteEvidence`
  path from the manifest entry when present? Currently binding
  contract says no (keep messages compact); C50-CONV-D may add
  a verbose mode for forensic logs.

## Slice ledger note

Updates the C50-CONV arc:

- C50-CONV-A           : DONE — policy locked (f653821c7).
- C50-CONV-A1          : DONE — corrigendum (4736ece2e).
- C50-CONV-B           : DONE — manifest impl + tests (1bd425d70).
- C50-CONV-C           : THIS DOC — consumer migration policy.
- C50-CONV-D           : pending — preflight service + tests.
- C50-CONV-PROMOTE-*   : pending — per-consumer wiring (analog of
                         the C49-FK-PROMOTE arc).
- C50-CONV-B-FOLLOWUP  : pending (optional) — tighten un-engaged
                         default per literal HG-CONV-3.
- C50-CONV-D / E / F / G : deferred (authoring tooling, multi-event,
                         cross-county, row-level era).

Promotion happens slice-by-slice; nothing in C50-CONV-C should be
read as authorizing C50-CONV-D or any PROMOTE slice until each
lands.
