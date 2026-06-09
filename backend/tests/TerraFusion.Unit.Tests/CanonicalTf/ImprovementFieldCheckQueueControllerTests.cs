using System;
using System.Collections.Generic;
using System.Reflection;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
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
/// <see cref="ImprovementFieldCheckQueueController"/>. Auth +
/// boundary-validation coverage; the filter behavior itself is fully
/// covered by <see cref="ImprovementFieldCheckReaderTests"/>.
/// </summary>
public sealed class ImprovementFieldCheckQueueControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CountyB =
        Guid.Parse("22222222-2222-2222-2222-222222222222");

    private readonly TerraFusionDbContext _db;

    public ImprovementFieldCheckQueueControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f3-ctrl-{Guid.NewGuid():N}")
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

    private ImprovementFieldCheckQueueController BuildController(Guid? principalCountyClaim)
    {
        var reader = new ImprovementFieldCheckReader(_db);
        var ctrl = new ImprovementFieldCheckQueueController(
            reader,
            NullLogger<ImprovementFieldCheckQueueController>.Instance);

        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
            },
        };
        return ctrl;
    }

    private async Task<Guid> SeedImprovementAsync(
        Guid countyId,
        string? universe,
        string? era,
        short? yearBuilt = 1995)
    {
        var id = Guid.NewGuid();
        _db.TfImprovements.Add(new TfImprovement
        {
            TfImprovementId = id,
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            ImprvTypeCd = "R",
            ImprvDesc = "Stick-built",
            YearBuilt = yearBuilt,
            EffectiveYearBuilt = yearBuilt,
            UniverseCode = universe,
            ConversionEra = era,
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
        return id;
    }

    /// <summary>
    /// The controller wraps each response in an anonymous-type
    /// projection (countyId, era, items, ...). Reflection-extract
    /// keeps tests independent of those types.
    /// </summary>
    private static T ExtractProperty<T>(object? body, string name)
    {
        body.Should().NotBeNull();
        var prop = body!.GetType().GetProperty(
            name, BindingFlags.Public | BindingFlags.Instance);
        prop.Should().NotBeNull($"response body should expose '{name}'");
        var value = prop!.GetValue(body);
        if (value is null)
        {
            // Allow nullable extracted types
            default(T).Should().BeAssignableTo<T?>();
            return default!;
        }
        value.Should().BeAssignableTo<T>();
        return (T)value!;
    }

    [Fact]
    public async Task GetFieldCheckQueue_NoCountyClaim_Returns403()
    {
        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetFieldCheckQueue();

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetFieldCheckQueue_InvalidUniverse_Returns400()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue(universe: "BOGUS_UNIVERSE");

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetFieldCheckQueue_InvalidEra_Returns400()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue(era: "BOGUS_ERA");

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetFieldCheckQueue_DefaultEra_ResolvesPostConversion()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PreConversion2017);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ConversionEras.PostConversion);
        var items = ExtractProperty<IReadOnlyList<ImprovementFieldCheckItem>>(
            ok.Value, "items");
        items.Should().HaveCount(1, "default POST excludes pre-conversion row");
    }

    [Fact]
    public async Task GetFieldCheckQueue_UniverseFilter_NarrowsResults()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealCommercial, ConversionEras.PostConversion);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue(
            universe: UniverseCodes.RealCommercial);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var items = ExtractProperty<IReadOnlyList<ImprovementFieldCheckItem>>(
            ok.Value, "items");
        items.Should().HaveCount(1);
        items[0].UniverseCode.Should().Be(UniverseCodes.RealCommercial);
    }

    [Fact]
    public async Task GetFieldCheckQueue_EraAll_BypassesFilter()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PreConversion2017);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue(
            era: IImprovementFieldCheckReader.EraAll);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(IImprovementFieldCheckReader.EraAll);
        var items = ExtractProperty<IReadOnlyList<ImprovementFieldCheckItem>>(
            ok.Value, "items");
        items.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetFieldCheckQueue_CountyIsolation_OtherCountyInvisible()
    {
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);
        await SeedImprovementAsync(
            CountyB, UniverseCodes.RealResidential, ConversionEras.PostConversion);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var items = ExtractProperty<IReadOnlyList<ImprovementFieldCheckItem>>(
            ok.Value, "items");
        items.Should().HaveCount(1, "County B's improvement is not visible to County A");
    }

    [Fact]
    public async Task GetFieldCheckQueue_EmptyResults_ReturnsOkWithEmptyList()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var items = ExtractProperty<IReadOnlyList<ImprovementFieldCheckItem>>(
            ok.Value, "items");
        items.Should().BeEmpty("empty queue surfaces 200 not 404");
    }

    [Fact]
    public async Task GetFieldCheckQueue_EchoesCountyClaimNotPathSegment()
    {
        // F3 is claim-driven (no countyId path segment) so the
        // sovereign-county scope is the principal's claim alone.
        await SeedImprovementAsync(
            CountyA, UniverseCodes.RealResidential, ConversionEras.PostConversion);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetFieldCheckQueue();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<Guid>(ok.Value, "countyId").Should().Be(CountyA);
    }
}
