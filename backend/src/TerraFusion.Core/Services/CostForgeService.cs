using Microsoft.Extensions.Logging;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Threading.Tasks;
using CostFactorFromInterface = TerraFusion.Core.Services.CostFactorDto;

namespace TerraFusion.API.Services;

/// <summary>
/// CostForge cost calculation service — R2 Wave 1 enriched with real
/// Benton County CAMA cost matrices extracted from quarantine sources.
/// </summary>
public class CostForgeService : ICostForgeService
{
  private readonly ILogger<CostForgeService> _logger;
  private readonly ICostForgeAIService _aiService;
  private readonly ITerraFusionDbContext _context;

  // ── Benton County Cost Matrices (per-sqft by region × building type) ──
  // Source: costforge-ai-workspace/benton_matrix_exact_identifiers.json
  // Three regions: Central Benton (base), East Benton (~0.95×), West Benton (~1.05×)

  private static readonly Dictionary<string, Dictionary<string, decimal>> BentonRegionalBaseCosts = new()
  {
    ["R1"] = new() { ["central"] = 103.21m, ["east"] = 98.05m, ["west"] = 108.37m },
    ["R2"] = new() { ["central"] = 136.67m, ["east"] = 129.83m, ["west"] = 143.50m },
    ["R3"] = new() { ["central"] = 0.80m, ["east"] = 0.76m, ["west"] = 0.84m },
    ["C1"] = new() { ["central"] = 139.99m, ["east"] = 132.99m, ["west"] = 146.99m },
    ["C4"] = new() { ["central"] = 202.98m, ["east"] = 192.83m, ["west"] = 213.13m },
    ["I1"] = new() { ["central"] = 85.50m, ["east"] = 81.23m, ["west"] = 89.78m },
    ["I2"] = new() { ["central"] = 97.72m, ["east"] = 92.83m, ["west"] = 102.61m },
    ["A1"] = new() { ["central"] = 7.20m, ["east"] = 6.84m, ["west"] = 7.56m },
  };

  // Building type metadata for catalog/audit
  private static readonly Dictionary<string, (string Description, string Category)> BuildingTypeInfo = new()
  {
    ["R1"] = ("Single Family Residential", "Residential"),
    ["R2"] = ("Multi-Family Residential", "Residential"),
    ["R3"] = ("Residential Manufactured Home", "Residential"),
    ["C1"] = ("Central Commercial / Retail", "Commercial"),
    ["C4"] = ("Office Building / Warehouse", "Commercial"),
    ["I1"] = ("Light Industrial", "Industrial"),
    ["I2"] = ("Heavy Industrial", "Industrial"),
    ["A1"] = ("Agricultural", "Agricultural"),
  };

  // Component cost breakdown per sqft (source: construction_cost_engine.py)
  private static readonly Dictionary<string, Dictionary<string, decimal>> ComponentCosts = new()
  {
    ["residential"] = new()
    {
      ["foundation"] = 15.00m,
      ["framing"] = 35.00m,
      ["roofing"] = 12.00m,
      ["exterior"] = 25.00m,
      ["interior"] = 40.00m,
      ["mechanical"] = 18.00m,
      ["electrical"] = 8.00m,
      ["plumbing"] = 12.00m
    },
    ["commercial"] = new()
    {
      ["foundation"] = 25.00m,
      ["framing"] = 45.00m,
      ["roofing"] = 18.00m,
      ["exterior"] = 35.00m,
      ["interior"] = 55.00m,
      ["mechanical"] = 28.00m,
      ["electrical"] = 15.00m,
      ["plumbing"] = 18.00m
    },
    ["industrial"] = new()
    {
      ["foundation"] = 20.00m,
      ["framing"] = 30.00m,
      ["roofing"] = 15.00m,
      ["exterior"] = 20.00m,
      ["interior"] = 25.00m,
      ["mechanical"] = 35.00m,
      ["electrical"] = 20.00m,
      ["plumbing"] = 15.00m
    },
    ["agricultural"] = new()
    {
      ["foundation"] = 5.00m,
      ["framing"] = 20.00m,
      ["roofing"] = 10.00m,
      ["exterior"] = 15.00m,
      ["interior"] = 5.00m,
      ["mechanical"] = 8.00m,
      ["electrical"] = 5.00m,
      ["plumbing"] = 3.00m
    },
  };

  // Quality adjustment factors (source: construction_cost_engine.py)
  private static readonly Dictionary<string, double> QualityFactors = new(StringComparer.OrdinalIgnoreCase)
  {
    ["excellent"] = 1.25,
    ["good"] = 1.10,
    ["average"] = 1.00,
    ["fair"] = 0.85,
    ["poor"] = 0.70,
  };

  // Condition factors (source: construction_cost_engine.py)
  private static readonly Dictionary<string, double> ConditionFactors = new(StringComparer.OrdinalIgnoreCase)
  {
    ["new"] = 1.00,
    ["good"] = 0.95,
    ["average"] = 0.85,
    ["fair"] = 0.70,
    ["poor"] = 0.50,
  };

  // Washington State county multipliers (relative to base)
  private static readonly Dictionary<string, double> CountyMultipliers = new(StringComparer.OrdinalIgnoreCase)
    {
        { "benton", 1.00 },       // Base county — real matrices are for Benton
        { "franklin", 0.94 },
        { "walla-walla", 0.97 },
        { "yakima", 0.91 },
        { "spokane", 1.03 },
        { "king", 1.26 },
        { "pierce", 1.06 },
        { "snohomish", 1.11 },
        { "clark", 1.09 },
        { "thurston", 1.00 },
        { "whatcom", 0.96 },
        { "skagit", 0.94 },
        { "cowlitz", 0.89 },
        { "lewis", 0.85 },
        { "grays-harbor", 0.83 },
        { "mason", 0.91 },
        { "kitsap", 1.04 },
        { "jefferson", 0.97 },
        { "clallam", 0.94 },
        { "island", 1.17 },
        { "san-juan", 1.30 },
    };

  // Depreciation parameters
  private const double AnnualDepreciationRate = 0.02;  // 2% per year
  private const double MaxDepreciation = 0.60;          // 60% max
  private const double MinRetainedFactor = 0.40;        // Floor at 40%

  // Inflation
  private const int BaseYear = 2024;
  private const double AnnualInflationRate = 0.03;      // 3% per year

  public CostForgeService(
      ILogger<CostForgeService> logger,
      ICostForgeAIService aiService,
      ITerraFusionDbContext context)
  {
    _logger = logger;
    _aiService = aiService;
    _context = context;
  }

  public async Task<CostAnalysisDto> AnalyzeCostAsync(Guid propertyId)
  {
    try
    {
      // CX-8 fix: Query real property data from the database
      var property = await _context.Properties
          .Include(p => p.County)
          .FirstOrDefaultAsync(p => p.Id == propertyId);

      if (property == null)
      {
        throw new KeyNotFoundException($"Property {propertyId} not found");
      }

      // Build PropertyDto manually (avoids broken AutoMapper Guid->int mapping)
      var propertyDto = new PropertyDto
      {
        ParcelNumber = property.ParcelNumber,
        Address = property.Address ?? "Unknown",
        AssessedValue = property.AssessedValue,
        LandValue = property.LandValue,
        ImprovementValue = property.ImprovementValue,
        CountyName = property.County?.Name ?? "UNKNOWN"
      };

      var result = await AnalyzeCostAsync(propertyDto);
      result.PropertyId = propertyId;
      return result;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error analyzing cost for property {PropertyId}", propertyId);
      throw;
    }
  }

  public async Task<CostAnalysisDto> AnalyzeCostAsync(PropertyDto property)
  {
    await System.Threading.Tasks.Task.CompletedTask;
    var startTime = DateTime.UtcNow;

    try
    {
      _logger.LogInformation("Starting cost analysis for property {PropertyId}", property.Id);

      // Resolve county and sub-region
      var county = property.CountyName?.ToLower().Replace(" ", "-") ?? "benton";
      var countyMultiplier = CountyMultipliers.GetValueOrDefault(county, 1.0);

      // Default to Central Benton sub-region; override based on address heuristics
      var subRegion = ResolveSubRegion(property.Address);

      // Resolve building type code from property type
      var buildingTypeCode = ResolveBuildingTypeCode(property);

      // Step 1 — Base cost from Benton County real matrices
      var baseCostPerSqFt = LookupBaseCost(buildingTypeCode, subRegion);

      // Apply county multiplier for non-Benton counties
      baseCostPerSqFt *= (decimal)countyMultiplier;

      // Estimate square footage from improvement value if no direct sqft
      var squareFootage = (int)Math.Max(property.ImprovementValue / baseCostPerSqFt, 1);
      var baseCost = baseCostPerSqFt * squareFootage;

      // Step 2 — Quality adjustment (default to "average")
      var qualityGrade = "average";
      var qualityFactor = QualityFactors.GetValueOrDefault(qualityGrade, 1.0);
      var qualityAdjustedCost = baseCost * (decimal)qualityFactor;

      // Step 3 — Condition factor (default to "average")
      var condition = "average";
      var conditionFactor = ConditionFactors.GetValueOrDefault(condition, 0.85);

      // Step 4 — Age depreciation
      var age = 25; // Default; real age would come from property.YearBuilt
      var ageFactor = CalculateAgeFactor(age);

      // Step 5 — Inflation adjustment to current year
      var inflationFactor = CalculateInflationFactor();
      var replacementCost = qualityAdjustedCost * (decimal)inflationFactor;

      // Step 6 — Depreciated value
      var depreciatedValue = replacementCost * (decimal)ageFactor * (decimal)conditionFactor;

      // Land value from existing data
      var landValue = property.LandValue;
      var totalValue = depreciatedValue + landValue;

      // Step 7 — Component cost breakdown
      var componentCategory = ResolveCategoryForComponents(buildingTypeCode);
      var componentRates = ComponentCosts.GetValueOrDefault(componentCategory, ComponentCosts["residential"]);
      var components = new List<CostComponentDto>
            {
                new() { Name = "Base Construction Cost", Amount = baseCost, Unit = "sq ft", Quantity = squareFootage, UnitCost = baseCostPerSqFt },
            };

      foreach (var (name, rate) in componentRates)
      {
        var componentAmount = rate * squareFootage * (decimal)qualityFactor;
        components.Add(new CostComponentDto
        {
          Name = char.ToUpper(name[0]) + name[1..],
          Amount = componentAmount,
          Unit = "sq ft",
          Quantity = squareFootage,
          UnitCost = rate
        });
      }

      components.Add(new CostComponentDto { Name = "Quality Adjustment", Amount = qualityAdjustedCost - baseCost, Unit = "factor", Quantity = qualityFactor, UnitCost = 0 });
      components.Add(new CostComponentDto { Name = "Age Depreciation", Amount = depreciatedValue - replacementCost * (decimal)conditionFactor, Unit = "factor", Quantity = ageFactor, UnitCost = 0 });
      components.Add(new CostComponentDto { Name = "Condition Adjustment", Amount = replacementCost * (decimal)conditionFactor - replacementCost, Unit = "factor", Quantity = conditionFactor, UnitCost = 0 });
      components.Add(new CostComponentDto { Name = "Inflation Adjustment", Amount = replacementCost - qualityAdjustedCost, Unit = "factor", Quantity = inflationFactor, UnitCost = 0 });
      components.Add(new CostComponentDto { Name = "Land Value", Amount = landValue, Unit = "acres", Quantity = 1.0, UnitCost = landValue });

      // Step 8 — Confidence score
      var confidenceScore = CalculateConfidenceScore(property, age);

      var analysis = new CostAnalysisDto
      {
        PropertyId = Guid.NewGuid(),
        TotalCost = totalValue,
        LandValue = landValue,
        ImprovementValue = depreciatedValue,
        MarketAdjustment = baseCost * ((decimal)countyMultiplier - 1.0m),
        ConfidenceScore = confidenceScore,
        AnalysisDate = DateTime.UtcNow,
        AnalysisMethod = "CostForge R2 — Benton County CAMA Matrix Calculation",
        Components = components
      };

      var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
      _logger.LogInformation("Cost analysis completed for property {PropertyId} in {Duration}ms. Total: ${Total:N2}",
          property.Id, duration, totalValue);

      return analysis;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error in cost analysis for property {PropertyId}", property.Id);
      throw;
    }
  }

  public async Task<CostComparisonDto> CompareCostsAsync(Guid propertyId1, Guid propertyId2)
  {
    try
    {
      var analysis1 = await AnalyzeCostAsync(propertyId1);
      var analysis2 = await AnalyzeCostAsync(propertyId2);

      var variance = analysis2.TotalCost - analysis1.TotalCost;
      var variancePercentage = analysis1.TotalCost != 0
          ? (double)(variance / analysis1.TotalCost) * 100
          : 0;

      var keyDifferences = new List<string>();

      if (Math.Abs(variancePercentage) > 10)
      {
        keyDifferences.Add($"Significant value difference: {variancePercentage:F1}%");
      }

      if (Math.Abs(analysis1.LandValue - analysis2.LandValue) > 10000)
      {
        keyDifferences.Add($"Land value variance: ${Math.Abs(analysis1.LandValue - analysis2.LandValue):C}");
      }

      if (Math.Abs(analysis1.ImprovementValue - analysis2.ImprovementValue) > 15000)
      {
        keyDifferences.Add($"Improvement value variance: ${Math.Abs(analysis1.ImprovementValue - analysis2.ImprovementValue):C}");
      }

      return new CostComparisonDto
      {
        Property1 = analysis1,
        Property2 = analysis2,
        VarianceAmount = variance,
        VariancePercentage = variancePercentage,
        KeyDifferences = keyDifferences
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error comparing costs between properties {PropertyId1} and {PropertyId2}", propertyId1, propertyId2);
      throw;
    }
  }

  public async Task<CostForecastDto> ForecastCostAsync(Guid propertyId, int years)
  {
    try
    {
      var currentAnalysis = await AnalyzeCostAsync(propertyId);

      // Washington State historical appreciation rate (3.5% annually average)
      var appreciationRate = 0.035;

      var yearlyForecasts = new List<YearlyForecastDto>();
      var currentValue = currentAnalysis.TotalCost;

      for (int year = 1; year <= years; year++)
      {
        var projectedValue = currentValue * (decimal)Math.Pow(1 + appreciationRate, year);
        var confidenceLevel = Math.Max(0.6, 0.95 - (year * 0.05)); // Confidence decreases over time

        yearlyForecasts.Add(new YearlyForecastDto
        {
          Year = DateTime.Now.Year + year,
          ProjectedValue = projectedValue,
          ConfidenceLevel = confidenceLevel
        });
      }

      return new CostForecastDto
      {
        PropertyId = propertyId,
        ForecastYears = years,
        CurrentValue = currentValue,
        ProjectedValue = yearlyForecasts.Last().ProjectedValue,
        AnnualAppreciationRate = appreciationRate,
        YearlyForecasts = yearlyForecasts
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error forecasting costs for property {PropertyId}", propertyId);
      throw;
    }
  }

  public async Task<CostBreakdownDto> GetCostBreakdownAsync(Guid propertyId)
  {
    try
    {
      var analysis = await AnalyzeCostAsync(propertyId);

      var categories = new List<CostCategoryDto>
            {
                new()
                {
                    Name = "Land Value",
                    Amount = analysis.LandValue,
                    Percentage = (double)(analysis.LandValue / analysis.TotalCost * 100),
                    Components = analysis.Components.Where(c => c.Name.Contains("Land")).ToList()
                },
                new()
                {
                    Name = "Improvements",
                    Amount = analysis.ImprovementValue,
                    Percentage = (double)(analysis.ImprovementValue / analysis.TotalCost * 100),
                    Components = analysis.Components.Where(c => !c.Name.Contains("Land")).ToList()
                }
            };

      return new CostBreakdownDto
      {
        PropertyId = propertyId,
        TotalValue = analysis.TotalCost,
        Categories = categories
      };
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting cost breakdown for property {PropertyId}", propertyId);
      throw;
    }
  }

  public async Task<decimal> CalculateAssessmentValueAsync(Guid propertyId)
  {
    try
    {
      var analysis = await AnalyzeCostAsync(propertyId);
      return analysis.TotalCost;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error calculating assessment value for property {PropertyId}", propertyId);
      throw;
    }
  }

  public async Task<IEnumerable<CostFactorFromInterface>> GetCostFactorsAsync(string region)
  {
    try
    {
      var normalizedRegion = region.ToLower().Replace(" ", "-");
      var countyMultiplier = CountyMultipliers.GetValueOrDefault(normalizedRegion, 1.0);

      var factors = new List<CostFactorFromInterface>
            {
                new() { Name = "County Multiplier", Factor = countyMultiplier, Description = $"Market conditions for {region} relative to Benton County base", Region = region, EffectiveDate = DateTime.UtcNow },
                new() { Name = "Sub-Region: Central Benton", Factor = 1.0, Description = "Central Benton County base rate", Region = "Central Benton", EffectiveDate = DateTime.UtcNow },
                new() { Name = "Sub-Region: East Benton", Factor = 0.95, Description = "East Benton ~5% below central", Region = "East Benton", EffectiveDate = DateTime.UtcNow },
                new() { Name = "Sub-Region: West Benton", Factor = 1.05, Description = "West Benton ~5% above central", Region = "West Benton", EffectiveDate = DateTime.UtcNow },
                new() { Name = "Inflation Factor", Factor = CalculateInflationFactor(), Description = $"Annual {AnnualInflationRate:P0} from base year {BaseYear}", Region = region, EffectiveDate = DateTime.UtcNow },
            };

      return await System.Threading.Tasks.Task.FromResult(factors);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting cost factors for region {Region}", region);
      throw;
    }
  }

  public async Task<CostMatrixDto> GetCostMatrixAsync(string buildingType, string region)
  {
    try
    {
      var normalizedType = buildingType.ToUpper();
      var normalizedRegion = region.ToLower().Replace(" ", "-");

      // Check if we have a direct Benton code match
      var typeCode = NormalizeBuildingTypeCode(normalizedType);
      var subRegion = ResolveSubRegion(null); // default central

      var baseCost = LookupBaseCost(typeCode, subRegion);
      var countyMultiplier = CountyMultipliers.GetValueOrDefault(normalizedRegion, 1.0);
      var adjustedBaseCost = baseCost * (decimal)countyMultiplier;

      var componentCategory = ResolveCategoryForComponents(typeCode);
      var components = ComponentCosts.GetValueOrDefault(componentCategory, ComponentCosts["residential"]);

      return await System.Threading.Tasks.Task.FromResult(new CostMatrixDto
      {
        BuildingType = buildingType,
        Region = region,
        BaseCostPerSquareFoot = adjustedBaseCost,
        QualityFactors = new Dictionary<string, double>(QualityFactors),
        LocationFactors = new Dictionary<string, double>
                {
                    { "county_multiplier", countyMultiplier },
                    { "sub_region_central", 1.0 },
                    { "sub_region_east", 0.95 },
                    { "sub_region_west", 1.05 },
                },
        ComponentCosts = new Dictionary<string, decimal>(components),
        LastUpdated = DateTime.UtcNow
      });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting cost matrix for {BuildingType} in {Region}", buildingType, region);
      throw;
    }
  }

  public Task<CostMatrixCatalogDto> GetCostMatricesAsync()
  {
    var entries = new List<CostMatrixEntryDto>();

    foreach (var (code, regionCosts) in BentonRegionalBaseCosts)
    {
      var info = BuildingTypeInfo.TryGetValue(code, out var typeInfo) ? typeInfo : (Description: code, Category: "Unknown");
      var componentCategory = ResolveCategoryForComponents(code);
      var components = ComponentCosts.GetValueOrDefault(componentCategory, ComponentCosts["residential"]);

      entries.Add(new CostMatrixEntryDto
      {
        Code = code,
        Description = info.Description,
        Category = info.Category,
        RegionalBaseCosts = new Dictionary<string, decimal>(regionCosts),
        ComponentCosts = new Dictionary<string, decimal>(components),
      });
    }

    var catalog = new CostMatrixCatalogDto
    {
      BuildingTypes = entries,
      RegionalBaseCosts = BentonRegionalBaseCosts.ToDictionary(
            kvp => kvp.Key,
            kvp => new Dictionary<string, decimal>(kvp.Value)),
      QualityFactors = new Dictionary<string, double>(QualityFactors),
      ConditionFactors = new Dictionary<string, double>(ConditionFactors),
      Depreciation = new DepreciationConfigDto
      {
        AnnualRate = AnnualDepreciationRate,
        MaxDepreciation = MaxDepreciation,
        MinRetainedValue = MinRetainedFactor,
      },
      BaseYear = BaseYear,
      AnnualInflationRate = AnnualInflationRate,
      GeneratedAt = DateTime.UtcNow,
    };

    return System.Threading.Tasks.Task.FromResult(catalog);
  }

  // ── Private helpers ──

  private static string ResolveSubRegion(string? address)
  {
    // Heuristic: map address keywords to Benton County sub-regions.
    // Without geocoding, default to central.
    if (string.IsNullOrWhiteSpace(address))
      return "central";

    var lower = address.ToLower();
    if (lower.Contains("kennewick") || lower.Contains("finley") || lower.Contains("east"))
      return "east";
    if (lower.Contains("prosser") || lower.Contains("benton city") || lower.Contains("west"))
      return "west";

    return "central"; // Richland, West Richland, and default
  }

  private static string ResolveBuildingTypeCode(PropertyDto property)
  {
    // Map property type string to Benton County building type code.
    // This is a simplified mapper; richer data comes from PACS prop_type_cd.
    var propType = property.CountyName; // Placeholder — real mapping from property type field
    return "R1"; // Default to single family residential
  }

  private static string NormalizeBuildingTypeCode(string input)
  {
    // Accept either Benton codes (R1, C1) or generic names (RESIDENTIAL, COMMERCIAL)
    return input.ToUpper() switch
    {
      "RESIDENTIAL" or "SINGLE_FAMILY" => "R1",
      "MULTI_FAMILY" or "MULTIFAMILY" => "R2",
      "MANUFACTURED" or "MOBILE" => "R3",
      "COMMERCIAL" or "RETAIL" => "C1",
      "OFFICE" or "WAREHOUSE" => "C4",
      "LIGHT_INDUSTRIAL" => "I1",
      "INDUSTRIAL" or "HEAVY_INDUSTRIAL" => "I2",
      "AGRICULTURAL" or "FARM" => "A1",
      var code when BentonRegionalBaseCosts.ContainsKey(code) => code,
      _ => "R1", // Default fallback
    };
  }

  private static decimal LookupBaseCost(string typeCode, string subRegion)
  {
    if (BentonRegionalBaseCosts.TryGetValue(typeCode, out var regionCosts))
    {
      return regionCosts.GetValueOrDefault(subRegion, regionCosts["central"]);
    }
    // Fallback to R1 central
    return BentonRegionalBaseCosts["R1"]["central"];
  }

  private static string ResolveCategoryForComponents(string typeCode)
  {
    return typeCode switch
    {
      "R1" or "R2" or "R3" => "residential",
      "C1" or "C4" => "commercial",
      "I1" or "I2" => "industrial",
      "A1" => "agricultural",
      _ => "residential",
    };
  }

  private static double CalculateAgeFactor(int age)
  {
    if (age <= 0) return 1.0;
    var rawDepreciation = age * AnnualDepreciationRate;
    var cappedDepreciation = Math.Min(rawDepreciation, MaxDepreciation);
    return Math.Max(1.0 - cappedDepreciation, MinRetainedFactor);
  }

  private static double CalculateInflationFactor()
  {
    var yearsFromBase = DateTime.UtcNow.Year - BaseYear;
    if (yearsFromBase <= 0) return 1.0;
    return Math.Pow(1.0 + AnnualInflationRate, yearsFromBase);
  }

  private static double CalculateConfidenceScore(PropertyDto property, int age)
  {
    var score = 94.0; // Base from quarantine engine
    if (property.AssessedValue <= 0) score -= 2.0;
    if (property.LandValue <= 0) score -= 1.0;
    if (property.ImprovementValue <= 0) score -= 1.0;
    if (string.IsNullOrEmpty(property.Address)) score -= 0.5;
    if (age > 100) score -= 5.0;
    else if (age > 50) score -= 2.0;
    return Math.Max(score / 100.0, 0.85);
  }
}
