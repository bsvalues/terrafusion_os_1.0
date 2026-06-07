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
///
/// <para>SYNC-COMPLETE-2-V3: the improvement lane's <c>ImprvAttr-S1</c>
/// stage is year-sliced internally to fix ChangeTracker bloat on
/// full-corpus drains. The substages are named
/// <c>ImprvAttr-S1-Y{year}</c> and are NOT enumerated in
/// <see cref="Stages"/> because the year list is determined at runtime
/// from the seed corpus. The substages slot logically between
/// <c>ImprvDetail-S1</c> and <c>Imprv-Truth</c>, ordered ascending by
/// numeric year (NOT lexically — <c>Y1995</c> &lt; <c>Y2010</c> &lt;
/// <c>Y2026</c>). <see cref="ShouldSkip"/> recognizes the substage
/// pattern and applies chronological ordering rules; cross-comparisons
/// with named stages place the substages in the same logical position
/// as the parent <c>ImprvAttr-S1</c> entry.</para>
/// </summary>
public static class LaneStageOrder
{
    /// <summary>
    /// SYNC-COMPLETE-2-V3 substage name prefix for the year-sliced
    /// <c>ImprvAttr-S1</c> stage of the improvement lane. Substage
    /// names are <c>ImprvAttr-S1-Y{year}</c> (e.g.
    /// <c>ImprvAttr-S1-Y2026</c>).
    /// </summary>
    public const string ImprvAttrYearSubstagePrefix = "ImprvAttr-S1-Y";

    /// <summary>
    /// Parent stage name for the year-sliced substages. Used as the
    /// logical anchor when comparing a year-substage with a named
    /// stage in <see cref="ShouldSkip"/>.
    /// </summary>
    public const string ImprvAttrParentStage = "ImprvAttr-S1";

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
            //
            // SYNC-COMPLETE-2-V3 note: ImprvAttr-S1 is the static
            // parent slot in this list, but the controller runs it as
            // a dynamic sequence of ImprvAttr-S1-Y{year} substages
            // internally. The substages are NOT listed here because
            // the year list is determined at runtime from
            // legacy_pacs_raw.imprv. ShouldSkip handles substage names
            // specially via chronological year comparison.
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

            // assessment: ASSESSMENT-VALUE-SEAL — current-year
            // active-supplement property_val value → assessment truth →
            // tf_assessment canonical (parcel resolved via existing xref).
            ["assessment"] = new[]
            {
                "Assessment-S1",
                "Assessment-Truth",
                "Assessment-Canonical",
            },

            // exemption: EXEMPTION-FACT-SEAL — populate dict from exmpt_type →
            // current-year active-supplement exemption facts → tf_exemption.
            ["exemption"] = new[]
            {
                "Exemption-Dict",
                "Exemption-S1",
                "Exemption-Truth",
                "Exemption-Canonical",
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
    ///
    /// <para>SYNC-COMPLETE-2-V3: when either argument is a year-substage
    /// of the form <c>ImprvAttr-S1-Y{year}</c>, the substage is anchored
    /// at the same logical position as <c>ImprvAttr-S1</c> for
    /// cross-comparisons with named stages. Substage-vs-substage uses
    /// chronological year comparison (numeric, not lexical: Y2010 &lt;
    /// Y2026, NOT "Y10" &lt; "Y2"). The legacy monolithic LCS value
    /// <c>"ImprvAttr-S1"</c> (no year suffix) is treated as "before all
    /// year-substages" so every year runs from the start of the stage on
    /// resume.</para>
    /// </summary>
    public static bool ShouldSkip(string laneName, string stageName, string? resumeFromStage)
    {
        if (string.IsNullOrEmpty(resumeFromStage)) return false;
        if (string.IsNullOrEmpty(laneName) || string.IsNullOrEmpty(stageName)) return false;
        if (!Stages.TryGetValue(laneName, out var order)) return false;

        var stageIsSubstage = IsImprvAttrYearSubstage(stageName, out var stageYear);
        var resumeIsSubstage = IsImprvAttrYearSubstage(resumeFromStage, out var resumeYear);

        // Both year-substages → chronological year compare. The
        // substage range is "open" — Y{lower} ≤ Y{higher} → skip.
        if (stageIsSubstage && resumeIsSubstage)
        {
            return stageYear <= resumeYear;
        }

        // Resume is a named stage AND the stageName is a year-substage:
        // the substage lives at the ImprvAttr-S1 anchor index. Skip iff
        // the named resume stage is at-or-after that anchor index.
        // Special case: legacy LCS "ImprvAttr-S1" (no year) means
        // "before any year ran" → year-substages do NOT skip.
        if (stageIsSubstage)
        {
            if (string.Equals(resumeFromStage, ImprvAttrParentStage, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
            var anchorIdx = IndexOf(order, ImprvAttrParentStage);
            var resumeIdx = IndexOf(order, resumeFromStage);
            if (anchorIdx < 0 || resumeIdx < 0) return false;
            return anchorIdx <= resumeIdx;
        }

        // stageName is a named stage AND resume is a year-substage:
        // any named stage at-or-before the ImprvAttr-S1 anchor index
        // is "already done"; named stages AFTER the anchor are NOT
        // skipped (they haven't run yet — Imprv-Truth hasn't fired).
        if (resumeIsSubstage)
        {
            var anchorIdx = IndexOf(order, ImprvAttrParentStage);
            var stageIdx = IndexOf(order, stageName);
            if (anchorIdx < 0 || stageIdx < 0) return false;
            return stageIdx < anchorIdx;
        }

        // Both are named stages → original position-based skip math.
        var sIdx = IndexOf(order, stageName);
        var rIdx = IndexOf(order, resumeFromStage);
        if (sIdx < 0 || rIdx < 0) return false;
        return sIdx <= rIdx;
    }

    /// <summary>
    /// Parses a stage name as an <c>ImprvAttr-S1-Y{year}</c> substage.
    /// Returns true when the name matches the prefix and the suffix
    /// parses as a valid integer year; the parsed year is returned via
    /// <paramref name="year"/>. Case-insensitive on the prefix.
    /// </summary>
    public static bool IsImprvAttrYearSubstage(string? stageName, out int year)
    {
        year = 0;
        if (string.IsNullOrEmpty(stageName)) return false;
        if (!stageName.StartsWith(ImprvAttrYearSubstagePrefix, StringComparison.OrdinalIgnoreCase))
            return false;
        var suffix = stageName.Substring(ImprvAttrYearSubstagePrefix.Length);
        return int.TryParse(suffix, System.Globalization.NumberStyles.Integer,
            System.Globalization.CultureInfo.InvariantCulture, out year);
    }

    /// <summary>
    /// Build a year-substage name from a numeric year. Inverse of
    /// <see cref="IsImprvAttrYearSubstage"/>.
    /// </summary>
    public static string FormatImprvAttrYearSubstage(int year)
        => ImprvAttrYearSubstagePrefix + year.ToString(System.Globalization.CultureInfo.InvariantCulture);

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
