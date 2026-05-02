using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs.CanonicalTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice S4 controller tests for
/// <c>GET /api/sales?countyId={id}&amp;page&amp;pageSize</c>.
/// Pattern: real EF InMemory, claims principal injection, no
/// network. Asserts the C39-A pagination contract + the S4 county-
/// isolation contract.
/// </summary>
public sealed class TfSalesControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB =
        Guid.Parse("20200020-2020-2020-2020-202020202020");

    private readonly TerraFusionDbContext _db;

    public TfSalesControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"s4-{Guid.NewGuid():N}")
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

    private TfSalesController BuildController(Guid? principalCountyClaim)
    {
        var reader = new TfSaleReader(_db);
        var ctrl = new TfSalesController(reader, NullLogger<TfSalesController>.Instance);

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
        long chgOfOwnerId,
        DateTime saleDt,
        decimal price = 350_000m)
    {
        _db.TfSales.Add(new TfSale
        {
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            ChgOfOwnerId = chgOfOwnerId,
            SlDt = saleDt,
            SlPrice = price,
            AdjSlPrice = price,
            SaleQualified = true,
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
    }

    private static PagedTfSaleResponse AssertOk(IActionResult result)
    {
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        return ok.Value.Should().BeOfType<PagedTfSaleResponse>().Subject;
    }

    [Fact]
    public async Task Returns_200_WithEnvelope_OnHappyPath()
    {
        await SeedSaleAsync(CountyA, 1, new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc));
        await SeedSaleAsync(CountyA, 2, new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc));

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetSales(CountyA, page: null, pageSize: null);

        var envelope = AssertOk(result);
        envelope.Items.Should().HaveCount(2);
        envelope.Page.Should().Be(1);
        envelope.PageSize.Should().Be(100);
        envelope.TotalCount.Should().Be(2);
        envelope.TotalPages.Should().Be(1);
        envelope.HasNextPage.Should().BeFalse();
        envelope.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_200_EmptyEnvelope_WhenNoSales()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetSales(CountyA, page: null, pageSize: null);

        var envelope = AssertOk(result);
        envelope.Items.Should().BeEmpty();
        envelope.TotalCount.Should().Be(0);
        envelope.TotalPages.Should().Be(0);
        envelope.HasNextPage.Should().BeFalse();
        envelope.HasPreviousPage.Should().BeFalse();
    }

    [Fact]
    public async Task DeterministicOrdering_AcrossPages_BySlDtThenChgOfOwner()
    {
        // Seed 5 sales with mixed dates including a date-tie to
        // verify the ChgOfOwnerId tie-breaker.
        var baseDt = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        await SeedSaleAsync(CountyA, chgOfOwnerId: 100, saleDt: baseDt.AddDays(-3));
        await SeedSaleAsync(CountyA, chgOfOwnerId: 200, saleDt: baseDt.AddDays(0));
        await SeedSaleAsync(CountyA, chgOfOwnerId: 201, saleDt: baseDt.AddDays(0)); // tie
        await SeedSaleAsync(CountyA, chgOfOwnerId: 300, saleDt: baseDt.AddDays(2));
        await SeedSaleAsync(CountyA, chgOfOwnerId: 400, saleDt: baseDt.AddDays(5));

        var ctrl = BuildController(CountyA);

        var page1 = AssertOk(await ctrl.GetSales(CountyA, page: 1, pageSize: 2));
        var page2 = AssertOk(await ctrl.GetSales(CountyA, page: 2, pageSize: 2));
        var page3 = AssertOk(await ctrl.GetSales(CountyA, page: 3, pageSize: 2));

        // Newest first: 400, 300, then the tie-breaker (201 > 200), then 100.
        page1.Items.Select(i => i.ChgOfOwnerId).Should().Equal(400, 300);
        page2.Items.Select(i => i.ChgOfOwnerId).Should().Equal(201, 200);
        page3.Items.Select(i => i.ChgOfOwnerId).Should().Equal(100);

        page1.HasPreviousPage.Should().BeFalse();
        page1.HasNextPage.Should().BeTrue();
        page2.HasPreviousPage.Should().BeTrue();
        page2.HasNextPage.Should().BeTrue();
        page3.HasPreviousPage.Should().BeTrue();
        page3.HasNextPage.Should().BeFalse();
    }

    [Fact]
    public async Task PastTheEndPage_Returns_EmptyItems_AndCorrectMetadata()
    {
        await SeedSaleAsync(CountyA, 1, new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc));

        var ctrl = BuildController(CountyA);
        var envelope = AssertOk(
            await ctrl.GetSales(CountyA, page: 5, pageSize: 100));

        envelope.Items.Should().BeEmpty();
        envelope.Page.Should().Be(5);
        envelope.TotalCount.Should().Be(1);
        envelope.TotalPages.Should().Be(1);
        envelope.HasNextPage.Should().BeFalse();
    }

    [Fact]
    public async Task Returns_400_OnEmptyCountyId()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetSales(Guid.Empty, null, null);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Returns_400_OnInvalidPage(int badPage)
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetSales(CountyA, page: badPage, pageSize: null);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Returns_400_OnInvalidPageSize(int badPageSize)
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetSales(CountyA, page: null, pageSize: badPageSize);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns_400_OnPageSizeAbove500()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetSales(CountyA, page: null, pageSize: 501);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns_403_OnCrossCountyClaim()
    {
        await SeedSaleAsync(CountyA, 1, new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc));

        var ctrl = BuildController(CountyB); // principal claims CountyB
        var result = await ctrl.GetSales(CountyA, null, null);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Returns_403_WhenNoCountyClaim()
    {
        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetSales(CountyA, null, null);
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task CrossCountySales_AreNotInOtherCountyPage()
    {
        await SeedSaleAsync(CountyA, 1, new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc));
        await SeedSaleAsync(CountyB, 2, new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc));

        var ctrl = BuildController(CountyA);
        var envelope = AssertOk(await ctrl.GetSales(CountyA, null, null));

        envelope.Items.Should().HaveCount(1);
        envelope.Items.Single().ChgOfOwnerId.Should().Be(1);
    }

    [Fact]
    public async Task Envelope_Carries_FullProjection_PerRow()
    {
        var saleDt = new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);
        await SeedSaleAsync(CountyA, chgOfOwnerId: 42, saleDt: saleDt, price: 425_500m);

        var ctrl = BuildController(CountyA);
        var envelope = AssertOk(await ctrl.GetSales(CountyA, null, null));

        var row = envelope.Items.Single();
        row.CountyId.Should().Be(CountyA);
        row.ChgOfOwnerId.Should().Be(42);
        row.SlDt.Should().Be(saleDt);
        row.SlPrice.Should().Be(425_500m);
        row.AdjSlPrice.Should().Be(425_500m);
        row.SaleQualified.Should().BeTrue();
        row.TfParcelId.Should().NotBe(Guid.Empty);
        row.TfSaleId.Should().NotBe(Guid.Empty);
    }
}
