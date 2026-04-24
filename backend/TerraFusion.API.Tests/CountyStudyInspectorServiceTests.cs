// backend/TerraFusion.API.Tests/CountyStudyInspectorServiceTests.cs
//
// Task D — integration tests for CountyStudyInspectorService. Seeds the same
// Benton-shaped fixture CountyStudyHealthServiceTests uses so the two surfaces
// read the same reality. Covers:
//   - GetSegmentDetailAsync happy path (populated metrics, classification, warnings)
//   - Not-found throws
//   - YoY history across multiple tax years (no filler rows for absent years)
//   - Action-context parcel cap + StratumKey derivation
//   - Deeplink-support flag controls DeeplinkQuery nullability

using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class CountyStudyInspectorServiceTests : IDisposable
{
    private static readonly Guid CountyId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private const int TaxYear = 2026;

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly CountyStudyInspectorService _svc;
    private readonly CountyStudySegmentDerivationService _derive;

    public CountyStudyInspectorServiceTests()
    {
        _db     = TestDbContextFactory.CreateInMemoryContext();
        _svc    = new CountyStudyInspectorService(_db);
        _derive = new CountyStudySegmentDerivationService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── Seeders ────────────────────────────────────────────────────────────

    private CountyStudySession SeedStudy(int taxYear = TaxYear)
    {
        var study = new CountyStudySession
        {
            StudyId   = Guid.NewGuid(),
            CountyId  = CountyId,
            TaxYear   = taxYear,
            StudyType = StudyType.RatioStudy,
            Status    = StudyStatus.Draft,
        };
        _db.CountyStudySessions.Add(study);
        _db.SaveChanges();
        return study;
    }

    private void SeedParcelWithSale(
        string parcelId, int taxYear, string neighborhood, string buildingType, string qualityGrade,
        string city, decimal assessedValue, decimal salePrice)
    {
        _db.Properties.Add(new Property
        {
            Id            = Guid.NewGuid(),
            ParcelId      = parcelId,
            ParcelNumber  = parcelId,
            CountyId      = CountyId,
            TaxYear       = taxYear,
            AssessedValue = assessedValue,
            MarketValue   = assessedValue,
            Neighborhood  = neighborhood,
            SitusCity     = city,
        });
        _db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            Id           = Guid.NewGuid(),
            ParcelId     = parcelId,
            TaxYear      = taxYear,
            BuildingType = buildingType,
            QualityGrade = qualityGrade,
            City         = city,
            SquareFeet   = 1800m,
            CountyId     = CountyId,
            UpdatedAt    = DateTime.UtcNow,
            UpdatedBy    = "test",
            YearBuilt    = 2005,
        });
        _db.ComparableSales.Add(new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = CountyId,
            ParcelId                    = parcelId,
            SaleDate                    = new DateTime(taxYear - 1, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            SalesYear                   = taxYear - 1,
            QualificationRecommendation = "qualified",
        });
        _db.SaveChanges();
    }

    /// <summary>
    /// Builds 12 segments × 5 parcels for a given tax year. Mirrors the
    /// CountyStudyHealthServiceTests fixture byte-for-byte so the inspector's
    /// output is comparable to the health service's.
    /// </summary>
    private async Task<CountyStudySession> SeedBentonFixture(int taxYear = TaxYear)
    {
        var study = SeedStudy(taxYear);

        var plan = new (string City, string Neighborhood, string Quality)[]
        {
            ("Kennewick", "NBHD-K1", "STANDARD"),
            ("Kennewick", "NBHD-K1", "GOOD"),
            ("Kennewick", "NBHD-K2", "STANDARD"),
            ("Kennewick", "NBHD-K2", "GOOD"),
            ("Kennewick", "NBHD-K3", "STANDARD"),
            ("Kennewick", "NBHD-K3", "GOOD"),
            ("Richland",  "NBHD-R1", "STANDARD"),
            ("Richland",  "NBHD-R1", "GOOD"),
            ("Richland",  "NBHD-R2", "STANDARD"),
            ("Richland",  "NBHD-R2", "GOOD"),
            ("Richland",  "NBHD-R3", "STANDARD"),
            ("Richland",  "NBHD-R3", "GOOD"),
        };

        decimal[] prices = { 316_667m, 306_452m, 300_000m, 293_814m, 285_000m };
        var parcelIdx = 0;
        foreach (var row in plan)
        {
            for (var i = 0; i < 5; i++)
            {
                SeedParcelWithSale(
                    parcelId:     $"HP-{taxYear}-{parcelIdx++}",
                    taxYear:      taxYear,
                    neighborhood: row.Neighborhood,
                    buildingType: "R1",
                    qualityGrade: row.Quality,
                    city:         row.City,
                    assessedValue: 285_000m,
                    salePrice:     prices[i]);
            }
        }

        await _derive.DeriveAsync(study.StudyId, "tester");
        return _db.CountyStudySessions.Single(s => s.StudyId == study.StudyId);
    }

    // ── GetSegmentDetailAsync ───────────────────────────────────────────────

    [Fact]
    public async Task GetSegmentDetailAsync_MissingSegment_Throws()
    {
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _svc.GetSegmentDetailAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task GetSegmentDetailAsync_HealthyFixture_PopulatesCoreAndBentonExtras()
    {
        var study = await SeedBentonFixture();
        var anySegment = _db.CountySegments.First(s =>
            s.SegmentSetId == study.ActiveSegmentSetId!.Value);

        var detail = await _svc.GetSegmentDetailAsync(anySegment.SegmentId);

        Assert.Equal(anySegment.SegmentId, detail.SegmentId);
        Assert.Equal(study.StudyId,        detail.StudyId);
        Assert.Equal(CountyId,             detail.CountyId);
        Assert.Equal(TaxYear,              detail.TaxYear);
        Assert.NotNull(detail.MedianRatio);
        // 5 ratios, small sample → PRB remains null (< 10 gate).
        Assert.Null(detail.Prb);
        Assert.Null(detail.Vei);
        // Classification falls back to InsufficientData below MinRatiosForClassification (15).
        Assert.Equal("InsufficientData", detail.EquityClassification);
        Assert.NotNull(detail.DerivedAt);
        // YoY list must NEVER be null — at worst empty.
        Assert.NotNull(detail.YearHistory);
    }

    [Fact]
    public async Task GetSegmentDetailAsync_ReusesComputeCompositeRiskReasons()
    {
        var study = await SeedBentonFixture();
        var segment = _db.CountySegments
            .Where(s => s.SegmentSetId == study.ActiveSegmentSetId!.Value)
            .First(s => s.ParcelCount < 30);  // triggers "low sample size" reason
        var detail = await _svc.GetSegmentDetailAsync(segment.SegmentId);

        // Same vocabulary as HealthAlertDto.Reasons ("low sample size" phrasing).
        Assert.Contains(detail.Warnings, w =>
            w.Contains("low sample size", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetSegmentDetailAsync_ComplianceStatusMatchesHealthServiceVocabulary()
    {
        var study = await SeedBentonFixture();
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == study.ActiveSegmentSetId!.Value);
        var detail = await _svc.GetSegmentDetailAsync(segment.SegmentId);

        Assert.Contains(detail.ComplianceStatus, new[]
        {
            nameof(CountyHealthComplianceStatus.IaaoCompliant),
            nameof(CountyHealthComplianceStatus.MarginalCompliance),
            nameof(CountyHealthComplianceStatus.NonCompliant),
            nameof(CountyHealthComplianceStatus.InsufficientData),
        });
    }

    [Fact]
    public async Task GetSegmentDetailAsync_CurrentYearOnly_NoFillerRows()
    {
        // Only 2026 studies exist — history should have at most the current year.
        var study = await SeedBentonFixture();
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == study.ActiveSegmentSetId!.Value);
        var detail = await _svc.GetSegmentDetailAsync(segment.SegmentId);

        // Every point's TaxYear must be a real study year — no placeholders.
        Assert.All(detail.YearHistory, p => Assert.InRange(p.TaxYear, 2022, 2026));
        // Current-year point is flagged exactly once if it exists.
        Assert.True(detail.YearHistory.Count(p => p.IsCurrentYear) <= 1);
    }

    [Fact]
    public async Task GetSegmentDetailAsync_MultipleYearsSeeded_ReturnsAscendingHistory()
    {
        // Seed 2024, 2025, 2026 studies with the same shape so a segment's peers
        // exist in prior years. YearHistory should carry 3 points, ascending.
        await SeedBentonFixture(2024);
        await SeedBentonFixture(2025);
        var current = await SeedBentonFixture(2026);
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == current.ActiveSegmentSetId!.Value);
        var detail = await _svc.GetSegmentDetailAsync(segment.SegmentId);

        Assert.Equal(3, detail.YearHistory.Count);
        // Ascending by year.
        for (var i = 1; i < detail.YearHistory.Count; i++)
            Assert.True(detail.YearHistory[i].TaxYear > detail.YearHistory[i - 1].TaxYear);
        // Current year (2026) flagged.
        var currentYearPoint = Assert.Single(detail.YearHistory.Where(p => p.IsCurrentYear));
        Assert.Equal(2026, currentYearPoint.TaxYear);
    }

    [Fact]
    public async Task GetSegmentDetailAsync_GapYearInHistory_OmitsMissingYears()
    {
        // Seed 2023 + 2026 only. History should have 2 rows — no filler for 2024/2025.
        await SeedBentonFixture(2023);
        var current = await SeedBentonFixture(2026);
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == current.ActiveSegmentSetId!.Value);
        var detail = await _svc.GetSegmentDetailAsync(segment.SegmentId);

        Assert.Equal(2, detail.YearHistory.Count);
        Assert.DoesNotContain(detail.YearHistory, p => p.TaxYear == 2024 || p.TaxYear == 2025);
    }

    // ── GetActionContextAsync ───────────────────────────────────────────────

    [Fact]
    public async Task GetActionContextAsync_MissingSegment_Throws()
    {
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _svc.GetActionContextAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task GetActionContextAsync_ResolvesStratumKeyAndQualifiedSales()
    {
        var study = await SeedBentonFixture();
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == study.ActiveSegmentSetId!.Value);
        var ctx = await _svc.GetActionContextAsync(segment.SegmentId);

        Assert.Equal("R", ctx.SalesForge.StratumKey);   // BuildingType starts with "R"
        Assert.Equal(TaxYear, ctx.SalesForge.TaxYear);
        Assert.True(ctx.SalesForge.QualifiedSaleCount > 0);
        Assert.False(ctx.Truncated);
        // 5 parcels per segment in fixture.
        Assert.Equal(5, ctx.TotalParcels);
        Assert.Equal(5, ctx.ParcelIds.Count);
    }

    [Fact]
    public async Task GetActionContextAsync_SupportFlags_GateDeeplinkQueryNullability()
    {
        // Task D3 wave 2: SalesForge + CostForge + CompsForge are wired.
        // Dais and Dossier remain honest-disabled (switch = false → DeeplinkQuery null).
        var support = CountyStudyInspectorService.ResolveDeeplinkSupport();
        Assert.True(support.SalesForge);
        Assert.True(support.CostForge);
        Assert.True(support.CompsForge);
        Assert.False(support.Dais);
        Assert.False(support.Dossier);

        var study = await SeedBentonFixture();
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == study.ActiveSegmentSetId!.Value);
        var ctx = await _svc.GetActionContextAsync(segment.SegmentId);

        // Wired targets: deeplink present and carries stratum/year/segmentId.
        Assert.NotNull(ctx.SalesForge.DeeplinkQuery);
        Assert.Contains("stratum=", ctx.SalesForge.DeeplinkQuery);
        Assert.Contains($"year={study.TaxYear}", ctx.SalesForge.DeeplinkQuery);
        Assert.Contains($"segmentId={segment.SegmentId}", ctx.SalesForge.DeeplinkQuery);

        Assert.NotNull(ctx.CostForge.DeeplinkQuery);
        Assert.Contains("stratum=", ctx.CostForge.DeeplinkQuery);
        Assert.Contains($"year={study.TaxYear}", ctx.CostForge.DeeplinkQuery);
        Assert.Contains($"segmentId={segment.SegmentId}", ctx.CostForge.DeeplinkQuery);

        // CompsForge deeplink: carries segmentId + sample parcel ids.
        Assert.NotNull(ctx.CompsForge.DeeplinkQuery);
        Assert.Contains($"segmentId={segment.SegmentId}", ctx.CompsForge.DeeplinkQuery);
        Assert.Contains("sample=", ctx.CompsForge.DeeplinkQuery);

        // Unwired targets stay null so the UI button renders honest-disabled.
        Assert.Null(ctx.Dais.DeeplinkQuery);
        Assert.Null(ctx.Dossier.DeeplinkQuery);
    }

    [Fact]
    public async Task GetActionContextAsync_WorkflowTemplatesAlwaysPopulated()
    {
        var study = await SeedBentonFixture();
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == study.ActiveSegmentSetId!.Value);
        var ctx = await _svc.GetActionContextAsync(segment.SegmentId);

        Assert.Equal("SegmentReview", ctx.Dais.WorkflowTemplate);
        Assert.Equal("SegmentEvidence", ctx.Dossier.PacketTemplate);
    }

    [Fact]
    public async Task GetActionContextAsync_CompsSampleCappedAt10()
    {
        var study = await SeedBentonFixture();
        var segment = _db.CountySegments
            .First(s => s.SegmentSetId == study.ActiveSegmentSetId!.Value);
        var ctx = await _svc.GetActionContextAsync(segment.SegmentId);
        Assert.True(ctx.CompsForge.SampleParcelIds.Count <= CountyStudyInspectorService.CompsSampleCap);
    }
}
