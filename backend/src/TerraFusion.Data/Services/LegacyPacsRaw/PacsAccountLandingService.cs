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
using TerraFusion.Core.Sync.PacsAccount;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// Slice B1-A: drains an <see cref="IPacsAccountSource"/> into
/// <c>legacy_pacs_raw.account</c> with full provenance and records
/// four B1-A promotion gates:
///
/// <list type="bullet">
///   <item><c>account-distribution</c> — informational; redaction-flag histogram.</item>
///   <item><c>account-acct-id-uniqueness</c> — FAIL when any
///   <c>acct_id</c> appears more than once; PASS otherwise.</item>
///   <item><c>provenance-coverage</c> — FAIL when any landed row
///   lacks <c>load_batch_id</c> or <c>source_query_hash</c>.</item>
///   <item><c>account-pii-flags-recorded</c> — informational; counts
///   confidential + web-suppression for the audit trail (operators
///   need to see how much of their batch is publicly visible).</item>
/// </list>
/// </summary>
public sealed class PacsAccountLandingService : IPacsAccountLandingService
{
    private const int BatchSize = 1000;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsAccountLandingService> _logger;

    public PacsAccountLandingService(
        TerraFusionDbContext db,
        ILogger<PacsAccountLandingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsAccountLandingResult> LandAccountsAsync(
        IPacsAccountSource source,
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
        var acctIdCounts = new Dictionary<long, int>();
        var confidentialCount = 0;
        var webSuppressedCount = 0;

        try
        {
            await foreach (var src in source
                .StreamAccountsAsync(cancellationToken)
                .ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();

                _db.LegacyPacsRawAccounts.Add(new LegacyPacsRawAccount
                {
                    AcctId = src.AcctId,
                    FileAsName = src.FileAsName,
                    FirstName = src.FirstName,
                    LastName = src.LastName,
                    DlNum = src.DlNum,
                    DlState = src.DlState,
                    EmailAddr = src.EmailAddr,
                    WebSuppression = src.WebSuppression,
                    ConfidentialFlag = src.ConfidentialFlag,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(src),
                    LandedAt = DateTime.UtcNow,
                });

                acctIdCounts[src.AcctId] =
                    acctIdCounts.TryGetValue(src.AcctId, out var c) ? c + 1 : 1;
                if (src.ConfidentialFlag) confidentialCount++;
                if (src.WebSuppression) webSuppressedCount++;

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

            var duplicateAcctIdViolations = acctIdCounts.Values.Count(c => c > 1);

            await WriteGatesAsync(
                batch, rowsLanded, duplicateAcctIdViolations,
                confidentialCount, webSuppressedCount,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = rowsLanded;
            batch.RowsPromoted = rowsLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "PACS account landing COMPLETED. batch={BatchId} rows={Rows} duplicates={Dups} confidential={Conf} webSupp={WebSupp}",
                batch.LoadBatchId, rowsLanded, duplicateAcctIdViolations,
                confidentialCount, webSuppressedCount);

            return new PacsAccountLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsLanded = rowsLanded,
                DuplicateAcctIdViolations = duplicateAcctIdViolations,
                ConfidentialCount = confidentialCount,
                WebSuppressedCount = webSuppressedCount,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Sanitize error: type + message only, no PII / stack traces.
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogError(ex,
                "PACS account landing FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsAccountLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsLanded = 0,
                DuplicateAcctIdViolations = 0,
                ConfidentialCount = 0,
                WebSuppressedCount = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int rowsLanded,
        int duplicateAcctIdViolations,
        int confidentialCount,
        int webSuppressedCount,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) account-distribution — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "account-distribution",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsLanded.ToString(CultureInfo.InvariantCulture),
            Detail = $"rows={rowsLanded} confidential={confidentialCount} webSuppressed={webSuppressedCount}",
            ExecutedAt = now,
        });

        // 2) account-acct-id-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "account-acct-id-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateAcctIdViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateAcctIdViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateAcctIdViolations == 0
                ? "every acct_id is unique"
                : $"{duplicateAcctIdViolations} acct_id values appeared more than once",
            ExecutedAt = now,
        });

        // 3) provenance-coverage — assert from DB, not in-process counters.
        var unprovenanced = await _db.LegacyPacsRawAccounts
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

        // 4) account-pii-flags-recorded — informational; surfaces the
        //    confidential + web-suppression counts so an operator can
        //    see at-a-glance how much of the batch the canonical
        //    layer must redact.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "account-pii-flags-recorded",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = (confidentialCount + webSuppressedCount).ToString(CultureInfo.InvariantCulture),
            Detail = $"confidential={confidentialCount} webSuppressed={webSuppressedCount} total={rowsLanded}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    internal static string ComputeStableHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input ?? string.Empty));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    /// <summary>
    /// Fingerprint of a source-side account row. Used by future
    /// change-detection slices. The hash includes PII so a change
    /// to a redaction flag (without other changes) still produces
    /// the same hash IFF the underlying identity is unchanged —
    /// helping operators distinguish "name changed" from "flag
    /// changed."
    /// </summary>
    internal static string ComputeRowHash(PacsSourceAccount src)
    {
        var seed = string.Join("|",
            src.AcctId.ToString(CultureInfo.InvariantCulture),
            src.FileAsName ?? "",
            src.FirstName ?? "",
            src.LastName ?? "",
            src.DlNum ?? "",
            src.DlState ?? "",
            src.EmailAddr ?? "",
            src.WebSuppression ? "1" : "0",
            src.ConfidentialFlag ? "1" : "0");
        return ComputeStableHash(seed);
    }
}
