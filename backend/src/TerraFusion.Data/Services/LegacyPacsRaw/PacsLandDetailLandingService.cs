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
using TerraFusion.Core.Sync.PacsLandDetail;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice L1: drains an <see cref="IPacsLandDetailSource"/> into
/// <c>legacy_pacs_raw.land_detail</c> with full provenance and
/// records four L1 promotion gates:
///
/// <list type="bullet">
///   <item><c>land-detail-distribution</c> — informational; type-cd histogram.</item>
///   <item><c>land-detail-key-uniqueness</c> — FAIL when any 4-key
///   tuple appears more than once.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks <c>load_batch_id</c> or <c>source_query_hash</c>.</item>
///   <item><c>land-detail-aggregate</c> — informational; reports
///   <c>SizeAcres</c> + <c>LandSegMarketVal</c> sums for spot-checking
///   against the source.</item>
/// </list>
/// </summary>
public sealed class PacsLandDetailLandingService : IPacsLandDetailLandingService
{
    private const int BatchSize = 1000;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsLandDetailLandingService> _logger;

    public PacsLandDetailLandingService(
        TerraFusionDbContext db,
        ILogger<PacsLandDetailLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsLandDetailLandingResult> LandLandDetailsAsync(
        IPacsLandDetailSource source,
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

        var rowsLanded = 0;
        var pending = 0;
        var keyCounts = new Dictionary<(short, short, int, long), int>();
        var typeHistogram = new Dictionary<string, int>(StringComparer.Ordinal);
        decimal acresSum = 0m;
        decimal marketValSum = 0m;

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
                .StreamLandDetailsAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                _db.LegacyPacsRawLandDetails.Add(new LegacyPacsRawLandDetail
                {
                    PropValYr = src.PropValYr,
                    SupNum = src.SupNum,
                    PropId = src.PropId,
                    LandSegId = src.LandSegId,
                    LandSegTypeCd = src.LandSegTypeCd,
                    LandSegStateCd = src.LandSegStateCd,
                    LandSegClassCd = src.LandSegClassCd,
                    LandSegUseCd = src.LandSegUseCd,
                    SoilCd = src.SoilCd,
                    LandSegHomesite = src.LandSegHomesite,
                    SizeAcres = src.SizeAcres,
                    SizeSquareFeet = src.SizeSquareFeet,
                    LandSegMarketVal = src.LandSegMarketVal,
                    LandSegAgValue = src.LandSegAgValue,
                    LandSegAssessedVal = src.LandSegAssessedVal,
                    LandSegEffAge = src.LandSegEffAge,
                    AgApply = src.AgApply,
                    AgUseCd = src.AgUseCd,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                });

                var key = (src.PropValYr, src.SupNum, src.PropId, src.LandSegId);
                keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;

                if (!string.IsNullOrEmpty(src.LandSegTypeCd))
                {
                    typeHistogram[src.LandSegTypeCd] =
                        typeHistogram.TryGetValue(src.LandSegTypeCd, out var tc) ? tc + 1 : 1;
                }
                if (src.SizeAcres.HasValue) acresSum += src.SizeAcres.Value;
                if (src.LandSegMarketVal.HasValue) marketValSum += src.LandSegMarketVal.Value;

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

            var duplicateKeyViolations = keyCounts.Values.Count(c => c > 1);

            await WriteGatesAsync(
                batch, rowsLanded, duplicateKeyViolations,
                typeHistogram, acresSum, marketValSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS land_detail landing COMPLETED. batch={BatchId} rows={Rows} duplicates={Dups} types={Types} acresSum={AcresSum} marketValSum={MV}",
                batch.LoadBatchId, rowsLanded, duplicateKeyViolations,
                typeHistogram.Count, acresSum, marketValSum);

            return new PacsLandDetailLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateKeyViolations = duplicateKeyViolations,
                TypeCdHistogram = typeHistogram,
                SizeAcresSum = acresSum,
                LandSegMarketValSum = marketValSum,
            };
        }
        catch (OperationCanceledException)
        {
            batch.Status = "CANCELLED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = "Cancelled by caller (request timeout or explicit cancellation).";
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogWarning(
                "PACS land_detail landing CANCELLED. batch={BatchId}", batch.LoadBatchId);
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
                "PACS land_detail landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsLandDetailLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                DuplicateKeyViolations = 0,
                TypeCdHistogram = new Dictionary<string, int>(),
                SizeAcresSum = 0m,
                LandSegMarketValSum = 0m,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int rowsLanded,
        int duplicateKeyViolations,
        IReadOnlyDictionary<string, int> typeHistogram,
        decimal acresSum,
        decimal marketValSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) land-detail-distribution — informational PASS.
        var typeDetail = string.Join(",",
            typeHistogram.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"type{kv.Key}={kv.Value}"));
        var distDetail = $"rows={rowsLanded} {typeDetail}".Trim();
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "land-detail-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail,
            ExecutedAt = now,
        });

        // 2) land-detail-key-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "land-detail-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (year, sup, prop_id, land_seg_id) is unique"
                : $"{duplicateKeyViolations} 4-key tuples appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB.
        var unprovenanced = await _db.LegacyPacsRawLandDetails
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

        // 4) land-detail-aggregate — informational; sums.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "land-detail-aggregate",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"sizeAcresSum={acresSum.ToString(CultureInfo.InvariantCulture)} " +
                     $"landSegMarketValSum={marketValSum.ToString(CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourceLandDetail src)
    {
        var seed = string.Join("|",
            src.PropValYr.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.LandSegId.ToString(CultureInfo.InvariantCulture),
            src.LandSegTypeCd ?? "",
            src.LandSegStateCd ?? "",
            src.LandSegClassCd ?? "",
            src.LandSegUseCd ?? "",
            src.SoilCd ?? "",
            src.LandSegHomesite ?? "",
            src.SizeAcres?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.SizeSquareFeet?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.LandSegMarketVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.LandSegAgValue?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.LandSegAssessedVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.LandSegEffAge?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.AgApply ?? "",
            src.AgUseCd ?? "");
        return ComputeStableHash(seed);
    }
}
