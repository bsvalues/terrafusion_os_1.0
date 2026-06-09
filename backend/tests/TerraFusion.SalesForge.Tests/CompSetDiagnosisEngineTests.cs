using FluentAssertions;
using TerraFusion.Core.Services.TerraForge;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// Deterministic rule-engine tests for TERRAFORGE-COMPS-COMPARABLE-DIAGNOSIS-MVP.
/// The engine is pure (no DB, no clock) so every rule is exercised with fixed inputs.
/// </summary>
public class CompSetDiagnosisEngineTests
{
    private static readonly DateTime AsOf = new(2026, 6, 9, 0, 0, 0, DateTimeKind.Utc);

    private static DiagnosisSubject Subject(
        bool found = true,
        decimal? gla = 2000m,
        decimal? lot = 8000m,
        string? hood = "NBHD-01",
        string? quality = "AVERAGE",
        string? condition = "AVERAGE") =>
        new("SUBJECT-1", found, gla, lot, hood, quality, condition);

    private static DiagnosisCandidate Candidate(
        string parcelId = "C-1",
        decimal salePrice = 400_000m,
        DateTime? saleDate = null,
        decimal? ppsf = 200m,
        string qualification = "qualified",
        int rank = 1,
        bool enriched = true,
        decimal? gla = 2000m,
        decimal? lot = 8000m,
        string? hood = "NBHD-01",
        string? quality = "AVERAGE",
        string? condition = "AVERAGE") =>
        new(Guid.NewGuid(), parcelId, salePrice, saleDate ?? new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            ppsf, qualification, rank, enriched, gla, lot, hood, quality, condition);

    private static CandidateDiagnosis One(DiagnosisSubject subject, DiagnosisCandidate candidate) =>
        CompSetDiagnosisEngine.Diagnose(subject, new[] { candidate }, AsOf).Single();

    [Fact]
    public void CleanCandidate_MatchingSubject_IsStrong_NoFlags()
    {
        var d = One(Subject(), Candidate());
        d.QualificationStatus.Should().Be("strong");
        d.ReviewRequired.Should().BeFalse();
        d.Flags.Should().BeEmpty();
    }

    [Fact]
    public void UnverifiedSale_FlagsValidityUnknown_AndUsable()
    {
        var d = One(Subject(), Candidate(qualification: "unverified"));
        d.Flags.Should().Contain("sale_validity_unknown");
        d.QualificationStatus.Should().Be("usable");
        d.ReviewRequired.Should().BeTrue();
        d.Flags.Should().Contain("requires_reviewer_attention");
    }

    [Fact]
    public void OldSale_FlagsStale()
    {
        var d = One(Subject(), Candidate(saleDate: new DateTime(2018, 1, 1, 0, 0, 0, DateTimeKind.Utc)));
        d.Flags.Should().Contain("stale_sale");
    }

    [Fact]
    public void RecentSale_WithinWindow_NotStale()
    {
        var d = One(Subject(), Candidate(saleDate: new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)));
        d.Flags.Should().NotContain("stale_sale");
    }

    [Fact]
    public void MissingCandidateEnrichment_IsNeedsReview()
    {
        var d = One(Subject(), Candidate(enriched: false, gla: null));
        d.Flags.Should().Contain("missing_candidate_data");
        d.QualificationStatus.Should().Be("needs_review");
        d.ReviewRequired.Should().BeTrue();
    }

    [Fact]
    public void MissingSubject_FlagsMissingSubjectData_AndSkipsSubjectRules()
    {
        // Candidate differs wildly from the (absent) subject; subject-relative rules must NOT fire.
        var d = One(Subject(found: false), Candidate(gla: 5000m, hood: "OTHER", quality: "EXCELLENT"));
        d.Flags.Should().Contain("missing_subject_data");
        d.Flags.Should().NotContain("gla_mismatch");
        d.Flags.Should().NotContain("different_market_area");
        d.Flags.Should().NotContain("quality_mismatch");
        d.ReviewRequired.Should().BeTrue();
    }

    [Fact]
    public void GlaMismatch_FiresWhenOver25Pct()
    {
        var d = One(Subject(gla: 2000m), Candidate(gla: 3000m)); // +50%
        d.Flags.Should().Contain("gla_mismatch");
    }

    [Fact]
    public void GlaWithinTolerance_NoMismatch()
    {
        var d = One(Subject(gla: 2000m), Candidate(gla: 2200m)); // +10%
        d.Flags.Should().NotContain("gla_mismatch");
    }

    [Fact]
    public void DifferentNeighborhood_FlagsMarketArea()
    {
        var d = One(Subject(hood: "NBHD-01"), Candidate(hood: "NBHD-99"));
        d.Flags.Should().Contain("different_market_area");
    }

    [Fact]
    public void SiteSizeMismatch_FiresWhenOver50Pct()
    {
        var d = One(Subject(lot: 8000m), Candidate(lot: 20000m));
        d.Flags.Should().Contain("site_size_mismatch");
    }

    [Fact]
    public void QualityMismatch_UsesOrdinalGap_AcrossVocabularies()
    {
        // STANDARD (cama, rank 3) vs EXCELLENT (sale, rank 5) => gap 2 => mismatch
        var d = One(Subject(quality: "STANDARD"), Candidate(quality: "EXCELLENT"));
        d.Flags.Should().Contain("quality_mismatch");
    }

    [Fact]
    public void QualityAdjacentGrades_DoNotMismatch()
    {
        // AVERAGE (3) vs GOOD (4) => gap 1 => no flag (humble)
        var d = One(Subject(quality: "AVERAGE"), Candidate(quality: "GOOD"));
        d.Flags.Should().NotContain("quality_mismatch");
    }

    [Fact]
    public void UnknownQuality_NeverMismatches()
    {
        var d = One(Subject(quality: null), Candidate(quality: "EXCELLENT"));
        d.Flags.Should().NotContain("quality_mismatch");
    }

    [Fact]
    public void PriceOutlier_FiresAgainstSetMedian()
    {
        var subject = Subject();
        var candidates = new[]
        {
            Candidate(parcelId: "A", ppsf: 200m, rank: 1),
            Candidate(parcelId: "B", ppsf: 205m, rank: 2),
            Candidate(parcelId: "C", ppsf: 195m, rank: 3),
            Candidate(parcelId: "D", ppsf: 400m, rank: 4), // ~2x median => outlier
        };
        var results = CompSetDiagnosisEngine.Diagnose(subject, candidates, AsOf);
        results.Single(r => r.ParcelId == "D").Flags.Should().Contain("high_price_per_sqft_outlier");
        results.Single(r => r.ParcelId == "A").Flags.Should().NotContain("high_price_per_sqft_outlier");
    }

    [Fact]
    public void PriceOutlier_NotComputedWithFewerThanThreeValues()
    {
        var subject = Subject();
        var candidates = new[]
        {
            Candidate(parcelId: "A", ppsf: 200m, rank: 1),
            Candidate(parcelId: "D", ppsf: 400m, rank: 2),
        };
        var results = CompSetDiagnosisEngine.Diagnose(subject, candidates, AsOf);
        results.Should().OnlyContain(r => !r.Flags.Contains("high_price_per_sqft_outlier"));
    }

    [Fact]
    public void ThreeOrMoreSignificantFlags_IsWeak()
    {
        var d = One(
            Subject(gla: 2000m, hood: "NBHD-01", quality: "AVERAGE"),
            Candidate(qualification: "unverified", saleDate: new DateTime(2017, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                gla: 4000m, hood: "OTHER"));
        d.QualificationStatus.Should().Be("weak");
        d.ReviewRequired.Should().BeTrue();
    }

    [Fact]
    public void NeverEmitsConfidenceOrBestCompLanguage()
    {
        var d = One(Subject(), Candidate(qualification: "unverified"));
        d.SupportSummary.ToLowerInvariant().Should().NotContain("confidence");
        d.SupportSummary.ToLowerInvariant().Should().NotContain("best comp");
        d.SupportSummary.ToLowerInvariant().Should().NotContain("official");
        d.QualificationStatus.Should().BeOneOf("strong", "usable", "weak", "needs_review", "disqualified");
    }
}
