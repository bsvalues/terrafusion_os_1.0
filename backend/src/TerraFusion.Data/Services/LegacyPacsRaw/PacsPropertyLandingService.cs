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
using TerraFusion.Core.Sync.PacsProperty;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice S1 (SYNC-POP-4a): PACS property/parcel raw landing
/// orchestrator. Drains an <see cref="IPacsPropertySource"/> into
/// <c>legacy_pacs_raw.property</c> with provenance, then writes the
/// four S1 promotion gate results.
///
/// <list type="bullet">
///   <item><c>property-type-distribution</c> — informational PASS, records the histogram.</item>
///   <item><c>prop-id-uniqueness</c> — FAIL when any <c>prop_id</c>
///   appears more than once in the landed batch; PASS otherwise.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks a <c>load_batch_id</c> or <c>source_query_hash</c>;
///   PASS otherwise.</item>
///   <item><c>create-date-coverage</c> — informational PASS,
///   records the share of rows with <c>prop_create_dt</c> set vs
///   null.</item>
/// </list>
///
/// <para>This service does NOT promote into truth or canonical;
/// SYNC-POP-4b (truth) and SYNC-POP-4c (canonical) are separate slices.</para>
/// </summary>
public sealed class PacsPropertyLandingService : IPacsPropertyLandingService
{
    private const int BatchSize = 500;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsPropertyLandingService> _logger;

    public PacsPropertyLandingService(
        TerraFusionDbContext db,
        ILogger<PacsPropertyLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsPropertyLandingResult> LandPropertiesAsync(
        IPacsPropertySource source,
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
        var propIdCounts = new Dictionary<int, int>();
        var withCreateDt = 0;
        var withoutCreateDt = 0;
        var rowsLanded = 0;
        var pending = 0;

        try
        {
            await foreach (var src in source
                .StreamPropertiesAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                var landed = new LegacyPacsRawProperty
                {
                    PropId = src.PropId,
                    PropTypeCd = src.PropTypeCd,
                    GeoId = src.GeoId,
                    RefId1 = src.RefId1,
                    RefId2 = src.RefId2,
                    DbaName = src.DbaName,
                    AltDbaName = src.AltDbaName,
                    PropCreateDt = src.PropCreateDt,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                };
                _db.Set<LegacyPacsRawProperty>().Add(landed);

                // Type histogram.
                var key = src.PropTypeCd ?? "<NULL>";
                distribution[key] = distribution.TryGetValue(key, out var c) ? c + 1 : 1;

                // Create-date coverage accounting (informational).
                if (src.PropCreateDt is null) withoutCreateDt++;
                else withCreateDt++;

                // prop_id uniqueness accounting.
                propIdCounts[src.PropId] = propIdCounts.TryGetValue(src.PropId, out var pc) ? pc + 1 : 1;

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

            var duplicatePropIdCount = propIdCounts.Values.Count(v => v > 1);

            await WriteGatesAsync(
                batch, distribution, duplicatePropIdCount,
                withCreateDt, withoutCreateDt, rowsLanded,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded; // S1 lands == promotes to legacy_pacs_raw
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS property landing COMPLETED. batch={BatchId} rows={Rows} withCreateDt={With} withoutCreateDt={Without} dupPropId={Dup}",
                batch.LoadBatchId, rowsLanded, withCreateDt, withoutCreateDt, duplicatePropIdCount);

            return new PacsPropertyLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                TypeDistribution = distribution,
                WithCreateDtCount = withCreateDt,
                WithoutCreateDtCount = withoutCreateDt,
                DuplicatePropIdCount = duplicatePropIdCount,
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
                "PACS property landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsPropertyLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                TypeDistribution = new Dictionary<string, int>(),
                WithCreateDtCount = 0,
                WithoutCreateDtCount = 0,
                DuplicatePropIdCount = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        IReadOnlyDictionary<string, int> distribution,
        int duplicatePropIdCount,
        int withCreateDt,
        int withoutCreateDt,
        int rowsLanded,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) property-type-distribution — informational, always PASS.
        var distDetail = string.Join(",",
            distribution.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"{kv.Key}={kv.Value}"));
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "property-type-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail.Length == 0 ? "(empty)" : distDetail,
            ExecutedAt = now,
        });

        // 2) prop-id-uniqueness — Benton dbo.property has prop_id as
        //    PK, so any duplicates in the landing batch indicate a
        //    join blow-up or duplicate source row. Doctrine: zero.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "prop-id-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicatePropIdCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicatePropIdCount.ToString(CultureInfo.InvariantCulture),
            Detail = duplicatePropIdCount == 0
                ? "every prop_id appears exactly once in the batch"
                : $"{duplicatePropIdCount} prop_id values appear more than once; investigate join blow-up or duplicate source rows",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — every landed row has LoadBatchId AND
        //    SourceQueryHash. Asserted from DB rather than from in-process
        //    counters so a doctrine violation can't be masked by a buggy
        //    implementation.
        var unprovenanced = await _db.Set<LegacyPacsRawProperty>()
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

        // 4) create-date-coverage — informational record of how many
        //    landed parcels carry prop_create_dt. Real Benton PACS
        //    populates this for nearly all rows; a sudden spike of
        //    null create-dates would indicate a join-shape issue
        //    upstream. This replaces what would have been an
        //    active/inactive gate; lifecycle resolution is deferred
        //    to SYNC-POP-4b which joins property_val.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "create-date-coverage",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"withCreateDt={withCreateDt} withoutCreateDt={withoutCreateDt}",
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
    /// Fingerprint of a source-side property row. Used by future
    /// change-detection slices; not consulted in S1 itself.
    /// </summary>
    internal static string ComputeRowHash(PacsSourceProperty src)
    {
        var seed = string.Join("|",
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.PropTypeCd ?? "",
            src.GeoId ?? "",
            src.RefId1 ?? "",
            src.RefId2 ?? "",
            src.DbaName ?? "",
            src.AltDbaName ?? "",
            src.PropCreateDt?.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
