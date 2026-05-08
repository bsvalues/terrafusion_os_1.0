using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Workbench;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.Data.Services.Workbench;

/// <summary>
/// SYNC-WORKBENCH-G implementation of <see cref="IWorkbenchCommitService"/>.
///
/// <para>One <c>BeginTransactionAsync</c> wraps the entire commit
/// path: idempotency probe → pending-decision load → gate snapshot
/// reads → decision-link inserts → commit-row insert → commit. The
/// service NEVER mutates the upstream triage row or the doctrine-
/// immutable quarantine row. The link-row presence is the marker.</para>
///
/// <para>Gate-distribution snapshots are produced by aggregate
/// queries against <c>truth_pacs.imprv_current</c> (universe
/// distribution, 7 cells) and <c>canonical_tf.tf_sale</c> (4-cell
/// DOR/county ratio matrix). Both surfaces are zero-filled so the
/// JSON shape is stable regardless of source-side cardinality.</para>
/// </summary>
public sealed class WorkbenchCommitService : IWorkbenchCommitService
{
    private const int DefaultLimit = 50;
    private const int MaxLimit = 200;

    private static readonly string[] AllUniverseCells = new[]
    {
        UniverseCodes.RealResidential,
        UniverseCodes.RealCommercial,
        UniverseCodes.MobileHome,
        UniverseCodes.AgCurrentUse,
        UniverseCodes.PersonalProperty,
        UniverseCodes.ConversionLegacy,
        UniverseCodes.Unknown,
    };

    private readonly TerraFusionDbContext _db;

    public WorkbenchCommitService(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<CommitResult> CommitAsync(
        CommitRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
            return new CommitResult(
                CommitOutcome.InvalidInput,
                "IdempotencyKey is required.",
                null);

        if (string.IsNullOrWhiteSpace(request.OperatorId))
            return new CommitResult(
                CommitOutcome.InvalidInput,
                "OperatorId is required.",
                null);

        // ── Idempotency probe (no transaction needed for the read).
        var existing = await _db.WorkbenchCommits
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.IdempotencyKey == request.IdempotencyKey,
                cancellationToken)
            .ConfigureAwait(false);

        if (existing is not null)
        {
            return new CommitResult(
                CommitOutcome.Ok,
                null,
                new CommitResponse(
                    existing.CommitId,
                    CommitStatuses.Idempotent,
                    existing.RoutedDecisionsApplied,
                    existing.DismissedDecisionsApplied,
                    existing.CommittedAt,
                    existing.UniverseDistributionJson,
                    existing.RatioDistributionJson));
        }

        // The in-memory provider does not support relational
        // transactions; guard so unit tests still exercise the
        // happy-path logic.
        var supportsTransactions = _db.Database.IsRelational();
        await using var tx = supportsTransactions
            ? await _db.Database.BeginTransactionAsync(cancellationToken).ConfigureAwait(false)
            : null;

        // ── Load pending decisions: triage rows whose Status is
        // Routed or Dismissed AND no prior link row exists for that
        // TriageId. We anti-join against the link table (LEFT JOIN +
        // null-check) for portability across providers.
        var linkedTriageIds = _db.WorkbenchCommitDecisionLinks
            .AsNoTracking()
            .Select(l => l.TriageId);

        var pending = await _db.UnprovenImprvAttrTriages
            .AsNoTracking()
            .Where(t =>
                (t.Status == TriageStatuses.Routed ||
                 t.Status == TriageStatuses.Dismissed) &&
                !linkedTriageIds.Contains(t.TriageId))
            .OrderBy(t => t.TriageId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        if (pending.Count == 0)
        {
            return new CommitResult(
                CommitOutcome.Conflict,
                "No pending decisions to commit.",
                null);
        }

        // ── Snapshot doctrine gates. Both are read-only queries.
        var universeJson = await BuildUniverseDistributionJsonAsync(cancellationToken)
            .ConfigureAwait(false);
        var ratioJson = await BuildRatioDistributionJsonAsync(cancellationToken)
            .ConfigureAwait(false);

        // ── Build the commit row + link rows.
        var commitId = Guid.NewGuid();
        var nowUtc = DateTime.UtcNow;

        var routedCount = 0;
        var dismissedCount = 0;
        var links = new List<WorkbenchCommitDecisionLink>(pending.Count);

        foreach (var t in pending)
        {
            string decisionType;
            if (t.Status == TriageStatuses.Routed)
            {
                decisionType = DecisionTypes.Route;
                routedCount++;
            }
            else
            {
                decisionType = DecisionTypes.Dismiss;
                dismissedCount++;
            }

            links.Add(new WorkbenchCommitDecisionLink
            {
                LinkId = Guid.NewGuid(),
                CommitId = commitId,
                TriageId = t.TriageId,
                UnprovenRowId = t.UnprovenRowId,
                DecisionType = decisionType,
                RoutedToUniverse = decisionType == DecisionTypes.Route
                    ? t.RoutedToUniverse
                    : null,
                RoutedToIAttrValCd = decisionType == DecisionTypes.Route
                    ? t.RoutedToIAttrValCd
                    : null,
                DismissalReason = decisionType == DecisionTypes.Dismiss
                    ? t.DismissalReason
                    : null,
                CreatedAt = nowUtc,
            });
        }

        var commit = new WorkbenchCommit
        {
            CommitId = commitId,
            IdempotencyKey = request.IdempotencyKey,
            OperatorId = request.OperatorId,
            CommitNote = request.CommitNote,
            RoutedDecisionsApplied = routedCount,
            DismissedDecisionsApplied = dismissedCount,
            UniverseDistributionJson = universeJson,
            RatioDistributionJson = ratioJson,
            CommittedAt = nowUtc,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };

        _db.WorkbenchCommits.Add(commit);
        _db.WorkbenchCommitDecisionLinks.AddRange(links);

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        if (tx is not null)
            await tx.CommitAsync(cancellationToken).ConfigureAwait(false);

        return new CommitResult(
            CommitOutcome.Ok,
            null,
            new CommitResponse(
                commit.CommitId,
                CommitStatuses.Created,
                commit.RoutedDecisionsApplied,
                commit.DismissedDecisionsApplied,
                commit.CommittedAt,
                commit.UniverseDistributionJson,
                commit.RatioDistributionJson));
    }

    public async Task<CommitListResult> ListCommitsAsync(
        int limit,
        int offset,
        CancellationToken cancellationToken = default)
    {
        var clampedLimit = limit <= 0
            ? DefaultLimit
            : (limit > MaxLimit ? MaxLimit : limit);
        var clampedOffset = offset < 0 ? 0 : offset;

        var rows = await _db.WorkbenchCommits
            .AsNoTracking()
            .OrderByDescending(c => c.CommittedAt)
            .ThenByDescending(c => c.CommitId)
            .Skip(clampedOffset)
            .Take(clampedLimit)
            .Select(c => new CommitSummaryResponse(
                c.CommitId,
                c.CommittedAt,
                c.OperatorId,
                c.IdempotencyKey,
                c.RoutedDecisionsApplied,
                c.DismissedDecisionsApplied,
                c.CommitNote))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new CommitListResult(
            CommitOutcome.Ok,
            null,
            rows,
            clampedLimit,
            clampedOffset);
    }

    public async Task<CommitDetailResult> GetCommitAsync(
        Guid commitId,
        CancellationToken cancellationToken = default)
    {
        if (commitId == Guid.Empty)
            return new CommitDetailResult(
                CommitOutcome.InvalidInput,
                "commitId is required.",
                null);

        var commit = await _db.WorkbenchCommits
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CommitId == commitId, cancellationToken)
            .ConfigureAwait(false);

        if (commit is null)
            return new CommitDetailResult(
                CommitOutcome.NotFound,
                $"Commit '{commitId}' not found.",
                null);

        // Decision-link order: ascending TriageId. Stable, deterministic,
        // does not depend on storage-engine row order.
        var decisions = await _db.WorkbenchCommitDecisionLinks
            .AsNoTracking()
            .Where(l => l.CommitId == commitId)
            .OrderBy(l => l.TriageId)
            .Select(l => new DecisionLinkResponse(
                l.LinkId,
                l.TriageId,
                l.UnprovenRowId,
                l.DecisionType,
                l.RoutedToUniverse,
                l.RoutedToIAttrValCd,
                l.DismissalReason))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new CommitDetailResult(
            CommitOutcome.Ok,
            null,
            new CommitDetailResponse(
                commit.CommitId,
                commit.CommittedAt,
                commit.OperatorId,
                commit.IdempotencyKey,
                commit.RoutedDecisionsApplied,
                commit.DismissedDecisionsApplied,
                commit.CommitNote,
                commit.UniverseDistributionJson,
                commit.RatioDistributionJson,
                decisions));
    }

    // ── Gate-distribution snapshot helpers ─────────────────────────

    private async Task<string> BuildUniverseDistributionJsonAsync(
        CancellationToken cancellationToken)
    {
        // GROUP BY UniverseCode on truth_pacs.imprv_current. Rows
        // with NULL universe are bucketed as UNKNOWN. The result is
        // zero-filled across all 7 universe cells for stable JSON
        // shape.
        var rawCounts = await _db.TruthPacsImprvCurrents
            .AsNoTracking()
            .GroupBy(r => r.UniverseCode ?? UniverseCodes.Unknown)
            .Select(g => new { Universe = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var byUniverse = rawCounts
            .ToDictionary(r => r.Universe, r => r.Count, StringComparer.Ordinal);

        // Bucket any unrecognized universe code into UNKNOWN. Keeps
        // the cell set closed even if a stray code lands.
        var distribution = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var cell in AllUniverseCells)
            distribution[cell] = 0;

        foreach (var kv in byUniverse)
        {
            if (distribution.ContainsKey(kv.Key))
                distribution[kv.Key] += kv.Value;
            else
                distribution[UniverseCodes.Unknown] += kv.Value;
        }

        return SerializeDistribution(distribution, AllUniverseCells);
    }

    private async Task<string> BuildRatioDistributionJsonAsync(
        CancellationToken cancellationToken)
    {
        // GROUP BY (DorRatioQualified, CountyRatioQualified) on
        // canonical_tf.tf_sale. Four-cell matrix. Zero-filled.
        var rawCells = await _db.TfSales
            .AsNoTracking()
            .GroupBy(s => new
            {
                DorQ = s.DorRatioQualified,
                CountyQ = s.CountyRatioQualified,
            })
            .Select(g => new
            {
                g.Key.DorQ,
                g.Key.CountyQ,
                Count = g.Count(),
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var distribution = new Dictionary<string, int>(StringComparer.Ordinal)
        {
            [RatioDistributionCells.DorQ_CountyQ] = 0,
            [RatioDistributionCells.DorQ_CountyN] = 0,
            [RatioDistributionCells.DorN_CountyQ] = 0,
            [RatioDistributionCells.DorN_CountyN] = 0,
        };

        foreach (var cell in rawCells)
        {
            var key = (cell.DorQ, cell.CountyQ) switch
            {
                (true, true) => RatioDistributionCells.DorQ_CountyQ,
                (true, false) => RatioDistributionCells.DorQ_CountyN,
                (false, true) => RatioDistributionCells.DorN_CountyQ,
                (false, false) => RatioDistributionCells.DorN_CountyN,
            };
            distribution[key] += cell.Count;
        }

        return SerializeDistribution(distribution, RatioDistributionCells.All);
    }

    private static string SerializeDistribution(
        IReadOnlyDictionary<string, int> distribution,
        IReadOnlyList<string> orderedKeys)
    {
        // Hand-roll the JSON to keep key order stable + matchable
        // across providers. The closed-vocabulary keys are simple
        // ASCII identifiers so explicit quoting is safe and avoids
        // a System.Text.Json round-trip.
        var sb = new StringBuilder();
        sb.Append('{');
        for (var i = 0; i < orderedKeys.Count; i++)
        {
            if (i > 0) sb.Append(',');
            var key = orderedKeys[i];
            sb.Append('"').Append(key).Append('"').Append(':');
            sb.Append(distribution[key]);
        }
        sb.Append('}');
        return sb.ToString();
    }
}
