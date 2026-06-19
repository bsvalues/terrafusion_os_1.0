using FluentAssertions;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Doctrine;

/// <summary>
/// WO-DATA-004B-SCALE-001Y: verifies that NormalizeRequest defaults to
/// FullCorpus=false (bounded) when no request body is provided.
/// Root cause: prior default was ?? true, which caused null-body calls to
/// silently trigger full-corpus imports. See PACS_SYNC_SCALE_001Y_SAFE_DEFAULT_PATCH.md.
/// DoctrineDrainRequest is nested inside DoctrineDrainController.
/// NormalizeRequest is internal (InternalsVisibleTo grants access to this test assembly).
/// </summary>
public sealed class DoctrineDrainNormalizeRequestTests
{
    [Fact]
    public void NullBody_defaults_to_FullCorpus_false_and_TopN_null()
    {
        var (_, _, fullCorpus, topN) = DoctrineDrainController.NormalizeRequest(null, "parcel");

        fullCorpus.Should().BeFalse("a missing request body must not trigger a full-corpus import");
        topN.Should().BeNull("TopN comes from the body; null body means no TopN override");
    }

    [Fact]
    public void Body_with_FullCorpus_false_and_TopN_500_passes_through_bounded()
    {
        var request = new DoctrineDrainController.DoctrineDrainRequest(
            OperatorName: "scale-001a",
            WorkingYear: 2026,
            FullCorpus: false,
            TopN: 500);

        var (_, _, fullCorpus, topN) = DoctrineDrainController.NormalizeRequest(request, "parcel");

        fullCorpus.Should().BeFalse();
        topN.Should().Be(500);
    }

    [Fact]
    public void Body_with_FullCorpus_true_is_still_explicit_full_corpus()
    {
        var request = new DoctrineDrainController.DoctrineDrainRequest(
            OperatorName: "full-run",
            WorkingYear: 2026,
            FullCorpus: true,
            TopN: null);

        var (_, _, fullCorpus, topN) = DoctrineDrainController.NormalizeRequest(request, "parcel");

        fullCorpus.Should().BeTrue("explicit FullCorpus=true must still trigger full corpus");
        topN.Should().BeNull();
    }

    [Fact]
    public void NullBody_operator_name_defaults_to_lane_scoped_name()
    {
        var (operatorName, _, _, _) = DoctrineDrainController.NormalizeRequest(null, "owner-wsdor");

        operatorName.Should().Be("doctrine-drain-owner-wsdor");
    }

    [Fact]
    public void NullBody_working_year_defaults_to_2026()
    {
        var (_, workingYear, _, _) = DoctrineDrainController.NormalizeRequest(null, "parcel");

        workingYear.Should().Be((short)2026);
    }
}
