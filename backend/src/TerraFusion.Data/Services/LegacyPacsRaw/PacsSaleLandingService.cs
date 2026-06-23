using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsSale;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice S1: PACS sale raw landing orchestrator. See the four
/// promotion gates documented in
/// <c>docs/plans/terrafusion-90-day-execution-plan.md</c> §4
/// Block A.
///
/// <list type="bullet">
///   <item><c>sale-code-distribution</c> — informational PASS, records the histogram.</item>
///   <item><c>stale-valid-sale-code-rejection</c> — FAIL when any
///   row carries <c>sl_county_ratio_cd</c> in <c>{"01","02"}</c>; PASS otherwise.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks a <c>load_batch_id</c> or <c>source_query_hash</c>;
///   PASS otherwise.</item>
///   <item><c>cutover-acknowledgment</c> — informational PASS,
///   records pre-2018 / post-2018 / unknown counts.</item>
/// </list>
/// </summary>
public sealed class PacsSaleLandingService : IPacsSaleLandingService
{
    private const int BatchSize = 500;

    /// <summary>
    /// 2017 cutover boundary. Sales strictly before this are
    /// "pre-2018"; on/after are "post-2018".
    /// </summary>
    private static readonly DateTime CutoverUtc =
        new(2018, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>
    /// The stale legacy qualification vocabulary. Modern data MUST
    /// NOT contain these values for <c>sl_county_ratio_cd</c>; the
    /// modern axis is the 3-digit <c>"100"</c>/<c>"200"</c>/...
    /// closed set.
    /// </summary>
    private static readonly HashSet<string> StaleValidSaleCodes =
        new(StringComparer.OrdinalIgnoreCase) { "01", "02" };

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsSaleLandingService> _logger;

    public PacsSaleLandingService(
        TerraFusionDbContext db,
        ILogger<PacsSaleLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsSaleLandingResult> LandSalesAsync(
        IPacsSaleSource source,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);

        var queryHash = ComputeStableHash(source.SourceQueryText);

        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = source.SourceSystem,
            SourceFileOrDatabase = source.SourceFileOrDatabase,
            SourceQueryHash = queryHash,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var distribution = new Dictionary<string, int>(StringComparer.Ordinal);
        var staleViolations = 0;
        var pre2018 = 0;
        var post2018 = 0;
        var unknownDate = 0;
        var rowsLanded = 0;
        var pending = 0;

        try
        {
            // SYNC-COMPLETE-2: bulk-insert optimization. See BulkInsertScope.
            // Validated 1.58× speedup at N=20k (89→141 rows/sec) via
            // /api/debug/perf-test/bulk-insert-synthetic. Effect compounds
            // at full-corpus N=95k+. Scoped to the streaming loop only —
            // post-loop batch.Status = "COMPLETED" modifications run with
            // AutoDetectChanges restored so the LoadBatch update is captured.
            using (var _bulkScope = BulkInsertScope.Begin(_db))
            {
            await foreach (var src in source
                .StreamSalesAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                var landed = new LegacyPacsRawSale
                {
                    ChgOfOwnerId = src.ChgOfOwnerId,
                    PropId = src.PropId,
                    PropValYr = src.PropValYr,
                    SupNum = src.SupNum,
                    SlCountyRatioCd = src.SlCountyRatioCd,
                    WacCd = src.WacCd,
                    SlRatioTypeCd = src.SlRatioTypeCd,
                    SlDt = src.SlDt,
                    SlPrice = src.SlPrice,
                    AdjSlPrice = src.AdjSlPrice,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                };
                _db.LegacyPacsRawSales.Add(landed);

                // Distribution + stale-code accounting.
                var key = src.SlCountyRatioCd ?? "<NULL>";
                distribution[key] = distribution.TryGetValue(key, out var c) ? c + 1 : 1;
                if (src.SlCountyRatioCd is not null
                    && StaleValidSaleCodes.Contains(src.SlCountyRatioCd))
                {
                    staleViolations++;
                }

                // Cutover accounting.
                if (src.SlDt is null)
                {
                    unknownDate++;
                }
                else if (src.SlDt.Value.ToUniversalTime() < CutoverUtc)
                {
                    pre2018++;
                }
                else
                {
                    post2018++;
                }

                rowsLanded++;
                pending++;
                if (pending >= BatchSize)
                {
                    await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                    pending = 0;
                }
            }

            if (pending > 0)
            {
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }
            } // end BulkInsertScope — AutoDetectChanges restored here so post-loop SaveChanges captures batch.Status updates

            await WriteGatesAsync(
                batch, distribution, staleViolations,
                pre2018, post2018, unknownDate, rowsLanded,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded; // S1 lands == promotes to legacy_pacs_raw
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS sale landing COMPLETED. batch={BatchId} rows={Rows} stale={Stale} pre2018={Pre} post2018={Post} unknownDate={Unknown}",
                batch.LoadBatchId, rowsLanded, staleViolations, pre2018, post2018, unknownDate);

            return new PacsSaleLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                CodeDistribution = distribution,
                StaleCodeViolations = staleViolations,
                Pre2018Count = pre2018,
                Post2018Count = post2018,
                UnknownDateCount = unknownDate,
            };
        }
        catch (OperationCanceledException)
        {
            batch.Status = "CANCELLED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = "Cancelled by caller (request timeout or explicit cancellation).";
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogWarning(
                "PACS sale landing CANCELLED. batch={BatchId}", batch.LoadBatchId);
            throw;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogError(ex,
                "PACS sale landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsSaleLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                CodeDistribution = new Dictionary<string, int>(),
                StaleCodeViolations = 0,
                Pre2018Count = 0,
                Post2018Count = 0,
                UnknownDateCount = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        IReadOnlyDictionary<string, int> distribution,
        int staleViolations,
        int pre2018,
        int post2018,
        int unknownDate,
        int rowsLanded,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) sale-code-distribution — informational, always PASS.
        var distDetail = string.Join(",",
            distribution.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"{kv.Key}={kv.Value}"));
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "sale-code-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail.Length == 0 ? "(empty)" : distDetail,
            ExecutedAt = now,
        });

        // 2) stale-valid-sale-code-rejection — modern data must have ZERO
        //    rows with sl_county_ratio_cd in {'01','02'}.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "stale-valid-sale-code-rejection",
            GateStage = "SOURCE_TO_RAW",
            Status = staleViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = staleViolations.ToString(CultureInfo.InvariantCulture),
            Detail = staleViolations == 0
                ? "no rows with stale legacy sl_county_ratio_cd in {01,02}"
                : $"{staleViolations} rows carry stale legacy sl_county_ratio_cd in {{01,02}}; modern axis is the 3-digit closed set",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — every landed row has LoadBatchId AND
        //    SourceQueryHash. We assert this from DB rather than from
        //    in-process counters so a doctrine violation can't be
        //    masked by a buggy implementation.
        var unprovenanced = await _db.LegacyPacsRawSales
            .Where(r => r.LoadBatchId == batch.LoadBatchId
                        && (r.LoadBatchId == Guid.Empty
                            || string.IsNullOrEmpty(r.SourceQueryHash)))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "provenance-coverage",
            GateStage = "SOURCE_TO_RAW",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0
                ? $"all {rowsLanded} landed rows have load_batch_id and source_query_hash"
                : $"{unprovenanced} rows lack provenance",
            ExecutedAt = now,
        });

        // 4) cutover-acknowledgment — informational record of the
        //    pre-2018 / post-2018 / unknown-date split. This makes
        //    the 2017 cutover visible in every batch's audit trail.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "cutover-acknowledgment",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"pre2018={pre2018} post2018={post2018} unknownDate={unknownDate}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// SHA-256 hex truncated to 16 chars. Stable across invocations
    /// for the same input — hash on text, not on .NET object identity.
    /// </summary>
    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    /// <summary>
    /// Fingerprint of a source-side sale row. Used by future change-
    /// detection slices; not consulted in S1 itself.
    /// </summary>
    internal static string ComputeRowHash(PacsSourceSale src)
    {
        var seed = string.Join("|",
            src.ChgOfOwnerId.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.PropValYr.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture),
            src.SlCountyRatioCd ?? "",
            src.WacCd ?? "",
            src.SlRatioTypeCd ?? "",
            src.SlDt?.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture) ?? "",
            src.SlPrice?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.AdjSlPrice?.ToString(CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
