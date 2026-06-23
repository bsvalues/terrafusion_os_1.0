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
using TerraFusion.Core.Sync.PacsOwner;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice B1-B: drains an <see cref="IPacsOwnerSource"/> into
/// <c>legacy_pacs_raw.owner</c> with full provenance and records
/// four B1-B promotion gates:
///
/// <list type="bullet">
///   <item><c>owner-distribution</c> — informational; year + type-of-owner histogram.</item>
///   <item><c>owner-key-uniqueness</c> — FAIL when any 4-key tuple
///   appears more than once; PASS otherwise.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks <c>load_batch_id</c> or <c>source_query_hash</c>.</item>
///   <item><c>owner-pct-completeness</c> — informational; counts of
///   ownership groups with full vs partial pct totals. The doctrine
///   only tightens this at B2-A (truth-pacs.owner_current).</item>
/// </list>
/// </summary>
public sealed class PacsOwnerLandingService : IPacsOwnerLandingService
{
    private const int BatchSize = 1000;
    private const decimal FullPctTolerance = 0.01m;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsOwnerLandingService> _logger;

    public PacsOwnerLandingService(
        TerraFusionDbContext db,
        ILogger<PacsOwnerLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsOwnerLandingResult> LandOwnersAsync(
        IPacsOwnerSource source,
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
        var typeHistogram = new Dictionary<string, int>(StringComparer.Ordinal);
        var groupPctSums = new Dictionary<(int PropId, short Year, short Sup), decimal?>();

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
                .StreamOwnersAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                _db.LegacyPacsRawOwners.Add(new LegacyPacsRawOwner
                {
                    OwnerTaxYr = src.OwnerTaxYr,
                    SupNum = src.SupNum,
                    PropId = src.PropId,
                    OwnerId = src.OwnerId,
                    PctOwnership = src.PctOwnership,
                    TypeOfOwner = src.TypeOfOwner,
                    UdiStatus = src.UdiStatus,
                    BirthDt = src.BirthDt,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                });

                // 4-key counter for uniqueness gate.
                var key = (src.OwnerTaxYr, src.SupNum, src.PropId, src.OwnerId);
                keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;

                // Informational histograms.
                yearHistogram[src.OwnerTaxYr] =
                    yearHistogram.TryGetValue(src.OwnerTaxYr, out var yc) ? yc + 1 : 1;
                if (!string.IsNullOrEmpty(src.TypeOfOwner))
                {
                    typeHistogram[src.TypeOfOwner] =
                        typeHistogram.TryGetValue(src.TypeOfOwner, out var tc) ? tc + 1 : 1;
                }

                // Per-group pct accumulator (NULL marker propagates).
                var groupKey = (src.PropId, src.OwnerTaxYr, src.SupNum);
                if (!groupPctSums.TryGetValue(groupKey, out var existing))
                {
                    groupPctSums[groupKey] = src.PctOwnership;
                }
                else if (existing.HasValue && src.PctOwnership.HasValue)
                {
                    groupPctSums[groupKey] = existing.Value + src.PctOwnership.Value;
                }
                else
                {
                    // Once any row in the group is NULL, the group's
                    // sum is considered partial.
                    groupPctSums[groupKey] = null;
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

            var duplicateKeyViolations = keyCounts.Values.Count(c => c > 1);
            var distinctGroups = groupPctSums.Count;
            var groupsWithFull = groupPctSums.Values
                .Count(s => s.HasValue && Math.Abs(s.Value - 100m) <= FullPctTolerance);
            var groupsWithPartial = distinctGroups - groupsWithFull;

            await WriteGatesAsync(
                batch, rowsLanded, duplicateKeyViolations,
                yearHistogram, typeHistogram,
                distinctGroups, groupsWithFull, groupsWithPartial,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS owner landing COMPLETED. batch={BatchId} rows={Rows} duplicates={Dups} groups={Groups} fullPct={Full} partialPct={Partial}",
                batch.LoadBatchId, rowsLanded, duplicateKeyViolations,
                distinctGroups, groupsWithFull, groupsWithPartial);

            return new PacsOwnerLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateKeyViolations = duplicateKeyViolations,
                DistinctOwnershipGroups = distinctGroups,
                GroupsWithFullPctSum = groupsWithFull,
                GroupsWithPartialPctSum = groupsWithPartial,
            };
        }
        catch (OperationCanceledException)
        {
            batch.Status = "CANCELLED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = "Cancelled by caller (request timeout or explicit cancellation).";
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogWarning(
                "PACS owner landing CANCELLED. batch={BatchId}", batch.LoadBatchId);
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
                "PACS owner landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsOwnerLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                DuplicateKeyViolations = 0,
                DistinctOwnershipGroups = 0,
                GroupsWithFullPctSum = 0,
                GroupsWithPartialPctSum = 0,
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
        int distinctGroups,
        int groupsWithFull,
        int groupsWithPartial,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) owner-distribution — informational PASS.
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
            GateName = "owner-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail,
            ExecutedAt = now,
        });

        // 2) owner-key-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "owner-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (owner_tax_yr, sup_num, prop_id, owner_id) is unique"
                : $"{duplicateKeyViolations} 4-key tuples appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB.
        var unprovenanced = await _db.LegacyPacsRawOwners
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

        // 4) owner-pct-completeness — informational signal.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "owner-pct-completeness",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = groupsWithFull.ToString(CultureInfo.InvariantCulture),
            Detail = $"groups={distinctGroups} fullPctSum={groupsWithFull} partialPctSum={groupsWithPartial} (B2-A tightens)",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourceOwner src)
    {
        var seed = string.Join("|",
            src.OwnerTaxYr.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.OwnerId.ToString(CultureInfo.InvariantCulture),
            src.PctOwnership?.ToString(CultureInfo.InvariantCulture) ?? "",
            src.TypeOfOwner ?? "",
            src.UdiStatus ?? "",
            src.BirthDt?.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
