using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: per-lane reconciliation policy registry.
///
/// <para>Each lane has a policy expressed as
/// <c>(ExpectedBasis, TolerancePct)</c>:</para>
/// <list type="bullet">
///   <item><c>RAW_SOURCE</c> — match the raw PACS row count exactly
///   (no current lanes; reserved for future raw-row reconciliations).</item>
///   <item><c>DOCTRINE_FILTERED</c> — match PACS rows after doctrine
///   filter. Parcel: <c>prop_type_cd='R'</c> joined to
///   <c>property_val</c> at the working year (a historical R-typed
///   prop_id without a working-year <c>property_val</c> row is not a
///   parcel-spine candidate). Land: <c>land_detail</c> joined to
///   <c>property</c> and <c>property_val</c> with the same R-typed +
///   working-year filter and <c>sup_num=0</c>. Improvement, sales,
///   and wsdor also doctrine-filtered.</item>
///   <item><c>DEDUPED_CANONICAL</c> — canonical de-duped against
///   PACS source (owner).</item>
///   <item><c>EXTERNAL_FEATURE_COUNT</c> — match an external feature
///   service (geometry → ArcGIS).</item>
/// </list>
///
/// <para>Tolerances LOCKED per the SYNC-COMPLETE-2 spec.</para>
///
/// <para>SYNC-COMPLETE-2-RECONCILIATION-POLICY-FIX (2026-05-11):
/// parcel + land moved from <c>RAW_SOURCE</c> to
/// <c>DOCTRINE_FILTERED</c>. The pre-fix parcel basis (owner-anchored
/// at <c>owner_tax_yr&gt;=2018</c>) over-counted by ~13.9% against
/// <c>tf_parcel</c> because the truth promoter correctly filters out
/// R-typed prop_ids that have no working-year <c>property_val</c>
/// row. Real-world drain: PACS R-typed=96,750 vs canonical=83,326,
/// doctrine-filtered=83,326 (delta=0). Land follows the same shape:
/// the drain only lands <c>sup_num=0</c> land segments tied to
/// working-year R-typed parcels in the spine, so the baseline must
/// mirror that doctrine instead of counting every
/// <c>land_detail</c> row at <c>prop_val_yr=@yr</c>.</para>
/// </summary>
public static class CorpusReconciliationPolicy
{
    public const string ExpectedBasisRawSource = "RAW_SOURCE";
    public const string ExpectedBasisDoctrineFiltered = "DOCTRINE_FILTERED";
    public const string ExpectedBasisDedupedCanonical = "DEDUPED_CANONICAL";
    public const string ExpectedBasisExternalFeatureCount = "EXTERNAL_FEATURE_COUNT";

    public const string ReconciliationStatusMatch = "Match";
    public const string ReconciliationStatusAcceptableDelta = "AcceptableDelta";
    public const string ReconciliationStatusInvestigate = "Investigate";

    public const string LaneParcel = "parcel";
    public const string LaneOwnerWsdor = "owner-wsdor";
    public const string LaneImprovement = "improvement";
    public const string LaneLand = "land";
    public const string LaneSales = "sales";
    public const string LaneGeometry = "geometry";

    /// <summary>Canonical lane order for the orchestrator.</summary>
    public static readonly IReadOnlyList<string> LaneOrder = new[]
    {
        LaneParcel,
        LaneOwnerWsdor,
        LaneImprovement,
        LaneLand,
        LaneSales,
        LaneGeometry,
    };

    public static IReadOnlyDictionary<string, LanePolicy> Policies { get; } =
        new Dictionary<string, LanePolicy>(StringComparer.OrdinalIgnoreCase)
        {
            [LaneParcel] = new(ExpectedBasisDoctrineFiltered, 0.00m),
            [LaneOwnerWsdor] = new(ExpectedBasisDedupedCanonical, 2.00m),
            [LaneImprovement] = new(ExpectedBasisDoctrineFiltered, 1.00m),
            [LaneLand] = new(ExpectedBasisDoctrineFiltered, 0.10m),
            [LaneSales] = new(ExpectedBasisDoctrineFiltered, 0.50m),
            [LaneGeometry] = new(ExpectedBasisExternalFeatureCount, 0.00m),
        };

    /// <summary>
    /// Classify a reconciliation result based on
    /// <see cref="LanePolicy.TolerancePct"/>:
    /// <list type="bullet">
    ///   <item>Delta == 0 → Match</item>
    ///   <item>0 &lt; |DeltaPct| &lt;= TolerancePct → AcceptableDelta</item>
    ///   <item>|DeltaPct| &gt; TolerancePct → Investigate</item>
    /// </list>
    /// </summary>
    public static string Classify(long delta, decimal deltaPct, decimal tolerancePct)
    {
        if (delta == 0)
            return ReconciliationStatusMatch;
        var abs = deltaPct < 0 ? -deltaPct : deltaPct;
        return abs <= tolerancePct
            ? ReconciliationStatusAcceptableDelta
            : ReconciliationStatusInvestigate;
    }

    /// <summary>Compute deltaPct, clamping the denominator at 1 to avoid divide-by-zero.</summary>
    public static decimal ComputeDeltaPct(long pacsSourceCount, long delta)
    {
        var denom = pacsSourceCount <= 0 ? 1L : pacsSourceCount;
        var abs = delta < 0 ? -delta : delta;
        return (decimal)abs / denom * 100m;
    }

    public sealed record LanePolicy(string ExpectedBasis, decimal TolerancePct);
}
