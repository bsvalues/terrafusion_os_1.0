
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Enums;
using System.Text.Json;

namespace TerraFusion.API.Seeds;

public static class DatabaseSeeder
{
    public static async System.Threading.Tasks.Task SeedDevelopmentData(TerraFusionContext context)
    {
        Console.WriteLine("🌱 Seeding TerraFusion OS development database...");

        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Seed Counties
        if (!await context.Counties.AnyAsync())
        {
            await SeedCounties(context);
        }

        // Seed Properties
        if (!await context.Properties.AnyAsync())
        {
            await SeedProperties(context);
        }

        // Seed Cost Matrices
        if (!await context.CostMatrices.AnyAsync())
        {
            await SeedCostMatrices(context);
        }

        // Seed AI Models
        if (!await context.AIModels.AnyAsync())
        {
            await SeedAIModels(context);
        }

        await context.SaveChangesAsync();
        Console.WriteLine("✅ Database seeding completed successfully");
    }

    private static async System.Threading.Tasks.Task SeedCounties(TerraFusionContext context)
    {
        var counties = new[]
        {
            new County { Name = "Benton", State = "WA", Population = 206873, Area = 1703.38 },
            new County { Name = "Clark", State = "WA", Population = 503311, Area = 656.31 },
            new County { Name = "King", State = "WA", Population = 2269675, Area = 2307.58 }
        };

        await context.Counties.AddRangeAsync(counties);
        Console.WriteLine($"🏛️ Seeded {counties.Length} counties");
    }

    private static async System.Threading.Tasks.Task SeedProperties(TerraFusionContext context)
    {
        try
        {
            var propertiesJson = await File.ReadAllTextAsync("data/counties/benton_county_properties.json");
            var propertiesData = JsonSerializer.Deserialize<dynamic[]>(propertiesJson);

            var properties = new List<Property>();
            foreach (var prop in (propertiesData ?? Array.Empty<dynamic>()).Take(1000)) // Limit for development
            {
                properties.Add(new Property
                {
                    Address = prop.GetProperty("address")?.GetString() ?? "Unknown",
                    AssessedValue = prop.GetProperty("assessed_value")?.GetDecimal() ?? 0,
                    MarketValue = prop.GetProperty("market_value")?.GetDecimal() ?? 0,
                    PropertyType = prop.GetProperty("property_type")?.GetString() ?? "Residential",
                    YearBuilt = prop.GetProperty("year_built")?.GetInt32() ?? 1900,
                    CountyId = await GetBentonCountyIdAsync(context) // Benton County
                });
            }

            await context.Properties.AddRangeAsync(properties);
            Console.WriteLine($"🏠 Seeded {properties.Count} properties");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Could not seed properties: {ex.Message}");
        }
    }

    private static async System.Threading.Tasks.Task SeedCostMatrices(TerraFusionContext context)
    {
        var kingCountyId = Guid.Parse("00000000-0000-0000-0000-000000000001"); // Placeholder county ID

        var costMatrices = new[]
        {
            new CostMatrix
            {
                CountyId = kingCountyId,
                MatrixType = "PropertyTax",
                BaseRate = 0.0123m,
                Multiplier = 1.0m,
                EffectiveDate = DateTime.UtcNow.AddYears(-1)
            },
            new CostMatrix
            {
                CountyId = kingCountyId,
                MatrixType = "BusinessLicense",
                BaseRate = 50.0m,
                Multiplier = 1.2m,
                EffectiveDate = DateTime.UtcNow.AddYears(-1)
            }
        };

        await context.CostMatrices.AddRangeAsync(costMatrices);
        Console.WriteLine($"💰 Seeded {costMatrices.Length} cost matrices");
    }

    private static async System.Threading.Tasks.Task SeedAIModels(TerraFusionContext context)
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
        Console.WriteLine($"🧠 Seeded {aiModels.Length} AI models");
    }

    private static async System.Threading.Tasks.Task<Guid> GetBentonCountyIdAsync(TerraFusionContext context)
    {
        var bentonCounty = await context.Counties.FirstOrDefaultAsync(c => c.Name == "Benton");
        return bentonCounty?.Id ?? Guid.NewGuid();
    }
}
