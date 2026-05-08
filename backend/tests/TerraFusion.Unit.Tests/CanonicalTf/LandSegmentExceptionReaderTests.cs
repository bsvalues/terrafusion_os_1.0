using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.LandSegmentException;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice F4 acceptance tests for
/// <see cref="LandSegmentExceptionReader"/>. Per
/// <c>docs/pacs/blocks-d-through-h-design.md</c> §F.4.
///
/// <para>Proves the reader's anomaly taxonomy is correctly
/// applied: each of the four reasons (MissingMarketVal,
/// MissingArea, MissingTypeCd, MissingStateCd) fires
/// independently, multi-anomaly rows produce comma-joined
/// reason strings, clean rows are excluded, county isolation
/// is honored, and the era filter produces the same shape as
/// <see cref="SalesRatioStudyReader"/> v1.12.</para>
/// </summary>
public sealed class LandSegmentExceptionReaderTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public LandSegmentExceptionReaderTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f4-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private LandSegmentExceptionReader Build() => new(_db);

    private async Task<TfLand> SeedLandAsync(
        Guid countyId,
        decimal? marketVal,
        decimal? sizeAcres,
        string? typeCd,
        string? stateCd,
        string? era = ConversionEras.PostConversion,
        Guid? tfParcelId = null,
        Guid? tfLandId = null)
    {
        var land = new TfLand
        {
            TfLandId = tfLandId ?? Guid.NewGuid(),
            CountyId = countyId,
            TfParcelId = tfParcelId ?? Guid.NewGuid(),
            LandSegTypeCd = typeCd,
            LandSegStateCd = stateCd,
            SizeAcres = sizeAcres,
            LandSegMarketVal = marketVal,
            ConversionEra = era,
            PromotionLoadBatchId = Guid.NewGuid(),
        };
        _db.TfLands.Add(land);
        await _db.SaveChangesAsync();
        return land;
    }

    [Fact]
    public async Task NullMarketVal_FlaggedMissingMarketVal()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be(ILandSegmentExceptionReader.ReasonMissingMarketVal);
        items[0].LandSegMarketVal.Should().BeNull();
    }

    [Fact]
    public async Task NullAcres_FlaggedMissingArea()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: 100_000m, sizeAcres: null, typeCd: "RES", stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be(ILandSegmentExceptionReader.ReasonMissingArea);
    }

    [Fact]
    public async Task ZeroAcres_FlaggedMissingArea()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: 100_000m, sizeAcres: 0m, typeCd: "RES", stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be(ILandSegmentExceptionReader.ReasonMissingArea);
        items[0].AreaAcres.Should().Be(0m);
    }

    [Fact]
    public async Task NullTypeCd_FlaggedMissingTypeCd()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: 100_000m, sizeAcres: 5m, typeCd: null, stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be(ILandSegmentExceptionReader.ReasonMissingTypeCd);
    }

    [Fact]
    public async Task EmptyTypeCd_FlaggedMissingTypeCd()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: 100_000m, sizeAcres: 5m, typeCd: string.Empty, stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be(ILandSegmentExceptionReader.ReasonMissingTypeCd);
    }

    [Fact]
    public async Task NullStateCd_FlaggedMissingStateCd()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: 100_000m, sizeAcres: 5m, typeCd: "RES", stateCd: null);

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be(ILandSegmentExceptionReader.ReasonMissingStateCd);
    }

    [Fact]
    public async Task EmptyStateCd_FlaggedMissingStateCd()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: 100_000m, sizeAcres: 5m, typeCd: "RES", stateCd: string.Empty);

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be(ILandSegmentExceptionReader.ReasonMissingStateCd);
    }

    [Fact]
    public async Task MultipleAnomalies_JoinedInDoctrineOrder()
    {
        var county = Guid.NewGuid();
        // All four anomalies fire on this row.
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 0m, typeCd: null, stateCd: null);

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be("MissingMarketVal,MissingArea,MissingTypeCd,MissingStateCd",
                "doctrine order is MarketVal, Area, TypeCd, StateCd");
    }

    [Fact]
    public async Task PartialAnomalies_OnlyFiringReasonsListed()
    {
        var county = Guid.NewGuid();
        // MarketVal + StateCd missing; Area + TypeCd present.
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: null);

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].ExceptionReasons.Should()
            .Be("MissingMarketVal,MissingStateCd");
    }

    [Fact]
    public async Task CleanRow_Excluded()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: 100_000m, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county);

        items.Should().BeEmpty(
            "rows with no anomalies must be filtered out");
    }

    [Fact]
    public async Task CountyIsolation_OtherCountiesExcluded()
    {
        var benton = Guid.NewGuid();
        var franklin = Guid.NewGuid();
        await SeedLandAsync(benton,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");
        await SeedLandAsync(franklin,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");

        var items = await Build().GetExceptionsAsync(benton);

        items.Should().HaveCount(1, "only the requested county's rows return");
    }

    [Fact]
    public async Task EraFilter_DefaultPostConversion()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA",
            era: ConversionEras.PostConversion);
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA",
            era: ConversionEras.PreConversion2017);

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1,
            "default era=POST_CONVERSION excludes the PRE row");
    }

    [Fact]
    public async Task EraFilter_AllBypasses()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA",
            era: ConversionEras.PostConversion);
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA",
            era: ConversionEras.PreConversion2017);
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA",
            era: ConversionEras.Unknown);

        var items = await Build()
            .GetExceptionsAsync(county, era: ILandSegmentExceptionReader.EraAll);

        items.Should().HaveCount(3,
            "ALL bypasses the era filter regardless of column value");
    }

    [Fact]
    public async Task EraFilter_PreConversionExplicit()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA",
            era: ConversionEras.PostConversion);
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA",
            era: ConversionEras.PreConversion2017);

        var items = await Build()
            .GetExceptionsAsync(county, era: ConversionEras.PreConversion2017);

        items.Should().HaveCount(1);
    }

    [Fact]
    public async Task EraFilter_InvalidThrows()
    {
        var county = Guid.NewGuid();

        var act = () => Build().GetExceptionsAsync(county, era: "BOGUS");

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task MaxResults_RespectsLimit()
    {
        var county = Guid.NewGuid();
        for (var i = 0; i < 5; i++)
        {
            await SeedLandAsync(county,
                marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");
        }

        var items = await Build().GetExceptionsAsync(county, maxResults: 3);

        items.Should().HaveCount(3);
    }

    [Fact]
    public async Task MaxResults_ClampedToAbsoluteCeiling()
    {
        var county = Guid.NewGuid();
        // Reader clamps caller-supplied maxResults > AbsoluteMaxResults.
        // We don't seed 1001 rows; we seed 2 and assert the call doesn't
        // error and returns what's there.
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county, maxResults: 5000);

        items.Should().HaveCount(2);
    }

    [Fact]
    public async Task MaxResults_ZeroOrNegativeReturnsEmpty()
    {
        var county = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 5m, typeCd: "RES", stateCd: "WA");

        var items = await Build().GetExceptionsAsync(county, maxResults: 0);

        items.Should().BeEmpty();
    }

    [Fact]
    public async Task ItemPayload_PropagatesAllExpectedColumns()
    {
        var county = Guid.NewGuid();
        var tfLandId = Guid.NewGuid();
        var tfParcelId = Guid.NewGuid();
        await SeedLandAsync(county,
            marketVal: null, sizeAcres: 1.25m, typeCd: "AG", stateCd: "WA",
            tfLandId: tfLandId, tfParcelId: tfParcelId);

        var items = await Build().GetExceptionsAsync(county);

        items.Should().HaveCount(1);
        items[0].TfLandId.Should().Be(tfLandId);
        items[0].TfParcelId.Should().Be(tfParcelId);
        items[0].LandSegTypeCd.Should().Be("AG");
        items[0].LandSegStateCd.Should().Be("WA");
        items[0].AreaAcres.Should().Be(1.25m);
        items[0].LandSegMarketVal.Should().BeNull();
    }
}
