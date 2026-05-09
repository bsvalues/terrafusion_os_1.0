using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2-V2: canonical stage-name vocabulary per lane.
///
/// <para>The strings here MUST match the literal stage names used in
/// the corresponding <c>DoctrineDrainController</c> lane methods —
/// these are the same identifiers passed to <c>FailLaneAsync</c> as
/// <c>failedStage</c> and persisted to
/// <c>FullCorpusLaneResult.LastCompletedStage</c>. Drift between this
/// dictionary and the controller will silently break stage-skip
/// resume; both sides reference the same constants here so a typo on
/// either side is caught at compile time.</para>
///
/// <para><see cref="ShouldSkip"/> is the central skip predicate: when
/// the orchestrator passes <c>resumeFromStage = "Owner-Truth"</c> to
/// the owner-wsdor lane, every stage <i>at or before</i>
/// <c>"Owner-Truth"</c> in the lane's order is skipped. The stage
/// after <c>"Owner-Truth"</c> runs first.</para>
///
/// <para>Unknown lanes / unknown stage names → no skip (fail-safe).
/// A typo in <c>ResumeFromStage</c> means we re-run the lane from
/// the start, which is equivalent to today's behavior.</para>
/// </summary>
public static class LaneStageOrder
{
    /// <summary>
    /// Per-lane ordered list of stage names. Ordering matters: skip
    /// is "stage index ≤ resume index" so stages that have already
    /// completed (according to the persisted checkpoint) are not
    /// re-executed.
    /// </summary>
    public static IReadOnlyDictionary<string, IReadOnlyList<string>> Stages { get; } =
        new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
        {
            // parcel: owner-anchored seed → keyed parcel landing →
            // parcel-spine truth → tf_parcel canonical.
            ["parcel"] = new[]
            {
                "Owner-Seed-S1",
                "Parcel-S1",
                "Parcel-Spine",
                "Parcel-Canonical",
            },

            // owner-wsdor: owner S1 + account/supp/parcel xref chain,
            // then owner truth + canonical, then WPOV → WSDOR.
            ["owner-wsdor"] = new[]
            {
                "Owner-S1",
                "Account-S1",
                "Supp-S1",
                "Parcel-S1",
                "Parcel-Spine",
                "Parcel-Canonical",
                "Owner-Truth",
                "Owner-Canonical",
                "WPOV-S1",
                "WPOV-Truth",
                "WSDOR-Canonical",
            },

            // improvement: owner-anchored seed → parcel chain → supp +
            // (non-blocking) propertyVal + landDetail → imprv landings
            // → imprv truth → imprv canonical.
            ["improvement"] = new[]
            {
                "Owner-Seed-S1",
                "Parcel-S1",
                "Parcel-Spine",
                "Parcel-Canonical",
                "Supp-S1",
                "PropertyVal-S1",
                "LandDetail-S1",
                "Imprv-S1",
                "ImprvDetail-S1",
                "ImprvAttr-S1",
                "Imprv-Truth",
                "Imprv-Canonical",
            },

            // land: owner-anchored seed → parcel chain → supp →
            // land_detail S1 → land truth → tf_land canonical.
            ["land"] = new[]
            {
                "Owner-Seed-S1",
                "Parcel-S1",
                "Parcel-Spine",
                "Parcel-Canonical",
                "Supp-S1",
                "Land-S1",
                "Land-Truth",
                "Land-Canonical",
            },

            // sales: independent sale seed → keyed supp → sale truth
            // → targeted parcel chain → tf_sale canonical.
            ["sales"] = new[]
            {
                "Sale-S1",
                "Sale-Supp-S1",
                "Sale-Truth",
                "Sale-Parcel-S1",
                "Sale-Parcel-Spine",
                "Sale-Parcel-Canonical",
                "Sale-Canonical",
            },

            // geometry: ArcGIS REST D1 → D2 truth → D3 canonical.
            ["geometry"] = new[]
            {
                "ArcGis-D1",
                "ArcGis-D2",
                "ArcGis-D3",
            },
        };

    /// <summary>
    /// Predicate: should the lane endpoint skip <paramref name="stageName"/>
    /// when resuming from <paramref name="resumeFromStage"/>?
    /// <list type="bullet">
    ///   <item>If <paramref name="resumeFromStage"/> is null/empty → no skip
    ///   (full lane execution as today).</item>
    ///   <item>If <paramref name="laneName"/> is unknown → no skip (defensive).</item>
    ///   <item>If either stage name is not in the lane's order → no skip
    ///   (prevents a typo in a checkpoint from silently dropping work).</item>
    ///   <item>Otherwise: skip iff <c>stageIndex ≤ resumeIndex</c> (stages
    ///   at or before the last-completed checkpoint are already done).</item>
    /// </list>
    /// </summary>
    public static bool ShouldSkip(string laneName, string stageName, string? resumeFromStage)
    {
        if (string.IsNullOrEmpty(resumeFromStage)) return false;
        if (string.IsNullOrEmpty(laneName) || string.IsNullOrEmpty(stageName)) return false;
        if (!Stages.TryGetValue(laneName, out var order)) return false;

        var stageIdx = IndexOf(order, stageName);
        var resumeIdx = IndexOf(order, resumeFromStage);
        if (stageIdx < 0 || resumeIdx < 0) return false;
        return stageIdx <= resumeIdx;
    }

    private static int IndexOf(IReadOnlyList<string> list, string value)
    {
        for (var i = 0; i < list.Count; i++)
        {
            if (string.Equals(list[i], value, StringComparison.OrdinalIgnoreCase))
                return i;
        }
        return -1;
    }
}
