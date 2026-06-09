// TERRAFORGE-COMPS-SUBJECT-DEFENSE-DETAIL-VIEW
//
// Behavioral tests for the read-only consolidated detail endpoint:
// subject summary + candidates (rule layer AND separate reviewer layer) + posture
// + certification + unavailable actions. Read-only; county-isolated.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.TerraForge;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.TerraForge;

public sealed class ComparableDetailTests : IDisposable
{
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();
    private const string Subject = "SUBJ-1";

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public ComparableDetailTests()
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

    private CompSet SeedSet(string official = "not_official", string status = "draft", Guid? countyId = null)
    {
        var county = countyId ?? BentonId;
        var set = new CompSet
        {
            CountyId = county,
            Mode = "subject_defense",
            Status = status,
            OfficialStatus = official,
            SubjectParcelId = Subject,
            CertifiedBy = official == "official" ? "appraiser-1" : null,
            CertifiedAtUtc = official == "official" ? new DateTime(2026, 6, 9, 0, 0, 0, DateTimeKind.Utc) : null,
            Candidates = new List<CompSetCandidate>
            {
                new()
                {
                    CountyId = county, ParcelId = "CAND-1", SalePrice = 400_000m,
                    SaleDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc), PricePerSqft = 200m,
                    Qualification = "qualified", Rank = 1,
                    QualificationStatus = "weak", DiagnosisStatus = "draft",
                    DiagnosticFlagsJson = "[\"gla_mismatch\"]", SupportSummary = "Rule summary.", DiagnosisVersion = "rules_v1",
                },
            },
        };
        _db.CompSets.Add(set);
        _db.SaveChanges();
        return set;
    }

    private void SeedSubjectCama(Guid? countyId = null)
    {
        _db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            Id = Guid.NewGuid(), ParcelId = Subject, TaxYear = 2026, BuildingType = "R1",
            CountyId = countyId ?? BentonId, SquareFeet = 2000m, LandAreaSqft = 8000m,
            NeighborhoodCode = "NBHD-01", QualityGrade = "AVERAGE", ConditionGrade = "AVERAGE",
            UpdatedBy = "test", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });
        _db.SaveChanges();
    }

    private void SeedReview(CompSet set)
    {
        var cand = _db.CompSetCandidates.Single(c => c.CompSetId == set.CompSetId);
        _db.CompSetCandidateReviews.Add(new CompSetCandidateReview
        {
            CompSetId = set.CompSetId, CompSetCandidateId = cand.CompSetCandidateId, CountyId = set.CountyId,
            ParcelId = cand.ParcelId, Disposition = "use_as_secondary_support",
            QualificationOverride = "usable", OverrideReason = "local market supports it",
            ReviewedBy = "appraiser-1", ReviewedAtUtc = DateTime.UtcNow,
        });
        _db.SaveChanges();
    }

    private static CompSetDetailResponseDto OkBody(IActionResult r) =>
        Assert.IsType<CompSetDetailResponseDto>(Assert.IsType<OkObjectResult>(r).Value);

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Detail_ReturnsSubject_CandidatesWithBothLayers_AndPosture()
    {
        var set = SeedSet();
        SeedSubjectCama();
        SeedReview(set);

        var body = OkBody(await _sut.GetCompSetDetail(set.CompSetId.ToString("D")));

        Assert.Equal("subject_defense", body.mode);
        Assert.True(body.posture.draft);
        Assert.False(body.posture.official);
        Assert.True(body.posture.diagnosed);

        Assert.True(body.subject.found);
        Assert.Equal(2000m, body.subject.grossLivingArea);
        Assert.Equal("NBHD-01", body.subject.neighborhoodCode);

        var c = Assert.Single(body.candidates);
        Assert.Equal("CAND-1", c.parcelId);
        Assert.Equal("weak", c.ruleQualificationStatus);          // rule layer
        Assert.Contains("gla_mismatch", c.ruleFlags);
        Assert.NotNull(c.review);                                  // reviewer layer
        Assert.Equal("use_as_secondary_support", c.review!.disposition);
        Assert.Equal("usable", c.review.qualificationOverride);

        Assert.Contains("apply_adjustments", body.unavailableActions);
        Assert.Contains("export_dossier_packet", body.unavailableActions);
    }

    [Fact]
    public async Task Detail_SubjectWithoutCama_FoundFalse_CandidatesStillRender()
    {
        var set = SeedSet(); // no Cama seeded
        var body = OkBody(await _sut.GetCompSetDetail(set.CompSetId.ToString("D")));
        Assert.False(body.subject.found);
        Assert.Equal(Subject, body.subject.parcelId);
        Assert.Single(body.candidates);
        Assert.Null(body.candidates[0].review); // not reviewed
    }

    [Fact]
    public async Task Detail_CertifiedSet_PostureCertified()
    {
        var set = SeedSet(official: "official", status: "certified");
        var body = OkBody(await _sut.GetCompSetDetail(set.CompSetId.ToString("D")));
        Assert.True(body.posture.certified);
        Assert.True(body.certification.certified);
        Assert.Equal("appraiser-1", body.certification.certifiedBy);
        Assert.NotNull(body.certification.certifiedAtUtc);
    }

    [Fact]
    public async Task Detail_ReadOnly_DoesNotMutate()
    {
        var set = SeedSet();
        SeedSubjectCama();

        await _sut.GetCompSetDetail(set.CompSetId.ToString("D"));
        await _sut.GetCompSetDetail(set.CompSetId.ToString("D"));

        var reloaded = _db.CompSets.Single(x => x.CompSetId == set.CompSetId);
        Assert.Equal("draft", reloaded.Status);
        Assert.Equal("not_official", reloaded.OfficialStatus);
        var cand = _db.CompSetCandidates.Single(c => c.CompSetId == set.CompSetId);
        Assert.Equal("weak", cand.QualificationStatus); // unchanged
    }

    [Fact]
    public async Task Detail_CrossCounty_ReturnsNotFound()
    {
        var set = SeedSet(countyId: OtherCountyId);
        Assert.IsType<NotFoundObjectResult>(await _sut.GetCompSetDetail(set.CompSetId.ToString("D")));
    }

    [Fact]
    public async Task Detail_InvalidId_ReturnsBadRequest()
    {
        Assert.IsType<BadRequestObjectResult>(await _sut.GetCompSetDetail("not-a-guid"));
    }
}
