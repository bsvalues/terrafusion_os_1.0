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
using Npgsql;
using NpgsqlTypes;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsAssessment;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// ASSESSMENT-VALUE-SEAL (2026-06-07): lands active-supplement
/// assessment values into <c>legacy_pacs_raw.property_val</c> (value
/// columns populated; classification-only rows from the improvement
/// lane are a separate batch). Uses Npgsql binary COPY for the
/// ~95K-row current-year corpus.
/// </summary>
public sealed class PacsAssessmentValueLandingService : IPacsAssessmentValueLandingService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsAssessmentValueLandingService> _logger;

    public PacsAssessmentValueLandingService(
        TerraFusionDbContext db,
        ILogger<PacsAssessmentValueLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsAssessmentValueLandingResult> LandAssessmentValuesAsync(
        IPacsAssessmentValueSource source,
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
        var keyCounts = new Dictionary<(int PropId, short Yr), int>();

        try
        {
            var connString = _db.Database.GetConnectionString();
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(cancellationToken).ConfigureAwait(false);
                await using var importer = await copyConn.BeginBinaryImportAsync(
                    "COPY legacy_pacs_raw.property_val (\"LandedRowId\", \"PropValYr\", \"SupNum\", \"PropId\", " +
                    "\"PropertyUseCd\", \"AssessedVal\", \"AppraisedVal\", \"MarketVal\", \"LandHstdVal\", " +
                    "\"LandNonHstdVal\", \"ImprvHstdVal\", \"ImprvNonHstdVal\", \"AgUseVal\", \"AgMarketVal\", " +
                    "\"TimberUseVal\", \"TimberMarketVal\", \"HsCapNewVal\", \"HsCapPrevVal\", " +
                    "\"LoadBatchId\", \"SourceQueryHash\", \"SourceRowHash\", \"LandedAt\") FROM STDIN (FORMAT BINARY)",
                    cancellationToken).ConfigureAwait(false);

                await foreach (var src in source.StreamAssessmentValuesAsync(cancellationToken).ConfigureAwait(false))
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    await importer.StartRowAsync(cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(src.AssessmentYear, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(src.SupNum, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(src.PropId, NpgsqlDbType.Integer, cancellationToken).ConfigureAwait(false);
                    await WriteNullableText(importer, src.PropertyUseCd, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.AssessedVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.AppraisedVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.MarketVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.LandHstdVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.LandNonHstdVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.ImprvHstdVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.ImprvNonHstdVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.AgUseVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.AgMarketVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.TimberUseVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.TimberMarketVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.HsCapNewVal, cancellationToken).ConfigureAwait(false);
                    await WriteNullableNum(importer, src.HsCapPrevVal, cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(queryHash, NpgsqlDbType.Varchar, cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(ComputeRowHash(src), NpgsqlDbType.Varchar, cancellationToken).ConfigureAwait(false);
                    await importer.WriteAsync(DateTime.UtcNow, NpgsqlDbType.TimestampTz, cancellationToken).ConfigureAwait(false);

                    var key = (src.PropId, src.AssessmentYear);
                    keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;
                    rowsLanded++;
                }

                await importer.CompleteAsync(cancellationToken).ConfigureAwait(false);
            }

            var duplicateKeyViolations = keyCounts.Values.Count(c => c > 1);
            await WriteGatesAsync(batch, rowsLanded, duplicateKeyViolations, cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS assessment-value landing COMPLETED. batch={BatchId} rows={Rows} dup={Dups}",
                batch.LoadBatchId, rowsLanded, duplicateKeyViolations);

            return new PacsAssessmentValueLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateKeyViolations = duplicateKeyViolations,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "PACS assessment-value landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);
            return new PacsAssessmentValueLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch, int rowsLanded, int duplicateKeyViolations, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "assessment-value-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"rows={rowsLanded}",
            ExecutedAt = now,
        });
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "assessment-value-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (prop_id, prop_val_yr) is unique (active-supplement)"
                : $"{duplicateKeyViolations} (prop_id, prop_val_yr) keys appeared more than once",
            ExecutedAt = now,
        });
        var unprovenanced = await _db.LegacyPacsRawPropertyVals
            .Where(r => r.LoadBatchId == batch.LoadBatchId
                        && (r.LoadBatchId == Guid.Empty || string.IsNullOrEmpty(r.SourceQueryHash)))
            .CountAsync(ct).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "provenance-coverage",
            GateStage = "SOURCE_TO_RAW",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0 ? $"all {rowsLanded} rows provenanced" : $"{unprovenanced} rows lack provenance",
            ExecutedAt = now,
        });
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    private static async Task WriteNullableNum(NpgsqlBinaryImporter imp, decimal? v, CancellationToken ct)
    {
        if (v.HasValue) await imp.WriteAsync(v.Value, NpgsqlDbType.Numeric, ct).ConfigureAwait(false);
        else await imp.WriteNullAsync(ct).ConfigureAwait(false);
    }

    private static async Task WriteNullableText(NpgsqlBinaryImporter imp, string? v, CancellationToken ct)
    {
        if (v is not null) await imp.WriteAsync(v, NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
        else await imp.WriteNullAsync(ct).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    internal static string ComputeRowHash(PacsSourceAssessmentValue s)
    {
        var seed = string.Join("|",
            s.PropId.ToString(CultureInfo.InvariantCulture),
            s.AssessmentYear.ToString(CultureInfo.InvariantCulture),
            s.SupNum.ToString(CultureInfo.InvariantCulture),
            s.AssessedVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            s.MarketVal?.ToString(CultureInfo.InvariantCulture) ?? "",
            s.AppraisedVal?.ToString(CultureInfo.InvariantCulture) ?? "");
        return ComputeStableHash(seed);
    }
}
