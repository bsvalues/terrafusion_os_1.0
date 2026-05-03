# `imprv.secondary_use_cd` Dictionary Loader Policy

**Slice:** C29-A (docs-only — defines the contract for C29-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 1 `imprv.secondary_use_cd` code-value
against PACS's existing `dbo.property_use` dictionary. C29-C
will apply the operator-approved CSV via the existing C11-B
batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for the
improvement-level "secondary use" axis. The **third
dictionary-reuse slice** in the C-series and the **first to
fully reuse a canonical_target vocabulary AND a dictionary**
(both `dbo.property_use` and `PropertySecondaryUse` already
proven at C28).
**Status:** policy locked; precondition P2 deferred to C29-B;
NO live inspection; implementation deferred to C29-B; CSV
apply deferred to C29-C.

## Smallest C-series target yet

```
Workbook column row id  : 3274f012-c47b-4439-8c58-488f8ec74903
MappingLane             : Other
ReviewStatus            : NeedsReview
CanonicalTarget         : (null)
Code-values             : 18  (1 row — the SINGLE smallest C-series target)
```

The single code `18` is in DOR PUC vocabulary and is already
known to be in `dbo.property_use` (C22-B-live captured the
dictionary; code `18` was mapped at C22-C as
`"18 Mobile Home"` and at C27-C as `"18 Mobile Home"` per the
property_use dictionary's description column).

## Architectural significance

C28-A introduced the architectural property that two workbook
columns sharing one PACS dictionary can carry DIFFERENT
canonical_target vocabularies (C22's `PropertyUse` vs C28's
`PropertySecondaryUse`). C29-A introduces the next architectural
property: **two workbook columns sharing one PACS dictionary AND
one canonical_target vocabulary.** Specifically:

```
property_val.secondary_use_cd  (C28-C)  → canonical_target = PropertySecondaryUse
imprv.secondary_use_cd         (C29-C)  → canonical_target = PropertySecondaryUse  ← same!
```

This mirrors how:
```
property_val.property_use_cd  (C22-C)  → canonical_target = PropertyUse
imprv.primary_use_cd          (C27-C)  → canonical_target = PropertyUse  ← same!
```

So after C29-C, the workbook will have:
- 2 columns carrying `canonical_target=PropertyUse`
- 2 columns carrying `canonical_target=PropertySecondaryUse`
- 4 distinct other vocabularies (one per non-property_use dictionary)

This proves the canonical_target dimension and the
workbook-source-column dimension are independent: any
combination is valid as long as the operator confirms the
semantic alignment at apply time.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**.
- **C17-A → C17-D — Improvement-lane review** + C17-A3 amendment
  flagging the `secondary_use_cd` family as Tier 1 / lane-pending.
- **C21-A — PACS canonical dictionaries reference**.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**
  (inspected `dbo.property_use` once at C22-B-live).
- **C23-A → C26-C — dictionary-loader generalization** (4 more
  dictionaries; service unchanged).
- **C27-A → C27-C — first dictionary-reuse slice**
  (`imprv.primary_use_cd`; reused dictionary, reused canonical_target).
- **C28-A → C28-C — second dictionary-reuse slice; first
  distinct-canonical-target-with-shared-dictionary**
  (`property_val.secondary_use_cd`; new canonical_target
  `PropertySecondaryUse`).
- **C29 (this slice)** — third dictionary-reuse slice; first
  shared-dictionary-AND-shared-canonical_target slice
  (proves canonical_target reuse mirrors what was already
  proven for primary-use at C22 + C27).

## Active Target

`dbo.imprv.secondary_use_cd` is present in the workbook with
**1 NeedsReview code-value** (`18`) in the Other lane.

## Out of scope (this slice)

- `dbo.property_val.secondary_use_cd` — covered by C28-C
  (canonical_target=`PropertySecondaryUse`).
- `dbo.sale.secondary_use_cd` — separate workbook column;
  future dictionary-reuse slice.
- `dbo.sale.primary_use_cd` — separate workbook column
  (43 NeedsReview); future dictionary-reuse slice
  (canonical_target likely `PropertyUse`).
- `dbo.imprv_detail.imprv_det_type_cd` — still parked
  (workbook profile extension required, C27-Pre).

## Architectural note: terminal-count vs canonical-quality

Per the rest of the C-series. C29-C upgrades 1 row from
status-terminal-only (post-P2) to status-and-canonical-terminal.

## Preconditions for C29-B

### P1 — Lane reclassification (DEFERRED, per C25-B finding)

Column lives in `Other` lane. Loader joins by `SourceColumn`,
not lane. P1 stays parked.

### P2 — Defer-by-default sweep (REQUIRED)

The single `NeedsReview` code-value (`18`) must transition to
`Deferred` before the loader proposes anything. **Smallest
possible P2 sweep**: 1-row CSV, 1 row mutated, audit stamp bump 1.

### Precondition gate

C29-B's loader run shall produce a `Workbook Deferred rows
scanned: 0` summary if P2 is not met.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.property_use` |
| Dictionary inspection | **already complete at C22-B-live** — no re-inspection |
| Workbook source column | `dbo.imprv.secondary_use_cd` |
| Workbook column scope | Currently `Other` lane (P1 deferred); column row currently `NeedsReview` |
| Workbook code-value scope | 1 row: `18` |
| Canonical target | `PropertySecondaryUse` (REUSED from C28-C) |
| Slice artifact dir | `c29-b` |
| Program.cs config-switch key | `property_use:imprv.secondary_use_cd` |

## Hard Guards

All five guards from C22-A through C28-A port verbatim. No new
guard introduced — C29 is purely a second instance of the
dictionary-reuse + shared-canonical-target pattern proven by
C28.

## Mismatch Rules

Same M1-M5 as the rest of the C-series. Expected outcome at
C29-B-live: 1/1 M5 (clean match for code `18`), 84 M2 (85 dict
− 1 workbook).

## Review CSV Output Shape

```text
backend/artifacts/sync-atlas/c29-b/<run-id>/imprv_secondary_use-proposed-review.csv
backend/artifacts/sync-atlas/c29-b/<run-id>/imprv_secondary_use-mismatch-report.md
backend/artifacts/sync-atlas/c29-b/<run-id>/loader-run.txt
```

No `dictionary-inspection.txt` (third no-inspection slice
after C27-B and C28-B).

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| Auto-promote workbook rows to Mapped | Dictionary is evidence, not authority. |
| Auto-fill canonical_values from C22-C/C27-C/C28-C | Per C27-A "no cross-column auto-fill" guard. |
| Run P2 sweep as a loader side-effect | P2 is operator-driven C11-B. |
| Apply dictionary to other secondary_use_cd columns in this slice | `sale.secondary_use_cd` is a separate slice. |
| Re-inspect `dbo.property_use` | Already inspected at C22-B-live. |
| Add to allowlist | Already there. |
| Add new CLI flag | `--workbook-source-column` from C27-B reused. |
| Pull Marshall & Swift | Disabled per D0-D. |
| Mutate PACS rows | Read-only by policy. |
| Skip P2 | Loader produces 0 rows until code-value is `Deferred`. |
| Require P1 (lane reclassification) | Workbook hygiene only, per C25-B. |
| Cross-county vocabulary import | Per-PACS-instance variation. |

## Success Gates for C29-B

| Gate | Pass criterion |
|---|---|
| **No new live-inspection** | C29-B does NOT re-query `dbo.property_use`. |
| **No allowlist change** | `IsAllowedPacsDictionaryTable` unchanged. |
| **No new CLI flag** | `--workbook-source-column` (C27-B) reused. |
| **P2 documented** | `workbook-pre-state.txt` confirms code-value is `Deferred`. |
| **Loader runs read-only** | Zero workbook + PACS mutations. |
| **1 row classified** | M1+M3+M4+M5 sum = 1. |
| **No `Mapped` without dictionary match** | Every Mapped row has an active, unambiguous dictionary row. |
| **No cross-column auto-fill** | Loader proposes the dictionary description, NOT C22-C / C27-C / C28-C's prior canonical_values for the same code. |
| **Canonical_target REUSED** | Test pin: `Target.CanonicalTargetName == "PropertySecondaryUse"` (same as C28-C; demonstrates that REUSE of canonical_target across columns is supported). |
| **All prior C-series anchors preserved** | Every prior dictionary-aware Mapped row byte-for-byte unchanged. |
| **No new service class** | Seventh use of C23-B's generalized `DictionaryLoaderService`. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C29-C

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C29-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly 1 row mutated. |
| **All other lanes preserved** | All anchor lanes byte-for-byte unchanged. |
| **secondary_use_cd column-row preserved** | Column row stays at its post-P2 status. |
| **canonical_target = PropertySecondaryUse** | Same vocabulary as C28-C. |

## Recommended pacing

- **C29-B** — P2 sweep (1-row CSV) + Program.cs config branch +
  `ImprvSecondaryUseDictionaryLoaderTests` + read-only proposal
  generation. Tinier than C28-B. **No new service class. No new
  live-inspection. No allowlist change. No new CLI flag.**
- **C29-C** — operator review + apply. Smallest possible
  C-series apply: 1 row.

## What This Enables (non-binding)

- **C29-B** — the actual loader run. ~5-7 unit tests against
  InMemory + stub reader (smaller than C28-B since the
  architectural novelty is just "REUSE canonical_target",
  already half-proven by C22+C27).
- **C29-C** — operator-driven CSV review and apply.
- **Future dictionary-reuse slices** (same pattern; canonical
  set on C-series at this point):
  - `sale.primary_use_cd` (43 NeedsReview; canonical_target=`PropertyUse`)
  - `sale.secondary_use_cd` (?? NeedsReview; canonical_target=`PropertySecondaryUse`)
- **C27-Pre (still parked)** — workbook profile extension to
  add `imprv_detail.imprv_det_type_cd`.

## What This Slice Is

The eighth dictionary-aware policy in TerraFusion. The **third
dictionary-reuse slice**. Proves shared dictionary + shared
canonical_target across two workbook columns (mirroring the
C22+C27 pattern for `PropertyUse` but on the
`PropertySecondaryUse` axis). Smallest possible C-series target:
1 code.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration.
A new architectural property beyond C28's already-proven
canonical_target dimension. A re-inspection. An allowlist
amendment. A CLI surface change.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — provides the inspection + allowlist entry C27/C28/C29 reuse |
| `docs/sync/imprv-primary-use-dictionary-loader-policy.md` (C27-A) | first dictionary-reuse slice; PropertyUse vocabulary REUSE |
| `docs/sync/property-val-secondary-use-dictionary-loader-policy.md` (C28-A) | second dictionary-reuse slice; introduced PropertySecondaryUse canonical_target |
| **`docs/sync/imprv-secondary-use-dictionary-loader-policy.md` (C29-A)** | **this doc — third dictionary-reuse slice; first shared-dictionary-AND-shared-canonical_target slice (PropertySecondaryUse REUSE from C28-C)** |
