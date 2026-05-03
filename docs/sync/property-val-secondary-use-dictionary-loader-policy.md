# `property_val.secondary_use_cd` Dictionary Loader Policy

**Slice:** C28-A (docs-only — defines the contract for C28-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 5 `property_val.secondary_use_cd`
code-values against PACS's existing `dbo.property_use` dictionary.
C28-C will apply the operator-approved CSV via the existing C11-B
batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for the property-
valuation "secondary use" axis, the **second** dictionary-reuse
slice in the C-series. Inherits everything from C27-A's
dictionary-reuse template; introduces no new architecture.
**Status:** policy locked; precondition P2 deferred to C28-B;
NO live inspection (already complete at C22-B-live);
implementation deferred to C28-B; CSV apply deferred to C28-C.

## Purpose vs C27 — what's different, what's the same

| Concern | C27-A (imprv.primary_use) | C28-A (property_val.secondary_use) |
|---|---|---|
| Dictionary | `dbo.property_use` | `dbo.property_use` (same) |
| Dictionary inspection | reused from C22-B-live | reused from C22-B-live (no re-run) |
| Allowlist change | none | none |
| Service class addition | 0 | 0 |
| New CLI flag | `--workbook-source-column` (added at C27-B) | none — uses C27-B's flag |
| New Program.cs config branch | yes (`property_use:imprv.primary_use_cd`) | yes (`property_use:property_val.secondary_use_cd`) |
| New test file | `ImprvPrimaryUseDictionaryLoaderTests` | `PropertyValSecondaryUseDictionaryLoaderTests` |
| Workbook target | `dbo.imprv.primary_use_cd` | `dbo.property_val.secondary_use_cd` |
| Workbook scope | 44 NeedsReview, Other lane | **5 NeedsReview, Other lane** |
| Canonical target | `PropertyUse` (reused from C22) | `PropertySecondaryUse` (NEW vocabulary) |
| Architectural novelty | first dictionary-reuse slice | second dictionary-reuse slice; **distinct canonical-target vocabulary** despite same dictionary |
| Slice artifact dir | `c27-b` | `c28-b` |

## Architectural significance

C27-A introduced the dictionary-reuse pattern: one PACS dictionary
serving two workbook columns. C28-A is the **second** dictionary-
reuse slice and introduces one new architectural property:

**Two workbook columns can share one PACS dictionary while having
DIFFERENT canonical_target vocabularies.**

The C22-C / C27-C precedent reused `canonical_target = "PropertyUse"`
because both columns held primary-use semantics. For
`secondary_use_cd`, the operator's intent is *secondary* use — a
distinct semantic axis. The C28-A canonical target is therefore
`"PropertySecondaryUse"`, NOT `"PropertyUse"`. Future canonical-
value consumers reading the workbook will see:

```
canonical_target = PropertyUse           → property_val.property_use_cd (C22-C)
                                         → imprv.primary_use_cd        (C27-C)
canonical_target = PropertySecondaryUse  → property_val.secondary_use_cd (C28-C, this slice)
```

This proves the `DictionaryLoaderTargetConfig.CanonicalTargetName`
field is genuinely orthogonal from the dictionary identity. The
loader proposes the same dictionary description regardless of
canonical_target; only the **classification axis** in the
canonical-value namespace changes.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**
  (`docs/sync/pacs-canonical-dataflow-identity-policy.md`).
- **C17-A → C17-D — Improvement-lane review** + C17-A3 amendment
  flagging the `secondary_use_cd` family of columns as Tier 1 /
  lane-pending.
- **C21-A — PACS canonical dictionaries reference**.
  Catalogs `property_use` as the canonical dictionary for all
  DOR-PUC-bearing columns including secondary-use variants.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**.
  Inspected `dbo.property_use` live (85 rows, no `sys_flag`,
  no year column, columns
  `property_use_cd` / `property_use_desc`). C28-B inherits this
  inspection unchanged.
- **C23-A → C26-C — dictionary-loader generalization** + four
  applications. Five live-inspection wrong-assumption catches.
- **C27-A → C27-C — first dictionary-reuse slice**
  (`docs/sync/imprv-primary-use-dictionary-loader-policy.md`).
  Established the dictionary-reuse template: P2 sweep + new
  Program.cs config branch + new test file + new CLI flag
  (`--workbook-source-column`). Confirmed:
  - The loader joins by `SourceColumn`, not by lane (P1 is
    workbook hygiene only).
  - No cross-column canonical_value auto-fill (operator decides
    cross-column consistency at C28-C).
  - Per-column M2 scope (each workbook column's "unobserved
    dictionary code" set is computed against THAT column's
    workbook codes, not against any cross-column union).
- **C25-B / C26-A operational findings**: P1 (lane reclassification)
  is workbook hygiene, NOT a loader precondition.

## Active Target

`dbo.property_val.secondary_use_cd` is present in the workbook
with **5 NeedsReview code-values** in the Other lane:

```
Workbook column row id : 5d6a9d47-ac0a-48cd-bd59-d4622babac56
MappingLane            : Other
ReviewStatus           : NeedsReview
CanonicalTarget        : (null)
Code-values            : 11, 37, 61, 69, 81  (DOR PUC vocabulary,
                                              all already in C22-B-live's
                                              85-row dictionary)
```

All 5 codes are already known to be in `dbo.property_use` because
they fall in the DOR PUC numeric range C22-C and C27-C have both
mapped against. Expected outcome at C28-B-live: 5/5 M5 clean
matches, 0 M1.

## Out of scope (this slice)

- `dbo.imprv.secondary_use_cd` — separate workbook column also
  present (audited during C28-A pre-policy survey). Future
  dictionary-reuse slice.
- `dbo.sale.secondary_use_cd` — separate workbook column also
  present. Future dictionary-reuse slice.
- `dbo.property_val.property_use_cd` — covered by C22-C
  (canonical_target=`PropertyUse`).
- `dbo.imprv.primary_use_cd` — covered by C27-C
  (canonical_target=`PropertyUse`).
- `dbo.sale.primary_use_cd` — separate workbook column;
  43 NeedsReview; future dictionary-reuse slice
  (canonical_target likely `PropertyUse`).
- Marshall & Swift cost-schedule references — disabled per D0-D.

## Architectural note: terminal-count vs canonical-quality

Per C22-C through C27-C: promoting `Deferred → Mapped` improves
**semantic quality** but does NOT change the workbook's
**terminal-count math**. C28-C upgrades up to 5 rows from
status-terminal-only (post-P2) to status-and-canonical-terminal.

## Preconditions for C28-B (inherits C25-A / C26-A / C27-A pattern)

### Precondition P1 — Lane reclassification (DEFERRED, per C25-B finding)

Column lives in `Other` lane. The loader joins by `SourceColumn`,
not lane. P1 stays parked.

### Precondition P2 — Defer-by-default sweep (REQUIRED)

The 5 `NeedsReview` code-values must transition to `Deferred`
before the loader will propose anything. 5-row CSV via C11-B
`--apply`. Smallest possible C-series P2 yet (C26's 2-row was
slightly smaller; that was the dictionary itself, not a sweep).
Audit Stamp Bump: 1.

### Precondition gate

C28-B's loader run **shall produce a `Workbook Deferred rows
scanned: 0` summary if P2 is not met**. Same as C25/C26/C27.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.property_use` |
| Dictionary inspection | **already complete at C22-B-live** — no re-inspection |
| Workbook source column | `dbo.property_val.secondary_use_cd` |
| Workbook column scope | Currently `Other` lane (P1 deferred); column row currently `NeedsReview` |
| Workbook code-value scope | 5 rows: 11, 37, 61, 69, 81 (all currently `NeedsReview`) |
| Canonical target | **`PropertySecondaryUse`** (NEW vocabulary; distinct from `PropertyUse`) |
| Slice artifact dir | `c28-b` |
| Program.cs config-switch key | `property_use:property_val.secondary_use_cd` |

## Hard Guards

All five guards from the C22-A through C27-A series port verbatim.
Particularly relevant for this slice:

### 3. No autodetection / no inferred canonical labels — extended

The loader does NOT auto-fill canonical_value from C22-C's prior
`property_use_cd` mappings or C27-C's prior `primary_use_cd`
mappings, even when codes match exactly. Per C27-A's "no
cross-column auto-fill" guard. The dictionary description is
proposed verbatim; operator decides cross-column alignment at
C28-C.

### 3a. No canonical-target conflation (NEW for C28)

The loader does NOT propose `canonical_target = "PropertyUse"`
just because the dictionary is the same. The Program.cs config
branch sets `CanonicalTargetName = "PropertySecondaryUse"`
explicitly. This means a future canonical-value consumer reading
the workbook can distinguish:

- "this is the parcel's PRIMARY use" → `canonical_target=PropertyUse`
- "this is the parcel's SECONDARY use" → `canonical_target=PropertySecondaryUse`

without inspecting the source column. Operator confirms the
canonical-target choice at C28-C; the loader does not propose
an override.

### 4. No second live-inspection

`dbo.property_use` was inspected at C22-B-live. C28-B inherits
those findings unchanged. **This is the second slice (after C27-B)
to exercise the per-dictionary inspection scope** of the
live-inspection gate.

### 5. Allowlisted dictionary table — no new entry

Allowlist already includes `property_use`. C28-B does NOT add to
the allowlist.

## Mismatch Rules

When C28-B runs (after P2 is met), the same five mismatch shapes
from C22-A apply.

### Rule M1 — Workbook code present, dictionary code missing

Same shape as C22 / C27. Notes name the actual dictionary table
(`property_use`).

### Rule M2 — Dictionary code present, workbook code absent

Per-column scope (per C27-B's pinned property): `secondary_use_cd`
M2 count is computed against the 5 workbook codes only; it does
NOT cross-reference C22-C's 62 `property_use_cd` codes or C27-C's
44 `primary_use_cd` codes.

Expected: 80 M2 (85 dict − 5 workbook = 80, assuming all 5 match).

### Rule M3 — Duplicate dictionary code

Same as C22 / C27.

### Rule M4 — Inactive dictionary row

Per C22-B-live: `dbo.property_use` has no usable active flag, so
M4 cannot fire against this PACS instance.

### Rule M5 — Clean match (the happy path)

Workbook has `secondary_use_cd = 'W'` and `dbo.property_use` has
**exactly one active** row with that code.

**Output**: `review_status=Mapped`, `canonical_value` = the
dictionary's description, `canonical_target=PropertySecondaryUse`,
notes documenting the match + 2017 conversion caveat.

## Review CSV Output Shape

```text
backend/artifacts/sync-atlas/c28-b/<run-id>/property_val_secondary_use-proposed-review.csv
backend/artifacts/sync-atlas/c28-b/<run-id>/property_val_secondary_use-mismatch-report.md
backend/artifacts/sync-atlas/c28-b/<run-id>/loader-run.txt
```

No `dictionary-inspection.txt` — same dictionary as C22 / C27;
inspection captured once at C22-B-live.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| Auto-promote workbook rows to Mapped | Dictionary is evidence, not authority. |
| Auto-fill canonical_values from C22-C / C27-C | Per C27-A "no cross-column auto-fill" guard. |
| Conflate `canonical_target` with C22 / C27 | Each column gets its own canonical-target vocabulary; the loader does NOT default to `PropertyUse` because the dictionary is shared. |
| Run P2 sweep as a loader side-effect | P2 is operator-driven C11-B. |
| Apply dictionary to other secondary_use_cd columns in this slice | `imprv.secondary_use_cd` and `sale.secondary_use_cd` each need their own slice. |
| Re-inspect `dbo.property_use` | Already inspected at C22-B-live. |
| Add `property_use` to the allowlist again | Already there. |
| Pull Marshall & Swift cost-schedule references | Disabled per D0-D. |
| Mutate PACS rows | Read-only by policy. |
| Skip P2 | Loader produces 0 rows until code-values are `Deferred`. |
| Require P1 (lane reclassification) | Workbook hygiene only, per C25-B. |
| Cross-county vocabulary import | Per-PACS-instance variation per D0-D. |

## Success Gates for C28-B (loader implementation slice)

| Gate | Pass criterion |
|---|---|
| **No new live-inspection** | C28-B does NOT re-query `dbo.property_use`. |
| **No allowlist change** | `IsAllowedPacsDictionaryTable` is unchanged. |
| **No new CLI flag** | `--workbook-source-column` (added at C27-B) is reused. |
| **P2 documented** | `workbook-pre-state.txt` confirms code-values are `Deferred`. |
| **Loader runs read-only** | C28-B run produces zero workbook mutations and zero PACS mutations. |
| **5 rows classified** | M1+M3+M4+M5 sum equals 5. |
| **No `Mapped` without dictionary match** | Every Mapped row has a corresponding active, unambiguous dictionary row. |
| **No cross-column auto-fill** | Loader's M5 path proposes the dictionary description; does NOT consult C22-C's or C27-C's prior canonical_values for matching codes. |
| **Distinct canonical_target** | Test pin: `Target.CanonicalTargetName == "PropertySecondaryUse"` (NOT `"PropertyUse"`); fallback string is `"PropertySecondaryUse:<code>"`. |
| **RFC 4180 compliance** | CSV passes the C11-B parser's dry-run validation. |
| **All prior C-series anchors preserved** | Every C22-C / C23-C / C24-C / C25-C / C26-C / C27-C anchor row byte-for-byte unchanged. |
| **No new service class** | Sixth use of C23-B's generalized `DictionaryLoaderService`. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C28-C (operator-approve-and-apply slice)

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C28-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly 5 rows mutated (assuming all M5). |
| **All other lanes preserved** | All anchor lanes byte-for-byte unchanged. |
| **secondary_use_cd column-row preserved** | Column row stays at its post-P2 status. |
| **canonical_target = PropertySecondaryUse** | Distinct from C22-C / C27-C's `PropertyUse`. |

## Recommended pacing

- **C28-B** — P2 sweep (5-row CSV) + Program.cs config branch +
  `PropertyValSecondaryUseDictionaryLoaderTests` + read-only
  proposal generation. Smallest C-series session yet. **No new
  service class. No new live-inspection. No allowlist change.
  No new CLI flag.**
- **C28-C** — operator review + apply. ≤5 rows mutated.

## What This Enables (non-binding)

- **C28-B** — the actual loader run. ~5-7 unit tests against
  InMemory + stub reader.
- **C28-C** — operator-driven CSV review and apply.
- **Future dictionary-reuse slices** (same pattern):
  - `imprv.secondary_use_cd` (workbook scope: TBD; same dictionary)
  - `sale.secondary_use_cd` (workbook scope: TBD; same dictionary)
  - `sale.primary_use_cd` (43 NeedsReview; same dictionary; canonical_target likely `PropertyUse`)
- **Cross-column canonical-value alignment slice** — if a future
  consumer requires C22-C's, C27-C's, and C28-C's canonical_values
  to be consistent on overlapping codes, a tiny C11-B `--apply`
  slice can rephrase one set to match.

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Promote any code-value.
- Build or change any loader code (deferred to C28-B).
- Touch the running PACS sync service install.
- Mandate cross-column canonical-value alignment.
- Auto-execute the Defer-by-default sweep.
- Re-inspect `dbo.property_use`.
- Add to the allowlist.
- Add any new CLI flag.

## What This Slice Is

The seventh dictionary-aware policy in TerraFusion. The **second
dictionary-reuse slice**. Proves that the dictionary-reuse pattern
extends to a **different canonical-target vocabulary** while
sharing the same PACS dictionary. Smallest possible C-series
target so far (5 codes, all expected M5).

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration. A
canonical-vocabulary commitment beyond what the operator-confirmed
C28-C apply produces. A re-inspection. An allowlist amendment. A
CLI surface change.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract + secondary_use_cd lane-pending flag |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice's CSV is fed into at C28-C |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary catalog |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — provides the inspection + allowlist entry C27/C28 reuse |
| `docs/sync/imprv-det-class-dictionary-loader-policy.md` (C23-A) | second dictionary-loader policy — generalized service |
| `docs/sync/land-soil-dictionary-loader-policy.md` (C24-A) | third dictionary-loader policy — RCW 84.34-sensitive |
| `docs/sync/imprv-det-meth-dictionary-loader-policy.md` (C25-A) | fourth dictionary-loader policy — precondition gate language |
| `docs/sync/imprv-det-sub-class-dictionary-loader-policy.md` (C26-A) | fifth dictionary-loader policy — special-character codes |
| `docs/sync/imprv-primary-use-dictionary-loader-policy.md` (C27-A) | sixth dictionary-loader policy — first dictionary-reuse slice |
| **`docs/sync/property-val-secondary-use-dictionary-loader-policy.md` (C28-A)** | **this doc — seventh dictionary-aware slice; second dictionary-reuse slice; first distinct-canonical-target-with-shared-dictionary** |
