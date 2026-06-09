// TERRAFORGE-COMPS-COMPARABLE-DIAGNOSIS-MVP
//
// Behavioral tests for rule-based comparable diagnosis on subject_defense comp sets.
//
// Verifies: diagnosis runs only on subject_defense drafts; per-candidate results
// persist; candidates/comp-set otherwise unchanged; county isolation; honest
// unavailable actions; subject-relative rules skip when subject data is absent;
// GET returns the persisted diagnosis.

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
using ComparableSale = TerraFusion.Core.Entities.ComparableSale;

namespace TerraFusion.API.Tests.TerraForge;

public sealed class ComparableDiagnosisTests : IDisposable
{
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();
    private const string Subject = "SUBJ-1";

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public ComparableDiagnosisTests()
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

    // ── Seed helpers ─────────────────────────────────────────────────────────

    private CompSet SeedCompSet(
        string mode = "subject_defense",
        string official = "not_official",
        string? subjectParcelId = Subject,
        Guid? countyId = null,
        params (string parcelId, decimal ppsf, string qual, int rank, DateTime saleDate)[] candidates)
    {
        var county = countyId ?? BentonId;
        var set = new CompSet
        {
            CountyId = county,
            Mode = mode,
            Status = "draft",
            OfficialStatus = official,
            SubjectParcelId = subjectParcelId,
            Candidates = candidates.Select(c => new CompSetCandidate
            {
                CountyId = county,
                ParcelId = c.parcelId,
                SalePrice = 400_000m,
                SaleDate = c.saleDate,
                PricePerSqft = c.ppsf,
                Qualification = c.qual,
                Rank = c.rank,
            }).ToList(),
        };
        _db.CompSets.Add(set);
        _db.SaveChanges();
        return set;
    }

    private void SeedSale(string parcelId, Guid? countyId = null, decimal? gla = 2000m,
        string? hood = "NBHD-01", string? quality = "AVERAGE", string? condition = "AVERAGE",
        DateTime? saleDate = null)
    {
        _db.ComparableSales.Add(new ComparableSale
        {
            Id = Guid.NewGuid(),
            CountyId = countyId ?? BentonId,
            ParcelId = parcelId,
            SaleDate = saleDate ?? new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice = 400_000m,
            PropertyType = "residential",
            Neighborhood = hood,
            GrossLivingArea = gla,
            LotSizeSqft = 8000m,
            QualityGrade = quality,
            Condition = condition,
        });
        _db.SaveChanges();
    }

    private void SeedSubjectCama(string parcelId = Subject, Guid? countyId = null, decimal gla = 2000m,
        string? hood = "NBHD-01", string? quality = "AVERAGE", string? condition = "AVERAGE")
    {
        _db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            Id = Guid.NewGuid(),
            ParcelId = parcelId,
            TaxYear = 2026,
            BuildingType = "R1",
            CountyId = countyId ?? BentonId,
            SquareFeet = gla,
            LandAreaSqft = 8000m,
            NeighborhoodCode = hood,
            QualityGrade = quality,
            ConditionGrade = condition,
            UpdatedBy = "test",
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        });
        _db.SaveChanges();
    }

    private static readonly DateTime Recent = new(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);

    private static CompSetDiagnosisResponseDto OkBody(IActionResult result) =>
        Assert.IsType<CompSetDiagnosisResponseDto>(Assert.IsType<OkObjectResult>(result).Value);

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Diagnose_OnSubjectDefenseDraft_PersistsPerCandidateDiagnostics()
    {
        var set = SeedCompSet(candidates:
        [
            ("CAND-1", 200m, "qualified", 1, Recent),
            ("CAND-2", 210m, "qualified", 2, Recent),
        ]);
        SeedSale("CAND-1", hood: "NBHD-01");
        SeedSale("CAND-2", hood: "NBHD-99"); // different market area
        SeedSubjectCama(hood: "NBHD-01");

        var body = OkBody(await _sut.DiagnoseCompSet(set.CompSetId.ToString("D")));

        Assert.Equal("draft", body.diagnosisStatus);
        Assert.Equal("not_official", body.officialStatus);
        Assert.Equal(2, body.candidateDiagnostics.Length);
        Assert.Equal("rules_v1", body.diagnosisVersion);

        var c1 = body.candidateDiagnostics.Single(c => c.parcelId == "CAND-1");
        Assert.Equal("strong", c1.qualificationStatus);
        Assert.False(c1.reviewRequired);

        var c2 = body.candidateDiagnostics.Single(c => c.parcelId == "CAND-2");
        Assert.Contains("different_market_area", c2.flags);
        Assert.True(c2.reviewRequired);

        // Persisted on the entities.
        var persisted = _db.CompSetCandidates.Where(c => c.CompSetId == set.CompSetId).ToList();
        Assert.All(persisted, c => Assert.Equal("draft", c.DiagnosisStatus));
        Assert.All(persisted, c => Assert.NotNull(c.DiagnosedAtUtc));
        Assert.All(persisted, c => Assert.Equal("rules_v1", c.DiagnosisVersion));
    }

    [Fact]
    public async Task Diagnose_KeepsCompSetDraft_AndCandidateCoreFieldsUnchanged()
    {
        var set = SeedCompSet(candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        SeedSale("CAND-1");
        SeedSubjectCama();

        await _sut.DiagnoseCompSet(set.CompSetId.ToString("D"));

        var reloaded = _db.CompSets.Single(x => x.CompSetId == set.CompSetId);
        Assert.Equal("subject_defense", reloaded.Mode);
        Assert.Equal("draft", reloaded.Status);
        Assert.Equal("not_official", reloaded.OfficialStatus);

        var cand = _db.CompSetCandidates.Single(c => c.CompSetId == set.CompSetId);
        Assert.Equal("CAND-1", cand.ParcelId);
        Assert.Equal(400_000m, cand.SalePrice);
        Assert.Equal(1, cand.Rank);
    }

    [Fact]
    public async Task Diagnose_Response_DeclaresUnavailableActions()
    {
        var set = SeedCompSet(candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        SeedSale("CAND-1");
        SeedSubjectCama();

        var body = OkBody(await _sut.DiagnoseCompSet(set.CompSetId.ToString("D")));

        Assert.Contains("apply_adjustments", body.unavailableActions);
        Assert.Contains("reconcile_value", body.unavailableActions);
        Assert.Contains("certify_official", body.unavailableActions);
        Assert.Contains("export_dossier_packet", body.unavailableActions);
    }

    [Fact]
    public async Task Diagnose_MissingSubjectCama_FlagsMissingSubjectData()
    {
        var set = SeedCompSet(candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        SeedSale("CAND-1");
        // No CamaCharacteristics for the subject.

        var body = OkBody(await _sut.DiagnoseCompSet(set.CompSetId.ToString("D")));

        var c1 = body.candidateDiagnostics.Single();
        Assert.Contains("missing_subject_data", c1.flags);
        Assert.True(c1.reviewRequired);
    }

    [Fact]
    public async Task Diagnose_RejectsMarketSearch()
    {
        var set = SeedCompSet(mode: "market_search", subjectParcelId: null,
            candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);

        var result = await _sut.DiagnoseCompSet(set.CompSetId.ToString("D"));
        Assert.IsType<ConflictObjectResult>(result);
        Assert.All(_db.CompSetCandidates.ToList(), c => Assert.Null(c.DiagnosisStatus));
    }

    [Fact]
    public async Task Diagnose_RejectsOfficial()
    {
        var set = SeedCompSet(official: "official", candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        var result = await _sut.DiagnoseCompSet(set.CompSetId.ToString("D"));
        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Diagnose_RejectsMissingSubjectParcel()
    {
        var set = SeedCompSet(subjectParcelId: null, candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        var result = await _sut.DiagnoseCompSet(set.CompSetId.ToString("D"));
        Assert.IsType<ConflictObjectResult>(result);
    }

    [Fact]
    public async Task Diagnose_InvalidId_ReturnsBadRequest()
    {
        var result = await _sut.DiagnoseCompSet("not-a-guid");
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Diagnose_CrossCountySource_ReturnsNotFound()
    {
        var set = SeedCompSet(countyId: OtherCountyId, candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        var result = await _sut.DiagnoseCompSet(set.CompSetId.ToString("D"));
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetDiagnosis_BeforeDiagnose_ReturnsNotDiagnosed()
    {
        var set = SeedCompSet(candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        var body = OkBody(await _sut.GetCompSetDiagnosis(set.CompSetId.ToString("D")));
        Assert.Equal("not_diagnosed", body.diagnosisStatus);
    }

    [Fact]
    public async Task GetDiagnosis_AfterDiagnose_ReturnsPersisted()
    {
        var set = SeedCompSet(candidates: [("CAND-1", 200m, "qualified", 1, Recent)]);
        SeedSale("CAND-1");
        SeedSubjectCama();

        await _sut.DiagnoseCompSet(set.CompSetId.ToString("D"));
        var body = OkBody(await _sut.GetCompSetDiagnosis(set.CompSetId.ToString("D")));

        Assert.Equal("draft", body.diagnosisStatus);
        Assert.Single(body.candidateDiagnostics);
        Assert.Equal("CAND-1", body.candidateDiagnostics[0].parcelId);
        Assert.NotNull(body.candidateDiagnostics[0].qualificationStatus);
    }
}
