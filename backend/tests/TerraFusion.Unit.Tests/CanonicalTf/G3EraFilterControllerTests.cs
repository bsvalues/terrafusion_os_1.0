using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Abstractions.DTOs.CanonicalTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesRatioStudy;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice G3 (v1.12) acceptance tests for the <c>era</c> query
/// parameter on the canonical read endpoints other than
/// <c>SalesRatioStudyController</c> (which has its own dedicated
/// tests in <see cref="SalesRatioStudyControllerTests"/>).
///
/// <para>For each modified endpoint
/// (<see cref="TfSalesController"/>, <see cref="ParcelOwnerController"/>,
/// <see cref="ParcelWsdorController"/>) we assert:
/// <list type="bullet">
///   <item>(a) default <c>null</c> filters to <c>POST_CONVERSION</c>;</item>
///   <item>(b) <c>era=ALL</c> returns rows from all eras;</item>
///   <item>(c) invalid era token returns 400.</item>
/// </list>
/// </para>
/// </summary>
public sealed class G3EraFilterControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusionDbContext _db;

    public G3EraFilterControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"g3-{Guid.NewGuid():N}")
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

    private static ClaimsPrincipal PrincipalForCounty(Guid countyId)
    {
        var identity = new ClaimsIdentity(authenticationType: "Test");
        identity.AddClaim(new Claim("countyId", countyId.ToString()));
        return new ClaimsPrincipal(identity);
    }

    private static ControllerContext ContextFor(ClaimsPrincipal principal) =>
        new()
        {
            HttpContext = new DefaultHttpContext { User = principal },
        };

    // ========================================================
    // TfSalesController
    // ========================================================

    private TfSalesController BuildSalesController()
    {
        var reader = new TfSaleReader(_db);
        var ctrl = new TfSalesController(reader, NullLogger<TfSalesController>.Instance);
        ctrl.ControllerContext = ContextFor(PrincipalForCounty(CountyA));
        return ctrl;
    }

    private async Task SeedSaleAsync(long chgOfOwnerId, DateTime saleDt, string? era)
    {
        _db.TfSales.Add(new TfSale
        {
            CountyId = CountyA,
            TfParcelId = Guid.NewGuid(),
            ChgOfOwnerId = chgOfOwnerId,
            SlDt = saleDt,
            SlPrice = 350_000m,
            AdjSlPrice = 350_000m,
            SaleQualified = true,
            PromotionLoadBatchId = Guid.NewGuid(),
            ConversionEra = era,
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task TfSales_DefaultEra_FiltersToPostConversion()
    {
        await SeedSaleAsync(1,
            new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            era: ConversionEras.PostConversion);
        await SeedSaleAsync(2,
            new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            era: ConversionEras.PreConversion2017);
        await SeedSaleAsync(3,
            new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            era: ConversionEras.Unknown);

        var ctrl = BuildSalesController();
        var result = await ctrl.GetSales(CountyA, page: null, pageSize: null);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var envelope = ok.Value.Should().BeOfType<PagedTfSaleResponse>().Subject;
        envelope.TotalCount.Should().Be(1, "default era=POST_CONVERSION excludes PRE / UNKNOWN rows");
        envelope.Items.Should().ContainSingle(i => i.ChgOfOwnerId == 1L);
    }

    [Fact]
    public async Task TfSales_EraAll_ReturnsAllEras()
    {
        await SeedSaleAsync(1,
            new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            era: ConversionEras.PostConversion);
        await SeedSaleAsync(2,
            new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            era: ConversionEras.PreConversion2017);
        await SeedSaleAsync(3,
            new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            era: ConversionEras.Unknown);

        var ctrl = BuildSalesController();
        var result = await ctrl.GetSales(
            CountyA, page: null, pageSize: null, era: ISalesRatioStudyReader.EraAll);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var envelope = ok.Value.Should().BeOfType<PagedTfSaleResponse>().Subject;
        envelope.TotalCount.Should().Be(3, "era=ALL bypasses the conversion-era filter");
    }

    [Theory]
    [InlineData("BOGUS_ERA")]
    [InlineData("post_conversion")]
    [InlineData("anythingelse")]
    public async Task TfSales_InvalidEra_Returns400(string badEra)
    {
        var ctrl = BuildSalesController();
        var result = await ctrl.GetSales(CountyA, page: null, pageSize: null, era: badEra);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ========================================================
    // ParcelOwnerController
    // ========================================================

    private ParcelOwnerController BuildOwnerController()
    {
        var reader = new TfParcelOwnerReader(_db);
        var ctrl = new ParcelOwnerController(
            reader, NullLogger<ParcelOwnerController>.Instance);
        ctrl.ControllerContext = ContextFor(PrincipalForCounty(CountyA));
        return ctrl;
    }

    private async Task<TfParcel> SeedOwnerParcelAsync()
    {
        var p = new TfParcel
        {
            CountyId = CountyA,
            ParcelNumber = $"P-{Guid.NewGuid():N}",
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(p);
        await _db.SaveChangesAsync();
        return p;
    }

    private async Task<TfOwner> SeedOwnerWithEraAsync(long acctId, string displayName, string? era)
    {
        var o = new TfOwner
        {
            CountyId = CountyA,
            AcctId = acctId,
            DisplayName = displayName,
            ConfidentialFlag = false,
            WebSuppression = false,
            PromotionLoadBatchId = Guid.NewGuid(),
            ConversionEra = era,
        };
        _db.TfOwners.Add(o);
        await _db.SaveChangesAsync();
        return o;
    }

    private async Task SeedLinkAsync(Guid parcelId, Guid ownerId, short year)
    {
        _db.TfParcelOwnerLinks.Add(new TfParcelOwnerLink
        {
            TfParcelId = parcelId,
            TfOwnerId = ownerId,
            OwnerTaxYr = year,
            PctOwnership = 1.0m,
            IsPrimary = true,
            SourceTruthOwnerCurrentId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task ParcelOwner_DefaultEra_FiltersToPostConversion()
    {
        var parcel = await SeedOwnerParcelAsync();
        var post = await SeedOwnerWithEraAsync(1L, "Smith, John", ConversionEras.PostConversion);
        var pre = await SeedOwnerWithEraAsync(2L, "Doe, Jane", ConversionEras.PreConversion2017);
        await SeedLinkAsync(parcel.TfParcelId, post.TfOwnerId, 2026);
        await SeedLinkAsync(parcel.TfParcelId, pre.TfOwnerId, 2026);

        var ctrl = BuildOwnerController();
        var result = await ctrl.GetOwnerCurrent(parcel.TfParcelId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<ParcelOwnerCurrentResponse>().Subject;
        body.Owners.Should().ContainSingle()
            .Which.DisplayName.Should().Be("Smith, John",
                "default era=POST_CONVERSION excludes the PRE owner");
    }

    [Fact]
    public async Task ParcelOwner_EraAll_ReturnsAllEras()
    {
        var parcel = await SeedOwnerParcelAsync();
        var post = await SeedOwnerWithEraAsync(1L, "Smith, John", ConversionEras.PostConversion);
        var pre = await SeedOwnerWithEraAsync(2L, "Doe, Jane", ConversionEras.PreConversion2017);
        await SeedLinkAsync(parcel.TfParcelId, post.TfOwnerId, 2026);
        await SeedLinkAsync(parcel.TfParcelId, pre.TfOwnerId, 2026);

        var ctrl = BuildOwnerController();
        var result = await ctrl.GetOwnerCurrent(
            parcel.TfParcelId, taxYear: 2026, era: ISalesRatioStudyReader.EraAll);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<ParcelOwnerCurrentResponse>().Subject;
        body.Owners.Should().HaveCount(2, "era=ALL bypasses the conversion-era filter");
    }

    [Fact]
    public async Task ParcelOwner_InvalidEra_Returns400()
    {
        var parcel = await SeedOwnerParcelAsync();

        var ctrl = BuildOwnerController();
        var result = await ctrl.GetOwnerCurrent(
            parcel.TfParcelId, taxYear: 2026, era: "BOGUS_ERA");

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ========================================================
    // ParcelWsdorController
    // ========================================================

    private ParcelWsdorController BuildWsdorController()
    {
        var reader = new TfParcelWsdorReader(_db);
        var ctrl = new ParcelWsdorController(
            reader, NullLogger<ParcelWsdorController>.Instance);
        ctrl.ControllerContext = ContextFor(PrincipalForCounty(CountyA));
        return ctrl;
    }

    private async Task SeedWsdorAssessmentAsync(
        Guid parcelId, Guid ownerId, short year, string? era)
    {
        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            CountyId = CountyA,
            TfParcelId = parcelId,
            TfOwnerId = ownerId,
            AssessmentYear = year,
            SupNum = 0,
            AssessedVal = 250_000m,
            MarketVal = 300_000m,
            AppraisedVal = 250_000m,
            TaxableClassified = 250_000m,
            BoeStatus = "F",
            PromotionLoadBatchId = Guid.NewGuid(),
            ConversionEra = era,
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task ParcelWsdor_DefaultEra_FiltersToPostConversion()
    {
        var parcel = await SeedOwnerParcelAsync();
        var owner = await SeedOwnerWithEraAsync(1L, "Smith, John", ConversionEras.PostConversion);
        await SeedWsdorAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId,
            year: 2026, era: ConversionEras.PostConversion);
        await SeedWsdorAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId,
            year: 2026, era: ConversionEras.PreConversion2017);

        var ctrl = BuildWsdorController();
        var result = await ctrl.GetWsdorRoll(parcel.TfParcelId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<ParcelWsdorRollResponse>().Subject;
        body.Entries.Should().HaveCount(1, "default era=POST_CONVERSION excludes PRE rows");
    }

    [Fact]
    public async Task ParcelWsdor_EraAll_ReturnsAllEras()
    {
        var parcel = await SeedOwnerParcelAsync();
        var owner = await SeedOwnerWithEraAsync(1L, "Smith, John", ConversionEras.PostConversion);
        await SeedWsdorAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId,
            year: 2026, era: ConversionEras.PostConversion);
        await SeedWsdorAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId,
            year: 2026, era: ConversionEras.PreConversion2017);
        await SeedWsdorAssessmentAsync(parcel.TfParcelId, owner.TfOwnerId,
            year: 2026, era: ConversionEras.Unknown);

        var ctrl = BuildWsdorController();
        var result = await ctrl.GetWsdorRoll(
            parcel.TfParcelId, taxYear: 2026, era: ISalesRatioStudyReader.EraAll);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<ParcelWsdorRollResponse>().Subject;
        body.Entries.Should().HaveCount(3, "era=ALL bypasses the conversion-era filter");
    }

    [Fact]
    public async Task ParcelWsdor_InvalidEra_Returns400()
    {
        var parcel = await SeedOwnerParcelAsync();

        var ctrl = BuildWsdorController();
        var result = await ctrl.GetWsdorRoll(
            parcel.TfParcelId, taxYear: 2026, era: "BOGUS_ERA");

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
