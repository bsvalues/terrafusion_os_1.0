using FluentAssertions;
using TerraFusion.Core.Sync.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2-V2 unit tests for the
/// <see cref="LaneStageOrder.ShouldSkip"/> predicate.
/// </summary>
public sealed class LaneStageOrderTests
{
    [Fact]
    public void Stages_dictionary_contains_all_six_canonical_lanes()
    {
        // Sanity: the six lanes the orchestrator iterates must each
        // have a stage list, otherwise stage-resume silently no-ops on
        // a real lane.
        foreach (var lane in CorpusReconciliationPolicy.LaneOrder)
        {
            LaneStageOrder.Stages.Should().ContainKey(lane,
                $"every lane in CorpusReconciliationPolicy.LaneOrder needs a stage list");
            LaneStageOrder.Stages[lane].Should().NotBeEmpty();
        }
    }

    [Fact]
    public void ShouldSkip_returns_true_for_stages_at_or_before_resume_point()
    {
        // owner-wsdor: Owner-S1 (idx 0) ≤ Owner-Truth (idx 6) → skip.
        LaneStageOrder.ShouldSkip("owner-wsdor", "Owner-S1", "Owner-Truth").Should().BeTrue();
        LaneStageOrder.ShouldSkip("owner-wsdor", "Owner-Truth", "Owner-Truth").Should().BeTrue();
    }

    [Fact]
    public void ShouldSkip_returns_false_for_stages_after_resume_point()
    {
        // owner-wsdor: Owner-Canonical (idx 7) > Owner-Truth (idx 6) → no skip.
        LaneStageOrder.ShouldSkip("owner-wsdor", "Owner-Canonical", "Owner-Truth").Should().BeFalse();
        LaneStageOrder.ShouldSkip("owner-wsdor", "WSDOR-Canonical", "Owner-Truth").Should().BeFalse();
    }

    [Fact]
    public void ShouldSkip_returns_false_when_resumeFromStage_is_null()
    {
        // No resume hint → run every stage.
        LaneStageOrder.ShouldSkip("parcel", "Parcel-S1", null).Should().BeFalse();
        LaneStageOrder.ShouldSkip("parcel", "Parcel-S1", "").Should().BeFalse();
    }

    [Fact]
    public void ShouldSkip_returns_false_for_unknown_lane()
    {
        // Defensive: typo or stale config → no skip.
        LaneStageOrder.ShouldSkip("not-a-lane", "Owner-S1", "Owner-Truth").Should().BeFalse();
    }

    [Fact]
    public void ShouldSkip_returns_false_when_stage_name_not_in_lanes_order()
    {
        // Typo in stage name → no skip (fail-safe; we'd rather re-run a
        // stage than silently drop work).
        LaneStageOrder.ShouldSkip("parcel", "Bogus-Stage", "Parcel-Spine").Should().BeFalse();
        LaneStageOrder.ShouldSkip("parcel", "Parcel-S1", "Bogus-Stage").Should().BeFalse();
    }

    [Fact]
    public void ShouldSkip_is_case_insensitive_for_lane_and_stage_names()
    {
        // Real-world: orchestrator reads from DB, may lower-case.
        LaneStageOrder.ShouldSkip("OWNER-WSDOR", "owner-s1", "OWNER-TRUTH").Should().BeTrue();
        LaneStageOrder.ShouldSkip("Owner-Wsdor", "Owner-S1", "Owner-Truth").Should().BeTrue();
    }

    [Fact]
    public void ShouldSkip_handles_empty_lane_or_stage_strings()
    {
        LaneStageOrder.ShouldSkip("", "Owner-S1", "Owner-Truth").Should().BeFalse();
        LaneStageOrder.ShouldSkip("owner-wsdor", "", "Owner-Truth").Should().BeFalse();
    }

    [Fact]
    public void Improvement_lane_order_contains_PropertyVal_S1_and_LandDetail_S1_non_blocking_stages()
    {
        // Regression: SYNC-DOCTRINE-4-IMPL-V4 added these as
        // non-blocking landings. They must still be in the stage order
        // so a checkpoint at Imprv-S1 correctly skips them.
        LaneStageOrder.Stages["improvement"].Should()
            .Contain("PropertyVal-S1").And.Contain("LandDetail-S1");
    }

    [Fact]
    public void Sales_lane_order_includes_targeted_parcel_chain_stages()
    {
        // Regression: sales runs its own parcel chain after Sale-Truth.
        var sales = LaneStageOrder.Stages["sales"];
        sales.Should().Contain("Sale-Parcel-S1")
            .And.Contain("Sale-Parcel-Spine")
            .And.Contain("Sale-Parcel-Canonical")
            .And.Contain("Sale-Canonical");
    }

    // ════════════════════════════════════════════════════════════════════
    // SYNC-COMPLETE-2-V3 — ImprvAttr-S1 year-sliced substages.
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public void ImprvAttr_year_substage_ordering_is_chronological_not_lexical()
    {
        // The substages must compare numerically by year, NOT as strings.
        // String compare would put "Y2026" before "Y2010" (because '0' < '2'
        // after the third digit — actually they tie until the fourth char,
        // making lexical equivalent here). The dangerous case is mixed
        // widths: "Y10" lex-sorts BEFORE "Y2" because '1' < '2', which
        // would skip 2-digit years incorrectly when comparing against 4-digit.
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y1995", "ImprvAttr-S1-Y2010")
            .Should().BeTrue("1995 < 2010 chronologically → skip");
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2010", "ImprvAttr-S1-Y2026")
            .Should().BeTrue("2010 < 2026 chronologically → skip");
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2026", "ImprvAttr-S1-Y1995")
            .Should().BeFalse("2026 > 1995 chronologically → do not skip");
    }

    [Fact]
    public void ShouldSkip_returns_true_for_year_substages_at_or_before_resume_year()
    {
        // Resume from Y2025 → every year ≤ 2025 should skip.
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2020", "ImprvAttr-S1-Y2025")
            .Should().BeTrue();
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2025", "ImprvAttr-S1-Y2025")
            .Should().BeTrue("equal year is at-or-before resume → skip");
    }

    [Fact]
    public void ShouldSkip_returns_false_for_year_substages_after_resume_year()
    {
        // Resume from Y2025 → year 2026 has NOT run yet → don't skip.
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2026", "ImprvAttr-S1-Y2025")
            .Should().BeFalse();
    }

    [Fact]
    public void Year_substring_sort_does_not_false_skip_smaller_year_with_more_digits()
    {
        // The "Y10 vs Y2" hazard: with lexical sort, "Y10" < "Y2"
        // because '1' < '2'. With numeric sort, 10 > 2. Make sure
        // we use numeric comparison.
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y10", "ImprvAttr-S1-Y2")
            .Should().BeFalse("year 10 > year 2 numerically → do not skip");
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2", "ImprvAttr-S1-Y10")
            .Should().BeTrue("year 2 < year 10 numerically → skip");
    }

    [Fact]
    public void Named_stage_after_ImprvAttr_S1_is_not_skipped_when_resume_is_a_year_substage()
    {
        // Resume from a year-substage means we're mid-ImprvAttr-S1, so
        // Imprv-Truth (which comes AFTER ImprvAttr-S1) has NOT run yet
        // and must not be skipped. This is the safety property that
        // prevents accidentally jumping over Imprv-Truth when resuming
        // from a mid-substage checkpoint.
        LaneStageOrder.ShouldSkip("improvement", "Imprv-Truth", "ImprvAttr-S1-Y2026")
            .Should().BeFalse();
        LaneStageOrder.ShouldSkip("improvement", "Imprv-Canonical", "ImprvAttr-S1-Y2026")
            .Should().BeFalse();
    }

    [Fact]
    public void Named_stage_before_ImprvAttr_S1_is_skipped_when_resume_is_a_year_substage()
    {
        // Anything at-or-before ImprvDetail-S1 has definitely completed
        // by the time we're inside any year-substage.
        LaneStageOrder.ShouldSkip("improvement", "ImprvDetail-S1", "ImprvAttr-S1-Y2020")
            .Should().BeTrue();
        LaneStageOrder.ShouldSkip("improvement", "Imprv-S1", "ImprvAttr-S1-Y2020")
            .Should().BeTrue();
        LaneStageOrder.ShouldSkip("improvement", "Owner-Seed-S1", "ImprvAttr-S1-Y2020")
            .Should().BeTrue();
    }

    [Fact]
    public void Legacy_monolithic_ImprvAttr_S1_LCS_does_not_skip_year_substages()
    {
        // Old runs (pre-V3) persisted LCS="ImprvAttr-S1" only on full
        // success of the monolithic stage. On a re-run with a V3-aware
        // controller, that legacy value should mean "ImprvAttr-S1 fully
        // complete" → SKIP every year-substage (we're past the entire
        // stage). The parent stage itself is also skipped.
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1", "ImprvAttr-S1")
            .Should().BeTrue("parent stage equal to LCS → skip");

        // Mid-stage resume from the legacy bare name is impossible to
        // produce post-V3 (V3 only writes year-substage names mid-flight,
        // and writes "ImprvAttr-S1" only on full success). But if it
        // were ever set, year-substages would NOT skip — meaning we'd
        // safely re-run all years. Per spec: "If the resumed LCS is
        // ImprvAttr-S1 (legacy monolithic, from old runs) or empty,
        // run all years from start of ImprvAttr-S1."
        //
        // BUT — note that in practice, with LCS="ImprvAttr-S1", the
        // parent stage itself is skipped by the position-based check
        // above, so the year loop never runs anyway. The semantics here
        // protect against any future path that tries to run substages
        // with this LCS: each substage is treated as "after" the legacy
        // LCS → no skip → re-runs. This is the spec-mandated safe
        // re-run behavior.
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2020", "ImprvAttr-S1")
            .Should().BeFalse("legacy LCS → year-substages do not skip (spec)");
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2026", "ImprvAttr-S1")
            .Should().BeFalse();
    }

    [Fact]
    public void Empty_LCS_does_not_skip_any_year_substage()
    {
        // Empty / null LCS → fresh run, every year-substage executes.
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2020", null)
            .Should().BeFalse();
        LaneStageOrder.ShouldSkip("improvement", "ImprvAttr-S1-Y2020", "")
            .Should().BeFalse();
    }

    [Fact]
    public void IsImprvAttrYearSubstage_parses_well_formed_names_and_rejects_others()
    {
        // Positive cases.
        LaneStageOrder.IsImprvAttrYearSubstage("ImprvAttr-S1-Y2026", out var y1).Should().BeTrue();
        y1.Should().Be(2026);
        LaneStageOrder.IsImprvAttrYearSubstage("ImprvAttr-S1-Y1995", out var y2).Should().BeTrue();
        y2.Should().Be(1995);
        LaneStageOrder.IsImprvAttrYearSubstage("imprvattr-s1-y2026", out var y3).Should().BeTrue("case-insensitive on prefix");
        y3.Should().Be(2026);

        // Negative cases.
        LaneStageOrder.IsImprvAttrYearSubstage("ImprvAttr-S1", out _).Should().BeFalse("bare parent — no suffix");
        LaneStageOrder.IsImprvAttrYearSubstage("ImprvAttr-S1-Y", out _).Should().BeFalse("empty year suffix");
        LaneStageOrder.IsImprvAttrYearSubstage("ImprvAttr-S1-YABC", out _).Should().BeFalse("non-numeric suffix");
        LaneStageOrder.IsImprvAttrYearSubstage("Imprv-Truth", out _).Should().BeFalse("unrelated stage");
        LaneStageOrder.IsImprvAttrYearSubstage(null, out _).Should().BeFalse();
        LaneStageOrder.IsImprvAttrYearSubstage("", out _).Should().BeFalse();
    }

    [Fact]
    public void FormatImprvAttrYearSubstage_is_inverse_of_parser()
    {
        // Round-trip property: format then parse recovers the same year.
        foreach (var year in new[] { 1985, 2010, 2017, 2026, 1 })
        {
            var name = LaneStageOrder.FormatImprvAttrYearSubstage(year);
            LaneStageOrder.IsImprvAttrYearSubstage(name, out var parsed).Should().BeTrue();
            parsed.Should().Be(year);
        }
    }

    [Fact]
    public void ImprvAttr_S1_static_slot_is_preserved_after_V3_for_position_mapping()
    {
        // Critical contract: the static Stages["improvement"] list must
        // retain ImprvAttr-S1 (the legacy/parent name) in its original
        // position so position-indexed BatchIdsJson recovery for stages
        // AFTER ImprvAttr-S1 (Imprv-Truth, Imprv-Canonical) continues
        // to work unchanged. Year-substages are dynamic and live OUTSIDE
        // this static list; they appear only via ShouldSkip pattern
        // recognition.
        var imp = LaneStageOrder.Stages["improvement"];
        imp.Should().Contain("ImprvAttr-S1");
        imp.Should().Contain("ImprvDetail-S1");
        imp.Should().Contain("Imprv-Truth");

        // Ordering invariant: ImprvDetail-S1 < ImprvAttr-S1 < Imprv-Truth.
        var idxDetail = -1; var idxAttr = -1; var idxTruth = -1;
        for (var i = 0; i < imp.Count; i++)
        {
            if (imp[i] == "ImprvDetail-S1") idxDetail = i;
            if (imp[i] == "ImprvAttr-S1") idxAttr = i;
            if (imp[i] == "Imprv-Truth") idxTruth = i;
        }
        idxDetail.Should().BeGreaterOrEqualTo(0);
        idxAttr.Should().BeGreaterThan(idxDetail);
        idxTruth.Should().BeGreaterThan(idxAttr);
    }
}
