using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.Data.Services.Workbench;

/// <summary>
/// WORKBENCH-V0.2 SLICE-H STEP-2: default <see cref="IDryRunPreviewService"/>.
///
/// <para>Reads from <c>legacy_pacs_raw.imprv</c>, <c>truth_pacs.imprv_current</c>,
/// <c>canonical_tf.tf_improvement</c>, and
/// <c>legacy_tf_unproven.{imprv_current,unresolved_imprv_attr}</c>.
/// Writes exactly one <c>sync_bridge.dry_run_log</c> row (IsPreview = true).
/// Mutates nothing else.</para>
///
/// <para>Only the "improvement" lane is supported in Step 2.
/// Unsupported lanes return <see cref="DryRunPreviewOutcome.UnsupportedLane"/>.</para>
/// </summary>
public sealed class DryRunPreviewService : IDryRunPreviewService
{
    private static readonly IReadOnlySet<string> SupportedLanes =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "improvement" };

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DryRunPreviewService> _logger;

    public DryRunPreviewService(
        TerraFusionDbContext db,
        ILogger<DryRunPreviewService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<DryRunPreviewResult> ComputePreviewAsync(
        DryRunPreviewRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        // ── Guard: dryRun must be explicitly true ─────────────────────
        if (!request.DryRun)
        {
            return Fail(DryRunPreviewOutcome.InvalidInput,
                "dryRun must be true. This endpoint does not execute the drain.");
        }

        // ── Guard: lane must be non-empty ─────────────────────────────
        if (string.IsNullOrWhiteSpace(request.Lane))
        {
            return Fail(DryRunPreviewOutcome.InvalidInput, "lane is required.");
        }

        // ── Guard: lane must be supported ─────────────────────────────
        if (!SupportedLanes.Contains(request.Lane))
        {
            return Fail(DryRunPreviewOutcome.UnsupportedLane,
                $"Lane '{request.Lane}' is not supported in this preview step. " +
                $"Supported: {string.Join(", ", SupportedLanes)}");
        }

        // ── Guard: topN must be positive if provided ──────────────────
        if (request.TopN.HasValue && request.TopN.Value <= 0)
        {
            return Fail(DryRunPreviewOutcome.InvalidInput,
                "topN must be a positive integer when provided.");
        }

        var previewRunId = Guid.NewGuid();
        var sw = Stopwatch.StartNew();

        try
        {
            var result = await ComputeImprovementPreviewAsync(
                request, previewRunId, cancellationToken).ConfigureAwait(false);

            sw.Stop();
            result.DurationMs = sw.ElapsedMilliseconds;

            await AppendDryRunLogAsync(
                previewRunId, request, result, "COMPLETE", cancellationToken)
                .ConfigureAwait(false);

            return result;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex,
                "[DryRunPreview] Preview computation failed for lane={Lane}",
                request.Lane);

            // Best-effort error log row; do not throw if this also fails.
            try
            {
                await AppendDryRunLogAsync(
                    previewRunId, request, null, "ERROR", cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception logEx)
            {
                _logger.LogWarning(logEx,
                    "[DryRunPreview] Also failed to write error dry_run_log row.");
            }

            return Fail(DryRunPreviewOutcome.InternalError,
                $"Preview computation failed: {ex.Message}");
        }
    }

    // ── Improvement lane computation ─────────────────────────────────

    private async Task<DryRunPreviewResult> ComputeImprovementPreviewAsync(
        DryRunPreviewRequest request,
        Guid previewRunId,
        CancellationToken ct)
    {
        // Resolve operational year: use request value, or default to the
        // most recent PropValYr present in the landing table.
        int opYear = request.OperationalYear
            ?? await ResolveDefaultYearAsync(ct).ConfigureAwait(false);

        // ── Source: landed improvement rows (year-filtered + topN) ────
        var sourceQuery = _db.LegacyPacsRawImprvs
            .AsNoTracking()
            .Where(x => x.PropValYr == opYear)
            .OrderBy(x => x.PropId)
            .ThenBy(x => x.ImprvId);

        IQueryable<(int PropId, long ImprvId)> sourceProjQ = sourceQuery
            .Select(x => ValueTuple.Create(x.PropId, x.ImprvId));

        if (request.TopN.HasValue)
        {
            sourceProjQ = sourceProjQ.Take(request.TopN.Value);
        }

        // Load source keys into memory for set operations.
        var sourceKeys = await sourceProjQ.ToListAsync(ct).ConfigureAwait(false);
        int sourceCount = sourceKeys.Count;

        // ── Truth: current improvement truth rows ─────────────────────
        var truthKeys = await _db.TruthPacsImprvCurrents
            .AsNoTracking()
            .Select(x => ValueTuple.Create(x.PropId, x.ImprvId))
            .ToListAsync(ct).ConfigureAwait(false);

        // ── Set-delta estimation ──────────────────────────────────────
        var sourceSet = new HashSet<(int, long)>(sourceKeys);
        var truthSet = new HashSet<(int, long)>(truthKeys);

        int estimatedInserts = sourceKeys.Count(k => !truthSet.Contains(k));
        int estimatedUpdates = sourceKeys.Count(k => truthSet.Contains(k));
        int estimatedDeletes = truthKeys.Count(k => !sourceSet.Contains(k));

        // ── Canonical count (read-only) ───────────────────────────────
        int canonicalCount = await _db.TfImprovements
            .AsNoTracking()
            .CountAsync(ct).ConfigureAwait(false);

        // ── Quarantine candidates ─────────────────────────────────────
        // improvement-level quarantine + unresolved attribute quarantine
        int imprvQuarantine = await _db.LegacyTfUnprovenImprvCurrents
            .AsNoTracking()
            .CountAsync(ct).ConfigureAwait(false);

        int attrQuarantine = await _db.LegacyTfUnprovenImprvAttrs
            .AsNoTracking()
            .CountAsync(ct).ConfigureAwait(false);

        int quarantineCandidateCount = imprvQuarantine + attrQuarantine;

        _logger.LogInformation(
            "[DryRunPreview] improvement lane preview: " +
            "year={Year} source={Source} inserts={Ins} updates={Upd} " +
            "deletes={Del} canonical={Canon} quarantine={Quarantine}",
            opYear, sourceCount, estimatedInserts, estimatedUpdates,
            estimatedDeletes, canonicalCount, quarantineCandidateCount);

        return new DryRunPreviewResult
        {
            Outcome = DryRunPreviewOutcome.Ok,
            PreviewRunId = previewRunId,
            Lane = request.Lane,
            OperationalYear = opYear,
            TopN = request.TopN,
            SourceCount = sourceCount,
            CanonicalCount = canonicalCount,
            EstimatedInserts = estimatedInserts,
            EstimatedUpdates = estimatedUpdates,
            EstimatedDeletes = estimatedDeletes,
            QuarantineCandidateCount = quarantineCandidateCount,
            Status = "PREVIEW",
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private async Task<int> ResolveDefaultYearAsync(CancellationToken ct)
    {
        // Use the most recent PropValYr present in the landing table,
        // or the current calendar year if the table is empty.
        var maxYear = await _db.LegacyPacsRawImprvs
            .AsNoTracking()
            .MaxAsync(x => (short?)x.PropValYr, ct).ConfigureAwait(false);

        return maxYear.HasValue
            ? (int)maxYear.Value
            : DateTime.UtcNow.Year;
    }

    private async Task AppendDryRunLogAsync(
        Guid previewRunId,
        DryRunPreviewRequest request,
        DryRunPreviewResult? result,
        string status,
        CancellationToken ct)
    {
        // Write the audit row. IsPreview = true is enforced by DB check constraint.
        var row = new DryRunLog
        {
            PreviewRunId = previewRunId,
            Lane = request.Lane,
            OperationalYear = request.OperationalYear ?? (result?.OperationalYear ?? DateTime.UtcNow.Year),
            RequestedAt = DateTime.UtcNow,
            RequestedBy = request.RequestedBy,
            Status = status,
            IsPreview = true,
            InputJson = JsonSerializer.Serialize(new
            {
                request.Lane,
                request.OperationalYear,
                request.TopN,
                request.DryRun,
                request.RequestedBy,
            }),
            ResultJson = result is null ? null : JsonSerializer.Serialize(new
            {
                result.SourceCount,
                result.CanonicalCount,
                result.EstimatedInserts,
                result.EstimatedUpdates,
                result.EstimatedDeletes,
                result.QuarantineCandidateCount,
                result.DurationMs,
            }),
            CreatedAt = DateTime.UtcNow,
        };

        _db.SyncBridgeDryRunLogs.Add(row);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    private static DryRunPreviewResult Fail(DryRunPreviewOutcome outcome, string message)
        => new() { Outcome = outcome, ErrorMessage = message };
}
