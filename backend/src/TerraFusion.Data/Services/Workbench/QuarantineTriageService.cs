using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.Data.Services.Workbench;

/// <summary>
/// SYNC-WORKBENCH-F implementation of <see cref="IQuarantineTriageService"/>.
///
/// <para>Reads from <c>legacy_tf_unproven.unresolved_imprv_attr</c>
/// (doctrine-immutable) LEFT-JOIN <c>legacy_tf_unproven.unproven_imprv_attr_triage</c>
/// (operator decisions). Writes only to the triage sibling table.</para>
///
/// <para>SuggestedReroute v1: surfaces the row's own
/// <see cref="LegacyTfUnprovenImprvAttr.UniverseCode"/>. Cheap and
/// already populated by the V4 promoter at quarantine time. Richer
/// reroute calculation is deferred per spec.</para>
/// </summary>
public sealed class QuarantineTriageService : IQuarantineTriageService
{
    private const int DefaultLimit = 100;
    private const int MaxLimit = 500;

    private readonly TerraFusionDbContext _db;

    public QuarantineTriageService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<QuarantineListResult> ListAsync(
        QuarantineListRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var limit = request.Limit <= 0
            ? DefaultLimit
            : (request.Limit > MaxLimit ? MaxLimit : request.Limit);
        var offset = request.Offset < 0 ? 0 : request.Offset;

        var query = _db.LegacyTfUnprovenImprvAttrs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Reason))
            query = query.Where(q => q.QuarantineReason == request.Reason);

        if (!string.IsNullOrWhiteSpace(request.Universe))
            query = query.Where(q => q.UniverseCode == request.Universe);

        if (request.PropId.HasValue)
            query = query.Where(q => q.PropId == request.PropId.Value);

        // LEFT JOIN to triage table by UnprovenRowId.
        var joined =
            from q in query
            join t in _db.UnprovenImprvAttrTriages.AsNoTracking()
                on q.UnprovenRowId equals t.UnprovenRowId into triageGroup
            from t in triageGroup.DefaultIfEmpty()
            orderby q.CreatedAt descending
            select new
            {
                Q = q,
                TriageStatus = t == null ? TriageStatuses.Open : t.Status,
            };

        var rows = await joined
            .Skip(offset)
            .Take(limit)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var items = rows
            .Select(r => new QuarantineRow(
                UnprovenRowId: r.Q.UnprovenRowId,
                PropId: r.Q.PropId,
                PropValYr: r.Q.PropValYr,
                SupNum: r.Q.SupNum,
                ImprvId: r.Q.ImprvId,
                ImprvDetId: r.Q.ImprvDetId,
                IAttrValId: r.Q.IAttrValId,
                IAttrValCd: r.Q.IAttrValCd,
                AttrValueText: r.Q.AttrValueText,
                AttrValueNumeric: r.Q.AttrValueNumeric,
                QuarantineReason: r.Q.QuarantineReason,
                QuarantineReasonDetail: r.Q.QuarantineReasonDetail,
                UniverseCode: r.Q.UniverseCode,
                CreatedAt: r.Q.CreatedAt,
                TriageStatus: r.TriageStatus,
                SuggestedReroute: r.Q.UniverseCode))
            .ToList();

        return new QuarantineListResult(
            Outcome: TriageOutcome.Ok,
            ErrorMessage: null,
            Items: items,
            Limit: limit,
            Offset: offset);
    }

    public async Task<RouteDecisionResult> RouteAsync(
        Guid unprovenRowId,
        RouteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (unprovenRowId == Guid.Empty)
            return new RouteDecisionResult(
                TriageOutcome.InvalidInput,
                "unprovenRowId is required.",
                null);

        if (string.IsNullOrWhiteSpace(request.TargetUniverse) ||
            !UniverseCodes.IsKnown(request.TargetUniverse))
        {
            return new RouteDecisionResult(
                TriageOutcome.InvalidInput,
                $"Unknown TargetUniverse: '{request.TargetUniverse}'.",
                null);
        }

        var quarantine = await _db.LegacyTfUnprovenImprvAttrs
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.UnprovenRowId == unprovenRowId, cancellationToken)
            .ConfigureAwait(false);

        if (quarantine is null)
            return new RouteDecisionResult(
                TriageOutcome.NotFound,
                $"Quarantine row '{unprovenRowId}' not found.",
                null);

        var existing = await _db.UnprovenImprvAttrTriages
            .FirstOrDefaultAsync(t => t.UnprovenRowId == unprovenRowId, cancellationToken)
            .ConfigureAwait(false);

        var nowUtc = DateTime.UtcNow;

        if (existing is not null)
        {
            if (existing.Status == TriageStatuses.Dismissed)
                return new RouteDecisionResult(
                    TriageOutcome.Conflict,
                    "Quarantine row is already dismissed; dismiss before routing.",
                    null);

            if (existing.Status == TriageStatuses.Routed)
            {
                // Idempotent re-route to same target.
                if (existing.RoutedToUniverse == request.TargetUniverse &&
                    existing.RoutedToIAttrValCd == request.TargetIAttrValCd)
                {
                    return new RouteDecisionResult(
                        TriageOutcome.Ok,
                        null,
                        new RouteDecisionPayload(
                            existing.TriageId,
                            existing.UnprovenRowId,
                            existing.Status,
                            existing.RoutedToUniverse!,
                            existing.RoutedToIAttrValCd,
                            existing.UpdatedAt));
                }

                return new RouteDecisionResult(
                    TriageOutcome.Conflict,
                    "Already routed to a different target; dismiss before re-routing.",
                    null);
            }

            // Defensive: existing.Status not Open/Routed/Dismissed.
            existing.Status = TriageStatuses.Routed;
            existing.RoutedToUniverse = request.TargetUniverse;
            existing.RoutedToIAttrValCd = request.TargetIAttrValCd;
            existing.DismissalReason = null;
            existing.OperatorNote = request.OperatorNote;
            existing.UpdatedAt = nowUtc;
        }
        else
        {
            var newRow = new UnprovenImprvAttrTriage
            {
                TriageId = Guid.NewGuid(),
                UnprovenRowId = unprovenRowId,
                Status = TriageStatuses.Routed,
                RoutedToUniverse = request.TargetUniverse,
                RoutedToIAttrValCd = request.TargetIAttrValCd,
                OperatorNote = request.OperatorNote,
                CreatedAt = nowUtc,
                UpdatedAt = nowUtc,
            };
            _db.UnprovenImprvAttrTriages.Add(newRow);
            existing = newRow;
        }

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new RouteDecisionResult(
            TriageOutcome.Ok,
            null,
            new RouteDecisionPayload(
                existing.TriageId,
                existing.UnprovenRowId,
                existing.Status,
                existing.RoutedToUniverse!,
                existing.RoutedToIAttrValCd,
                existing.UpdatedAt));
    }

    public async Task<DismissDecisionResult> DismissAsync(
        Guid unprovenRowId,
        DismissRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (unprovenRowId == Guid.Empty)
            return new DismissDecisionResult(
                TriageOutcome.InvalidInput,
                "unprovenRowId is required.",
                null);

        if (!TriageDismissalReasons.IsKnown(request.DismissalReason))
        {
            return new DismissDecisionResult(
                TriageOutcome.InvalidInput,
                $"Unknown DismissalReason: '{request.DismissalReason}'.",
                null);
        }

        var quarantine = await _db.LegacyTfUnprovenImprvAttrs
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.UnprovenRowId == unprovenRowId, cancellationToken)
            .ConfigureAwait(false);

        if (quarantine is null)
            return new DismissDecisionResult(
                TriageOutcome.NotFound,
                $"Quarantine row '{unprovenRowId}' not found.",
                null);

        var existing = await _db.UnprovenImprvAttrTriages
            .FirstOrDefaultAsync(t => t.UnprovenRowId == unprovenRowId, cancellationToken)
            .ConfigureAwait(false);

        var nowUtc = DateTime.UtcNow;

        if (existing is not null)
        {
            if (existing.Status == TriageStatuses.Routed)
                return new DismissDecisionResult(
                    TriageOutcome.Conflict,
                    "Quarantine row is already routed; clear routing before dismissing.",
                    null);

            if (existing.Status == TriageStatuses.Dismissed)
            {
                if (existing.DismissalReason == request.DismissalReason)
                {
                    return new DismissDecisionResult(
                        TriageOutcome.Ok,
                        null,
                        new DismissDecisionPayload(
                            existing.TriageId,
                            existing.UnprovenRowId,
                            existing.Status,
                            existing.DismissalReason!,
                            existing.UpdatedAt));
                }

                return new DismissDecisionResult(
                    TriageOutcome.Conflict,
                    "Already dismissed with a different reason.",
                    null);
            }

            existing.Status = TriageStatuses.Dismissed;
            existing.DismissalReason = request.DismissalReason;
            existing.RoutedToUniverse = null;
            existing.RoutedToIAttrValCd = null;
            existing.OperatorNote = request.OperatorNote;
            existing.UpdatedAt = nowUtc;
        }
        else
        {
            var newRow = new UnprovenImprvAttrTriage
            {
                TriageId = Guid.NewGuid(),
                UnprovenRowId = unprovenRowId,
                Status = TriageStatuses.Dismissed,
                DismissalReason = request.DismissalReason,
                OperatorNote = request.OperatorNote,
                CreatedAt = nowUtc,
                UpdatedAt = nowUtc,
            };
            _db.UnprovenImprvAttrTriages.Add(newRow);
            existing = newRow;
        }

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new DismissDecisionResult(
            TriageOutcome.Ok,
            null,
            new DismissDecisionPayload(
                existing.TriageId,
                existing.UnprovenRowId,
                existing.Status,
                existing.DismissalReason!,
                existing.UpdatedAt));
    }
}
