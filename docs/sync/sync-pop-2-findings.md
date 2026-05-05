# SYNC-POP-2 — Findings: PACS Sales Raw Landing Connected to Real Source

**Slice:** SYNC-POP-2 (post-BENTON-SYNC-CLOSE). Connects the doctrine
`legacy_pacs_raw → truth_pacs → canonical_tf` pipeline to a live
Harris PACS source for the **sales lane only**. Surfaces and documents
seven fixture-vs-real-PACS divergences that the BENTON-SYNC-* diagnostic
track did not exercise (because no slice in that track ran the source
side against actual `pacs_oltp` data).

**Status:** S1 (raw landing) and S2-A (prop_supp_assoc landing) proven
end-to-end against live Benton Harris PACS. S2-B (truth promotion) +
S3 (canonical projection) wired and operational; produce zero rows on
bounded proof samples because the doctrine truth gates require
matching `(prop_id, prop_val_yr)` overlap between the sale batch and
the supp_assoc batch — and S3 additionally requires a populated
`canonical_tf.tf_parcel` (currently empty until the parcel pipeline
is also connected).

## What was scaffolded but unconnected before this slice

The BENTON-SYNC-* track delivered four diagnostic surfaces against
live Benton Harris PACS:

- Schema catalog health
- Invariant report artifact
- Dictionary-loader preflight evidence
- Sales qualification coverage continuity

None of these wrote rows into `legacy_pacs_raw.*`, `truth_pacs.*`, or
`canonical_tf.*`. The doctrine pipeline's source-side abstractions
were declared:

- `IPacsSaleSource`
- `IPacsPropSuppAssocSource`
- `IPacsAccountSource`
- `IPacsOwnerCurrentSource`
- `IPacsImprvCurrentSource`
- `IPacsLandCurrentSource`

Of these, the first three had **test-only** `Fake*` fixture
implementations. The latter three had **no implementation at all**
(neither test nor production).

This slice ships the first two production sources:

- `SqlServerPacsSaleSource` — drains live `pacs_oltp.dbo.sale`
  joined to `dbo.chg_of_owner_prop_assoc`
- `SqlServerPacsPropSuppAssocSource` — drains live
  `pacs_oltp.dbo.prop_supp_assoc`

Plus a bounded proof-run HTTP entry at
`POST /api/debug/sync-pop-2/run-chain` that orchestrates S1 + S2-A
+ S2-B + S3 against a `TopN`-bounded sale sample.

## Seven fixture-vs-real-PACS divergences uncovered

Each row below documents one divergence between the doctrine test
fixture's assumptions and what real Harris PACS actually exposes. The
BENTON-SYNC-* track did not catch these because it never ran the
source side. Each was uncovered by an iteration of the SYNC-POP-2
proof run; each fix is shipped in this slice.

### #1 — `dbo.sale` lacks `prop_id`, `prop_val_yr`, `sup_num`

The `FakePacsSaleSource.SourceQueryText` declared:

```sql
SELECT chg_of_owner_id, prop_id, prop_val_yr, sup_num,
       sl_county_ratio_cd, wac_cd, sl_ratio_type_cd,
       sl_dt, sl_price, adj_sl_price
FROM dbo.sale
```

Real Harris PACS `dbo.sale` does **not** have `prop_id`,
`prop_val_yr`, or `sup_num` columns. Per the existing
`PacsDataSeeder.SeedSalesAsync` query:

- `prop_id` is on `dbo.chg_of_owner_prop_assoc` (joined by
  `chg_of_owner_id`).
- `prop_val_yr` and `sup_num` are not associated with the sale row
  directly. The doctrine intent (per the test fixture's seed values:
  `PropValYr: 2026, SupNum: 0`) is that PropValYr matches the sale
  year and SupNum is 0.

**Fix:** the production `SqlServerPacsSaleSource` joins
`chg_of_owner_prop_assoc` for `prop_id` and derives
`prop_val_yr = YEAR(sl_dt)` (with `GETDATE()` fallback) and
`sup_num = 0` directly in the SQL.

### #2 — `chg_of_owner_id` is `INT`, not `BIGINT`

`PacsSourceSale.ChgOfOwnerId` is declared `long`. Real Harris PACS
`dbo.sale.chg_of_owner_id` is `int`. `SqlDataReader.GetInt64()` on
that column throws `InvalidCastException`.

**Fix:** read with `GetInt32()` and widen to `long` in the source.

### #3 — SQL Server returns `DateTime.Kind=Unspecified`; Postgres requires `Utc`

The doctrine `legacy_pacs_raw.sale.SlDt` column maps to Postgres
`timestamp with time zone`. Npgsql refuses to bind a `DateTime` with
`Kind=Unspecified` (the default coming back from `SqlDataReader`):

> `Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone', only UTC is supported.`

The test fixture seeded `DateTimeKind.Utc` explicitly, masking the issue.

**Fix:** `DateTime.SpecifyKind(rdr.GetDateTime(...), DateTimeKind.Utc)`
in the source.

### #4 — Real PACS code columns are CHAR-padded (`"100   "`)

`sl_county_ratio_cd`, `wac_cd`, and `sl_ratio_type_cd` are CHAR-typed
in real Harris PACS and come back from `SqlDataReader.GetString()`
with trailing whitespace. The doctrine destination caps these at
`varchar(8)` (see also #6) and rejects the padded values.

**Fix:** `TrimOrNull` helper that calls `Trim()` and collapses the
empty string to `null` per the doctrine convention that "no code" is
`null`, not `""`.

### #5 — 30s default Npgsql command timeout too tight for batch landing

EF Core's `PacsSaleLandingService` flushes in 500-row batches, but
each `SaveChangesAsync` writes both the landed rows AND auto-populated
audit log rows via the `AuditableEntityInterceptor`. On a busy local
Postgres, batches of 500 sales + 500 audit rows can exceed the
default 30s command timeout.

**Fix:** added `Command Timeout=600` to the dev `DefaultConnection`
in `appsettings.Development.json`. Production deployments will need
the same (or a tuned) value.

### #6 — `varchar(8)` destination caps too tight for real PACS code lengths

The original `LegacyPacsRawSaleConfiguration` capped `SlCountyRatioCd`,
`WacCd`, and `SlRatioTypeCd` at `varchar(8)`. The
`PacsSale` entity (which mirrors real PACS column widths) declares:

| Column | Real PACS width | Old fixture cap | New cap |
|---|---|---|---|
| `sl_county_ratio_cd` | 10 | 8 | 10 |
| `wac_cd` | 32 | 8 | 32 |
| `sl_ratio_type_cd` | 5 | 8 | 8 (kept; provides headroom) |

Live data in Benton's `pacs_oltp.dbo.sale.wac_cd` includes WAC
458-61A codes that exceed 8 characters. The fixture's tighter cap
silently rejected them.

**Fix:** EF migration
`20260504000000_WidenLegacyPacsRawSaleCodeColumns` widens the two
mismatched columns to match `PacsSale` (and reality). The doctrine
intent of the raw landing tier is "preserve PACS values verbatim
for audit"; truncation at the doctrine destination would corrupt
that audit anchor.

### #7 — `dbo.prop_supp_assoc` uses `owner_tax_yr` (not `prop_val_yr`); `sup_num` is `INT`

The `FakePropSuppAssocSource.SourceQueryText` declared:

```sql
SELECT prop_val_yr, prop_id, sup_num FROM dbo.prop_supp_assoc
```

Real Harris PACS `dbo.prop_supp_assoc` schema:

| Column | Type | Note |
|---|---|---|
| `prop_id` | `int` | matches |
| `owner_tax_yr` | `numeric` | not `prop_val_yr` |
| `sup_num` | `int` | doctrine record declares `short` |

**Fix:** the production
`SqlServerPacsPropSuppAssocSource` aliases `owner_tax_yr → prop_val_yr`
and `CAST`s both year + `sup_num` to `smallint` in the SQL.

## Proof outcomes

Local proof runs against live Benton `pacs_oltp` confirmed:

- **S1** completed; 1000 post-2018 sales landed in
  `legacy_pacs_raw.sale` with 0 stale-axis violations and a real
  `sl_county_ratio_cd` distribution (predominantly NULL with
  observed `"100"` and `"200"` codes).
- **S2-A** completed; 1000 `prop_supp_assoc` rows landed across 24
  distinct years with 0 duplicate-key violations.
- **S2-B + S3** ran without exceptions and returned `COMPLETED`
  status, but with 0 sales promoted/projected in bounded-sample
  proofs. This is **expected**:
    - The truth-promotion gate filters `SlCountyRatioCd != "100"`
      before considering a row, so only the qualified subset moves
      forward.
    - The gate then requires a matching `(PropId, PropValYr)` in the
      same supp batch and an exact `SupNum` match. Bounded sale +
      supp samples almost never cover the same (parcel, year)
      tuples, so overlap is negligible in proof runs.
    - Even if S2-B promoted, S3 would quarantine — `canonical_tf.tf_parcel`
      is empty until the parcel pipeline (a separate slice — see
      "What's not yet wired" below) connects to a live source.

## Files shipped in SYNC-POP-2

- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsSaleSource.cs`
  — production `IPacsSaleSource` against `pacs_oltp.dbo.sale`
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsPropSuppAssocSource.cs`
  — production `IPacsPropSuppAssocSource` against
  `pacs_oltp.dbo.prop_supp_assoc`
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — `GET /api/debug/canonical-counts`,
    `GET /api/debug/sync-pop-2/pacs-table-columns`,
    `POST /api/debug/sync-pop-2/run-chain`,
    `POST /api/debug/sync-pop-2/truncate-raw-landing` (env-guarded)
- `backend/src/TerraFusion.Data/Configurations/LegacyPacsRaw/LegacyPacsRawSaleConfiguration.cs`
  — column-width updates per finding #6
- `backend/src/TerraFusion.Data/Migrations/20260504000000_WidenLegacyPacsRawSaleCodeColumns.cs`
  — EF migration applying the widening
- `backend/src/TerraFusion.API/appsettings.Development.json`
  — `DefaultConnection` `Command Timeout=600` per finding #5
- this document

## What's not yet wired

The four other doctrine source interfaces have no production
implementation. Each will need its own SYNC-POP-* slice, each
expected to surface its own divergences:

- `IPacsAccountSource` — no impl (parcel master)
- `IPacsOwnerCurrentSource` — no impl
- `IPacsImprvCurrentSource` — no impl
- `IPacsLandCurrentSource` — no impl

Plus the geometry side (`truth_arcgis` → `gis_tf`) which has its own
pipeline.

The next-natural slice for product-flow proof is **SYNC-POP-3 —
targeted supp overlap proof**: land a small sale batch, extract its
distinct `(prop_id, prop_val_yr, sup_num)` keys, then land
prop_supp_assoc only for those tuples, then re-run S2-B and observe
non-zero `truth_pacs.sale`.

Canonical projection (`canonical_tf.tf_sale`) requires the parcel
pipeline to land first; that is **not** SYNC-POP-3's scope.

## Re-open conditions for SYNC-POP-2

This slice stays closed unless one of these holds:

- A new fixture-vs-real-PACS divergence surfaces during operator
  testing that the seven listed above did not cover.
- The Harris PACS schema itself changes (new columns, different
  types, renamed tables) such that `SqlServerPacsSaleSource` or
  `SqlServerPacsPropSuppAssocSource` need adjustment.
- The doctrine truth-promotion gates change shape such that the
  current source's column set is no longer sufficient.

## Boundary

This slice deliberately does **not** include:

- Parcel/owner/improvement/land/geometry source connectors
- Operator UI for invoking landing runs
- Frontend changes
- Production deployment of the `--land-pacs-sales` flow
- Promotion of the `legacy_pacs_raw` schema beyond what the doctrine
  already declared
- Changes to `PacsSaleLandingService`, `PacsSaleTruthPromoter`, or
  `PacsSaleCanonicalProjector` (the doctrine destination services
  are unchanged; only the source-side abstractions got concrete
  production implementations)

The doctrine pipeline's truth-promotion and canonical-projection
gates are working as documented — they correctly filter our bounded
proof samples. SYNC-POP-3 will demonstrate the chain with
overlap-aware sampling.
