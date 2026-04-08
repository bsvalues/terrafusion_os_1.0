using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using CanonicalComparableSale = TerraFusion.Core.Entities.ComparableSale;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave37;

/// <summary>
/// R2Wave37 — POST /api/forge/sales/recompute-recommendations
///
/// Core invariants:
///   - Layer 2 (QualificationRecommendation) is populated for county sales
///   - Layer 3 (QualificationDecision) is never touched by a recompute
///   - Missing auth claim → 401
///   - Empty county → returns 0 updated, not an error
///   - County scope: only the assessor's county is updated
/// </summary>
[Trait("Category", "R2Wave37")]
[Trait("Category", "ForgeRecompute")]
public sealed class R2Wave37RecomputeRecommendationsTests
{
    private static readonly Guid BentonCountyId = Guid.NewGuid();
    private static readonly Guid OtherCountyId  = Guid.NewGuid();

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    private static ClaimsPrincipal CreatePrincipal(Guid countyId, string userName = "assessor@benton.wa.gov")
        => new(new ClaimsIdentity(
        [
            new Claim("countyId", countyId.ToString()),
            new Claim(ClaimTypes.Name, userName),
        ], "TestAuth"));

    private static ClaimsPrincipal CreateAnonymous()
        => new(new ClaimsIdentity());

    private static ForgeController CreateController(DataDbContext db, ClaimsPrincipal? principal = null)
    {
        var controller = new ForgeController(
            null!,  // IValuationService — not needed for recompute tests
            db,
            NullLogger<ForgeController>.Instance);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal ?? CreatePrincipal(BentonCountyId) },
        };
        return controller;
    }

    private static async Task SeedCountyAsync(DataDbContext db, Guid countyId, string name = "Benton")
    {
        if (!await db.Counties.AnyAsync(c => c.Id == countyId))
        {
            db.Counties.Add(new County { Id = countyId, Name = name, State = "WA", FipsCode = "003" });
            await db.SaveChangesAsync();
        }
    }

    private static async Task<CanonicalComparableSale> SeedSaleAsync(
        DataDbContext db, Guid countyId,
        string? rawQualifier = "Q",
        string? existingRecommendation = null,
        string? existingDecision = null)
    {
        var sale = new CanonicalComparableSale
        {
            Id                          = Guid.NewGuid(),
            ParcelId                    = $"P-{Guid.NewGuid().ToString("N")[..6]}",
            SaleDate                    = new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = 320_000m,
            PropertyType                = "residential",
            CountyId                    = countyId,
            IngestedBy                  = "test",
            RawSaleQualifier            = rawQualifier,
            QualificationRecommendation = existingRecommendation,
            QualificationDecision       = existingDecision,
            DecisionBy                  = existingDecision is null ? null : "prev-assessor",
            DecisionAt                  = existingDecision is null ? null : DateTime.UtcNow.AddDays(-3),
            DecisionSource              = existingDecision is null ? null : "AssessorOverride",
        };
        db.ComparableSales.Add(sale);
        await db.SaveChangesAsync();
        return sale;
    }

    // ═══════════════════════════════════════════════════════════════
    // Happy path — Layer 2 populated, updated count returned
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task RecomputeRecommendations_PopulatesLayer2_ReturnsCount()
    {
        using var db = CreateDbContext(nameof(RecomputeRecommendations_PopulatesLayer2_ReturnsCount));
        await SeedCountyAsync(db, BentonCountyId);
        var sale = await SeedSaleAsync(db, BentonCountyId, rawQualifier: "Q");
        var controller = CreateController(db);
        var service = new SaleQualificationService(db);

        var result = await controller.RecomputeRecommendations(service, CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        // The response body contains { updated, countyId }
        var body = ok.Value!;
        var updatedProp = body.GetType().GetProperty("updated") ?? body.GetType().GetProperty("Updated");
        updatedProp.Should().NotBeNull();
        ((int)updatedProp!.GetValue(body)!).Should().BeGreaterThanOrEqualTo(1);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task RecomputeRecommendations_MultipleSales_AllGet_Layer2()
    {
        using var db = CreateDbContext(nameof(RecomputeRecommendations_MultipleSales_AllGet_Layer2));
        await SeedCountyAsync(db, BentonCountyId);
        var saleA = await SeedSaleAsync(db, BentonCountyId, rawQualifier: "Q");
        var saleB = await SeedSaleAsync(db, BentonCountyId, rawQualifier: "Q");
        var saleC = await SeedSaleAsync(db, BentonCountyId, rawQualifier: "Q");
        var controller = CreateController(db);
        var service = new SaleQualificationService(db);

        await controller.RecomputeRecommendations(service, CancellationToken.None);

        var sales = await db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .ToListAsync();
        sales.Should().AllSatisfy(s => s.QualificationRecommendation.Should().NotBeNullOrEmpty());
    }

    // ═══════════════════════════════════════════════════════════════
    // Layer 3 isolation — recompute NEVER touches assessor overrides
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task RecomputeRecommendations_DoesNotTouchLayer3Override()
    {
        using var db = CreateDbContext(nameof(RecomputeRecommendations_DoesNotTouchLayer3Override));
        await SeedCountyAsync(db, BentonCountyId);
        var sale = await SeedSaleAsync(
            db, BentonCountyId,
            rawQualifier: "Q",
            existingRecommendation: "non-arms-length",
            existingDecision: "qualified");      // Assessor has overridden
        var controller = CreateController(db);
        var service = new SaleQualificationService(db);

        await controller.RecomputeRecommendations(service, CancellationToken.None);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        // Layer 3 fields must be unchanged
        refreshed!.QualificationDecision.Should().Be("qualified");
        refreshed.DecisionBy.Should().Be("prev-assessor");
        refreshed.DecisionSource.Should().Be("AssessorOverride");
        refreshed.DecisionAt.Should().NotBeNull();
    }

    // ═══════════════════════════════════════════════════════════════
    // Empty county — returns 0, not a failure
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task RecomputeRecommendations_EmptyCounty_Returns0()
    {
        using var db = CreateDbContext(nameof(RecomputeRecommendations_EmptyCounty_Returns0));
        await SeedCountyAsync(db, BentonCountyId);
        // No sales seeded
        var controller = CreateController(db);
        var service = new SaleQualificationService(db);

        var result = await controller.RecomputeRecommendations(service, CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value!;
        var updatedProp = body.GetType().GetProperty("updated") ?? body.GetType().GetProperty("Updated");
        ((int)updatedProp!.GetValue(body)!).Should().Be(0);
    }

    // ═══════════════════════════════════════════════════════════════
    // County scope — only the caller's county is recomputed
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task RecomputeRecommendations_OnlyUpdatesCallerCounty()
    {
        using var db = CreateDbContext(nameof(RecomputeRecommendations_OnlyUpdatesCallerCounty));
        await SeedCountyAsync(db, BentonCountyId);
        await SeedCountyAsync(db, OtherCountyId, "Franklin");
        // Sales in both counties — neither has a recommendation yet
        var bentonSale = await SeedSaleAsync(db, BentonCountyId, rawQualifier: "Q", existingRecommendation: null);
        var otherSale  = await SeedSaleAsync(db, OtherCountyId,  rawQualifier: "Q", existingRecommendation: null);

        // Controller runs as Benton assessor
        var controller = CreateController(db, CreatePrincipal(BentonCountyId));
        var service = new SaleQualificationService(db);

        await controller.RecomputeRecommendations(service, CancellationToken.None);

        var refreshedBenton = await db.ComparableSales.FindAsync(bentonSale.Id);
        var refreshedOther  = await db.ComparableSales.FindAsync(otherSale.Id);

        refreshedBenton!.QualificationRecommendation.Should().NotBeNullOrEmpty("Benton sale should be updated");
        refreshedOther!.QualificationRecommendation.Should().BeNull("Other county sale should be untouched");
    }

    // ═══════════════════════════════════════════════════════════════
    // Auth: missing county claim → 401
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task RecomputeRecommendations_NoClaims_ReturnsUnauthorized()
    {
        using var db = CreateDbContext(nameof(RecomputeRecommendations_NoClaims_ReturnsUnauthorized));
        var controller = CreateController(db, CreateAnonymous());
        var service = new SaleQualificationService(db);

        var result = await controller.RecomputeRecommendations(service, CancellationToken.None);

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task RecomputeRecommendations_MalformedCountyId_ReturnsUnauthorized()
    {
        using var db = CreateDbContext(nameof(RecomputeRecommendations_MalformedCountyId_ReturnsUnauthorized));
        var badPrincipal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("countyId", "not-a-guid"),
        ], "TestAuth"));
        var controller = CreateController(db, badPrincipal);
        var service = new SaleQualificationService(db);

        var result = await controller.RecomputeRecommendations(service, CancellationToken.None);

        result.Should().BeOfType<UnauthorizedResult>();
    }
}
