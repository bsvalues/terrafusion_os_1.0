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
using TerraFusion.Core.Sync.PacsPropertyVal;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V4: drains an
/// <see cref="IPacsPropertyValSource"/> into
/// <c>legacy_pacs_raw.property_val</c> with full provenance and
/// records four landing gates (distribution, key-uniqueness,
/// provenance-coverage, use-cd-coverage).
/// </summary>
public sealed class PacsPropertyValLandingService : IPacsPropertyValLandingService
{
    private const int BatchSize = 1000;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsPropertyValLandingService> _logger;

    public PacsPropertyValLandingService(
        TerraFusionDbContext db,
        ILogger<PacsPropertyValLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsPropertyValLandingResult> LandPropertyValsAsync(
        IPacsPropertyValSource source,
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
        var rowsWithUseCd = 0;
        var pending = 0;
        var keyCounts = new Dictionary<(short, short, int), int>();

        try
        {
            using (var _bulkScope = BulkInsertScope.Begin(_db))
            {
                await foreach (var src in source
                    .StreamPropertyValsAsync(cancellationToken)
                    .ConfigureAwait(false))
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    _db.LegacyPacsRawPropertyVals.Add(new LegacyPacsRawPropertyVal
                    {
                        PropValYr = src.PropValYr,
                        SupNum = src.SupNum,
                        PropId = src.PropId,
                        PropertyUseCd = src.PropertyUseCd,
                        PropInactiveDt = src.PropInactiveDt,
                        LoadBatchId = batch.LoadBatchId,
                        SourceQueryHash = queryHash,
                        SourceRowHash = ComputeRowHash(src),
                        LandedAt = DateTime.UtcNow,
                    });

                    var key = (src.PropValYr, src.SupNum, src.PropId);
                    keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;
                    if (!string.IsNullOrEmpty(src.PropertyUseCd)) rowsWithUseCd++;

                    rowsLanded++;
                    pending++;
                    if (pending >= BatchSize)
                    {
                        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                        pending = 0;
                    }
                }

                if (pending > 0)
                    await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            var duplicateKeyViolations = keyCounts.Values.Count(c => c > 1);

            await WriteGatesAsync(
                batch, rowsLanded, duplicateKeyViolations, rowsWithUseCd,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS property_val landing COMPLETED. batch={BatchId} rows={Rows} duplicates={Dups} useCd={UseCd}",
                batch.LoadBatchId, rowsLanded, duplicateKeyViolations, rowsWithUseCd);

            return new PacsPropertyValLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateKeyViolations = duplicateKeyViolations,
                RowsWithPropertyUseCd = rowsWithUseCd,
            };
        }
        catch (OperationCanceledException)
        {
            batch.Status = "CANCELLED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = "Cancelled by caller (request timeout or explicit cancellation).";
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogWarning(
                "PACS property_val landing CANCELLED. batch={BatchId}", batch.LoadBatchId);
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
                "PACS property_val landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsPropertyValLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                DuplicateKeyViolations = 0,
                RowsWithPropertyUseCd = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int rowsLanded,
        int duplicateKeyViolations,
        int rowsWithUseCd,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) property-val-distribution — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "property-val-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"rows={rowsLanded} withUseCd={rowsWithUseCd}",
            ExecutedAt = now,
        });

        // 2) property-val-key-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "property-val-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (year, sup, prop_id) is unique"
                : $"{duplicateKeyViolations} 3-key tuples appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB.
        var unprovenanced = await _db.LegacyPacsRawPropertyVals
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

        // 4) property-val-use-cd-coverage — informational; share of
        //    rows that landed a non-null property_use_cd. Useful to
        //    audit PACS data quality independently of doctrine
        //    classification.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "property-val-use-cd-coverage",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsWithUseCd.ToString(CultureInfo.InvariantCulture),
            Detail = rowsLanded == 0
                ? "no rows landed"
                : $"{rowsWithUseCd}/{rowsLanded} rows have property_use_cd",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourcePropertyVal src)
    {
        var seed = string.Join("|",
            src.PropValYr.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.PropertyUseCd ?? "",
            src.PropInactiveDt?.ToString("o", CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
