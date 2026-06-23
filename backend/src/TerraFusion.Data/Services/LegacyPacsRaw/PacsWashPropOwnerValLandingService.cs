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
using TerraFusion.Core.Sync.PacsWashPropOwnerVal;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice B1-C: drains an <see cref="IPacsWashPropOwnerValSource"/>
/// into <c>legacy_pacs_raw.wash_prop_owner_val</c> with full
/// provenance and records four B1-C promotion gates:
///
/// <list type="bullet">
///   <item><c>wash-prop-owner-val-distribution</c> — informational;
///   year + BOE-status histogram.</item>
///   <item><c>wash-prop-owner-val-key-uniqueness</c> — FAIL when
///   any 4-key tuple appears more than once; PASS otherwise.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks <c>load_batch_id</c> or <c>source_query_hash</c>.</item>
///   <item><c>wash-prop-owner-val-aggregate</c> — informational;
///   reports <c>AssessedVal</c> + <c>MarketVal</c> sums so an
///   operator can spot-check totals against the source.</item>
/// </list>
/// </summary>
public sealed class PacsWashPropOwnerValLandingService : IPacsWashPropOwnerValLandingService
{
    private const int BatchSize = 1000;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsWashPropOwnerValLandingService> _logger;

    public PacsWashPropOwnerValLandingService(
        TerraFusionDbContext db,
        ILogger<PacsWashPropOwnerValLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsWashPropOwnerValLandingResult> LandWashPropOwnerValsAsync(
        IPacsWashPropOwnerValSource source,
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
        var keyCounts = new Dictionary<(short Year, short Sup, int PropId, long OwnerId), int>();
        var yearHistogram = new Dictionary<short, int>();
        var boeHistogram = new Dictionary<string, int>(StringComparer.Ordinal);
        decimal assessedSum = 0m;
        decimal marketSum = 0m;

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
                .StreamWashPropOwnerValsAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                _db.LegacyPacsRawWashPropOwnerVals.Add(new LegacyPacsRawWashPropOwnerVal
                {
                    PropValYr = src.PropValYr,
                    SupNum = src.SupNum,
                    PropId = src.PropId,
                    OwnerId = src.OwnerId,
                    AssessedVal = src.AssessedVal,
                    MarketVal = src.MarketVal,
                    AppraisedVal = src.AppraisedVal,
                    TaxableClassified = src.TaxableClassified,
                    TaxableNonClassified = src.TaxableNonClassified,
                    LandTaxableClassified = src.LandTaxableClassified,
                    LandTaxableNonClassified = src.LandTaxableNonClassified,
                    ImprvTaxableClassified = src.ImprvTaxableClassified,
                    ImprvTaxableNonClassified = src.ImprvTaxableNonClassified,
                    StateValueClassified = src.StateValueClassified,
                    StateValueNonClassified = src.StateValueNonClassified,
                    BoeStatus = src.BoeStatus,
                    DisasterProrationPct = src.DisasterProrationPct,
                    SnrFrzImprvHs = src.SnrFrzImprvHs,
                    SnrFrzLandHs = src.SnrFrzLandHs,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                });

                var key = (src.PropValYr, src.SupNum, src.PropId, src.OwnerId);
                keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;

                yearHistogram[src.PropValYr] =
                    yearHistogram.TryGetValue(src.PropValYr, out var yc) ? yc + 1 : 1;
                if (!string.IsNullOrEmpty(src.BoeStatus))
                {
                    boeHistogram[src.BoeStatus] =
                        boeHistogram.TryGetValue(src.BoeStatus, out var bc) ? bc + 1 : 1;
                }

                if (src.AssessedVal.HasValue) assessedSum += src.AssessedVal.Value;
                if (src.MarketVal.HasValue) marketSum += src.MarketVal.Value;

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
                yearHistogram, boeHistogram,
                assessedSum, marketSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS wash_prop_owner_val landing COMPLETED. batch={BatchId} rows={Rows} duplicates={Dups} years={Years} assessedSum={AS} marketSum={MS}",
                batch.LoadBatchId, rowsLanded, duplicateKeyViolations,
                yearHistogram.Count, assessedSum, marketSum);

            return new PacsWashPropOwnerValLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateKeyViolations = duplicateKeyViolations,
                DistinctYears = yearHistogram.Count,
                AssessedValSum = assessedSum,
                MarketValSum = marketSum,
            };
        }
        catch (OperationCanceledException)
        {
            batch.Status = "CANCELLED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = "Cancelled by caller (request timeout or explicit cancellation).";
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogWarning(
                "PACS wash_prop_owner_val landing CANCELLED. batch={BatchId}", batch.LoadBatchId);
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
                "PACS wash_prop_owner_val landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsWashPropOwnerValLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                DuplicateKeyViolations = 0,
                DistinctYears = 0,
                AssessedValSum = 0m,
                MarketValSum = 0m,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int rowsLanded,
        int duplicateKeyViolations,
        IReadOnlyDictionary<short, int> yearHistogram,
        IReadOnlyDictionary<string, int> boeHistogram,
        decimal assessedSum,
        decimal marketSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) wash-prop-owner-val-distribution — informational PASS.
        var yearDetail = string.Join(",",
            yearHistogram.OrderBy(kv => kv.Key)
                .Select(kv => $"yr{kv.Key}={kv.Value}"));
        var boeDetail = string.Join(",",
            boeHistogram.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"boe{kv.Key}={kv.Value}"));
        var distDetail = $"rows={rowsLanded} {yearDetail} {boeDetail}".Trim();
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "wash-prop-owner-val-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail,
            ExecutedAt = now,
        });

        // 2) wash-prop-owner-val-key-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "wash-prop-owner-val-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (year, sup_num, prop_id, owner_id) is unique"
                : $"{duplicateKeyViolations} 4-key tuples appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB.
        var unprovenanced = await _db.LegacyPacsRawWashPropOwnerVals
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

        // 4) wash-prop-owner-val-aggregate — informational; surfaces
        //    sums so the operator can spot-check totals.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "wash-prop-owner-val-aggregate",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"assessedValSum={assessedSum.ToString(CultureInfo.InvariantCulture)} " +
                     $"marketValSum={marketSum.ToString(CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourceWashPropOwnerVal src)
    {
        var seed = string.Join("|",
            src.PropValYr.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.OwnerId.ToString(CultureInfo.InvariantCulture),
            src.AssessedVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.MarketVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.AppraisedVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.TaxableClassified?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.TaxableNonClassified?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.BoeStatus ?? "",
            src.DisasterProrationPct?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.SnrFrzImprvHs?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.SnrFrzLandHs?.ToString(CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
