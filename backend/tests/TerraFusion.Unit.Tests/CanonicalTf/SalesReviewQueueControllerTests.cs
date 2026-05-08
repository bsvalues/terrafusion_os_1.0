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
using TerraFusion.Core.Sync.SalesReview;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice F2 acceptance tests for
/// <see cref="SalesReviewQueueController"/>. Auth + reader-delegation
/// coverage; the predicate / lookback / era logic is covered in
/// <see cref="SalesReviewReaderTests"/>.
/// </summary>
public sealed class SalesReviewQueueControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("22220022-2222-2222-2222-222222222222");

    private static readonly DateTime FrozenNow =
        new(2025, 6, 15, 12, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;

    public SalesReviewQueueControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f2-ctrl-{Guid.NewGuid():N}")
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

    private SalesReviewQueueController BuildController(Guid? principalCountyClaim)
    {
        var reader = new SalesReviewReader(_db, () => FrozenNow);
        var ctrl = new SalesReviewQueueController(
            reader, NullLogger<SalesReviewQueueController>.Instance);

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

    private async Task SeedSaleAsync(
        Guid countyId,
        DateTime slDt,
        bool dorQualified,
        bool countyReviewed,
        string? era = ConversionEras.PostConversion)
    {
        _db.TfSales.Add(new TfSale
        {
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            ChgOfOwnerId = Guid.NewGuid().GetHashCode(),
            SlDt = slDt,
            SlPrice = 250_000m,
            AdjSlPrice = 250_000m,
            SaleQualified = false,
            DorRatioQualified = dorQualified,
            CountyRatioReviewed = countyReviewed,
            PromotionLoadBatchId = Guid.NewGuid(),
            ConversionEra = era,
        });
        await _db.SaveChangesAsync();
    }

    private static T ExtractProperty<T>(object? body, string name)
    {
        body.Should().NotBeNull();
        var prop = body!.GetType().GetProperty(
            name, BindingFlags.Public | BindingFlags.Instance);
        prop.Should().NotBeNull($"response body should expose '{name}'");
        var value = prop!.GetValue(body);
        value.Should().BeOfType<T>();
        return (T)value!;
    }

    [Fact]
    public async Task ReviewQueue_DefaultsAreEchoedInResponse()
    {
        await SeedSaleAsync(CountyA,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetReviewQueue();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<Guid>(ok.Value, nameof(SalesReviewQueueResponse.CountyId))
            .Should().Be(CountyA);
        ExtractProperty<int>(ok.Value, nameof(SalesReviewQueueResponse.LookbackYears))
            .Should().Be(ISalesReviewReader.DefaultLookbackYears);
        ExtractProperty<string>(ok.Value, nameof(SalesReviewQueueResponse.Era))
            .Should().Be(ConversionEras.PostConversion);
        ExtractProperty<int>(ok.Value, nameof(SalesReviewQueueResponse.Count))
            .Should().Be(1);
    }

    [Fact]
    public async Task ReviewQueue_NoCountyClaim_Returns403()
    {
        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetReviewQueue();
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task ReviewQueue_InvalidEra_Returns400()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetReviewQueue(era: "BOGUS");
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData(ConversionEras.PostConversion)]
    [InlineData(ConversionEras.PreConversion2017)]
    [InlineData(ConversionEras.Unknown)]
    [InlineData(ISalesReviewReader.EraAll)]
    public async Task ReviewQueue_RecognizedEras_Accepted(string era)
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetReviewQueue(era: era);
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ReviewQueue_TrimsEraWhitespace()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetReviewQueue(era: "  POST_CONVERSION  ");
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, nameof(SalesReviewQueueResponse.Era))
            .Should().Be(ConversionEras.PostConversion);
    }

    [Fact]
    public async Task ReviewQueue_MaxResultsClampsAboveCap()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetReviewQueue(
            maxResults: ISalesReviewReader.MaxResultsHardCap + 5_000);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<int>(ok.Value, nameof(SalesReviewQueueResponse.MaxResults))
            .Should().Be(ISalesReviewReader.MaxResultsHardCap);
    }

    [Fact]
    public async Task ReviewQueue_OnlyReturnsCallersCounty()
    {
        var otherCounty = Guid.NewGuid();
        await SeedSaleAsync(CountyA,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true);
        await SeedSaleAsync(otherCounty,
            slDt: FrozenNow.AddYears(-1),
            dorQualified: false, countyReviewed: true);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetReviewQueue();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<int>(ok.Value, nameof(SalesReviewQueueResponse.Count))
            .Should().Be(1, "the other county's sale must not leak into this response");
    }
}
