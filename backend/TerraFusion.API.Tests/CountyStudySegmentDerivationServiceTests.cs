// backend/TerraFusion.API.Tests/CountyStudySegmentDerivationServiceTests.cs
//
// Verifies that CountyStudySegmentDerivationService reads canonical TerraFusion
// tables (Properties, CamaCharacteristics, ComparableSales) and writes
// CountySegmentSet + CountySegment rows grouped by (neighborhood × building
// type × quality grade), with correct per-segment metrics.
//
// Test strategy: in-memory TerraFusionDbContext seeded with minimal canonical
// rows; invoke DeriveAsync; assert the resulting entities and metrics.

using System.Text.Json;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class CountyStudySegmentDerivationServiceTests : IDisposable
{
    private static readonly Guid CountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const int TaxYear = 2026;

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly CountyStudySegmentDerivationService _sut;

    public CountyStudySegmentDerivationServiceTests()
    {
        _db  = TestDbContextFactory.CreateInMemoryContext();
        _sut = new CountyStudySegmentDerivationService(_db);
    }

    public void Dispose() => _db.Dispose();

    private CountyStudySession SeedStudy()
    {
        var study = new CountyStudySession
        {
            StudyId   = Guid.NewGuid(),
            CountyId  = CountyId,
            TaxYear   = TaxYear,
            StudyType = StudyType.RatioStudy,
            Status    = StudyStatus.Draft,
        };
        _db.CountyStudySessions.Add(study);
        _db.SaveChanges();
        return study;
    }

    private void SeedParcel(
        string parcelId,
        string neighborhood,
        string buildingType,
        string? qualityGrade,
        decimal assessedValue)
    {
        _db.Properties.Add(new Property
        {
            Id            = Guid.NewGuid(),
            ParcelId      = parcelId,
            ParcelNumber  = parcelId,
            CountyId      = CountyId,
            TaxYear       = TaxYear,
            AssessedValue = assessedValue,
            MarketValue   = assessedValue,
            Neighborhood  = neighborhood,
        });
        _db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            Id           = Guid.NewGuid(),
            ParcelId     = parcelId,
            TaxYear      = TaxYear,
            BuildingType = buildingType,
            QualityGrade = qualityGrade,
            SquareFeet   = 1800m,
            CountyId     = CountyId,
            UpdatedAt    = DateTime.UtcNow,
            UpdatedBy    = "test",
        });
        _db.SaveChanges();
    }

    private void SeedSale(string parcelId, decimal salePrice, DateTime? saleDate = null)
    {
        _db.ComparableSales.Add(new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = CountyId,
            ParcelId                    = parcelId,
            SaleDate                    = saleDate ?? new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            SalesYear                   = 2025,
            QualificationRecommendation = "qualified",
        });
        _db.SaveChanges();
    }

    // ── Tests ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeriveAsync_EmptyCounty_CreatesEmptySegmentSet()
    {
        var study = SeedStudy();

        var result = await _sut.DeriveAsync(study.StudyId, "tester");

        Assert.NotEqual(Guid.Empty, result.SegmentSetId);
        Assert.Equal(0, result.SegmentCount);
        Assert.Equal(0, result.TotalParcels);
        Assert.Equal(0, result.SegmentsWithRatios);

        var set = _db.CountySegmentSets.Single();
        Assert.True(set.IsBaseline);
        Assert.Equal(1, set.Version);
        Assert.Equal(SegmentSetSourceType.Hybrid, set.SourceType);
    }

    [Fact]
    public async Task DeriveAsync_ThreeParcelsSameGroup_CreatesOneSegment()
    {
        var study = SeedStudy();
        SeedParcel("P1", neighborhood: "WestHills",  buildingType: "R1", qualityGrade: "STANDARD", assessedValue: 300_000m);
        SeedParcel("P2", neighborhood: "WestHills",  buildingType: "R1", qualityGrade: "STANDARD", assessedValue: 310_000m);
        SeedParcel("P3", neighborhood: "WestHills",  buildingType: "R1", qualityGrade: "STANDARD", assessedValue: 295_000m);

        var result = await _sut.DeriveAsync(study.StudyId, "tester");

        Assert.Equal(1, result.SegmentCount);
        Assert.Equal(3, result.TotalParcels);

        var seg = _db.CountySegments.Single();
        Assert.Equal(3, seg.ParcelCount);
        Assert.Equal(SegmentType.Residential, seg.SegmentType);
        Assert.Contains("WestHills",  seg.Name);
        Assert.Contains("R1",         seg.Name);
        Assert.Contains("STANDARD",   seg.Name);
        Assert.Equal("WestHills", seg.GeographyRef);
        // No sales → no ratio stats.
        Assert.Null(seg.MedianRatio);
        Assert.Null(seg.CoefficientOfDispersion);
        // Stability defaults to 50 when no COD computable.
        Assert.Equal(50m, seg.StabilityScore);
    }

    [Fact]
    public async Task DeriveAsync_DifferentGroupings_CreatesDistinctSegments()
    {
        var study = SeedStudy();
        SeedParcel("P1", "A", "R1", "STANDARD", 300_000m);
        SeedParcel("P2", "A", "R1", "GOOD",     300_000m); // different quality → different segment
        SeedParcel("P3", "A", "C1", "STANDARD", 300_000m); // different bldg type → different segment
        SeedParcel("P4", "B", "R1", "STANDARD", 300_000m); // different neighborhood → different segment

        var result = await _sut.DeriveAsync(study.StudyId, "tester");

        Assert.Equal(4, result.SegmentCount);
        Assert.Equal(4, result.TotalParcels);

        var types = _db.CountySegments.Select(s => s.SegmentType).Distinct().ToList();
        Assert.Contains(SegmentType.Residential, types);
        Assert.Contains(SegmentType.Commercial,  types);
    }

    [Fact]
    public async Task DeriveAsync_ComputesMedianRatio_FromSales()
    {
        var study = SeedStudy();
        // 5 parcels all at AssessedValue 285k. Sales prices chosen so ratios are exactly
        // 0.90, 0.93, 0.95, 0.97, 1.00 (median = 0.95).
        decimal[] prices = { 316_667m, 306_452m, 300_000m, 293_814m, 285_000m };
        for (var i = 0; i < 5; i++)
        {
            var id = $"P{i}";
            SeedParcel(id, "A", "R1", "STANDARD", assessedValue: 285_000m);
            SeedSale(id, prices[i]);
        }

        var result = await _sut.DeriveAsync(study.StudyId, "tester");

        var seg = _db.CountySegments.Single();
        Assert.Equal(5, seg.ParcelCount);
        Assert.NotNull(seg.MedianRatio);
        Assert.InRange((decimal)seg.MedianRatio!, 0.94m, 0.96m);
        // COD computed (sample ≥ 5).
        Assert.NotNull(seg.CoefficientOfDispersion);
        // PRD computed (sample ≥ 5).
        Assert.NotNull(seg.PriceRelatedDifferential);
        Assert.Equal(1, result.SegmentsWithRatios);
    }

    [Fact]
    public async Task DeriveAsync_FlagsExceptionCount_WhenRatioOutsideFence()
    {
        var study = SeedStudy();
        // Parcel with ratio 1.60 (AssessedValue 480k on a 300k sale) → outside [0.70, 1.30] fence.
        SeedParcel("P1", "A", "R1", "STANDARD", 480_000m);
        SeedSale("P1", 300_000m);
        // Normal parcel with ratio 0.95.
        SeedParcel("P2", "A", "R1", "STANDARD", 285_000m);
        SeedSale("P2", 300_000m);

        await _sut.DeriveAsync(study.StudyId, "tester");

        var seg = _db.CountySegments.Single();
        Assert.Equal(1, seg.ExceptionCount);
        // Risk score should reflect the exception fraction.
        Assert.True(seg.RiskScore > 20m, $"expected elevated risk for exception-carrying segment, got {seg.RiskScore}");
    }

    [Fact]
    public async Task DeriveAsync_PointsStudyAtNewBaseline()
    {
        var study = SeedStudy();
        SeedParcel("P1", "A", "R1", "STANDARD", 300_000m);

        var result = await _sut.DeriveAsync(study.StudyId, "tester");

        var reloaded = _db.CountyStudySessions.Single(s => s.StudyId == study.StudyId);
        Assert.Equal(result.SegmentSetId, reloaded.ActiveSegmentSetId);
    }

    [Fact]
    public async Task DeriveAsync_SecondInvocation_IncrementsVersion()
    {
        var study = SeedStudy();
        SeedParcel("P1", "A", "R1", "STANDARD", 300_000m);

        var r1 = await _sut.DeriveAsync(study.StudyId, "tester");
        var r2 = await _sut.DeriveAsync(study.StudyId, "tester");

        Assert.NotEqual(r1.SegmentSetId, r2.SegmentSetId);
        var sets = _db.CountySegmentSets.OrderBy(s => s.Version).ToList();
        Assert.Equal(2, sets.Count);
        Assert.Equal(1, sets[0].Version);
        Assert.Equal(2, sets[1].Version);
    }

    [Fact]
    public async Task DeriveAsync_UnknownStudyId_Throws()
    {
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.DeriveAsync(Guid.NewGuid(), "tester"));
    }

    [Fact]
    public async Task DeriveAsync_NullNeighborhoodAndQuality_GroupsUnderUnknown()
    {
        var study = SeedStudy();
        SeedParcel("P1", neighborhood: "", buildingType: "R1", qualityGrade: null, assessedValue: 300_000m);

        await _sut.DeriveAsync(study.StudyId, "tester");

        var seg = _db.CountySegments.Single();
        Assert.Contains("UNKNOWN", seg.Name);
        // RuleDefinition captures the grouping key as JSON for downstream diagnostics.
        Assert.NotNull(seg.RuleDefinition);
        var rule = JsonDocument.Parse(seg.RuleDefinition!).RootElement;
        Assert.Equal("UNKNOWN", rule.GetProperty("neighborhood").GetString());
        Assert.Equal("UNKNOWN", rule.GetProperty("qualityGrade").GetString());
    }
}
