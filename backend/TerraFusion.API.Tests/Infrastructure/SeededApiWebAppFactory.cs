using System;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Tests.Infrastructure;

/// <summary>
/// Extended WebApplicationFactory that:
///   1. Overrides the JWT signing key so test-generated tokens are accepted.
///   2. Replaces the production DbContext with a unique in-memory SQLite database.
///   3. Seeds minimum reference data (1 county, 2 properties, 1 assessment, 1 levy).
///
/// Use this factory for controller integration tests that hit real endpoints
/// and need predictable database state.
/// </summary>
public class SeededApiWebAppFactory : ApiWebAppFactory
{
    /// <summary>
    /// Each factory instance gets its own unique database name so parallel
    /// test collections do not share state.
    /// </summary>
    private readonly string _dbName = $"IntegrationTest_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Let base class swap Consciousness stubs + Redis mock
        base.ConfigureWebHost(builder);

        // Override the JWT signing key so our test tokens validate
        builder.UseSetting("JwtSettings:SecretKey", AuthenticatedClientExtensions.TestSigningKeyValue);
        builder.UseSetting("JwtSettings:Issuer", "TerraFusion");
        builder.UseSetting("JwtSettings:Audience", "TerraFusionAPI");

        // Force development environment so DX-01 fallbacks activate when needed
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Replace the real DbContext with an in-memory SQLite instance.
            // We remove ALL TerraFusionDbContext registrations and the DbContextOptions.
            var descriptors = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<TerraFusionDbContext>) ||
                    d.ServiceType == typeof(TerraFusionDbContext))
                .ToList();
            foreach (var d in descriptors)
                services.Remove(d);

            // Register a fresh in-memory provider
            services.AddDbContext<TerraFusionDbContext>((sp, options) =>
            {
                options.UseInMemoryDatabase(_dbName);
                options.EnableDetailedErrors();
                options.EnableSensitiveDataLogging();
            });

            // Build a temporary service provider to seed the database
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.Database.EnsureCreated();
            SeedTestData(db);
        });
    }

    /// <summary>
    /// Well-known property GUIDs for test assertions.
    /// </summary>
    public static readonly Guid Property1Id = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid Property2Id = Guid.Parse("10000000-0000-0000-0000-000000000002");
    public static readonly Guid OtherPropertyId = Guid.Parse("10000000-0000-0000-0000-000000000003");

    /// <summary>
    /// Insert minimum reference rows required by the controller endpoints under test.
    /// </summary>
    private static void SeedTestData(TerraFusionDbContext db)
    {
        var countyId = AuthenticatedClientExtensions.TestCountyId;
        var otherCountyId = AuthenticatedClientExtensions.OtherCountyId;

        // ── Counties ──────────────────────────────────────────────
        if (!db.Counties.Any(c => c.Id == countyId))
        {
            db.Counties.Add(new County
            {
                Id = countyId,
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
                Population = 210_000,
            });
        }

        if (!db.Counties.Any(c => c.Id == otherCountyId))
        {
            db.Counties.Add(new County
            {
                Id = otherCountyId,
                Name = "Franklin",
                State = "WA",
                FipsCode = "53021",
                Population = 98_000,
            });
        }

        db.SaveChanges();

        // ── Properties ────────────────────────────────────────────
        if (!db.Properties.Any(p => p.ParcelId == "TEST-001"))
        {
            db.Properties.Add(new Property
            {
                Id = Property1Id,
                PropertyId = "PROP-TEST-001",
                ParcelId = "TEST-001",
                ParcelNumber = "TEST-001",
                CountyId = countyId,
                Address = "123 Main St, Kennewick, WA 99336",
                PropertyType = "Residential",
                AssessedValue = 350_000m,
                LandValue = 100_000m,
                ImprovementValue = 250_000m,
                TaxYear = 2025,
                YearBuilt = 1995,
            });
        }

        if (!db.Properties.Any(p => p.ParcelId == "TEST-002"))
        {
            db.Properties.Add(new Property
            {
                Id = Property2Id,
                PropertyId = "PROP-TEST-002",
                ParcelId = "TEST-002",
                ParcelNumber = "TEST-002",
                CountyId = countyId,
                Address = "456 Oak Ave, Richland, WA 99352",
                PropertyType = "Commercial",
                AssessedValue = 1_200_000m,
                LandValue = 400_000m,
                ImprovementValue = 800_000m,
                TaxYear = 2025,
                YearBuilt = 2005,
            });
        }

        // Property in OTHER county (for isolation tests)
        if (!db.Properties.Any(p => p.ParcelId == "OTHER-001"))
        {
            db.Properties.Add(new Property
            {
                Id = OtherPropertyId,
                PropertyId = "PROP-OTHER-001",
                ParcelId = "OTHER-001",
                ParcelNumber = "OTHER-001",
                CountyId = otherCountyId,
                Address = "789 Elm St, Pasco, WA 99301",
                PropertyType = "Residential",
                AssessedValue = 280_000m,
                LandValue = 80_000m,
                ImprovementValue = 200_000m,
                TaxYear = 2025,
                YearBuilt = 2000,
            });
        }

        db.SaveChanges();

        // ── Property Assessments ──────────────────────────────────
        if (!db.PropertyAssessments.Any(a => a.PropertyId == Property1Id))
        {
            db.PropertyAssessments.Add(new PropertyAssessment
            {
                PropertyId = Property1Id,
                AssessmentYear = 2024,
                AssessedValue = 330_000m,
                LandValue = 95_000m,
                ImprovementValue = 235_000m,
                MarketValue = 340_000m,
                AssessmentMethod = "sales_comparison",
                AssessmentDate = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            });

            db.PropertyAssessments.Add(new PropertyAssessment
            {
                PropertyId = Property1Id,
                AssessmentYear = 2023,
                AssessedValue = 310_000m,
                LandValue = 90_000m,
                ImprovementValue = 220_000m,
                MarketValue = 320_000m,
                AssessmentMethod = "sales_comparison",
                AssessmentDate = new DateTime(2023, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            });
        }

        // ── Tax Levies ────────────────────────────────────────────
        if (!db.TaxLevies.Any())
        {
            db.TaxLevies.Add(new TaxLevy
            {
                CountyId = countyId,
                TaxYear = DateTime.UtcNow.Year,
                TaxingDistrict = "General Fund",
                TaxRate = 0.0085m,
                Purpose = "General county operations",
                EffectiveDate = new DateTime(DateTime.UtcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            });
        }

        db.SaveChanges();
    }
}
