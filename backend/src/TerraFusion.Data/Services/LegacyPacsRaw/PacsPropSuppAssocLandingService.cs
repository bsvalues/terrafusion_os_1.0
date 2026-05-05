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
using TerraFusion.Core.Sync.PacsPropSuppAssoc;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice S2-A: drains an <see cref="IPacsPropSuppAssocSource"/> into
/// <c>legacy_pacs_raw.prop_supp_assoc</c> with full provenance and
/// records three S2-A promotion gates:
///
/// <list type="bullet">
///   <item><c>prop-supp-assoc-distribution</c> — informational; year histogram.</item>
///   <item><c>prop-supp-assoc-uniqueness</c> — FAIL when any
///   <c>(PropId, PropValYr)</c> appears more than once; PASS otherwise.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks <c>load_batch_id</c> or <c>source_query_hash</c>.</item>
/// </list>
/// </summary>
public sealed class PacsPropSuppAssocLandingService : IPacsPropSuppAssocLandingService
{
    private const int BatchSize = 1000;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsPropSuppAssocLandingService> _logger;

    public PacsPropSuppAssocLandingService(
        TerraFusionDbContext db,
        ILogger<PacsPropSuppAssocLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsPropSuppAssocLandingResult> LandPropSuppAssocsAsync(
        IPacsPropSuppAssocSource source,
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
        var yearHistogram = new Dictionary<short, int>();
        var keyCounts = new Dictionary<(int PropId, short PropValYr), int>();

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
                .StreamPropSuppAssocsAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                var landed = new LegacyPacsRawPropSuppAssoc
                {
                    PropValYr = src.PropValYr,
                    PropId = src.PropId,
                    SupNum = src.SupNum,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                };
                _db.LegacyPacsRawPropSuppAssocs.Add(landed);

                yearHistogram[src.PropValYr] =
                    yearHistogram.TryGetValue(src.PropValYr, out var yc) ? yc + 1 : 1;
                var key = (src.PropId, src.PropValYr);
                keyCounts[key] =
                    keyCounts.TryGetValue(key, out var kc) ? kc + 1 : 1;

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
                batch, yearHistogram, duplicateKeyViolations, rowsLanded,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS prop_supp_assoc landing COMPLETED. batch={BatchId} rows={Rows} duplicates={Dups} years={Years}",
                batch.LoadBatchId, rowsLanded, duplicateKeyViolations, yearHistogram.Count);

            return new PacsPropSuppAssocLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateKeyViolations = duplicateKeyViolations,
                DistinctYears = yearHistogram.Count,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogError(ex,
                "PACS prop_supp_assoc landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsPropSuppAssocLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                DuplicateKeyViolations = 0,
                DistinctYears = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        IReadOnlyDictionary<short, int> yearHistogram,
        int duplicateKeyViolations,
        int rowsLanded,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) prop-supp-assoc-distribution — informational year histogram.
        var distDetail = string.Join(",",
            yearHistogram.OrderBy(kv => kv.Key)
                .Select(kv => $"{kv.Key}={kv.Value}"));
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "prop-supp-assoc-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail.Length == 0 ? "(empty)" : distDetail,
            ExecutedAt = now,
        });

        // 2) prop-supp-assoc-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "prop-supp-assoc-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (prop_id, prop_val_yr) is unique"
                : $"{duplicateKeyViolations} (prop_id, prop_val_yr) keys appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB, not from in-process counters.
        var unprovenanced = await _db.LegacyPacsRawPropSuppAssocs
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

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourcePropSuppAssoc src)
    {
        var seed = string.Join("|",
            src.PropValYr.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture));
        return ComputeStableHash(seed);
    }
}
