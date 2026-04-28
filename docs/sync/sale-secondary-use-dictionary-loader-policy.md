# `sale.secondary_use_cd` Dictionary Loader Policy

**Slice:** C31-A (docs-only — defines the contract for a future
C31-B implementation: read-only loader that proposes a review
CSV by joining the workbook's `sale.secondary_use_cd`
code-values against PACS's existing `dbo.property_use`
dictionary. C31-C will apply the operator-approved CSV via the
existing C11-B batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for the
sales-lane "secondary use" axis. The **fifth and final
canonical-PUC dictionary-reuse slice** in the C-series.
**Status:** policy locked; precondition P2 deferred to C31-B;
NO live inspection (already complete at C22-B-live);
implementation deferred to C31-B; **C31-B will produce a
zero-row proposal under current Benton workbook state** — see
"Zero-observation finding" below.

## Zero-observation finding (NEW for C31-A)

Pre-policy audit on workbook
`a767c8a2-5b8a-4846-af8b-c3496601e924` reveals:

```
SELECT c."Id", c."SourceTable", c."SourceColumn", c."MappingLane", c."ReviewStatus"
  FROM "SyncMappingColumns" c
  WHERE c."WorkbookId" = 'a767c8a2-...'
    AND c."SourceTable" = 'sale' AND c."SourceColumn" = 'secondary_use_cd';
-- → 1 row: id=03989823-89a1-4731-9f9d-35a7cbfd4fe2, MappingLane=Other,
--          ReviewStatus=NeedsReview, CanonicalTarget=null

SELECT v."SourceValue", v."ReviewStatus"
  FROM "SyncMappingCodeValues" v
  JOIN "SyncMappingColumns" c ON c."Id" = v."MappingColumnId"
  WHERE c."WorkbookId" = 'a767c8a2-...'
    AND c."SourceTable" = 'sale' AND c."SourceColumn" = 'secondary_use_cd';
-- → 0 rows  (no observed code-values)
```

**The column row exists in the workbook but has zero observed
code-values.** This is structurally distinct from C27-A's
`imprv_det_type_cd` blocker (where the column row itself was
absent and a profile extension was required). For C31-A:

- The column WAS profiled — `imprv_detail.imprv_detail` /
  `sale` workbook scope DID include `secondary_use_cd`.
- Zero rows came back from the live PACS data because no Benton
  sale record currently carries a value for
  `sale.secondary_use_cd`.

This is a **legitimate target with a no-op outcome under
current data**. C31-B's loader will produce a zero-row proposal
because the loader filters by `ReviewStatus = "Deferred"` and
zero code-values exist to be Deferred. The precondition gate
fires correctly: `Workbook Deferred rows scanned: 0`.

## Decision: land the policy anyway

C31-A lands as a docs-only slice for three reasons:

1. **Architectural completeness.** This is the fifth and final
   workbook column in the canonical-PUC vocabulary family. The
   `dbo.property_use` dictionary will then have served all six
   workbook columns that share its vocabulary (4 already done
   at C22/C27/C28/C29/C30 + this one). Documenting the policy
   completes the dictionary-reuse atlas.

2. **Future Benton sale records may populate this column.**
   When/if a future sale carries a `secondary_use_cd` value,
   the workbook profile will pick it up at the next profile
   pass. C31-B's loader will then propose mappings without
   needing a new policy slice — the policy is already documented.

3. **Cross-county portability.** Other Washington counties may
   carry `sale.secondary_use_cd` values from day one. This
   policy documents the contract for those deployments, even
   though Benton's current data does not exercise it.

C31-B (the loader-implementation slice) is **deferred until
either**:

- The workbook is re-profiled and code-values appear, OR
- A future county deployment exercises the column, OR
- The operator explicitly requests a zero-row C31-B run as a
  proof of policy completeness (1-config-branch + 5-test slice;
  smallest possible C-series implementation).

## Architectural significance

After C30-C, `dbo.property_use` serves 5 workbook columns:

```
canonical_target=PropertyUse           (3 columns)
  property_val.property_use_cd  (C22-C)  ← 62 mapped
  imprv.primary_use_cd          (C27-C)  ← 44 mapped
  sale.primary_use_cd           (C30-C)  ← 43 mapped

canonical_target=PropertySecondaryUse  (2 columns)
  property_val.secondary_use_cd (C28-C)  ← 5 mapped
  imprv.secondary_use_cd        (C29-C)  ← 1 mapped
```

C31 introduces the **6th** column on this dictionary, completing
the canonical-PUC family in the workbook:

```
canonical_target=PropertySecondaryUse  (3 columns after C31-C)
  property_val.secondary_use_cd (C28-C)  ← 5 mapped
  imprv.secondary_use_cd        (C29-C)  ← 1 mapped
  sale.secondary_use_cd         (C31-C)  ← 0 mapped  (zero-observation)
```

This proves the canonical_target=`PropertySecondaryUse`
vocabulary scales from N=2 to N=3 columns. Combined with the
canonical_target=`PropertyUse` family (3 columns), the
dictionary-reuse architecture is fully exercised at this point.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**.
- **C13-A — Sales-lane review policy** + 2017 amendment.
  Same parent contract as C30-A.
- **C21-A — PACS canonical dictionaries reference**.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**
  (inspected `dbo.property_use` once at C22-B-live).
- **C27-A → C30-C — dictionary-reuse template**. Five
  applications proven across `imprv.primary_use_cd`,
  `property_val.secondary_use_cd`, `imprv.secondary_use_cd`,
  `sale.primary_use_cd`. C31-A is the **sixth and final**
  canonical-PUC reuse slice.
- **C30-A → C30-C — sales-side dictionary-reuse**. Established
  the "no sale-context inference" guard that this slice
  inherits verbatim.

## Active Target

```
Workbook column row id  : 03989823-89a1-4731-9f9d-35a7cbfd4fe2
SourceTable             : sale
SourceColumn            : secondary_use_cd
MappingLane             : Other  (lane-mismatched per C17-A3 family;
                                   workbook hygiene, NOT a loader precondition)
ReviewStatus            : NeedsReview
CanonicalTarget         : (null)
Code-values observed    : 0  ← zero-observation finding
```

## Out of scope (this slice)

- All other dictionary-reuse columns — covered by C22 / C27 /
  C28 / C29 / C30.
- `dbo.imprv_detail.imprv_det_type_cd` — still parked at
  C27-Pre (workbook profile extension required).
- Marshall & Swift cost-schedule references — disabled per D0-D.
- Workbook re-profile to populate `sale.secondary_use_cd`
  values — separate slice if/when needed.

## Architectural note: terminal-count vs canonical-quality

Per the rest of the C-series. C31-C, when run, would upgrade
0 rows under current data (zero-observation outcome).

## Preconditions for C31-B

### P1 — Lane reclassification (DEFERRED, per C25-B finding)

`MappingLane=Other`. Loader joins by `SourceColumn`, not lane.
P1 stays parked.

### P2 — Defer-by-default sweep (NOT APPLICABLE under zero-observation)

There are zero NeedsReview code-values to sweep. P2 is a no-op
in the current state. If/when the workbook is re-profiled and
code-values appear, P2 will become applicable per the standard
C-series pattern.

### Precondition gate

C31-B's loader run produces `Workbook Deferred rows scanned: 0`
under zero-observation. This is the documented expected
behavior; no operator alarm is warranted.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.property_use` |
| Dictionary inspection | **already complete at C22-B-live** — no re-inspection |
| Workbook source column | `dbo.sale.secondary_use_cd` |
| Workbook column scope | Currently `Other` lane (P1 deferred); column row currently `NeedsReview` |
| Workbook code-value scope | **0 rows** (zero-observation under current data) |
| Canonical target | `PropertySecondaryUse` (REUSED from C28-C and C29-C) |
| Slice artifact dir | `c31-b` |
| Program.cs config-switch key | `property_use:sale.secondary_use_cd` |

## Hard Guards

All five guards from C22-A through C30-A port verbatim. Notable
inheritances:

- **C30-A's "no sale-context inference"** guard — applies here
  because this is a sale-lane column. The loader does NOT read
  sibling sale.* fields (sl_dt, sl_price, sl_class_cd,
  sl_type_cd, etc.) when deriving canonical_value.
- **C27-A's "no cross-column auto-fill"** guard — applies here
  with extra weight: at the time C31-B runs, five other
  workbook columns already carry canonical_target=PropertyUse
  or canonical_target=PropertySecondaryUse mappings. The loader
  must NOT auto-fill from any of them.

## Mismatch Rules

When C31-B runs, the same five mismatch shapes from C22-A
apply. Under zero-observation, ALL counts are 0:

```
M1 workbook code missing from dictionary  : 0
M2 dictionary code unobserved in workbook : 85  (entire dictionary unobserved
                                                  from this column's perspective;
                                                  per-column scope per C27-B)
M3 duplicate dictionary code              : 0
M4 inactive dictionary row                : 0
M5 clean match (proposed Mapped)          : 0
CSV row count                             : 0
```

This is the documented expected-behavior under zero-observation.

## Review CSV Output Shape

```text
backend/artifacts/sync-atlas/c31-b/<run-id>/sale_secondary_use-proposed-review.csv
backend/artifacts/sync-atlas/c31-b/<run-id>/sale_secondary_use-mismatch-report.md
backend/artifacts/sync-atlas/c31-b/<run-id>/loader-run.txt
```

Under zero-observation, the proposed-review CSV will contain
only the header row (no data rows). The mismatch-report.md will
document M1=0, M2=85, M3=0, M4=0, M5=0, CSV row count=0.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| Auto-promote workbook rows to Mapped | Dictionary is evidence, not authority. |
| Auto-fill canonical_values from C22-C / C27-C / C28-C / C29-C / C30-C | Per C27-A's "no cross-column auto-fill" guard. |
| Read sale-context fields | Per C30-A's "no sale-context inference" guard. |
| Run C31-B's loader despite zero-observation | Zero-observation is fine — the loader produces a zero-row CSV; this is documented expected behavior. |
| Re-profile the workbook to populate sale.secondary_use_cd | Out of scope; separate slice if/when needed. |
| Re-inspect `dbo.property_use` | Already inspected at C22-B-live. |
| Add to allowlist | Already there. |
| Add new CLI flag | `--workbook-source-column` from C27-B reused. |
| Pull Marshall & Swift | Disabled per D0-D. |
| Mutate PACS rows | Read-only by policy. |
| Modify C13-A sales-lane policy | C31 extends C13-A by adding a dictionary-loader path. |
| Cross-county vocabulary import | Per-PACS-instance variation. |

## Success Gates for C31-B (when run)

| Gate | Pass criterion |
|---|---|
| **No new live-inspection** | C31-B does NOT re-query `dbo.property_use`. |
| **No allowlist change** | `IsAllowedPacsDictionaryTable` unchanged. |
| **No new CLI flag** | `--workbook-source-column` reused. |
| **No new service class** | Tenth use of C23-B's generalized service. |
| **Loader runs read-only** | Zero workbook + PACS mutations. |
| **Zero-observation diagnostic** | Loader output explicitly logs `Workbook Deferred rows scanned: 0` and the zero-row CSV path. |
| **No `Mapped` rows** | Under zero-observation, the CSV contains only the header; no data rows. |
| **No cross-column auto-fill** | (Test pin retained even though no rows are produced — guards future workbook states where sale.secondary_use_cd may carry values.) |
| **All prior C-series anchors preserved** | Every prior dictionary-aware Mapped row byte-for-byte unchanged. |
| **canonical_target REUSE pinned** | Test pin: `Target.CanonicalTargetName == "PropertySecondaryUse"` (REUSED from C28-C / C29-C). |
| **No sale-context inference** | Test pin retained even with zero data rows. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C31-C (when applicable)

C31-C is **structurally vacuous under zero-observation**: there
are no Deferred rows to apply. C31-C may run as a no-op proof
(0 rows applied, audit stamp bump 0, no mutations) OR may be
deferred indefinitely until workbook re-profile produces
code-values.

If/when applicable:

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C31-C apply does not lock. |
| **Mutation count = code-values present** | Whatever count Workbook contains at apply time. |
| **All other lanes preserved** | All anchor lanes byte-for-byte unchanged. |
| **canonical_target = PropertySecondaryUse** | Reused from C28-C / C29-C. |

## Recommended pacing

- **C31-B (deferred)** — only run if/when the workbook has
  observed `sale.secondary_use_cd` code-values, OR as a
  no-op proof slice. ~5 unit tests against InMemory + stub
  reader. **No new service class. No new live-inspection.
  No allowlist change. No new CLI flag.**
- **C31-C (deferred)** — only meaningful if C31-B produces a
  non-empty CSV.

## What This Enables (non-binding)

- **C31-B (deferred)** — the actual loader run, if/when
  applicable.
- **C31-C (deferred)** — operator-driven CSV review and apply,
  if/when applicable.
- **Cross-county deployments** — counties whose sale records
  carry `secondary_use_cd` values will exercise this policy on
  day one, even though Benton's current data does not.
- **Future workbook re-profile** — if Benton's sale data
  changes and `secondary_use_cd` starts carrying values, the
  policy is already documented; only C31-B + C31-C remain.

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Promote any code-value (there are none to promote).
- Build or change any code (deferred to C31-B if/when run).
- Touch the running PACS sync service install.
- Mandate cross-column canonical-value alignment.
- Read sale-context fields.
- Modify C13-A's sales-lane review contract.
- Re-inspect `dbo.property_use`.
- Add to the allowlist.
- Add any new CLI flag.
- Re-profile the workbook to populate `sale.secondary_use_cd`
  values.

## What This Slice Is

The tenth dictionary-aware policy in TerraFusion. The **fifth
and final canonical-PUC dictionary-reuse slice**. Documents
the policy contract for `sale.secondary_use_cd` even though
the current Benton workbook has zero observed code-values for
this column. Completes the canonical-PUC dictionary-reuse atlas
across all six workbook columns that share the
`dbo.property_use` vocabulary.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration.
A new architectural property beyond what C22 → C30 already
proved. A re-inspection. An allowlist amendment. A CLI surface
change. A C13-A amendment. A workbook re-profile. A blocker
on the C-series — C31-B/C31-C are docked at "zero-observation,
non-blocking" rather than "broken."

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract — **this slice's parent** |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — provides the inspection + allowlist entry C27-C31 reuse |
| `docs/sync/imprv-primary-use-dictionary-loader-policy.md` (C27-A) | first dictionary-reuse slice |
| `docs/sync/property-val-secondary-use-dictionary-loader-policy.md` (C28-A) | introduced canonical_target=PropertySecondaryUse |
| `docs/sync/imprv-secondary-use-dictionary-loader-policy.md` (C29-A) | second instance of canonical_target=PropertySecondaryUse |
| `docs/sync/sale-primary-use-dictionary-loader-policy.md` (C30-A) | first sales-side dictionary-reuse; introduced "no sale-context inference" guard |
| **`docs/sync/sale-secondary-use-dictionary-loader-policy.md` (C31-A)** | **this doc — sixth (and final canonical-PUC) dictionary-reuse policy; THIRD column on canonical_target=PropertySecondaryUse; first zero-observation slice in the C-series** |
