using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Sync.Workbench.Mapping;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C8-B implementation of <see cref="ISalesQualificationTransform"/>.
/// See <c>docs/sync/sales-qualification-transform-policy.md</c> for the
/// design contract this implementation must obey.
///
/// <para>Architecture:
/// <list type="bullet">
/// <item><c>QualifyAsync</c> is the async wrapper that loads the
/// workbook via <see cref="ISyncMappingWorkbookReadModel"/> and calls
/// the pure-static <see cref="Qualify"/>.</item>
/// <item><c>Qualify(snapshot, source)</c> is the pure-static
/// decision engine — public so unit tests can hit it without DB
/// scaffolding, and so future batch consumers can load the snapshot
/// once and qualify many rows.</item>
/// <item><c>ClassifyAxis</c> + <c>CombineAxes</c> are private helpers
/// that encode the per-axis lookup and AND-logic-exclusion
/// combination from the C8-A policy.</item>
/// </list>
/// </para>
///
/// <para>The pure function never touches the DbContext — that's the
/// read model's job. The wrapper never decides — that's the pure
/// function's job. Splitting the seams makes the unit-test surface
/// trivial: 16 of the 17 policy tests run against in-memory snapshots
/// only.</para>
/// </summary>
public sealed class SalesQualificationTransform : ISalesQualificationTransform
{
    /// <summary>The PACS source schema this transform reads.</summary>
    public const string SourceSchema = "dbo";

    /// <summary>The PACS source table this transform reads.</summary>
    public const string SourceTable = "sale";

    /// <summary>The PACS column that supplies WAC qualification.</summary>
    public const string WacColumn = "wac_cd";

    /// <summary>The PACS column that supplies IAAO ratio-type qualification.</summary>
    public const string RatioColumn = "sl_ratio_type_cd";

    private readonly ISyncMappingWorkbookReadModel _readModel;

    public SalesQualificationTransform(ISyncMappingWorkbookReadModel readModel)
    {
        ArgumentNullException.ThrowIfNull(readModel);
        _readModel = readModel;
    }

    public async Task<SalesQualificationDecision> QualifyAsync(
        Guid countyId,
        Guid workbookId,
        SalesQualificationSource source,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(source);
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));

        // Read model throws InvalidOperationException for non-Mapped
        // workbooks; we DO NOT catch it. The exception is the contract
        // — a Draft workbook reaching here is operator error and must
        // surface, not silently degrade.
        var snapshot = await _readModel.LoadMappedAsync(countyId, workbookId, cancellationToken);

        return Qualify(snapshot, source);
    }

    /// <summary>
    /// Pure decision engine. Public so unit tests + future batch
    /// consumers can call it directly with a pre-loaded snapshot.
    /// Throws <see cref="InvalidOperationException"/> on contract
    /// violations (a code-value row that is neither Mapped, Excluded,
    /// nor Deferred — the C6 lock prevents this, but the transform
    /// surfaces it loudly if upstream drift introduces it).
    /// </summary>
    public static SalesQualificationDecision Qualify(
        SyncMappingWorkbookSnapshot snapshot,
        SalesQualificationSource source)
    {
        return Evaluate(snapshot, source).Decision;
    }

    /// <summary>
    /// Pure decision engine with structured per-axis output for C36's
    /// canonical landing writer.
    /// </summary>
    public static SalesQualificationEvaluation Evaluate(
        SyncMappingWorkbookSnapshot snapshot,
        SalesQualificationSource source)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(source);

        var wacAxis   = ClassifyAxis(snapshot, WacColumn,   source.WacCode);
        var ratioAxis = ClassifyAxis(snapshot, RatioColumn, source.SaleRatioTypeCode);

        return new SalesQualificationEvaluation(
            Decision:  CombineAxes(wacAxis, ratioAxis),
            WacAxis:   ToAxisEvaluation(wacAxis),
            RatioAxis: ToAxisEvaluation(ratioAxis));
    }

    // ── Per-axis classification ──────────────────────────────────────────

    private static AxisResult ClassifyAxis(
        SyncMappingWorkbookSnapshot snapshot,
        string columnName,
        string? rawSourceValue)
    {
        // MissingCode: null OR whitespace-only. Distinct from Unknown
        // (Unknown means "the row had a value but the workbook didn't
        // see it"; MissingCode means "the row had no value at all").
        if (string.IsNullOrWhiteSpace(rawSourceValue))
        {
            return new AxisResult(
                Classification: AxisClassification.MissingCode,
                ColumnName:     columnName,
                SourceValue:    null,
                CanonicalValue: null,
                Reason:         $"{columnName}=<missing>");
        }

        var trimmed = rawSourceValue.Trim();

        // Read-model lookup: case-insensitive on (schema, table, col),
        // exact-after-trim on value.
        var hit = snapshot.TryResolveCode(SourceSchema, SourceTable, columnName, trimmed, out var decision);
        if (!hit)
        {
            return new AxisResult(
                Classification: AxisClassification.Unknown,
                ColumnName:     columnName,
                SourceValue:    trimmed,
                CanonicalValue: null,
                Reason:         $"{columnName}={trimmed} not in workbook");
        }

        // The decision MUST be in a terminal review status because the
        // read model only loads Mapped workbooks and the C6 lock service
        // already enforced terminal statuses across every code-value
        // row before that load succeeded. We still check here as a
        // defensive seam — upstream drift would otherwise silently
        // produce a Qualified decision off a NeedsReview row.
        return decision!.ReviewStatus switch
        {
            // IsExcluded=true takes precedence over ReviewStatus=Mapped:
            // an operator that mapped a code AND set IsExcluded=true is
            // saying "I know what this is, but exclude it from comps."
            // ReviewStatus=Excluded is the canonical excluded shape.
            "Mapped"   when !decision.IsExcluded => new AxisResult(
                Classification: AxisClassification.OperatorMapped,
                ColumnName:     columnName,
                SourceValue:    trimmed,
                CanonicalValue: decision.CanonicalValue,
                Reason:         $"{columnName}={trimmed} operator-mapped (canonical: {decision.CanonicalValue ?? "null"})"),

            "Mapped"   when decision.IsExcluded => new AxisResult(
                Classification: AxisClassification.OperatorExcluded,
                ColumnName:     columnName,
                SourceValue:    trimmed,
                CanonicalValue: null,
                Reason:         $"{columnName}={trimmed} operator-excluded"),

            "Excluded" => new AxisResult(
                Classification: AxisClassification.OperatorExcluded,
                ColumnName:     columnName,
                SourceValue:    trimmed,
                CanonicalValue: null,
                Reason:         $"{columnName}={trimmed} operator-excluded"),

            "Deferred" => new AxisResult(
                Classification: AxisClassification.OperatorDeferred,
                ColumnName:     columnName,
                SourceValue:    trimmed,
                CanonicalValue: null,
                Reason:         $"{columnName}={trimmed} operator-deferred"),

            _ => throw new InvalidOperationException(
                $"Sales qualification transform reached a non-terminal review status " +
                $"'{decision.ReviewStatus}' on {columnName}={trimmed} in a Mapped workbook. " +
                $"This implies upstream contract drift in the C6 lock service. " +
                $"Refusing to qualify."),
        };
    }

    // ── AND-logic exclusion + precedence ────────────────────────────────

    /// <summary>
    /// Combine the two per-axis classifications into the final decision.
    /// AND-logic exclusion: comps are opt-in. A sale is Qualified only
    /// when BOTH axes are OperatorMapped; any non-Mapped axis sets
    /// <c>IsExcludedFromComps=true</c>.
    ///
    /// <para>Precedence among non-Qualified statuses (most-restrictive
    /// wins): <c>Excluded &gt; Deferred &gt; Unknown &gt; MissingCode</c>.
    /// Operator-explicit decisions trump silent gaps; workbook gaps
    /// (Unknown) trump source gaps (MissingCode) because "the workbook
    /// hasn't seen this code" is a stronger signal to surface than
    /// "the row had no code."</para>
    /// </summary>
    private static SalesQualificationDecision CombineAxes(AxisResult wac, AxisResult ratio)
    {
        var reasons = new List<string>(2) { wac.Reason, ratio.Reason };

        // Both Mapped → Qualified.
        if (wac.Classification == AxisClassification.OperatorMapped &&
            ratio.Classification == AxisClassification.OperatorMapped)
        {
            return new SalesQualificationDecision(
                CanonicalValue:      wac.CanonicalValue, // wac axis sources canonical
                IsExcludedFromComps: false,
                DecisionStatus:      SalesQualificationDecisionStatus.Qualified,
                Reasons:             reasons);
        }

        // Precedence: Excluded > Deferred > Unknown > MissingCode.
        var status =
            wac.Classification   == AxisClassification.OperatorExcluded ||
            ratio.Classification == AxisClassification.OperatorExcluded
                ? SalesQualificationDecisionStatus.Excluded
            : wac.Classification   == AxisClassification.OperatorDeferred ||
              ratio.Classification == AxisClassification.OperatorDeferred
                ? SalesQualificationDecisionStatus.Deferred
            : wac.Classification   == AxisClassification.Unknown ||
              ratio.Classification == AxisClassification.Unknown
                ? SalesQualificationDecisionStatus.Unknown
                : SalesQualificationDecisionStatus.MissingCode;

        return new SalesQualificationDecision(
            CanonicalValue:      null,
            IsExcludedFromComps: true,
            DecisionStatus:      status,
            Reasons:             reasons);
    }

    private static SalesQualificationAxisEvaluation ToAxisEvaluation(AxisResult axis)
    {
        var decision = axis.Classification switch
        {
            AxisClassification.OperatorMapped   => SalesQualificationAxisDecision.Qualified,
            AxisClassification.OperatorExcluded => SalesQualificationAxisDecision.Excluded,
            AxisClassification.OperatorDeferred => SalesQualificationAxisDecision.Deferred,
            AxisClassification.Unknown          => SalesQualificationAxisDecision.Unknown,
            AxisClassification.MissingCode      => SalesQualificationAxisDecision.MissingCode,
            _ => throw new InvalidOperationException(
                $"Unknown sales qualification axis classification: {axis.Classification}"),
        };

        return new SalesQualificationAxisEvaluation(
            ColumnName:      axis.ColumnName,
            SourceValue:     axis.SourceValue,
            CanonicalValue:  axis.CanonicalValue,
            AxisDecision:    decision);
    }

    // ── Internal types ───────────────────────────────────────────────────

    private enum AxisClassification
    {
        OperatorMapped,
        OperatorExcluded,
        OperatorDeferred,
        Unknown,
        MissingCode,
    }

    private sealed record AxisResult(
        AxisClassification Classification,
        string ColumnName,
        string? SourceValue,
        string? CanonicalValue,
        string Reason);
}
