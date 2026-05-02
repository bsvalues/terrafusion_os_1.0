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
using TerraFusion.Core.Sync.PacsImprv;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice C1-A: drains an <see cref="IPacsImprvSource"/> into
/// <c>legacy_pacs_raw.imprv</c> with full provenance and records
/// four C1-A promotion gates:
///
/// <list type="bullet">
///   <item><c>imprv-distribution</c> — informational; year + type-cd histogram.</item>
///   <item><c>imprv-key-uniqueness</c> — FAIL when any 4-key tuple
///   appears more than once; PASS otherwise.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks <c>load_batch_id</c> or <c>source_query_hash</c>.</item>
///   <item><c>imprv-aggregate</c> — informational; reports the
///   sum of <c>ImprvVal</c> for spot-checking against the source.</item>
/// </list>
/// </summary>
public sealed class PacsImprvLandingService : IPacsImprvLandingService
{
    private const int BatchSize = 1000;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsImprvLandingService> _logger;

    public PacsImprvLandingService(
        TerraFusionDbContext db,
        ILogger<PacsImprvLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsImprvLandingResult> LandImprvsAsync(
        IPacsImprvSource source,
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
        var keyCounts = new Dictionary<(short Year, short Sup, int PropId, long ImprvId), int>();
        var yearHistogram = new Dictionary<short, int>();
        var typeHistogram = new Dictionary<string, int>(StringComparer.Ordinal);
        decimal imprvValSum = 0m;

        try
        {
            await foreach (var src in source
                .StreamImprvsAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                _db.LegacyPacsRawImprvs.Add(new LegacyPacsRawImprv
                {
                    PropValYr = src.PropValYr,
                    SupNum = src.SupNum,
                    PropId = src.PropId,
                    ImprvId = src.ImprvId,
                    ImprvTypeCd = src.ImprvTypeCd,
                    ImprvStateCd = src.ImprvStateCd,
                    ImprvClassCd = src.ImprvClassCd,
                    ImprvHomesite = src.ImprvHomesite,
                    ImprvVal = src.ImprvVal,
                    ImprvDesc = src.ImprvDesc,
                    YearBuilt = src.YearBuilt,
                    EffectiveYearBuilt = src.EffectiveYearBuilt,
                    ActualYearBuilt = src.ActualYearBuilt,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                });

                var key = (src.PropValYr, src.SupNum, src.PropId, src.ImprvId);
                keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;

                yearHistogram[src.PropValYr] =
                    yearHistogram.TryGetValue(src.PropValYr, out var yc) ? yc + 1 : 1;
                if (!string.IsNullOrEmpty(src.ImprvTypeCd))
                {
                    typeHistogram[src.ImprvTypeCd] =
                        typeHistogram.TryGetValue(src.ImprvTypeCd, out var tc) ? tc + 1 : 1;
                }

                if (src.ImprvVal.HasValue) imprvValSum += src.ImprvVal.Value;

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

            var duplicateKeyViolations = keyCounts.Values.Count(c => c > 1);

            await WriteGatesAsync(
                batch, rowsLanded, duplicateKeyViolations,
                yearHistogram, typeHistogram, imprvValSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS imprv landing COMPLETED. batch={BatchId} rows={Rows} duplicates={Dups} types={Types} imprvValSum={IVS}",
                batch.LoadBatchId, rowsLanded, duplicateKeyViolations,
                typeHistogram.Count, imprvValSum);

            return new PacsImprvLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateKeyViolations = duplicateKeyViolations,
                TypeCdHistogram = typeHistogram,
                ImprvValSum = imprvValSum,
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
                "PACS imprv landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsImprvLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                DuplicateKeyViolations = 0,
                TypeCdHistogram = new Dictionary<string, int>(),
                ImprvValSum = 0m,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int rowsLanded,
        int duplicateKeyViolations,
        IReadOnlyDictionary<short, int> yearHistogram,
        IReadOnlyDictionary<string, int> typeHistogram,
        decimal imprvValSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) imprv-distribution — informational PASS.
        var yearDetail = string.Join(",",
            yearHistogram.OrderBy(kv => kv.Key)
                .Select(kv => $"yr{kv.Key}={kv.Value}"));
        var typeDetail = string.Join(",",
            typeHistogram.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"type{kv.Key}={kv.Value}"));
        var distDetail = $"rows={rowsLanded} {yearDetail} {typeDetail}".Trim();
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "imprv-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail,
            ExecutedAt = now,
        });

        // 2) imprv-key-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "imprv-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (prop_val_yr, sup_num, prop_id, imprv_id) is unique"
                : $"{duplicateKeyViolations} 4-key tuples appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB.
        var unprovenanced = await _db.LegacyPacsRawImprvs
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

        // 4) imprv-aggregate — informational; surfaces ImprvVal sum.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "imprv-aggregate",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"imprvValSum={imprvValSum.ToString(CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourceImprv src)
    {
        var seed = string.Join("|",
            src.PropValYr.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.ImprvId.ToString(CultureInfo.InvariantCulture),
            src.ImprvTypeCd ?? "",
            src.ImprvStateCd ?? "",
            src.ImprvClassCd ?? "",
            src.ImprvHomesite ?? "",
            src.ImprvVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.ImprvDesc ?? "",
            src.YearBuilt?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.EffectiveYearBuilt?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.ActualYearBuilt?.ToString(CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
