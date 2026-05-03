# Block-C Contract — v1.11 (G2 ConversionEra Propagation to canonical_tf)

**Status:** binding doctrine. Version `v1.11`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.10.md` (v1.10, 2026-05-03).
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
docs/pacs/block-c-contract-v1.10.md          (v1.10 — G1 truth-layer ConversionEra)
docs/pacs/block-c-contract-v1.11.md          (v1.11 — G2 canonical-layer ConversionEra) ← this doc
```

## 0. What v1.11 is

A coordinated minor bump that records:

1. **G2** propagates the truth-layer `ConversionEra` (G1, v1.10)
   forward into the canonical layer. Every canonical entity that
   derives from a `truth_pacs.*` lane now carries a nullable
   `ConversionEra` column populated at projection time via the
   `ConversionEras.MajorityOfTruth` resolution rule.
2. The new `MajorityOfTruth(IEnumerable<string?>)` helper on
   `ConversionEras` is the single source of truth for canonical-era
   resolution. Today every truth → canonical projection is 1:1, so
   the helper reduces to verbatim copy; tomorrow's multi-source
   projections (e.g. ArcGIS geometry joined with PACS attributes
   on `tf_parcel`) call the same helper unchanged.
3. Subsequent slices (G3 `eraFilter` query parameter on read
   endpoints, G4 promotion gate for pre-conversion-row share)
   consume the canonical column. They are not in scope for v1.11.

The migration is purely additive (6 nullable column adds + 6
indexes). No v1.x-frozen shape is altered.

## 0.5 Doctrine integrity disclosure (carry-forward)

v1.10 §6 noted that "G2 will propagate the era forward, including
the majority-of-underlying-truth resolution rule that needs
`UNKNOWN` for ties." v1.11 ships exactly that. The vocabulary
(v1.10 §1) is unchanged: `PRE_CONVERSION_2017`, `POST_CONVERSION`,
`UNKNOWN`. `UNKNOWN` is now genuinely reachable from the canonical
layer, since multi-source canonical rows can have contributors
that disagree on era. Truth-layer rows still never emit `UNKNOWN`
(per the doctrine test
`Contract_v1_10_ConversionEras_TruthLayer_NeverEmitsUnknown`).

## 1. The resolution rule

```csharp
public static string MajorityOfTruth(IEnumerable<string?> contributors)
```

Behavior, frozen by doctrine tests in `BlockCContractV1Tests`
section "v1.11 addendum":

| Input | Output |
|---|---|
| empty sequence | `UNKNOWN` |
| all entries null | `UNKNOWN` |
| one non-null entry | that entry |
| multiple non-null, all agree | the agreed value |
| multiple non-null, disagree | `UNKNOWN` |
| nulls mixed with agreeing non-null | the agreed value (nulls skipped) |
| out-of-vocabulary tokens (e.g. `"BOGUS_ERA"`) | skipped as if null; if only such tokens, `UNKNOWN` |

The helper does **not** validate vocabulary at the boundary —
upstream code already guards via `ConversionEras.IsKnown`. Out-of-
vocab tokens are tolerated so a single bad row doesn't poison a
canonical projection; they are simply ignored when resolving the
era.

## 2. The schema shape

All six canonical lanes that derive from truth carry a single
nullable column with a single-column index on the era token. The
shape mirrors v1.10's truth-layer pattern.

| Entity | Migration column | Index |
|---|---|---|
| `TfSale` | `canonical_tf.tf_sale.ConversionEra` | `ix_tf_sale_conversion_era` |
| `TfOwner` | `canonical_tf.tf_owner.ConversionEra` | `ix_tf_owner_conversion_era` |
| `TfAssessmentWsdor` | `canonical_tf.tf_assessment_wsdor.ConversionEra` | `ix_tf_assessment_wsdor_conversion_era` |
| `TfImprovement` | `canonical_tf.tf_improvement.ConversionEra` | `ix_tf_improvement_conversion_era` |
| `TfImprovementFeature` | `canonical_tf.tf_improvement_feature.ConversionEra` | `ix_tf_improvement_feature_conversion_era` |
| `TfLand` | `canonical_tf.tf_land.ConversionEra` | `ix_tf_land_conversion_era` |

Column type: `character varying(20)`. Nullable for back-compat
with rows projected before G2; new projections always set it.

The indexes exist so G3's `eraFilter` query parameter (default
`POST_CONVERSION`) can resolve via index seek rather than scan.

Migration: `AddConversionEraToCanonicalTf`. Purely additive: 6
`AddColumn` + 6 `CreateIndex` on `Up`; exact reverse on `Down`.
The migration list addendum in `BlockCContractV1Tests` requires
this fragment.

## 3. The projector wiring

All five canonical projectors compute era via the helper at row-
construction time, immediately before `CreatedAt = now`:

```csharp
// inside each projector, per row
ConversionEra = ConversionEras.MajorityOfTruth(
    new[] { truth.ConversionEra }),
CreatedAt = now,
```

For `TfImprovementFeature` (sub-rows under a parent improvement),
the era is **inherited verbatim** from the parent
`TfImprovement.ConversionEra` — features never have their own
contributing-truth set; they ride on their parent's resolution:

```csharp
// inside the imprv projector, when emitting feature rows
ConversionEra = imprv.ConversionEra,
```

Touched files:

```text
backend/src/TerraFusion.Data/Services/CanonicalTf/
  PacsSaleCanonicalProjector.cs                (sale: 1 site)
  PacsOwnerCanonicalProjector.cs               (owner: 2 sites — confidential + non-confidential branches)
  PacsWsdorCanonicalProjector.cs               (wsdor: 1 site)
  PacsImprvCanonicalProjector.cs               (imprv: 3 sites — parent + detail-feature + attr-feature)
  PacsLandCanonicalProjector.cs                (land: 1 site)
```

Even though every projection is 1:1 today (so the helper reduces
to verbatim copy), going through the helper keeps the doctrine
contract uniform: any future N:1 projection adopts the same
resolution rule without re-touching every projector.

## 4. Tests

### Per-projector happy-path assertions

Each canonical projector's happy-path test now seeds its
`truth_pacs.*` row with a definite era (mirroring G1 promoter
behavior) and asserts the projected canonical row carries
`ConversionEra == ConversionEras.PostConversion` (year=2026 in
every happy path).

For `PacsImprvCanonicalProjectorTests.HappyPath_*`, both the
parent `TfImprovement` AND every child `TfImprovementFeature`
must carry the era — proves the inheritance contract.

### Doctrine integrity tests

New tests in `backend/tests/TerraFusion.Unit.Tests/Doctrine/BlockCContractV1Tests.cs`
section "v1.11 addendum":

- `Contract_v1_11_MajorityOfTruth_EmptyOrAllNull_ReturnsUnknown`
- `Contract_v1_11_MajorityOfTruth_SingleContributor_ReturnsThatEra`
- `Contract_v1_11_MajorityOfTruth_AllAgree_ReturnsAgreedEra`
- `Contract_v1_11_MajorityOfTruth_Disagree_ReturnsUnknown`
- `Contract_v1_11_MajorityOfTruth_NullsIgnored_AmongstAgreement`
- `Contract_v1_11_MajorityOfTruth_UnknownVocabTokens_AreIgnored`
- `Contract_v1_11_CanonicalTf_AllSixEntities_HaveConversionEraColumn`
  — reflective check via `_db.Model.FindEntityType(...)` that all
  six lanes carry the column, that it is nullable, and that
  `MaxLength == 20`.

Migration list (`Contract_RequiredMigrations_ArePresentInDataAssembly`)
adds `AddConversionEraToCanonicalTf` to the required-fragments
set.

## 5. What v1.11 does NOT change

- Read endpoints (sales-ratio-study, dashboards, parcel-owner,
  parcel-wsdor) are untouched. G3 will add the `eraFilter` query
  parameter (default `POST_CONVERSION`) once operators are ready
  to consume the canonical column.
- No promotion gate is added. G4 will introduce a
  pre-conversion-row-share gate that warns when an inbound batch
  exceeds a configurable threshold.
- Historical canonical rows projected before G2 remain `NULL`
  until a re-projection backfills them. Read endpoints continue
  to treat `NULL` as "fall back to the contributing year column"
  — the same rule v1.10 §0.5 set for truth rows.
- `tf_parcel`, `tf_parcel_owner_link`, `tf_parcel_geom`, and the
  attribute / dictionary tables are not in scope. They have no
  truth contributor with an era, or they're junction tables whose
  era is meaningless in isolation.
- All other v1.x-frozen shapes (sales codes, gates, dictionary
  tables, GIS scaffold, AttributeDefinition, QuarantineReasons,
  LandingQuarantineReasons, SourceFamilies) remain untouched.

## 6. Linked GitHub issues

- **G2** — closed by this slice (this doc).
- **G3 / G4** — pending follow-up slices. Tracked under the
  Block-G milestone in the design spine
  (`blocks-d-through-h-design.md` §G).
- **OPERATOR-SQL-IMPORT-1 (#726)** — unrelated to G2 but still
  blocking F1/F3/F4 per v1.9.
- **CI-HYGIENE-1 (#724)** — chronic main-state continues to
  require admin-merge through documented exception.
