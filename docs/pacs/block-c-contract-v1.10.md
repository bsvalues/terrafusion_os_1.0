# Block-C Contract — v1.10 (G1 ConversionEra Provenance)

**Status:** binding doctrine. Version `v1.10`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.9.md` (v1.9, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab)
docs/pacs/block-c-contract-v1.5.md           (v1.5 — attribute resolution semantics)
docs/pacs/block-c-contract-v1.6.md           (v1.6 — two-layer quarantine vocabulary)
docs/pacs/block-c-contract-v1.7.md           (v1.7 — E4c documented deferral; Block E close)
docs/pacs/block-c-contract-v1.8.md           (v1.8 — Block-D D1+D2+D3 + legacy retirement)
docs/pacs/block-c-contract-v1.9.md           (v1.9 — F5 sales-ratio-study read-model)
docs/pacs/block-c-contract-v1.10.md          (v1.10 — G1 ConversionEra provenance) ← this doc
```

## 0. What v1.10 is

A coordinated minor bump that records:

1. **G1** introduces a closed-vocabulary `ConversionEra` column on
   every `truth_pacs.*` lane. The column stamps each promoted row
   with the PACS data-conversion era it was captured under, so
   downstream consumers (canonical projections, ratio studies,
   read endpoints) can disambiguate pre-2017-conversion semantics
   from post-conversion semantics without re-deriving them at
   read time.
2. The `ConversionEras` static class is the single source of
   truth for the vocabulary, the cutover year, and the
   year → era resolution function.
3. Subsequent slices (G2 era propagation to `canonical_tf.*`, G3
   `eraFilter` query parameter on read endpoints, G4 promotion
   gate for pre-conversion-row share) build on this column. They
   are not in scope for v1.10.

No v1.x-frozen shape is altered destructively. The migration is
purely additive (5 nullable column adds + 5 indexes).

## 0.5 Doctrine integrity disclosure (carry-forward)

The PACS conversion caveat has been documented across multiple
predecessor specs (`docs/pacs/block-c-contract-v1.md` §1, the
`sales-ratio-queries.md` amendment, and
`blocks-d-through-h-design.md` §G) as a known-but-deferred
concern. Pre-G1 truth rows do not record which era they came
from — readers had to infer it from the `PropValYr` / `OwnerTaxYr`
column at query time. v1.10 closes that gap for all rows promoted
after the migration; existing rows remain `NULL` until a re-promote
backfills them.

This is not a v2 break: the column is nullable by design, and
read endpoints treat `NULL` as "era unknown — fall back to the
year column". G2 will propagate the column forward; G4 will
introduce a promotion gate that warns when pre-conversion share
exceeds an operator-set threshold.

## 1. The vocabulary

`backend/src/TerraFusion.Core/Entities/TruthPacs/ConversionEras.cs`

```csharp
public const string PreConversion2017 = "PRE_CONVERSION_2017";
public const string PostConversion    = "POST_CONVERSION";
public const string Unknown           = "UNKNOWN";

public const short  CutoverYear = 2018;
```

| Era | Meaning | Where it appears |
|---|---|---|
| `PRE_CONVERSION_2017` | Row captured under the pre-2017 PACS vocabulary. Coded fields (sales codes, improvement attributes, assessment vocabulary) may not have post-conversion semantics. | Truth + canonical |
| `POST_CONVERSION` | Row captured under the current vocabulary. Default era for read endpoints (G3). | Truth + canonical |
| `UNKNOWN` | Era could not be determined. Reserved for canonical-layer rows whose contributing truth rows disagree on era. | Canonical only |

`ConversionEras.All` is a frozen `IReadOnlySet<string>` over those
three values. `ConversionEras.IsKnown(value)` is the boundary
guard for any code that writes to a `ConversionEra` column.
Adding a new era is intentionally a code change — there is no
runtime extensibility hook.

## 2. The truth-layer resolution rule

```csharp
public static string FromYear(short year) =>
    year < CutoverYear ? PreConversion2017 : PostConversion;
```

Rules:

- Truth rows always have a year column (`PropValYr` for sales /
  improvements / land / WSDOR; `OwnerTaxYr` for owners). That
  column is the input.
- `FromYear` MUST never return `UNKNOWN`. Truth rows always
  resolve to a definite era. The doctrine test
  `Contract_v1_10_ConversionEras_TruthLayer_NeverEmitsUnknown`
  enforces this across years 1900..2100.
- The cutover boundary is **strict**: year `< 2018` is pre, year
  `>= 2018` is post. The exact 2018 boundary is operationally
  arbitrary but matches Benton's documented data-conversion
  cutover and is now frozen.

## 3. The schema shape

All five truth_pacs lanes carry a single nullable column with a
single-column index on the era token. The shape is identical
across lanes; only the index name varies.

| Entity | Migration column | Index |
|---|---|---|
| `TruthPacsSale` | `truth_pacs.sale.ConversionEra` | `ix_truth_pacs_sale_conversion_era` |
| `TruthPacsOwnerCurrent` | `truth_pacs.owner_current.ConversionEra` | `ix_truth_pacs_owner_conversion_era` |
| `TruthPacsWashPropOwnerVal` | `truth_pacs.wash_prop_owner_val.ConversionEra` | `ix_truth_pacs_wpov_conversion_era` |
| `TruthPacsImprvCurrent` | `truth_pacs.imprv_current.ConversionEra` | `ix_truth_pacs_imprv_conversion_era` |
| `TruthPacsLandCurrent` | `truth_pacs.land_current.ConversionEra` | `ix_truth_pacs_land_conversion_era` |

Column type: `character varying(20)` (longest vocabulary token
is 19 chars; +1 char of headroom). Nullable for back-compat with
rows promoted before G1; new promotions always set it.

The indexes exist so G3's `eraFilter` query parameter (default
`POST_CONVERSION`) can resolve via index seek rather than scan.

Migration: `AddConversionEraToTruthPacs` (Block-C migration list
addendum). Purely additive: 5 `AddColumn` + 5 `CreateIndex` on
`Up`; exact reverse on `Down`.

## 4. The promoter wiring

All five truth promoters now stamp the era at row-construction
time, immediately before `PromotedAt = now`:

```csharp
// inside each promoter, per row
ConversionEra = ConversionEras.FromYear(row.PropValYr),  // or .OwnerTaxYr
PromotedAt    = now,
```

Touched files:

```text
backend/src/TerraFusion.Data/Services/TruthPacs/
  PacsSaleTruthPromoter.cs                (sale.PropValYr)
  PacsOwnerCurrentTruthPromoter.cs        (owner.OwnerTaxYr)
  PacsWashPropOwnerValTruthPromoter.cs    (wpov.PropValYr)
  PacsImprvCurrentTruthPromoter.cs        (imprv.PropValYr)
  PacsLandCurrentTruthPromoter.cs         (land.PropValYr)
```

Each promoter's happy-path test now asserts the era is set on
every promoted row. The seeded year in every happy-path test
is 2026, so the assertion is
`t.ConversionEra == ConversionEras.PostConversion`.

## 5. Doctrine integrity tests

New tests in `backend/tests/TerraFusion.Unit.Tests/Doctrine/BlockCContractV1Tests.cs`:

- `Contract_v1_10_ConversionEras_AllContainsFrozenSet` — the
  three-value set is frozen.
- `Contract_v1_10_ConversionEras_IsKnown_RejectsUnknown` —
  guard rejects out-of-vocabulary tokens including the empty
  string.
- `Contract_v1_10_ConversionEras_CutoverYearIs2018` — the
  numeric boundary is frozen.
- `Contract_v1_10_ConversionEras_FromYear_RespectsCutover`
  (theory, 6 cases) — boundary cases at 2017 / 2018 plus
  representative pre/post years resolve correctly.
- `Contract_v1_10_ConversionEras_TruthLayer_NeverEmitsUnknown` —
  truth-layer entry point never returns `UNKNOWN` across
  1900..2100.
- `Contract_v1_10_TruthPacs_AllFiveEntities_HaveConversionEraColumn` —
  reflective check via `_db.Model.FindEntityType(...)` that all
  five lanes carry the column, that it is nullable, and that
  `MaxLength == 20`.

Migration list (`Contract_RequiredMigrations_ArePresentInDataAssembly`)
adds `AddConversionEraToTruthPacs` to the required-fragments
set.

## 6. What v1.10 does NOT change

- Canonical layer (`canonical_tf.*`) is untouched. G2 will
  propagate the era forward, including the
  majority-of-underlying-truth resolution rule that needs
  `UNKNOWN` for ties.
- Read endpoints (sales-ratio-study, dashboards) are untouched.
  G3 will add the `eraFilter` query parameter (default
  `POST_CONVERSION`) once G2 has populated the canonical column.
- No promotion gate is added in G1. G4 will introduce a
  pre-conversion-row-share gate that warns when an inbound batch
  exceeds a configurable threshold.
- All other v1.x-frozen shapes (sales codes, gates, dictionary
  tables, GIS scaffold, AttributeDefinition, QuarantineReasons,
  LandingQuarantineReasons, SourceFamilies) remain untouched.

## 7. Linked GitHub issues

- **G1** — closed by this slice (this doc).
- **G2 / G3 / G4** — pending follow-up slices. Tracked under
  the Block-G milestone in the design spine
  (`blocks-d-through-h-design.md` §G).
- **OPERATOR-SQL-IMPORT-1 (#726)** — unrelated to G1 but still
  blocking F1/F3/F4 per v1.9.
- **CI-HYGIENE-1 (#724)** — chronic main-state continues to
  require admin-merge through documented exception.
