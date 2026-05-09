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
}
