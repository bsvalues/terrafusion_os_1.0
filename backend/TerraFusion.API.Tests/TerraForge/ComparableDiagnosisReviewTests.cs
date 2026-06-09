// TERRAFORGE-COMPS-DIAGNOSIS-REVIEW-NOTES
//
// Behavioral tests: the human reviewer layer is SEPARATE from the rule diagnosis.
// A review never mutates the candidate's rule diagnosis; an override (with required
// reason) is stored on the review only. subject_defense + draft only; county-isolated.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities.TerraForge;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.TerraForge;

public sealed class ComparableDiagnosisReviewTests : IDisposable
{
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public ComparableDiagnosisReviewTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>(),
            Mock.Of<ISaleQualificationService>(),
            ControllerTestSetup.CountyResolverFor(BentonId))
        {
            ControllerContext = ControllerTestSetup.WithCountyClaim(BentonId),
        };
    }

    public void Dispose() => _db.Dispose();

    private CompSet SeedDiagnosedSet(
        string mode = "subject_defense",
        string official = "not_official",
        Guid? countyId = null,
        string ruleStatus = "weak")
    {
        var county = countyId ?? BentonId;
        var set = new CompSet
        {
            CountyId = county,
            Mode = mode,
            Status = "draft",
            OfficialStatus = official,
            SubjectParcelId = "SUBJ-1",
            Candidates = new List<CompSetCandidate>
            {
                new()
                {
                    CountyId = county,
                    ParcelId = "CAND-1",
                    SalePrice = 400_000m,
                    SaleDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    PricePerSqft = 200m,
                    Qualification = "qualified",
                    Rank = 1,
                    // Simulate an already-run rule diagnosis on this candidate.
                    QualificationStatus = ruleStatus,
                    DiagnosisStatus = "draft",
                    ReviewRequired = true,
                    DiagnosticFlagsJson = "[\"gla_mismatch\",\"stale_sale\"]",
                    SupportSummary = "Rule summary.",
                    DiagnosisVersion = "rules_v1",
                },
            },
        };
        _db.CompSets.Add(set);
        _db.SaveChanges();
        return set;
    }

    private Guid CandidateId(CompSet set) =>
        _db.CompSetCandidates.Single(c => c.CompSetId == set.CompSetId).CompSetCandidateId;

    private static CompSetCandidateReviewRequestDto Req(
        string? disposition = "needs_field_verification",
        string? note = "Verify GLA on site.",
        string[]? ack = null,
        string? overrideStatus = null,
        string? overrideReason = null) =>
        new()
        {
            disposition = disposition,
            reviewerNote = note,
            acknowledgedFlags = ack,
            qualificationOverride = overrideStatus,
            overrideReason = overrideReason,
        };

    private static CompSetReviewsResponseDto OkBody(IActionResult result) =>
        Assert.IsType<CompSetReviewsResponseDto>(Assert.IsType<OkObjectResult>(result).Value);

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Review_Persists_AndDoesNotMutateRuleDiagnosis()
    {
        var set = SeedDiagnosedSet(ruleStatus: "weak");
        var candId = CandidateId(set);

        var body = OkBody(await _sut.ReviewCompSetCandidate(
            set.CompSetId.ToString("D"), candId.ToString("D"),
            Req(disposition: "use_as_secondary_support", ack: new[] { "gla_mismatch" })));

        // Persisted in the separate review table.
        var review = _db.CompSetCandidateReviews.Single(r => r.CompSetCandidateId == candId);
        Assert.Equal("use_as_secondary_support", review.Disposition);

        // Rule diagnosis on the candidate is UNCHANGED.
        var cand = _db.CompSetCandidates.Single(c => c.CompSetCandidateId == candId);
        Assert.Equal("weak", cand.QualificationStatus);
        Assert.Equal("draft", cand.DiagnosisStatus);
        Assert.Equal("rules_v1", cand.DiagnosisVersion);

        // Response exposes both layers separately.
        var row = body.candidates.Single();
        Assert.Equal("weak", row.ruleQualificationStatus);
        Assert.NotNull(row.review);
        Assert.Equal("use_as_secondary_support", row.review!.disposition);
        Assert.Contains("gla_mismatch", row.review.acknowledgedFlags);
    }

    [Fact]
    public async Task Review_OverrideStored_OnReviewLayerOnly_RuleStatusPreserved()
    {
        var set = SeedDiagnosedSet(ruleStatus: "weak");
        var candId = CandidateId(set);

        var body = OkBody(await _sut.ReviewCompSetCandidate(
            set.CompSetId.ToString("D"), candId.ToString("D"),
            Req(disposition: "accepted_for_review", overrideStatus: "usable", overrideReason: "Local market supports it.")));

        var cand = _db.CompSetCandidates.Single(c => c.CompSetCandidateId == candId);
        Assert.Equal("weak", cand.QualificationStatus); // rule preserved

        var row = body.candidates.Single();
        Assert.Equal("weak", row.ruleQualificationStatus);
        Assert.Equal("usable", row.review!.qualificationOverride);
        Assert.Equal("Local market supports it.", row.review.overrideReason);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("totally_made_up")]
    public async Task Review_InvalidDisposition_ReturnsBadRequest(string? disposition)
    {
        var set = SeedDiagnosedSet();
        var candId = CandidateId(set);

        var result = await _sut.ReviewCompSetCandidate(
            set.CompSetId.ToString("D"), candId.ToString("D"), Req(disposition: disposition));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(_db.CompSetCandidateReviews);
    }

    [Fact]
    public async Task Review_OverrideWithoutReason_ReturnsBadRequest_AndPersistsNothing()
    {
        var set = SeedDiagnosedSet();
        var candId = CandidateId(set);

        var result = await _sut.ReviewCompSetCandidate(
            set.CompSetId.ToString("D"), candId.ToString("D"),
            Req(overrideStatus: "strong", overrideReason: null));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(_db.CompSetCandidateReviews);
    }

    [Fact]
    public async Task Review_InvalidOverrideStatus_ReturnsBadRequest()
    {
        var set = SeedDiagnosedSet();
        var candId = CandidateId(set);

        var result = await _sut.ReviewCompSetCandidate(
            set.CompSetId.ToString("D"), candId.ToString("D"),
            Req(overrideStatus: "amazing", overrideReason: "x"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Review_Upserts_OneRowPerCandidate()
    {
        var set = SeedDiagnosedSet();
        var candId = CandidateId(set);

        await _sut.ReviewCompSetCandidate(set.CompSetId.ToString("D"), candId.ToString("D"),
            Req(disposition: "accepted_for_review", note: "first"));
        await _sut.ReviewCompSetCandidate(set.CompSetId.ToString("D"), candId.ToString("D"),
            Req(disposition: "reject_as_comparable", note: "second"));

        var reviews = _db.CompSetCandidateReviews.Where(r => r.CompSetCandidateId == candId).ToList();
        Assert.Single(reviews);
        Assert.Equal("reject_as_comparable", reviews[0].Disposition);
        Assert.Equal("second", reviews[0].ReviewerNote);
    }

    [Fact]
    public async Task Review_RejectsMarketSearch()
    {
        var set = SeedDiagnosedSet(mode: "market_search");
        var candId = CandidateId(set);
        var result = await _sut.ReviewCompSetCandidate(set.CompSetId.ToString("D"), candId.ToString("D"), Req());
        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Review_RejectsOfficial()
    {
        var set = SeedDiagnosedSet(official: "official");
        var candId = CandidateId(set);
        var result = await _sut.ReviewCompSetCandidate(set.CompSetId.ToString("D"), candId.ToString("D"), Req());
        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Review_CandidateNotInSet_ReturnsNotFound()
    {
        var set = SeedDiagnosedSet();
        var result = await _sut.ReviewCompSetCandidate(
            set.CompSetId.ToString("D"), Guid.NewGuid().ToString("D"), Req());
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Review_CrossCountySet_ReturnsNotFound()
    {
        var set = SeedDiagnosedSet(countyId: OtherCountyId);
        var candId = CandidateId(set);
        var result = await _sut.ReviewCompSetCandidate(set.CompSetId.ToString("D"), candId.ToString("D"), Req());
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Review_InvalidIds_ReturnBadRequest()
    {
        Assert.IsType<BadRequestObjectResult>(
            await _sut.ReviewCompSetCandidate("nope", Guid.NewGuid().ToString("D"), Req()));
        Assert.IsType<BadRequestObjectResult>(
            await _sut.ReviewCompSetCandidate(Guid.NewGuid().ToString("D"), "nope", Req()));
    }

    [Fact]
    public async Task GetReviews_ReturnsRuleLayer_AndReviewerLayer_Separately()
    {
        var set = SeedDiagnosedSet(ruleStatus: "weak");
        var candId = CandidateId(set);
        await _sut.ReviewCompSetCandidate(set.CompSetId.ToString("D"), candId.ToString("D"),
            Req(disposition: "needs_sale_validation", overrideStatus: "usable", overrideReason: "comparable enough"));

        var body = OkBody(await _sut.GetCompSetReviews(set.CompSetId.ToString("D")));
        var row = body.candidates.Single();

        Assert.Equal("weak", row.ruleQualificationStatus);          // rule layer
        Assert.Contains("gla_mismatch", row.ruleFlags);
        Assert.Equal("needs_sale_validation", row.review!.disposition); // reviewer layer
        Assert.Equal("usable", row.review.qualificationOverride);
        Assert.Contains("apply_adjustments", body.unavailableActions);
        Assert.Contains("certify_official", body.unavailableActions);
    }

    [Fact]
    public async Task GetReviews_BeforeAnyReview_ReturnsNullReviewLayer()
    {
        var set = SeedDiagnosedSet();
        var body = OkBody(await _sut.GetCompSetReviews(set.CompSetId.ToString("D")));
        var row = body.candidates.Single();
        Assert.NotNull(row.ruleQualificationStatus);
        Assert.Null(row.review);
    }
}
