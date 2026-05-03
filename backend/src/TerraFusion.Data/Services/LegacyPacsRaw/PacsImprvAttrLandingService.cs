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
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsImprvAttr;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice C1-C: drains an <see cref="IPacsImprvAttrSource"/>,
/// dictionary-checks each row, and routes valid rows to
/// <c>legacy_pacs_raw.imprv_attr</c> + unknown-code rows to
/// <c>legacy_tf_unproven.unresolved_imprv_attr</c>. Records five
/// C1-C promotion gates:
///
/// <list type="bullet">
///   <item><c>imprv-attr-distribution</c> — informational; per-code
///   histograms (known / unknown).</item>
///   <item><c>imprv-attr-key-uniqueness</c> — FAIL when any 6-key
///   tuple appears more than once across landed + quarantined
///   combined.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks <c>load_batch_id</c> or <c>source_query_hash</c>.</item>
///   <item><c>imprv-attr-aggregate</c> — informational; landed vs
///   quarantined counts.</item>
///   <item><c>imprv-attr-dictionary-coverage</c> — WARN when any
///   row quarantined; PASS when 100% of codes are in the dictionary.
///   Operator visibility for dictionary drift.</item>
/// </list>
/// </summary>
public sealed class PacsImprvAttrLandingService : IPacsImprvAttrLandingService
{
    private const int BatchSize = 1000;
    // v1.6: landing-layer quarantine reasons live in
    // LandingQuarantineReasons — see
    // docs/pacs/block-c-contract-v1.6.md.

    private readonly TerraFusionDbContext _db;
    private readonly IImprvAttrDictionary _dictionary;
    private readonly ILogger<PacsImprvAttrLandingService> _logger;

    public PacsImprvAttrLandingService(
        TerraFusionDbContext db,
        IImprvAttrDictionary dictionary,
        ILogger<PacsImprvAttrLandingService> logger)
    {
        _db = db;
        _dictionary = dictionary;
        _logger = logger;
    }

    public async Task<PacsImprvAttrLandingResult> LandImprvAttrsAsync(
        IPacsImprvAttrSource source,
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

        var considered = 0;
        var landed = 0;
        var quarantined = 0;
        var pending = 0;
        var keyCounts =
            new Dictionary<(short, short, int, long, long, long), int>();
        var knownHistogram = new Dictionary<string, int>(StringComparer.Ordinal);
        var unknownHistogram = new Dictionary<string, int>(StringComparer.Ordinal);

        try
        {
            await foreach (var src in source
                .StreamImprvAttrsAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                considered++;

                var key = (src.PropValYr, src.SupNum, src.PropId, src.ImprvId, src.ImprvDetId, src.IAttrValId);
                keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;

                if (_dictionary.Contains(src.IAttrValCd))
                {
                    _db.LegacyPacsRawImprvAttrs.Add(new LegacyPacsRawImprvAttr
                    {
                        PropValYr = src.PropValYr,
                        SupNum = src.SupNum,
                        PropId = src.PropId,
                        ImprvId = src.ImprvId,
                        ImprvDetId = src.ImprvDetId,
                        IAttrValId = src.IAttrValId,
                        IAttrValCd = src.IAttrValCd,
                        AttrValueText = src.AttrValueText,
                        AttrValueNumeric = src.AttrValueNumeric,
                        LoadBatchId = batch.LoadBatchId,
                        SourceQueryHash = queryHash,
                        SourceRowHash = ComputeRowHash(src),
                        LandedAt = DateTime.UtcNow,
                    });
                    landed++;
                    knownHistogram[src.IAttrValCd] =
                        knownHistogram.TryGetValue(src.IAttrValCd, out var kc) ? kc + 1 : 1;
                }
                else
                {
                    _db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
                    {
                        PropValYr = src.PropValYr,
                        SupNum = src.SupNum,
                        PropId = src.PropId,
                        ImprvId = src.ImprvId,
                        ImprvDetId = src.ImprvDetId,
                        IAttrValId = src.IAttrValId,
                        IAttrValCd = src.IAttrValCd ?? string.Empty,
                        AttrValueText = src.AttrValueText,
                        AttrValueNumeric = src.AttrValueNumeric,
                        LandingLoadBatchId = batch.LoadBatchId,
                        QuarantineReason = LandingQuarantineReasons.UnknownIAttrValCd,
                        CreatedAt = DateTime.UtcNow,
                    });
                    quarantined++;
                    var unknownKey = src.IAttrValCd ?? "<NULL>";
                    unknownHistogram[unknownKey] =
                        unknownHistogram.TryGetValue(unknownKey, out var uc) ? uc + 1 : 1;
                }

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
                batch, considered, landed, quarantined,
                duplicateKeyViolations, knownHistogram, unknownHistogram,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = landed;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS imprv_attr landing COMPLETED. batch={BatchId} considered={Considered} landed={Landed} quarantined={Quarantined} duplicates={Dups} dictSize={DictSize}",
                batch.LoadBatchId, considered, landed, quarantined,
                duplicateKeyViolations, _dictionary.Count);

            return new PacsImprvAttrLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsConsidered = considered,
                RowsLanded = landed,
                RowsQuarantined = quarantined,
                DuplicateKeyViolations = duplicateKeyViolations,
                KnownCodeHistogram = knownHistogram,
                UnknownCodeHistogram = unknownHistogram,
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
                "PACS imprv_attr landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsImprvAttrLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsConsidered = 0,
                RowsLanded = 0,
                RowsQuarantined = 0,
                DuplicateKeyViolations = 0,
                KnownCodeHistogram = new Dictionary<string, int>(),
                UnknownCodeHistogram = new Dictionary<string, int>(),
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int considered,
        int landed,
        int quarantined,
        int duplicateKeyViolations,
        IReadOnlyDictionary<string, int> knownHistogram,
        IReadOnlyDictionary<string, int> unknownHistogram,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) imprv-attr-distribution — informational PASS.
        var knownDetail = string.Join(",",
            knownHistogram.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"known/{kv.Key}={kv.Value}"));
        var unknownDetail = string.Join(",",
            unknownHistogram.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"unknown/{kv.Key}={kv.Value}"));
        var distDetail = $"considered={considered} landed={landed} " +
                         $"quarantined={quarantined} {knownDetail} {unknownDetail}".Trim();
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "imprv-attr-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = considered.ToString(CultureInfo.InvariantCulture),
            Detail = distDetail,
            ExecutedAt = now,
        });

        // 2) imprv-attr-key-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "imprv-attr-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (year, sup, prop_id, imprv_id, imprv_det_id, i_attr_val_id) is unique"
                : $"{duplicateKeyViolations} 6-key tuples appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB (landed table only).
        var unprovenanced = await _db.LegacyPacsRawImprvAttrs
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
                ? $"all {landed} landed rows have load_batch_id and source_query_hash"
                : $"{unprovenanced} rows lack provenance",
            ExecutedAt = now,
        });

        // 4) imprv-attr-aggregate — informational counts.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "imprv-attr-aggregate",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = considered.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} landed={landed} quarantined={quarantined}",
            ExecutedAt = now,
        });

        // 5) imprv-attr-dictionary-coverage — WARN on any quarantined.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "imprv-attr-dictionary-coverage",
            GateStage = "SOURCE_TO_RAW",
            Status = quarantined == 0 ? "PASS" : "WARN",
            Expected = "0",
            Actual = quarantined.ToString(CultureInfo.InvariantCulture),
            Detail = quarantined == 0
                ? $"every i_attr_val_cd resolved against the active dictionary ({_dictionary.Count} codes)"
                : $"{quarantined} rows had codes outside the active dictionary; investigate dictionary drift or source corruption",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourceImprvAttr src)
    {
        var seed = string.Join("|",
            src.PropValYr.ToString(CultureInfo.InvariantCulture),
            src.SupNum.ToString(CultureInfo.InvariantCulture),
            src.PropId.ToString(CultureInfo.InvariantCulture),
            src.ImprvId.ToString(CultureInfo.InvariantCulture),
            src.ImprvDetId.ToString(CultureInfo.InvariantCulture),
            src.IAttrValId.ToString(CultureInfo.InvariantCulture),
            src.IAttrValCd ?? "",
            src.AttrValueText ?? "",
            src.AttrValueNumeric?.ToString(CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
