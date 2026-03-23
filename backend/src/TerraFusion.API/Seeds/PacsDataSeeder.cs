using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Pacs;
using TerraFusion.Data;

namespace TerraFusion.API.Seeds;

/// <summary>
/// ETL pipeline: Harris PACS 9.0 (tf-mssql pacs_oltp) → TerraFusion local database.
/// Source: SQL Server via Microsoft.Data.SqlClient (PacsConnection string).
/// Target: TerraFusionDbContext (SQLite in dev, PostgreSQL in prod).
///
/// Seed order:
///   1. PacsParcel       — root, builds prop_id → ParcelGuid map
///   2. PacsSitus        — physical address (separate situs table)
///   3. PacsValuation    — property_val via prop_supp_assoc join
///   4. PacsImprovement  — imprv top-level, builds imprv key → ImprvGuid map
///   5. PacsImprovementDetail   — imprv_detail (keyed via ImprvGuid)
///   6. PacsImprovementAttribute — imprv_attr (keyed via ImprvGuid)
///   7. PacsLandDetail   — land_detail
///   8. PacsOwner        — owner + account join for names
///   9. PacsSale         — sale + chg_of_owner_prop_assoc + account for names
///  10. PacsExemption    — property_exemption (no PII)
///  11. PacsAppeal       — _arb_protest full BOE workflow
///  12. PacsTaxArea      — property_tax_area JOIN tax_area
///  13. PacsTaxAreaAssoc — wash_prop_owner_tax_area_assoc
/// </summary>
public class PacsDataSeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PacsDataSeeder> _logger;

    private const int BatchSize = 1_000;
    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    public PacsDataSeeder(
        TerraFusionDbContext db,
        IConfiguration config,
        ILogger<PacsDataSeeder> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // ── Public API ────────────────────────────────────────────────────────

    public async Task<PacsSeederResult> SeedAllAsync(CancellationToken ct = default)
    {
        var cs = _config.GetConnectionString("PacsConnection")
            ?? throw new InvalidOperationException(
                "PacsConnection not configured. Add it to appsettings.Development.local.json.");

        var csSales = _config.GetConnectionString("PacsSalesConnection");


        // Ensure PACS tables exist in the target database.
        // EF Core's CreateTablesAsync emits plain CREATE TABLE (no IF NOT EXISTS), so
        // we generate the full DDL script and execute each statement individually,
        // silently skipping any "already exists" errors for pre-existing tables.
        await EnsureSchemaAsync(ct);
        _logger.LogInformation("[PacsSeeder] Schema ensured (missing tables created if any).");

        // Full-refresh: clear all PACS mirror tables before seeding so we do plain
        // inserts rather than loading all existing rows into memory for upsert logic.
        await ClearPacsTablesAsync(ct);

        // Guard: if pacs_valuations still has rows, the DELETE silently failed.
        // Proceeding into a dirty table causes the unique-index fallback to skip every insert.
        var staleValuations = await _db.PacsValuations.CountAsync(ct);
        if (staleValuations > 0)
            throw new InvalidOperationException(
                $"[PacsSeeder] Clear failed: pacs_valuations still has {staleValuations} rows. " +
                "Aborting to prevent stale data collision. Check for DB locks or FK constraints.");

        _logger.LogInformation("[PacsSeeder] PACS tables cleared and verified empty. Starting fresh insert.");

        var result = new PacsSeederResult();

        await using var pacs = new SqlConnection(cs);
        await pacs.OpenAsync(ct);
        _logger.LogInformation("[PacsSeeder] Connected to pacs_oltp. Starting full ETL.");

        // Open pacs_golive connection for wash_ tables (owner vals, tax area assocs)
        // which live in pacs_golive, not pacs_oltp.
        SqlConnection? golive = null;
        if (!string.IsNullOrEmpty(csSales))
        {
            golive = new SqlConnection(csSales);
            await golive.OpenAsync(ct);
            _logger.LogInformation("[PacsSeeder] Connected to pacs_golive for wash_ tables.");
        }

        try
        {
        // Phase 1: Root parcels — must run first
        var propMap = await SeedParcelsAsync(pacs, ct);
        result.Parcels = propMap.Count;

        if (propMap.Count == 0)
        {
            _logger.LogWarning("[PacsSeeder] No active parcels found in PACS. Aborting.");
            return result;
        }

        _logger.LogInformation("[PacsSeeder] Parcels seeded: {Count}", result.Parcels);

        // Phase 2: Address, values, improvements
        result.Situs             = await SeedSitusAsync(pacs, propMap, ct);
        result.Valuations        = await SeedValuationsAsync(pacs, propMap, ct);
        var imprvMap             = await SeedImprovementsAsync(pacs, propMap, ct);
        result.Improvements      = imprvMap.Count;
        result.ImprovementDetails    = await SeedImprovementDetailsAsync(pacs, imprvMap, ct);
        result.ImprovementAttributes = await SeedImprovementAttributesAsync(pacs, imprvMap, ct);
        result.LandDetails       = await SeedLandDetailsAsync(pacs, propMap, ct);

        // Phase 3: Ownership, transactions, compliance
        // wash_ tables (OwnerVals, TaxAreaAssocs) use pacs_golive; others use pacs_oltp.
        result.Owners        = await SeedOwnersAsync(pacs, propMap, ct);
        result.OwnerVals     = await SeedOwnerValsAsync(golive ?? pacs, propMap, ct);
        result.Sales         = await SeedSalesAsync(pacs, propMap, ct);
        result.Exemptions    = await SeedExemptionsAsync(pacs, propMap, ct);
        result.Appeals       = await SeedAppealsAsync(pacs, propMap, ct);
        result.TaxAreas      = await SeedTaxAreasAsync(pacs, propMap, ct);
        result.TaxAreaAssocs = await SeedTaxAreaAssocsAsync(golive ?? pacs, propMap, ct);
        result.PropertyProfiles = await SeedPropertyProfilesAsync(pacs, propMap, ct);
        }
        finally
        {
            if (golive != null) await golive.DisposeAsync();
        }

        _logger.LogInformation("[PacsSeeder] Complete. {Summary}", result);
        return result;
    }

    // ── Clear PACS tables (full-refresh) ─────────────────────────────────
    // Deletes all rows from PACS mirror tables in FK-safe reverse order so
    // the ETL can do plain inserts without loading existing rows into memory.

    private async Task ClearPacsTablesAsync(CancellationToken ct)
    {
        // Truncate all PACS tables in one statement — CASCADE handles FK order automatically.
        // Postgres TRUNCATE is far faster than DELETE and avoids FK ordering issues.
        const string truncateSql = @"
            TRUNCATE TABLE
                pacs_tax_area_assocs, pacs_tax_areas, pacs_appeals, pacs_exemptions, pacs_sales,
                pacs_owner_vals, pacs_owners, pacs_land_details,
                pacs_improvement_attributes, pacs_improvement_details, pacs_improvements,
                pacs_valuations, pacs_situs, pacs_property_profiles, ""PacsParcel""
            RESTART IDENTITY CASCADE";
        try
        {
            await _db.Database.ExecuteSqlRawAsync(truncateSql, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("[PacsSeeder] Bulk truncate failed ({Msg}); falling back to per-table DELETE.", ex.Message);
            // Fallback: individual DELETEs with FK-safe order
            var tables = new[]
            {
                "pacs_tax_area_assocs", "pacs_tax_areas", "pacs_appeals", "pacs_exemptions", "pacs_sales",
                "pacs_owner_vals", "pacs_owners", "pacs_land_details",
                "pacs_improvement_attributes", "pacs_improvement_details", "pacs_improvements",
                "pacs_valuations", "pacs_situs", "pacs_property_profiles", "PacsParcel"
            };
            foreach (var tbl in tables)
            {
                try
                {
                    await _db.Database.ExecuteSqlRawAsync($"DELETE FROM \"{tbl}\"", ct);
                }
                catch (Exception inner)
                {
                    _logger.LogWarning("[PacsSeeder] Could not clear {Table}: {Msg}", tbl, inner.Message);
                }
            }
        }
    }

    // ── Schema bootstrap ──────────────────────────────────────────────────
    // Generates the full CREATE script for the current EF model and executes
    // each statement individually, skipping "already exists" errors so that
    // existing tables are untouched while new PACS tables are created.

    private async Task EnsureSchemaAsync(CancellationToken ct)
    {
        var script = _db.Database.GenerateCreateScript();
        foreach (var raw in script.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var sql = raw.Trim();
            if (string.IsNullOrWhiteSpace(sql)) continue;
            try
            {
                await _db.Database.ExecuteSqlRawAsync(sql, ct);
            }
            catch (SqliteException ex) when (ex.Message.Contains("already exists"))
            {
                // expected for pre-existing tables — PACS tables will succeed
            }
            catch (Exception)
            {
                // non-SQLite provider (Postgres prod): ignore DDL errors here,
                // migrations handle schema in production
            }
        }
    }

    // ── 1. PacsParcel ─────────────────────────────────────────────────────

    private async Task<Dictionary<int, Guid>> SeedParcelsAsync(
        SqlConnection pacs, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsParcel...");
        var existing = await _db.PacsParcel
            .ToDictionaryAsync(p => p.PropId, p => p.Id, ct);

        // SELECT * so column names never cause compile-time errors across PACS versions.
        // Str/Dec/Dt helpers silently return null for any missing column.
        const string sql = @"
            SELECT * FROM property ORDER BY prop_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsParcel>(BatchSize);
        var total = 0;
        // Tracks prop_ids added as NEW entries (not yet flushed) in the current batch.
        // Prevents duplicate PACS source rows from creating two entities with the same PK.
        var seenThisBatch = new HashSet<int>();

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));

            PacsParcel e;
            if (existing.TryGetValue(propId, out var guid))
            {
                // If this guid was created in the current unflushed batch, the entity isn't
                // in the DB yet — FindAsync would return null and create a PK-collision.
                // Skip: it's a PACS source duplicate, first occurrence already queued.
                if (seenThisBatch.Contains(propId)) continue;

                e = await _db.PacsParcel.FindAsync(new object[] { guid }, ct)
                    ?? new PacsParcel { Id = guid };
            }
            else
            {
                e = new PacsParcel();
                existing[propId] = e.Id;
                seenThisBatch.Add(propId);
            }

            e.PropId      = propId;
            e.CountyId    = BentonCountyId;
            e.PropTypeCd  = Str(rdr, "prop_type_cd") ?? string.Empty;
            e.GeoId       = Str(rdr, "geo_id");
            e.SimpleGeoId = Str(rdr, "simple_geo_id");
            e.StateCd     = Str(rdr, "state_cd");
            e.Zoning      = Str(rdr, "zoning");
            e.Topography  = Str(rdr, "topo") ?? Str(rdr, "topography");
            e.Utilities   = Str(rdr, "utilities");
            e.RoadAccess  = Str(rdr, "road_access");
            e.PropCmnt    = Str(rdr, "prop_cmnt");
            e.PropCreateDt = Dt(rdr, "prop_create_dt");
            e.SyncedAt    = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
                seenThisBatch.Clear();
                _logger.LogInformation("[PacsSeeder] PacsParcel batch saved, total so far: {Total}", total);
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsParcel: {Total}", total);

        // After all inserts, rebuild propMap from DB to ensure we use the actual server-stored Guids.
        // GroupBy handles rare duplicate prop_id rows in PACS (take the first Guid for each).
        var savedMap = (await _db.PacsParcel.ToListAsync(ct))
            .GroupBy(p => p.PropId)
            .ToDictionary(g => g.Key, g => g.First().Id);
        _logger.LogInformation("[PacsSeeder] PacsParcel propMap rebuilt from DB: {Count} entries", savedMap.Count);
        return savedMap;
    }

    // ── 2. PacsSitus ──────────────────────────────────────────────────────

    private async Task<int> SeedSitusAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsSitus...");
        var existing = await _db.PacsSituses
            .ToDictionaryAsync(s => (s.PacsPropId, s.PacsSitusId), s => s.Id, ct);
        var seen = new HashSet<(int, int)>(existing.Keys);

        const string sql = @"
            SELECT s.prop_id,
                   ISNULL(s.situs_id, 0)         AS situs_id,
                   s.primary_situs,
                   s.situs_num,
                   s.situs_street_prefx,
                   s.situs_street,
                   s.situs_street_sufix,
                   s.situs_unit,
                   s.situs_city,
                   s.situs_state,
                   s.situs_zip,
                   s.situs_display,
                   s.building_num,
                   s.sub_num
            FROM situs s
            INNER JOIN property p ON s.prop_id = p.prop_id
            ORDER BY s.prop_id, situs_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsSitus>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var situsId = Int(rdr, "situs_id") ?? 0;
            var key     = (propId, situsId);

            if (!seen.Add(key)) continue;

            PacsSitus e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsSituses.FindAsync(new object[] { eId }, ct)
                    ?? new PacsSitus { Id = eId };
            else
                e = new PacsSitus();

            e.ParcelId     = parcelId;
            e.PacsPropId   = propId;
            e.PacsSitusId  = situsId;
            e.PrimaryFlag  = Str(rdr, "primary_situs");
            e.StreetNum    = Str(rdr, "situs_num");
            e.StreetPrefix = Str(rdr, "situs_street_prefx");
            e.StreetName   = Str(rdr, "situs_street");
            e.StreetSuffix = Str(rdr, "situs_street_sufix");
            e.UnitNum      = Str(rdr, "situs_unit");
            e.City         = Str(rdr, "situs_city");
            e.State        = Str(rdr, "situs_state");
            e.Zip          = Str(rdr, "situs_zip");
            e.SitusDisplay = Str(rdr, "situs_display");
            e.BuildingNum  = Str(rdr, "building_num");
            e.SubNum       = Str(rdr, "sub_num");
            e.LastPacsSync = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsSitus: {Total}", total);
        return total;
    }

    // ── 3. PacsValuation ─────────────────────────────────────────────────

    private async Task<int> SeedValuationsAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsValuation (current year, sup_num=0 per prop_id)...");

        // One row per prop_id: most-recent substantive year (sup_num=0) only.
        // Use HAVING COUNT >= 1000 to skip sparse stub years (same pattern as owner fix).
        const string sql = @"
            SELECT * FROM property_val
            WHERE  prop_val_yr = (
                SELECT TOP 1 prop_val_yr
                FROM (
                    SELECT prop_val_yr, COUNT(*) cnt
                    FROM property_val
                    WHERE sup_num = 0
                    GROUP BY prop_val_yr
                    HAVING COUNT(*) >= 1000
                ) x
                ORDER BY prop_val_yr DESC
            )
              AND  sup_num     = 0";

        _logger.LogInformation("[PacsSeeder] PacsValuation: executing current-year query on SQL Server...");
        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 120 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        _logger.LogInformation("[PacsSeeder] PacsValuation: reader opened, starting row reads.");
        var batch = new List<PacsValuation>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr  = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("prop_val_yr")));
            var sup = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));

            // Table was cleared before this runs — always insert fresh.
            var e = new PacsValuation();

            e.ParcelId    = parcelId;
            e.PacsPropId  = propId;
            e.PropValYear = yr;
            e.SupNum      = sup;

            // Core
            e.AppraisedVal = Dec(rdr, "appraised_val");
            e.AssessedVal  = Dec(rdr, "assessed_val");
            e.Market       = Dec(rdr, "market");
            e.ImprvVal     = Dec(rdr, "imprv_val");

            // Land splits
            e.LandHstdVal    = Dec(rdr, "land_hstd_val");
            e.LandNonHstdVal = Dec(rdr, "land_non_hstd_val");
            e.ImprvHstdVal   = Dec(rdr, "imprv_hstd_val");
            e.ImprvNonHstdVal = Dec(rdr, "imprv_non_hstd_val");

            // Agricultural
            e.AgUseVal   = Dec(rdr, "ag_use_val");
            e.AgMarket   = Dec(rdr, "ag_market");
            e.AgLoss     = Dec(rdr, "ag_loss");
            e.AgLateLoss = Dec(rdr, "ag_late_loss");
            e.AgHsUseVal = Dec(rdr, "ag_hs_use_val");
            e.AgHsMktVal = Dec(rdr, "ag_hs_mkt_val");
            e.AgHsLoss   = Dec(rdr, "ag_hs_loss");

            // Timber
            e.Timber78      = Dec(rdr, "timber_78");
            e.TimberMarket  = Dec(rdr, "timber_market");
            e.TimberUse     = Dec(rdr, "timber_use");
            e.TimberLoss    = Dec(rdr, "timber_loss");
            e.TimberLateLoss = Dec(rdr, "timber_late_loss");
            e.TimberHsUseVal = Dec(rdr, "timber_hs_use_val");
            e.TimberHsMktVal = Dec(rdr, "timber_hs_mkt_val");
            e.TimberHsLoss   = Dec(rdr, "timber_hs_loss");

            // HSCAP
            e.TenPercentCap     = Dec(rdr, "ten_percent_cap");
            e.FreezeCeiling     = Dec(rdr, "freeze_ceiling");
            e.FreezeYear        = Dec(rdr, "freeze_yr");
            e.HscapQualifyYear  = Dec(rdr, "hscap_qualify_yr");
            e.HscapBaseYear     = Dec(rdr, "hscap_base_yr");
            e.HscapPrevHsVal    = Dec(rdr, "hscap_prev_hs_val");
            e.HscapNewHsVal     = Dec(rdr, "hscap_new_hs_val");
            e.HscapPrevReapprYear = Dec(rdr, "hscap_prev_reappr_yr");
            e.LastAppraisalYear = Dec(rdr, "last_appraisal_yr");

            // New value
            e.NewVal         = Dec(rdr, "new_val");
            e.NewValHs       = Dec(rdr, "new_val_hs");
            e.NewValNhs      = Dec(rdr, "new_val_nhs");
            e.NewValImprvHs  = Dec(rdr, "new_val_imprv_hs");
            e.NewValImprvNhs = Dec(rdr, "new_val_imprv_nhs");
            e.NewValLandHs   = Dec(rdr, "new_val_land_hs");
            e.NewValLandNhs  = Dec(rdr, "new_val_land_nhs");
            e.NewYear        = Dec(rdr, "new_yr");
            e.RemodelValCurrYr = Dec(rdr, "remodel_val_curr_yr");

            // Cost approach
            e.CostValue          = Dec(rdr, "cost_value");
            e.CostMarket         = Dec(rdr, "cost_market");
            e.CostLandHstdVal    = Dec(rdr, "cost_land_hstd_val");
            e.CostLandNonHstdVal = Dec(rdr, "cost_land_non_hstd_val");
            e.CostImprvHstdVal   = Dec(rdr, "cost_imprv_hstd_val");
            e.CostImprvNonHstdVal = Dec(rdr, "cost_imprv_non_hstd_val");
            e.CostAgUseVal       = Dec(rdr, "cost_ag_use_val");
            e.CostAgMarket       = Dec(rdr, "cost_ag_market");

            // Income approach
            e.IncomeValue          = Dec(rdr, "income_value");
            e.IncomeMarket         = Dec(rdr, "income_market");
            e.IncomeLandHstdVal    = Dec(rdr, "income_land_hstd_val");
            e.IncomeLandNonHstdVal = Dec(rdr, "income_land_non_hstd_val");
            e.IncomeImprvHstdVal   = Dec(rdr, "income_imprv_hstd_val");
            e.IncomeImprvNonHstdVal = Dec(rdr, "income_imprv_non_hstd_val");

            // Market approach
            e.MktapprMarket         = Dec(rdr, "mktappr_market");
            e.MktapprImprvHstdVal   = Dec(rdr, "mktappr_imprv_hstd_val");
            e.MktapprImprvNonHstdVal = Dec(rdr, "mktappr_imprv_non_hstd_val");
            e.MktapprLandHstdVal    = Dec(rdr, "mktappr_land_hstd_val");
            e.MktapprLandNonHstdVal = Dec(rdr, "mktappr_land_non_hstd_val");

            // ARB approach
            e.ArbMarket          = Dec(rdr, "arb_market");
            e.ArbLandHstdVal     = Dec(rdr, "arb_land_hstd_val");
            e.ArbLandNonHstdVal  = Dec(rdr, "arb_land_non_hstd_val");
            e.ArbImprvHstdVal    = Dec(rdr, "arb_imprv_hstd_val");
            e.ArbImprvNonHstdVal = Dec(rdr, "arb_imprv_non_hstd_val");
            e.ArbAgUseVal        = Dec(rdr, "arb_ag_use_val");
            e.ArbAgMarket        = Dec(rdr, "arb_ag_market");

            // Rendered / personal property
            e.RenderedVal  = Dec(rdr, "rendered_val");
            e.RenderedYear = Dec(rdr, "rendered_yr");

            // Abatement / TIF
            e.AbatedPct  = Dec(rdr, "abated_pct");
            e.AbatedAmt  = Dec(rdr, "abated_amt");
            e.AbatedYear = Dec(rdr, "abated_yr");
            e.TifImprvVal = Dec(rdr, "tif_imprv_val");
            e.TifLandVal  = Dec(rdr, "tif_land_val");
            e.TifFlag     = Str(rdr, "tif_flag");

            // Legal
            e.LegalDesc    = Str(rdr, "legal_desc");
            e.LegalAcreage = Dec(rdr, "legal_acres");

            // Geographic codes
            e.NeighborhoodCode = Str(rdr, "nbhd_cd");
            e.AbsSubdvCd       = Str(rdr, "abs_subdv_cd");
            e.RegionCode       = Str(rdr, "rgn_cd");
            e.TownshipCode     = Str(rdr, "twnshp_cd");
            e.RangeCode        = Str(rdr, "rnge_cd");
            e.MapId            = Str(rdr, "map_id");
            e.SubsetCd         = Str(rdr, "subset_cd");

            // Appraiser
            e.LastAppraiserId      = Int(rdr, "last_appraiser_id");
            e.NextAppraiserId      = Int(rdr, "next_appraiser_id");
            e.ValueAppraiserId     = Int(rdr, "value_appraiser_id");
            e.LandAppraiserId      = Int(rdr, "land_appraiser_id");
            e.LastAppraisalDate    = Dt(rdr, "last_appraisal_dt");
            e.NextAppraisalDate    = Dt(rdr, "next_appraisal_dt");
            e.NextAppraisalReason  = Str(rdr, "next_appraisal_rsn");
            e.LastActualAppraisalDate = Dt(rdr, "last_actual_appraisal_dt");
            e.RecalcDate           = Dt(rdr, "recalc_dt");

            // GIS
            e.GisCoordX = Dec(rdr, "lat");
            e.GisCoordY = Dec(rdr, "long");

            // UDI
            e.UdiParent       = Str(rdr, "udi_parent");
            e.UdiParentPropId = Int(rdr, "udi_parent_prop_id");
            e.UdiStatus       = Str(rdr, "udi_status");

            // Classification
            e.PropertyUseCd     = Str(rdr, "property_use_cd");
            e.SecondaryUseCd    = Str(rdr, "secondary_use_cd");
            e.SubMarketCd       = Str(rdr, "sub_market_cd");
            e.VisibilityAccessCd = Str(rdr, "visibility_access_cd");
            e.ApprMethod        = Str(rdr, "appr_method");
            e.SubType           = Str(rdr, "sub_type");
            e.PropState         = Str(rdr, "prop_state");
            e.Cycle             = Int(rdr, "cycle");

            // Supplemental
            e.SupCode    = Str(rdr, "sup_cd");
            e.SupDesc    = Str(rdr, "sup_desc");
            e.SupDate    = Dt(rdr, "sup_dt");
            e.SupAction  = Str(rdr, "sup_action");
            e.SupComment = Str(rdr, "sup_cmnt");

            // Flags / dates
            e.ChangeDate      = Dt(rdr, "change_dt");
            e.PropInactiveDate = Dt(rdr, "prop_inactive_dt");
            e.NoticeMailDate  = Dt(rdr, "notice_mail_dt");
            e.VitFlag         = Str(rdr, "vit_flag");
            e.HasLockedValues = Bool(rdr, "has_locked_values");
            e.LastPacsSync    = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
                _logger.LogInformation("[PacsSeeder] PacsValuation batch saved, total: {Total}", total);
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsValuation: {Total}", total);
        return total;
    }

    // ── 4. PacsImprovement ───────────────────────────────────────────────

    private async Task<Dictionary<(int, int, int), Guid>> SeedImprovementsAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsImprovement...");
        var existing = await _db.PacsImprovements
            .ToDictionaryAsync(
                i => (i.PacsPropId, i.PropValYear, i.PacsImprvId),
                i => i.Id, ct);
        var seen = new HashSet<(int, int, int)>(existing.Keys);
        // Build result map from existing; new entries added after each batch save.
        var imprvMap = new Dictionary<(int, int, int), Guid>(existing);

        // Substantive year: skip sparse stub years (HAVING >= 1000).
        const string sql = @"SELECT * FROM imprv
            WHERE prop_val_yr = (
                SELECT TOP 1 prop_val_yr
                FROM (
                    SELECT prop_val_yr, COUNT(*) cnt
                    FROM imprv
                    WHERE (sale_id = 0 OR sale_id IS NULL)
                    GROUP BY prop_val_yr
                    HAVING COUNT(*) >= 1000
                ) x
                ORDER BY prop_val_yr DESC
            )
              AND (sale_id = 0 OR sale_id IS NULL)
            ORDER BY prop_id, prop_val_yr, imprv_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsImprovement>(BatchSize);
        var batchKeys = new List<(int, int, int)>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("prop_val_yr")));
            var imprvId = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("imprv_id")));
            var key     = (propId, yr, imprvId);

            if (!seen.Add(key)) continue;

            PacsImprovement e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsImprovements.FindAsync(new object[] { eId }, ct)
                    ?? new PacsImprovement { Id = eId };
            else
                e = new PacsImprovement();

            e.ParcelId     = parcelId;
            e.PacsPropId   = propId;
            e.PropValYear  = yr;
            e.PacsImprvId  = imprvId;
            e.SupNum       = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));

            e.ImprvTypeCode  = Str(rdr, "imprv_type_cd");
            e.ImprvStateCd   = Str(rdr, "imprv_state_cd");
            e.ImprvDesc      = Str(rdr, "imprv_desc");
            e.MiscCode       = Str(rdr, "misc_cd");
            e.PrimaryImprv   = Str(rdr, "primary_imprv");
            e.ImprvHomesite  = Str(rdr, "imprv_homesite");
            e.NumImprv       = Int(rdr, "num_imprv");
            e.BuildingNumber = Str(rdr, "building_number");
            e.BuildingName   = Str(rdr, "building_name");

            e.ImprvVal          = Dec(rdr, "imprv_val");
            e.OriginalVal       = Dec(rdr, "orig_val");
            e.BaseVal           = Dec(rdr, "base_val");
            e.CalcVal           = Dec(rdr, "calc_val");
            e.AdjustedVal       = Dec(rdr, "adjusted_val");
            e.FlatVal           = Dec(rdr, "flat_val");
            e.ArbVal            = Dec(rdr, "arb_val");
            e.DistVal           = Dec(rdr, "dist_val");
            e.IncomeVal         = Dec(rdr, "income_val");
            e.MktapprVal        = Dec(rdr, "mktappr_val");
            e.LockedVal         = Dec(rdr, "locked_val");
            e.LivingAreaUp      = Dec(rdr, "living_area_up");
            e.ImprvAdjAmt       = Dec(rdr, "imprv_adj_amt");
            e.ImprvAdjFactor    = Dec(rdr, "imprv_adj_factor");
            e.ImprvMassAdjFactor = Dec(rdr, "imprv_mass_adj_factor");
            e.ValueType         = Str(rdr, "value_type");
            e.ImprvValSource    = Str(rdr, "imprv_val_source");
            e.ImpNewYear        = Dec(rdr, "imp_new_yr");
            e.ImpNewVal         = Dec(rdr, "imp_new_val");

            e.EconomicPct    = Dec(rdr, "economic_pct");
            e.PhysicalPct    = Dec(rdr, "physical_pct");
            e.FunctionalPct  = Dec(rdr, "functional_pct");
            e.DepPct         = Dec(rdr, "dep_pct");
            e.EconomicComment   = Str(rdr, "economic_cmnt");
            e.PhysicalComment   = Str(rdr, "physical_cmnt");
            e.FunctionalComment = Str(rdr, "functional_cmnt");
            e.DepComment        = Str(rdr, "dep_cmnt");
            e.ActualYearBuilt   = Dec(rdr, "yr_built");
            e.EffectiveYearBuilt = Dec(rdr, "yr_renovated");
            e.PercentComplete   = Dec(rdr, "percent_complete");
            e.Stories           = Str(rdr, "stories_cnt");
            e.ImprvComment      = Str(rdr, "imprv_cmnt");
            e.ImprvImageUrl     = Str(rdr, "image_path");
            e.MobileHomeSerialNum  = Str(rdr, "mbl_hm_sn1");
            e.MobileHomeSerialNum2 = Str(rdr, "mbl_hm_sn2");
            e.MobileHomeSerialNum3 = Str(rdr, "mbl_hm_sn3");
            e.MobileHomeHudNum     = Str(rdr, "mbl_hm_hud1");
            e.MobileHomeHudNum2    = Str(rdr, "mbl_hm_hud2");
            e.MobileHomeHudNum3    = Str(rdr, "mbl_hm_hud3");
            e.LastPacsSync   = DateTime.UtcNow;

            batch.Add(e);
            batchKeys.Add(key);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                for (int i = 0; i < batch.Count; i++)
                    imprvMap[batchKeys[i]] = batch[i].Id;
                batch.Clear();
                batchKeys.Clear();
            }
        }

        if (batch.Count > 0)
        {
            total += await UpsertAsync(batch, ct);
            for (int i = 0; i < batch.Count; i++)
                imprvMap[batchKeys[i]] = batch[i].Id;
        }
        _logger.LogInformation("[PacsSeeder] PacsImprovement: {Total}", total);
        return imprvMap;
    }

    // ── 5. PacsImprovementDetail ─────────────────────────────────────────

    private async Task<int> SeedImprovementDetailsAsync(
        SqlConnection pacs,
        Dictionary<(int, int, int), Guid> imprvMap,
        CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsImprovementDetail...");
        var existing = await _db.PacsImprovementDetails
            .ToDictionaryAsync(
                d => (d.PacsPropId, d.PropValYear, d.PacsImprvId, d.PacsImprvDetId),
                d => d.Id, ct);
        var seen = new HashSet<(int, int, int, int)>(existing.Keys);

        // Substantive year: skip sparse stub years (HAVING >= 1000).
        const string sql = @"SELECT * FROM imprv_detail
            WHERE prop_val_yr = (
                SELECT TOP 1 prop_val_yr
                FROM (
                    SELECT prop_val_yr, COUNT(*) cnt
                    FROM imprv_detail
                    WHERE (sale_id = 0 OR sale_id IS NULL)
                    GROUP BY prop_val_yr
                    HAVING COUNT(*) >= 1000
                ) x
                ORDER BY prop_val_yr DESC
            )
              AND (sale_id = 0 OR sale_id IS NULL)
            ORDER BY prop_id, prop_val_yr, imprv_id, imprv_det_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsImprovementDetail>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            var yr      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("prop_val_yr")));
            var imprvId = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("imprv_id")));
            var detId   = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("imprv_det_id")));

            if (!imprvMap.TryGetValue((propId, yr, imprvId), out var improvementId)) continue;

            var key = (propId, yr, imprvId, detId);

            if (!seen.Add(key)) continue;

            PacsImprovementDetail e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsImprovementDetails.FindAsync(new object[] { eId }, ct)
                    ?? new PacsImprovementDetail { Id = eId };
            else
                e = new PacsImprovementDetail();

            e.ImprovementId    = improvementId;
            e.PacsPropId       = propId;
            e.PropValYear      = yr;
            e.PacsImprvId      = imprvId;
            e.PacsImprvDetId   = detId;
            e.SupNum           = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));
            e.SeqNum           = Int(rdr, "seq_num");

            e.ImprvDetClassCd    = Str(rdr, "imprv_det_class_cd");
            e.ImprvDetMethCd     = Str(rdr, "imprv_det_meth_cd");
            e.ImprvDetTypeCd     = Str(rdr, "imprv_det_type_cd");
            e.ImprvDetSubClassCd = Str(rdr, "imprv_det_sub_class_cd");
            e.ImprvDetDesc       = Str(rdr, "imprv_det_desc");
            e.ConditionCode      = Str(rdr, "cond_cd");
            e.LeaseClass         = Str(rdr, "lease_class");

            e.ImprvDetArea     = Dec(rdr, "imprv_det_area");
            e.ImprvDetAreaType = Str(rdr, "imprv_det_area_type");
            e.CubicArea        = Dec(rdr, "cubic_area");
            e.CalcArea         = Dec(rdr, "calc_area");
            e.SketchArea       = Dec(rdr, "sketch_area");
            e.NetRentableArea  = Dec(rdr, "net_rentable_area");
            e.Perimeter        = Dec(rdr, "perimeter");
            e.Length           = Dec(rdr, "length");
            e.Width            = Dec(rdr, "width");
            e.Height           = Dec(rdr, "height");

            e.NumStories        = Int(rdr, "stories");
            e.NumUnits          = Int(rdr, "num_units");
            e.FloorNumber       = Dec(rdr, "floor_id");
            e.LoadFactor        = Dec(rdr, "load_factor");

            e.YearBuilt          = Dec(rdr, "yr_built");
            e.YearNew            = Dec(rdr, "yr_new");
            e.DepreciationYear   = Dec(rdr, "dep_yr");
            e.EffectiveTaxYear   = Dec(rdr, "eff_tax_yr");
            e.ActualAge          = Dec(rdr, "actual_age");
            e.PercentComplete    = Dec(rdr, "percent_complete");
            e.PercentCompleteComment = Str(rdr, "percent_complete_cmnt");

            e.ImprvDetVal       = Dec(rdr, "imprv_det_val");
            e.ImprvDetValSource = Str(rdr, "imprv_det_val_source");
            e.UnitPrice               = Dec(rdr, "unit_price");
            e.ImprvDetOrigUp          = Dec(rdr, "adj_unit_price");
            e.ImprvDetAdjVal          = Dec(rdr, "adj_val");
            e.ImprvDetCalcVal         = Dec(rdr, "calc_val");
            e.ImprvDetFlatVal         = Dec(rdr, "flat_val");
            e.DepreciatedReplacementCostNew = Dec(rdr, "drpc_new");

            e.EconomicPct    = Dec(rdr, "economic_pct");
            e.PhysicalPct    = Dec(rdr, "physical_pct");
            e.FunctionalPct  = Dec(rdr, "functional_pct");
            e.DepPct         = Dec(rdr, "dep_pct");
            e.EconomicComment   = Str(rdr, "economic_cmnt");
            e.PhysicalComment   = Str(rdr, "physical_cmnt");
            e.FunctionalComment = Str(rdr, "functional_cmnt");
            e.SketchCommands    = Str(rdr, "sketch_cmds");
            e.LastPacsSync   = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsImprovementDetail: {Total}", total);
        return total;
    }

    // ── 6. PacsImprovementAttribute ──────────────────────────────────────

    private async Task<int> SeedImprovementAttributesAsync(
        SqlConnection pacs,
        Dictionary<(int, int, int), Guid> imprvMap,
        CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsImprovementAttribute...");
        var existing = await _db.PacsImprovementAttributes
            .ToDictionaryAsync(
                a => (a.PacsPropId, a.PropValYear, a.PacsImprvId, a.PacsImprvDetId, a.PacsImprvAttrId),
                a => a.Id, ct);
        var seen = new HashSet<(int, int, int, int, int)>(existing.Keys);

        // Substantive year: skip sparse stub years (HAVING >= 1000).
        const string sql = @"SELECT * FROM imprv_attr
            WHERE prop_val_yr = (
                SELECT TOP 1 prop_val_yr
                FROM (
                    SELECT prop_val_yr, COUNT(*) cnt
                    FROM imprv_attr
                    WHERE (sale_id = 0 OR sale_id IS NULL)
                    GROUP BY prop_val_yr
                    HAVING COUNT(*) >= 1000
                ) x
                ORDER BY prop_val_yr DESC
            )
              AND (sale_id = 0 OR sale_id IS NULL)
            ORDER BY prop_id, prop_val_yr, imprv_id, imprv_det_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsImprovementAttribute>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            var yr      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("prop_val_yr")));
            var imprvId = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("imprv_id")));

            if (!imprvMap.TryGetValue((propId, yr, imprvId), out var improvementId)) continue;

            var detId    = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("imprv_det_id")));
            var attrId   = Int(rdr, "imprv_attr_id") ?? 0;
            var attrValId = Int(rdr, "i_attr_val_id") ?? 0;
            var key      = (propId, yr, imprvId, detId, attrId);

            if (!seen.Add(key)) continue;

            PacsImprovementAttribute e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsImprovementAttributes.FindAsync(new object[] { eId }, ct)
                    ?? new PacsImprovementAttribute { Id = eId };
            else
                e = new PacsImprovementAttribute();

            e.ImprovementId    = improvementId;
            e.PacsPropId       = propId;
            e.PropValYear      = yr;
            e.PacsImprvId      = imprvId;
            e.PacsImprvDetId   = detId;
            e.PacsImprvAttrId  = attrId;
            e.PacsAttrValId    = attrValId;
            e.SupNum           = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));
            e.AttributeCode    = Str(rdr, "i_attr_val_cd") ?? string.Empty;
            e.AttributeValue   = Dec(rdr, "imprv_attr_val");
            e.AttrUnit         = Dec(rdr, "i_attr_unit");
            e.AttrUnitPrice    = Dec(rdr, "i_attr_up");
            e.AttrFactor       = Dec(rdr, "i_attr_factor");
            e.LastPacsSync     = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsImprovementAttribute: {Total}", total);
        return total;
    }

    // ── 7. PacsLandDetail ────────────────────────────────────────────────

    private async Task<int> SeedLandDetailsAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsLandDetail...");
        // Since tables are freshly truncated, existing will be empty on a full-refresh run.
        // We still load it to support incremental re-runs without truncate.
        var existing = await _db.PacsLandDetails
            .ToDictionaryAsync(
                l => (l.PacsPropId, l.PropValYear, l.PacsLandSegId),
                l => l.Id, ct);
        // Track keys seen in this run to skip PACS source duplicates.
        var seen = new HashSet<(int, int, int)>(existing.Keys);

        // Most-recent substantive year only — historical years balloon the table to millions of rows.
        // sale_id = 0 is MANDATORY: PACS creates sale_id != 0 snapshot copies of land_detail
        // records at time of sale for ratio analysis. These are NOT live assessment values.
        // Use HAVING COUNT >= 1000 to skip sparse stub years (same pattern as owner/valuation fix).
        const string sql = @"
            SELECT * FROM land_detail
            WHERE prop_val_yr = (
                SELECT TOP 1 prop_val_yr
                FROM (
                    SELECT prop_val_yr, COUNT(*) cnt
                    FROM land_detail
                    WHERE (sale_id = 0 OR sale_id IS NULL)
                    GROUP BY prop_val_yr
                    HAVING COUNT(*) >= 1000
                ) x
                ORDER BY prop_val_yr DESC
            )
              AND (sale_id = 0 OR sale_id IS NULL)
            ORDER BY prop_id, prop_val_yr, land_seg_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsLandDetail>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr     = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("prop_val_yr")));
            var segId  = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("land_seg_id")));
            var key    = (propId, yr, segId);

            // Skip PACS source duplicates (same natural key already queued this run).
            if (!seen.Add(key)) continue;

            PacsLandDetail e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsLandDetails.FindAsync(new object[] { eId }, ct)
                    ?? new PacsLandDetail { Id = eId };
            else
                e = new PacsLandDetail();

            e.ParcelId       = parcelId;
            e.PacsPropId     = propId;
            e.PropValYear    = yr;
            e.PacsLandSegId  = segId;
            e.SupNum         = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));

            e.LandTypeCode      = Str(rdr, "land_type_cd");
            e.LandSegDesc       = Str(rdr, "land_seg_desc");
            e.StateCd           = Str(rdr, "state_cd");
            e.LandSegHomesite   = Str(rdr, "land_seg_homesite");
            e.LandClassCode     = Str(rdr, "land_class_cd");
            e.LandInfluenceCode = Str(rdr, "land_influence_cd");
            e.LandSoilCode      = Str(rdr, "land_soil_cd");
            e.AgLandTypeCd      = Str(rdr, "ag_land_type_cd");
            e.LandAdjTypeCd     = Str(rdr, "land_adj_type_cd");
            e.AppraisalCode     = Str(rdr, "appraisal_cd");
            e.PrimaryUseCd      = Str(rdr, "primary_use_cd");
            e.SubUseCd          = Str(rdr, "sub_use_cd");
            e.TypeSchedule      = Str(rdr, "type_schedule");

            e.SizeAcres             = Dec(rdr, "size_acres");
            e.SizeSquareFeet        = Dec(rdr, "size_square_feet");
            e.SizeUseableAcres      = Dec(rdr, "size_useable_acres");
            e.SizeUseableSquareFeet = Dec(rdr, "size_useable_square_feet");
            e.EffSizeAcres          = Dec(rdr, "eff_size_acres");
            e.EffectiveFront        = Dec(rdr, "effective_front");
            e.EffectiveDepth        = Dec(rdr, "effective_depth");
            e.WidthFront            = Dec(rdr, "width_front");
            e.WidthBack             = Dec(rdr, "width_back");
            e.DepthRight            = Dec(rdr, "depth_right");
            e.DepthLeft             = Dec(rdr, "depth_left");
            e.WaterfrontFootage     = Dec(rdr, "waterfront_footage");
            e.NumLots               = Dec(rdr, "num_lots");

            e.MktUnitPrice      = Dec(rdr, "mkt_unit_price");
            e.LandSegMktVal     = Dec(rdr, "land_seg_mkt_val");
            e.MktCalcVal        = Dec(rdr, "mkt_calc_val");
            e.MktAdjVal         = Dec(rdr, "mkt_adj_val");
            e.MktFlatVal        = Dec(rdr, "mkt_flat_val");
            e.MktValSource      = Str(rdr, "mkt_val_source");
            e.LandSegOrigVal    = Dec(rdr, "land_seg_orig_val");
            e.LandSegUp         = Dec(rdr, "land_seg_up");
            e.LandAdjFactor     = Dec(rdr, "land_adj_factor");
            e.LandAdjAmt        = Dec(rdr, "land_adj_amt");
            e.LandMassAdjFactor = Dec(rdr, "land_mass_adj_factor");
            e.OaMktVal          = Dec(rdr, "oa_mkt_val");
            e.NonTaxedMktVal    = Dec(rdr, "non_taxed_mkt_val");
            e.MktapprVal        = Dec(rdr, "mktappr_val");
            e.ArbVal            = Dec(rdr, "arb_val");
            e.DistVal           = Dec(rdr, "dist_val");

            e.AgUseCd    = Str(rdr, "ag_use_cd");
            e.AgUnitPrice = Dec(rdr, "ag_unit_price");
            e.AgVal       = Dec(rdr, "ag_val");
            e.AgCalcVal   = Dec(rdr, "ag_calc_val");
            e.AgFlatVal   = Dec(rdr, "ag_flat_val");
            e.AgLoss      = Dec(rdr, "ag_loss");
            e.AgApply     = Str(rdr, "ag_apply");
            e.NewConstructionFlag = Bool(rdr, "new_imprv_land");
            e.HsPct        = Dec(rdr, "hs_pct");

            e.ApplicationNumber    = Str(rdr, "application_number");
            e.RecordingNumber      = Str(rdr, "recording_number");
            e.AssessmentYrQualified = Dec(rdr, "assessment_yr_qualified");
            e.LastPacsSync         = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsLandDetail: {Total}", total);
        return total;
    }

    // ── 8. PacsOwner ─────────────────────────────────────────────────────

    private async Task<int> SeedOwnersAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsOwner...");
        var existing = await _db.PacsOwners
            .ToDictionaryAsync(
                o => (o.PacsPropId, (int)o.OwnerTaxYear, o.PacsOwnerId),
                o => o.Id, ct);
        var seen = new HashSet<(int, int, int)>(existing.Keys);

        // Most-recent substantive year — MAX(year) may be a sparse stub (e.g. 5 test rows).
        // Pick the highest year that has at least 1,000 rows so we get the real roll.
        const string sql = @"
            SELECT o.*, ac.file_as_name, ac.first_name, ac.last_name
            FROM owner o
            LEFT JOIN account ac ON o.owner_id = ac.acct_id
            WHERE o.owner_tax_yr = (
                SELECT TOP 1 owner_tax_yr
                FROM (
                    SELECT owner_tax_yr, COUNT(*) cnt
                    FROM owner
                    GROUP BY owner_tax_yr
                    HAVING COUNT(*) >= 1000
                ) x
                ORDER BY owner_tax_yr DESC
            )
            ORDER BY o.prop_id, o.owner_tax_yr, o.owner_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsOwner>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("owner_tax_yr")));
            var ownerId = rdr.GetInt32(rdr.GetOrdinal("owner_id"));
            var key     = (propId, yr, ownerId);

            if (!seen.Add(key)) continue;

            PacsOwner e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsOwners.FindAsync(new object[] { eId }, ct)
                    ?? new PacsOwner { Id = eId };
            else
                e = new PacsOwner();

            e.ParcelId    = parcelId;
            e.PacsPropId  = propId;
            e.PacsOwnerId = ownerId;
            e.OwnerTaxYear = yr;
            e.SupNum      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));

            e.FileAsName    = Str(rdr, "file_as_name");
            e.FirstName     = Str(rdr, "first_name");
            e.LastName      = Str(rdr, "last_name");
            e.PctOwnership  = Dec(rdr, "pct_ownership");
            e.TypeOfInterest = Str(rdr, "type_of_int");
            e.HsProp        = Str(rdr, "hs_prop");
            e.Over65Defer   = Str(rdr, "over_65_defer");
            e.AgAppFiled    = Str(rdr, "ag_app_filed");

            e.PctImprvHs  = Dec(rdr, "pct_imprv_hs");
            e.PctImprvNhs = Dec(rdr, "pct_imprv_nhs");
            e.PctLandHs   = Dec(rdr, "pct_land_hs");
            e.PctLandNhs  = Dec(rdr, "pct_land_nhs");
            e.PctAgUse    = Dec(rdr, "pct_ag_use");
            e.PctAgMkt    = Dec(rdr, "pct_ag_mkt");
            e.PctTimUse   = Dec(rdr, "pct_tim_use");
            e.PctTimMkt   = Dec(rdr, "pct_tim_mkt");
            e.PctPersProp = Dec(rdr, "pct_pers_prop");

            e.OwnerComment = Str(rdr, "owner_cmnt");
            e.LinkedCd     = Str(rdr, "linked_cd");
            e.LastPacsSync = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsOwner: {Total}", total);
        return total;
    }

    // ── 8b. PacsOwnerVal (wash_prop_owner_val) ──────────────────────────

    private async Task<int> SeedOwnerValsAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsOwnerVal (wash_prop_owner_val, current year)...");

        const string sql = @"
            SELECT * FROM wash_prop_owner_val
            WHERE year = (
                SELECT TOP 1 year
                FROM (
                    SELECT year, COUNT(*) cnt
                    FROM wash_prop_owner_val
                    GROUP BY year
                    HAVING COUNT(*) >= 1
                ) x
                ORDER BY year DESC
            )
            ORDER BY prop_id, year, sup_num, owner_id";

        _logger.LogInformation("[PacsSeeder] PacsOwnerVal: executing current-year query on SQL Server...");
        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 120 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        _logger.LogInformation("[PacsSeeder] PacsOwnerVal: reader opened, starting row reads.");
        var batch = new List<PacsOwnerVal>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("year")));
            var sup     = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));
            var ownerId = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("owner_id")));

            var e = new PacsOwnerVal();

            e.ParcelId     = parcelId;
            e.PacsPropId   = propId;
            e.PropValYear  = yr;
            e.SupNum       = sup;
            e.PacsOwnerId  = ownerId;

            // Improvement value splits
            e.ImprvHstdVal    = Dec(rdr, "imprv_hstd_val");
            e.ImprvNonHstdVal = Dec(rdr, "imprv_non_hstd_val");

            // Land value splits
            e.LandHstdVal    = Dec(rdr, "land_hstd_val");
            e.LandNonHstdVal = Dec(rdr, "land_non_hstd_val");

            // Timber / Ag market
            e.TimberMarket   = Dec(rdr, "timber_market");
            e.AgMarket       = Dec(rdr, "ag_market");
            e.TimberHsMarket = Dec(rdr, "timber_hs_market");
            e.AgHsMarket     = Dec(rdr, "ag_hs_market");

            // New construction
            e.NewValHs  = Dec(rdr, "new_val_hs");
            e.NewValNhs = Dec(rdr, "new_val_nhs");
            e.NewValP   = Dec(rdr, "new_val_p");

            // Appraised
            e.AppraisedClassified    = Dec(rdr, "appraised_classified");
            e.AppraisedNonClassified = Dec(rdr, "appraised_non_classified");

            // Use values
            e.AgUseVal       = Dec(rdr, "ag_use_val");
            e.AgHsUseVal     = Dec(rdr, "ag_hs_use_val");
            e.TimberUseVal   = Dec(rdr, "timber_use_val");
            e.TimberHsUseVal = Dec(rdr, "timber_hs_use_val");

            // Taxable
            e.TaxableClassified    = Dec(rdr, "taxable_classified");
            e.TaxableNonClassified = Dec(rdr, "taxable_non_classified");

            e.LastPacsSync = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
                _logger.LogInformation("[PacsSeeder] PacsOwnerVal batch saved, total: {Total}", total);
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsOwnerVal: {Total}", total);
        return total;
    }

    // ── 9. PacsSale ──────────────────────────────────────────────────────

    private async Task<int> SeedSalesAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsSale...");
        var existing = await _db.PacsSales
            .ToDictionaryAsync(s => (s.PacsChgOfOwnerId, s.PacsPropId), s => s.Id, ct);
        var seen = new HashSet<(int, int)>(existing.Keys);

        const string sql = @"
            SELECT copa.chg_of_owner_id, copa.prop_id, copa.seq_num,
                   copa.appraised_val, copa.assessed_val, copa.market,
                   copa.land_hstd_val, copa.land_non_hstd_val,
                   copa.imprv_hstd_val, copa.imprv_non_hstd_val,
                   s.sl_dt, s.sl_price,
                   s.adjusted_sl_price  AS adj_sl_price,
                   s.listing_price, s.listing_dt,
                   s.sl_type_cd, s.sl_state_cd, s.sl_class_cd, s.sl_land_type_cd,
                   s.sl_ratio_type_cd, s.sl_ratio_cd,
                   s.sl_county_ratio_cd AS county_ratio_cd,
                   s.sl_qualifier, s.sl_adj_cd, s.sl_financing_cd,
                   s.sales_exclude_calc_cd, s.primary_use_cd, s.secondary_use_cd,
                   s.sl_imprv_type_cd   AS sl_impr_type_code,
                   s.sl_sub_class_cd    AS sl_subclass_cd,
                   s.sl_ratio, s.sl_adj_sl_pct, s.sl_adj_sl_amt,
                   s.sl_adj_rsn         AS sl_adj_reason,
                   s.sl_ratio_cd_reason,
                   s.suppress_on_ratio_rpt_cd,
                   s.suppress_on_ratio_rsn AS suppress_on_ratio_reason,
                   s.realtor,
                   NULL                 AS grantor_name,
                   NULL                 AS grantee_name,
                   s.finance_comment    AS finance_cmnt,
                   s.amt_down, s.amt_financed, s.interest_rate, s.finance_yrs,
                   s.amt_financed_2     AS amt_financed2,
                   s.interest_rate_2    AS interest_rate2,
                   s.finance_yrs_2      AS finance_yrs2,
                   s.sl_yr_blt, s.sl_living_area, s.sl_imprv_unit_price,
                   s.sl_land_sqft, s.sl_land_acres, s.sl_land_front_feet,
                   s.sl_land_depth, s.sl_land_unit_price,
                   s.num_days_on_market, s.land_only_sale, s.continue_current_use,
                   s.confidential_sale  AS confidential,
                   s.wac_cd,
                   s.sl_comment         AS sl_cmnt,
                   s.import_dt,
                   s.monthly_income, s.annual_income,
                   s.pers_prop_val      AS pers_property_val,
                   s.exemption_amount
            FROM chg_of_owner_prop_assoc copa
            INNER JOIN sale s ON copa.chg_of_owner_id = s.chg_of_owner_id
            ORDER BY copa.prop_id, copa.chg_of_owner_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsSale>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId    = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var chgId = rdr.GetInt32(rdr.GetOrdinal("chg_of_owner_id"));
            var key   = (chgId, propId);

            if (!seen.Add(key)) continue;

            PacsSale e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsSales.FindAsync(new object[] { eId }, ct)
                    ?? new PacsSale { Id = eId };
            else
                e = new PacsSale();

            e.ParcelId       = parcelId;
            e.PacsChgOfOwnerId = chgId;
            e.PacsPropId     = propId;
            e.SeqNum         = Int(rdr, "seq_num") ?? 0;

            e.SaleDate        = Dt(rdr, "sl_dt");
            e.SalePrice       = Dec(rdr, "sl_price");
            e.AdjustedSalePrice = Dec(rdr, "adj_sl_price");
            e.ListingPrice    = Dec(rdr, "listing_price");
            e.ListingDate     = Dt(rdr, "listing_dt");

            e.SaleTypeCd         = Str(rdr, "sl_type_cd");
            e.SaleStateCd        = Str(rdr, "sl_state_cd");
            e.SaleClassCd        = Str(rdr, "sl_class_cd");
            e.SaleLandTypeCd     = Str(rdr, "sl_land_type_cd");
            e.SaleRatioTypeCd    = Str(rdr, "sl_ratio_type_cd");
            e.SaleRatioCd        = Str(rdr, "sl_ratio_cd");
            e.SaleCountyRatioCd  = Str(rdr, "county_ratio_cd");
            e.SaleQualifier      = Str(rdr, "sl_qualifier");
            e.SaleAdjCd          = Str(rdr, "sl_adj_cd");
            e.SaleFinancingCd    = Str(rdr, "sl_financing_cd");
            e.SalesExcludeCalcCd = Str(rdr, "sales_exclude_calc_cd");
            e.PrimaryUseCd       = Str(rdr, "primary_use_cd");
            e.SecondaryUseCd     = Str(rdr, "secondary_use_cd");
            e.SaleImprTypeCode   = Str(rdr, "sl_impr_type_code");
            e.SlSubClassCd       = Str(rdr, "sl_subclass_cd");

            e.SaleRatio          = Dec(rdr, "sl_ratio");
            e.SaleAdjSlPct       = Dec(rdr, "sl_adj_sl_pct");
            e.SaleAdjSlAmt       = Dec(rdr, "sl_adj_sl_amt");
            e.SaleAdjReason      = Str(rdr, "sl_adj_reason");
            e.SaleRatioCdReason  = Str(rdr, "sl_ratio_cd_reason");
            e.SuppressOnRatioRptCd = Str(rdr, "suppress_on_ratio_rpt_cd");
            e.SuppressOnRatioReason = Str(rdr, "suppress_on_ratio_reason");

            e.Realtor     = Str(rdr, "realtor");
            e.GrantorName = Str(rdr, "grantor_name");
            e.GranteeName = Str(rdr, "grantee_name");

            e.FinanceComment = Str(rdr, "finance_cmnt");
            e.AmtDown        = Dec(rdr, "amt_down");
            e.AmtFinanced    = Dec(rdr, "amt_financed");
            e.InterestRate   = Dec(rdr, "interest_rate");
            e.FinanceYears   = Dec(rdr, "finance_yrs");
            e.AmtFinanced2   = Dec(rdr, "amt_financed2");
            e.InterestRate2  = Dec(rdr, "interest_rate2");
            e.FinanceYears2  = Dec(rdr, "finance_yrs2");

            e.SlYearBuilt     = Dec(rdr, "sl_yr_blt");
            e.SlLivingArea    = Dec(rdr, "sl_living_area");
            e.SlImprvUnitPrice = Dec(rdr, "sl_imprv_unit_price");
            e.SlLandSqft      = Dec(rdr, "sl_land_sqft");
            e.SlLandAcres     = Dec(rdr, "sl_land_acres");
            e.SlLandFrontFeet = Dec(rdr, "sl_land_front_feet");
            e.SlLandDepth     = Dec(rdr, "sl_land_depth");
            e.SlLandUnitPrice = Dec(rdr, "sl_land_unit_price");

            e.AppraisedVal    = Dec(rdr, "appraised_val");
            e.AssessedVal     = Dec(rdr, "assessed_val");
            e.Market          = Dec(rdr, "market");
            e.LandHstdVal     = Dec(rdr, "land_hstd_val");
            e.LandNonHstdVal  = Dec(rdr, "land_non_hstd_val");
            e.ImprvHstdVal    = Dec(rdr, "imprv_hstd_val");
            e.ImprvNonHstdVal = Dec(rdr, "imprv_non_hstd_val");

            e.MonthlyIncome   = Dec(rdr, "monthly_income");
            e.AnnualIncome    = Dec(rdr, "annual_income");
            e.PersPropertyVal = Dec(rdr, "pers_property_val");
            e.ExemptionAmount = Dec(rdr, "exemption_amount");

            e.NumDaysOnMarket     = Dec(rdr, "num_days_on_market");
            e.LandOnlySale        = Bool(rdr, "land_only_sale");
            e.ContinueCurrentUse  = Bool(rdr, "continue_current_use");
            e.ConfidentialSale    = Str(rdr, "confidential");
            e.WacCd              = Str(rdr, "wac_cd");
            e.SaleComment        = Str(rdr, "sl_cmnt");
            e.ImportDate         = Dt(rdr, "import_dt");
            e.LastPacsSync       = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsSale: {Total}", total);
        return total;
    }

    // ── 10. PacsExemption ────────────────────────────────────────────────

    private async Task<int> SeedExemptionsAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsExemption...");
        var existing = await _db.PacsExemptions
            .ToDictionaryAsync(
                x => (x.PacsPropId, x.PacsOwnerId, (int)x.ExemptTaxYear, x.ExemptTypeCode ?? string.Empty),
                x => x.Id, ct);
        var seenEx = new HashSet<(int, int, int, string)>(existing.Keys);

        const string sql = @"
            SELECT pe.prop_id, pe.owner_id,
                   CAST(pe.exmpt_tax_yr AS int)  AS exmpt_tax_yr,
                   CAST(pe.owner_tax_yr AS int)   AS owner_tax_yr,
                   pe.sup_num, pe.prop_type_cd, pe.exmpt_type_cd, pe.exmpt_subtype_cd,
                   pe.applicant_nm, pe.effective_dt, pe.termination_dt,
                   pe.effective_tax_yr, pe.qualify_yr,
                   pe.review_last_year         AS review_last_yr,
                   pe.apply_pct_owner,
                   pe.exemption_pct            AS exmpt_pct,
                   pe.combined_disp_income,
                   pe.sp_value_type, pe.sp_value_option,
                   pe.sp_date_approved,
                   pe.sp_expiration_date        AS sp_expiration_dt,
                   pe.sp_comment               AS sp_cmnt,
                   pe.absent_flag,
                   pe.absent_expiration_date    AS absent_expiration_dt,
                   pe.absent_comment           AS absent_cmnt,
                   pe.deferral_date, pe.exempt_qualify_cd AS exmpt_qualify_cd,
                   pe.review_request_date       AS review_request_dt,
                   pe.review_status_cd,
                   pe.apply_no_exemption_amount AS apply_no_exmpt_amt,
                   pe.apply_local_option_pct_only
            FROM property_exemption pe
            INNER JOIN property p ON pe.prop_id = p.prop_id
            WHERE pe.exmpt_tax_yr = (
                SELECT TOP 1 exmpt_tax_yr
                FROM (
                    SELECT exmpt_tax_yr, COUNT(*) cnt
                    FROM property_exemption
                    GROUP BY exmpt_tax_yr
                    HAVING COUNT(*) >= 1
                ) x
                ORDER BY exmpt_tax_yr DESC
            )
            ORDER BY pe.prop_id, pe.owner_id, pe.exmpt_tax_yr, pe.exmpt_type_cd";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsExemption>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var ownerId    = rdr.GetInt32(rdr.GetOrdinal("owner_id"));
            var yr         = rdr.GetInt32(rdr.GetOrdinal("exmpt_tax_yr"));
            var typeCode   = Str(rdr, "exmpt_type_cd") ?? string.Empty;
            var key        = (propId, ownerId, yr, typeCode);

            if (!seenEx.Add(key)) continue;

            PacsExemption e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsExemptions.FindAsync(new object[] { eId }, ct)
                    ?? new PacsExemption { Id = eId };
            else
                e = new PacsExemption();

            e.ParcelId      = parcelId;
            e.PacsPropId    = propId;
            e.PacsOwnerId   = ownerId;
            e.ExemptTaxYear = yr;
            e.OwnerTaxYear  = Int(rdr, "owner_tax_yr") ?? yr;
            e.SupNum        = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));

            e.PropTypeCode       = Str(rdr, "prop_type_cd");
            e.ExemptTypeCode     = typeCode;
            e.ExemptSubtypeCode  = Str(rdr, "exmpt_subtype_cd");
            e.ApplicantName      = Str(rdr, "applicant_nm");
            e.EffectiveDate      = Dt(rdr, "effective_dt");
            e.TerminationDate    = Dt(rdr, "termination_dt");
            e.EffectiveTaxYear   = Dec(rdr, "effective_tax_yr");
            e.QualifyYear        = Dec(rdr, "qualify_yr");
            e.ReviewLastYear     = Dec(rdr, "review_last_yr");
            e.ApplyPctOwner      = Dec(rdr, "apply_pct_owner");
            e.ExemptionPct       = Dec(rdr, "exmpt_pct");
            e.CombinedDispIncome = Dec(rdr, "combined_disp_income");

            e.SpValueType    = Str(rdr, "sp_value_type");
            e.SpValueOption  = Str(rdr, "sp_value_option");
            e.SpDateApproved = Dt(rdr, "sp_date_approved");
            e.SpExpirationDate = Dt(rdr, "sp_expiration_dt");
            e.SpComment      = Str(rdr, "sp_cmnt");

            e.AbsentFlag          = Bool(rdr, "absent_flag");
            e.AbsentExpirationDate = Dt(rdr, "absent_expiration_dt");
            e.AbsentComment       = Str(rdr, "absent_cmnt");
            e.DeferralDate        = Dt(rdr, "deferral_date");

            e.ExemptQualifyCd   = Str(rdr, "exmpt_qualify_cd");
            e.ReviewRequestDate = Dt(rdr, "review_request_dt");
            e.ReviewStatusCd    = Str(rdr, "review_status_cd");
            e.ApplyNoExemptionAmount  = Bool(rdr, "apply_no_exmpt_amt");
            e.ApplyLocalOptionPctOnly = Str(rdr, "apply_local_option_pct_only");
            e.LastPacsSync     = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsExemption: {Total}", total);
        return total;
    }

    // ── 11. PacsAppeal ───────────────────────────────────────────────────

    private async Task<int> SeedAppealsAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsAppeal...");
        var existing = await _db.PacsAppeals
            .ToDictionaryAsync(
                a => (a.PacsPropId, (int)a.PropValYear, a.PacsCaseId),
                a => a.Id, ct);
        var seen = new HashSet<(int, int, int)>(existing.Keys);

        const string sql = @"
            SELECT ap.case_id, ap.prop_id, CAST(ap.prop_val_yr AS int) AS prop_val_yr,
                   ap.prot_type, ap.prot_status,
                   ap.status_date_changed               AS status_dt_changed,
                   ap.prot_create_dt                    AS create_dt,
                   ap.prot_complete_dt                  AS complete_dt,
                   ap.prot_full_ratification_dt         AS full_ratification_dt,
                   ap.prot_appraisal_staff              AS apprl_staff,
                   ap.prot_hearing_appraisal_staff      AS hearing_apprl_staff,
                   ap.prot_assigned_panel               AS assigned_panel,
                   ap.prot_hearing_start_dt             AS hearing_start_dt,
                   ap.prot_hearing_finished_dt          AS hearing_finished_dt,
                   ap.prot_arrived_dt                   AS arrived_dt,
                   ap.prot_hearing_rescheduled          AS hearing_rescheduled,
                   ap.prot_full_board_hearing           AS full_board_hearing,
                   ap.appraiser_meeting_date_time       AS apprsr_meeting_dt,
                   ap.appraiser_meeting_appraiser_id    AS apprsr_meeting_apprsr_id,
                   ap.appraiser_meeting_appraiser_comments AS apprsr_meeting_apprsr_cmnt,
                   ap.appraiser_meeting_taxpayer_comments  AS apprsr_meeting_taxpyr_cmnt,
                   ap.prot_taxpayer_doc_requested       AS taxpyr_doc_rqsted,
                   ap.prot_taxpayer_evidence_requested  AS taxpyr_evidence_rqsted,
                   ap.prot_taxpayer_evidence_delivered_dt AS taxpyr_evidence_delivered_dt,
                   ap.prot_first_motion                 AS first_motion,
                   ap.prot_first_motion_decision_cd     AS first_motion_decision_cd,
                   ap.prot_first_motion_decision_dt     AS first_motion_decision_dt,
                   ap.prot_first_motion_pass            AS first_motion_pass,
                   ap.prot_second_motion                AS second_motion,
                   ap.prot_second_motion_decision_cd    AS second_motion_decision_cd,
                   ap.prot_second_motion_decision_dt    AS second_motion_decision_dt,
                   ap.prot_second_motion_pass           AS second_motion_pass,
                   ap.prot_other_motion                 AS other_motion,
                   ap.decision_reason_cd,
                   ap.prot_sustain_district_val         AS sustain_district_val,
                   ap.prot_val_type,
                   ap.prot_comments                     AS prot_cmnt,
                   ap.prot_taxpayer_comments            AS taxpyr_cmnt,
                   ap.prot_district_comments            AS district_cmnt,
                   ap.prot_arb_instructions             AS arb_instructions,
                   ap.prot_appraiser_assigned_val       AS appraiser_assigned_val,
                   ap.prot_arb_assigned_val             AS arb_assigned_val,
                   ap.prot_appraiser_assigned_land_val  AS appraiser_assigned_lnd_val,
                   ap.prot_appraiser_assigned_imprv_val AS appraiser_assigned_imprv_val,
                   ap.prot_boe_assigned_land_val        AS boe_assigned_lnd_val,
                   ap.prot_boe_assigned_imprv_val       AS boe_assigned_imprv_val,
                   ap.opinion_of_value,
                   ap.highly_disputed_property          AS highly_disputed_prop,
                   ap.prot_taxes_paid                   AS taxes_paid,
                   ap.case_prepared,
                   ap.begin_market, ap.begin_appraised_val, ap.begin_assessed_val,
                   ap.begin_land_hstd_val, ap.begin_land_non_hstd_val,
                   ap.begin_imprv_hstd_val, ap.begin_imprv_non_hstd_val,
                   ap.begin_ag_use_val, ap.begin_ag_market,
                   ap.begin_timber_use, ap.begin_timber_market,
                   ap.begin_ten_percent_cap,
                   ap.begin_exemptions                  AS begin_exmpts,
                   ap.begin_entities,
                   ap.final_market, ap.final_appraised_val, ap.final_assessed_val,
                   ap.final_land_hstd_val, ap.final_land_non_hstd_val,
                   ap.final_imprv_hstd_val, ap.final_imprv_non_hstd_val,
                   ap.final_ag_use_val, ap.final_ag_market,
                   ap.final_timber_use, ap.final_timber_market,
                   ap.final_ten_percent_cap,
                   ap.final_exemptions                  AS final_exmpts,
                   ap.final_entities
            FROM _arb_protest ap
            INNER JOIN property p ON ap.prop_id = p.prop_id
            WHERE ap.prop_val_yr = (
                SELECT TOP 1 prop_val_yr
                FROM (
                    SELECT prop_val_yr, COUNT(*) cnt
                    FROM _arb_protest
                    GROUP BY prop_val_yr
                    HAVING COUNT(*) >= 1
                ) x
                ORDER BY prop_val_yr DESC
            )
            ORDER BY ap.prop_id, ap.prop_val_yr, ap.case_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsAppeal>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var caseId = rdr.GetInt32(rdr.GetOrdinal("case_id"));
            var yr     = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("prop_val_yr")));
            var key    = (propId, yr, caseId);

            if (!seen.Add(key)) continue;

            PacsAppeal e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsAppeals.FindAsync(new object[] { eId }, ct)
                    ?? new PacsAppeal { Id = eId };
            else
                e = new PacsAppeal();

            e.ParcelId    = parcelId;
            e.PacsPropId  = propId;
            e.PropValYear = yr;
            e.PacsCaseId  = caseId;

            e.ProtType    = Str(rdr, "prot_type");
            e.ProtStatus  = Str(rdr, "prot_status");
            e.StatusDateChanged = Dt(rdr, "status_dt_changed");
            e.CreateDate  = Dt(rdr, "create_dt");
            e.CompleteDate = Dt(rdr, "complete_dt");
            e.FullRatificationDate = Dt(rdr, "full_ratification_dt");

            e.AppraisalStaff        = Int(rdr, "apprl_staff");
            e.HearingAppraisalStaff = Int(rdr, "hearing_apprl_staff");
            e.AssignedPanel         = Str(rdr, "assigned_panel");

            e.HearingStartDate    = Dt(rdr, "hearing_start_dt");
            e.HearingFinishedDate = Dt(rdr, "hearing_finished_dt");
            e.ArrivedDate         = Dt(rdr, "arrived_dt");
            e.HearingRescheduled  = Str(rdr, "hearing_rescheduled");
            e.FullBoardHearing    = Str(rdr, "full_board_hearing");

            e.AppraiserMeetingDateTime    = Dt(rdr, "apprsr_meeting_dt");
            e.AppraiserMeetingAppraiserId = Int(rdr, "apprsr_meeting_apprsr_id");
            e.AppraiserMeetingAppraiserComments = Str(rdr, "apprsr_meeting_apprsr_cmnt");
            e.AppraiserMeetingTaxpayerComments  = Str(rdr, "apprsr_meeting_taxpyr_cmnt");

            e.TaxpayerDocRequested        = Str(rdr, "taxpyr_doc_rqsted");
            e.TaxpayerEvidenceRequested   = Str(rdr, "taxpyr_evidence_rqsted");
            e.TaxpayerEvidenceDeliveredDate = Dt(rdr, "taxpyr_evidence_delivered_dt");

            e.FirstMotion            = Str(rdr, "first_motion");
            e.FirstMotionDecisionCd  = Str(rdr, "first_motion_decision_cd");
            e.FirstMotionDecisionDate = Dt(rdr, "first_motion_decision_dt");
            e.FirstMotionPass        = Str(rdr, "first_motion_pass");
            e.SecondMotion           = Str(rdr, "second_motion");
            e.SecondMotionDecisionCd = Str(rdr, "second_motion_decision_cd");
            e.SecondMotionDecisionDate = Dt(rdr, "second_motion_decision_dt");
            e.SecondMotionPass       = Str(rdr, "second_motion_pass");
            e.OtherMotion            = Str(rdr, "other_motion");
            e.DecisionReasonCd       = Str(rdr, "decision_reason_cd");
            e.SustainDistrictVal     = Str(rdr, "sustain_district_val");
            e.ProtValType            = Str(rdr, "prot_val_type");

            e.ProtComments     = Str(rdr, "prot_cmnt");
            e.TaxpayerComments = Str(rdr, "taxpyr_cmnt");
            e.DistrictComments = Str(rdr, "district_cmnt");
            e.ArbInstructions  = Str(rdr, "arb_instructions");

            e.AppraiserAssignedVal      = Dec(rdr, "appraiser_assigned_val");
            e.ArbAssignedVal            = Dec(rdr, "arb_assigned_val");
            e.AppraiserAssignedLandVal  = Dec(rdr, "appraiser_assigned_lnd_val");
            e.AppraiserAssignedImprvVal = Dec(rdr, "appraiser_assigned_imprv_val");
            e.BoeAssignedLandVal        = Dec(rdr, "boe_assigned_lnd_val");
            e.BoeAssignedImprvVal       = Dec(rdr, "boe_assigned_imprv_val");
            e.OpinionOfValue            = Dec(rdr, "opinion_of_value");

            e.HighlyDisputedProperty = Bool(rdr, "highly_disputed_prop");
            e.TaxesPaid              = Bool(rdr, "taxes_paid");
            e.CasePrepared           = Bool(rdr, "case_prepared");

            e.BeginMarket        = Dec(rdr, "begin_market");
            e.BeginAppraisedVal  = Dec(rdr, "begin_appraised_val");
            e.BeginAssessedVal   = Dec(rdr, "begin_assessed_val");
            e.BeginLandHstdVal   = Dec(rdr, "begin_land_hstd_val");
            e.BeginLandNonHstdVal = Dec(rdr, "begin_land_non_hstd_val");
            e.BeginImprvHstdVal  = Dec(rdr, "begin_imprv_hstd_val");
            e.BeginImprvNonHstdVal = Dec(rdr, "begin_imprv_non_hstd_val");
            e.BeginAgUseVal      = Dec(rdr, "begin_ag_use_val");
            e.BeginAgMarket      = Dec(rdr, "begin_ag_market");
            e.BeginTimberUse     = Dec(rdr, "begin_timber_use");
            e.BeginTimberMarket  = Dec(rdr, "begin_timber_market");
            e.BeginTenPercentCap = Dec(rdr, "begin_ten_percent_cap");
            e.BeginExemptions    = Str(rdr, "begin_exmpts");
            e.BeginEntities      = Str(rdr, "begin_entities");

            e.FinalMarket        = Dec(rdr, "final_market");
            e.FinalAppraisedVal  = Dec(rdr, "final_appraised_val");
            e.FinalAssessedVal   = Dec(rdr, "final_assessed_val");
            e.FinalLandHstdVal   = Dec(rdr, "final_land_hstd_val");
            e.FinalLandNonHstdVal = Dec(rdr, "final_land_non_hstd_val");
            e.FinalImprvHstdVal  = Dec(rdr, "final_imprv_hstd_val");
            e.FinalImprvNonHstdVal = Dec(rdr, "final_imprv_non_hstd_val");
            e.FinalAgUseVal      = Dec(rdr, "final_ag_use_val");
            e.FinalAgMarket      = Dec(rdr, "final_ag_market");
            e.FinalTimberUse     = Dec(rdr, "final_timber_use");
            e.FinalTimberMarket  = Dec(rdr, "final_timber_market");
            e.FinalTenPercentCap = Dec(rdr, "final_ten_percent_cap");
            e.FinalExemptions    = Str(rdr, "final_exmpts");
            e.FinalEntities      = Str(rdr, "final_entities");
            e.LastPacsSync       = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsAppeal: {Total}", total);
        return total;
    }

    // ── 12. PacsTaxArea ──────────────────────────────────────────────────

    private async Task<int> SeedTaxAreasAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsTaxArea...");
        var existing = await _db.PacsTaxAreas
            .ToDictionaryAsync(
                t => (t.PacsPropId, (int)t.TaxYear),
                t => t.Id, ct);
        var seen = new HashSet<(int, int)>(existing.Keys);

        const string sql = @"
            SELECT pta.prop_id, CAST(pta.year AS int) AS tax_yr,
                   pta.sup_num, pta.tax_area_id, pta.tax_area_id_pending,
                   pta.effective_date AS effective_dt, pta.is_annex_value,
                   ta.tax_area_number, ta.tax_area_state, ta.tax_area_description, ta.comment
            FROM property_tax_area pta
            INNER JOIN tax_area ta ON pta.tax_area_id = ta.tax_area_id
            INNER JOIN property p  ON pta.prop_id = p.prop_id
            WHERE pta.year = (
                SELECT TOP 1 year
                FROM (
                    SELECT year, COUNT(*) cnt
                    FROM property_tax_area
                    GROUP BY year
                    HAVING COUNT(*) >= 1000
                ) x
                ORDER BY year DESC
            )
            ORDER BY pta.prop_id, pta.year";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsTaxArea>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr  = rdr.GetInt32(rdr.GetOrdinal("tax_yr"));
            var key = (propId, yr);

            if (!seen.Add(key)) continue;

            PacsTaxArea e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsTaxAreas.FindAsync(new object[] { eId }, ct)
                    ?? new PacsTaxArea { Id = eId };
            else
                e = new PacsTaxArea();

            e.ParcelId           = parcelId;
            e.PacsPropId         = propId;
            e.TaxYear            = yr;
            e.SupNum             = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));
            e.PacsTaxAreaId      = rdr.GetInt32(rdr.GetOrdinal("tax_area_id"));
            e.TaxAreaIdPending   = Int(rdr, "tax_area_id_pending");
            e.EffectiveDate      = Dt(rdr, "effective_dt");
            e.IsAnnexValue       = Bool(rdr, "is_annex_value");
            e.TaxAreaNumber      = Str(rdr, "tax_area_number");
            e.TaxAreaState       = Str(rdr, "tax_area_state");
            e.TaxAreaDescription = Str(rdr, "tax_area_description");
            e.Comment            = Str(rdr, "comment");
            e.LastPacsSync       = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsTaxArea: {Total}", total);
        return total;
    }

    // ── 13. PacsTaxAreaAssoc ────────────────────────────────────────────

    private async Task<int> SeedTaxAreaAssocsAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsTaxAreaAssoc (wash_prop_owner_tax_area_assoc, current year)...");

        const string sql = @"
            SELECT * FROM wash_prop_owner_tax_area_assoc
            WHERE year = (
                SELECT TOP 1 year
                FROM (
                    SELECT year, COUNT(*) cnt
                    FROM wash_prop_owner_tax_area_assoc
                    GROUP BY year
                    HAVING COUNT(*) >= 1
                ) x
                ORDER BY year DESC
            )
            ORDER BY prop_id, year, sup_num, owner_id";

        _logger.LogInformation("[PacsSeeder] PacsTaxAreaAssoc: executing current-year query on SQL Server...");
        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 120 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        _logger.LogInformation("[PacsSeeder] PacsTaxAreaAssoc: reader opened, starting row reads.");
        var batch = new List<PacsTaxAreaAssoc>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("year")));
            var sup     = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));
            var ownerId = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("owner_id")));
            var taxAreaOrd = rdr.GetOrdinal("tax_area_id");
            var taxArea = rdr.IsDBNull(taxAreaOrd)
                ? string.Empty
                : Convert.ToString(rdr.GetValue(taxAreaOrd))?.Trim() ?? string.Empty;

            var e = new PacsTaxAreaAssoc();

            e.ParcelId     = parcelId;
            e.PacsPropId   = propId;
            e.PropValYear  = yr;
            e.SupNum       = sup;
            e.PacsOwnerId  = ownerId;
            e.TaxAreaId    = taxArea;

            e.LastPacsSync = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
                _logger.LogInformation("[PacsSeeder] PacsTaxAreaAssoc batch saved, total: {Total}", total);
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsTaxAreaAssoc: {Total}", total);
        return total;
    }

    // ── 14. PacsPropertyProfile ───────────────────────────────────────────

    private async Task<int> SeedPropertyProfilesAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsPropertyProfile...");
        var existing = await _db.PacsPropertyProfiles
            .ToDictionaryAsync(
                pp => (pp.PacsPropId, pp.PropValYear),
                pp => pp.Id, ct);
        var seen = new HashSet<(int, int)>(existing.Keys);

        // Substantive year: skip sparse stub years (HAVING >= 1000).
        // Falls back to MAX if no year has >= 1000 rows (small tables like this one).
        const string sql = @"
            SELECT * FROM property_profile
            WHERE prop_val_yr = (
                SELECT TOP 1 prop_val_yr
                FROM (
                    SELECT prop_val_yr, COUNT(*) cnt
                    FROM property_profile
                    GROUP BY prop_val_yr
                    HAVING COUNT(*) >= 1
                ) x
                ORDER BY prop_val_yr DESC
            )
            ORDER BY prop_id, prop_val_yr";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsPropertyProfile>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr  = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("prop_val_yr")));
            var key = (propId, yr);

            if (!seen.Add(key)) continue;

            PacsPropertyProfile e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsPropertyProfiles.FindAsync(new object[] { eId }, ct)
                    ?? new PacsPropertyProfile { Id = eId };
            else
                e = new PacsPropertyProfile();

            e.ParcelId    = parcelId;
            e.PacsPropId  = propId;
            e.PropValYear = yr;
            e.SupNum      = Convert.ToInt32(rdr.GetValue(rdr.GetOrdinal("sup_num")));

            // Classification
            e.ClassCode          = Str(rdr, "class_cd");
            e.StateCd            = Str(rdr, "state_cd");
            e.PropertyUseCd      = Str(rdr, "property_use_cd");
            e.ImprvTypeCode      = Str(rdr, "imprv_type_cd");
            e.ImprvDetSubClassCd = Str(rdr, "imprv_det_sub_class_cd");
            e.NumImprv           = Int(rdr, "num_imprv");

            // Building characteristics
            e.YearBuilt          = Dec(rdr, "yr_blt");
            e.ActualYearBuilt    = Dec(rdr, "actual_year_built");
            e.EffectiveYearBuilt = Dec(rdr, "eff_yr_blt");
            e.ActualAge          = Int(rdr, "actual_age");
            e.LivingArea         = Dec(rdr, "living_area");
            e.ConditionCode      = Str(rdr, "condition_cd");
            e.PercentComplete    = Dec(rdr, "percent_complete");
            e.HeatAcCode         = Str(rdr, "heat_ac_code");
            e.ClassCdHighValueImprv    = Str(rdr, "class_cd_highvalueimprov");
            e.LivingAreaHighValueImprv = Dec(rdr, "living_area_highvalueimprov");

            // Improvement valuation
            e.ImprvUnitPrice = Dec(rdr, "imprv_unit_price");
            e.ImprvAddVal    = Dec(rdr, "imprv_add_val");
            e.AppraisedVal   = Dec(rdr, "appraised_val");

            // Land measurements
            e.LandTypeCode    = Str(rdr, "land_type_cd");
            e.LandSqft        = Dec(rdr, "land_sqft");
            e.LandAcres       = Dec(rdr, "land_acres");
            e.LandTotalAcres  = Dec(rdr, "land_total_acres");
            e.LandUseableAcres = Dec(rdr, "land_useable_acres");
            e.LandUseableSqft  = Dec(rdr, "land_useable_sqft");
            e.LandFrontFeet   = Dec(rdr, "land_front_feet");
            e.LandDepth       = Dec(rdr, "land_depth");
            e.LandNumLots     = Dec(rdr, "land_num_lots");
            e.LandTotalSqft   = Dec(rdr, "land_total_sqft");

            // Land valuation
            e.LandUnitPrice     = Dec(rdr, "land_unit_price");
            e.MainLandUnitPrice = Dec(rdr, "main_land_unit_price");
            e.MainLandTotalAdj  = Dec(rdr, "main_land_total_adj");
            e.LandApprMethod    = Str(rdr, "land_appr_method");
            e.LsTable           = Str(rdr, "ls_table");
            e.SizeAdjPct        = Dec(rdr, "size_adj_pct");

            // Geographic / market
            e.NeighborhoodCode = Str(rdr, "neighborhood");
            e.RegionCode       = Str(rdr, "region");
            e.AbsSubdv         = Str(rdr, "abs_subdv");
            e.SubsetCode       = Str(rdr, "subset");
            e.MapId            = Str(rdr, "map_id");
            e.SubMarketCd      = Str(rdr, "sub_market_cd");

            // Site characteristics
            e.Zoning                = Str(rdr, "zoning");
            e.CharacteristicZoning1 = Str(rdr, "characteristic_zoning1");
            e.CharacteristicZoning2 = Str(rdr, "characteristic_zoning2");
            e.CharacteristicView    = Str(rdr, "characteristic_view");
            e.VisibilityAccessCd    = Str(rdr, "visibility_access_cd");
            e.RoadAccess            = Str(rdr, "road_access");
            e.Utilities             = Str(rdr, "utilities");
            e.Topography            = Str(rdr, "topography");
            e.SchoolId              = Int(rdr, "school_id");
            e.CityId                = Int(rdr, "city_id");
            e.LastAppraisalDate     = Dt(rdr, "last_appraisal_dt");

            // Mobile home
            e.MobileHomeMake      = Str(rdr, "mbl_hm_make");
            e.MobileHomeModel     = Str(rdr, "mbl_hm_model");
            e.MobileHomeSerialNum = Str(rdr, "mbl_hm_sn");
            e.MobileHomeHudNum    = Str(rdr, "mbl_hm_hud_num");
            e.MobileHomeTitleNum  = Str(rdr, "mbl_hm_title_num");

            e.LastPacsSync = DateTime.UtcNow;

            batch.Add(e);
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsPropertyProfile: {Total}", total);
        return total;
    }

    // ── Generic Batch Upsert ─────────────────────────────────────────────

    private async Task<int> UpsertAsync<T>(List<T> batch, CancellationToken ct)
        where T : class
    {
        foreach (var entity in batch)
        {
            var entry = _db.Entry(entity);
            if (entry.State == EntityState.Detached)
                _db.Set<T>().Add(entity);
        }
        try
        {
            await _db.SaveChangesAsync(ct);
            _db.ChangeTracker.Clear();
            return batch.Count;
        }
        catch (Exception batchEx)
        {
            // Batch failed — clear the aborted transaction state and retry row-by-row
            // so one bad row doesn't lose the other 999.
            _db.ChangeTracker.Clear();
            _logger.LogWarning("[PacsSeeder] Batch of {Count} {Type} failed ({Msg}); retrying row-by-row.",
                batch.Count, typeof(T).Name, batchEx.InnerException?.Message ?? batchEx.Message);

            var saved = 0;
            var skipped = 0;
            foreach (var entity in batch)
            {
                try
                {
                    _db.Set<T>().Add(entity);
                    await _db.SaveChangesAsync(ct);
                    _db.ChangeTracker.Clear();
                    saved++;
                }
                catch (Exception rowEx)
                {
                    _db.ChangeTracker.Clear();
                    skipped++;
                    if (skipped <= 5) // cap log noise
                        _logger.LogWarning("[PacsSeeder] Skipped 1 {Type} row: {Msg}",
                            typeof(T).Name, rowEx.InnerException?.Message ?? rowEx.Message);
                }
            }
            _logger.LogInformation("[PacsSeeder] Row-by-row result: {Saved} saved, {Skipped} skipped.",
                saved, skipped);
            return saved;
        }
    }

    // ── Null-Safe Column Readers ─────────────────────────────────────────

    private static string? Str(SqlDataReader r, string col)
    {
        try
        {
            var ord = r.GetOrdinal(col);
            return r.IsDBNull(ord) ? null : r.GetString(ord).Trim();
        }
        catch { return null; }
    }

    private static decimal? Dec(SqlDataReader r, string col)
    {
        try
        {
            var ord = r.GetOrdinal(col);
            if (r.IsDBNull(ord)) return null;
            return r.GetFieldValue<decimal>(ord);
        }
        catch { return null; }
    }

    private static int? Int(SqlDataReader r, string col)
    {
        try
        {
            var ord = r.GetOrdinal(col);
            if (r.IsDBNull(ord)) return null;
            var val = r.GetValue(ord);
            return Convert.ToInt32(val);
        }
        catch { return null; }
    }

    private static DateTime? Dt(SqlDataReader r, string col)
    {
        try
        {
            var ord = r.GetOrdinal(col);
            if (r.IsDBNull(ord)) return null;
            var dt = r.GetDateTime(ord);
            // PostgreSQL 'timestamp with time zone' requires DateTimeKind.Utc.
            // PACS SQL Server dates are stored as local/unspecified — treat as UTC.
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }
        catch { return null; }
    }

    private static bool? Bool(SqlDataReader r, string col)
    {
        try
        {
            var ord = r.GetOrdinal(col);
            if (r.IsDBNull(ord)) return null;
            var val = r.GetValue(ord);
            return val switch
            {
                bool b     => b,
                byte by    => by != 0,
                int i      => i != 0,
                string s   => s is "Y" or "y" or "1" or "true",
                _          => Convert.ToBoolean(val)
            };
        }
        catch { return null; }
    }
}

// ── Result DTO ────────────────────────────────────────────────────────────────

public sealed record PacsSeederResult
{
    public int Parcels                { get; set; }
    public int Situs                  { get; set; }
    public int Valuations             { get; set; }
    public int Improvements           { get; set; }
    public int ImprovementDetails     { get; set; }
    public int ImprovementAttributes  { get; set; }
    public int LandDetails            { get; set; }
    public int Owners                 { get; set; }
    public int OwnerVals              { get; set; }
    public int Sales                  { get; set; }
    public int Exemptions             { get; set; }
    public int Appeals                { get; set; }
    public int TaxAreas               { get; set; }
    public int TaxAreaAssocs          { get; set; }
    public int PropertyProfiles        { get; set; }

    public override string ToString() =>
        $"Parcels={Parcels} Situs={Situs} Vals={Valuations} " +
        $"Imprv={Improvements} Det={ImprovementDetails} Attr={ImprovementAttributes} " +
        $"Land={LandDetails} Owners={Owners} OwnerVals={OwnerVals} Sales={Sales} " +
        $"Exemptions={Exemptions} Appeals={Appeals} TaxAreas={TaxAreas} " +
        $"TaxAreaAssocs={TaxAreaAssocs} Profiles={PropertyProfiles}";
}
