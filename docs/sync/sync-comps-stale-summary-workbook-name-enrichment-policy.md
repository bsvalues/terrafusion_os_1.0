# Sync Comps Stale-Summary Workbook-Name Enrichment Policy

**Slice:** C46-A (docs-only — defines the contract for adding a
human-readable `sourceWorkbookName` field to the C44-B
stale-summary response. C46-B will land the controller-side
enrichment lookup + DTO field + tests. This slice writes the
contract, not the code.).
**Lifecycle layer:** API (TerraFusion.Kernel) read-surface
augmentation. No new schema, no new endpoint, no new write
surface. Pure additive change to the existing
`StaleSummaryGroupDto` shape.
**Status:** policy locked; implementation deferred to C46-B.

## Why this slice

C44-A locked the stale-summary response as Guid-only (no joins,
no enrichment). It also flagged the deferred follow-on:

> **Workbook-name enrichment.** Operators may want
> `sourceWorkbookName` alongside the id for human readability.
> C44-A explicitly leaves the response Guid-only; a future slice
> can join workbook name with its own policy (likely with
> PII-free-name caveats since workbook names are
> operator-typed).

C46-A fills that gap.

The use case is dashboard ergonomics:

```
Before (C44-B):
  Group: 11111111-2222-3333-4444-555555555555 / Excluded / count=12

After (C46-B):
  Group: "benton-2026-04-29 review" (1111…5555) / Excluded / count=12
```

Operators planning a C36 re-run can scan the summary and
recognize "oh, the 12 stale Excluded rows are from the
2026-04-29 review workbook" without copy-pasting Guids into a
separate workbook lookup tool.

Per the locked sequence:

```
C44-A ✓ stale-row summary policy
C44-B ✓ stale-row summary endpoint
C45 family ✓ caching headers / If-Match / HEAD / SWR
C46-A   workbook-name enrichment policy             ← THIS SLICE
C46-B   enrichment lookup + DTO field + tests
```

## Provenance

- **C2 — `SyncMappingWorkbook` schema.** Source of the `Name`
  field. Operator-typed; max length 200 per the C2 EF config.
- **C44-A — stale-row summary policy.** The Hard Guard 1
  (`Pure projection ... no joins`) is being explicitly relaxed
  here in a controlled way — the relaxation is one
  controller-side lookup, NOT a SQL join in the reader.
- **C44-B — stale-row summary endpoint.** The action this
  slice extends.
- **C38-A — comps API endpoint policy.** Inherits the auth +
  county-isolation pattern.
- **C45-B / C45-E — caching headers.** ETag seed unchanged
  (the `Name` field is derived from data the existing seed
  already covers, so cache invalidation works correctly).
- **CLAUDE.md** — sovereign-county isolation, FISMA audit,
  PII handling.

## Purpose

Augment the C44-B `StaleSummaryGroupDto` with a single new
field, `SourceWorkbookName`, populated by a controller-side
lookup against `SyncMappingWorkbooks`.

```csharp
public sealed record StaleSummaryGroupDto(
    Guid     SourceWorkbookId,
    string?  SourceWorkbookName,           // ← NEW in C46-B
    string   ComputedDecision,
    int      Count);
```

Wire shape:

```json
{
  "groups": [
    {
      "sourceWorkbookId":   "11111111-…",
      "sourceWorkbookName": "benton-2026-04-29 review",
      "computedDecision":   "Excluded",
      "count": 12
    }
  ]
}
```

The enrichment is **additive**; existing consumers that ignore
the new field continue to work. The `StaleSummaryDto` envelope
shape is unchanged (no new top-level fields).

## Hard guards

These guards lock the contract for C46-B. C46-B may not relax
them.

### 1. **No SQL join in the reader.**

The C44-B `ISalesCompStaleSummaryReader` predicate stays
single-source-of-truth — `WHERE CountyId = @countyId AND
SourceWorkbookId <> @baselineWorkbookId GROUP BY
SourceWorkbookId, ComputedDecision`. The `Name` lookup
happens AFTER aggregation, in the controller, via a separate
`WHERE Id IN (...)` query against `SyncMappingWorkbooks`.

Reasoning:
- Keeps the reader's stale predicate alignable with the C43-B
  per-row reader (test 17's reconciliation invariant must
  still hold).
- Reads stay independent: aggregation correctness depends on
  canonical landing only; name enrichment is a presentation
  concern.
- Allows the workbook-name lookup to be skipped on degraded /
  partial responses if a future slice ever needs it.

### 2. **Single round-trip for the lookup.**

After the GROUP BY returns up to 100 distinct
`(SourceWorkbookId, ComputedDecision)` pairs, the controller
collects the distinct `SourceWorkbookId` values and runs ONE
query:

```sql
SELECT Id, Name
FROM SyncMappingWorkbooks
WHERE Id IN (@workbookIdSet)
```

In-memory join into the DTO. Bounded by the C44-A 100-group
cap → at most 100 distinct workbook ids → one cheap
indexed-lookup query.

### 3. **County-scoped lookup.**

The lookup MUST also filter on `CountyId = @countyId` so a
workbook id from another county (e.g. via canonical-row
corruption or a malicious operator inserting a
foreign-county Guid) cannot leak the foreign workbook's name.
The action's existing principal-county-claim check fires
upstream; this guard is defense in depth at the data-access
layer.

```sql
WHERE Id IN (@workbookIdSet) AND CountyId = @countyId
```

### 4. **Null name = workbook not found OR cross-county.**

When a workbook id from the GROUP BY result has no matching
row in `SyncMappingWorkbooks` (deleted; foreign county;
soft-deleted in some future slice), `SourceWorkbookName` is
emitted as `null`. The DTO field is `string?`. Consumers MUST
handle null gracefully (typically by falling back to the Guid
display).

C46-B does NOT throw on missing workbook rows. The summary's
job is to surface staleness; a missing prior workbook is
itself a useful signal (the canonical row has a
`SourceWorkbookId` pointing at nothing — operator may want to
investigate, but the dashboard should still render).

### 5. **PII caveat: workbook names are operator-typed.**

`SyncMappingWorkbook.Name` is operator-typed at C4 (workbook
creation). Per the existing C2 schema it's `varchar(200)`,
non-null. Operators may include:

- County / project identifiers (`"Benton 2026 review"`) — fine
- Internal codenames (`"WacCd cleanup pass-2"`) — fine
- Initials / colleague mentions (`"jvb / hjm sync 2026-04-29"`) —
  potentially sensitive, but operator-controlled

**The API surfaces the name verbatim**. C46-B does NOT
sanitize, redact, truncate (beyond the existing 200-char
column limit), or reformat. Reasoning:
- Sanitization rules would silently mutate operator intent;
  better to display verbatim and let the operator name
  workbooks responsibly.
- The endpoint is `[Authorize]` + county-scoped, so only
  authorized in-county principals see the name.
- This is consistent with how `SetReason` is surfaced on
  `ActiveWorkbookSnapshotDto` (C41-C / C45-A) — operator-typed
  text passes through.

### 6. **Cache-key invariance.**

The C45-B / C45-E ETag seed for the summary endpoint is
`(countyId, baselineWorkbookId, totalStaleRows, groupCount,
maxLockedAtUtc)`. Adding `SourceWorkbookName` to the response
body does NOT change the seed. Reasoning:
- Workbook-name changes after C2 creation are not currently a
  surface (the `SyncMappingWorkbookEditService` allows column /
  code-value edits but not Name edits in the current
  implementation).
- Even if a future slice introduces Name editing, that edit
  would touch `SyncMappingWorkbooks.UpdatedAt`, which is
  invisible to the canonical-landing-keyed ETag — but it's
  also not a freshness signal the comps consumer cares about
  (the comp pool didn't change).
- If Name editing ever produces operator-visible drift, that
  becomes its own slice with its own policy.

C46-B MUST NOT modify the ETag seed.

### 7. **Read-only.**

The lookup is `AsNoTracking`. No `UpdatedAt` bump on
`SyncMappingWorkbooks`, no audit-log write, no canonical
mutation. Pure projection.

### 8. **Failure of the lookup is non-fatal.**

If the `WHERE Id IN (...)` query fails (DB transient error,
constraint check, etc.), C46-B MUST NOT fail the whole
summary response. Instead it logs a warning and emits the
DTO with `SourceWorkbookName: null` for every group.
Reasoning: the summary's primary value is the stale counts;
name enrichment is a UX win that should degrade gracefully.

The action's main failure modes (auth, county isolation,
baseline resolution, missing pointer) all fire before the
enrichment lookup; if those pass, the summary should succeed
even if the lookup hiccups.

### 9. **Backward compatibility.**

Existing consumers of the C44-B DTO that ignore unknown JSON
fields (the standard System.Text.Json default) keep working.
Consumers that strict-validate field sets MUST be updated
to accept `sourceWorkbookName` — this is called out in the
C46-B commit message as a non-breaking-but-watched-for
addition.

### 10. **No retroactive change to C43-B per-row endpoint.**

The C43-B per-row stale endpoint emits raw row data without
enrichment by design. Adding name enrichment THERE is a
separate slice; C46-A scope is summary-only. The reasoning is
that the per-row endpoint's pagination cap is 500 rows
× O(distinct workbook ids per page) = small lookup, but the
per-row consumer is a diagnostic surface where the operator
can copy-paste the workbook id into another tool. Summary is
the dashboard surface — that's where the UX win matters.

## C46-B success gates

C46-B is accepted only when ALL of:

1. `StaleSummaryGroupDto` gains `SourceWorkbookName` (string?,
   nullable) as the second positional parameter (between
   `SourceWorkbookId` and `ComputedDecision`).
2. Controller-side lookup via a single `WHERE Id IN (...) AND
   CountyId = @countyId` query against
   `SyncMappingWorkbooks`. `AsNoTracking`. No SQL join with
   the canonical landing.
3. In-memory dictionary lookup to populate the DTO field.
4. Missing workbook rows → `SourceWorkbookName: null` (no
   throw).
5. Cross-county workbook ids → `SourceWorkbookName: null`
   (defense in depth; the `CountyId` filter in step 2
   enforces).
6. Null name handling: if the workbook's `Name` itself is
   null (impossible per C2 schema, but defensive),
   `SourceWorkbookName: null`.
7. ETag seed unchanged (the existing C45-B ETag must not
   shift on this slice). Verified by an explicit test that
   computes ETag before AND after the C46-B field addition
   and asserts they match.
8. Lookup-failure resilience: a thrown exception during the
   workbook-name query DOES NOT fail the summary response.
   Logged at Warning; DTO emits with all `SourceWorkbookName:
   null`.
9. Tests landed (full matrix below).
10. Full Sync regression green: Unit.Tests `Tests.Sync.`
    namespace (current 134 / 134); Integration.Tests
    `Tests.Sync.` namespace (current 782 / 782).
11. C44-B existing tests preserved — the per-group test
    assertions need to be updated to expect the new field
    (typically `SourceWorkbookName.Should().NotBeNull()` on
    happy paths; `Should().BeNull()` on missing-workbook
    paths).

## C46-B test matrix

The implementation slice MUST land tests covering:

1. **Happy path**: one stale group → DTO carries
   `SourceWorkbookName` matching the seeded workbook's
   `Name`.
2. **Multiple groups across distinct workbooks**: lookup
   round-trips correctly; each group's name matches its own
   workbook.
3. **Multiple groups same workbook (different decisions)**:
   single-row workbook lookup (no duplicate query); both
   groups carry the same name.
4. **Workbook deleted between aggregation and lookup**:
   `SourceWorkbookName: null` on that group; other groups
   unaffected.
5. **Cross-county workbook id (synthetic / corrupted
   canonical row)**: `SourceWorkbookName: null` per Hard
   Guard 3 / 5. Verifies the `CountyId` filter on the lookup
   query.
6. **Empty groups (no stale rows)**: no lookup query issued
   (degenerate case; nothing to enrich).
7. **Truncation interaction**: when groupCount > 100, the
   top-100 groups returned all carry their names; the
   truncated remainder is invisible (no name leakage).
8. **ETag invariance**: the C45-B summary ETag is byte-for-
   byte identical to a C46-B response with the same
   underlying canonical data. Locks the cache-key invariance
   guard.
9. **Lookup-failure resilience**: when the workbook-name
   query throws, the summary still returns 200 with all
   groups carrying `SourceWorkbookName: null`. Verified via
   a test-double reader that throws.
10. **C44-B reconciliation invariant**: the per-row endpoint's
    `totalCount` still equals `summary.TotalStaleRows` for
    matching `(countyId, baselineWorkbookId)` (already locked
    by C44-B test 17; C46-B preserves this).

## Forbidden semantics (no scope creep)

C46 is the **stale-summary workbook-name enrichment**. It is
NOT:

- A SQL join in the reader (Hard Guard 1).
- A name-enrichment slice for the C43-B per-row endpoint
  (separate slice if needed).
- A name-enrichment slice for the C39-B comps-eligible
  endpoint (separate slice if needed; the comp consumer
  generally pins to a single workbook so its name is
  out-of-band knowledge anyway).
- A workbook-name editing surface (workbook names are
  operator-typed at C4 creation; editing is out of scope).
- A workbook-search / autocomplete endpoint.
- A PII-redaction layer (Hard Guard 5: names are surfaced
  verbatim).
- A localization / i18n surface (names are in the operator's
  typed casing / language).

If a future slice wants any of those, it writes its own
policy doc.

## What this slice does NOT change

- Does not modify `CanonicalSaleQualifications` schema.
- Does not modify `SyncMappingWorkbooks` schema (the `Name`
  column already exists per C2).
- Does not modify the C36 writer / runner.
- Does not modify the C37-B / C43-B / C44-B readers.
- Does not modify the C39-B comps-eligible endpoint.
- Does not modify the C43-B per-row stale endpoint.
- Does not modify the C41-B / C41-C active-workbook surface.
- Does not modify the C45-B / C45-C / C45-D / C45-E caching
  headers (Hard Guard 6).
- Does not introduce a new audit table or operator-facing
  UI.

## Open questions deferred to C46-B / later

- **Workbook-name editing.** If a future slice introduces
  `SyncMappingWorkbookNameEditService`, it needs its own
  policy AND it needs to decide whether the C45-B ETag seed
  for the summary endpoint should reflect Name changes. C46-A
  defers this entirely; C46-B does not edit names.
- **Per-row enrichment for C43-B.** Out of scope here; future
  slice if operator demand surfaces.
- **Active-workbook name on the C41-C `GET
  /api/sync/active-workbook` response.** Currently emits
  `(activeWorkbookId, setAt, setBy, setReason)`. Could carry
  the workbook name as well — but that's a separate slice
  with its own consumers and its own policy.
- **Operator-typed name length on the wire.** Currently
  bounded by the `varchar(200)` column. If a future API needs
  shorter wire output (e.g. mobile dashboards), truncation
  policy goes in its own slice.

## Glossary (slice-local)

- **Enrichment** — the controller-side post-aggregation step
  that adds `SourceWorkbookName` to each group via a separate
  cheap lookup query.
- **Lookup-failure resilience** — the property that a
  thrown exception during the workbook-name query DOES NOT
  fail the summary response (Hard Guard 8).
- **Cache-key invariance** — the property that the C45-B
  summary ETag is unchanged by this slice (Hard Guard 6 +
  test 8).
- **Verbatim emission** — Names are surfaced exactly as the
  operator typed them at C4 workbook creation; no
  sanitization (Hard Guard 5).
