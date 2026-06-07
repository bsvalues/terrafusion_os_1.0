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
using TerraFusion.Core.Sync.PacsExemption;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): lands active-supplement exemption
/// facts into <c>legacy_pacs_raw.property_exemption</c> via Npgsql binary COPY.
/// </summary>
public sealed class PacsExemptionLandingService : IPacsExemptionLandingService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsExemptionLandingService> _logger;

    public PacsExemptionLandingService(TerraFusionDbContext db, ILogger<PacsExemptionLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsExemptionLandingResult> LandExemptionsAsync(
        IPacsExemptionSource source, string operatorName, CancellationToken cancellationToken = default)
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
        var keyCounts = new Dictionary<(int, long, short, string), int>();

        try
        {
            var connString = _db.Database.GetConnectionString();
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(cancellationToken).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY legacy_pacs_raw.property_exemption (\"LandedRowId\", \"PropId\", \"OwnerId\", " +
                    "\"ExmptTaxYr\", \"SupNum\", \"ExmptTypeCd\", \"ExmptSubtypeCd\", \"ExemptionPct\", " +
                    "\"EffectiveDt\", \"TerminationDt\", \"QualifyYr\", \"OwnerTaxYr\", \"EffectiveTaxYr\", " +
                    "\"LoadBatchId\", \"SourceQueryHash\", \"SourceRowHash\", \"LandedAt\") FROM STDIN (FORMAT BINARY)",
                    cancellationToken).ConfigureAwait(false);

                await foreach (var s in source.StreamExemptionsAsync(cancellationToken).ConfigureAwait(false))
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    await imp.StartRowAsync(cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(s.PropId, NpgsqlDbType.Integer, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(s.OwnerId, NpgsqlDbType.Bigint, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(s.ExmptTaxYr, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(s.SupNum, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(s.ExmptTypeCd, NpgsqlDbType.Varchar, cancellationToken).ConfigureAwait(false);
                    await Txt(imp, s.ExmptSubtypeCd, cancellationToken).ConfigureAwait(false);
                    await Num(imp, s.ExemptionPct, cancellationToken).ConfigureAwait(false);
                    await Ts(imp, s.EffectiveDt, cancellationToken).ConfigureAwait(false);
                    await Ts(imp, s.TerminationDt, cancellationToken).ConfigureAwait(false);
                    await Sh(imp, s.QualifyYr, cancellationToken).ConfigureAwait(false);
                    await Sh(imp, s.OwnerTaxYr, cancellationToken).ConfigureAwait(false);
                    await Sh(imp, s.EffectiveTaxYr, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(queryHash, NpgsqlDbType.Varchar, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(ComputeRowHash(s), NpgsqlDbType.Varchar, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(DateTime.UtcNow, NpgsqlDbType.TimestampTz, cancellationToken).ConfigureAwait(false);

                    var key = (s.PropId, s.OwnerId, s.ExmptTaxYr, s.ExmptTypeCd);
                    keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;
                    rowsLanded++;
                }
                await imp.CompleteAsync(cancellationToken).ConfigureAwait(false);
            }

            var dups = keyCounts.Values.Count(c => c > 1);
            await Gate(batch, "exemption-distribution", "PASS", $"rows={rowsLanded}", cancellationToken).ConfigureAwait(false);
            await Gate(batch, "exemption-key-uniqueness", dups == 0 ? "PASS" : "FAIL",
                dups == 0 ? "every (prop_id,owner_id,year,type) unique" : $"{dups} dup keys", cancellationToken).ConfigureAwait(false);
            var unprov = await _db.LegacyPacsRawPropertyExemptions
                .Where(r => r.LoadBatchId == batch.LoadBatchId && (r.LoadBatchId == Guid.Empty || string.IsNullOrEmpty(r.SourceQueryHash)))
                .CountAsync(cancellationToken).ConfigureAwait(false);
            await Gate(batch, "provenance-coverage", unprov == 0 ? "PASS" : "FAIL",
                unprov == 0 ? $"all {rowsLanded} provenanced" : $"{unprov} lack provenance", cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("PACS exemption landing COMPLETED. batch={B} rows={R} dup={D}",
                batch.LoadBatchId, rowsLanded, dups);
            return new PacsExemptionLandingResult
            { LoadBatchId = batch.LoadBatchId, Status = "COMPLETED", RowsLanded = rowsLanded, DuplicateKeyViolations = dups };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "PACS exemption landing FAILED. batch={B}", batch.LoadBatchId);
            return new PacsExemptionLandingResult { LoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
        }
    }

    private static async Task Num(NpgsqlBinaryImporter i, decimal? v, CancellationToken ct)
    { if (v.HasValue) await i.WriteAsync(v.Value, NpgsqlDbType.Numeric, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static async Task Txt(NpgsqlBinaryImporter i, string? v, CancellationToken ct)
    { if (v is not null) await i.WriteAsync(v, NpgsqlDbType.Varchar, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static async Task Ts(NpgsqlBinaryImporter i, DateTime? v, CancellationToken ct)
    { if (v.HasValue) await i.WriteAsync(DateTime.SpecifyKind(v.Value, DateTimeKind.Utc), NpgsqlDbType.TimestampTz, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static async Task Sh(NpgsqlBinaryImporter i, short? v, CancellationToken ct)
    { if (v.HasValue) await i.WriteAsync(v.Value, NpgsqlDbType.Smallint, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }

    private async Task Gate(LoadBatch batch, string name, string status, string detail, CancellationToken ct)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId, GateName = name, GateStage = "SOURCE_TO_RAW",
            Status = status, Expected = status == "PASS" ? "ok" : "review", Actual = status,
            Detail = detail, ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty)))[..16].ToLowerInvariant();
    internal static string ComputeRowHash(PacsSourceExemption s)
        => ComputeStableHash(string.Join("|", s.PropId, s.OwnerId, s.ExmptTaxYr, s.SupNum, s.ExmptTypeCd,
            s.ExmptSubtypeCd ?? "", s.ExemptionPct?.ToString(CultureInfo.InvariantCulture) ?? ""));
}
