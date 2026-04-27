# Sales Qualification Transform Policy

> Slice C8-A — design only. **No transform code lands with this slice.**
> The accompanying implementation will land as Slice C8-B once a real
> Mapping Workbook is locked.

This document defines the smallest, narrowest first transform consumer
of the Mapping Workbook lifecycle: a sales-only qualifier that turns
two PACS columns (`dbo.sale.wac_cd`, `dbo.sale.sl_ratio_type_cd`) into
a canonical sales-comparison eligibility decision. It does not touch
property, valuation, improvement, land, or neighborhood lanes; it does
not mutate PACS rows; it does not consume Draft workbooks.

The Benton-Method context anchors why this lane comes first. The user-
memory directive is explicit: "WacCd bug blocks all comps." Real
B2.7-OLTP evidence (marker `9d6306397`) confirmed it — `wac_cd`'s top
values are WA REET exemption codes (`458-61A-203(1)`, `458-61A-217(1)`,
…), which are precisely the kind of transactions that should NOT enter
a comp pool unfiltered. This policy gives that filtering a single,
tested, locked-workbook-only path.

## Inputs

| Source column                  | What it carries                                                                                | Distinct (B2.7-OLTP) | Top observation                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------- |
| `dbo.sale.wac_cd`              | Washington Administrative Code citation. Most common values are REET exemption classifications. | 55                   | `458-61A-203(1)` ("transfer by deed")    |
| `dbo.sale.sl_ratio_type_cd`    | IAAO ratio-study qualification / type signal.                                                  | 24                   | `00` (~25%), `9` (~12%) dominate        |

Both are surfaced by the deep-profile pass and live as
`SyncMappingCodeCandidate` rows in the canonical workbook seed.

## Required Guard

A transform may only consume a workbook where:

```text
SyncMappingWorkbook.Status = "Mapped"
```

Any other status fails closed at the read-model layer (Slice C7) with
`InvalidOperationException`. The transform consumer of this policy must
not catch that exception and proceed; it propagates as an explicit
"workbook not ready" error.

In code:

```csharp
// Conceptual — actual class lands in C8-B.
public sealed class SalesQualificationTransform
{
    private readonly ISyncMappingWorkbookReadModel _readModel;

    public async Task<SalesQualificationDecision> QualifyAsync(
        Guid countyId,
        Guid workbookId,
        SaleRow row,
        CancellationToken ct)
    {
        // Throws if Status != "Mapped".
        var snapshot = await _readModel.LoadMappedAsync(countyId, workbookId, ct);
        return Qualify(snapshot, row);
    }
}
```

A sibling overload that takes a pre-loaded `SyncMappingWorkbookSnapshot`
exists for batch consumers that load the snapshot once and translate
many rows. The Status guard already ran at load time; nothing in
`Qualify(snapshot, row)` re-checks it.

## Decision Rules

The transform looks up two source values per `SaleRow` and combines
them into one canonical decision. The combination uses **AND-logic
exclusion**: any axis that excludes the sale wins; the sale enters the
comp pool only when BOTH axes consent.

### Per-axis lookup

For each of `wac_cd` and `sl_ratio_type_cd`, call
`snapshot.TryResolveCode("dbo", "sale", "<column>", value, out var d)`
and bucket the result:

| Lookup outcome                                                    | Per-axis classification |
| ----------------------------------------------------------------- | ----------------------- |
| `value` is `null` or whitespace                                   | **MissingCode**         |
| `TryResolveCode` returns `false` (column or value not in workbook) | **Unknown**             |
| Decision present, `IsExcluded = true`                             | **OperatorExcluded**    |
| Decision present, `ReviewStatus = "Deferred"`                     | **OperatorDeferred**    |
| Decision present, `ReviewStatus = "Mapped"`, `IsExcluded = false` | **OperatorMapped**      |
| Decision present, any other shape                                 | **OperatorIncomplete**  |

`OperatorIncomplete` exists as a defensive fall-through — `LoadMappedAsync`
already enforces every code-value row hit a terminal status (Mapped /
Excluded / Deferred), so reaching this bucket implies a contract
violation upstream and the transform refuses to qualify.

### Two-axis combination

| `wac_cd` axis        | `sl_ratio_type_cd` axis | Combined `DecisionStatus` | `IsExcludedFromComps` | `CanonicalValue`                |
| -------------------- | ----------------------- | ------------------------- | --------------------- | ------------------------------- |
| OperatorMapped       | OperatorMapped          | **Qualified**             | `false`               | from `wac_cd` decision          |
| OperatorMapped       | OperatorExcluded        | ExcludedByOperator        | `true`                | `null`                          |
| OperatorExcluded     | (any)                   | ExcludedByOperator        | `true`                | `null`                          |
| OperatorMapped       | OperatorDeferred        | Deferred                  | `true`                | `null`                          |
| OperatorDeferred     | (any)                   | Deferred                  | `true`                | `null`                          |
| OperatorMapped       | Unknown                 | UnknownCode               | `true`                | `null`                          |
| Unknown              | (any)                   | UnknownCode               | `true`                | `null`                          |
| OperatorMapped       | MissingCode             | MissingCode               | `true`                | `null`                          |
| MissingCode          | (any)                   | MissingCode               | `true`                | `null`                          |
| OperatorIncomplete   | (any)                   | (refuse — contract error) | n/a                   | n/a                             |
| (any)                | OperatorIncomplete      | (refuse — contract error) | n/a                   | n/a                             |

**Read this as: comps are opt-in.** A sale enters the comp pool only
when both axes have an explicit operator-mapped decision. Anything
else — Excluded, Deferred, Unknown, MissingCode — sets
`IsExcludedFromComps = true`. The reason field captures *which* axis
drove the exclusion (see Output Contract below) so an analyst can tell
"WAC 458-61A-217(1) excluded, ratio_type=00 was fine" from "WAC was
fine, ratio_type=99 was unknown" without re-running the workbook.

This is intentionally conservative for the first slice. Future
extensions could introduce per-lane policies (e.g. "treat ratio_type
Deferred as Qualified if WAC is Mapped"); they require their own
slice cards and their own evidence.

## Output Contract

```csharp
/// <summary>
/// Slice C8-B output shape. Returned per SaleRow processed.
/// Immutable — the transform produces new instances; consumers may
/// not mutate them.
/// </summary>
public sealed record SalesQualificationDecision(
    string DecisionStatus,            // see DecisionStatus values below
    bool   IsExcludedFromComps,
    string? CanonicalValue,           // null unless DecisionStatus == "Qualified"
    string  WacReason,                // human-readable provenance for the wac_cd axis
    string  RatioReason,              // human-readable provenance for the sl_ratio_type_cd axis
    string? WacSourceValue,           // raw observed wac_cd value (post-trim)
    string? RatioSourceValue);        // raw observed sl_ratio_type_cd value (post-trim)

/// <summary>
/// Closed set of DecisionStatus values. Adding a new value is a
/// breaking change for consumers.
/// </summary>
public static class SalesQualificationDecisionStatuses
{
    public const string Qualified           = "Qualified";
    public const string ExcludedByOperator  = "ExcludedByOperator";
    public const string Deferred            = "Deferred";
    public const string UnknownCode         = "UnknownCode";
    public const string MissingCode         = "MissingCode";
}
```

**Reason strings carry provenance, not policy.** A reason of
`"wac_cd=458-61A-217(1) operator-excluded (canonical: null)"` tells
the assessor downstream "this is what was on the workbook", not
"this is what the transform decided the sale should be." The
distinction matters when reviewing why a comp was filtered — the
operator's decision is the audit trail, not transform inference.

Reason format (pinned by C8-B tests):

| Per-axis classification | Reason format                                              |
| ----------------------- | ---------------------------------------------------------- |
| OperatorMapped          | `"<col>=<value> operator-mapped (canonical: <canonical>)"` |
| OperatorExcluded        | `"<col>=<value> operator-excluded"`                        |
| OperatorDeferred        | `"<col>=<value> operator-deferred"`                        |
| Unknown                 | `"<col>=<value> not in workbook"`                          |
| MissingCode             | `"<col>=<missing>"`                                        |
| OperatorIncomplete      | (transform throws — no reason emitted)                     |

## Hard Non-Goals

This policy must NOT:

- **Mutate any PACS row.** The transform reads PACS rows and produces
  decisions; PACS is read-only.
- **Mutate any canonical landing table.** The transform's output is a
  `SalesQualificationDecision` value, not a database write. A
  separate consumer that writes those decisions into the canonical
  schema is its own slice and its own policy.
- **Mutate the workbook.** The read model is `AsNoTracking`; nothing
  in the transform writes back. `CanonicalValue`, `IsExcluded`, and
  `ReviewStatus` on the workbook rows are operator-decided and
  service-immutable.
- **Mutate Forge / TerraAtlas / Studio / Dais artifacts.** Suite
  boundary preserved.
- **Auto-map unknown WAC codes.** A WAC value not in the workbook is
  `UnknownCode` → excluded from comps. Adding it requires
  re-profiling, re-loading the workbook, and locking again.
- **Auto-exclude WAC codes the operator did not exclude.** The
  workbook is the source of truth on exclusion. The transform reads
  it; it does not infer.
- **Read a Draft workbook.** Status guard at the read-model layer.
- **Bypass County isolation.** All calls go through
  `LoadMappedAsync(countyId, workbookId)`; the read model refuses
  cross-county lookups.

## Future Implementation Tests (C8-B)

When the transform lands, the following test matrix is required.
Cells marked **(memory-flagged)** address the explicit Benton-Method
"WacCd bug blocks all comps" directive.

### Status-guard tests

- `QualifyAsync_RejectsDraftWorkbook` — `LoadMappedAsync` throws;
  transform must not swallow.
- `QualifyAsync_RejectsArchivedWorkbook` — same shape.
- `QualifyAsync_AcceptsMappedWorkbook` — happy-path load.

### Per-axis classification tests

- `Qualify_ReturnsQualified_ForBothAxesMapped` — canonical from
  `wac_cd` axis surfaces; `IsExcludedFromComps=false`.
- `Qualify_ReturnsExcludedByOperator_WhenWacIsExcluded` **(memory-flagged)**
  — top WAC `458-61A-217(1)` exempt-transfer must propagate as
  `ExcludedByOperator` regardless of ratio_type.
- `Qualify_ReturnsExcludedByOperator_WhenRatioIsExcluded`
- `Qualify_ReturnsDeferred_WhenAnyAxisIsDeferred`
- `Qualify_ReturnsUnknownCode_WhenAnyAxisIsUnknown`
- `Qualify_ReturnsMissingCode_WhenAnyAxisIsBlank` (covers
  `string.Empty`, whitespace-only, `null`).

### Output contract tests

- `Qualify_QualifiedDecision_HasCanonicalValueFromWacAxis` — pin that
  the canonical value source is wac, not ratio (avoids the bug where
  ratio's "00" leaks into a sale's canonical category).
- `Qualify_NonQualifiedDecision_HasNullCanonicalValue` — pin that
  every non-Qualified status nulls CanonicalValue.
- `Qualify_ReasonStrings_MatchPinnedFormat` — Theory across the 5
  per-axis classifications.

### Combined-axis precedence tests

- `Qualify_WacExcludedAndRatioMapped_ExclusionWins` **(memory-flagged)**
- `Qualify_WacMappedAndRatioExcluded_ExclusionWins`
- `Qualify_WacUnknownAndRatioMapped_UnknownWins`
- `Qualify_WacMappedAndRatioUnknown_UnknownWins`

### Defensive tests

- `Qualify_ThrowsOnOperatorIncompleteRow` — pin the contract-violation
  branch; if a Deferred/Mapped/Excluded gate ever drifts upstream,
  the transform surfaces it loudly rather than silently picking a
  side.
- `Qualify_DoesNotMutateSnapshot` — load snapshot, run 1,000
  qualifications against it, assert snapshot is reference-equal to
  the value loaded.

### County isolation

- `QualifyAsync_RejectsCrossCountyWorkbook` — relies on the read
  model's existing guard; pin that the transform doesn't reintroduce
  a path around it.

## Provenance

- B2.7-OLTP marker: `9d6306397` — first real PACS distribution
  evidence, 200 candidates, 1,733 code values.
- C4.1 first real workbook: `a767c8a2-5b8a-4846-af8b-c3496601e924`
  (currently `Status='Draft'`).
- Memory-flagged directive: "WacCd bug blocks all comps." This policy
  is the smallest controlled response — it does not auto-correct, it
  does not silently filter; it formalizes the path the operator's
  workbook decision flows through.
- Read model contract: Slice C7
  (`ISyncMappingWorkbookReadModel.LoadMappedAsync`,
  `SyncMappingWorkbookSnapshot.TryResolveCode`).
- Lock contract: Slice C6
  (`ISyncMappingWorkbookLockService.LockAsync`, terminal review
  statuses `{Mapped, Excluded, Deferred}`).
- Suite boundary: TerraAtlas owns spatial; Forge owns valuation;
  Studio owns appraiser-facing tooling. This transform produces a
  per-sale qualification value only — write-side consumers in those
  suites are out of scope.

## What This Document Is Not

- **Not a transform implementation.** Slice C8-B owns the C# code,
  test suite, and DI wiring. This document is the contract C8-B
  must obey.
- **Not a workbook lock instruction.** A real run of C8-B requires
  the C4.1 workbook to be reviewed and locked first. That is an
  operator decision, not a transform-development task.
- **Not a property / valuation / improvement / land / neighborhood
  policy.** Each future lane needs its own slice card and its own
  evidence anchor.
- **Not a UI or endpoint specification.** Slice C8-B is a service.
  Surfacing it through HTTP or a UI is out of scope and not
  scheduled.
