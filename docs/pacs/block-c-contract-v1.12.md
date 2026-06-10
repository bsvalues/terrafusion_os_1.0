# Block-C Contract — v1.12 (G3 eraFilter on SalesRatioStudy Read Endpoints)

**Status:** binding doctrine. Version `v1.12`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.11.md` (v1.11, 2026-05-03).
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
docs/pacs/block-c-contract-v1.11.md          (v1.11 — G2 canonical-layer ConversionEra)
docs/pacs/block-c-contract-v1.12.md          (v1.12 — G3 eraFilter on read endpoints) ← this doc
```

## 0. What v1.12 is

A coordinated minor bump that records:

1. **G3** consumes the canonical-layer `ConversionEra` (G2, v1.11) on
   the SalesRatioStudy read endpoints. A new `era` query parameter
   filters the three F5 surfaces (Q1 valid count, Q2 by-year, Q3
   aggregate price) by conversion era.
2. The `era` parameter defaults to `POST_CONVERSION` per v1.10 §3,
   so existing operator dashboards see no behavioral change. The
   filter is additive — pre-G3 callers still get the same data.
3. The new `ISalesRatioStudyReader.EraAll` constant ("ALL") is the
   doctrine-frozen token for "bypass the era filter entirely."
4. Subsequent slices (G4 promotion gate for pre-conversion-row
   share, future G* expansion to Parcel-Owner / Parcel-Wsdor /
   TfSales endpoints) consume the same vocabulary. They are not
   in scope for v1.12.

No schema change. No migration. v1.12 is read-model + doctrine
only, mirroring v1.9's surface-only pattern.

## 0.5 Doctrine integrity disclosure (carry-forward)

v1.10 §0.5 promised: "read endpoints treat `NULL` as 'era unknown
— fall back to the year column'." v1.12 implements exactly that
fallback for the SalesRatioStudy reader. Other read endpoints
(`/api/sales`, `/api/parcels/{id}/owners`, `/api/parcels/{id}/wsdor`)
do **not** yet take an `era` parameter — those are deferred to a
future slice. Until they get one, those endpoints continue to
return rows regardless of era (status quo from before G1).

## 1. The query-parameter shape

```text
GET /api/counties/{countyId}/sales-ratio-study/valid-sale-count
    ?from=YYYY-MM-DD            (optional; default 2018-01-01 UTC)
    &era=POST_CONVERSION        (optional; default POST_CONVERSION)
GET /api/counties/{countyId}/sales-ratio-study/by-year
    ?from=...&era=...
GET /api/counties/{countyId}/sales-ratio-study/price-aggregate
    ?from=...&era=...
```

Recognized `era` values:

| Token | Behavior |
|---|---|
| (omitted) | Resolves to `POST_CONVERSION` — the default per v1.10 §3 |
| `POST_CONVERSION` | Match `ConversionEra = 'POST_CONVERSION'` OR (`ConversionEra IS NULL` AND `SlDt >= 2018-01-01`) |
| `PRE_CONVERSION_2017` | Match `ConversionEra = 'PRE_CONVERSION_2017'` OR (`ConversionEra IS NULL` AND `SlDt < 2018-01-01`) |
| `UNKNOWN` | Match `ConversionEra = 'UNKNOWN'` exactly. Does NOT fall back to year — by doctrine v1.10 §2 the truth-layer never emits UNKNOWN, so a NULL row is unambiguously "not yet stamped," not "could not be determined." |
| `ALL` | Bypass the era filter. Returns every row regardless of era (including NULL). The constant lives on `ISalesRatioStudyReader.EraAll`. |
| anything else | 400 Bad Request with `validValues` listing the four accepted tokens |

The token comparison is **case-sensitive and trim-tolerant**:
leading/trailing whitespace is stripped before validation, but
casing must match exactly. This matches the closed-vocabulary
semantics of v1.10 §1.

## 2. The resolution rule

```csharp
// In SalesRatioStudyReader (Data layer).
private static Expression<Func<TfSale, bool>> ResolveEraPredicate(string? era);
```

Behavior frozen by `SalesRatioStudyReaderTests` cases under
"G3 (v1.12) — era filter":

```text
era=null     →  predicate(POST_CONVERSION)
era=POST_*   →  s.ConversionEra == "POST_CONVERSION"
                 OR (s.ConversionEra IS NULL AND s.SlDt >= 2018-01-01)
era=PRE_*    →  s.ConversionEra == "PRE_CONVERSION_2017"
                 OR (s.ConversionEra IS NULL AND s.SlDt < 2018-01-01)
era=UNKNOWN  →  s.ConversionEra == "UNKNOWN"   (no NULL fallback)
era=ALL      →  always true
era=other    →  ArgumentException
```

The era filter is composed with the existing date-floor filter
via SQL `AND`. Both apply orthogonally:

- `era=POST_CONVERSION` (default) + `from=2020-01-01`: post-conversion
  sales since 2020.
- `era=PRE_CONVERSION_2017` + `from=2010-01-01`: pre-conversion
  sales since 2010.
- `era=PRE_CONVERSION_2017` (no `from` override): empty result, by
  construction — pre rows have `SlDt < 2018-01-01` and the default
  floor excludes them. Operators must pass `from` explicitly to
  query pre-conversion data.

## 3. The response shape

Each endpoint's 200 body now includes the resolved `era` token:

```json
{
  "countyId": "...",
  "fromDate": "2018-01-01T00:00:00Z",
  "era": "POST_CONVERSION",
  "validSaleCount": 42
}
```

The echo-back makes the resolved default visible to operators and
keeps the response self-describing.

400 body on invalid era:

```json
{
  "error": "invalid era",
  "validValues": ["POST_CONVERSION", "PRE_CONVERSION_2017", "UNKNOWN", "ALL"]
}
```

403 (cross-county or missing claim) is unchanged from v1.9.

## 4. Tests

### Reader tests (`SalesRatioStudyReaderTests`)

New section "G3 (v1.12) — era filter":

- `EraFilter_DefaultsToPostConversion_WhenOmitted`
- `EraFilter_PostConversion_FallsBackToYearForNullEra`
- `EraFilter_PreConversion_RequiresExplicitFromDateOverride`
- `EraFilter_Unknown_RequiresExactColumnMatch`
- `EraFilter_All_BypassesEraEntirely`
- `EraFilter_Q2_ByYear_HonorsEraFilter`
- `EraFilter_Q3_PriceAggregate_HonorsEraFilter`
- `EraFilter_InvalidToken_Throws`

### Controller tests (`SalesRatioStudyControllerTests` — new file)

Reflection-based response-body inspection (the controller wraps
results in anonymous types). Coverage:

- `GetValidSaleCount_OmittedEra_DefaultsToPostConversion`
- `GetValidSaleCount_ExplicitEraAll_BypassesFilter`
- `GetValidSaleCount_InvalidEra_Returns400` (theory: 3 cases)
- `GetValidSaleCount_NoCountyClaim_Returns403` (auth regression)
- `GetValidSalesByYear_EchoesEraInResponse`
- `GetAggregateSalePrice_EchoesEraInResponse`
- `EraTrimWhitespace_AcceptedAsEquivalent`

### Doctrine tests (`BlockCContractV1Tests` — v1.12 band)

- `Contract_v1_12_ISalesRatioStudyReader_EraAll_IsFrozen` — locks
  the `"ALL"` token value.
- `Contract_v1_12_DefaultFromDate_StillLockedToCutoverConvention`
  — carries forward v1.9 §2's date-floor freeze.
- `Contract_v1_12_EraDefault_IsPostConversion` — locks the
  vocabulary identity that backs the documented default.

## 5. What v1.12 does NOT change

- Schema: zero changes. No new column, no new migration. The
  doctrine tests in `Contract_RequiredMigrations_ArePresentInDataAssembly`
  do not need a v1.12 fragment.
- Other read endpoints: `/api/sales`, `/api/parcels/{id}/owners`,
  `/api/parcels/{id}/wsdor`, `/api/parcels/{id}/geometry` are
  unchanged. Adding `era` to those is a future slice.
- Promotion-side behavior: G4 (pre-conversion-row-share gate) is
  still pending.
- All other v1.x-frozen shapes (sales codes, gates, dictionary
  tables, GIS scaffold, AttributeDefinition, QuarantineReasons,
  LandingQuarantineReasons, SourceFamilies, ConversionEras
  vocabulary) remain untouched.

## 6. Linked GitHub issues

- **G3** — closed by this slice (this doc).
- **G4** — pending. Tracked under the Block-G milestone in the
  design spine (`blocks-d-through-h-design.md` §G).
- Future expansion of `eraFilter` to other read endpoints — to be
  scoped when operators request it.
- **OPERATOR-SQL-IMPORT-1 (#726)** — unrelated to G3 but still
  blocking F1/F3/F4 per v1.9.
- **CI-HYGIENE-1 (#724)** — chronic main-state continues to
  require admin-merge through documented exception.
