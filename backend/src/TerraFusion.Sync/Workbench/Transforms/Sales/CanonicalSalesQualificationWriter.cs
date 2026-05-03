using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C36 implementation of <see cref="ICanonicalSalesQualificationWriter"/>.
/// Upsert via DbContext. Idempotent re-write per C35-A: the same
/// <c>(CountyId, ChgOfOwnerId)</c> evaluated twice produces a single
/// row whose decision/audit fields reflect the most recent run.
///
/// <para>The mapping from C8-B's structured
/// <see cref="SalesQualificationEvaluation"/> to
/// <see cref="CanonicalSaleQualificationDecision"/> (the C35-B
/// canonical landing shape) maps operator-explicit Excluded to
/// <see cref="CanonicalSaleQualificationDecision.Excluded"/> and
/// maps Deferred / Unknown / MissingCode to
/// <see cref="CanonicalSaleQualificationDecision.Inconclusive"/>.
/// Both axis-decision enums
/// follow the same precedence per C35-A's "AND-logic exclusion is the
/// only decision rule" Hard Guard.</para>
/// </summary>
public sealed class CanonicalSalesQualificationWriter : ICanonicalSalesQualificationWriter
{
    private readonly TerraFusionDbContext _db;

    public CanonicalSalesQualificationWriter(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<CanonicalSaleQualification> UpsertAsync(
        CanonicalSalesQualificationWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.CountyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(request));
        if (request.SourceWorkbookId == Guid.Empty)
            throw new ArgumentException("SourceWorkbookId is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.OperatorId))
            throw new ArgumentException("OperatorId is required.", nameof(request));

        var (overall, wacAxis, ratioAxis) = MapDecision(request.Evaluation);

        var existing = await _db.CanonicalSaleQualifications
            .FirstOrDefaultAsync(
                r => r.CountyId == request.CountyId
                  && r.ChgOfOwnerId == request.ChgOfOwnerId,
                cancellationToken);

        var nowUtc = DateTime.UtcNow;

        if (existing is null)
        {
            // Insert
            var fresh = new CanonicalSaleQualification
            {
                CountyId                    = request.CountyId,
                ChgOfOwnerId                = request.ChgOfOwnerId,
                ComputedDecision            = overall,
                WacCdSourceValue            = request.WacCdSourceValue,
                WacCdCanonicalValue         = request.Evaluation.WacAxis.CanonicalValue,
                WacCdAxisDecision           = wacAxis,
                SlRatioTypeCdSourceValue    = request.SlRatioTypeCdSourceValue,
                SlRatioTypeCdCanonicalValue = request.Evaluation.RatioAxis.CanonicalValue,
                SlRatioTypeCdAxisDecision   = ratioAxis,
                SourceWorkbookId            = request.SourceWorkbookId,
                SourceWorkbookLockedAt      = request.SourceWorkbookLockedAt,
                SaleDate                    = request.SaleDate,
                SalePrice                   = request.SalePrice,
                CreatedAt                   = nowUtc,
                UpdatedAt                   = nowUtc,
                CreatedBy                   = request.OperatorId,
                UpdatedBy                   = request.OperatorId,
            };
            _db.CanonicalSaleQualifications.Add(fresh);
            await _db.SaveChangesAsync(cancellationToken);
            return fresh;
        }
        else
        {
            // Idempotent re-write — overwrite mutable fields in place.
            existing.ComputedDecision            = overall;
            existing.WacCdSourceValue            = request.WacCdSourceValue;
            existing.WacCdCanonicalValue         = request.Evaluation.WacAxis.CanonicalValue;
            existing.WacCdAxisDecision           = wacAxis;
            existing.SlRatioTypeCdSourceValue    = request.SlRatioTypeCdSourceValue;
            existing.SlRatioTypeCdCanonicalValue = request.Evaluation.RatioAxis.CanonicalValue;
            existing.SlRatioTypeCdAxisDecision   = ratioAxis;
            existing.SourceWorkbookId            = request.SourceWorkbookId;
            existing.SourceWorkbookLockedAt      = request.SourceWorkbookLockedAt;
            existing.SaleDate                    = request.SaleDate;
            existing.SalePrice                   = request.SalePrice;
            existing.UpdatedAt                   = nowUtc;
            existing.UpdatedBy                   = request.OperatorId;
            await _db.SaveChangesAsync(cancellationToken);
            return existing;
        }
    }

    /// <summary>
    /// Map C8-B's structured evaluation shape onto the C35-B
    /// canonical landing shape.
    ///
    /// <para>C8-B has 5 statuses (Qualified / Excluded / Deferred /
    /// Unknown / MissingCode). C35-B
    /// has 3 statuses (Qualified / Excluded / Inconclusive). The
    /// collapse rule per C35-A:
    /// <list type="bullet">
    /// <item>Qualified → Qualified.</item>
    /// <item>Excluded (operator-explicit) → Excluded.</item>
    /// <item>Deferred / Unknown / MissingCode → Inconclusive (consumer
    ///   treats as not-yet-evaluated).</item>
    /// </list>
    /// </para>
    ///
    /// <para>Per-axis decisions are mapped from structured transform
    /// output so the canonical row records which source axis actually
    /// qualified, excluded, or stayed unmapped.</para>
    /// </summary>
    private static (CanonicalSaleQualificationDecision overall,
                    CanonicalSaleAxisDecision wacAxis,
                    CanonicalSaleAxisDecision ratioAxis)
        MapDecision(SalesQualificationEvaluation evaluation)
    {
        var overall = evaluation.Decision.DecisionStatus switch
        {
            SalesQualificationDecisionStatus.Qualified   => CanonicalSaleQualificationDecision.Qualified,
            SalesQualificationDecisionStatus.Excluded    => CanonicalSaleQualificationDecision.Excluded,
            SalesQualificationDecisionStatus.Deferred    => CanonicalSaleQualificationDecision.Inconclusive,
            SalesQualificationDecisionStatus.Unknown     => CanonicalSaleQualificationDecision.Inconclusive,
            SalesQualificationDecisionStatus.MissingCode => CanonicalSaleQualificationDecision.Inconclusive,
            _ => throw new InvalidOperationException(
                $"Unknown SalesQualificationDecisionStatus: {evaluation.Decision.DecisionStatus}"),
        };

        return (overall, MapAxis(evaluation.WacAxis), MapAxis(evaluation.RatioAxis));
    }

    private static CanonicalSaleAxisDecision MapAxis(SalesQualificationAxisEvaluation axis)
    {
        return axis.AxisDecision switch
        {
            SalesQualificationAxisDecision.Qualified => CanonicalSaleAxisDecision.Qualified,
            SalesQualificationAxisDecision.Excluded  => CanonicalSaleAxisDecision.Excluded,
            SalesQualificationAxisDecision.Deferred  => CanonicalSaleAxisDecision.NotMapped,
            SalesQualificationAxisDecision.Unknown   => CanonicalSaleAxisDecision.NotMapped,
            SalesQualificationAxisDecision.MissingCode => CanonicalSaleAxisDecision.NotMapped,
            _ => throw new InvalidOperationException(
                $"Unknown SalesQualificationAxisDecision: {axis.AxisDecision}"),
        };
    }
}
