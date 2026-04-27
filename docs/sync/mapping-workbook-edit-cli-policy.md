# Mapping Workbook Edit CLI Policy

> Slice C9-A — design only. **No CLI code or service code lands with
> this slice.** The accompanying implementation is Slice C9-B.

This document defines the safety contract for the first tool that
mutates Mapping Workbook review state. The edit CLI is the operator's
path from a Draft workbook full of `NeedsReview` rows to a workbook
that the C6 lock service will accept (i.e. one where every column and
every code-value has reached a terminal review status). Until C9-B
ships, the C4.1 workbook (`a767c8a2-5b8a-4846-af8b-c3496601e924`)
remains Draft with all 1,733 code values still in `NeedsReview` —
which is exactly the state the C8-D guard test was built around.

The pencil sharpener exists in this document. The pencil itself
arrives in C9-B.

## Purpose

Provide a controlled, county-scoped, single-row mutation path for
Mapping Workbook decisions while a workbook is `Status='Draft'`. The
edit CLI is the only sanctioned write surface to `SyncMappingColumn`
and `SyncMappingCodeValue` rows in the operator workflow.

## Hard Guards

Every edit invocation must pass all six:

1. **Status guard.** The workbook must be `SyncMappingWorkbook.Status = "Draft"`.
   Any other status (`Mapped`, `Approved`, `Archived`, `InProgress`, or any
   future value) fails closed with `InvalidOperationException`.
   Mirrors the C6 lock-service rule in reverse: lock requires
   `Draft → Mapped`; edit requires `Draft only`.
2. **County scope.** The workbook row's `CountyId` must match the
   operator's `--county-id`. Cross-county edit attempts surface as
   "not found for county" and never reveal whether the workbook
   exists in a different scope.
3. **Source-row identity.** The edit names exactly one column or one
   code-value via fully-qualified source identity:
   - Column scope: `(SourceSchema, SourceTable, SourceColumn)`
   - Code-value scope: column identity + `SourceValue`
   No wildcards. No prefix matches. No fuzzy lookups.
4. **At-least-one mutation.** At least one mutating field
   (`--canonical-target`, `--canonical-value`, `--review-status`,
   `--is-excluded`, `--notes`) must be supplied. A bare
   `--edit-mapping-workbook --workbook-id … --source …` invocation
   (no mutation) is rejected as a no-op-with-side-effects.
5. **Scope-correct fields.** Column-only fields cannot be set on a
   code-value edit; code-value-only fields cannot be set on a column
   edit:
   - **Column-only:** `--canonical-target`
   - **Code-value-only:** `--canonical-value`, `--is-excluded`,
     `--source-value`
   - **Either:** `--review-status`, `--notes`
6. **Valid review status.** `--review-status`, when supplied, must be
   one of the closed vocabulary documented in
   [Valid Review Statuses](#valid-review-statuses) below. Any other
   string is rejected at the parser before any DB read.

## CLI Mode

The edit CLI lives as a fifth mutually-exclusive mode in SyncAtlas:

| Mode | Trigger | Slice |
|---|---|---|
| Profile (default) | (no toggle) | B1.5 / B2.x |
| Generate workbook | `--generate-mapping-workbook` | C4 |
| Export workbook | `--export-mapping-workbook` | C5 |
| Qualify sales | `--qualify-sales` | C8-C |
| **Edit workbook** | **`--edit-mapping-workbook`** | **C9-B (this slice's contract)** |

The five mode toggles are mutually exclusive — a single invocation
must carry exactly one. All other modes' flags must be rejected
inside an edit invocation, and the edit flags must be rejected
inside any other mode.

## Required Fields

| Field | Required when | Example |
|---|---|---|
| `--db` | Always | `"Host=localhost;Port=5432;Database=terrafusion;…"` |
| `--county-id` | Always | `19190019-1919-1919-1919-191919191919` |
| `--edit-mapping-workbook` | Edit mode | (toggle, no value) |
| `--workbook-id` | Edit mode | `a767c8a2-5b8a-4846-af8b-c3496601e924` |
| `--source` | Edit mode | `dbo.sale.wac_cd` |
| `--source-value` | Code-value scope | `"458-61A-203(1)"` |
| `--operator` | Always (default `cli-operator`) | `bsval` |

## Mutating Fields

| Field | Scope | Stored in | Notes |
|---|---|---|---|
| `--canonical-target <text>` | Column | `SyncMappingColumn.CanonicalTarget` | Free-form canonical destination name. Max 256 chars per the C2 schema. |
| `--canonical-value <text>` | Code-value | `SyncMappingCodeValue.CanonicalValue` | Free-form canonical value. Max 256 chars. `null` cleared via `--canonical-value-null`. |
| `--review-status <enum>` | Column \| Code-value | `*.ReviewStatus` | One of the [valid statuses](#valid-review-statuses). |
| `--is-excluded <bool>` | Code-value | `SyncMappingCodeValue.IsExcluded` | `true` / `false`. |
| `--notes <text>` | Column \| Code-value | `*.Notes` | Free-form. Max 4000 chars (column) / 2000 chars (code-value) per the C2 schema. |

Idempotent re-edit: setting a field to its current value is a
successful no-op-with-stamp (the row's `UpdatedAt` and `UpdatedBy`
audit fields still bump, since "the operator confirmed this value
again" is itself an auditable event). The CLI prints "no changes"
in the Pre/Post panels when nothing would differ — the field is
stamped, but the displayed diff is empty.

## Valid Review Statuses

Editable on every row:

- `NeedsReview` — initial state from C3 loader; no operator decision yet.
- `InProgress` — operator has started but not finished. Not terminal; lock refuses.
- `Mapped` — operator decided on a canonical value/target. Terminal for lock.
- `Excluded` — operator decided to drop the row from downstream consumption. Terminal for lock.
- `Deferred` — operator parked the decision intentionally. Terminal for lock.

Terminal-for-lock subset (must be reached for every column AND every
code-value before C6 `LockAsync` succeeds):

```
{ Mapped, Excluded, Deferred }
```

`NeedsReview` and `InProgress` are explicitly NOT terminal — pinned by
`SyncMappingWorkbookLockService.TerminalReviewStatuses` (C6).

## CLI Examples

> All examples target the C4.1 workbook
> `a767c8a2-5b8a-4846-af8b-c3496601e924` and use real PACS values
> from the B2.7-OLTP marker batch.

### Set a column's canonical target

```bash
sync-atlas --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --edit-mapping-workbook \
  --workbook-id "a767c8a2-5b8a-4846-af8b-c3496601e924" \
  --source "dbo.property_val.property_use_cd" \
  --canonical-target "PropertyUse" \
  --review-status Mapped \
  --operator bsval
```

### Map a code value (operator-mapped, kept in comp pool)

```bash
sync-atlas --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --edit-mapping-workbook \
  --workbook-id "a767c8a2-5b8a-4846-af8b-c3496601e924" \
  --source "dbo.sale.wac_cd" \
  --source-value "458-61A-203(1)" \
  --canonical-value "TransferByDeed" \
  --review-status Mapped \
  --operator bsval
```

### Exclude a code value (operator-excluded, dropped from comp pool)

```bash
sync-atlas --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --edit-mapping-workbook \
  --workbook-id "a767c8a2-5b8a-4846-af8b-c3496601e924" \
  --source "dbo.sale.wac_cd" \
  --source-value "458-61A-217(1)" \
  --review-status Excluded \
  --is-excluded true \
  --notes "REET exemption; not arms-length; do not feed comps." \
  --operator bsval
```

### Defer a code value

```bash
sync-atlas --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --edit-mapping-workbook \
  --workbook-id "a767c8a2-5b8a-4846-af8b-c3496601e924" \
  --source "dbo.sale.wac_cd" \
  --source-value "458-61A-303" \
  --review-status Deferred \
  --notes "Needs assessor review — never seen before." \
  --operator bsval
```

### Roll a code value back to NeedsReview

```bash
sync-atlas --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --edit-mapping-workbook \
  --workbook-id "a767c8a2-5b8a-4846-af8b-c3496601e924" \
  --source "dbo.sale.wac_cd" \
  --source-value "458-61A-203(2)" \
  --review-status NeedsReview \
  --canonical-value-null \
  --is-excluded false \
  --notes "Reset for re-review." \
  --operator bsval
```

`--canonical-value-null` is the explicit null-set form, distinct from
omitting `--canonical-value` entirely. The CLI rejects an omitted-and-
expected mutation as no-op (Hard Guard #4); explicit `null` is a real
intended value.

## Output Contract

Every successful edit prints a one-page summary mirroring the
existing C4 / C5 / C8-C output style:

```
sync-atlas: editing mapping workbook a767c8a2-…
sync-atlas:   target:      dbo.sale.wac_cd / 458-61A-203(1)
sync-atlas:   operator:    bsval
─────────────────────────────────────────────
  Workbook Id:         a767c8a2-5b8a-4846-af8b-c3496601e924
  Workbook Status:     Draft
  Edited:              code value
  Source:              dbo.sale.wac_cd
  Source Value:        458-61A-203(1)
─────────────────────────────────────────────
  Pre-edit:
    review_status:    NeedsReview
    canonical_value:  (null)
    is_excluded:      false
    notes:            (null)
  Post-edit:
    review_status:    Mapped
    canonical_value:  TransferByDeed
    is_excluded:      false
    notes:            (unchanged)
─────────────────────────────────────────────
```

When a column is edited (no `--source-value`), the panel changes to
`Edited: column` and the field set is `canonical_target / review_status / notes`.

## Audit Expectations

- `UpdatedAt` on the touched row updates to `now()`.
- `UpdatedBy` on the touched row stamps with `--operator` (default `cli-operator`).
- `CreatedAt` / `CreatedBy` are NEVER touched on edit.
- The workbook's own `UpdatedAt` updates so a downstream "what changed
  in this workbook recently" query can sort by `MAX(UpdatedAt)` over
  workbook + columns + code-values.
- No separate audit log table is added for edits in C9-B. The schema's
  existing audit fields (FISMA-required, auto-populated by
  `AuditableEntityInterceptor`) carry the trail.

## Hard Non-Goals

The edit CLI must NOT:

- **Auto-exclude WAC codes.** Memory-flagged scenario: an exempt-
  transfer WAC code (e.g. `458-61A-217(1)`) becomes excluded only when
  the operator types `--is-excluded true`. The CLI never infers,
  never bulk-marks, never silently filters. Pinned by the C9-B test
  matrix below (`Edit_DoesNotAutoExcludeWacCodes`).
- **Wildcard or batch.** First-implementation scope is one row per
  invocation. CSV/JSON imports, `--source dbo.sale.*`, regex matches,
  and "promote everything in this lane to Mapped" are explicitly
  out-of-scope.
- **Mutate non-Draft workbooks.** Mapped/Approved/Archived workbooks
  refuse edit at Hard Guard #1 — the locked review work is the audit
  trail; rolling it back requires a new workbook (Slice C3 loader),
  not an in-place edit.
- **Mutate `SyncProfileCodeCandidate` rows.** The profile is the
  evidence; the workbook is the decision. Edit touches workbook only.
- **Mutate PACS rows.** The CLI runs against TerraFusion DB; it never
  opens a connection to the source SQL Server.
- **Mutate canonical landing tables.** `Owners`,
  `OwnershipEvents`, `LandSegments`, `ImprovementDetails`,
  `SyncRecords` — all out of scope.
- **Mutate Forge / TerraAtlas / Studio / Dais artifacts.** Suite
  boundary preserved.
- **Auto-lock.** Reaching all-terminal review-status state does NOT
  trigger a Draft → Mapped transition. Lock is a separate operator
  action (slice card hints `feat/syncatlas-lock-workbook-cli` as the
  next promotion after C9-B).
- **Run sales qualification.** Edit and qualify-sales modes are
  mutually exclusive. The qualify path remains read-only and Mapped-
  only.

## Future Implementation Tests (C9-B)

When the edit CLI lands, the following test matrix is required.
Tests touching the memory-flagged "WacCd bug blocks all comps"
scenario are tagged **(memory-flagged)**.

### Status guard

- `Edit_RejectsNonDraftWorkbook` — Theory ×4 over `Mapped`,
  `Approved`, `Archived`, `Locked`. All throw with the same
  `Status='X'…only workbooks with Status='Draft'…` message.
- `Edit_AcceptsDraftWorkbook` — happy path baseline.

### Source-row identity

- `Edit_RejectsMissingSourceColumn` — source identity that doesn't
  match any column row throws with column-not-found.
- `Edit_RejectsMissingSourceValue` — column exists but source value
  doesn't match any code-value row.
- `Edit_RejectsCrossCountySourceColumn` — column belongs to a
  different county's workbook.

### Field-scope correctness

- `Edit_RejectsCanonicalTargetOnCodeValueScope` — using
  `--canonical-target` together with `--source-value` is a parse error.
- `Edit_RejectsCanonicalValueOnColumnScope` — using `--canonical-value`
  without `--source-value` is a parse error.
- `Edit_RejectsIsExcludedOnColumnScope` — `--is-excluded` without
  `--source-value` is a parse error.

### Mutation correctness

- `Edit_UpdatesColumnCanonicalTarget`
- `Edit_UpdatesColumnReviewStatus`
- `Edit_UpdatesCodeValueCanonicalValue`
- `Edit_UpdatesCodeValueReviewStatus`
- `Edit_UpdatesCodeValueIsExcluded`
- `Edit_UpdatesNotes` (Theory ×2 — column scope and code-value scope)

### No-side-effect correctness

- `Edit_DoesNotModifyOtherCodeValuesInSameColumn` — edit one value;
  siblings unchanged.
- `Edit_DoesNotModifyOtherColumns` — edit one column; siblings unchanged.
- `Edit_DoesNotModifyOtherWorkbooks` — edit one workbook; another
  workbook in the same county unchanged.
- `Edit_DoesNotModifyOtherCounties` — edit County A's workbook;
  County B's untouched (relies on Hard Guard #2).
- `Edit_DoesNotMutateProfileCandidate` — `SyncProfileCodeCandidate`
  row that seeded this code-value is untouched.
- `Edit_DoesNotWriteCanonicalLandingRows` — `Owners /
  OwnershipEvents / LandSegments / ImprovementDetails / SyncRecords`
  counts unchanged.

### Memory-flagged WacCd scenario

- `Edit_DoesNotAutoExcludeWacCodes` **(memory-flagged)** —
  setting `--review-status Mapped --canonical-value TransferByDeed`
  on `458-61A-203(1)` keeps `IsExcluded=false`. The operator typing
  `--is-excluded true` is the only path to exclusion.
- `Edit_PreservesOperatorIsExcludedDecision` **(memory-flagged)** —
  re-editing a previously-excluded code value with only
  `--canonical-value` (no `--is-excluded`) leaves `IsExcluded=true`
  unchanged.

### Audit

- `Edit_StampsUpdatedByFromOperator` — operator id round-trips into
  the row's `UpdatedBy`.
- `Edit_BumpsUpdatedAt` — `UpdatedAt` strictly increases.
- `Edit_DoesNotChangeCreatedFields` — `CreatedAt` / `CreatedBy`
  unchanged across edits.
- `Edit_BumpsWorkbookUpdatedAt` — workbook row's own `UpdatedAt`
  updates so a "recently changed" query sees the edit.

### Idempotency

- `Edit_NoOpEdit_ReturnsSuccessWithEmptyDiff` — setting a field to
  its current value succeeds, prints empty diff, still bumps audit
  stamps (operator confirmation is itself an event).
- `Edit_RejectsBareInvocationWithNoMutationFields` — Hard Guard #4.

### Mode-mutex (parser layer)

- `Parse_EditMappingWorkbook_MutuallyExclusiveWithProfileGenerateExportQualify`
- `Parse_EditFlagsRejectedInOtherModes`
- `Parse_EditMode_DoesNotRequireConnectionId` (consistent with C5/C8-C)

### Output contract

- `Edit_OutputContainsPreAndPostPanels` — pinned format pre/post
  field listings.
- `Edit_OutputDistinguishesColumnAndCodeValueScopes` — `Edited: column`
  vs. `Edited: code value` headers.

## Provenance

- C2 schema (terminal review-status set, audit fields):
  `SyncMappingWorkbook` / `SyncMappingColumn` / `SyncMappingCodeValue`
  via merge `9b86319f6`.
- C3 loader (initial `NeedsReview` state for new workbooks): merge
  `446efbd21`.
- C4 generator + C4.1 first real workbook materialization
  (`a767c8a2-5b8a-4846-af8b-c3496601e924` — current Draft target):
  marker `b7d05dc50`.
- C5 export (review packet for offline assessor work — companion to
  this edit surface): marker `02857d2a9`.
- C6 lock (terminal review statuses defined: `Mapped` / `Excluded` /
  `Deferred`): merge `44c7c1737`.
- C8-D guard proof (Draft refuses qualify-sales — same Draft is the
  only state edit accepts): marker `4112a5f19`.
- Memory-flagged directive: "WacCd bug blocks all comps." Edit CLI
  preserves it by refusing to auto-exclude.

## What This Document Is Not

- **Not an implementation.** Slice C9-B owns the C# code, parser
  changes, EF row mutation, and test suite. This document is the
  contract C9-B must obey.
- **Not a lock instruction.** Edit produces terminal review statuses
  on rows; lock is a separate slice (`feat/syncatlas-lock-workbook-cli`)
  that consumes those terminal statuses to flip workbook
  `Status='Draft'` → `Status='Mapped'`.
- **Not a batch import policy.** First-implementation scope is one
  row per invocation. Batch is a future slice with its own card.
- **Not a UI or endpoint specification.** Slice C9-B is a CLI service.
  Surfacing it through HTTP / WPF / Electron is out of scope.
- **Not a property / improvement / land / neighborhood lane policy.**
  Lane-specific transform policies (e.g. C8-A for sales) are
  parallel slice cards. Edit is lane-agnostic — it edits whatever
  rows the operator names, regardless of `MappingLane`.
