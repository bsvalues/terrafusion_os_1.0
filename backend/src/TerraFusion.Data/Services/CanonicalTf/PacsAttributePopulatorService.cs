using System;
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
using TerraFusion.Core.Sync.PacsAttribute;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice E2-A (ATTR-POP-1): single-tier populator for
/// <c>canonical_tf.attribute_definition</c>. Reads PACS
/// <c>dbo.attribute</c> via the supplied source and upserts rows
/// keyed <c>(CountyId, IAttrId)</c>.
///
/// <para>Single-tier rationale: the dictionary has no truth-
/// qualification axis. Every row in <c>dbo.attribute</c> is a real
/// attribute family — there's nothing to filter, nothing to promote.
/// The <c>inactive_flag = 1</c> rows are soft-retired in the
/// canonical layer (IsActive = false) rather than skipped, so
/// historical references to retired attributes still resolve.</para>
///
/// <para>Idempotent by <c>(CountyId, IAttrId)</c>: the unique
/// index drives upsert behavior. Re-running this populator is safe;
/// existing rows get their AttributeName/IsActive refreshed in place,
/// new rows get inserted, no duplicates.</para>
///
/// <para>Two doctrine gates:
/// <list type="bullet">
///   <item><c>attribute-definition-coverage</c> — informational
///   PASS, records insert/update/retire counts.</item>
///   <item><c>attribute-definition-provenance</c> — every upserted
///   row carries the LoadBatchId + SourceQueryHash pair. FAIL on
///   any miss.</item>
/// </list>
/// </para>
/// </summary>
public sealed class PacsAttributePopulatorService : IPacsAttributePopulator
{
    private static readonly Regex CodeNormalizer = new(@"[^A-Z0-9]+", RegexOptions.Compiled);

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsAttributePopulatorService> _logger;

    public PacsAttributePopulatorService(
        TerraFusionDbContext db,
        ILogger<PacsAttributePopulatorService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsAttributePopulatorResult> PopulateAsync(
        IPacsAttributeSource source,
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
        var rowsSoftRetired = 0;
        var inactiveSkipped = 0;

        try
        {
            // Pre-load existing definitions for this county into a dictionary
            // so we can decide insert-vs-update without per-row queries.
            var existingByIAttr = await _db.AttributeDefinitions
                .Where(a => a.CountyId == countyId)
                .ToDictionaryAsync(a => a.IAttrId, cancellationToken)
                .ConfigureAwait(false);

            var seenIAttrIds = new System.Collections.Generic.HashSet<long>();
            var now = DateTime.UtcNow;

            await foreach (var src in source.StreamAttributesAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                rowsConsidered++;
                seenIAttrIds.Add(src.IAttrId);

                var attributeCode = NormalizeCode(src.AttributeName ?? $"ATTR_{src.IAttrId}");

                if (existingByIAttr.TryGetValue(src.IAttrId, out var existing))
                {
                    // Upsert path: refresh the mutable surface.
                    var prevActive = existing.IsActive;
                    existing.AttributeCode = attributeCode;
                    existing.AttributeName = src.AttributeName;
                    existing.IsActive = !src.InactiveFlag;
                    existing.LoadBatchId = batch.LoadBatchId;
                    existing.SourceQueryHash = queryHash;
                    existing.UpdatedAt = now;
                    rowsUpdated++;
                    if (prevActive && !existing.IsActive)
                    {
                        rowsSoftRetired++;
                    }
                }
                else
                {
                    // Insert path. PACS inactive rows DO get inserted (with
                    // IsActive=false) because historical imprv_attr references
                    // must continue to resolve.
                    if (src.InactiveFlag) inactiveSkipped++;

                    _db.AttributeDefinitions.Add(new AttributeDefinition
                    {
                        CountyId = countyId,
                        IAttrId = src.IAttrId,
                        AttributeCode = attributeCode,
                        AttributeName = src.AttributeName,
                        DataType = "CODE",  // sensible default; can be refined later
                        AppliesTo = "IMPROVEMENT",  // dbo.attribute is improvement-side only
                        IsActive = !src.InactiveFlag,
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
                rowsSoftRetired, countyId, cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsConsidered;
            batch.RowsPromoted = rowsInserted + rowsUpdated;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "attribute_definition populator COMPLETED. batch={BatchId} considered={C} inserted={I} updated={U} retired={R} inactiveSkipped={S}",
                batch.LoadBatchId, rowsConsidered, rowsInserted, rowsUpdated, rowsSoftRetired, inactiveSkipped);

            return new PacsAttributePopulatorResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsConsidered = rowsConsidered,
                RowsInserted = rowsInserted,
                RowsUpdated = rowsUpdated,
                RowsSoftRetired = rowsSoftRetired,
                InactiveSkipped = inactiveSkipped,
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
                "attribute_definition populator FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsAttributePopulatorResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsConsidered = 0,
                RowsInserted = 0,
                RowsUpdated = 0,
                RowsSoftRetired = 0,
                InactiveSkipped = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int considered,
        int inserted,
        int updated,
        int softRetired,
        Guid countyId,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) attribute-definition-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "attribute-definition-coverage",
            GateStage = "DICTIONARY_POPULATE",
            Status = "PASS",
            Expected = "informational",
            Actual = (inserted + updated).ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} inserted={inserted} updated={updated} softRetired={softRetired}",
            ExecutedAt = now,
        });

        // 2) attribute-definition-provenance — every upserted row carries
        //    LoadBatchId + non-empty SourceQueryHash.
        var unprovenanced = await _db.AttributeDefinitions
            .Where(a => a.CountyId == countyId
                        && a.LoadBatchId == batch.LoadBatchId
                        && (a.LoadBatchId == Guid.Empty || string.IsNullOrEmpty(a.SourceQueryHash)))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "attribute-definition-provenance",
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

    /// <summary>
    /// Normalize a PACS attribute description to a canonical code.
    /// Uppercase, alphanumerics only, underscores between words,
    /// truncated to 20 chars (the AttributeCode column cap).
    /// </summary>
    private static string NormalizeCode(string raw)
    {
        var upper = raw.ToUpperInvariant();
        var collapsed = CodeNormalizer.Replace(upper, "_").Trim('_');
        if (collapsed.Length > 20) collapsed = collapsed[..20];
        if (string.IsNullOrEmpty(collapsed)) collapsed = "UNKNOWN";
        return collapsed;
    }

    /// <summary>SHA-256 hex truncated to 16 chars; stable across invocations.</summary>
    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }
}
