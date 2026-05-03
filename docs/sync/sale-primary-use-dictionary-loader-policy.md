# `sale.primary_use_cd` Dictionary Loader Policy

**Slice:** C30-A (docs-only — defines the contract for C30-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 43 `sale.primary_use_cd` code-values
against PACS's existing `dbo.property_use` dictionary. C30-C
will apply the operator-approved CSV via the existing C11-B
batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for the
sales-lane "primary use" axis. The **fourth dictionary-reuse
slice** in the C-series. Inherits everything from
C27-A / C28-A / C29-A.
**Status:** policy locked; precondition P2 deferred to C30-B;
NO live inspection (already complete at C22-B-live);
implementation deferred to C30-B; CSV apply deferred to C30-C.

## Why this slice

`sale.primary_use_cd` is the **largest remaining
dictionary-reuse target** in the workbook (43 NeedsReview rows).
It reuses the already-proven `dbo.property_use` dictionary from
C22-B-live. It mirrors C27-A's pattern exactly — same canonical
target (`PropertyUse`), same architectural shape, same Hard
Guards. No new architecture is introduced; this slice is the
fourth instance of the dictionary-reuse pattern.

The slice card explicitly chose this target over:

- **Lane hygiene** (extending C11-B grammar with `mapping_lane`)
  — wider mutation-surface change; deferred.
- **C27-Pre** (workbook profile extension to add
  `imprv_detail.imprv_det_type_cd`) — non-trivial scope;
  deferred.

The cleanest dictionary-reuse slice still in the workbook is
the right next target.

## Sales-lane semantic note (Sales-specific amendment)

Per C13-A's sales-lane review contract (the *operative* sales
policy this slice extends): `sale.primary_use_cd` records the
property's primary use *as captured at the moment of sale*,
which may differ from `property_val.property_use_cd` (the
*current* primary-use code on the same parcel) and from
`imprv.primary_use_cd` (the improvement-level primary-use code).
Three reasons these can diverge:

1. **Time-of-sale vs current.** A parcel's primary use can change
   between the sale date and the current valuation; the sale
   record preserves the historical classification.
2. **Pre-2017 conversion.** Per the standing C-series caveat,
   pre-2017 records may carry primary-use codes whose semantics
   differ from current dictionary interpretation.
3. **Sale-specific reclassification.** Some PACS workflows
   reclassify the use code on the sale record without updating
   the parent property record (e.g. when a parcel sells with a
   pending re-use designation).

The loader does NOT, must not, and cannot:

- propose a `canonical_value` based on the parcel's *current*
  property_use_cd (no cross-table inference);
- propose a `canonical_value` based on C22-C's prior mappings of
  the same code on `property_val.property_use_cd` (the
  cross-column auto-fill guard from C27-A applies);
- propose a `canonical_value` based on C27-C's prior mappings of
  the same code on `imprv.primary_use_cd`.

What the loader **does**: propose the dictionary description
verbatim. Operator confirms at C30-C whether the sale-side
canonical_value should align with C22-C / C27-C's prior choices,
or whether the time-of-sale historical context warrants a
distinct canonical_value.

## Dictionary Reuse

`dbo.sale.primary_use_cd` reuses the PACS `dbo.property_use`
dictionary. **This does not mean sale primary use is semantically
identical to valuation primary use in every downstream consumer.**
It means the code vocabulary is dictionary-backed by the same
PACS table and may be proposed through the same dictionary-loader
mechanism.

The Mapping Workbook remains the decision surface.

After C30-C, the workbook will have:

```
canonical_target = PropertyUse           → property_val.property_use_cd  (C22-C)
                                         → imprv.primary_use_cd          (C27-C)
                                         → sale.primary_use_cd           (C30-C, this slice)
canonical_target = PropertySecondaryUse  → property_val.secondary_use_cd (C28-C)
                                         → imprv.secondary_use_cd        (C29-C)
canonical_target = ImprvDetailClass      → imprv_det_class_cd            (C23-C)
canonical_target = LandSoil              → land_soil_code                (C24-C)
canonical_target = ImprvDetailMethod     → imprv_det_meth_cd             (C25-C)
canonical_target = ImprvDetailSubClass   → imprv_det_sub_class_cd        (C26-C)
```

Three workbook columns will share `canonical_target=PropertyUse`,
proving the canonical_target REUSE pattern extends from two
columns (C22+C27) to three (C22+C27+C30). Whether their
canonical_value strings align is the operator's decision per row.

## Architectural significance — what's new vs C27/C28/C29

| Property | C27-A | C28-A | C29-A | C30-A (this slice) |
|---|---|---|---|---|
| Dictionary | property_use [reuse] | property_use [reuse] | property_use [reuse] | property_use [reuse] |
| canonical_target | PropertyUse [reuse] | PropertySecondaryUse [new] | PropertySecondaryUse [reuse] | **PropertyUse [reuse — third column]** |
| Workbook target | imprv.primary_use_cd | property_val.secondary_use_cd | imprv.secondary_use_cd | **sale.primary_use_cd** |
| Source lane | Other (mis-laned) | Other (mis-laned) | Other (mis-laned) | **Other (mis-laned)** |
| Architectural novelty | first dictionary-reuse | distinct canonical_target | shared dict + canonical_target | **third column on PropertyUse** |
| Slice artifact dir | c27-b | c28-b | c29-b | **c30-b** |
| New live-inspection | no | no | no | **no** |
| New CLI flag | yes (--workbook-source-column) | no | no | **no** |
| New service class | no | no | no | **no** |
| Codes | 44 | 5 | 1 | **43** |

C30-A is the **fourth instance of the dictionary-reuse pattern
and the third workbook column to carry `canonical_target=PropertyUse`**.
No new architectural property is introduced beyond what C27-A
through C29-A already proved. C30 is the proof that the pattern
scales to N≥3 columns sharing one dictionary AND one canonical
target.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**.
- **C13-A — Sales-lane review policy** + amendment recording the
  2017 conversion caveat. **This slice's parent contract for
  sales-side semantics.**
- **C17-A → C17-D — Improvement-lane review** + C17-A3 flagging
  the lane-mismatched columns family.
- **C21-A — PACS canonical dictionaries reference**.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**
  (inspected `dbo.property_use` once at C22-B-live).
- **C23-A → C26-C — dictionary-loader generalization** (4 more
  dictionaries proven).
- **C27-A → C27-C — first dictionary-reuse slice**
  (`imprv.primary_use_cd`; canonical_target=PropertyUse).
- **C28-A → C28-C — second dictionary-reuse slice**
  (`property_val.secondary_use_cd`; canonical_target=
  PropertySecondaryUse).
- **C29-A → C29-C — third dictionary-reuse slice**
  (`imprv.secondary_use_cd`; canonical_target=PropertySecondaryUse
  REUSED from C28).
- **C30 (this slice)** — fourth dictionary-reuse slice;
  third workbook column on `canonical_target=PropertyUse`.

## Active Target

```
Workbook column row id  : 6016b60f-7a16-45ab-abc9-1f301b220912
SourceTable             : sale
SourceColumn            : primary_use_cd
MappingLane             : Other  (lane-mismatched per C17-A3 family;
                                   workbook hygiene, NOT a loader precondition)
ReviewStatus            : NeedsReview
CanonicalTarget         : (null)
Code-values             : 43 NeedsReview rows  (DOR PUC vocabulary,
                                                 already dictionary-backed)
```

## Out of scope (this slice)

- `dbo.property_val.property_use_cd` — C22-C done.
- `dbo.imprv.primary_use_cd` — C27-C done.
- `dbo.property_val.secondary_use_cd` — C28-C done.
- `dbo.imprv.secondary_use_cd` — C29-C done.
- `dbo.sale.secondary_use_cd` — separate workbook column;
  future dictionary-reuse slice (canonical_target likely
  `PropertySecondaryUse`).
- `dbo.imprv_detail.imprv_det_type_cd` — still parked
  (C27-Pre profile extension required).
- Marshall & Swift cost-schedule references — disabled per D0-D.

## Architectural note: terminal-count vs canonical-quality

Per the rest of the C-series. C30-C upgrades up to 43 rows from
status-terminal-only (post-P2) to status-and-canonical-terminal.

## Preconditions for C30-B

### P1 — Lane reclassification (DEFERRED)

`MappingLane=Other` for `sale.primary_use_cd`. Per the
established C25-B-through-C29-B finding: **the loader joins by
`SourceColumn`, NOT by lane**. P1 stays parked. Lane hygiene is
a separate slice (extends C11-B grammar with `mapping_lane`).

### P2 — Defer-by-default sweep (REQUIRED)

The 43 `NeedsReview` code-values must transition to `Deferred`
before the loader will propose anything. 43-row CSV via C11-B
`--apply`. Largest C-series P2 sweep yet (matches the largest
target since C24's 35 codes; C27-B-P2 was 44 — also large).
Audit Stamp Bump: 1.

### Precondition gate

C30-B's loader run shall produce a `Workbook Deferred rows
scanned: 0` summary if P2 is not met.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.property_use` |
| Dictionary inspection | **already complete at C22-B-live** — no re-inspection |
| Workbook source column | `dbo.sale.primary_use_cd` |
| Workbook column scope | Currently `Other` lane (P1 deferred); column row currently `NeedsReview` |
| Workbook code-value scope | 43 rows, all currently `NeedsReview` |
| Canonical target | `PropertyUse` (REUSED from C22-C and C27-C) |
| Slice artifact dir | `c30-b` |
| Program.cs config-switch key | `property_use:sale.primary_use_cd` |

## Hard Guards

All five guards from C22-A through C29-A port verbatim. No new
guard introduced — C30 is purely the fourth instance of the
dictionary-reuse pattern.

### 1. Read PACS, never write
### 2. Read-only workbook surface
### 3. No autodetection / no inferred canonical labels
The dictionary description is proposed verbatim. No
cross-column auto-fill from C22-C / C27-C / C28-C / C29-C.
**Particularly relevant for this slice**: the loader must NOT
read sibling sale.* fields (e.g. `sale.sl_dt`, `sale.sl_price`)
to infer time-of-sale context — the canonical_value is purely
the dictionary description; sale context is the operator's
decision at C30-C.

### 4. No second live-inspection
`dbo.property_use` was inspected at C22-B-live. C30-B inherits
those findings unchanged.

### 5. Allowlisted dictionary table — no new entry
Allowlist already includes `property_use`. C30-B does NOT add
to the allowlist.

## Mismatch Rules

When C30-B runs (after P2 is met), the same five mismatch
shapes from C22-A apply.

### Rule M1 — Workbook code present, dictionary code missing

Notes name the actual dictionary table (`property_use`).
**Sales-specific note appended**: "Code observed on the sale
record but missing from PACS property_use dictionary; may
indicate a pre-2017 conversion artifact, sale-specific
reclassification not propagated to the dictionary, or a
data-integrity issue. Operator confirms at C30-C; consider
cross-referencing the parcel's current property_val.property_use_cd
mapping (C22-C) and/or imprv.primary_use_cd mapping (C27-C) to
detect time-of-sale divergence."

### Rule M2 — Dictionary code present, workbook code absent

Per-column scope per C27-B's pinned property: M2 is computed
against the 43 sale-side workbook codes only. NOT against the
union of C22's 62 + C27's 44 + C28's 5 + C29's 1. Each column
maintains its own M2 set.

### Rule M3 — Duplicate dictionary code

Same as C22 / C27.

### Rule M4 — Inactive dictionary row

Per C22-B-live: `dbo.property_use` has no usable active flag;
M4 cannot fire.

### Rule M5 — Clean match (the happy path)

Workbook has `sale.primary_use_cd = 'W'` and
`dbo.property_use` has **exactly one active** row with that
code.

**Output**: `review_status=Mapped`, `canonical_value` = the
dictionary's description, `canonical_target=PropertyUse`,
notes documenting the match + 2017 conversion caveat +
sales-time-of-sale caveat.

## Pre-2017 Conversion Caveat — sales amplification

Per C13-A's sales-lane policy (the operative sales contract):
pre-2017 PACS records may carry `sale.primary_use_cd` values
whose semantics differ from current dictionary interpretation.
The operator confirms during C30-C review.

Per the C13-A 2017 amendment specifically: pre-2017 sales
records may also carry use codes that reflect the *historical*
PUC vocabulary in effect at the sale date, not the current
PUC vocabulary. C30-B's loader proposes using the *current*
dictionary description; the operator decides at C30-C whether
the historical context overrides the current dictionary
interpretation.

## Review CSV Output Shape

```text
backend/artifacts/sync-atlas/c30-b/<run-id>/sale_primary_use-proposed-review.csv
backend/artifacts/sync-atlas/c30-b/<run-id>/sale_primary_use-mismatch-report.md
backend/artifacts/sync-atlas/c30-b/<run-id>/loader-run.txt
```

No `dictionary-inspection.txt` (fourth no-inspection slice
after C27-B / C28-B / C29-B).

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| Auto-promote workbook rows to Mapped | Dictionary is evidence, not authority. |
| Auto-fill canonical_values from C22-C/C27-C/C28-C/C29-C | Per C27-A "no cross-column auto-fill" guard. |
| Read sale context (sl_dt, sl_price, etc.) for canonical inference | Loader proposes dictionary description; sale-context interpretation is the operator's authority at C30-C. |
| Run P2 sweep as a loader side-effect | P2 is operator-driven C11-B. |
| Apply dictionary to sale.secondary_use_cd in this slice | Future dictionary-reuse slice. |
| Re-inspect `dbo.property_use` | Already inspected at C22-B-live. |
| Add to allowlist | Already there. |
| Add new CLI flag | `--workbook-source-column` from C27-B reused. |
| Modify C13-A sales-lane policy | C30 extends C13-A by adding a dictionary-loader path; does NOT amend the existing sales-review contract. |
| Pull Marshall & Swift | Disabled per D0-D. |
| Mutate PACS rows | Read-only by policy. |
| Skip P2 | Loader produces 0 rows until code-values are `Deferred`. |
| Require P1 (lane reclassification) | Workbook hygiene only, per C25-B. |
| Add `mapping_lane` to C11-B grammar | Lane hygiene is a separate slice. |
| Profile imprv_det_type_cd into the workbook | C27-Pre is a separate slice. |
| Cross-county vocabulary import | Per-PACS-instance variation. |

## Success Gates for C30-B

| Gate | Pass criterion |
|---|---|
| **No new live-inspection** | C30-B does NOT re-query `dbo.property_use`. |
| **No allowlist change** | `IsAllowedPacsDictionaryTable` unchanged. |
| **No new CLI flag** | `--workbook-source-column` reused. |
| **No new service class** | Eighth use of C23-B's generalized service. |
| **P2 documented** | `workbook-pre-state.txt` confirms 43 code-values are `Deferred`. |
| **Loader runs read-only** | Zero workbook + PACS mutations. |
| **43 rows classified** | M1+M3+M4+M5 sum = 43. |
| **No `Mapped` without dictionary match** | Every Mapped row has an active, unambiguous dictionary row. |
| **No cross-column auto-fill** | Loader proposes dictionary description; does NOT consult C22-C / C27-C / C28-C / C29-C prior canonical_values. |
| **No sale-context inference** | Test pin: a unit test seeds sale-context fields (e.g. neighboring sale rows in the workbook) and asserts the canonical_value comes from the dictionary description, NOT from any sale-side field. |
| **canonical_target REUSE pinned** | Test pin: `Target.CanonicalTargetName == "PropertyUse"`; fallback string is `"PropertyUse:<code>"`; identical to C22-C / C27-C's vocabulary. |
| **All prior C-series anchors preserved** | Every prior dictionary-aware Mapped row byte-for-byte unchanged. |
| **RFC 4180 compliance** | CSV passes the C11-B parser's dry-run validation step. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C30-C

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C30-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly the in-scope row count mutated (≤43). |
| **All other lanes preserved** | All anchor lanes byte-for-byte unchanged. |
| **sale.primary_use_cd column-row preserved** | Column row stays at its post-P2 status. |
| **canonical_target = PropertyUse** | Reused from C22-C and C27-C. |

## Recommended pacing

- **C30-B** — P2 sweep (43-row CSV) + Program.cs config branch +
  `SalePrimaryUseDictionaryLoaderTests` + read-only proposal
  generation. Mirrors C27-B / C28-B / C29-B exactly. **No new
  service class. No new live-inspection. No allowlist change.
  No new CLI flag.**
- **C30-C** — operator review + apply. Up to 43 rows mutated.

## What This Enables (non-binding)

- **C30-B** — the actual loader run. ~5-7 unit tests against
  InMemory + stub reader.
- **C30-C** — operator-driven CSV review and apply.
- **Future dictionary-reuse slices**:
  - `sale.secondary_use_cd` (TBD NeedsReview;
    canonical_target=`PropertySecondaryUse`; 5th dictionary-reuse)
- **C27-Pre (still parked)** — workbook profile extension.
- **Lane hygiene slice** — extend C11-B grammar with
  `mapping_lane`; batch-reclassify all 5+ lane-mismatched
  columns at once.

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Promote any code-value.
- Build or change any code (deferred to C30-B).
- Touch the running PACS sync service install.
- Mandate cross-column canonical-value alignment with C22-C /
  C27-C.
- Read sale-context fields.
- Modify C13-A's sales-lane review contract.
- Auto-execute the Defer-by-default sweep.
- Re-inspect `dbo.property_use`.
- Add to the allowlist.
- Add any new CLI flag.

## What This Slice Is

The ninth dictionary-aware policy in TerraFusion. The **fourth
dictionary-reuse slice**. Proves the canonical_target=`PropertyUse`
vocabulary scales to **three** workbook columns
(`property_val.property_use_cd`, `imprv.primary_use_cd`,
`sale.primary_use_cd`). Largest remaining dictionary-reuse
target in the workbook: 43 codes.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration.
A new architectural property beyond what C27/C28/C29 already
proved. A re-inspection. An allowlist amendment. A CLI surface
change. An amendment to the C13-A sales-lane policy. A
sale-context interpretation engine.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat — **this slice's parent for sales-specific semantics** |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary catalog |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — provides the inspection + allowlist entry C27/C28/C29/C30 reuse |
| `docs/sync/imprv-primary-use-dictionary-loader-policy.md` (C27-A) | first dictionary-reuse slice; PropertyUse vocabulary REUSE on imprv side |
| `docs/sync/property-val-secondary-use-dictionary-loader-policy.md` (C28-A) | second dictionary-reuse slice; introduced PropertySecondaryUse |
| `docs/sync/imprv-secondary-use-dictionary-loader-policy.md` (C29-A) | third dictionary-reuse slice; PropertySecondaryUse REUSE |
| **`docs/sync/sale-primary-use-dictionary-loader-policy.md` (C30-A)** | **this doc — fourth dictionary-reuse slice; third workbook column on canonical_target=PropertyUse; sales-lane semantic amendment for time-of-sale + sale-context-inference guards** |
