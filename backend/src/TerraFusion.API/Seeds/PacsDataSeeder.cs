using System.Data;
using Microsoft.Data.SqlClient;
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

        var result = new PacsSeederResult();

        await using var pacs = new SqlConnection(cs);
        await pacs.OpenAsync(ct);
        _logger.LogInformation("[PacsSeeder] Connected to pacs_oltp. Starting full ETL.");

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
        result.Owners      = await SeedOwnersAsync(pacs, propMap, ct);
        result.Sales       = await SeedSalesAsync(pacs, propMap, ct);
        result.Exemptions  = await SeedExemptionsAsync(pacs, propMap, ct);
        result.Appeals     = await SeedAppealsAsync(pacs, propMap, ct);
        result.TaxAreas    = await SeedTaxAreasAsync(pacs, propMap, ct);

        _logger.LogInformation("[PacsSeeder] Complete. {Summary}", result);
        return result;
    }

    // ── 1. PacsParcel ─────────────────────────────────────────────────────

    private async Task<Dictionary<int, Guid>> SeedParcelsAsync(
        SqlConnection pacs, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsParcel...");
        var existing = await _db.PacsParcel
            .ToDictionaryAsync(p => p.PropId, p => p.Id, ct);

        const string sql = @"
            SELECT prop_id, geo_id, simple_geo_id, prop_type_cd, state_cd,
                   zoning, utilities, topo, road_access, prop_cmnt, prop_create_dt
            FROM property
            WHERE prop_inactive_dt IS NULL
            ORDER BY prop_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsParcel>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));

            PacsParcel e;
            if (existing.TryGetValue(propId, out var guid))
                e = await _db.PacsParcel.FindAsync(new object[] { guid }, ct)
                    ?? new PacsParcel { Id = guid };
            else
            {
                e = new PacsParcel();
                existing[propId] = e.Id;
            }

            e.PropId      = propId;
            e.CountyId    = BentonCountyId;
            e.PropTypeCd  = Str(rdr, "prop_type_cd") ?? string.Empty;
            e.GeoId       = Str(rdr, "geo_id");
            e.SimpleGeoId = Str(rdr, "simple_geo_id");
            e.StateCd     = Str(rdr, "state_cd");
            e.Zoning      = Str(rdr, "zoning");
            e.Topography  = Str(rdr, "topo");
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
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsParcel: {Total}", total);
        return existing;
    }

    // ── 2. PacsSitus ──────────────────────────────────────────────────────

    private async Task<int> SeedSitusAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsSitus...");
        var existing = await _db.PacsSituses
            .ToDictionaryAsync(s => (s.PacsPropId, s.PacsSitusId), s => s.Id, ct);

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
            WHERE p.prop_inactive_dt IS NULL
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

            PacsSitus e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsSituses.FindAsync(new object[] { eId }, ct)
                    ?? new PacsSitus { Id = eId };
            else
            {
                e = new PacsSitus();
                existing[key] = e.Id;
            }

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
        _logger.LogInformation("[PacsSeeder] Seeding PacsValuation...");
        var existing = await _db.PacsValuations
            .ToDictionaryAsync(v => (v.PacsPropId, v.PropValYear, v.SupNum), v => v.Id, ct);

        // prop_supp_assoc join: pulls only current supplement, non-sale records
        const string sql = @"
            SELECT
                pv.prop_id, CAST(pv.prop_val_yr AS int) AS prop_val_yr, pv.sup_num,
                pv.appraised_val, pv.assessed_val, pv.market, pv.imprv_val,
                pv.land_hstd_val, pv.land_non_hstd_val,
                pv.imprv_hstd_val, pv.imprv_non_hstd_val,
                pv.ag_use_val, pv.ag_market, pv.ag_loss, pv.ag_late_loss,
                pv.ag_hs_use_val, pv.ag_hs_mkt_val, pv.ag_hs_loss,
                pv.timber_78, pv.timber_market, pv.timber_use, pv.timber_loss,
                pv.timber_late_loss, pv.timber_hs_use_val, pv.timber_hs_mkt_val, pv.timber_hs_loss,
                pv.ten_percent_cap, pv.freeze_ceiling, pv.freeze_yr,
                pv.hscap_qualify_yr, pv.hscap_base_yr,
                pv.hscap_prev_hs_val, pv.hscap_new_hs_val, pv.hscap_prev_reappr_yr,
                pv.last_appraisal_yr,
                pv.new_val, pv.new_val_hs, pv.new_val_nhs,
                pv.new_val_imprv_hs, pv.new_val_imprv_nhs,
                pv.new_val_land_hs, pv.new_val_land_nhs, pv.new_yr,
                pv.remodel_val_curr_yr,
                pv.cost_value, pv.cost_market,
                pv.cost_land_hstd_val, pv.cost_land_non_hstd_val,
                pv.cost_imprv_hstd_val, pv.cost_imprv_non_hstd_val,
                pv.cost_ag_use_val, pv.cost_ag_market,
                pv.income_value, pv.income_market,
                pv.income_land_hstd_val, pv.income_land_non_hstd_val,
                pv.income_imprv_hstd_val, pv.income_imprv_non_hstd_val,
                pv.mktappr_market,
                pv.mktappr_imprv_hstd_val, pv.mktappr_imprv_non_hstd_val,
                pv.mktappr_land_hstd_val, pv.mktappr_land_non_hstd_val,
                pv.arb_market,
                pv.arb_land_hstd_val, pv.arb_land_non_hstd_val,
                pv.arb_imprv_hstd_val, pv.arb_imprv_non_hstd_val,
                pv.arb_ag_use_val, pv.arb_ag_market,
                pv.rendered_val, pv.rendered_yr,
                pv.pp_mkt_val, pv.pp_appraised_val,
                pv.legal_desc, pv.legal_acres,
                pv.nbhd_cd, pv.abs_subdv_cd, pv.rgn_cd, pv.twnshp_cd, pv.rnge_cd,
                pv.map_id, pv.subset_cd,
                pv.appraiser_id, pv.last_appraiser_id,
                pv.next_appraiser_id, pv.value_appraiser_id, pv.land_appraiser_id,
                pv.last_appraisal_dt, pv.next_appraisal_dt, pv.next_appraisal_rsn,
                pv.last_actual_appraisal_dt, pv.recalc_dt,
                pv.lat, pv.long,
                pv.udi_parent, pv.udi_parent_prop_id, pv.udi_status,
                pv.prop_type_cd, pv.property_use_cd, pv.secondary_use_cd,
                pv.sub_market_cd, pv.visibility_access_cd, pv.appr_method,
                pv.sub_type, pv.prop_state, pv.cycle,
                pv.sup_cd, pv.sup_desc, pv.sup_dt, pv.sup_action, pv.sup_cmnt,
                pv.change_dt, pv.prop_inactive_dt, pv.notice_mail_dt,
                pv.vit_flag, pv.has_locked_values,
                pv.abated_pct, pv.abated_amt, pv.abated_yr,
                pv.tif_imprv_val, pv.tif_land_val, pv.tif_flag,
                pv.school_dist_cd, pv.city_cd, pv.county_cd
            FROM property_val pv
            INNER JOIN prop_supp_assoc psa
                ON pv.prop_id = psa.prop_id
               AND pv.prop_val_yr = psa.owner_tax_yr
               AND pv.sup_num = psa.sup_num
            WHERE pv.prop_inactive_dt IS NULL
              AND (psa.sale_id = 0 OR psa.sale_id IS NULL)
            ORDER BY pv.prop_id, pv.prop_val_yr, pv.sup_num";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 600 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsValuation>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr  = rdr.GetInt32(rdr.GetOrdinal("prop_val_yr"));
            var sup = rdr.GetInt32(rdr.GetOrdinal("sup_num"));
            var key = (propId, yr, sup);

            PacsValuation e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsValuations.FindAsync(new object[] { eId }, ct)
                    ?? new PacsValuation { Id = eId };
            else
            {
                e = new PacsValuation();
                existing[key] = e.Id;
            }

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

        const string sql = @"
            SELECT i.prop_id, CAST(i.prop_val_yr AS int) AS prop_val_yr,
                   i.imprv_id, i.sup_num,
                   i.imprv_type_cd, i.imprv_state_cd, i.imprv_desc,
                   i.misc_cd, i.primary_imprv, i.imprv_homesite,
                   i.num_imprv, i.building_number, i.building_name,
                   i.imprv_val, i.orig_val, i.base_val, i.calc_val,
                   i.adjusted_val, i.flat_val, i.arb_val, i.dist_val,
                   i.income_val, i.mktappr_val, i.locked_val,
                   i.living_area_up, i.imprv_adj_amt, i.imprv_adj_factor,
                   i.imprv_mass_adj_factor, i.value_type, i.imprv_val_source,
                   i.imp_new_yr, i.imp_new_val,
                   i.economic_pct, i.physical_pct, i.functional_pct, i.dep_pct,
                   i.economic_cmnt, i.physical_cmnt, i.functional_cmnt, i.dep_cmnt,
                   i.depreciation_yr, i.yr_built, i.yr_renovated,
                   i.actual_age, i.eff_age, i.percent_complete,
                   i.stories_cnt, i.stories_tot,
                   i.imprv_cmnt, i.image_path,
                   i.mbl_hm_sn1, i.mbl_hm_sn2, i.mbl_hm_sn3,
                   i.mbl_hm_hud1, i.mbl_hm_hud2, i.mbl_hm_hud3
            FROM imprv i
            INNER JOIN property p ON i.prop_id = p.prop_id
            INNER JOIN prop_supp_assoc psa
                ON i.prop_id = psa.prop_id
               AND i.prop_val_yr = psa.owner_tax_yr
               AND i.sup_num = psa.sup_num
            WHERE p.prop_inactive_dt IS NULL
              AND (psa.sale_id = 0 OR psa.sale_id IS NULL)
            ORDER BY i.prop_id, i.prop_val_yr, i.imprv_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsImprovement>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr      = rdr.GetInt32(rdr.GetOrdinal("prop_val_yr"));
            var imprvId = rdr.GetInt32(rdr.GetOrdinal("imprv_id"));
            var key     = (propId, yr, imprvId);

            PacsImprovement e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsImprovements.FindAsync(new object[] { eId }, ct)
                    ?? new PacsImprovement { Id = eId };
            else
            {
                e = new PacsImprovement();
                existing[key] = e.Id;
            }

            e.ParcelId     = parcelId;
            e.PacsPropId   = propId;
            e.PropValYear  = yr;
            e.PacsImprvId  = imprvId;
            e.SupNum       = rdr.GetInt32(rdr.GetOrdinal("sup_num"));

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
            if (batch.Count >= BatchSize)
            {
                total += await UpsertAsync(batch, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) total += await UpsertAsync(batch, ct);
        _logger.LogInformation("[PacsSeeder] PacsImprovement: {Total}", total);
        return existing;
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

        const string sql = @"
            SELECT d.prop_id, CAST(d.prop_val_yr AS int) AS prop_val_yr,
                   d.imprv_id, d.imprv_det_id, d.sup_num, d.seq_num,
                   d.imprv_det_class_cd, d.imprv_det_meth_cd, d.imprv_det_type_cd,
                   d.imprv_det_sub_class_cd, d.imprv_det_desc,
                   d.cond_cd, d.lease_class,
                   d.imprv_det_area, d.imprv_det_area_type,
                   d.cubic_area, d.calc_area, d.sketch_area, d.net_rentable_area,
                   d.perimeter, d.length, d.width, d.height,
                   d.stories, d.stories_tot, d.floor_id, d.num_units, d.load_factor,
                   d.yr_built, d.yr_new, d.dep_yr, d.eff_tax_yr, d.actual_age,
                   d.percent_complete, d.percent_complete_cmnt,
                   d.imprv_det_val, d.imprv_det_val_source,
                   d.unit_price, d.adj_unit_price, d.adj_val, d.calc_val, d.flat_val,
                   d.drpc_new, d.drpc,
                   d.economic_pct, d.physical_pct, d.functional_pct, d.dep_pct,
                   d.economic_cmnt, d.physical_cmnt, d.functional_cmnt,
                   d.sketch_cmds
            FROM imprv_detail d
            INNER JOIN property p ON d.prop_id = p.prop_id
            INNER JOIN prop_supp_assoc psa
                ON d.prop_id = psa.prop_id
               AND d.prop_val_yr = psa.owner_tax_yr
               AND d.sup_num = psa.sup_num
            WHERE p.prop_inactive_dt IS NULL
              AND (psa.sale_id = 0 OR psa.sale_id IS NULL)
            ORDER BY d.prop_id, d.prop_val_yr, d.imprv_id, d.imprv_det_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsImprovementDetail>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            var yr      = rdr.GetInt32(rdr.GetOrdinal("prop_val_yr"));
            var imprvId = rdr.GetInt32(rdr.GetOrdinal("imprv_id"));
            var detId   = rdr.GetInt32(rdr.GetOrdinal("imprv_det_id"));

            if (!imprvMap.TryGetValue((propId, yr, imprvId), out var improvementId)) continue;

            var key = (propId, yr, imprvId, detId);
            PacsImprovementDetail e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsImprovementDetails.FindAsync(new object[] { eId }, ct)
                    ?? new PacsImprovementDetail { Id = eId };
            else
            {
                e = new PacsImprovementDetail();
                existing[key] = e.Id;
            }

            e.ImprovementId    = improvementId;
            e.PacsPropId       = propId;
            e.PropValYear      = yr;
            e.PacsImprvId      = imprvId;
            e.PacsImprvDetId   = detId;
            e.SupNum           = rdr.GetInt32(rdr.GetOrdinal("sup_num"));
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

        const string sql = @"
            SELECT a.prop_id, CAST(a.prop_val_yr AS int) AS prop_val_yr,
                   a.imprv_id, a.imprv_det_id,
                   ISNULL(a.imprv_attr_id, 0) AS imprv_attr_id,
                   a.sup_num, a.i_attr_val_id,
                   a.i_attr_val_cd, a.imprv_attr_val,
                   a.i_attr_unit, a.i_attr_up, a.i_attr_factor
            FROM imprv_attr a
            INNER JOIN property p ON a.prop_id = p.prop_id
            INNER JOIN prop_supp_assoc psa
                ON a.prop_id = psa.prop_id
               AND a.prop_val_yr = psa.owner_tax_yr
               AND a.sup_num = psa.sup_num
            WHERE p.prop_inactive_dt IS NULL
              AND (psa.sale_id = 0 OR psa.sale_id IS NULL)
            ORDER BY a.prop_id, a.prop_val_yr, a.imprv_id, a.imprv_det_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsImprovementAttribute>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            var yr      = rdr.GetInt32(rdr.GetOrdinal("prop_val_yr"));
            var imprvId = rdr.GetInt32(rdr.GetOrdinal("imprv_id"));

            if (!imprvMap.TryGetValue((propId, yr, imprvId), out var improvementId)) continue;

            var detId    = rdr.GetInt32(rdr.GetOrdinal("imprv_det_id"));
            var attrId   = Int(rdr, "imprv_attr_id") ?? 0;
            var attrValId = Int(rdr, "i_attr_val_id") ?? 0;
            var key      = (propId, yr, imprvId, detId, attrId);

            PacsImprovementAttribute e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsImprovementAttributes.FindAsync(new object[] { eId }, ct)
                    ?? new PacsImprovementAttribute { Id = eId };
            else
            {
                e = new PacsImprovementAttribute();
                existing[key] = e.Id;
            }

            e.ImprovementId    = improvementId;
            e.PacsPropId       = propId;
            e.PropValYear      = yr;
            e.PacsImprvId      = imprvId;
            e.PacsImprvDetId   = detId;
            e.PacsImprvAttrId  = attrId;
            e.PacsAttrValId    = attrValId;
            e.SupNum           = rdr.GetInt32(rdr.GetOrdinal("sup_num"));
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
        var existing = await _db.PacsLandDetails
            .ToDictionaryAsync(
                l => (l.PacsPropId, l.PropValYear, l.PacsLandSegId),
                l => l.Id, ct);

        const string sql = @"
            SELECT l.prop_id, CAST(l.prop_val_yr AS int) AS prop_val_yr,
                   l.land_seg_id, l.sup_num,
                   l.land_type_cd, l.land_seg_desc, l.state_cd,
                   l.land_seg_homesite, l.land_class_cd, l.land_influence_cd,
                   l.land_soil_cd, l.ag_land_type_cd, l.land_adj_type_cd,
                   l.appraisal_cd, l.primary_use_cd, l.sub_use_cd, l.type_schedule,
                   l.size_acres, l.size_square_feet, l.size_useable_acres,
                   l.size_useable_square_feet, l.eff_size_acres,
                   l.effective_front, l.effective_depth,
                   l.width_front, l.width_back, l.depth_right, l.depth_left,
                   l.waterfront_footage, l.num_lots,
                   l.mkt_unit_price, l.land_seg_mkt_val, l.mkt_calc_val,
                   l.mkt_adj_val, l.mkt_flat_val, l.mkt_val_source,
                   l.land_seg_orig_val, l.land_seg_up,
                   l.land_adj_factor, l.land_adj_amt, l.land_mass_adj_factor,
                   l.oa_mkt_val, l.non_taxed_mkt_val, l.mktappr_val,
                   l.arb_val, l.dist_val,
                   l.ag_use_cd, l.ag_unit_price, l.ag_val, l.ag_calc_val,
                   l.ag_flat_val, l.ag_loss,
                   l.ag_apply, l.new_imprv_land,
                   l.hs_pct,
                   l.application_number, l.recording_number,
                   l.assessment_yr_qualified
            FROM land_detail l
            INNER JOIN property p ON l.prop_id = p.prop_id
            INNER JOIN prop_supp_assoc psa
                ON l.prop_id = psa.prop_id
               AND l.prop_val_yr = psa.owner_tax_yr
               AND l.sup_num = psa.sup_num
            WHERE p.prop_inactive_dt IS NULL
              AND (psa.sale_id = 0 OR psa.sale_id IS NULL)
            ORDER BY l.prop_id, l.prop_val_yr, l.land_seg_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsLandDetail>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr     = rdr.GetInt32(rdr.GetOrdinal("prop_val_yr"));
            var segId  = rdr.GetInt32(rdr.GetOrdinal("land_seg_id"));
            var key    = (propId, yr, segId);

            PacsLandDetail e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsLandDetails.FindAsync(new object[] { eId }, ct)
                    ?? new PacsLandDetail { Id = eId };
            else
            {
                e = new PacsLandDetail();
                existing[key] = e.Id;
            }

            e.ParcelId       = parcelId;
            e.PacsPropId     = propId;
            e.PropValYear    = yr;
            e.PacsLandSegId  = segId;
            e.SupNum         = rdr.GetInt32(rdr.GetOrdinal("sup_num"));

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

        const string sql = @"
            SELECT o.prop_id, CAST(o.owner_tax_yr AS int) AS owner_tax_yr,
                   o.owner_id, o.sup_num,
                   ac.file_as_name, ac.first_name, ac.last_name,
                   o.pct_ownership, o.type_of_int, o.hs_prop,
                   o.over_65_defer, o.ag_app_filed,
                   o.pct_imprv_hs, o.pct_imprv_nhs,
                   o.pct_land_hs, o.pct_land_nhs,
                   o.pct_ag_use, o.pct_ag_mkt,
                   o.pct_tim_use, o.pct_tim_mkt, o.pct_pers_prop,
                   o.owner_cmnt, o.linked_cd
            FROM owner o
            INNER JOIN account ac ON o.owner_id = ac.acct_id
            INNER JOIN property p ON o.prop_id = p.prop_id
            INNER JOIN prop_supp_assoc psa
                ON o.prop_id = psa.prop_id
               AND o.owner_tax_yr = psa.owner_tax_yr
               AND o.sup_num = psa.sup_num
            WHERE p.prop_inactive_dt IS NULL
              AND (psa.sale_id = 0 OR psa.sale_id IS NULL)
            ORDER BY o.prop_id, o.owner_tax_yr, o.owner_id";

        await using var cmd = new SqlCommand(sql, pacs) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct);
        var batch = new List<PacsOwner>(BatchSize);
        var total = 0;

        while (await rdr.ReadAsync(ct))
        {
            var propId  = rdr.GetInt32(rdr.GetOrdinal("prop_id"));
            if (!propMap.TryGetValue(propId, out var parcelId)) continue;

            var yr      = rdr.GetInt32(rdr.GetOrdinal("owner_tax_yr"));
            var ownerId = rdr.GetInt32(rdr.GetOrdinal("owner_id"));
            var key     = (propId, yr, ownerId);

            PacsOwner e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsOwners.FindAsync(new object[] { eId }, ct)
                    ?? new PacsOwner { Id = eId };
            else
            {
                e = new PacsOwner();
                existing[key] = e.Id;
            }

            e.ParcelId    = parcelId;
            e.PacsPropId  = propId;
            e.PacsOwnerId = ownerId;
            e.OwnerTaxYear = yr;
            e.SupNum      = rdr.GetInt32(rdr.GetOrdinal("sup_num"));

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

    // ── 9. PacsSale ──────────────────────────────────────────────────────

    private async Task<int> SeedSalesAsync(
        SqlConnection pacs, Dictionary<int, Guid> propMap, CancellationToken ct)
    {
        _logger.LogInformation("[PacsSeeder] Seeding PacsSale...");
        var existing = await _db.PacsSales
            .ToDictionaryAsync(s => (s.PacsChgOfOwnerId, s.PacsPropId), s => s.Id, ct);

        const string sql = @"
            SELECT copa.chg_of_owner_id, copa.prop_id, copa.seq_num,
                   copa.appraised_val, copa.assessed_val, copa.market,
                   copa.land_hstd_val, copa.land_non_hstd_val,
                   copa.imprv_hstd_val, copa.imprv_non_hstd_val,
                   copa.monthly_income, copa.annual_income,
                   copa.pers_property_val, copa.exemption_amount,
                   s.sl_dt, s.sl_price, s.adj_sl_price, s.listing_price, s.listing_dt,
                   s.sl_type_cd, s.sl_state_cd, s.sl_class_cd, s.sl_land_type_cd,
                   s.sl_ratio_type_cd, s.sl_ratio_cd, s.county_ratio_cd,
                   s.sl_qualifier, s.sl_adj_cd, s.sl_financing_cd,
                   s.sales_exclude_calc_cd, s.primary_use_cd, s.secondary_use_cd,
                   s.sl_impr_type_code, s.sl_subclass_cd,
                   s.sl_ratio, s.sl_adj_sl_pct, s.sl_adj_sl_amt,
                   s.sl_adj_reason, s.sl_ratio_cd_reason,
                   s.suppress_on_ratio_rpt_cd, s.suppress_on_ratio_reason,
                   s.realtor,
                   gran.file_as_name AS grantor_name,
                   grantee.file_as_name AS grantee_name,
                   s.finance_cmnt, s.amt_down, s.amt_financed, s.interest_rate, s.finance_yrs,
                   s.amt_financed2, s.interest_rate2, s.finance_yrs2,
                   s.sl_yr_blt, s.sl_living_area, s.sl_imprv_unit_price,
                   s.sl_land_sqft, s.sl_land_acres, s.sl_land_front_feet,
                   s.sl_land_depth, s.sl_land_unit_price,
                   s.num_days_on_market, s.land_only_sale, s.continue_current_use,
                   s.confidential, s.wac_cd, s.sl_cmnt, s.import_dt
            FROM chg_of_owner_prop_assoc copa
            INNER JOIN sale s ON copa.chg_of_owner_id = s.chg_of_owner_id
            INNER JOIN property p ON copa.prop_id = p.prop_id
            LEFT JOIN account gran     ON s.grantor_acct_id  = gran.acct_id
            LEFT JOIN account grantee  ON s.grantee_acct_id  = grantee.acct_id
            WHERE p.prop_inactive_dt IS NULL
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

            PacsSale e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsSales.FindAsync(new object[] { eId }, ct)
                    ?? new PacsSale { Id = eId };
            else
            {
                e = new PacsSale();
                existing[key] = e.Id;
            }

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

        const string sql = @"
            SELECT pe.prop_id, pe.owner_id,
                   CAST(pe.exmpt_tax_yr AS int)  AS exmpt_tax_yr,
                   CAST(pe.owner_tax_yr AS int)   AS owner_tax_yr,
                   pe.sup_num, pe.prop_type_cd, pe.exmpt_type_cd, pe.exmpt_subtype_cd,
                   pe.applicant_nm, pe.effective_dt, pe.termination_dt,
                   pe.effective_tax_yr, pe.qualify_yr, pe.review_last_yr,
                   pe.apply_pct_owner, pe.exmpt_pct, pe.combined_disp_income,
                   pe.sp_value_type, pe.sp_value_option,
                   pe.sp_date_approved, pe.sp_expiration_dt, pe.sp_cmnt,
                   pe.absent_flag, pe.absent_expiration_dt, pe.absent_cmnt,
                   pe.deferral_date, pe.exmpt_qualify_cd,
                   pe.review_request_dt, pe.review_status_cd,
                   pe.apply_no_exmpt_amt, pe.apply_local_option_pct_only
            FROM property_exemption pe
            INNER JOIN property p ON pe.prop_id = p.prop_id
            WHERE p.prop_inactive_dt IS NULL
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

            PacsExemption e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsExemptions.FindAsync(new object[] { eId }, ct)
                    ?? new PacsExemption { Id = eId };
            else
            {
                e = new PacsExemption();
                existing[key] = e.Id;
            }

            e.ParcelId      = parcelId;
            e.PacsPropId    = propId;
            e.PacsOwnerId   = ownerId;
            e.ExemptTaxYear = yr;
            e.OwnerTaxYear  = Int(rdr, "owner_tax_yr") ?? yr;
            e.SupNum        = rdr.GetInt32(rdr.GetOrdinal("sup_num"));

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

        const string sql = @"
            SELECT ap.case_id, ap.prop_id, CAST(ap.prop_val_yr AS int) AS prop_val_yr,
                   ap.prot_type, ap.prot_status, ap.status_dt_changed,
                   ap.create_dt, ap.complete_dt, ap.full_ratification_dt,
                   ap.apprl_staff, ap.hearing_apprl_staff, ap.assigned_panel,
                   ap.hearing_start_dt, ap.hearing_finished_dt, ap.arrived_dt,
                   ap.hearing_rescheduled, ap.full_board_hearing,
                   ap.apprsr_meeting_dt, ap.apprsr_meeting_apprsr_id,
                   ap.apprsr_meeting_apprsr_cmnt, ap.apprsr_meeting_taxpyr_cmnt,
                   ap.taxpyr_doc_rqsted, ap.taxpyr_evidence_rqsted,
                   ap.taxpyr_evidence_delivered_dt,
                   ap.first_motion, ap.first_motion_decision_cd, ap.first_motion_decision_dt, ap.first_motion_pass,
                   ap.second_motion, ap.second_motion_decision_cd, ap.second_motion_decision_dt, ap.second_motion_pass,
                   ap.other_motion, ap.decision_reason_cd, ap.sustain_district_val, ap.prot_val_type,
                   ap.prot_cmnt, ap.taxpyr_cmnt, ap.district_cmnt, ap.arb_instructions,
                   ap.appraiser_assigned_val, ap.arb_assigned_val,
                   ap.appraiser_assigned_lnd_val, ap.appraiser_assigned_imprv_val,
                   ap.boe_assigned_lnd_val, ap.boe_assigned_imprv_val, ap.opinion_of_value,
                   ap.highly_disputed_prop, ap.taxes_paid, ap.case_prepared,
                   ap.begin_market, ap.begin_appraised_val, ap.begin_assessed_val,
                   ap.begin_land_hstd_val, ap.begin_land_non_hstd_val,
                   ap.begin_imprv_hstd_val, ap.begin_imprv_non_hstd_val,
                   ap.begin_ag_use_val, ap.begin_ag_market,
                   ap.begin_timber_use, ap.begin_timber_market,
                   ap.begin_ten_percent_cap, ap.begin_exmpts, ap.begin_entities,
                   ap.final_market, ap.final_appraised_val, ap.final_assessed_val,
                   ap.final_land_hstd_val, ap.final_land_non_hstd_val,
                   ap.final_imprv_hstd_val, ap.final_imprv_non_hstd_val,
                   ap.final_ag_use_val, ap.final_ag_market,
                   ap.final_timber_use, ap.final_timber_market,
                   ap.final_ten_percent_cap, ap.final_exmpts, ap.final_entities
            FROM _arb_protest ap
            INNER JOIN property p ON ap.prop_id = p.prop_id
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
            var yr     = rdr.GetInt32(rdr.GetOrdinal("prop_val_yr"));
            var key    = (propId, yr, caseId);

            PacsAppeal e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsAppeals.FindAsync(new object[] { eId }, ct)
                    ?? new PacsAppeal { Id = eId };
            else
            {
                e = new PacsAppeal();
                existing[key] = e.Id;
            }

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

        const string sql = @"
            SELECT pta.prop_id, CAST(pta.tax_yr AS int) AS tax_yr,
                   pta.sup_num, pta.tax_area_id, pta.tax_area_id_pending,
                   pta.effective_dt, pta.is_annex_value,
                   ta.tax_area_number, ta.tax_area_state, ta.tax_area_description, ta.comment
            FROM property_tax_area pta
            INNER JOIN tax_area ta ON pta.tax_area_id = ta.tax_area_id
            INNER JOIN property p  ON pta.prop_id = p.prop_id
            WHERE p.prop_inactive_dt IS NULL
            ORDER BY pta.prop_id, pta.tax_yr";

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

            PacsTaxArea e;
            if (existing.TryGetValue(key, out var eId))
                e = await _db.PacsTaxAreas.FindAsync(new object[] { eId }, ct)
                    ?? new PacsTaxArea { Id = eId };
            else
            {
                e = new PacsTaxArea();
                existing[key] = e.Id;
            }

            e.ParcelId           = parcelId;
            e.PacsPropId         = propId;
            e.TaxYear            = yr;
            e.SupNum             = rdr.GetInt32(rdr.GetOrdinal("sup_num"));
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

    // ── Generic Batch Upsert ─────────────────────────────────────────────

    private async Task<int> UpsertAsync<T>(List<T> batch, CancellationToken ct)
        where T : class
    {
        foreach (var entity in batch)
        {
            var entry = _db.Entry(entity);
            if (entry.State == EntityState.Detached)
                _db.Set<T>().Add(entity);
            // If already tracked (from FindAsync), EF knows its state
        }
        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        return batch.Count;
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
            return r.GetDateTime(ord);
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
    public int Sales                  { get; set; }
    public int Exemptions             { get; set; }
    public int Appeals                { get; set; }
    public int TaxAreas               { get; set; }

    public override string ToString() =>
        $"Parcels={Parcels} Situs={Situs} Vals={Valuations} " +
        $"Imprv={Improvements} Det={ImprovementDetails} Attr={ImprovementAttributes} " +
        $"Land={LandDetails} Owners={Owners} Sales={Sales} " +
        $"Exemptions={Exemptions} Appeals={Appeals} TaxAreas={TaxAreas}";
}
