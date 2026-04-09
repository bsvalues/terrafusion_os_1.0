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

namespace TerraFusion.Unit.Tests.R2Wave36;

/// <summary>
/// R2Wave36 — Assessor Sale Qualification Override (Layer 3)
///
/// Tests for PATCH /api/forge/sales/{saleId}/qualification
/// and POST /api/forge/sales/recompute-recommendations.
///
/// Core invariants:
///   - Assessor decision is final (Layer 3 wins over Layer 2)
///   - County scope is enforced (cannot patch another county's sale)
///   - Decision values are validated (reject unknown codes)
///   - Null decision clears the override (reverts to recommendation)
/// </summary>
[Trait("Category", "R2Wave36")]
[Trait("Category", "ForgeQualificationOverride")]
public sealed class R2Wave36SaleQualificationOverrideTests
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
            new Claim("sub", userName),
        ], "TestAuth"));

    private static ClaimsPrincipal CreateAnonymous()
        => new(new ClaimsIdentity());

    private static ForgeController CreateController(DataDbContext db, ClaimsPrincipal? principal = null)
    {
        var svc = new SaleQualificationService(db);
        var controller = new ForgeController(
            null!,  // IValuationService — not needed for override tests
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
        string? recommendation = "qualified",
        string? existingDecision = null)
    {
        var sale = new CanonicalComparableSale
        {
            Id                          = Guid.NewGuid(),
            ParcelId                    = $"P-{Guid.NewGuid().ToString("N")[..6]}",
            SaleDate                    = new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = 350_000m,
            PropertyType                = "residential",
            CountyId                    = countyId,
            IngestedBy                  = "test",
            RawSaleQualifier            = "Q",
            QualificationRecommendation = recommendation,
            QualificationDecision       = existingDecision,
            DecisionBy                  = existingDecision is null ? null : "previous-assessor",
            DecisionAt                  = existingDecision is null ? null : DateTime.UtcNow.AddDays(-7),
            DecisionSource              = existingDecision is null ? null : "AssessorOverride",
        };
        db.ComparableSales.Add(sale);
        await db.SaveChangesAsync();
        return sale;
    }

    // ═══════════════════════════════════════════════════════════════
    // Happy path: set an override
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task PatchQualification_SetQualified_PersistsLayer3Fields()
    {
        using var db = CreateDbContext(nameof(PatchQualification_SetQualified_PersistsLayer3Fields));
        await SeedCountyAsync(db, BentonCountyId);
        var sale = await SeedSaleAsync(db, BentonCountyId, recommendation: "non-arms-length");
        var controller = CreateController(db);

        var result = await controller.PatchSaleQualification(
            sale.Id,
            new SaleQualificationOverrideRequest { Decision = "qualified", Reason = "Arms-length confirmed by deed review" },
            CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic payload = ok.Value!;

        // DB must reflect the override
        var updated = await db.ComparableSales.FindAsync(sale.Id);
        updated!.QualificationDecision.Should().Be("qualified");
        updated.DecisionReason.Should().Be("Arms-length confirmed by deed review");
        updated.DecisionBy.Should().Be("assessor@benton.wa.gov");
        updated.DecisionAt.Should().NotBeNull();
        updated.DecisionSource.Should().Be("AssessorOverride");
    }

    [Theory]
    [InlineData("qualified")]
    [InlineData("non-arms-length")]
    [InlineData("foreclosure")]
    [InlineData("estate")]
    [InlineData("excluded")]
    [InlineData("exempt")]
    public async Task PatchQualification_AllValidDecisions_Accepted(string decision)
    {
        var dbName = $"{nameof(PatchQualification_AllValidDecisions_Accepted)}_{decision}";
        using var db = CreateDbContext(dbName);
        await SeedCountyAsync(db, BentonCountyId);
        var sale = await SeedSaleAsync(db, BentonCountyId);
        var controller = CreateController(db);

        var result = await controller.PatchSaleQualification(
            sale.Id,
            new SaleQualificationOverrideRequest { Decision = decision },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        var updated = await db.ComparableSales.FindAsync(sale.Id);
        updated!.QualificationDecision.Should().Be(decision);
    }

    // ═══════════════════════════════════════════════════════════════
    // Clear override (null decision → revert to recommendation)
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task PatchQualification_NullDecision_ClearsOverride()
    {
        using var db = CreateDbContext(nameof(PatchQualification_NullDecision_ClearsOverride));
        await SeedCountyAsync(db, BentonCountyId);
        var sale = await SeedSaleAsync(db, BentonCountyId, recommendation: "qualified", existingDecision: "non-arms-length");
        var controller = CreateController(db);

        var result = await controller.PatchSaleQualification(
            sale.Id,
            new SaleQualificationOverrideRequest { Decision = null },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();

        var updated = await db.ComparableSales.FindAsync(sale.Id);
        updated!.QualificationDecision.Should().BeNull();
        updated.DecisionBy.Should().BeNull();
        updated.DecisionAt.Should().BeNull();
        updated.DecisionSource.Should().BeNull();
        // Recommendation must be untouched — Layer 2 is never cleared by Layer 3 operations
        updated.QualificationRecommendation.Should().Be("qualified");
    }

    // ═══════════════════════════════════════════════════════════════
    // Security: county scope enforcement
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task PatchQualification_WrongCounty_ReturnsNotFound()
    {
        using var db = CreateDbContext(nameof(PatchQualification_WrongCounty_ReturnsNotFound));
        await SeedCountyAsync(db, BentonCountyId);
        await SeedCountyAsync(db, OtherCountyId, "Franklin");
        // Sale belongs to BentonCounty
        var sale = await SeedSaleAsync(db, BentonCountyId);
        // Controller authenticated as OtherCounty
        var controller = CreateController(db, CreatePrincipal(OtherCountyId, "assessor@franklin.wa.gov"));

        var result = await controller.PatchSaleQualification(
            sale.Id,
            new SaleQualificationOverrideRequest { Decision = "qualified" },
            CancellationToken.None);

        result.Should().BeOfType<NotFoundObjectResult>("sale is not in the requester's county");
    }

    [Fact]
    public async Task PatchQualification_MissingCountyClaim_ReturnsUnauthorized()
    {
        using var db = CreateDbContext(nameof(PatchQualification_MissingCountyClaim_ReturnsUnauthorized));
        var sale = await SeedSaleAsync(db, BentonCountyId);
        var controller = CreateController(db, CreateAnonymous());

        var result = await controller.PatchSaleQualification(
            sale.Id,
            new SaleQualificationOverrideRequest { Decision = "qualified" },
            CancellationToken.None);

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ═══════════════════════════════════════════════════════════════
    // Validation: reject unknown decision values
    // ═══════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("QUALIFIED")]       // wrong case
    [InlineData("arms-length")]     // not a valid code
    [InlineData("bogus")]
    [InlineData("")]
    public async Task PatchQualification_InvalidDecision_ReturnsBadRequest(string bad)
    {
        using var db = CreateDbContext($"{nameof(PatchQualification_InvalidDecision_ReturnsBadRequest)}_{bad}");
        await SeedCountyAsync(db, BentonCountyId);
        var sale = await SeedSaleAsync(db, BentonCountyId);
        var controller = CreateController(db);

        var result = await controller.PatchSaleQualification(
            sale.Id,
            new SaleQualificationOverrideRequest { Decision = bad },
            CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task PatchQualification_UnknownSaleId_ReturnsNotFound()
    {
        using var db = CreateDbContext(nameof(PatchQualification_UnknownSaleId_ReturnsNotFound));
        await SeedCountyAsync(db, BentonCountyId);
        var controller = CreateController(db);

        var result = await controller.PatchSaleQualification(
            Guid.NewGuid(),
            new SaleQualificationOverrideRequest { Decision = "qualified" },
            CancellationToken.None);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ═══════════════════════════════════════════════════════════════
    // 3-layer invariant: Layer 2 is never overwritten by Layer 3
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task PatchQualification_Layer2RecommendationUntouched()
    {
        using var db = CreateDbContext(nameof(PatchQualification_Layer2RecommendationUntouched));
        await SeedCountyAsync(db, BentonCountyId);
        var sale = await SeedSaleAsync(db, BentonCountyId, recommendation: "non-arms-length");
        var controller = CreateController(db);

        await controller.PatchSaleQualification(
            sale.Id,
            new SaleQualificationOverrideRequest { Decision = "qualified", Reason = "Re-evaluated" },
            CancellationToken.None);

        var updated = await db.ComparableSales.FindAsync(sale.Id);
        // Layer 3 set to "qualified"
        updated!.QualificationDecision.Should().Be("qualified");
        // Layer 2 must remain exactly as it was — PATCH only writes Layer 3
        updated.QualificationRecommendation.Should().Be("non-arms-length");
        updated.RecommendationSource.Should().BeNull(); // was never set in seed
    }

    // ═══════════════════════════════════════════════════════════════
    // SaleQualificationService.ComputeRecommendationsAsync
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task ComputeRecommendationsAsync_PopulatesLayer2_DoesNotTouchLayer3()
    {
        using var db = CreateDbContext(nameof(ComputeRecommendationsAsync_PopulatesLayer2_DoesNotTouchLayer3));
        await SeedCountyAsync(db, BentonCountyId);

        // Seed two sales with raw PACS codes but no Layer 2/3
        var s1 = new CanonicalComparableSale
        {
            Id = Guid.NewGuid(), ParcelId = "R-001", SaleDate = DateTime.UtcNow, SalePrice = 300_000,
            PropertyType = "residential", CountyId = BentonCountyId, IngestedBy = "pacs",
            RawSaleQualifier = "Q",          // should yield "qualified"
        };
        var s2 = new CanonicalComparableSale
        {
            Id = Guid.NewGuid(), ParcelId = "R-002", SaleDate = DateTime.UtcNow, SalePrice = 280_000,
            PropertyType = "residential", CountyId = BentonCountyId, IngestedBy = "pacs",
            RawCountyRatioCd = "UNQ",        // should yield "non-arms-length"
            QualificationDecision = "qualified", // Layer 3 pre-set by assessor — must survive
            DecisionBy = "assessor@benton.wa.gov",
            DecisionSource = "AssessorOverride",
        };
        db.ComparableSales.AddRange(s1, s2);
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        var updated = await svc.ComputeRecommendationsAsync(BentonCountyId);

        updated.Should().Be(2);

        var r1 = await db.ComparableSales.FindAsync(s1.Id);
        r1!.QualificationRecommendation.Should().Be("qualified");
        r1.RecommendationSource.Should().Be("TerraFusionRuleEngine");

        var r2 = await db.ComparableSales.FindAsync(s2.Id);
        r2!.QualificationRecommendation.Should().Be("non-arms-length");
        // Assessor's Layer 3 decision must be untouched
        r2.QualificationDecision.Should().Be("qualified");
        r2.DecisionSource.Should().Be("AssessorOverride");
    }
}
