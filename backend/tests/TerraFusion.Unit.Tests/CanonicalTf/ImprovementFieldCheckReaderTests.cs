using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.ImprovementFieldCheck;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Block F3 acceptance tests for
/// <see cref="ImprovementFieldCheckReader"/>. Proves the reader's
/// universe / era / missingFeaturesOnly / yearBuilt-range filters
/// behave per the F3 contract over
/// <c>canonical_tf.tf_improvement</c> + <c>tf_improvement_feature</c>.
/// </summary>
public sealed class ImprovementFieldCheckReaderTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid CountyB =
        Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid AttributeIdSeed =
        Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private readonly TerraFusionDbContext _db;

    public ImprovementFieldCheckReaderTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f3-{Guid.NewGuid():N}")
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

    private ImprovementFieldCheckReader Build() => new(_db);

    private async Task<Guid> SeedImprovementAsync(
        Guid countyId,
        string? universe,
        string? era,
        short? yearBuilt = 1995,
        string? imprvTypeCd = "R",
        string? imprvDesc = "Stick-built")
    {
        var id = Guid.NewGuid();
        _db.TfImprovements.Add(new TfImprovement
        {
            TfImprovementId = id,
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            ImprvTypeCd = imprvTypeCd,
            ImprvDesc = imprvDesc,
            YearBuilt = yearBuilt,
            EffectiveYearBuilt = yearBuilt,
            UniverseCode = universe,
            ConversionEra = era,
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
        return id;
    }

    private async Task SeedFeatureAsync(
        Guid tfImprovementId,
        Guid? attributeId)
    {
        _db.TfImprovementFeatures.Add(new TfImprovementFeature
        {
            TfImprovementId = tfImprovementId,
            FeatureCode = "BSMT",
            AttributeId = attributeId,
            SourceImprvDetailLandedRowId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task UniverseFilter_ScopesResults()
    {
        var residential = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        var commercial = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealCommercial, ConversionEras.PostConversion);

        var result = await Build().GetFieldCheckQueueAsync(
            CountyA, universeCode: UniverseCodes.RealResidential);

        result.Should().HaveCount(1);
        result[0].TfImprovementId.Should().Be(residential);
        result[0].UniverseCode.Should().Be(UniverseCodes.RealResidential);
    }

    [Fact]
    public async Task UniverseFilter_NullReturnsAllUniverses()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.MobileHome, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.PersonalProperty, ConversionEras.PostConversion);

        var result = await Build().GetFieldCheckQueueAsync(CountyA);

        result.Should().HaveCount(3);
    }

    [Fact]
    public async Task UniverseFilter_InvalidValue_Throws()
    {
        var act = async () => await Build().GetFieldCheckQueueAsync(
            CountyA, universeCode: "BOGUS_UNIVERSE");

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task MissingFeaturesOnly_ExcludesImprovementsWithAnyAttributedFeature()
    {
        var noFeatures = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1980);

        var unattributed = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1985);
        await SeedFeatureAsync(unattributed, attributeId: null);
        await SeedFeatureAsync(unattributed, attributeId: null);

        var partiallyAttributed = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1990);
        await SeedFeatureAsync(partiallyAttributed, attributeId: AttributeIdSeed);
        await SeedFeatureAsync(partiallyAttributed, attributeId: null);

        var fullyAttributed = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 2000);
        await SeedFeatureAsync(fullyAttributed, attributeId: AttributeIdSeed);

        var result = await Build().GetFieldCheckQueueAsync(
            CountyA, missingFeaturesOnly: true);

        var ids = result.Select(r => r.TfImprovementId).ToHashSet();
        ids.Should().Contain(noFeatures);
        ids.Should().Contain(unattributed);
        ids.Should().NotContain(partiallyAttributed,
            "any attributed feature disqualifies the improvement from missing-only");
        ids.Should().NotContain(fullyAttributed);
    }

    [Fact]
    public async Task ReviewReason_ReflectsAttributionState()
    {
        var noFeatures = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1980);

        var unattributed = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1985);
        await SeedFeatureAsync(unattributed, attributeId: null);

        var partial = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1990);
        await SeedFeatureAsync(partial, attributeId: AttributeIdSeed);
        await SeedFeatureAsync(partial, attributeId: null);

        var full = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 2000);
        await SeedFeatureAsync(full, attributeId: AttributeIdSeed);

        var result = await Build().GetFieldCheckQueueAsync(CountyA);
        var byId = result.ToDictionary(r => r.TfImprovementId, r => r);

        byId[noFeatures].ReviewReason.Should().Be("NO_FEATURES");
        byId[unattributed].ReviewReason.Should().Be("NO_ATTRIBUTED_FEATURES");
        byId[partial].ReviewReason.Should().Be("PARTIAL_ATTRIBUTION");
        byId[full].ReviewReason.Should().Be("FULLY_ATTRIBUTED");
    }

    [Fact]
    public async Task EraFilter_DefaultsToPostConversion()
    {
        var post = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        var pre = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PreConversion2017);
        var unknownEra = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.Unknown);

        var result = await Build().GetFieldCheckQueueAsync(CountyA);

        var ids = result.Select(r => r.TfImprovementId).ToHashSet();
        ids.Should().Contain(post);
        ids.Should().NotContain(pre);
        ids.Should().NotContain(unknownEra);
    }

    [Fact]
    public async Task EraFilter_AllBypassesFilter_IncludesNullEra()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PreConversion2017);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, era: null);

        var result = await Build().GetFieldCheckQueueAsync(
            CountyA, era: IImprovementFieldCheckReader.EraAll);

        result.Should().HaveCount(3, "ALL bypasses including NULL-era rows");
    }

    [Fact]
    public async Task EraFilter_InvalidValue_Throws()
    {
        var act = async () => await Build().GetFieldCheckQueueAsync(
            CountyA, era: "BOGUS_ERA");

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task CountyIsolation_EnforcedByReader()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyB, UniverseCodes.RealResidential, ConversionEras.PostConversion);

        var resultA = await Build().GetFieldCheckQueueAsync(CountyA);
        var resultB = await Build().GetFieldCheckQueueAsync(CountyB);

        resultA.Should().HaveCount(1);
        resultB.Should().HaveCount(1);
        resultA[0].TfImprovementId.Should().NotBe(resultB[0].TfImprovementId);
    }

    [Fact]
    public async Task YearBuiltRange_FiltersAndIncludesEndpoints()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1950);
        var inRangeLow = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1980);
        var inRangeHigh = await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 2010);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 2025);

        var result = await Build().GetFieldCheckQueueAsync(
            CountyA, minYearBuilt: 1980, maxYearBuilt: 2010);

        var ids = result.Select(r => r.TfImprovementId).ToHashSet();
        ids.Should().HaveCount(2);
        ids.Should().Contain(inRangeLow);
        ids.Should().Contain(inRangeHigh);
    }

    [Fact]
    public async Task MaxResults_ClampedToHardCeiling()
    {
        for (int i = 0; i < 10; i++)
        {
            await SeedImprovementAsync(
                CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
                yearBuilt: (short)(1900 + i));
        }

        var huge = await Build().GetFieldCheckQueueAsync(
            CountyA, maxResults: 50_000);
        huge.Should().HaveCount(10, "ceiling clamps but the underlying set is small");

        var tiny = await Build().GetFieldCheckQueueAsync(
            CountyA, maxResults: 3);
        tiny.Should().HaveCount(3);
    }

    [Fact]
    public async Task Ordering_OldestYearBuiltFirst()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 2000);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1950);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion,
            yearBuilt: 1980);

        var result = await Build().GetFieldCheckQueueAsync(CountyA);

        result.Select(r => r.YearBuilt).Should().ContainInOrder(
            (short)1950, (short)1980, (short)2000);
    }

    [Fact]
    public async Task UnknownUniverse_AcceptedAsValidFilter()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.Unknown, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);

        var result = await Build().GetFieldCheckQueueAsync(
            CountyA, universeCode: UniverseCodes.Unknown);

        result.Should().HaveCount(1);
        result[0].UniverseCode.Should().Be(UniverseCodes.Unknown);
    }
}
