// TERRAFORGE-COMPS-CERTIFY
//
// Behavioral tests: certify a fully-reviewed subject_defense comp set as the
// official record of defense, and lock it. Certification is the only action that
// sets official; requires a reviewer decision on EVERY candidate; once certified
// diagnose/review are rejected (lock-after-certify).

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

public sealed class ComparableCertifyTests : IDisposable
{
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public ComparableCertifyTests()
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

    private CompSet SeedSet(
        string mode = "subject_defense",
        string official = "not_official",
        string status = "draft",
        Guid? countyId = null,
        int candidateCount = 2)
    {
        var county = countyId ?? BentonId;
        var set = new CompSet
        {
            CountyId = county,
            Mode = mode,
            Status = status,
            OfficialStatus = official,
            SubjectParcelId = "SUBJ-1",
            Candidates = Enumerable.Range(1, candidateCount).Select(i => new CompSetCandidate
            {
                CountyId = county,
                ParcelId = $"CAND-{i}",
                SalePrice = 400_000m,
                SaleDate = new DateTime(2025, 6, i, 0, 0, 0, DateTimeKind.Utc),
                PricePerSqft = 200m,
                Qualification = "qualified",
                Rank = i,
                QualificationStatus = "usable",
                DiagnosisStatus = "draft",
                DiagnosisVersion = "rules_v1",
            }).ToList(),
        };
        _db.CompSets.Add(set);
        _db.SaveChanges();
        return set;
    }

    private void Review(CompSet set, int howMany)
    {
        var candidates = _db.CompSetCandidates
            .Where(c => c.CompSetId == set.CompSetId)
            .OrderBy(c => c.Rank)
            .Take(howMany)
            .ToList();
        foreach (var c in candidates)
        {
            _db.CompSetCandidateReviews.Add(new CompSetCandidateReview
            {
                CompSetId = set.CompSetId,
                CompSetCandidateId = c.CompSetCandidateId,
                CountyId = set.CountyId,
                ParcelId = c.ParcelId,
                Disposition = "accepted_for_review",
                ReviewedBy = "appraiser-1",
                ReviewedAtUtc = DateTime.UtcNow,
            });
        }
        _db.SaveChanges();
    }

    private static CompSetCertificationResponseDto OkBody(IActionResult r) =>
        Assert.IsType<CompSetCertificationResponseDto>(Assert.IsType<OkObjectResult>(r).Value);

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Certify_FullyReviewed_SetsOfficialAndStamps()
    {
        var set = SeedSet(candidateCount: 2);
        Review(set, 2);

        var body = OkBody(await _sut.CertifyCompSet(set.CompSetId.ToString("D")));

        Assert.True(body.certified);
        Assert.True(body.locked);
        Assert.Equal("official", body.officialStatus);
        Assert.Equal("certified", body.status);
        Assert.False(string.IsNullOrWhiteSpace(body.certifiedBy));
        Assert.NotNull(body.certifiedAtUtc);
        Assert.Equal(2, body.candidateCount);
        Assert.Equal(2, body.reviewedCount);

        var persisted = _db.CompSets.Single(x => x.CompSetId == set.CompSetId);
        Assert.Equal("official", persisted.OfficialStatus);
        Assert.Equal("certified", persisted.Status);
        Assert.NotNull(persisted.CertifiedAtUtc);
    }

    [Fact]
    public async Task Certify_WithUnreviewedCandidate_ReturnsConflict_AndNothingChanges()
    {
        var set = SeedSet(candidateCount: 2);
        Review(set, 1); // only one of two reviewed

        var result = await _sut.CertifyCompSet(set.CompSetId.ToString("D"));

        Assert.IsType<ConflictObjectResult>(result);
        var persisted = _db.CompSets.Single(x => x.CompSetId == set.CompSetId);
        Assert.Equal("not_official", persisted.OfficialStatus);
        Assert.Equal("draft", persisted.Status);
        Assert.Null(persisted.CertifiedAtUtc);
    }

    [Fact]
    public async Task Certify_NoCandidates_ReturnsConflict()
    {
        var set = SeedSet(candidateCount: 0);
        Assert.IsType<ConflictObjectResult>(await _sut.CertifyCompSet(set.CompSetId.ToString("D")));
    }

    [Fact]
    public async Task Certify_NonSubjectDefense_ReturnsConflict()
    {
        var set = SeedSet(mode: "market_search", candidateCount: 1);
        Review(set, 1);
        Assert.IsType<ConflictObjectResult>(await _sut.CertifyCompSet(set.CompSetId.ToString("D")));
    }

    [Fact]
    public async Task Certify_AlreadyCertified_ReturnsConflict()
    {
        var set = SeedSet(official: "official", status: "certified", candidateCount: 1);
        Review(set, 1);
        Assert.IsType<ConflictObjectResult>(await _sut.CertifyCompSet(set.CompSetId.ToString("D")));
    }

    [Fact]
    public async Task Certify_CrossCounty_ReturnsNotFound()
    {
        var set = SeedSet(countyId: OtherCountyId, candidateCount: 1);
        Review(set, 1);
        Assert.IsType<NotFoundObjectResult>(await _sut.CertifyCompSet(set.CompSetId.ToString("D")));
    }

    [Fact]
    public async Task Certify_InvalidId_ReturnsBadRequest()
    {
        Assert.IsType<BadRequestObjectResult>(await _sut.CertifyCompSet("not-a-guid"));
    }

    [Fact]
    public async Task Certify_LocksDiagnoseAndReview()
    {
        var set = SeedSet(candidateCount: 1);
        Review(set, 1);
        var candId = _db.CompSetCandidates.Single(c => c.CompSetId == set.CompSetId).CompSetCandidateId;

        // Certify.
        OkBody(await _sut.CertifyCompSet(set.CompSetId.ToString("D")));

        // Now locked: diagnosis and review are rejected.
        var diagnoseResult = await _sut.DiagnoseCompSet(set.CompSetId.ToString("D"));
        Assert.IsType<ConflictObjectResult>(diagnoseResult);

        var reviewResult = await _sut.ReviewCompSetCandidate(
            set.CompSetId.ToString("D"),
            candId.ToString("D"),
            new CompSetCandidateReviewRequestDto { disposition = "reject_as_comparable" });
        Assert.IsType<ConflictObjectResult>(reviewResult);
    }

    [Fact]
    public async Task GetCertification_BeforeCertify_ReportsNotCertified()
    {
        var set = SeedSet(candidateCount: 2);
        Review(set, 1);

        var body = OkBody(await _sut.GetCompSetCertification(set.CompSetId.ToString("D")));
        Assert.False(body.certified);
        Assert.False(body.locked);
        Assert.Equal("not_official", body.officialStatus);
        Assert.Equal(2, body.candidateCount);
        Assert.Equal(1, body.reviewedCount);
    }

    [Fact]
    public async Task GetCertification_AfterCertify_ReportsCertifiedAndLocked()
    {
        var set = SeedSet(candidateCount: 1);
        Review(set, 1);
        await _sut.CertifyCompSet(set.CompSetId.ToString("D"));

        var body = OkBody(await _sut.GetCompSetCertification(set.CompSetId.ToString("D")));
        Assert.True(body.certified);
        Assert.True(body.locked);
        Assert.Equal("official", body.officialStatus);
        Assert.Contains("apply_adjustments", body.unavailableActions);
        Assert.Contains("export_dossier_packet", body.unavailableActions);
    }
}
