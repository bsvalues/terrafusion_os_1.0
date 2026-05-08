using FluentAssertions;
using TerraFusion.Core.Sync.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2 unit tests for the locked policy table and the
/// classification function.
/// </summary>
public sealed class CorpusReconciliationPolicyTests
{
    [Theory]
    [InlineData("parcel", "RAW_SOURCE", 0.00)]
    [InlineData("owner-wsdor", "DEDUPED_CANONICAL", 2.00)]
    [InlineData("improvement", "DOCTRINE_FILTERED", 1.00)]
    [InlineData("land", "RAW_SOURCE", 0.10)]
    [InlineData("sales", "DOCTRINE_FILTERED", 0.50)]
    [InlineData("geometry", "EXTERNAL_FEATURE_COUNT", 0.00)]
    public void Policy_table_is_locked_per_spec(string lane, string basis, double tolerance)
    {
        var policy = CorpusReconciliationPolicy.Policies[lane];
        policy.ExpectedBasis.Should().Be(basis);
        policy.TolerancePct.Should().Be((decimal)tolerance);
    }

    [Fact]
    public void Lane_order_is_canonical_six()
    {
        CorpusReconciliationPolicy.LaneOrder.Should().Equal(
            "parcel", "owner-wsdor", "improvement", "land", "sales", "geometry");
    }

    [Fact]
    public void Classify_returns_Match_when_delta_is_zero()
    {
        var result = CorpusReconciliationPolicy.Classify(0, 0m, 1.0m);
        result.Should().Be(CorpusReconciliationPolicy.ReconciliationStatusMatch);
    }

    [Fact]
    public void Classify_returns_AcceptableDelta_within_tolerance()
    {
        // |deltaPct| = 0.5 ≤ tolerance 1.0
        var result = CorpusReconciliationPolicy.Classify(5, 0.5m, 1.0m);
        result.Should().Be(CorpusReconciliationPolicy.ReconciliationStatusAcceptableDelta);
    }

    [Fact]
    public void Classify_returns_Investigate_above_tolerance()
    {
        // |deltaPct| = 1.5 > tolerance 1.0
        var result = CorpusReconciliationPolicy.Classify(15, 1.5m, 1.0m);
        result.Should().Be(CorpusReconciliationPolicy.ReconciliationStatusInvestigate);
    }

    [Fact]
    public void Classify_handles_negative_delta_pct()
    {
        // Tf < Pacs → negative delta. Absolute value still classifies cleanly.
        var result = CorpusReconciliationPolicy.Classify(-5, -0.3m, 1.0m);
        result.Should().Be(CorpusReconciliationPolicy.ReconciliationStatusAcceptableDelta);
    }

    [Fact]
    public void ComputeDeltaPct_clamps_denominator_at_one_when_pacs_is_zero()
    {
        // Avoids divide-by-zero.
        var result = CorpusReconciliationPolicy.ComputeDeltaPct(0, 5);
        result.Should().Be(500m);
    }

    [Fact]
    public void ComputeDeltaPct_handles_negative_delta_as_absolute()
    {
        var result = CorpusReconciliationPolicy.ComputeDeltaPct(100, -5);
        result.Should().Be(5m);
    }
}
