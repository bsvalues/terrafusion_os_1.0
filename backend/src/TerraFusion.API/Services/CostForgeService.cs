using Microsoft.Extensions.Logging;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.API.Controllers;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using CostFactorFromInterface = TerraFusion.Core.Services.CostFactorDto;

namespace TerraFusion.API.Services;

/// <summary>
/// CostForge Service Implementation — wired to real Benton 2025 cost matrix.
/// Uses BentonCostData (66-entry matrix, 11 building types × 6 Reval Areas),
/// real depreciation brackets, and quality/condition/complexity factors.
/// </summary>
public class CostForgeService : ICostForgeService
{
    private readonly ILogger<CostForgeService> _logger;
    private readonly ICostForgeAIService _aiService;
    private readonly ITerraFusionDbContext _context;

    private static string NormalizeMatrixBuildingType(string buildingType)
    {
        var normalized = buildingType.Trim().ToUpperInvariant();

        return normalized switch
        {
            "R" or "RES" or "RESIDENTIAL" or "SFR" => "R1",
            "R1" => "R1",
            "R2" => "R2",
            "C" or "COMM" or "COMMERCIAL" => "C1",
            "C1" => "C1",
            "C2" => "C2",
            "C3" => "C3",
            "C4" => "C4",
            "I" or "IND" or "INDUSTRIAL" => "I1",
            "I1" => "I1",
            "A" or "AG" or "AGR" or "FARM" => "A1",
            "A1" => "A1",
            "A2" or "RANCH" => "A2",
            "S" or "INST" or "INSTITUTIONAL" or "HOSPITAL" => "S1",
            "S1" => "S1",
            "S2" or "SCHOOL" => "S2",
            _ => normalized,
        };
    }

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
        var property = await _context.Properties
            .Include(p => p.County)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == propertyId);

        if (property == null)
            throw new KeyNotFoundException($"Property {propertyId} not found");

        var cama = await _context.CamaCharacteristics
            .AsNoTracking()
            .Where(c => c.ParcelId == property.ParcelNumber && c.CountyId == property.CountyId)
            .OrderByDescending(c => c.TaxYear)
            .FirstOrDefaultAsync();

        if (cama == null)
            throw new InvalidOperationException(
                $"No CAMA characteristics found for parcel {property.ParcelNumber}. Run a sync to populate CAMA data.");

        var rawBuildingType = cama.BuildingType;
        if (string.IsNullOrWhiteSpace(rawBuildingType))
            throw new InvalidOperationException(
                $"CAMA record for parcel {property.ParcelNumber} (TaxYear {cama.TaxYear}) " +
                $"has no BuildingType classification. Re-run PACS sync to populate.");

        var buildingType = NormalizeMatrixBuildingType(rawBuildingType);
        if (!string.Equals(rawBuildingType, buildingType, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation(
                "Normalized CAMA building type {RawBuildingType} to matrix code {MatrixBuildingType} for parcel {ParcelNumber}",
                rawBuildingType,
                buildingType,
                property.ParcelNumber);
        }

        var revalArea = CostForgeController.NormalizeExplicitRevalArea(cama.Region)
            ?? throw new InvalidOperationException(
                $"CAMA record for parcel {property.ParcelNumber} (TaxYear {cama.TaxYear}) has no explicit Reval Area/Cycle.");
        var squareFeet      = cama.SquareFeet > 0 ? cama.SquareFeet : 1m;

        int yearBuilt;
        if (cama.YearBuilt.HasValue)
            yearBuilt = cama.YearBuilt.Value;
        else if (property.YearBuilt.HasValue)
            yearBuilt = property.YearBuilt.Value;
        else
        {
            yearBuilt = DateTime.UtcNow.Year - 25;
            _logger.LogWarning(
                "Parcel {Parcel}: neither CamaCharacteristic.YearBuilt nor Property.YearBuilt is set. " +
                "Defaulting to {YearBuilt} (age 25) for depreciation — re-run PACS sync.",
                property.ParcelNumber, yearBuilt);
        }
        var qualityGrade    = cama.QualityGrade    ?? "STANDARD";
        var conditionGrade  = cama.ConditionGrade  ?? "GOOD";
        var complexityGrade = cama.ComplexityGrade ?? "STANDARD";

        var result = CostForgeController.ComputeCostEstimate(
            buildingType, revalArea, squareFeet,
            yearBuilt, qualityGrade, conditionGrade, complexityGrade);

        if (result is null)
            throw new InvalidOperationException(
                $"Building type '{rawBuildingType}' (normalized '{buildingType}') or Reval Area '{revalArea}' not found in Benton 2025 cost matrix.");

        var landValue  = property.LandValue;
        var totalValue = CostForgeController.BankersRound(result.AssessedValue + landValue);

        // Use pre-computed per-sqft intermediates from ComputeCostEstimate (Task 6 Benton Method fix)
        var rcn  = CostForgeController.BankersRound(result.RcnPerSqft  * result.SquareFeet);
        var rcnd = CostForgeController.BankersRound(result.RcndPerSqft * result.SquareFeet);
        var physicalDepreciation = rcn - rcnd;           // positive loss (rcn > rcnd when deprFactor < 1)
        var conditionAdjustment  = result.AssessedValue - rcnd; // positive or negative

        var components = new List<CostComponentDto>
        {
            new() { Name = $"RCN — {result.BuildingTypeLabel} ({result.RevalArea})",
                    Amount = rcn, Unit = "sqft", Quantity = (double)squareFeet, UnitCost = result.BaseCostPerSqft },
            new() { Name = $"Physical Depreciation (age {result.Age} yrs, factor {result.DepreciationFactor:P0})",
                    Amount = physicalDepreciation, Unit = "factor", Quantity = (double)result.DepreciationFactor, UnitCost = 0m },
            new() { Name = $"Condition Adjustment ({result.ConditionGrade}, ×{result.ConditionFactor})",
                    Amount = conditionAdjustment, Unit = "factor", Quantity = (double)result.ConditionFactor, UnitCost = 0m },
            new() { Name = "RCNLD (Depreciated Improvement)", Amount = result.AssessedValue, Unit = "$", Quantity = 1.0, UnitCost = result.AssessedValue },
            new() { Name = "Land Value", Amount = landValue, Unit = "$", Quantity = 1.0, UnitCost = landValue },
        };

        _logger.LogInformation(
            "CostForge analysis: parcel={Parcel} type={Type} region={Region} sqft={Sqft} " +
            "yearBuilt={YearBuilt} age={Age} quality={Quality} condition={Condition} " +
            "rcn={Rcn:C} dep={Dep:P0} rcnld={Rcnld:C} land={Land:C} total={Total:C}",
            property.ParcelNumber, buildingType, revalArea, squareFeet,
            yearBuilt, result.Age, qualityGrade, conditionGrade,
            rcn, result.DepreciationFactor, result.AssessedValue, landValue, totalValue);

        return new CostAnalysisDto
        {
            PropertyId       = propertyId,
            TotalCost        = totalValue,
            LandValue        = landValue,
            ImprovementValue = result.AssessedValue,
            MarketAdjustment = 0m,
            ConfidenceScore  = 0.92,
            AnalysisDate     = DateTime.UtcNow,
            AnalysisMethod   = $"CostForge Benton Cost Approach FY{result.MatrixYear} — {result.Source}",
            Components       = components,
        };
    }

    public async Task<CostAnalysisDto> AnalyzeCostAsync(PropertyDto property)
    {
        if (property.Id != Guid.Empty)
            return await AnalyzeCostAsync(property.Id);

        // Caller provided DTO without Guid — look up property by parcel+county
        var dbProp = await _context.Properties
            .AsNoTracking()
            .Where(p => p.ParcelNumber == property.ParcelNumber && p.CountyId == property.CountyId)
            .Select(p => p.Id)
            .FirstOrDefaultAsync();

        if (dbProp == Guid.Empty)
            throw new KeyNotFoundException(
                $"Property not found for parcel {property.ParcelNumber} in county {property.CountyId}");

        return await AnalyzeCostAsync(dbProp);
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
                keyDifferences.Add($"Significant value difference: {variancePercentage:F1}%");

            if (Math.Abs(analysis1.LandValue - analysis2.LandValue) > 10000)
                keyDifferences.Add($"Land value variance: ${Math.Abs(analysis1.LandValue - analysis2.LandValue):C}");

            if (Math.Abs(analysis1.ImprovementValue - analysis2.ImprovementValue) > 15000)
                keyDifferences.Add($"Improvement value variance: ${Math.Abs(analysis1.ImprovementValue - analysis2.ImprovementValue):C}");

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
                var confidenceLevel = Math.Max(0.6, 0.95 - (year * 0.05));

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
                    Percentage = analysis.TotalCost != 0m
                        ? (double)(analysis.LandValue / analysis.TotalCost * 100)
                        : 0.0,
                    Components = analysis.Components.Where(c => c.Name.Contains("Land")).ToList()
                },
                new()
                {
                    Name = "Improvements",
                    Amount = analysis.ImprovementValue,
                    Percentage = analysis.TotalCost != 0m
                        ? (double)(analysis.ImprovementValue / analysis.TotalCost * 100)
                        : 0.0,
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
            var factors = new List<CostFactorFromInterface>
            {
                new() { Name = "Regional Adjustment", Factor = 1.0, Description = $"Benton County Reval Area: {region}", Region = region, EffectiveDate = DateTime.UtcNow },
                new() { Name = "Matrix Source", Factor = 1.0, Description = "Benton County Assessor – Cost Matrix 2025", Region = region, EffectiveDate = DateTime.UtcNow },
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
            return await System.Threading.Tasks.Task.FromResult(new CostMatrixDto
            {
                BuildingType = buildingType,
                Region = region,
                BaseCostPerSquareFoot = 0m, // populated by ComputeCostEstimate when called
                QualityFactors = new Dictionary<string, double>(),
                LocationFactors = new Dictionary<string, double>(),
                LastUpdated = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost matrix for {BuildingType} in {Region}", buildingType, region);
            throw;
        }
    }
}
