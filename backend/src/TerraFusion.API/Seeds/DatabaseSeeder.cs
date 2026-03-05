
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Enums;
using System.Text.Json;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Seeds;

/// <summary>
/// DX-01: Idempotent development database seeder.
/// Seeds deterministic Benton County data for dossier runtime validation.
/// All seed data uses stable GUIDs so re-runs are safe (idempotent).
/// </summary>
public static class DatabaseSeeder
{
    // Stable GUIDs for idempotent seed data
    public static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    public static readonly Guid ClarkCountyId  = Guid.Parse("19190019-1919-1919-1919-191919191920");
    public static readonly Guid KingCountyId   = Guid.Parse("19190019-1919-1919-1919-191919191921");

    public static readonly Guid BentonProperty1Id = Guid.Parse("be010001-0001-0001-0001-000000000001");
    public static readonly Guid BentonProperty2Id = Guid.Parse("be010001-0001-0001-0001-000000000002");
    public static readonly Guid BentonProperty3Id = Guid.Parse("be010001-0001-0001-0001-000000000003");

    /// <summary>
    /// DX-01: Seeds dossier runtime data using TerraFusionDbContext.
    /// Called from Program.cs during Development startup.
    /// Idempotent: checks for existing records before inserting.
    /// </summary>
    public static async Task SeedDossierRuntimeDataAsync(TerraFusionDbContext db)
    {
        Console.WriteLine("[DX-01] Seeding dossier runtime development data...");

        // Seed Counties (idempotent)
        if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
        {
            await SeedCounties(db);
        }
        else
        {
            Console.WriteLine("[DX-01] Counties already seeded, skipping.");
        }

        // Seed Properties (idempotent)
        if (!await db.Properties.AnyAsync(p => p.Id == BentonProperty1Id))
        {
            await SeedBentonProperties(db);
        }
        else
        {
            Console.WriteLine("[DX-01] Properties already seeded, skipping.");
        }

        await db.SaveChangesAsync();
        Console.WriteLine("[DX-01] Dossier runtime seed complete.");
    }

    /// <summary>
    /// Legacy seed method for TerraFusionContext (unchanged for backward compat).
    /// </summary>
    public static async Task SeedDevelopmentData(TerraFusionContext context)
    {
        Console.WriteLine("Seeding TerraFusion OS development database...");

        await context.Database.EnsureCreatedAsync();

        if (!await context.Counties.AnyAsync())
        {
            var counties = new[]
            {
                new County { Id = BentonCountyId,  Name = "Benton", State = "WA", FipsCode = "53005", Population = 206873, Area = 1703.38 },
                new County { Id = ClarkCountyId,   Name = "Clark",  State = "WA", FipsCode = "53011", Population = 503311, Area = 656.31 },
                new County { Id = KingCountyId,    Name = "King",   State = "WA", FipsCode = "53033", Population = 2269675, Area = 2307.58 }
            };
            await context.Counties.AddRangeAsync(counties);
        }

        if (!await context.CostMatrices.AnyAsync())
        {
            await SeedCostMatrices(context);
        }

        if (!await context.AIModels.AnyAsync())
        {
            await SeedAIModels(context);
        }

        await context.SaveChangesAsync();
        Console.WriteLine("Database seeding completed successfully");
    }

    // ── DX-01 Seed Helpers ──────────────────────────────────────

    private static async Task SeedCounties(TerraFusionDbContext db)
    {
        var counties = new[]
        {
            new County
            {
                Id = BentonCountyId,
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
                Population = 206873,
                Area = 1703.38
            },
            new County
            {
                Id = ClarkCountyId,
                Name = "Clark",
                State = "WA",
                FipsCode = "53011",
                Population = 503311,
                Area = 656.31
            },
            new County
            {
                Id = KingCountyId,
                Name = "King",
                State = "WA",
                FipsCode = "53033",
                Population = 2269675,
                Area = 2307.58
            }
        };

        await db.Counties.AddRangeAsync(counties);
        Console.WriteLine($"[DX-01] Seeded {counties.Length} counties (Benton, Clark, King)");
    }

    private static async Task SeedBentonProperties(TerraFusionDbContext db)
    {
        var now = DateTime.UtcNow;
        var properties = new[]
        {
            new Property
            {
                Id = BentonProperty1Id,
                PropertyId = "BENTON-001",
                ParcelId = "BENTON-001",
                ParcelNumber = "1-0531-100-0001-000",
                Address = "123 Main St, Kennewick, WA 99336",
                PropertyType = "Residential",
                YearBuilt = 1995,
                AssessedValue = 285000m,
                LandValue = 75000m,
                ImprovementValue = 210000m,
                MarketValue = 310000m,
                AssessmentDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = now,
                TaxYear = 2025,
                CountyId = BentonCountyId
            },
            new Property
            {
                Id = BentonProperty2Id,
                PropertyId = "BENTON-002",
                ParcelId = "BENTON-002",
                ParcelNumber = "1-0531-100-0002-000",
                Address = "456 Columbia Dr, Richland, WA 99352",
                PropertyType = "Commercial",
                YearBuilt = 2001,
                AssessedValue = 1250000m,
                LandValue = 350000m,
                ImprovementValue = 900000m,
                MarketValue = 1400000m,
                AssessmentDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = now,
                TaxYear = 2025,
                CountyId = BentonCountyId
            },
            new Property
            {
                Id = BentonProperty3Id,
                PropertyId = "BENTON-003",
                ParcelId = "BENTON-003",
                ParcelNumber = "1-0531-100-0003-000",
                Address = "789 Wine Country Rd, Prosser, WA 99350",
                PropertyType = "Agricultural",
                YearBuilt = 1978,
                AssessedValue = 520000m,
                LandValue = 420000m,
                ImprovementValue = 100000m,
                MarketValue = 580000m,
                AssessmentDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = now,
                TaxYear = 2025,
                CountyId = BentonCountyId
            }
        };

        await db.Properties.AddRangeAsync(properties);
        Console.WriteLine($"[DX-01] Seeded {properties.Length} Benton County properties");
    }

    // ── Legacy Seed Helpers (unchanged) ─────────────────────────

    private static async Task SeedCostMatrices(TerraFusionContext context)
    {
        var costMatrices = new[]
        {
            new CostMatrix
            {
                CountyId = KingCountyId,
                MatrixType = "PropertyTax",
                BaseRate = 0.0123m,
                Multiplier = 1.0m,
                EffectiveDate = DateTime.UtcNow.AddYears(-1)
            },
            new CostMatrix
            {
                CountyId = KingCountyId,
                MatrixType = "BusinessLicense",
                BaseRate = 50.0m,
                Multiplier = 1.2m,
                EffectiveDate = DateTime.UtcNow.AddYears(-1)
            }
        };

        await context.CostMatrices.AddRangeAsync(costMatrices);
        Console.WriteLine($"Seeded {costMatrices.Length} cost matrices");
    }

    private static async Task SeedAIModels(TerraFusionContext context)
    {
        var aiModels = new[]
        {
            new AIModel
            {
                Name = "Revenue Hunter Swarm",
                Type = AIModelType.SwarmIntelligence,
                Status = AIModelStatus.Active,
                Configuration = JsonSerializer.Serialize(new { agents = 1000, optimization = "revenue" }),
                CreatedAt = DateTime.UtcNow
            },
            new AIModel
            {
                Name = "Quantum Performance Engine",
                Type = AIModelType.QuantumEnhanced,
                Status = AIModelStatus.Active,
                Configuration = JsonSerializer.Serialize(new { quantum_bits = 50, speedup = "379000000x" }),
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.AIModels.AddRangeAsync(aiModels);
        Console.WriteLine($"Seeded {aiModels.Length} AI models");
    }
}
