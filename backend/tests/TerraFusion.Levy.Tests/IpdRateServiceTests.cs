using FluentAssertions;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using TerraFusion.Levy.Services;
using Xunit;

namespace TerraFusion.Levy.Tests;

public class IpdRateServiceTests
{
    private IpdRateService CreateService(LevyDbContext db)
    {
        return new IpdRateService(db);
    }

    [Fact]
    public async Task GetLimitFactor_NoSeededData_FallsBackToStatutoryCap()
    {
        // RCW 84.55.005: when no IPD data, use 1.01 (statutory cap)
        var db = TestLevyDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.GetLimitFactorAsync(2026);

        result.LimitFactor.Should().Be(1.01m);
        result.DataSeeded.Should().BeFalse();
        result.IpdPercent.Should().BeNull();
    }

    [Fact]
    public async Task GetLimitFactor_WithSeededData_HighIpd_CapsAt101()
    {
        // IPD of 4.24% → limit factor = min(1.01, 1 + 0.0424) = 1.01 (capped)
        var db = TestLevyDbContextFactory.Create();
        db.ReferenceSources.Add(new ReferenceSource
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            SourceType = ReferenceSourceType.Ipd,
            TaxYear = 2026,
            DistrictCode = null,
            IsActive = true,
            Value = 4.24m,
            Citation = "WA OFM September 2025 Memo",
            IssuedBy = "WA OFM",
            IssuedDate = new DateTime(2025, 9, 1),
            IngestedAt = DateTime.UtcNow,
            IngestedBy = "seed"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GetLimitFactorAsync(2026);

        result.DataSeeded.Should().BeTrue();
        result.IpdPercent.Should().Be(4.24m);
        // min(1.01, 1 + 0.0424) = 1.01
        result.LimitFactor.Should().Be(1.01m);
    }

    [Fact]
    public async Task GetLimitFactor_LowIpd_UsesActualRate()
    {
        // IPD of 0.5% → limit factor = min(1.01, 1 + 0.005) = 1.005 (below cap)
        var db = TestLevyDbContextFactory.Create();
        db.ReferenceSources.Add(new ReferenceSource
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            SourceType = ReferenceSourceType.Ipd,
            TaxYear = 2025,
            DistrictCode = null,
            IsActive = true,
            Value = 0.5m,
            Citation = "WA OFM September 2024 Memo",
            IssuedBy = "WA OFM",
            IssuedDate = new DateTime(2024, 9, 1),
            IngestedAt = DateTime.UtcNow,
            IngestedBy = "seed"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var result = await service.GetLimitFactorAsync(2025);

        result.DataSeeded.Should().BeTrue();
        result.LimitFactor.Should().Be(1.005m);
    }

    [Fact]
    public async Task GetAllRates_EmptyDb_ReturnsEmptyList()
    {
        var db = TestLevyDbContextFactory.Create();
        var service = CreateService(db);

        var rates = await service.GetAllRatesAsync();

        rates.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllRates_WithData_ReturnsOrderedByYearDesc()
    {
        var db = TestLevyDbContextFactory.Create();
        db.ReferenceSources.AddRange(
            new ReferenceSource
            {
                Id = Guid.NewGuid(), CountyId = "benton",
                SourceType = ReferenceSourceType.Ipd,
                TaxYear = 2024, IsActive = true, Value = 3.5m,
                Citation = "WA OFM 2023", IssuedBy = "WA OFM",
                IssuedDate = new DateTime(2023, 9, 1),
                IngestedAt = DateTime.UtcNow, IngestedBy = "seed"
            },
            new ReferenceSource
            {
                Id = Guid.NewGuid(), CountyId = "benton",
                SourceType = ReferenceSourceType.Ipd,
                TaxYear = 2026, IsActive = true, Value = 4.24m,
                Citation = "WA OFM 2025", IssuedBy = "WA OFM",
                IssuedDate = new DateTime(2025, 9, 1),
                IngestedAt = DateTime.UtcNow, IngestedBy = "seed"
            },
            new ReferenceSource
            {
                Id = Guid.NewGuid(), CountyId = "benton",
                SourceType = ReferenceSourceType.Ipd,
                TaxYear = 2025, IsActive = true, Value = 2.1m,
                Citation = "WA OFM 2024", IssuedBy = "WA OFM",
                IssuedDate = new DateTime(2024, 9, 1),
                IngestedAt = DateTime.UtcNow, IngestedBy = "seed"
            }
        );
        await db.SaveChangesAsync();

        var service = CreateService(db);

        var rates = await service.GetAllRatesAsync();

        rates.Should().HaveCount(3);
        rates[0].TaxYear.Should().Be(2026);
        rates[1].TaxYear.Should().Be(2025);
        rates[2].TaxYear.Should().Be(2024);
    }
}
