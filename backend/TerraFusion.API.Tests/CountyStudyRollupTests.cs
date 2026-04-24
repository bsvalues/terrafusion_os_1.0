// backend/TerraFusion.API.Tests/CountyStudyRollupTests.cs
//
// Task B — City + Neighborhood rollup tests. Mix of service-level tests
// (seed canonical data, invoke CountyStudyService, assert aggregates) and
// controller-level tests (Moq'd service, assert HTTP shape).
//
// Fixture: 2 cities × 3 neighborhoods × 2 segments per neighborhood, each
// segment with 5 parcels + 5 qualified sales. Metrics are hand-computed
// where possible so assertions are tight, not fuzzy.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class CountyStudyRollupTests : IDisposable
{
    private static readonly Guid CountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private const int TaxYear = 2026;

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly CountyStudyService _svc;
    private readonly CountyStudySegmentDerivationService _derive;

    public CountyStudyRollupTests()
    {
        _db     = TestDbContextFactory.CreateInMemoryContext();
        _svc    = new CountyStudyService(_db, new PassThroughCountyResolver());
        _derive = new CountyStudySegmentDerivationService(_db);
    }

    public void Dispose() => _db.Dispose();

    private sealed class PassThroughCountyResolver : ICountyResolver
    {
        public Task<Guid> ResolveAsync(string input, CancellationToken ct = default)
            => Task.FromResult(Guid.Parse(input));
        public Task<Guid?> TryResolveAsync(string input, CancellationToken ct = default)
            => Task.FromResult<Guid?>(Guid.TryParse(input, out var g) ? g : null);
    }

    // ── Seeding helpers ────────────────────────────────────────────────────

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

    private void SeedParcelWithSale(
        string parcelId,
        string neighborhood,
        string buildingType,
        string qualityGrade,
        string city,
        decimal assessedValue,
        decimal salePrice)
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
            SitusCity     = city,
        });
        _db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            Id           = Guid.NewGuid(),
            ParcelId     = parcelId,
            TaxYear      = TaxYear,
            BuildingType = buildingType,
            QualityGrade = qualityGrade,
            City         = city,
            SquareFeet   = 1800m,
            CountyId     = CountyId,
            UpdatedAt    = DateTime.UtcNow,
            UpdatedBy    = "test",
        });
        _db.ComparableSales.Add(new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = CountyId,
            ParcelId                    = parcelId,
            SaleDate                    = new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            SalesYear                   = 2025,
            QualificationRecommendation = "qualified",
        });
        _db.SaveChanges();
    }

    /// <summary>
    /// Builds a Benton-shaped fixture: 2 cities × 3 neighborhoods × 2 segments
    /// (R1/STANDARD + R1/GOOD) × 5 parcels per segment. Ratios are evenly
    /// distributed so medians land exactly on 0.95 per segment. Returns the
    /// derived study with ActiveSegmentSetId set.
    /// </summary>
    private async Task<CountyStudySession> SeedBentonFixture()
    {
        var study = SeedStudy();

        // Two cities; three neighborhoods per city.
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

        // Ratios 0.90, 0.93, 0.95, 0.97, 1.00 → median 0.95 per segment.
        decimal[] prices = { 316_667m, 306_452m, 300_000m, 293_814m, 285_000m };
        var parcelIdx = 0;
        foreach (var row in plan)
        {
            for (var i = 0; i < 5; i++)
            {
                SeedParcelWithSale(
                    parcelId:     $"P{parcelIdx++}",
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

    // ── Service tests ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetCityRollupAsync_EmptyStudy_Throws()
    {
        var study = SeedStudy();
        // No segments derived yet — study has no ActiveSegmentSetId.
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _svc.GetCityRollupAsync(study.StudyId));
        Assert.Contains("active segment set", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetCityRollupAsync_ReturnsTwoCities_SortedAndPopulated()
    {
        var study = await SeedBentonFixture();
        var rows = await _svc.GetCityRollupAsync(study.StudyId);

        Assert.Equal(2, rows.Count);
        // Sorted alphabetically: Kennewick before Richland.
        Assert.Equal("Kennewick", rows[0].City);
        Assert.Equal("Richland",  rows[1].City);

        foreach (var r in rows)
        {
            Assert.Equal(6,  r.SegmentCount);     // 3 neighborhoods × 2 segments
            Assert.Equal(30, r.ParcelCount);      // 6 segments × 5 parcels
            Assert.NotNull(r.MedianRatio);
            // Parcel-weighted median across 30 ratios spanning {0.90, 0.93, 0.95, 0.97, 1.00}
            // (6 copies each). Sorted middle (indices 14+15) both = 0.95.
            Assert.InRange((decimal)r.MedianRatio!, 0.94m, 0.96m);
            Assert.NotNull(r.Cod);
            Assert.NotNull(r.Prd);
            // No IAAO-fence exceptions in fixture.
            Assert.Equal(0, r.ExceptionCount);
            Assert.Equal(0m, r.ExceptionRate);
            // WorstSegment exists even at parity — algorithm returns SOME segment.
            Assert.NotNull(r.WorstSegmentName);
        }
    }

    [Fact]
    public async Task GetCityRollupAsync_ComplianceStatus_IsIaaoCompliantForHealthyFixture()
    {
        var study = await SeedBentonFixture();
        var rows = await _svc.GetCityRollupAsync(study.StudyId);

        foreach (var r in rows)
            Assert.Equal(nameof(RollupComplianceStatus.IaaoCompliant), r.ComplianceStatus);
    }

    [Fact]
    public async Task GetNeighborhoodRollupAsync_ReturnsSixHoodsUnfiltered()
    {
        var study = await SeedBentonFixture();
        var rows = await _svc.GetNeighborhoodRollupAsync(study.StudyId, cityFilter: null);

        Assert.Equal(6, rows.Count);
        // Sorted by code.
        Assert.Equal("NBHD-K1", rows[0].NeighborhoodCode);
        Assert.Equal("NBHD-R3", rows[5].NeighborhoodCode);

        foreach (var r in rows)
        {
            Assert.Equal(2,  r.SegmentCount);
            Assert.Equal(10, r.ParcelCount);  // 2 segments × 5 parcels
            Assert.NotNull(r.MedianRatio);
            Assert.InRange((decimal)r.MedianRatio!, 0.94m, 0.96m);
            // Stability + risk are parcel-weighted averages — within the [0,100] band.
            Assert.InRange(r.StabilityScore, 0m, 100m);
            Assert.InRange(r.RiskScore,      0m, 100m);
        }
    }

    [Fact]
    public async Task GetNeighborhoodRollupAsync_FiltersByCity()
    {
        var study = await SeedBentonFixture();
        var rows = await _svc.GetNeighborhoodRollupAsync(study.StudyId, cityFilter: "Kennewick");

        Assert.Equal(3, rows.Count);
        Assert.All(rows, r => Assert.Equal("Kennewick", r.City));
        Assert.All(rows, r => Assert.StartsWith("NBHD-K", r.NeighborhoodCode));
    }

    [Fact]
    public async Task GetNeighborhoodRollupAsync_CityFilterCaseInsensitive()
    {
        var study = await SeedBentonFixture();
        var rows = await _svc.GetNeighborhoodRollupAsync(study.StudyId, cityFilter: "kennewick");
        Assert.Equal(3, rows.Count);
    }

    [Fact]
    public async Task GetCityRollupAsync_HandComputedMedian_ForSingleCityFixture()
    {
        // Single city, single segment, 5 parcels with ratios 0.90, 0.93, 0.95, 0.97, 1.00.
        // Median = 0.95 (middle sorted value).
        var study = SeedStudy();
        decimal[] prices = { 316_667m, 306_452m, 300_000m, 293_814m, 285_000m };
        for (var i = 0; i < 5; i++)
        {
            SeedParcelWithSale(
                parcelId:     $"P{i}",
                neighborhood: "NBHD-A",
                buildingType: "R1",
                qualityGrade: "STANDARD",
                city:         "Pasco",
                assessedValue: 285_000m,
                salePrice:     prices[i]);
        }
        await _derive.DeriveAsync(study.StudyId, "tester");

        var rows = await _svc.GetCityRollupAsync(study.StudyId);
        var pasco = Assert.Single(rows);
        Assert.Equal("Pasco", pasco.City);
        Assert.Equal(5, pasco.ParcelCount);
        Assert.NotNull(pasco.MedianRatio);
        Assert.InRange((decimal)pasco.MedianRatio!, 0.94m, 0.96m);
    }

    [Fact]
    public async Task GetNeighborhoodRollupAsync_MissingStudy_Throws()
    {
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _svc.GetNeighborhoodRollupAsync(Guid.NewGuid(), null));
    }

    // ── Controller tests (HTTP surface) ────────────────────────────────────

    private static CountyStudyController BuildController(ICountyStudyService svc)
    {
        var resolver = new Mock<ICountyResolver>();
        resolver
            .Setup(r => r.ResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((s, _) => Task.FromResult(Guid.Parse(s)));
        var derive = new Mock<ICountyStudySegmentDerivationService>();
        return new(svc, resolver.Object, derive.Object, NullLogger<CountyStudyController>.Instance);
    }

    [Fact]
    public async Task CityRollupController_Returns200_WithList()
    {
        var svcMock = new Mock<ICountyStudyService>();
        var expected = new List<CityRollupRowDto>
        {
            new("Kennewick", 6, 30, 0.95m, 3.0m, 1.0m, 0, 0m, "NBHD-K1 · R1 · STANDARD", 0.95m, nameof(RollupComplianceStatus.IaaoCompliant)),
            new("Richland",  6, 30, 0.95m, 3.0m, 1.0m, 0, 0m, "NBHD-R1 · R1 · STANDARD", 0.95m, nameof(RollupComplianceStatus.IaaoCompliant)),
        };
        svcMock.Setup(s => s.GetCityRollupAsync(It.IsAny<Guid>())).ReturnsAsync(expected);

        var controller = BuildController(svcMock.Object);
        var result = await controller.GetCityRollup(Guid.NewGuid());

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<List<CityRollupRowDto>>(ok.Value);
        Assert.Equal(2, list.Count);
        Assert.Equal("Kennewick", list[0].City);
    }

    [Fact]
    public async Task CityRollupController_Returns409_WhenNoActiveSegmentSet()
    {
        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.GetCityRollupAsync(It.IsAny<Guid>()))
               .ThrowsAsync(new InvalidOperationException("Study x has no active segment set. Derive first."));

        var controller = BuildController(svcMock.Object);
        var result = await controller.GetCityRollup(Guid.NewGuid());

        var conflict = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(409, conflict.StatusCode);
    }

    [Fact]
    public async Task NeighborhoodRollupController_PropagatesCityFilter()
    {
        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.GetNeighborhoodRollupAsync(It.IsAny<Guid>(), "Kennewick"))
               .ReturnsAsync(new List<NeighborhoodRollupRowDto>
               {
                   new("NBHD-K1", "NBHD-K1", "Kennewick", 2, 10, 0.95m, 3.0m, 1.0m, 85m, 22m, 0, 0m, nameof(RollupComplianceStatus.IaaoCompliant)),
               });

        var controller = BuildController(svcMock.Object);
        var result = await controller.GetNeighborhoodRollup(Guid.NewGuid(), "Kennewick");

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<List<NeighborhoodRollupRowDto>>(ok.Value);
        var row = Assert.Single(list);
        Assert.Equal("Kennewick", row.City);
        svcMock.Verify(s => s.GetNeighborhoodRollupAsync(It.IsAny<Guid>(), "Kennewick"), Times.Once);
    }

    [Fact]
    public async Task NeighborhoodRollupController_Returns409_WhenNoActiveSegmentSet()
    {
        var svcMock = new Mock<ICountyStudyService>();
        svcMock.Setup(s => s.GetNeighborhoodRollupAsync(It.IsAny<Guid>(), It.IsAny<string?>()))
               .ThrowsAsync(new InvalidOperationException("Study x has no active segment set. Please derive."));

        var controller = BuildController(svcMock.Object);
        var result = await controller.GetNeighborhoodRollup(Guid.NewGuid(), null);

        var conflict = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(409, conflict.StatusCode);
    }
}
