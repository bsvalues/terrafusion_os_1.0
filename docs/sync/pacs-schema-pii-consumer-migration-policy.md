# PACS Schema Catalog — PII Consumer Migration Policy

**Slice:** C51-PII-C (docs-only — third slice of the C51-PII family.
Defines the contract by which downstream consumers consult
`PiiClassification` metadata at runtime. Mirrors C50-CONV-C in
structure and discipline.).
**Lifecycle layer:** Core Sync — schema infrastructure (C48-CLOSE
deferred-scope index, row `C51-PII-*`).
**Status:** policy locked; per-consumer migration slices deferred
under the `C51-PII-PROMOTE-*` reservation.

**Authoritative cross-references:**

- `docs/sync/pacs-schema-pii-classification-manifest-policy.md` —
  C51-PII-A: catalog data model and the three PII hard guards.
  This doc reuses HG-PII-2 (exhaustiveness assertion) and HG-PII-3
  (callers MUST decide explicitly).
- `docs/sync/pacs-schema-conversion-era-consumer-migration-policy.md`
  — C50-CONV-C. Direct structural analog. The shape (per-call-site
  stance, Pass/Warn/Fail outcomes, fail-closed-on-Required) is
  intentionally identical.
- `docs/sync/pacs-schema-fk-consumer-migration-policy.md` — C49-FK-C.
- `docs/sync/pacs-schema-catalog-as-code-policy.md` — C48-A.
  HG1 (catalog stays PII-free) continues to apply: this doc lets
  consumers read PII *metadata*, not parcel rows.
- `docs/sync/sync-boundary-policy.md` — SCOPE-1.

## Why this slice

C51-PII-A defined the manifest. C51-PII-B implemented it: the
catalog now exposes `PiiClassification` on every `PacsTable` and
`PacsColumn`. The catalog can be queried, but no production
consumer reads PII at runtime yet (per the C51-PII-A "Out of scope"
section: until C51-PII-C lands, no production consumer is
permitted to take a runtime decision based on `PiiClassification`).

This slice opens that gate. It defines:

- The shape of the per-call-site stance (four values, not three).
- The three runtime outcomes (Pass / Warn / Fail) and required
  caller responses.
- The exhaustiveness-aware Fail mode that makes
  `TableExhaustiveFlags` operationally meaningful.
- The structured message format consumers must surface.
- The mandatory test matrix any consumer migration slice must
  satisfy.
- The scoreboard tracking which consumers have migrated.

After this slice lands, individual consumer-migration slices
(`C51-PII-PROMOTE-*`) wire specific call sites — canonical-landing
readers, comp readers, mapping workbench — through the stance.
Each is an additive line per call site, same shape as the
C49-FK-PROMOTE and C50-CONV-PROMOTE arcs.

## First consumer category (binding)

The first consumer category for PII-aware preflight is **canonical-
landing readers** — code paths that surface PACS column values on
PII-free response shapes (e.g., the future `/api/sync/comps/...`
endpoint family that exposes parcel attributes without
identifying owners).

The PII preflight runs **alongside** FK and era preflights, not
as a replacement. A migrated consumer:

```text
For each loader / reader call site:
    1. FK preflight       (per C49-FK-C)        → Pass / Warn / Fail
    2. Era preflight      (per C50-CONV-C)      → Pass / Warn / Fail
    3. PII preflight      (per THIS doc)        → Pass / Warn / Fail
    4. Operation runs only if all three Pass (or Warn under their
       respective advisory stances).
```

A consumer that has migrated FK and era but not PII continues to
behave as before (PII preflight is opt-in per HG-PII-3 and the
per-call-site stance enum below). Migration is incremental.

## What the migrated consumer may do

A migrated consumer:

- Reads `PiiClassification` from `PacsTable` and `PacsColumn`
  records via the existing catalog query surfaces. (No new query
  method is required; the field is already exposed.)
- Calls a new `IPiiClassificationPreflight.ValidateAsync` service
  (introduced in C51-PII-D, the implementation slice for this
  policy) to apply the per-call-site stance to a target
  (table, columns) shape.
- Re-emits the structured message verbatim on Warn (log) or Fail
  (throw `InvalidOperationException`).
- Annotates structured logs with the matched classification so
  downstream forensic queries can answer "did anything Direct
  flow to a PII-free surface?" with a definite no.

## What the migrated consumer must NOT do

A migrated consumer MUST NOT:

- Inspect `PiiClassification` directly to make a runtime branching
  decision **without** going through the preflight. The preflight
  is the gate; direct field inspection bypasses HG-PII-3.
- Treat `None` as "verified safe" when the manifest is not engaged.
  Per the C51-PII-B backwards-compat bridge, un-engaged callers
  see `None` everywhere because the manifest layer hasn't been
  set up — that is NOT an operator's safety assertion. Consumers
  that need verified safety MUST use the stance that fails when
  the manifest isn't engaged (see `RequirePiiFreeCanonicalLanding`
  below).
- Treat un-flagged tables (tables NOT in `TableExhaustiveFlags`)
  as fully classified. Per HG-PII-2, only flagged tables carry the
  exhaustiveness assertion; un-flagged tables may have un-tagged
  Direct columns hiding among the apparently-`None` ones.
- Override the manifest's per-column `Direct` declaration with a
  consumer-specific override. The manifest is the source of truth.
- Cache classifications across catalog rebuilds. The catalog is
  rebuilt per process start; classifications are whatever the
  catalog says at the time of preflight.

## Per-call-site stance (binding)

Every consumer that consults PII metadata MUST pick one of four
stances per call site, explicitly. There is no default. This is
the PII-domain analog of C50-CONV-C's
`ConversionEraPreflightStance` and follows HG-PII-3.

```csharp
public enum PiiClassificationPreflightStance
{
    /// <summary>
    /// Surface produces PII-free responses (e.g., a public-facing
    /// canonical comp reader). Acceptable matched classifications:
    /// None ONLY, AND only when the table is in
    /// TableExhaustiveFlags (i.e., the operator has asserted
    /// "every column on this table is None"). Without
    /// exhaustiveness, the loader cannot prove the column is
    /// safe and MUST Fail. Indirect / Direct → Fail. Caller MUST
    /// throw on Fail.
    /// </summary>
    RequirePiiFreeCanonicalLanding = 1,

    /// <summary>
    /// Surface tolerates Indirect PII with operator-vetted care
    /// (e.g., a comp reader that surfaces parcel-id but logs each
    /// access). Acceptable: None / Indirect. Direct → Fail.
    /// Manifest engagement still required for non-None matches —
    /// without manifest engagement, the loader cannot tell None
    /// from un-tagged-might-be-Direct, so Indirect under un-engaged
    /// also Fails. Caller MUST throw on Fail.
    /// </summary>
    AllowIndirectWithCare = 2,

    /// <summary>
    /// Surface holds explicit consent / audit posture for Direct
    /// PII (e.g., a county-internal review surface where the
    /// assessor has authenticated and accepted the audit log).
    /// Acceptable: None / Indirect / Direct, BUT manifest must be
    /// engaged so the operator's classification choice is
    /// auditable. Un-engaged + Direct = Fail (operator hasn't
    /// affirmed the column is intentionally exposed). Caller MUST
    /// throw on Fail.
    /// </summary>
    AllowDirectWithExplicitConsentAudit = 3,

    /// <summary>
    /// Diagnostic / browsing stance. Every classification accepted,
    /// engaged or not. Production surfaces SHOULD pick one of the
    /// three above instead. AllowAny is for surfaces like the
    /// catalog browser itself, which by definition has to render
    /// every entry regardless of PII level.
    /// </summary>
    AllowAny = 4,
}
```

The enum has no `Unspecified` / `Default` member. Per HG-PII-3,
caller MUST pick.

## Outcomes (binding)

The preflight returns one of three outcomes, identical in shape
to the C50-CONV-C outcomes:

```csharp
public enum PiiClassificationPreflightOutcome
{
    Pass = 1,   // matched classification acceptable under stance
    Warn = 2,   // classification acceptable but a non-fatal diagnostic applied
                // (reserved; C51-PII-D may emit on table-only / composite cases)
    Fail = 3,   // unacceptable; caller MUST throw
}
```

## Stance × Classification × Engagement → Outcome (binding)

The PII outcome table has more axes than the era table because
exhaustiveness matters. Three input axes:

- Stance (4 values)
- Matched classification (3 values: None / Indirect / Direct)
- Manifest engagement and exhaustive-flag state for the table:
  - **Engaged + Exhaustive** : manifest loaded AND table named in
    TableExhaustiveFlags. The operator has asserted full coverage.
  - **Engaged + Non-exhaustive** : manifest loaded but table NOT
    in TableExhaustiveFlags. The operator may have classified
    some columns; un-tagged columns are reported as None but the
    operator hasn't affirmed exhaustiveness.
  - **Not Engaged** : no manifest path configured. Every column
    is None by C48-B legacy default; this is the C51-PII-B
    backwards-compat bridge.

Binding outcome table (Pass = P, Fail = F, all others Pass unless
listed):

| Stance                              | Classification | Engaged+Exhaustive | Engaged+Non-exhaustive | Not Engaged |
|-------------------------------------|----------------|--------------------|------------------------|-------------|
| RequirePiiFreeCanonicalLanding      | None           | P                  | F                      | F           |
| RequirePiiFreeCanonicalLanding      | Indirect       | F                  | F                      | F           |
| RequirePiiFreeCanonicalLanding      | Direct         | F                  | F                      | F           |
| AllowIndirectWithCare               | None           | P                  | P                      | F           |
| AllowIndirectWithCare               | Indirect       | P                  | P                      | F           |
| AllowIndirectWithCare               | Direct         | F                  | F                      | F           |
| AllowDirectWithExplicitConsentAudit | None           | P                  | P                      | F           |
| AllowDirectWithExplicitConsentAudit | Indirect       | P                  | P                      | F           |
| AllowDirectWithExplicitConsentAudit | Direct         | P                  | P                      | F           |
| AllowAny                            | (any)          | P                  | P                      | P           |

Reading the table: the strictest stance (`RequirePiiFreeCanonical
Landing`) accepts ONLY None classifications AND only when
exhaustiveness has been asserted by the operator. The most
permissive stance (`AllowAny`) accepts everything always —
suitable for diagnostic surfaces where exposure is by design.

The middle two stances admit non-None classifications under
manifest engagement (regardless of exhaustiveness flag), but
refuse anything under un-engaged because un-engaged means "we
don't know if the operator has classified anything."

Warn is reserved for future composite-mismatch / partial-table
diagnostics; the C51-PII-D implementation does not currently emit
Warn but the policy reserves the slot.

## Structured message format (binding)

Fail (and Warn) results MUST carry a message of the form:

```text
[PiiClassificationPreflight] <Outcome> for '<table>(<columns>)' under <stance>:
matched classification <Classification>, manifest <engagement>, table-exhaustive=<bool>.
<reason>
```

`engagement` resolves to one of:
- `engaged` — manifest loaded
- `not-engaged` — no manifest path; C48-B backwards-compat bridge

`table-exhaustive` is true only when manifest is engaged AND the
table is named in TableExhaustiveFlags.

`reason` is the operator-supplied `Reason` string from the
manifest entry (when one applies), or the default explanation when
no manifest entry exists.

Consumers MUST re-emit this message verbatim. Identical discipline
to C49-FK-C and C50-CONV-C structured messages.

## Test matrix (binding for C51-PII-D implementation)

Any consumer-migration slice MUST satisfy this matrix at minimum.
The matrix is larger than C50-CONV-C's because exhaustiveness adds
an axis.

| #  | Scenario                                                      | Expected outcome |
|----|---------------------------------------------------------------|------------------|
| 1  | Required + None + Engaged+Exhaustive                          | Pass             |
| 2  | Required + None + Engaged+Non-exhaustive                      | Fail             |
| 3  | Required + None + Not Engaged                                 | Fail             |
| 4  | Required + Indirect (any engagement)                          | Fail             |
| 5  | Required + Direct (any engagement)                            | Fail             |
| 6  | AllowIndirectWithCare + None / Indirect + Engaged             | Pass             |
| 7  | AllowIndirectWithCare + Direct + Engaged                      | Fail             |
| 8  | AllowIndirectWithCare + (any) + Not Engaged                   | Fail             |
| 9  | AllowDirectWithExplicitConsentAudit + Direct + Engaged        | Pass             |
| 10 | AllowDirectWithExplicitConsentAudit + Direct + Not Engaged    | Fail             |
| 11 | AllowAny + (any classification) + (any engagement)            | Pass             |
| 12 | Stance value 0 / undefined                                    | ArgumentException|
| 13 | Null catalog / empty columns                                  | ArgumentNullException / ArgumentException |
| 14 | Composite columns where one is Direct, others None, AllowAny  | Pass (no Fail propagation under AllowAny) |
| 15 | Composite columns where one is Direct, others None, Required  | Fail (worst PII dominates) |

## C51-PII-D implementation target

C51-PII-D is the implementation slice for this policy. Its scope:

1. **Add `IPiiClassificationPreflight` + `PiiClassificationPreflight`**
   at `backend/src/TerraFusion.Sync/Workbench/Schema/`.
2. **Add `PiiClassificationPreflightStance` enum** (4 values above).
3. **Add `PiiClassificationPreflightOutcome` enum** (3 values).
4. **Add `PiiClassificationPreflightResult` record**:
   `(Outcome, Message, MatchedClassification, ManifestEngaged, TableExhaustive)`.
5. **Validate stance at entry** per HG-PII-3 (zero / undefined →
   ArgumentException).
6. **Resolve PII from catalog** by precedence:
   column annotation → table annotation → manifest-engaged-no-entry
   (None) → manifest-not-engaged (None, C48-B legacy).
7. **Read engagement state** from
   `PacsSchemaCatalog.Version.ConversionManifestHash` is NOT
   appropriate here; C51-PII-D needs its own engagement signal.
   The catalog must surface a PII-engagement flag the preflight
   can read. Two options the implementation slice will resolve:
   (a) extend `PacsSchemaVersion` with a PII manifest stamp
   field, (b) add a `PacsSchemaCatalog.PiiManifestEngaged` boolean
   property. C51-PII-D picks one and documents it.
8. **Read TableExhaustiveFlags** from the catalog. Same surfacing
   choice as engagement: C51-PII-D adds the necessary catalog
   surface (a `IPacsSchemaCatalog.IsTableExhaustivelyClassified
   (tableName)` lookup is the most consumer-friendly shape).
9. **Apply stance × classification × engagement → outcome** per
   the binding table above.
10. **Build the structured message** per the binding format.
11. **Composite columns**: pick the worst-PII match (Direct >
    Indirect > None) and surface that one's classification +
    column name in the message.
12. **Unit tests**: at minimum the 15 cases in the test matrix.
13. **No live PACS smoke required** for C51-PII-D. The first
    live-DB invocation lands as part of the first
    `C51-PII-PROMOTE-*` slice.
14. **No consumer migration**. Per HG-PII-3 deferred-to-PROMOTE,
    no production code path consults the preflight in C51-PII-D
    itself.

## Out of scope (deferred)

- **C51-PII-PROMOTE-*** slices — per-consumer migration. Each
  picks a stance per call site, with the choice grounded in the
  surface's actual exposure model.
- **Row-level PII** (deferred indefinitely to C51-PII-G).
- **Cross-county shared classification library** (C51-PII-F).
- **PII propagation through FK edges** (e.g., a column FK-pointing
  to the `owner` table inherits Indirect). Currently no — operator
  decides per column. C51-PII-D may add an opt-in propagation
  flag if a real consumer needs it.

## Acceptance for C51-PII-C

This slice is docs-only. Acceptance criteria:

- [x] Policy file lands at
  `docs/sync/pacs-schema-pii-consumer-migration-policy.md`.
- [x] Per-call-site stance enum binding (4 values, no default).
- [x] Outcome enum binding (3 values).
- [x] Stance × Classification × Engagement → Outcome mapping table
  is complete (4 × 3 × 3 = 36 logical cells, condensed to 14 rows
  via Pass-default convention; binding).
- [x] Structured-message format binding.
- [x] Test matrix has 15 cases (binding for C51-PII-D).
- [x] Implementation contract (C51-PII-D scope) enumerated.
- [x] Cross-references to C51-PII-A, C50-CONV-C, C49-FK-C, C48-A.
- [x] No code changes; no test changes; no catalog changes.

## Non-goals (explicit)

- C51-PII-C does not authorize any consumer to consult PII
  metadata at runtime. That gate is `C51-PII-PROMOTE-*` per
  call site.
- C51-PII-C does not change the C48-B `PiiClassification` enum.
- C51-PII-C does not retire C49-FK or C50-CONV preflights. The
  three preflights are independent and run side-by-side.
- C51-PII-C does not change the C51-PII-B backwards-compat bridge.
  Un-engaged callers continue to see `None` defaults; the
  preflight reports that honestly via `not-engaged` engagement
  flag and the strictest stance Fails for it.

## Open questions (deferred to C51-PII-D)

- Should the preflight return per-column results (a list keyed
  by column) when the call site declares multiple columns, or a
  single combined result picking the worst-PII match? Currently
  binding contract says single combined result; C51-PII-D may
  add a per-column variant if a real consumer needs it.
- Should `Warn` be issued for engaged-but-non-exhaustive tables
  under `RequirePiiFreeCanonicalLanding`? Currently binding says
  Fail (because the strictest stance treats non-exhaustive as
  unverified). C51-PII-D may add an opt-in soft mode for
  development environments.
- Should the structured message include the LastWriteEvidence
  field equivalent (Reason)? Yes — included in the binding
  format above as `<reason>`.

## Slice ledger note

Updates the C51-PII arc:

- C51-PII-A             : DONE — policy locked (c43b9490d).
- C51-PII-B             : DONE — manifest impl + 11 tests (8237ca707).
- C51-PII-C             : THIS DOC — consumer migration policy.
- C51-PII-D             : pending — preflight service + 15 tests.
- C51-PII-PROMOTE-*     : pending — per-consumer wiring (analog of
                         C49-FK-PROMOTE and C50-CONV-PROMOTE).
- C51-PII-E / F / G     : deferred — authoring tooling, cross-
                         county sharing, row-level PII.

Promotion happens slice-by-slice; nothing in C51-PII-C should be
read as authorizing C51-PII-D or any PROMOTE slice until each
lands.
