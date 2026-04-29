using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Services;
using TerraFusion.API.Services.Sync;
using TerraFusion.Core.DTOs.Sync;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using TerraFusion.Sync.Workbench.Mapping;

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
    private readonly ISyncCountyActiveWorkbookService _activeWorkbook;
    private readonly ISalesCompStaleReader _staleReader;
    private readonly ISalesCompStaleSummaryReader _staleSummaryReader;

    public SyncController(
        ISaleQualificationService qualification,
        TerraFusionDbContext db,
        ILogger<SyncController> logger,
        ISalesCompEligibilityReader compReader,
        ISyncCountyActiveWorkbookService activeWorkbook,
        ISalesCompStaleReader staleReader,
        ISalesCompStaleSummaryReader staleSummaryReader)
    {
        _qualification      = qualification;
        _db                 = db;
        _logger             = logger;
        _compReader         = compReader;
        _activeWorkbook     = activeWorkbook;
        _staleReader        = staleReader;
        _staleSummaryReader = staleSummaryReader;
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
    // ── C45-B caching constants per the C45-A policy ───────────────────────
    // Comp endpoints: 60-second window (canonical only changes on C36 writes).
    // Active-workbook: 5-second window (operator promote/clear should reflect fast).
    private static readonly TimeSpan CompMaxAge   = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan PointerMaxAge = TimeSpan.FromSeconds(5);

    // ── Slice C45-E: stale-while-revalidate window for the comp
    //    endpoints. After the 60-second max-age expires, clients
    //    may render the cached body for up to another 120 seconds
    //    while asynchronously refetching — smooths the polling
    //    cliff for dashboards. Active-workbook deliberately omits
    //    SWR (operators expect pointer changes to reflect within
    //    seconds; SWR would mean "show old pointer for up to N
    //    seconds longer," which contradicts that mental model). ──
    private static readonly TimeSpan CompStaleWhileRevalidate = TimeSpan.FromSeconds(120);

    // Endpoint scope-prefixes for ETags (C45-A Hard Guard 5 / glossary).
    private const string EtagScopeEligible       = "comps:e";
    private const string EtagScopeStale          = "comps:s";
    private const string EtagScopeStaleSummary   = "comps:ss";
    private const string EtagScopeActiveWorkbook = "awb";

    /// <summary>
    /// Default page index when the client omits <c>page</c>
    /// (per C39-A Hard Guard 2).
    /// </summary>
    private const int DefaultPage = 1;

    /// <summary>
    /// Default page size when the client omits <c>pageSize</c>
    /// (per C39-A Hard Guard 2).
    /// </summary>
    private const int DefaultPageSize = 100;

    /// <summary>
    /// Maximum page size accepted (per C39-A Hard Guard 1 / 2).
    /// Server refuses — never silently truncates — when exceeded.
    /// </summary>
    private const int MaxPageSize = 500;

    [HttpGet("comps/eligible")]
    [HttpHead("comps/eligible")]
    [Authorize]
    public async Task<IActionResult> GetEligibleComps(
        [FromQuery] Guid countyId,
        [FromQuery] Guid? workbookId,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct = default)
    {
        // ── 400: required input missing / malformed ──
        if (countyId == Guid.Empty)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error = "countyId is required.",
                hint  = "Pass a non-empty Guid as the countyId query parameter.",
            });
        }

        // ── 400: pagination validation (per C39-A Hard Guard 3).
        //        No silent normalization — client bug surfaces at
        //        request time. ──
        if (page is < 1)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error = "page must be >= 1.",
                hint  = "Omit the page query parameter to default to page 1.",
                page  = page,
            });
        }
        if (pageSize is < 1)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error    = "pageSize must be >= 1.",
                hint     = $"Omit the pageSize query parameter to default to {DefaultPageSize}.",
                pageSize = pageSize,
            });
        }
        if (pageSize is > MaxPageSize)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error    = $"pageSize must be <= {MaxPageSize}.",
                hint     = "Server-bounded per C39-A Hard Guard 1 / 2.",
                pageSize = pageSize,
                maxPageSize = MaxPageSize,
            });
        }

        // ── 403: county isolation (per CLAUDE.md sovereign-county
        //        invariant + C38-A Hard Guard 3). The principal's
        //        countyId claim must match the requested countyId.
        //        Mismatch returns Forbid without leaking whether the
        //        county exists or has rows. ──
        // ── Per C45-A Hard Guard 8, the 403 short-circuit MUST
        //    happen BEFORE ETag computation so cross-county callers
        //    cannot exploit ETag matching to detect existence. ──
        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null || principalCountyId.Value != countyId)
        {
            _logger.LogWarning(
                "[Sync] GetEligibleComps refused cross-county access: principal={PrincipalCounty} requested={RequestedCounty}",
                principalCountyId, countyId);
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return Forbid();
        }

        // ── Apply server-side defaults (after validation). ──
        var effectivePage     = page     ?? DefaultPage;
        var effectivePageSize = pageSize ?? DefaultPageSize;

        // ── C45-B: compute the ETag seed BEFORE materializing the
        //    page so a matching If-None-Match short-circuits to
        //    304. The seed includes the maximum
        //    SourceWorkbookLockedAt across rows in scope (or
        //    UnixEpoch when the result set is empty) so any C36
        //    write to a row in scope rotates the ETag.
        var maxLockedAt = await _compReader.MaxLockedAtAsync(countyId, workbookId, ct);
        var lastModifiedUtc = ToLastModifiedUtc(maxLockedAt);
        var etag = SyncHttpCacheHeaders.BuildStrongEtag(
            EtagScopeEligible,
            countyId.ToString(),
            (workbookId ?? Guid.Empty).ToString(),
            effectivePage.ToString(System.Globalization.CultureInfo.InvariantCulture),
            effectivePageSize.ToString(System.Globalization.CultureInfo.InvariantCulture),
            lastModifiedUtc.UtcDateTime.ToString("O", System.Globalization.CultureInfo.InvariantCulture));

        if (SyncHttpCacheHeaders.MatchesIfNoneMatch(Request, etag) ||
            SyncHttpCacheHeaders.MatchesIfModifiedSince(Request, lastModifiedUtc))
        {
            SyncHttpCacheHeaders.ApplyNotModifiedHeaders(Response, CompMaxAge, etag, CompStaleWhileRevalidate);
            return StatusCode(StatusCodes.Status304NotModified);
        }

        // ── Slice C45-D: HEAD short-circuit. The client wants the
        //    headers (ETag / Last-Modified / Cache-Control) without
        //    the body. Skip the count + page-materialization reads
        //    and emit a 200 with cache headers; the framework
        //    elides the body on HEAD. ──
        if (HttpMethods.IsHead(Request.Method))
        {
            SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, CompMaxAge, etag, lastModifiedUtc, CompStaleWhileRevalidate);
            return StatusCode(StatusCodes.Status200OK);
        }

        // ── Delegate to the C37-B reader's paginated overload +
        //    exact count. ──
        var totalCount = await _compReader.CountAsync(countyId, workbookId, ct);
        var pageRows   = await _compReader.ReadPageAsync(
            countyId, workbookId, effectivePage, effectivePageSize, ct);

        // ── Project to DTO. Field-for-field, no enrichment. ──
        var items = pageRows
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

        // ── Compute envelope metadata.
        //    totalPages = ceil(totalCount / pageSize); zero when
        //    totalCount is zero. hasPreviousPage is true when the
        //    requested page is past the end (so the client can
        //    detect overshoot). ──
        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling((double)totalCount / effectivePageSize);
        var hasNextPage     = effectivePage < totalPages;
        var hasPreviousPage = effectivePage > 1;

        var envelope = new PagedCompEligibleSalesDto(
            Items:           items,
            Page:            effectivePage,
            PageSize:        effectivePageSize,
            TotalCount:      totalCount,
            TotalPages:      totalPages,
            HasNextPage:     hasNextPage,
            HasPreviousPage: hasPreviousPage);

        // Operational telemetry (NOT FISMA AuditLogs — this is a
        // read, not a state mutation, per C38-A Hard Guard 9).
        _logger.LogInformation(
            "[Sync] GetEligibleComps: county={CountyId} workbookId={WorkbookId} page={Page} pageSize={PageSize} rows={Rows} total={Total}",
            countyId, workbookId, effectivePage, effectivePageSize, items.Count, totalCount);

        SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, CompMaxAge, etag, lastModifiedUtc, CompStaleWhileRevalidate);
        return Ok(envelope);
    }

    /// <summary>
    /// Project a nullable <see cref="DateTime"/> from the
    /// reader's <c>MaxLockedAtAsync</c> to a stable
    /// <see cref="DateTimeOffset"/> for ETag seeding and the
    /// <c>Last-Modified</c> header. <c>null</c> (empty result
    /// set) maps to <see cref="DateTimeOffset.UnixEpoch"/> so
    /// empty responses are still cacheable with a deterministic
    /// ETag (per C45-A Hard Guard / test 16).
    /// </summary>
    private static DateTimeOffset ToLastModifiedUtc(DateTime? maxLockedAt)
    {
        if (!maxLockedAt.HasValue) return DateTimeOffset.UnixEpoch;
        var dt = maxLockedAt.Value;
        if (dt.Kind == DateTimeKind.Unspecified)
        {
            dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }
        return new DateTimeOffset(dt.ToUniversalTime(), TimeSpan.Zero);
    }

    /// <summary>
    /// Slice C45-C: shared ETag computation for the active-workbook
    /// pointer. Used by both <c>GetActiveWorkbook</c> (to emit the
    /// 200 / 304 ETag) and <c>PutActiveWorkbook</c> (to evaluate
    /// <c>If-Match</c> against the current pointer's ETag). Keeping
    /// the seed in one place ensures the GET and the optimistic-
    /// concurrency check on PUT can never drift.
    /// </summary>
    private (string Etag, DateTimeOffset SetAtUtc) ComputeActiveWorkbookEtag(
        SyncCountyActiveWorkbookSnapshot snap)
    {
        var setAtUtc = ToLastModifiedUtc(snap.SetAt);
        var etag = SyncHttpCacheHeaders.BuildStrongEtag(
            EtagScopeActiveWorkbook,
            snap.CountyId.ToString(),
            snap.ActiveWorkbookId.ToString(),
            setAtUtc.UtcDateTime.ToString("O", System.Globalization.CultureInfo.InvariantCulture));
        return (etag, setAtUtc);
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

    // ── Active-workbook pointer (Slice C41-C) ───────────────────────────────

    /// <summary>
    /// Slice C41-C: HTTP read for the per-county active-workbook
    /// pointer. Inherits the C41-A endpoint contract: auth required,
    /// county-isolation server-side, no PII, audit at consumer level
    /// only, no collateral mutation.
    ///
    /// <para>Per C41-A Hard Guard 9 a county MAY have no pointer; in
    /// that case this action returns 404 (the route is reachable
    /// for the county but no row exists). Reading is read-only —
    /// <c>AsNoTracking</c> at the service layer; no
    /// <c>UpdatedAt</c> bump on the pointer row.</para>
    /// </summary>
    [HttpGet("active-workbook")]
    [HttpHead("active-workbook")]
    [Authorize]
    public async Task<IActionResult> GetActiveWorkbook(
        [FromQuery] Guid countyId,
        CancellationToken ct = default)
    {
        if (countyId == Guid.Empty)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new { error = "countyId is required." });
        }

        var principal = ResolveCountyClaim();
        if (principal is null || principal.Value != countyId)
        {
            _logger.LogWarning(
                "[Sync] GetActiveWorkbook refused cross-county access: principal={Principal} requested={Requested}",
                principal, countyId);
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return Forbid();
        }

        var snap = await _activeWorkbook.GetAsync(countyId, ct);
        if (snap is null)
        {
            // Hard Guard 9: no-pointer is a valid state; return 404
            // so consumers can distinguish "no pointer set" from
            // "pointer points at a known workbook id." The body
            // says nothing about whether the county exists or has
            // workbooks — that's not the consumer's concern at this
            // surface.
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return NotFound(new
            {
                countyId,
                error = "No active-workbook pointer is configured for this county.",
            });
        }

        // ── C45-B: ETag seed = (countyId, activeWorkbookId, setAtUtc).
        //    Pointer freshness rotates whenever the operator
        //    promotes a different workbook (SetAt advances). ──
        var (etag, setAtUtc) = ComputeActiveWorkbookEtag(snap);

        if (SyncHttpCacheHeaders.MatchesIfNoneMatch(Request, etag) ||
            SyncHttpCacheHeaders.MatchesIfModifiedSince(Request, setAtUtc))
        {
            SyncHttpCacheHeaders.ApplyNotModifiedHeaders(Response, PointerMaxAge, etag);
            return StatusCode(StatusCodes.Status304NotModified);
        }

        // C45-D: HEAD short-circuit (skip DTO allocation; emit
        // headers + 200 with empty body).
        if (HttpMethods.IsHead(Request.Method))
        {
            SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, PointerMaxAge, etag, setAtUtc);
            return StatusCode(StatusCodes.Status200OK);
        }

        var dto = new ActiveWorkbookSnapshotDto(
            snap.CountyId, snap.ActiveWorkbookId, snap.SetAt, snap.SetBy, snap.SetReason);

        _logger.LogInformation(
            "[Sync] GetActiveWorkbook: county={CountyId} workbookId={WorkbookId}",
            countyId, snap.ActiveWorkbookId);

        SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, PointerMaxAge, etag, setAtUtc);
        return Ok(dto);
    }

    /// <summary>
    /// Slice C41-C: HTTP promotion of a Mapped workbook to active
    /// for a county. Per C41-A: target must be Mapped + same
    /// county; SET is idempotent (re-setting the same workbook is
    /// a no-op at the service layer); does NOT trigger C36 or any
    /// canonical / PACS work. The principal id is the audit stamp
    /// (operator id); the request body's <see cref="ActiveWorkbookSetRequest.Reason"/>
    /// is recorded as <c>SetReason</c>.
    /// </summary>
    [HttpPut("active-workbook")]
    [Authorize]
    public async Task<IActionResult> PutActiveWorkbook(
        [FromQuery] Guid countyId,
        [FromQuery] Guid workbookId,
        [FromBody]  ActiveWorkbookSetRequest? request,
        CancellationToken ct = default)
    {
        // C45-A Hard Guard 2: mutations never cache.
        SyncHttpCacheHeaders.ApplyNoStore(Response);

        if (countyId == Guid.Empty)
        {
            return BadRequest(new { error = "countyId is required." });
        }
        if (workbookId == Guid.Empty)
        {
            return BadRequest(new { error = "workbookId is required." });
        }

        var principal = ResolveCountyClaim();
        if (principal is null || principal.Value != countyId)
        {
            _logger.LogWarning(
                "[Sync] PutActiveWorkbook refused cross-county access: principal={Principal} requested={Requested}",
                principal, countyId);
            return Forbid();
        }

        // Operator id is sourced from the principal, NOT from the
        // request body, so a malicious client cannot impersonate.
        // Falls back to the user.identity.name; "anonymous" never
        // reaches this code because [Authorize] blocks
        // unauthenticated requests upstream.
        var operatorId = User.Identity?.Name
            ?? User.FindFirst("sub")?.Value
            ?? "api-operator";

        // ── C45-C: optimistic concurrency via If-Match. When the
        //    client supplies the header, compute the current
        //    pointer's ETag and reject with 412 Precondition
        //    Failed unless it matches. Absent header preserves
        //    backward-compatible behavior. The check happens
        //    AFTER auth + county-isolation (Hard Guard 8) so
        //    412 cannot leak resource existence to cross-county
        //    callers — they hit 403 first. ──
        if (SyncHttpCacheHeaders.HasIfMatchHeader(Request))
        {
            var existing = await _activeWorkbook.GetAsync(countyId, ct);
            string? currentEtag = existing is null
                ? null
                : ComputeActiveWorkbookEtag(existing).Etag;
            if (!SyncHttpCacheHeaders.MatchesIfMatch(Request, currentEtag))
            {
                _logger.LogWarning(
                    "[Sync] PutActiveWorkbook precondition failed: county={CountyId} requestedWorkbookId={WorkbookId} hadCurrentPointer={HadPointer}",
                    countyId, workbookId, existing is not null);
                // no-store already applied at the top of the action
                // (Hard Guard 2); the 412 inherits it.
                return StatusCode(
                    StatusCodes.Status412PreconditionFailed,
                    new
                    {
                        error = "If-Match precondition failed.",
                        hint  = "The active-workbook pointer changed since you fetched it. Re-GET /api/sync/active-workbook to pick up the current ETag and retry.",
                        countyId,
                    });
            }
        }

        try
        {
            var snap = await _activeWorkbook.SetAsync(
                countyId, workbookId, operatorId, request?.Reason, ct);

            var dto = new ActiveWorkbookSnapshotDto(
                snap.CountyId, snap.ActiveWorkbookId, snap.SetAt, snap.SetBy, snap.SetReason);

            _logger.LogInformation(
                "[Sync] PutActiveWorkbook: county={CountyId} workbookId={WorkbookId} operator={Operator}",
                countyId, workbookId, operatorId);

            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            // C41-A Hard Guard 2 surfaces here: target not Mapped,
            // or workbook not in this county. Verbatim message;
            // body shape mirrors the BadRequest pattern used by the
            // comps endpoint so consumers parse one ProblemDetails
            // shape across the controller.
            _logger.LogWarning(
                "[Sync] PutActiveWorkbook rejected: county={CountyId} workbookId={WorkbookId} reason={Reason}",
                countyId, workbookId, ex.Message);
            return BadRequest(new
            {
                countyId,
                workbookId,
                error = ex.Message,
            });
        }
    }

    /// <summary>
    /// Slice C41-C: HTTP clear of the active-workbook pointer for a
    /// county. Idempotent at the service layer (clearing a county
    /// with no pointer is a no-op). This action distinguishes the
    /// no-pointer case with 404 so consumers can detect "I asked to
    /// clear but there was nothing there."
    /// </summary>
    [HttpDelete("active-workbook")]
    [Authorize]
    public async Task<IActionResult> DeleteActiveWorkbook(
        [FromQuery] Guid countyId,
        CancellationToken ct = default)
    {
        // C45-A Hard Guard 2: mutations never cache.
        SyncHttpCacheHeaders.ApplyNoStore(Response);

        if (countyId == Guid.Empty)
        {
            return BadRequest(new { error = "countyId is required." });
        }

        var principal = ResolveCountyClaim();
        if (principal is null || principal.Value != countyId)
        {
            _logger.LogWarning(
                "[Sync] DeleteActiveWorkbook refused cross-county access: principal={Principal} requested={Requested}",
                principal, countyId);
            return Forbid();
        }

        // Pre-check so the action surfaces 404 vs 204 distinctly.
        // The service's ClearAsync is idempotent at its own surface
        // (no-op when there's no row), so we can't rely on it to
        // tell us "did anything happen?". Hence the GET-then-Clear
        // pattern.
        var existing = await _activeWorkbook.GetAsync(countyId, ct);
        if (existing is null)
        {
            return NotFound(new
            {
                countyId,
                error = "No active-workbook pointer is configured for this county.",
            });
        }

        var operatorId = User.Identity?.Name
            ?? User.FindFirst("sub")?.Value
            ?? "api-operator";

        await _activeWorkbook.ClearAsync(countyId, operatorId, ct);

        _logger.LogInformation(
            "[Sync] DeleteActiveWorkbook: county={CountyId} clearedWorkbookId={WorkbookId} operator={Operator}",
            countyId, existing.ActiveWorkbookId, operatorId);

        return NoContent();
    }

    // ── Stale canonical-row diagnostic (Slice C43-B) ────────────────────────

    private const string BaselineSourceExplicit  = "explicit-query-param";
    private const string BaselineSourcePointer   = "active-workbook-pointer";

    /// <summary>
    /// Slice C43-B: HTTP exposure of the C43-A stale-row diagnostic.
    /// Returns canonical sale-qualification rows whose
    /// <c>SourceWorkbookId</c> differs from a baseline workbook id
    /// (the operator's <c>workbookId</c> query param OR the C41-B
    /// active-workbook pointer for the county).
    ///
    /// <para>Pure read; no canonical / PACS / workbook mutation,
    /// no AuditLogs writes (operational logging only). Inherits
    /// the C38-A endpoint contract pattern verbatim: auth required,
    /// county-isolation server-side, no PII, GET-only, paginated
    /// envelope mirroring C39-B.</para>
    ///
    /// <para>Baseline resolution per C43-A Hard Guard 4:
    /// <list type="bullet">
    /// <item>Explicit non-empty <c>workbookId</c> → use directly.</item>
    /// <item>Otherwise → consult the C41-B active-workbook pointer.</item>
    /// <item>Pointer absent + workbook id absent → 400 with the
    ///   locked operator message.</item>
    /// </list>
    /// </para>
    /// </summary>
    [HttpGet("comps/stale")]
    [HttpHead("comps/stale")]
    [Authorize]
    public async Task<IActionResult> GetStaleComps(
        [FromQuery] Guid countyId,
        [FromQuery] Guid? workbookId,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken ct = default)
    {
        // ── 400: required input missing / malformed ──
        if (countyId == Guid.Empty)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new { error = "countyId is required." });
        }

        // ── 400: pagination validation (C43-A inherits C39-A
        //        Hard Guard 3). No silent normalization. ──
        if (page is < 1)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error = "page must be >= 1.",
                hint  = "Omit the page query parameter to default to page 1.",
                page  = page,
            });
        }
        if (pageSize is < 1)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error    = "pageSize must be >= 1.",
                hint     = $"Omit the pageSize query parameter to default to {DefaultPageSize}.",
                pageSize = pageSize,
            });
        }
        if (pageSize is > MaxPageSize)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error    = $"pageSize must be <= {MaxPageSize}.",
                hint     = "Server-bounded per C43-A inherited C39-A Hard Guard 1 / 2.",
                pageSize = pageSize,
                maxPageSize = MaxPageSize,
            });
        }

        // ── 403: county isolation (mirrors GetEligibleComps). C45-A
        //        Hard Guard 8: 403 happens BEFORE ETag computation. ──
        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null || principalCountyId.Value != countyId)
        {
            _logger.LogWarning(
                "[Sync] GetStaleComps refused cross-county access: principal={Principal} requested={Requested}",
                principalCountyId, countyId);
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return Forbid();
        }

        // ── Baseline resolution (Hard Guard 4). Explicit (non-empty)
        //    workbookId wins; otherwise consult the active-workbook
        //    pointer; otherwise 400 with the locked operator message. ──
        Guid baselineWorkbookId;
        string baselineSource;
        if (workbookId.HasValue && workbookId.Value != Guid.Empty)
        {
            baselineWorkbookId = workbookId.Value;
            baselineSource     = BaselineSourceExplicit;
        }
        else
        {
            var ptr = await _activeWorkbook.GetAsync(countyId, ct);
            if (ptr is null)
            {
                SyncHttpCacheHeaders.ApplyNoStore(Response);
                return BadRequest(new
                {
                    error = $"Cannot compute staleness for county {countyId}: " +
                            "no workbookId supplied and no active-workbook pointer is configured. " +
                            "Provide ?workbookId= or set the county active workbook.",
                });
            }
            baselineWorkbookId = ptr.ActiveWorkbookId;
            baselineSource     = BaselineSourcePointer;
        }

        // ── Apply server-side defaults (after validation). ──
        var effectivePage     = page     ?? DefaultPage;
        var effectivePageSize = pageSize ?? DefaultPageSize;

        // ── C45-B: ETag seed = (countyId, baselineWorkbookId, page,
        //    pageSize, maxLockedAtUtc). Conditional short-circuit
        //    BEFORE any page materialization. ──
        var maxLockedAt = await _staleReader.MaxLockedAtAsync(countyId, baselineWorkbookId, ct);
        var lastModifiedUtc = ToLastModifiedUtc(maxLockedAt);
        var etag = SyncHttpCacheHeaders.BuildStrongEtag(
            EtagScopeStale,
            countyId.ToString(),
            baselineWorkbookId.ToString(),
            effectivePage.ToString(System.Globalization.CultureInfo.InvariantCulture),
            effectivePageSize.ToString(System.Globalization.CultureInfo.InvariantCulture),
            lastModifiedUtc.UtcDateTime.ToString("O", System.Globalization.CultureInfo.InvariantCulture));

        if (SyncHttpCacheHeaders.MatchesIfNoneMatch(Request, etag) ||
            SyncHttpCacheHeaders.MatchesIfModifiedSince(Request, lastModifiedUtc))
        {
            SyncHttpCacheHeaders.ApplyNotModifiedHeaders(Response, CompMaxAge, etag, CompStaleWhileRevalidate);
            return StatusCode(StatusCodes.Status304NotModified);
        }

        // C45-D: HEAD short-circuit (skip count + page reads).
        if (HttpMethods.IsHead(Request.Method))
        {
            SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, CompMaxAge, etag, lastModifiedUtc, CompStaleWhileRevalidate);
            return StatusCode(StatusCodes.Status200OK);
        }

        // ── Delegate to the C43-B reader. Single predicate;
        //    AsNoTracking; no joins. ──
        var totalCount = await _staleReader.CountAsync(countyId, baselineWorkbookId, ct);
        var pageRows   = await _staleReader.ReadPageAsync(
            countyId, baselineWorkbookId, effectivePage, effectivePageSize, ct);

        // ── Project to wire DTO. ComputedDecision is mapped from
        //    int → string for wire stability per C43-A. ──
        var items = pageRows
            .Select(s => new StaleSaleQualificationDto(
                s.ChgOfOwnerId,
                ProjectDecisionName(s.ComputedDecisionRaw),
                s.WacCdSourceValue,
                s.WacCdCanonicalValue,
                s.SlRatioTypeCdSourceValue,
                s.SlRatioTypeCdCanonicalValue,
                s.SaleDate,
                s.SalePrice,
                s.SourceWorkbookId,
                s.SourceWorkbookLockedAt))
            .ToList();

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling((double)totalCount / effectivePageSize);
        var hasNextPage     = effectivePage < totalPages;
        var hasPreviousPage = effectivePage > 1;

        var envelope = new PagedStaleSaleQualificationsDto(
            Items:              items,
            Page:               effectivePage,
            PageSize:           effectivePageSize,
            TotalCount:         totalCount,
            TotalPages:         totalPages,
            HasNextPage:        hasNextPage,
            HasPreviousPage:    hasPreviousPage,
            BaselineWorkbookId: baselineWorkbookId,
            BaselineSource:     baselineSource);

        _logger.LogInformation(
            "[Sync] GetStaleComps: county={CountyId} baseline={BaselineWorkbookId} via={BaselineSource} page={Page} pageSize={PageSize} rows={Rows} total={Total}",
            countyId, baselineWorkbookId, baselineSource, effectivePage, effectivePageSize, items.Count, totalCount);

        SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, CompMaxAge, etag, lastModifiedUtc, CompStaleWhileRevalidate);
        return Ok(envelope);
    }

    /// <summary>
    /// Map the int-stored
    /// <c>CanonicalSaleQualificationDecision</c> enum to the wire
    /// string per C43-A Hard Guard / DTO contract. Unknown values
    /// fall through to the integer-stringified form so the wire
    /// shape never silently misrepresents corrupted enum storage.
    /// </summary>
    private static string ProjectDecisionName(int rawDecision)
    {
        return rawDecision switch
        {
            (int)TerraFusion.Core.Entities.Canonical.CanonicalSaleQualificationDecision.Qualified
                => "Qualified",
            (int)TerraFusion.Core.Entities.Canonical.CanonicalSaleQualificationDecision.Excluded
                => "Excluded",
            (int)TerraFusion.Core.Entities.Canonical.CanonicalSaleQualificationDecision.Inconclusive
                => "Inconclusive",
            _ => rawDecision.ToString(System.Globalization.CultureInfo.InvariantCulture),
        };
    }

    // ── Stale canonical-row summary (Slice C44-B) ───────────────────────────

    /// <summary>
    /// Server-side cap on the number of groups returned by the
    /// summary endpoint per C44-A Hard Guard 4. Above this count
    /// the response truncates rather than throws.
    /// </summary>
    private const int MaxStaleSummaryGroups = 100;

    /// <summary>
    /// Slice C44-B: HTTP exposure of the C44-A stale-row aggregate
    /// summary. Returns counts of stale canonical sale-qualification
    /// rows grouped by <c>(SourceWorkbookId, ComputedDecision)</c>
    /// for a county, plus a single <c>totalStaleRows</c> top-line.
    ///
    /// <para>Sibling to <see cref="GetStaleComps"/> (C43-B) — the
    /// per-row endpoint answers "which sales are stale?", this
    /// endpoint answers "how many, broken down by prior workbook
    /// and decision?". Both endpoints share the same baseline
    /// resolution rule and the same locked stale predicate so the
    /// counts reconcile mechanically (C44-B test 17 locks
    /// <c>summary.totalStaleRows == perRow.totalCount</c> for
    /// matching inputs).</para>
    ///
    /// <para>Server-bounded: at most
    /// <see cref="MaxStaleSummaryGroups"/> groups per response.
    /// When the actual group count exceeds the cap, the response
    /// truncates (top-N by <c>count DESC</c>) and signals
    /// <c>Truncated = true</c> + the actual <c>GroupCount</c>.</para>
    ///
    /// <para>Hard Guard 11: <c>?page=</c> / <c>?pageSize=</c>
    /// parameters are explicitly rejected with 400 so future
    /// callers don't silently get unpaginated data when they
    /// expect a page.</para>
    /// </summary>
    [HttpGet("comps/stale/summary")]
    [HttpHead("comps/stale/summary")]
    [Authorize]
    public async Task<IActionResult> GetStaleCompsSummary(
        [FromQuery] Guid countyId,
        [FromQuery] Guid? workbookId,
        [FromQuery(Name = "page")]     int? rejectPage,
        [FromQuery(Name = "pageSize")] int? rejectPageSize,
        CancellationToken ct = default)
    {
        // ── 400: required input missing / malformed ──
        if (countyId == Guid.Empty)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new { error = "countyId is required." });
        }

        // ── 400: pagination params explicitly rejected (Hard Guard
        //        11). The summary endpoint is server-bounded; adding
        //        pagination is a breaking change requiring its own
        //        slice. Surface bad usage at request time. ──
        if (rejectPage.HasValue)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error = "page is not a valid query parameter on this endpoint.",
                hint  = "The summary endpoint is server-bounded (max 100 groups). Use /api/sync/comps/stale for paginated per-row detail.",
            });
        }
        if (rejectPageSize.HasValue)
        {
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return BadRequest(new
            {
                error = "pageSize is not a valid query parameter on this endpoint.",
                hint  = "The summary endpoint is server-bounded (max 100 groups). Use /api/sync/comps/stale for paginated per-row detail.",
            });
        }

        // ── 403: county isolation (mirrors GetStaleComps). C45-A
        //        Hard Guard 8: 403 happens BEFORE ETag computation. ──
        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null || principalCountyId.Value != countyId)
        {
            _logger.LogWarning(
                "[Sync] GetStaleCompsSummary refused cross-county access: principal={Principal} requested={Requested}",
                principalCountyId, countyId);
            SyncHttpCacheHeaders.ApplyNoStore(Response);
            return Forbid();
        }

        // ── Baseline resolution mirrors GetStaleComps verbatim
        //    (Hard Guard 5). Explicit Guid wins; otherwise consult
        //    the C41-B active-workbook pointer; otherwise 400 with
        //    the locked operator message. ──
        Guid baselineWorkbookId;
        string baselineSource;
        if (workbookId.HasValue && workbookId.Value != Guid.Empty)
        {
            baselineWorkbookId = workbookId.Value;
            baselineSource     = BaselineSourceExplicit;
        }
        else
        {
            var ptr = await _activeWorkbook.GetAsync(countyId, ct);
            if (ptr is null)
            {
                SyncHttpCacheHeaders.ApplyNoStore(Response);
                return BadRequest(new
                {
                    error = $"Cannot summarize staleness for county {countyId}: " +
                            "no workbookId supplied and no active-workbook pointer is configured. " +
                            "Provide ?workbookId= or set the county active workbook.",
                });
            }
            baselineWorkbookId = ptr.ActiveWorkbookId;
            baselineSource     = BaselineSourcePointer;
        }

        // ── Three reads: top-line total, group count (for
        //    truncation detection), and the bounded group list. ──
        var totalStaleRows = await _staleSummaryReader
            .TotalStaleRowsAsync(countyId, baselineWorkbookId, ct);
        var groupCount     = await _staleSummaryReader
            .GroupCountAsync(countyId, baselineWorkbookId, ct);

        // ── C45-B: ETag seed for the summary endpoint per C45-A
        //    Hard Guard 5. Includes totalStaleRows + groupCount so
        //    new stale rows or new group emergence rotates the
        //    ETag even if the maxLockedAtUtc happens to coincide. ──
        var maxLockedAt = await _staleSummaryReader.MaxLockedAtAsync(countyId, baselineWorkbookId, ct);
        var lastModifiedUtc = ToLastModifiedUtc(maxLockedAt);
        var etag = SyncHttpCacheHeaders.BuildStrongEtag(
            EtagScopeStaleSummary,
            countyId.ToString(),
            baselineWorkbookId.ToString(),
            totalStaleRows.ToString(System.Globalization.CultureInfo.InvariantCulture),
            groupCount.ToString(System.Globalization.CultureInfo.InvariantCulture),
            lastModifiedUtc.UtcDateTime.ToString("O", System.Globalization.CultureInfo.InvariantCulture));

        if (SyncHttpCacheHeaders.MatchesIfNoneMatch(Request, etag) ||
            SyncHttpCacheHeaders.MatchesIfModifiedSince(Request, lastModifiedUtc))
        {
            SyncHttpCacheHeaders.ApplyNotModifiedHeaders(Response, CompMaxAge, etag, CompStaleWhileRevalidate);
            return StatusCode(StatusCodes.Status304NotModified);
        }

        // C45-D: HEAD short-circuit. Skip the GroupAsync read (the
        // expensive one of the three reads); the caller already
        // has totalStaleRows + groupCount + the ETag they asked
        // for, and the framework elides the body anyway.
        if (HttpMethods.IsHead(Request.Method))
        {
            SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, CompMaxAge, etag, lastModifiedUtc, CompStaleWhileRevalidate);
            return StatusCode(StatusCodes.Status200OK);
        }

        var groupRows = await _staleSummaryReader
            .GroupAsync(countyId, baselineWorkbookId, MaxStaleSummaryGroups, ct);

        // ── Slice C46-B: workbook-name enrichment per the C46-A
        //    policy. Single round-trip lookup over the distinct
        //    SourceWorkbookId set; CountyId-scoped (Hard Guard 3
        //    defense in depth); AsNoTracking. Failure is non-fatal
        //    (Hard Guard 8): the summary still returns 200 with
        //    null names if the lookup throws. The reader's stale
        //    predicate is unaffected — name enrichment is a
        //    presentation concern, not a freshness signal (Hard
        //    Guard 6: cache-key invariance preserved). ──
        IReadOnlyDictionary<Guid, string?> nameMap;
        try
        {
            var distinctIds = groupRows
                .Select(g => g.SourceWorkbookId)
                .Distinct()
                .ToList();
            if (distinctIds.Count == 0)
            {
                nameMap = new Dictionary<Guid, string?>();
            }
            else
            {
                nameMap = await _db.SyncMappingWorkbooks
                    .AsNoTracking()
                    .Where(w => distinctIds.Contains(w.Id) && w.CountyId == countyId)
                    .Select(w => new { w.Id, w.Name })
                    .ToDictionaryAsync(
                        w => w.Id,
                        w => (string?)w.Name,
                        ct);
            }
        }
        catch (Exception ex)
        {
            // C46-A Hard Guard 8: lookup failure must NOT fail the
            // summary response. Log + degrade gracefully to
            // null-name rendering.
            _logger.LogWarning(ex,
                "[Sync] GetStaleCompsSummary workbook-name enrichment lookup failed for county {CountyId}; falling back to null names.",
                countyId);
            nameMap = new Dictionary<Guid, string?>();
        }

        // ── Project to wire DTO. ComputedDecision maps int → string
        //    via the same helper GetStaleComps uses, so both
        //    endpoints' wire shapes stay in lockstep. ──
        var groups = groupRows
            .Select(g => new StaleSummaryGroupDto(
                g.SourceWorkbookId,
                nameMap.TryGetValue(g.SourceWorkbookId, out var name) ? name : null,
                ProjectDecisionName(g.ComputedDecisionRaw),
                g.Count))
            .ToList();

        var dto = new StaleSummaryDto(
            CountyId:           countyId,
            BaselineWorkbookId: baselineWorkbookId,
            BaselineSource:     baselineSource,
            TotalStaleRows:     totalStaleRows,
            GroupCount:         groupCount,
            Groups:             groups,
            Truncated:          groupCount > MaxStaleSummaryGroups);

        _logger.LogInformation(
            "[Sync] GetStaleCompsSummary: county={CountyId} baseline={BaselineWorkbookId} via={BaselineSource} totalStaleRows={Total} groupCount={GroupCount} truncated={Truncated}",
            countyId, baselineWorkbookId, baselineSource,
            totalStaleRows, groupCount, dto.Truncated);

        SyncHttpCacheHeaders.ApplyPrivateCacheHeaders(Response, CompMaxAge, etag, lastModifiedUtc, CompStaleWhileRevalidate);
        return Ok(dto);
    }
}
