using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.Data.Services.Workbench;

/// <summary>
/// WORKBENCH-V0.2 SLICE-I STEP-2: default <see cref="IQuarantineReviewService"/>.
///
/// <para>Reads from <c>legacy_tf_unproven.unresolved_imprv_attr</c> and
/// <c>sync_bridge.quarantine_review_decision</c>.
/// Writes only to <c>sync_bridge.quarantine_review_decision</c> (INSERT).
/// Never updates, deletes, or inserts into quarantine source tables.</para>
///
/// <para>Disposition vocabulary: ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH.
/// ACCEPT_AS_IS does NOT release or promote the source row — it records operator
/// acknowledgement only.</para>
///
/// <para>Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7.</para>
/// </summary>
public sealed class QuarantineReviewService : IQuarantineReviewService
{
    private const string ImprvAttrLane = "imprv_attr";

    private static readonly IReadOnlySet<string> SupportedLanes =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ImprvAttrLane };

    /// <summary>
    /// Closed disposition vocabulary. All other values are rejected.
    /// ACCEPT_AS_IS = acknowledged, NOT promoted. No automatic release on any value.
    /// </summary>
    private static readonly IReadOnlySet<string> AllowedDispositions =
        new HashSet<string>(StringComparer.Ordinal)
        {
            "ACCEPT_AS_IS",
            "REJECT_PERMANENTLY",
            "NEEDS_RESEARCH",
        };

    private const int MaxLimit = 500;
    private const int MaxNoteLength = 500;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<QuarantineReviewService> _logger;

    public QuarantineReviewService(
        TerraFusionDbContext db,
        ILogger<QuarantineReviewService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Browse ────────────────────────────────────────────────────────────────

    public async Task<QuarantineReviewBrowseResult> BrowseAsync(
        QuarantineReviewBrowseRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Lane))
        {
            return BrowseFail(QuarantineReviewOutcome.InvalidInput,
                "lane is required.");
        }

        if (!SupportedLanes.Contains(request.Lane))
        {
            return BrowseFail(QuarantineReviewOutcome.UnsupportedLane,
                $"Lane '{request.Lane}' is not supported. Supported: {string.Join(", ", SupportedLanes)}.");
        }

        var limit = Math.Clamp(request.Limit <= 0 ? 50 : request.Limit, 1, MaxLimit);

        try
        {
            return await BrowseImprvAttrAsync(request, limit, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[QuarantineReview] Browse failed: lane={Lane}", request.Lane);
            return BrowseFail(QuarantineReviewOutcome.InternalError,
                $"Internal error during browse: {ex.Message}");
        }
    }

    private async Task<QuarantineReviewBrowseResult> BrowseImprvAttrAsync(
        QuarantineReviewBrowseRequest request,
        int limit,
        CancellationToken ct)
    {
        // ── 1. Fetch total source count (pre-query, no limit) ──────────────
        var totalSourceCount = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(ct);

        // ── 2. Fetch quarantine rows, ordered by quarantine date DESC ──────
        IQueryable<TerraFusion.Core.Entities.LegacyTfUnproven.LegacyTfUnprovenImprvAttr>
            quarantineQuery = _db.LegacyTfUnprovenImprvAttrs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.ReasonFilter))
        {
            var reason = request.ReasonFilter;
            quarantineQuery = quarantineQuery.Where(u => u.QuarantineReason == reason);
        }

        var quarantineRows = await quarantineQuery
            .OrderByDescending(u => u.CreatedAt)
            .Take(limit * 4)   // over-fetch to allow disposition filter trimming
            .ToListAsync(ct);

        // ── 3. Fetch latest decisions for the fetched rows ─────────────────
        var rowRefs = quarantineRows
            .Select(u => u.UnprovenRowId.ToString())
            .ToList();

        // Latest decision per QuarantineRowRef (for lane=imprv_attr).
        // Group in memory after fetching decisions for the batch.
        var decisions = await _db.SyncBridgeQuarantineReviewDecisions
            .AsNoTracking()
            .Where(d => d.Lane == ImprvAttrLane &&
                        d.QuarantineRowRef != null &&
                        rowRefs.Contains(d.QuarantineRowRef!))
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(ct);

        // Build a lookup: QuarantineRowRef → latest decision
        var latestDecision = decisions
            .GroupBy(d => d.QuarantineRowRef!, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(d => d.CreatedAt).First(),
                StringComparer.Ordinal);

        // ── 4. Join and build result rows ──────────────────────────────────
        var resultRows = new List<QuarantineReviewRow>(quarantineRows.Count);

        foreach (var u in quarantineRows)
        {
            var rowRef = u.UnprovenRowId.ToString();
            latestDecision.TryGetValue(rowRef, out var dec);

            var currentDisposition = dec?.Disposition ?? "UNREVIEWED";

            // Apply disposition filter if specified
            if (!string.IsNullOrWhiteSpace(request.DispositionFilter) &&
                !string.Equals(currentDisposition, request.DispositionFilter,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            resultRows.Add(new QuarantineReviewRow
            {
                QuarantineRowRef   = rowRef,
                PropValYr          = u.PropValYr,
                SupNum             = u.SupNum,
                PropId             = u.PropId,
                ImprvId            = u.ImprvId,
                ImprvDetId         = u.ImprvDetId,
                IAttrValId         = u.IAttrValId,
                IAttrValCd         = u.IAttrValCd,
                AttrValueText      = u.AttrValueText,
                AttrValueNumeric   = u.AttrValueNumeric,
                QuarantineReason   = u.QuarantineReason,
                QuarantineReasonDetail = u.QuarantineReasonDetail,
                UniverseCode       = u.UniverseCode,
                QuarantinedAt      = u.CreatedAt,
                CurrentDisposition = currentDisposition,
                CurrentNote        = dec?.OperatorNote,
                ReviewedBy         = dec?.OperatorIdentity,
                ReviewedAt         = dec?.CreatedAt,
                CurrentDecisionId  = dec?.Id,
            });

            if (resultRows.Count >= limit)
                break;
        }

        return new QuarantineReviewBrowseResult
        {
            Outcome          = QuarantineReviewOutcome.Ok,
            Lane             = ImprvAttrLane,
            Items            = resultRows,
            TotalSourceCount = totalSourceCount,
            ReturnedCount    = resultRows.Count,
        };
    }

    // ── Save Decision ─────────────────────────────────────────────────────────

    public async Task<QuarantineReviewSaveResult> SaveDecisionAsync(
        string quarantineRowRef,
        QuarantineReviewSaveRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        // ── Guard: quarantineRowRef ────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(quarantineRowRef))
        {
            return SaveFail(QuarantineReviewOutcome.InvalidInput,
                "quarantineRowRef is required.");
        }

        // ── Guard: lane ───────────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(request.Lane))
        {
            return SaveFail(QuarantineReviewOutcome.InvalidInput,
                "lane is required.");
        }

        if (!SupportedLanes.Contains(request.Lane))
        {
            return SaveFail(QuarantineReviewOutcome.UnsupportedLane,
                $"Lane '{request.Lane}' is not supported. Supported: {string.Join(", ", SupportedLanes)}.");
        }

        // ── Guard: disposition ────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(request.Disposition))
        {
            return SaveFail(QuarantineReviewOutcome.InvalidInput,
                "disposition is required.");
        }

        if (!AllowedDispositions.Contains(request.Disposition))
        {
            return SaveFail(QuarantineReviewOutcome.InvalidInput,
                $"disposition '{request.Disposition}' is not in the allowed vocabulary: " +
                string.Join(", ", AllowedDispositions));
        }

        // ── Guard: note length ────────────────────────────────────────────
        if (request.Note is { Length: > MaxNoteLength })
        {
            return SaveFail(QuarantineReviewOutcome.InvalidInput,
                $"note exceeds {MaxNoteLength} characters.");
        }

        // ── Guard: operator identity ──────────────────────────────────────
        var operatorId = string.IsNullOrWhiteSpace(request.OperatorIdentity)
            ? "operator"
            : request.OperatorIdentity;

        try
        {
            return await SaveImprvAttrDecisionAsync(
                quarantineRowRef, request, operatorId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[QuarantineReview] SaveDecision failed: ref={Ref} lane={Lane}",
                quarantineRowRef, request.Lane);
            return SaveFail(QuarantineReviewOutcome.InternalError,
                $"Internal error during save: {ex.Message}");
        }
    }

    private async Task<QuarantineReviewSaveResult> SaveImprvAttrDecisionAsync(
        string quarantineRowRef,
        QuarantineReviewSaveRequest request,
        string operatorId,
        CancellationToken ct)
    {
        // ── 1. Verify source row exists (source is NEVER mutated) ──────────
        if (!Guid.TryParse(quarantineRowRef, out var rowGuid))
        {
            return SaveFail(QuarantineReviewOutcome.InvalidInput,
                $"quarantineRowRef '{quarantineRowRef}' is not a valid UUID.");
        }

        var sourceExists = await _db.LegacyTfUnprovenImprvAttrs
            .AnyAsync(u => u.UnprovenRowId == rowGuid, ct);

        if (!sourceExists)
        {
            return SaveFail(QuarantineReviewOutcome.NotFound,
                $"No imprv_attr quarantine row found for id '{quarantineRowRef}'.");
        }

        // ── 2. Capture pre-save source count (immutability proof) ──────────
        var countBefore = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(ct);

        // ── 3. Insert decision row — append only, source unchanged ────────
        var decision = new QuarantineReviewDecision
        {
            QuarantineId      = 0,             // 0 for UUID-keyed lanes
            QuarantineRowRef  = quarantineRowRef,
            Lane              = ImprvAttrLane, // canonical form regardless of request.Lane case
            Disposition       = request.Disposition,
            OperatorNote      = request.Note,
            OperatorIdentity  = operatorId,
            CreatedAt         = DateTime.UtcNow,
        };

        _db.SyncBridgeQuarantineReviewDecisions.Add(decision);
        await _db.SaveChangesAsync(ct);

        // ── 4. Verify source count unchanged ─────────────────────────────
        var countAfter = await _db.LegacyTfUnprovenImprvAttrs.CountAsync(ct);

        _logger.LogInformation(
            "[QuarantineReview] Decision saved: ref={Ref} disposition={Disp} " +
            "decisionId={Id} sourceBefore={Before} sourceAfter={After}",
            quarantineRowRef, request.Disposition, decision.Id, countBefore, countAfter);

        return new QuarantineReviewSaveResult
        {
            Outcome                = QuarantineReviewOutcome.Ok,
            DecisionId             = decision.Id,
            Disposition            = decision.Disposition,
            SavedAt                = decision.CreatedAt,
            SourceRowCountAfterSave = countAfter,
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static QuarantineReviewBrowseResult BrowseFail(
        QuarantineReviewOutcome outcome, string message) =>
        new()
        {
            Outcome      = outcome,
            ErrorMessage = message,
            Items        = Array.Empty<QuarantineReviewRow>(),
        };

    private static QuarantineReviewSaveResult SaveFail(
        QuarantineReviewOutcome outcome, string message) =>
        new()
        {
            Outcome      = outcome,
            ErrorMessage = message,
        };
}
