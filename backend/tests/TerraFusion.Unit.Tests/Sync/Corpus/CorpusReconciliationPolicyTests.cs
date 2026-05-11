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
    // SYNC-COMPLETE-2-RECONCILIATION-POLICY-FIX (2026-05-11):
    // parcel + land moved RAW_SOURCE → DOCTRINE_FILTERED. The pre-fix
    // parcel basis (owner-anchored at owner_tax_yr>=2018) over-counted
    // by ~13.9% against tf_parcel; doctrine-filtered (R-typed AND
    // working-year property_val exists) reconciles to delta=0. Land
    // follows the same shape.
    [Theory]
    [InlineData("parcel", "DOCTRINE_FILTERED", 0.00)]
    [InlineData("owner-wsdor", "DEDUPED_CANONICAL", 2.00)]
    [InlineData("improvement", "DOCTRINE_FILTERED", 1.00)]
    [InlineData("land", "DOCTRINE_FILTERED", 0.10)]
    [InlineData("sales", "DOCTRINE_FILTERED", 0.50)]
    [InlineData("geometry", "EXTERNAL_FEATURE_COUNT", 0.00)]
    public void Policy_table_is_locked_per_spec(string lane, string basis, double tolerance)
    {
        var policy = CorpusReconciliationPolicy.Policies[lane];
        policy.ExpectedBasis.Should().Be(basis);
        policy.TolerancePct.Should().Be((decimal)tolerance);
    }

    [Fact]
    public void Parcel_lane_uses_DOCTRINE_FILTERED_basis()
    {
        // Locked: parcel reconciles against PACS R-typed parcels with
        // a working-year property_val row, not the raw R-typed count.
        var policy = CorpusReconciliationPolicy.Policies[CorpusReconciliationPolicy.LaneParcel];
        policy.ExpectedBasis.Should().Be(CorpusReconciliationPolicy.ExpectedBasisDoctrineFiltered);
        policy.TolerancePct.Should().Be(0.00m);
    }

    [Fact]
    public void Land_lane_uses_DOCTRINE_FILTERED_basis()
    {
        // Locked: land reconciles against PACS land_detail rows tied
        // to R-typed spine parcels at sup_num=0 for the working year.
        var policy = CorpusReconciliationPolicy.Policies[CorpusReconciliationPolicy.LaneLand];
        policy.ExpectedBasis.Should().Be(CorpusReconciliationPolicy.ExpectedBasisDoctrineFiltered);
        policy.TolerancePct.Should().Be(0.10m);
    }

    [Fact]
    public void Parcel_reconciliation_returns_Match_when_canonical_equals_doctrine_filtered_baseline()
    {
        // Fixture: real-world drain at working year 2026.
        // Doctrine-filtered baseline = canonical count = 83,326.
        // Pre-fix RAW_SOURCE basis would have been 96,750 → delta = -13,424
        // → reported "Investigate" falsely. This test pins the corrected
        // behavior: canonical == doctrine-filtered baseline → Match.
        const long doctrineFilteredBaseline = 83_326L;
        const long canonicalCount = 83_326L;
        var delta = canonicalCount - doctrineFilteredBaseline;
        var deltaPct = CorpusReconciliationPolicy.ComputeDeltaPct(doctrineFilteredBaseline, delta);
        var parcelTolerance = CorpusReconciliationPolicy
            .Policies[CorpusReconciliationPolicy.LaneParcel].TolerancePct;

        var status = CorpusReconciliationPolicy.Classify(delta, deltaPct, parcelTolerance);

        status.Should().Be(CorpusReconciliationPolicy.ReconciliationStatusMatch);
        delta.Should().Be(0);
        deltaPct.Should().Be(0m);
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
