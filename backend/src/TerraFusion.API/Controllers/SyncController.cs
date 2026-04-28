using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Services;
using TerraFusion.Core.DTOs.Sync;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;

namespace TerraFusion.API.Controllers;

/// <summary>
/// OS-Core sync management surface.
///
/// Exposes HTTP operations for the qualification pipeline that sits between
/// PacsDataSeeder (ETL) and TerraForge (Suite-Forge) endpoints.
///
/// Ownership rule: sync/ETL triggers live here, NOT on ForgeController.
/// ForgeController owns appraiser decisions and ratio study reads.
/// SyncController owns pipeline health and requalification triggers.
/// </summary>
[ApiController]
[Route("api/sync")]
public class SyncController : ControllerBase
{
    private readonly ISaleQualificationService _qualification;
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<SyncController> _logger;
    private readonly ISalesCompEligibilityReader _compReader;

    public SyncController(
        ISaleQualificationService qualification,
        TerraFusionDbContext db,
        ILogger<SyncController> logger,
        ISalesCompEligibilityReader compReader)
    {
        _qualification = qualification;
        _db            = db;
        _logger        = logger;
        _compReader    = compReader;
    }

    // ── Requalification trigger ────────────────────────────────────────────

    /// <summary>
    /// Recompute QualificationRecommendation for every ComparableSale in a county.
    ///
    /// Trigger this after PacsDataSeeder completes a new sync.
    /// Uses SaleQualificationService Layer 2 (county_ratio_code FK lookup) as the
    /// primary driver; Layer 2b (sale_ratio_type), 3, 4, 5 apply in cascade.
    ///
    /// Does NOT overwrite QualificationDecision — that belongs to the appraiser.
    /// Only QualificationRecommendation, RecommendationReason, RecommendationSource,
    /// and RecommendationVersion are updated.
    /// </summary>
    [HttpPost("requalify/{countyId:guid}")]
    public async Task<IActionResult> Requalify(Guid countyId, CancellationToken ct)
    {
        var started = DateTime.UtcNow;
        _logger.LogInformation("[Sync] Requalify triggered for county {CountyId}", countyId);

        var count = await _qualification.ComputeRecommendationsAsync(countyId, ct);

        var elapsed = DateTime.UtcNow - started;
        _logger.LogInformation(
            "[Sync] Requalify complete: county={CountyId} count={Count} elapsed={Elapsed}",
            countyId, count, elapsed);

        return Ok(new
        {
            countyId,
            requalified = count,
            elapsedMs   = (long)elapsed.TotalMilliseconds,
            completedAt = DateTime.UtcNow
        });
    }

    // ── Qualification pipeline status ──────────────────────────────────────

    /// <summary>
    /// Returns a pipeline status snapshot for the sale qualification workflow.
    ///
    /// Counts:
    ///   totalSales           — all ComparableSales for this county
    ///   hasRecommendation    — SaleQualificationService has run (recommendation set)
    ///   pendingDecision      — recommendation set, no appraiser decision yet
    ///   staffConfirmed       — staff has confirmed or overridden recommendation
    ///   appraiserFinal       — appraiser has set the final QualificationDecision
    ///   effectiveQualified   — the effective qualified pool (decision wins; recommendation fallback)
    ///
    /// taxYear filter is applied identically to the ratio-study effective qualified pool
    /// (SalesYear == taxYear OR sale date in 24-month lookback window).
    /// </summary>
    [HttpGet("qualification-status/{countyId:guid}")]
    public async Task<IActionResult> GetQualificationStatus(
        Guid countyId,
        [FromQuery] int taxYear = 2026,
        CancellationToken ct = default)
    {
        // All-time counts (pipeline health — not year-scoped).
        var allSales = await _db.ComparableSales
            .Where(s => s.CountyId == countyId)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                total              = g.Count(),
                hasRecommendation  = g.Count(s => s.QualificationRecommendation != null),
                hasDecision        = g.Count(s => s.QualificationDecision != null),
                staffConfirmed     = g.Count(s => s.DecisionSource == "StaffConfirmed"),
                appraiserFinal     = g.Count(s =>
                    s.DecisionSource == "AppraiserFinal"
                    || s.DecisionSource == "AssessorOverride"
                    || s.DecisionSource == "AcceptedRecommendation"),
                pendingDecision    = g.Count(s =>
                    s.QualificationRecommendation != null
                    && s.QualificationDecision == null),
                recQualified       = g.Count(s => s.QualificationRecommendation == "qualified"),
                decQualified       = g.Count(s => s.QualificationDecision == "qualified")
            })
            .FirstOrDefaultAsync(ct);

        if (allSales is null)
        {
            return Ok(new
            {
                countyId,
                taxYear,
                allTime = new { total = 0 },
                ratioStudyWindow = (object?)null
            });
        }

        // Year-scoped effective qualified pool (mirrors ratio-study filter).
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var windowCounts = await _db.ComparableSales
            .Where(s => s.CountyId == countyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SalesYear == null
                         && s.SaleDate >= lookbackStart
                         && s.SaleDate < lookbackEnd))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                total             = g.Count(),
                hasRecommendation = g.Count(s => s.QualificationRecommendation != null),
                pendingDecision   = g.Count(s =>
                    s.QualificationRecommendation != null
                    && s.QualificationDecision == null),
                effectiveQualified = g.Count(s =>
                    (s.QualificationDecision != null && s.QualificationDecision == "qualified")
                    || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified")),
                decQualified       = g.Count(s => s.QualificationDecision == "qualified"),
                recQualified       = g.Count(s =>
                    s.QualificationDecision == null
                    && s.QualificationRecommendation == "qualified")
            })
            .FirstOrDefaultAsync(ct);

        _logger.LogInformation(
            "[Sync] QualificationStatus: county={CountyId} year={Year} " +
            "allTotal={AllTotal} windowTotal={WTotal} effectiveQualified={EQ}",
            countyId, taxYear, allSales.total,
            windowCounts?.total ?? 0, windowCounts?.effectiveQualified ?? 0);

        return Ok(new
        {
            countyId,
            taxYear,
            allTime = new
            {
                totalSales        = allSales.total,
                hasRecommendation = allSales.hasRecommendation,
                pendingDecision   = allSales.pendingDecision,
                staffConfirmed    = allSales.staffConfirmed,
                appraiserFinal    = allSales.appraiserFinal,
                decisionQualified = allSales.decQualified,
                recQualified      = allSales.recQualified,
                // Percentage of sales that have a recommendation (ETL health signal).
                recommendationCoverage = allSales.total > 0
                    ? Math.Round(allSales.hasRecommendation * 100.0 / allSales.total, 1)
                    : 0.0
            },
            ratioStudyWindow = windowCounts is null ? null : (object)new
            {
                taxYear,
                lookbackStart,
                lookbackEnd,
                totalSales        = windowCounts.total,
                hasRecommendation = windowCounts.hasRecommendation,
                pendingDecision   = windowCounts.pendingDecision,
                effectiveQualified = windowCounts.effectiveQualified,
                decisionQualified = windowCounts.decQualified,
                recQualifiedFallback = windowCounts.recQualified
            }
        });
    }

    // ── Ratio field backfill ────────────────────────────────────────────────

    /// <summary>
    /// Backfills ratio fields on existing ComparableSales rows.
    ///
    /// Two-pass approach:
    ///   Pass 1 — RawRatioTypeCd, SuppressOnRatioRptCd, SuppressOnRatioReason:
    ///     Joined from pacs_sales via parcel geo_id + sale_date + price match.
    ///     These are per-sale metadata that PACS populates at time of entry.
    ///
    ///   Pass 2 — PacsComputedRatio:
    ///     Computed as pacs_valuations.Market / ComparableSales.SalePrice * 100.
    ///     IMPORTANT: PACS's sl_ratio (pacs_sales.SaleRatio) is only populated
    ///     when PACS runs its own ratio study workflow, which Benton has not done
    ///     in the mirrored data. The authoritative ratio is computed from the 2026
    ///     certified market value (pacs_valuations.Market, PropValYear=2026, SupNum=0)
    ///     divided by the sale price. This matches how Benton's appraiser staff
    ///     manually compute ratios for the DOR ratio study.
    ///
    /// After both passes, runs ComputeRecommendationsAsync so Layer 2b picks up
    /// the newly populated RawRatioTypeCd.
    ///
    /// Safe to run multiple times — subsequent runs are idempotent.
    /// </summary>
    [HttpPost("backfill-ratios/{countyId:guid}")]
    public async Task<IActionResult> BackfillRatios(Guid countyId, CancellationToken ct)
    {
        var started = DateTime.UtcNow;
        _logger.LogInformation("[Sync] BackfillRatios triggered for county {CountyId}", countyId);

        // ── Pass 1: Sale metadata from pacs_sales ─────────────────────────
        // Joins: ComparableSales.ParcelId (GeoId string) → PacsParcel.GeoId
        //        PacsParcel.Id (Guid) → pacs_sales.ParcelId
        // Match on date (date-cast strips time) + price within $1.
        // Column names confirmed PascalCase from live PostgreSQL schema 2026-04-04.
        const string sqlMetadata = """
            UPDATE "ComparableSales" cs
            SET "RawRatioTypeCd"        = ps."SaleRatioTypeCd",
                "SuppressOnRatioRptCd"  = ps."SuppressOnRatioRptCd",
                "SuppressOnRatioReason" = ps."SuppressOnRatioReason"
            FROM pacs_sales ps
            JOIN "PacsParcel" pp ON ps."ParcelId" = pp."Id"
            WHERE cs."ParcelId" = pp."GeoId"
              AND cs."SaleDate"::date = ps."SaleDate"::date
              AND ABS(cs."SalePrice" - COALESCE(ps."AdjustedSalePrice", ps."SalePrice", 0)) < 1
        """;

        // ── Pass 2: PacsComputedRatio from pacs_valuations ────────────────
        // sl_ratio in pacs_sales is NULL for all Benton rows — PACS only populates
        // it when running its own ratio study workflow. Compute from the 2026
        // certified market value instead: Market / SalePrice * 100.
        // PropValYear=2026, SupNum=0 = the working certified layer.
        const string sqlRatio = """
            UPDATE "ComparableSales" cs
            SET "PacsComputedRatio" = ROUND(pv."Market" / cs."SalePrice" * 100, 4)
            FROM pacs_valuations pv
            JOIN "PacsParcel" pp ON pv."ParcelId" = pp."Id"
            WHERE cs."ParcelId" = pp."GeoId"
              AND pv."PropValYear" = 2026
              AND pv."SupNum" = 0
              AND cs."SalePrice" > 0
              AND pv."Market" > 0
        """;

        int updatedMetadata, updatedRatio;
        try
        {
            updatedMetadata = await _db.Database.ExecuteSqlRawAsync(sqlMetadata, ct);
            updatedRatio    = await _db.Database.ExecuteSqlRawAsync(sqlRatio, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Sync] BackfillRatios SQL failed for county {CountyId}", countyId);
            return StatusCode(500, new { error = "SQL backfill failed", detail = ex.Message });
        }

        var updated = Math.Max(updatedMetadata, updatedRatio);
        _logger.LogInformation(
            "[Sync] BackfillRatios: metadata={Meta} rows, ratio={Ratio} rows updated", updatedMetadata, updatedRatio);

        // Re-run qualification so Layer 2b now uses the populated RawRatioTypeCd.
        var requalified = await _qualification.ComputeRecommendationsAsync(countyId, ct);

        var elapsed = DateTime.UtcNow - started;
        _logger.LogInformation(
            "[Sync] BackfillRatios complete: county={CountyId} updated={Updated} requalified={Requalified} elapsed={Elapsed}",
            countyId, updated, requalified, elapsed);

        return Ok(new
        {
            countyId,
            rowsMetadataUpdated = updatedMetadata,
            rowsRatioUpdated    = updatedRatio,
            requalified,
            elapsedMs           = (long)elapsed.TotalMilliseconds,
            completedAt         = DateTime.UtcNow
        });
    }

    // ── Neighborhood backfill ───────────────────────────────────────────────

    /// <summary>
    /// Backfills ComparableSales.Neighborhood from pacs_valuations.hood_cd.
    ///
    /// Run this after re-seeding pacs_valuations with the corrected seeder that
    /// reads property_val.hood_cd (not the earlier typo "nbhd_cd").
    ///
    /// Join path: ComparableSales.ParcelId (GeoId string)
    ///          → PacsParcel.GeoId / PacsParcel.Id (Guid)
    ///          → pacs_valuations.ParcelId + PropValYear=2026 + SupNum=0
    ///
    /// Safe to run multiple times — idempotent.
    /// </summary>
    [HttpPost("backfill-neighborhoods/{countyId:guid}")]
    public async Task<IActionResult> BackfillNeighborhoods(Guid countyId, CancellationToken ct)
    {
        var started = DateTime.UtcNow;
        _logger.LogInformation("[Sync] BackfillNeighborhoods triggered for county {CountyId}", countyId);

        const string sql = """
            UPDATE "ComparableSales" cs
            SET "Neighborhood" = pv.hood_cd
            FROM pacs_valuations pv
            JOIN "PacsParcel" pp ON pv."ParcelId" = pp."Id"
            WHERE cs."ParcelId" = pp."GeoId"
              AND pv."PropValYear" = 2026
              AND pv."SupNum" = 0
              AND pv.hood_cd IS NOT NULL
        """;

        int updated;
        try
        {
            updated = await _db.Database.ExecuteSqlRawAsync(sql, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Sync] BackfillNeighborhoods SQL failed for county {CountyId}", countyId);
            return StatusCode(500, new { error = "SQL backfill failed", detail = ex.Message });
        }

        var elapsed = DateTime.UtcNow - started;
        _logger.LogInformation(
            "[Sync] BackfillNeighborhoods: {Updated} rows updated, elapsed={Elapsed}", updated, elapsed);

        return Ok(new
        {
            countyId,
            rowsUpdated = updated,
            elapsedMs   = (long)elapsed.TotalMilliseconds,
            completedAt = DateTime.UtcNow,
            note        = updated == 0
                ? "pacs_valuations.hood_cd is empty — re-seed after the seeder fix (nbhd_cd→hood_cd) to populate neighborhoods"
                : $"{updated} ComparableSales rows now have Neighborhood set"
        });
    }

    // ── Comp-eligibility read (Slice C38-B) ─────────────────────────────────

    /// <summary>
    /// Slice C38-B: read-side HTTP exposure of the C37-B
    /// <c>ISalesCompEligibilityReader</c> per the C38-A policy.
    ///
    /// <para>Returns the comp pool for a county. Single selection rule
    /// (inherited from C37-A): <c>ComputedDecision = Qualified</c>.
    /// <c>Excluded</c> and <c>Inconclusive</c> rows are NOT returned.
    /// This is the WacCd-bug containment surface exposed over HTTP —
    /// pre-conversion / unmapped / problematic <c>wac_cd</c> codes
    /// never reach the comp pool by construction.</para>
    ///
    /// <para>Authentication required (per C38-A Hard Guard 2).
    /// County-isolation guard fires server-side (Hard Guard 3): the
    /// authenticated principal's <c>countyId</c> claim must match the
    /// requested <paramref name="countyId"/>; cross-county callers
    /// receive 403 with no row data.</para>
    ///
    /// <para>Workbook-pin is opt-in (Hard Guard 7). When
    /// <paramref name="workbookId"/> is omitted or empty, all
    /// Qualified rows for the county are returned regardless of
    /// which workbook produced them. There is no implicit "most
    /// recent workbook" default — that would silently mask
    /// workbook drift.</para>
    /// </summary>
    /// <param name="countyId">Sovereign-county scope (required).</param>
    /// <param name="workbookId">
    /// Optional workbook-pin. Empty / omitted means "all qualified
    /// rows for this county."
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    /// 200 OK with a (possibly empty) JSON array of
    /// <see cref="CompEligibleSaleDto"/>. The array is ordered by
    /// <c>ChgOfOwnerId</c> ascending for deterministic consumption.
    /// </returns>
    [HttpGet("comps/eligible")]
    [Authorize]
    public async Task<IActionResult> GetEligibleComps(
        [FromQuery] Guid countyId,
        [FromQuery] Guid? workbookId,
        CancellationToken ct = default)
    {
        // ── 400: required input missing / malformed ──
        if (countyId == Guid.Empty)
        {
            return BadRequest(new
            {
                error = "countyId is required.",
                hint  = "Pass a non-empty Guid as the countyId query parameter.",
            });
        }

        // ── 403: county isolation (per CLAUDE.md sovereign-county
        //        invariant + C38-A Hard Guard 3). The principal's
        //        countyId claim must match the requested countyId.
        //        Mismatch returns Forbid without leaking whether the
        //        county exists or has rows. ──
        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null || principalCountyId.Value != countyId)
        {
            _logger.LogWarning(
                "[Sync] GetEligibleComps refused cross-county access: principal={PrincipalCounty} requested={RequestedCounty}",
                principalCountyId, countyId);
            return Forbid();
        }

        // ── Delegate to the C37-B reader. The reader normalizes
        //    Guid.Empty workbookId to "no pin," so we forward the
        //    raw query value verbatim. ──
        var pool = await _compReader.ReadAsync(countyId, workbookId, ct);

        // ── Project to DTO. Field-for-field, no enrichment. ──
        var dto = pool
            .Select(s => new CompEligibleSaleDto(
                s.ChgOfOwnerId,
                s.WacCdSourceValue,
                s.WacCdCanonicalValue,
                s.SlRatioTypeCdSourceValue,
                s.SlRatioTypeCdCanonicalValue,
                s.SaleDate,
                s.SalePrice,
                s.SourceWorkbookId,
                s.SourceWorkbookLockedAt))
            .ToList();

        // Operational telemetry (NOT FISMA AuditLogs — this is a
        // read, not a state mutation, per C38-A Hard Guard 9).
        _logger.LogInformation(
            "[Sync] GetEligibleComps: county={CountyId} workbookId={WorkbookId} rows={Rows}",
            countyId, workbookId, dto.Count);

        return Ok(dto);
    }

    /// <summary>
    /// Resolve the authenticated principal's countyId claim. Returns
    /// <c>null</c> when the claim is missing or malformed; the caller
    /// converts that to 403. Mirrors the resolver pattern in
    /// AtlasController but kept narrow — the comps endpoint requires
    /// an explicit Guid claim and does not fall back to county-name
    /// or FIPS lookups (those would broaden the trust surface for a
    /// read endpoint that doesn't need it).
    /// </summary>
    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
