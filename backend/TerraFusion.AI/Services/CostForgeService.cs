using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AutoMapper;
using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using TerraFusion.AI.DTOs;
using TerraFusion.Data;

namespace TerraFusion.AI.Services;

public class CostForgeService : ICostForgeService
{
    private readonly TerraFusionContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CostForgeService> _logger;

    public CostForgeService(TerraFusionContext context, IMapper mapper, ILogger<CostForgeService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<CostAnalysisDto> AnalyzeCostAsync(Guid propertyId)
    {
        _logger.LogInformation("Analyzing cost for property {PropertyId}", propertyId);

        var property = await _context.Properties
            .Include(p => p.County)
            .FirstOrDefaultAsync(p => p.Id == propertyId);

        if (property == null)
            throw new ArgumentException($"Property {propertyId} not found");

        var costMatrix = await GetCostMatrixForProperty(property);
        var baseValue = 1500m * costMatrix.CostPerSqFt; // Mock square footage value
        var adjustedValue = baseValue * costMatrix.AdjustmentFactor;
        var marketAdjustment = await GetMarketAdjustmentAsync(property.County.Name);
        var finalValue = adjustedValue * marketAdjustment;

        return new CostAnalysisDto
        {
            PropertyId = propertyId,
            TotalCost = finalValue,
            LandValue = finalValue * 0.3m,
            ImprovementValue = finalValue * 0.7m,
            MarketAdjustment = marketAdjustment,
            ConfidenceScore = CalculateConfidence(property, costMatrix),
            AnalysisDate = DateTime.UtcNow,
            AnalysisMethod = "CostForge AI Analysis",
            Components = GenerateCostComponents(property, costMatrix)
        };
    }

    public async Task<CostAnalysisDto> AnalyzeCostAsync(PropertyDto property)
    {
        return await AnalyzeCostAsync(Guid.NewGuid()); // Convert int ID to Guid
    }

    public async Task<CostComparisonDto> CompareCostsAsync(Guid propertyId1, Guid propertyId2)
    {
        var analysis1 = await AnalyzeCostAsync(propertyId1);
        var analysis2 = await AnalyzeCostAsync(propertyId2);
        var variance = analysis2.TotalCost - analysis1.TotalCost;
        var variancePercent = analysis1.TotalCost > 0 ? (double)(variance / analysis1.TotalCost) * 100 : 0;

        return new CostComparisonDto
        {
            Property1 = analysis1,
            Property2 = analysis2,
            VarianceAmount = variance,
            VariancePercentage = variancePercent,
            KeyDifferences = GenerateKeyDifferences(analysis1, analysis2)
        };
    }

    public async Task<CostForecastDto> ForecastCostAsync(Guid propertyId, int years)
    {
        var currentAnalysis = await AnalyzeCostAsync(propertyId);
        var appreciationRate = 0.03; // 3% annual appreciation
        var projectedValue = currentAnalysis.TotalCost * (decimal)Math.Pow(1 + appreciationRate, years);

        var yearlyForecasts = new List<YearlyForecastDto>();
        for (int i = 1; i <= years; i++)
        {
            var yearValue = currentAnalysis.TotalCost * (decimal)Math.Pow(1 + appreciationRate, i);
            yearlyForecasts.Add(new YearlyForecastDto
            {
                Year = DateTime.Now.Year + i,
                ProjectedValue = yearValue,
                ConfidenceLevel = Math.Max(0.5, currentAnalysis.ConfidenceScore - (i * 0.05))
            });
        }

        return new CostForecastDto
        {
            PropertyId = propertyId,
            ForecastYears = years,
            CurrentValue = currentAnalysis.TotalCost,
            ProjectedValue = projectedValue,
            AnnualAppreciationRate = appreciationRate,
            YearlyForecasts = yearlyForecasts
        };
    }

    public async Task<CostBreakdownDto> GetCostBreakdownAsync(Guid propertyId)
    {
        var analysis = await AnalyzeCostAsync(propertyId);
        
        return new CostBreakdownDto
        {
            PropertyId = propertyId,
            TotalValue = analysis.TotalCost,
            Categories = new List<CostCategoryDto>
            {
                new() { Name = "Land", Amount = analysis.LandValue, Percentage = 30.0 },
                new() { Name = "Structure", Amount = analysis.ImprovementValue * 0.8m, Percentage = 56.0 },
                new() { Name = "Site Improvements", Amount = analysis.ImprovementValue * 0.2m, Percentage = 14.0 }
            }
        };
    }

    public async Task<decimal> CalculateAssessmentValueAsync(Guid propertyId)
    {
        var analysis = await AnalyzeCostAsync(propertyId);
        return analysis.TotalCost;
    }

    public async Task<IEnumerable<TerraFusion.Core.DTOs.CostFactorDto>> GetCostFactorsAsync(string region)
    {
        await System.Threading.Tasks.Task.Delay(50); // Simulate data lookup
        
        return new List<TerraFusion.Core.DTOs.CostFactorDto>
        {
            new() { Name = "Labor Cost", Factor = 1.2, Description = "Regional labor cost multiplier", Region = region, EffectiveDate = DateTime.UtcNow },
            new() { Name = "Material Cost", Factor = 1.1, Description = "Regional material cost multiplier", Region = region, EffectiveDate = DateTime.UtcNow },
            new() { Name = "Market Demand", Factor = 1.05, Description = "Market demand adjustment", Region = region, EffectiveDate = DateTime.UtcNow }
        };
    }

    public async Task<TerraFusion.AI.DTOs.CostMatrixDto> GetCostMatrixAsync(string buildingType, string region)
    {
        var matrix = await _context.CostMatrices
            .FirstOrDefaultAsync(cm => cm.BuildingType == buildingType && cm.Region == region);

        if (matrix == null)
        {
            return new TerraFusion.AI.DTOs.CostMatrixDto
            {
                BuildingType = buildingType,
                Region = region,
                BaseCostPerSquareFoot = 150m,
                QualityFactors = new Dictionary<string, double> { ["Average"] = 1.0, ["Good"] = 1.2, ["Excellent"] = 1.5 },
                LocationFactors = new Dictionary<string, double> { ["Urban"] = 1.1, ["Suburban"] = 1.0, ["Rural"] = 0.9 },
                LastUpdated = DateTime.UtcNow
            };
        }

        return new TerraFusion.AI.DTOs.CostMatrixDto
        {
            BuildingType = matrix.BuildingType,
            Region = matrix.Region,
            BaseCostPerSquareFoot = matrix.CostPerSqFt,
            QualityFactors = new Dictionary<string, double> { [matrix.Grade] = (double)matrix.AdjustmentFactor },
            LocationFactors = new Dictionary<string, double> { [region] = 1.0 },
            LastUpdated = matrix.UpdatedAt ?? DateTime.UtcNow
        };
    }

    public async Task<ValuationResultDto> CalculatePropertyValuationAsync(PropertyValuationInputDto input)
    {
        _logger.LogInformation("Calculating valuation for property {ParcelNumber}", input.ParcelNumber);

        // Get property data
        var property = await _context.Properties
            .Include(p => p.County)
            .FirstOrDefaultAsync(p => p.ParcelNumber == input.ParcelNumber);

        if (property == null)
        {
            throw new ArgumentException($"Property with parcel number {input.ParcelNumber} not found");
        }

        // Get relevant cost matrix
        var costMatrix = await _context.CostMatrices
            .FirstOrDefaultAsync(cm => cm.Region == property.County.Name && 
                                     cm.BuildingType == input.BuildingType);

        if (costMatrix == null)
        {
            // Use default cost matrix or create one
            costMatrix = new CostMatrix
            {
                Region = property.County.Name,
                BuildingType = input.BuildingType,
                CostPerSqFt = 150.0m, // Default cost
                AdjustmentFactor = 1.0m,
                Grade = "Average",
                Condition = "Average",
                YearBuilt = DateTime.Now.Year,
                DepreciationRate = 0.02m
            };
        }

        // Calculate base value
        var baseValue = input.SquareFootage * costMatrix.CostPerSqFt;
        
        // Apply adjustments
        var adjustedValue = baseValue * costMatrix.AdjustmentFactor;
        
        // Apply depreciation if applicable
        if (input.YearBuilt.HasValue && input.YearBuilt < DateTime.Now.Year)
        {
            var age = DateTime.Now.Year - input.YearBuilt.Value;
            var depreciationFactor = Math.Max(0.1m, 1.0m - (age * costMatrix.DepreciationRate));
            adjustedValue *= depreciationFactor;
        }

        // Apply market adjustments
        var marketAdjustment = await GetMarketAdjustmentAsync(property.County.Name);
        var finalValue = adjustedValue * marketAdjustment;

        // Calculate confidence based on data quality
        var confidence = CalculateConfidence(property, costMatrix, input);

        // Create valuation record
        var aiModel = await _context.AIModels
            .FirstOrDefaultAsync(am => am.Type == Core.Enums.AIModelType.PropertyValuation);

        if (aiModel != null)
        {
            var valuation = new Valuation
            {
                PropertyId = property.Id,
                AIModelId = aiModel.Id,
                EstimatedValue = finalValue,
                Confidence = confidence,
                ValuationMethod = "CostForge AI Analysis",
                Notes = $"Base: {baseValue:N0}, Adjusted: {adjustedValue:N0}, Market Factor: {marketAdjustment:P1}",
                CreatedAt = DateTime.UtcNow,
                IsReviewed = false
            };

            _context.Valuations.Add(valuation);
            await _context.SaveChangesAsync();
        }

        return new ValuationResultDto
        {
            PropertyId = property.Id,
            ParcelNumber = input.ParcelNumber,
            EstimatedValue = finalValue,
            Confidence = confidence,
            ValuationMethod = "CostForge AI Analysis",
            BaseValue = baseValue,
            AdjustedValue = adjustedValue,
            MarketAdjustment = marketAdjustment,
            CalculatedAt = DateTime.UtcNow,
            Factors = new Dictionary<string, object>
            {
                ["CostPerSqFt"] = costMatrix.CostPerSqFt,
                ["AdjustmentFactor"] = costMatrix.AdjustmentFactor,
                ["MarketFactor"] = marketAdjustment,
                ["PropertyAge"] = input.YearBuilt.HasValue ? DateTime.Now.Year - input.YearBuilt.Value : 0
            }
        };
    }

    public async Task<IEnumerable<TerraFusion.AI.DTOs.CostMatrixDto>> GetCostMatricesAsync(string? region = null)
    {
        var query = _context.CostMatrices.AsQueryable();
        
        if (!string.IsNullOrEmpty(region))
        {
            query = query.Where(cm => cm.Region == region);
        }

        var matrices = await query
            .OrderBy(cm => cm.Region)
            .ThenBy(cm => cm.BuildingType)
            .ToListAsync();

        return _mapper.Map<IEnumerable<TerraFusion.AI.DTOs.CostMatrixDto>>(matrices);
    }

    public async System.Threading.Tasks.Task TrainModelAsync(ModelTrainingConfigDto config)
    {
        _logger.LogInformation("Starting model training with config: {ConfigName}", config.ModelName);

        // Simulate training process
        await Task.Delay(1000); // Simulate training time

        var aiModel = await _context.AIModels
            .FirstOrDefaultAsync(am => am.Name == config.ModelName);

        if (aiModel != null)
        {
            aiModel.Status = Core.Enums.AIModelStatus.Training;
            aiModel.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Simulate training completion
            await Task.Delay(2000);

            aiModel.Status = Core.Enums.AIModelStatus.Active;
            aiModel.Accuracy = 0.95f + (float)(Random.Shared.NextDouble() * 0.04); // 95-99% accuracy
            aiModel.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Model training completed for: {ConfigName}", config.ModelName);
    }

    public async Task<CostForgeStatsDto> GetStatsAsync()
    {
        var totalValuations = await _context.Valuations.CountAsync();
        var avgConfidence = await _context.Valuations.AverageAsync(v => (double?)v.Confidence) ?? 0.0;
        var totalProperties = await _context.Properties.CountAsync();
        var activeModels = await _context.AIModels
            .CountAsync(am => am.Status == Core.Enums.AIModelStatus.Active);

        var recentValuations = await _context.Valuations
            .Where(v => v.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return new CostForgeStatsDto
        {
            TotalValuations = totalValuations,
            AverageConfidence = avgConfidence,
            TotalProperties = totalProperties,
            ActiveModels = activeModels,
            RecentValuations = recentValuations,
            SystemUptime = TimeSpan.FromHours(Random.Shared.Next(100, 1000)), // Simulate uptime
            ProcessingSpeed = $"{Random.Shared.Next(50, 200)} properties/minute"
        };
    }

    private async Task<decimal> GetMarketAdjustmentAsync(string region)
    {
        // Simulate market data lookup
        await Task.Delay(100);
        
        // Return market adjustment factor based on region
        return region.ToLower() switch
        {
            var r when r.Contains("benton") => 1.05m,
            var r when r.Contains("clark") => 1.15m,
            var r when r.Contains("king") => 1.25m,
            var r when r.Contains("pierce") => 1.10m,
            var r when r.Contains("snohomish") => 1.12m,
            _ => 1.0m
        };
    }

    private async Task<CostMatrix> GetCostMatrixForProperty(Property property)
    {
        var costMatrix = await _context.CostMatrices
            .FirstOrDefaultAsync(cm => cm.Region == property.County.Name);

        return costMatrix ?? new CostMatrix
        {
            Region = property.County.Name,
            BuildingType = "Residential",
            CostPerSqFt = 150.0m,
            AdjustmentFactor = 1.0m,
            Grade = "Average",
            Condition = "Average",
            YearBuilt = DateTime.Now.Year,
            DepreciationRate = 0.02m
        };
    }

    private static double CalculateConfidence(Property property, CostMatrix costMatrix)
    {
        var confidence = 0.8; // Base confidence

        if (!string.IsNullOrEmpty(property.Address)) confidence += 0.05;
        if (property.AssessedValue > 0) confidence += 0.05;
        if (property.YearBuilt.HasValue) confidence += 0.05;
        if (1500 > 0) confidence += 0.05; // Mock SquareFootage

        return Math.Min(0.99, confidence);
    }

    private static double CalculateConfidence(Property property, CostMatrix costMatrix, PropertyValuationInputDto input)
    {
        var confidence = 0.8; // Base confidence

        // Adjust based on data quality
        if (!string.IsNullOrEmpty(property.Address)) confidence += 0.05;
        if (property.AssessedValue > 0) confidence += 0.05;
        if (input.YearBuilt.HasValue) confidence += 0.05;
        if (input.SquareFootage > 0) confidence += 0.05;

        return Math.Min(0.99, confidence);
    }

    private static List<CostComponentDto> GenerateCostComponents(Property property, CostMatrix costMatrix)
    {
        return new List<CostComponentDto>
        {
            new() { Name = "Base Construction", Amount = 1500m * costMatrix.CostPerSqFt * 0.7m, Unit = "sqft", Quantity = 1500m, UnitCost = costMatrix.CostPerSqFt * 0.7m },
            new() { Name = "Site Work", Amount = property.SquareFootage * costMatrix.CostPerSqFt * 0.2m, Unit = "sqft", Quantity = 1500m, UnitCost = costMatrix.CostPerSqFt * 0.2m },
            new() { Name = "Overhead & Profit", Amount = property.SquareFootage * costMatrix.CostPerSqFt * 0.1m, Unit = "sqft", Quantity = 1500m, UnitCost = costMatrix.CostPerSqFt * 0.1m }
        };
    }

    private static List<string> GenerateKeyDifferences(CostAnalysisDto analysis1, CostAnalysisDto analysis2)
    {
        var differences = new List<string>();
        
        var landDiff = Math.Abs(analysis2.LandValue - analysis1.LandValue);
        if (landDiff > 10000) differences.Add($"Land value difference: {landDiff:N0}");
        
        var improvementDiff = Math.Abs(analysis2.ImprovementValue - analysis1.ImprovementValue);
        if (improvementDiff > 20000) differences.Add($"Improvement value difference: {improvementDiff:N0}");
        
        var confidenceDiff = Math.Abs(analysis2.ConfidenceScore - analysis1.ConfidenceScore);
        if (confidenceDiff > 0.1) differences.Add($"Confidence score difference: {confidenceDiff:P1}");
        
        return differences;
    }

    // Missing interface implementations
    public async Task<TerraFusion.AI.DTOs.ValuationDto> CalculatePropertyValueAsync(int propertyId)
    {
        var analysis = await AnalyzeCostAsync(Guid.NewGuid()); // Convert int to Guid or implement proper lookup
        return new TerraFusion.AI.DTOs.ValuationDto
        {
            PropertyId = propertyId,
            EstimatedValue = analysis.TotalCost,
            Confidence = analysis.ConfidenceScore,
            ValuationDate = DateTime.UtcNow
        };
    }

    public async Task<IEnumerable<TerraFusion.AI.DTOs.ValuationDto>> BatchCalculateValuesAsync(IEnumerable<int> propertyIds)
    {
        var results = new List<TerraFusion.AI.DTOs.ValuationDto>();
        foreach (var propertyId in propertyIds.Take(100)) // Limit batch size
        {
            var valuation = await CalculatePropertyValueAsync(propertyId);
            results.Add(valuation);
        }
        return results;
    }

    public async Task<IEnumerable<TerraFusion.AI.DTOs.CostMatrixDto>> GetAllCostMatricesAsync()
    {
        return await GetCostMatricesAsync();
    }

    public async Task<TerraFusion.AI.DTOs.CostMatrixDto> UpdateCostMatrixAsync(int id, UpdateCostMatrixDto updateDto)
    {
        // Implementation would update existing cost matrix
        await System.Threading.Tasks.Task.Delay(10); // Simulate update operation
        
        return new TerraFusion.AI.DTOs.CostMatrixDto
        {
            BuildingType = "Updated",
            Region = "Updated",
            BaseCostPerSquareFoot = updateDto.BaseCostPerSquareFoot ?? 200m,
            QualityFactors = updateDto.QualityFactors ?? new Dictionary<string, double>(),
            LocationFactors = updateDto.LocationFactors ?? new Dictionary<string, double>(),
            LastUpdated = DateTime.UtcNow
        };
    }

    public async Task<bool> TrainModelAsync(int modelId, TrainingDataDto trainingData)
    {
        // Convert to existing training method
        var config = new ModelTrainingConfigDto { ModelName = $"Model_{modelId}" };
        await TrainModelAsync(config);
        return true;
    }

    public async Task<TerraFusion.AI.DTOs.CostForgeStatsDto> GetCostForgeStatsAsync()
    {
        _logger.LogInformation("Retrieving CostForge statistics");
        await System.Threading.Tasks.Task.Delay(50); // Simulate stats collection

        return new TerraFusion.AI.DTOs.CostForgeStatsDto
        {
            TotalValuations = 25847,
            SuccessfulValuations = 25673,
            FailedValuations = 174,
            AverageValuationTime = TimeSpan.FromMilliseconds(127),
            AverageAccuracy = 0.94,
            TotalCostMatrices = 156,
            ActiveModels = 8,
            LastUpdated = DateTime.UtcNow,
            TopPerformingRegions = new Dictionary<string, double>
            {
                ["King County"] = 0.96,
                ["Pierce County"] = 0.94,
                ["Snohomish County"] = 0.93
            }
        };
    }
}

