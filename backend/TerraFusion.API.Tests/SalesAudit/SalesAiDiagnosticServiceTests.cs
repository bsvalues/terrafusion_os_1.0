// backend/TerraFusion.API.Tests/SalesAudit/SalesAiDiagnosticServiceTests.cs
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using Xunit;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.SalesAudit;

public sealed class SalesAiDiagnosticServiceTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly SalesAiDiagnosticService _sut;

    public SalesAiDiagnosticServiceTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new SalesAiDiagnosticService(_db, NullLogger<SalesAiDiagnosticService>.Instance);
    }

    public void Dispose() => _db.Dispose();

    private TerraFusion.Core.Entities.ComparableSale MakeSale(string parcel, decimal salePrice,
        DateTime? saleDate = null, string? wacCd = "A", string stratum = "400") => new()
    {
        Id = Guid.NewGuid(),
        CountyId = BentonId,
        ParcelId = parcel,
        SaleDate = saleDate ?? new DateTime(2025, 6, 1),
        SalePrice = salePrice,
        Neighborhood = stratum,
        RawWacCd = wacCd,
        QualificationDecision = null,
        IngestedBy = "test",
        IngestedAt = DateTime.UtcNow
    };

    private TerraFusion.Core.Entities.Property MakeProperty(string parcelId, decimal assessedValue) => new()
    {
        Id = Guid.NewGuid(),
        CountyId = BentonId,
        ParcelId = parcelId,
        PropertyId = parcelId,
        ParcelNumber = parcelId,
        Address = $"123 Test St ({parcelId})",
        PropertyType = "residential",
        TaxYear = 2025,
        AssessedValue = assessedValue,
        LandValue = 0m,
        ImprovementValue = 0m,
        MarketValue = assessedValue,
        AssessmentDate = new DateTime(2025, 1, 1),
        LastUpdated = DateTime.UtcNow,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    [Fact]
    public async SystemTask DateClusterRule_DetectsSharedRecordingDate()
    {
        var sharedDate = new DateTime(2025, 3, 14);
        var sales = new[]
        {
            MakeSale("P001", 100_000, sharedDate, wacCd: null),
            MakeSale("P002", 110_000, sharedDate, wacCd: null),
            MakeSale("P003", 105_000, sharedDate, wacCd: null),
            MakeSale("P004", 200_000, new DateTime(2025, 5, 1), wacCd: "A"),
            MakeSale("P005", 210_000, new DateTime(2025, 6, 1), wacCd: "A"),
        };
        _db.ComparableSales.AddRange(sales);
        await _db.SaveChangesAsync();

        var diagnosis = await _sut.DiagnoseStratumAsync(BentonId, 2025, "400");

        Assert.Equal("DATA_PROBLEM", diagnosis.PrimaryDiagnosis);
        Assert.Contains("DateCluster", diagnosis.FindingsJson);
    }

    [Fact]
    public async SystemTask MissingWacRule_FlagsOutlierWithNoWac()
    {
        var sales = new[]
        {
            MakeSale("P001", 200_000, wacCd: null),
            MakeSale("P002", 210_000, wacCd: "A"),
            MakeSale("P003", 205_000, wacCd: "A"),
            MakeSale("P004", 215_000, wacCd: "B"),
        };
        _db.ComparableSales.AddRange(sales);
        await _db.SaveChangesAsync();

        var diagnosis = await _sut.DiagnoseStratumAsync(BentonId, 2025, "400");

        Assert.Contains("MissingWac", diagnosis.FindingsJson);
    }

    [Fact]
    public async SystemTask DiagnoseStratum_EmptyStratum_ReturnsFlagForReview()
    {
        // No sales seeded for stratum "EMPTY"
        var diagnosis = await _sut.DiagnoseStratumAsync(BentonId, 2025, "EMPTY");

        Assert.NotNull(diagnosis);
        Assert.Equal(BentonId, diagnosis.CountyId);
        Assert.Equal("EMPTY", diagnosis.StratumKey);
    }

    [Fact]
    public async SystemTask Simulate_FactorAdjustment_ChangesMedianRatio()
    {
        // 5 sales where assessed = 0.90 × sale price → median ratio 0.90
        var saleData = new[] { 200_000m, 210_000m, 195_000m, 205_000m, 215_000m };
        foreach (var price in saleData)
        {
            var parcelId = $"P{price}";
            _db.Properties.Add(MakeProperty(parcelId, price * 0.90m));
            _db.ComparableSales.Add(MakeSale(parcelId, price, stratum: "SIM"));
        }
        await _db.SaveChangesAsync();

        // 1.11× factor should push ratio from ~0.90 to ~1.0
        var result = await _sut.SimulateAsync(BentonId, "SIM", 2025, factor: 1.11m);

        Assert.True(result.MedianRatio > 0.95m,
            $"Expected median ratio > 0.95, got {result.MedianRatio}");
        Assert.Equal(5, result.SaleCount);
    }

    [Fact]
    public async SystemTask Simulate_ExcludeSales_ReducesSaleCount()
    {
        var saleData = new[] { 200_000m, 210_000m, 195_000m };
        var saleIds = new List<Guid>();
        foreach (var price in saleData)
        {
            var parcelId = $"PE{price}";
            var saleId = Guid.NewGuid();
            saleIds.Add(saleId);
            _db.Properties.Add(MakeProperty(parcelId, price * 0.90m));
            _db.ComparableSales.Add(new TerraFusion.Core.Entities.ComparableSale
            {
                Id = saleId,
                CountyId = BentonId,
                ParcelId = parcelId,
                SaleDate = new DateTime(2025, 6, 1),
                SalePrice = price,
                Neighborhood = "EXCL",
                RawWacCd = "A",
                IngestedBy = "test",
                IngestedAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();

        // Exclude one sale
        var result = await _sut.SimulateAsync(BentonId, "EXCL", 2025,
            excludeSaleIds: new[] { saleIds[0] });

        Assert.Equal(2, result.SaleCount);
    }
}
