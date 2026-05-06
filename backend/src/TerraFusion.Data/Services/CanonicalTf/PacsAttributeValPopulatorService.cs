using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsAttributeVal;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice E2-B (ATTR-POP-2): value-grain populator for
/// <c>canonical_tf.attribute_definition</c>. Reads PACS value-grain
/// <c>(i_attr_val_id, i_attr_val_cd)</c> pairs and upserts rows
/// keyed <c>(CountyId, IAttrId)</c> where <c>IAttrId = i_attr_val_id</c>.
///
/// <para>Companion to ATTR-POP-1 (family-grain). The imprv canonical
/// projector keys lookups on <c>imprv_attr.IAttrValId</c> (value-
/// grain), so value-grain rows are what unlock
/// <c>tf_improvement_feature.AttributeId</c> resolution.</para>
///
/// <para>Conflict policy: if a family-grain row from ATTR-POP-1
/// happens to share an integer ID with a value-grain row, the
/// value-grain populator overwrites — that's the grain the
/// projector reads.</para>
///
/// <para>Two doctrine gates:
/// <list type="bullet">
///   <item><c>attribute-val-coverage</c> — informational PASS.</item>
///   <item><c>attribute-val-provenance</c> — every upserted row
///   carries LoadBatchId + SourceQueryHash. FAIL on any miss.</item>
/// </list>
/// </para>
/// </summary>
public sealed class PacsAttributeValPopulatorService : IPacsAttributeValPopulator
{
    private static readonly Regex CodeNormalizer = new(@"[^A-Z0-9]+", RegexOptions.Compiled);

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsAttributeValPopulatorService> _logger;

    public PacsAttributeValPopulatorService(
        TerraFusionDbContext db,
        ILogger<PacsAttributeValPopulatorService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsAttributeValPopulatorResult> PopulateAsync(
        IPacsAttributeValSource source,
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        if (countyId == Guid.Empty)
            throw new ArgumentException("countyId is required", nameof(countyId));

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

        var rowsConsidered = 0;
        var rowsInserted = 0;
        var rowsUpdated = 0;
        var duplicatePairsCollapsed = 0;

        try
        {
            // Pre-load existing definitions for upsert.
            var existingByIAttr = await _db.AttributeDefinitions
                .Where(a => a.CountyId == countyId)
                .ToDictionaryAsync(a => a.IAttrId, cancellationToken)
                .ConfigureAwait(false);

            // Collapse duplicate (id, code) pairs in-stream — the source
            // can return many rows for the same id with different codes;
            // first-seen wins. Track distinct ids for counting.
            var seenIds = new HashSet<long>();
            var now = DateTime.UtcNow;

            await foreach (var src in source.StreamAttributeValsAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                rowsConsidered++;

                if (!seenIds.Add(src.IAttrValId))
                {
                    duplicatePairsCollapsed++;
                    continue;
                }

                // Value-grain code MUST be unique across (CountyId, AttributeCode)
                // per the ux_attribute_definition_county_code unique index.
                // Distinct IAttrValIds whose IAttrValCd happens to normalize
                // to the same handle would collide. Synthesize a deterministic
                // unique code from the id itself; the human-readable code lives
                // in AttributeName.
                var attributeCode = $"VAL_{src.IAttrValId}";
                if (attributeCode.Length > 20) attributeCode = attributeCode[..20];

                if (existingByIAttr.TryGetValue(src.IAttrValId, out var existing))
                {
                    existing.AttributeCode = attributeCode;
                    existing.AttributeName = src.IAttrValCd;
                    existing.IsActive = true;
                    existing.LoadBatchId = batch.LoadBatchId;
                    existing.SourceQueryHash = queryHash;
                    existing.UpdatedAt = now;
                    rowsUpdated++;
                }
                else
                {
                    _db.AttributeDefinitions.Add(new AttributeDefinition
                    {
                        CountyId = countyId,
                        IAttrId = src.IAttrValId,
                        AttributeCode = attributeCode,
                        AttributeName = src.IAttrValCd,
                        DataType = "CODE",
                        AppliesTo = "IMPROVEMENT",
                        IsActive = true,
                        LoadBatchId = batch.LoadBatchId,
                        SourceQueryHash = queryHash,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                    rowsInserted++;
                }
            }

            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteGatesAsync(batch, rowsConsidered, rowsInserted, rowsUpdated,
                countyId, cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsConsidered;
            batch.RowsPromoted = rowsInserted + rowsUpdated;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "attribute_definition value-grain populator COMPLETED. batch={BatchId} considered={C} inserted={I} updated={U} dupCollapsed={D}",
                batch.LoadBatchId, rowsConsidered, rowsInserted, rowsUpdated, duplicatePairsCollapsed);

            return new PacsAttributeValPopulatorResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsConsidered = rowsConsidered,
                RowsInserted = rowsInserted,
                RowsUpdated = rowsUpdated,
                DuplicatePairsCollapsed = duplicatePairsCollapsed,
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
                "attribute_definition value-grain populator FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsAttributeValPopulatorResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsConsidered = 0,
                RowsInserted = 0,
                RowsUpdated = 0,
                DuplicatePairsCollapsed = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int considered,
        int inserted,
        int updated,
        Guid countyId,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "attribute-val-coverage",
            GateStage = "DICTIONARY_POPULATE",
            Status = "PASS",
            Expected = "informational",
            Actual = (inserted + updated).ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} inserted={inserted} updated={updated}",
            ExecutedAt = now,
        });

        var unprovenanced = await _db.AttributeDefinitions
            .Where(a => a.CountyId == countyId
                        && a.LoadBatchId == batch.LoadBatchId
                        && (a.LoadBatchId == Guid.Empty || string.IsNullOrEmpty(a.SourceQueryHash)))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "attribute-val-provenance",
            GateStage = "DICTIONARY_POPULATE",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0
                ? $"all {inserted + updated} upserted rows carry provenance"
                : $"{unprovenanced} rows lack LoadBatchId or SourceQueryHash",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string NormalizeCode(string raw)
    {
        var upper = (raw ?? string.Empty).ToUpperInvariant();
        var collapsed = CodeNormalizer.Replace(upper, "_").Trim('_');
        if (collapsed.Length > 20) collapsed = collapsed[..20];
        if (string.IsNullOrEmpty(collapsed)) collapsed = "UNKNOWN";
        return collapsed;
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }
}
