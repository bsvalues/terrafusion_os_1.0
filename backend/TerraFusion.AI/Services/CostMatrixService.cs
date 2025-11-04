using System.Text.Json;
using TerraFusion.Core.Entities;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services;

public interface ICostMatrixService
{
    System.Threading.Tasks.Task<List<CostMatrix>> GetCostMatricesAsync(string? county = null, string? region = null);
    System.Threading.Tasks.Task<CostMatrix?> GetCostMatrixAsync(string county, string region, string buildingType);
    System.Threading.Tasks.Task<decimal> CalculateCostAsync(string county, string region, string buildingType, decimal squareFootage, AdjustmentFactors? adjustments = null);
    System.Threading.Tasks.Task<List<CostMatrix>> LoadCostMatricesFromFileAsync(string filePath);
    System.Threading.Tasks.Task RefreshCostMatricesAsync();
}

public class CostMatrixService : ICostMatrixService
{
    private readonly ILogger<CostMatrixService> _logger;
    private readonly string _dataPath;
    private List<CostMatrix> _costMatrices = new();
    private DateTime _lastLoaded = DateTime.MinValue;

    public CostMatrixService(ILogger<CostMatrixService> logger)
    {
        _logger = logger;
        _dataPath = Path.Combine(Directory.GetCurrentDirectory(), "data", "cost-matrices");
        
        // Load cost matrices on startup
        _ = System.Threading.Tasks.Task.Run(async () => await RefreshCostMatricesAsync());
    }

    public async System.Threading.Tasks.Task<List<CostMatrix>> GetCostMatricesAsync(string? county = null, string? region = null)
    {
        await EnsureCostMatricesLoadedAsync();
        
        var matrices = _costMatrices.AsQueryable();
        
        if (!string.IsNullOrEmpty(county))
        {
            matrices = matrices.Where(m => m.County.Equals(county, StringComparison.OrdinalIgnoreCase));
        }
        
        if (!string.IsNullOrEmpty(region))
        {
            matrices = matrices.Where(m => m.Region.Equals(region, StringComparison.OrdinalIgnoreCase));
        }
        
        return matrices.ToList();
    }

    public async System.Threading.Tasks.Task<CostMatrix?> GetCostMatrixAsync(string county, string region, string buildingType)
    {
        await EnsureCostMatricesLoadedAsync();
        
        return _costMatrices.FirstOrDefault(m => 
            m.County.Equals(county, StringComparison.OrdinalIgnoreCase) &&
            m.Region.Equals(region, StringComparison.OrdinalIgnoreCase) &&
            m.BuildingType.Equals(buildingType, StringComparison.OrdinalIgnoreCase));
    }

    public async System.Threading.Tasks.Task<decimal> CalculateCostAsync(string county, string region, string buildingType, decimal squareFootage, AdjustmentFactors? adjustments = null)
    {
        var matrix = await GetCostMatrixAsync(county, region, buildingType);
        if (matrix == null)
        {
            _logger.LogWarning("Cost matrix not found for {County}, {Region}, {BuildingType}", county, region, buildingType);
            return 0;
        }

        var baseCost = matrix.BaseCost * squareFootage;
        
        if (adjustments != null)
        {
            baseCost *= adjustments.Complexity * adjustments.Quality * adjustments.Condition;
        }
        else if (!string.IsNullOrEmpty(matrix.AdjustmentFactors))
        {
            try
            {
                var matrixAdjustments = JsonSerializer.Deserialize<AdjustmentFactors>(matrix.AdjustmentFactors);
                if (matrixAdjustments != null)
                {
                    baseCost *= matrixAdjustments.Complexity * matrixAdjustments.Quality * matrixAdjustments.Condition;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse adjustment factors for matrix {Id}", matrix.Id);
            }
        }

        return Math.Round(baseCost, 2);
    }

    public async System.Threading.Tasks.Task<List<CostMatrix>> LoadCostMatricesFromFileAsync(string filePath)
    {
        try
        {
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("Cost matrix file not found: {FilePath}", filePath);
                return new List<CostMatrix>();
            }

            var jsonContent = await File.ReadAllTextAsync(filePath);
            var rawMatrices = JsonSerializer.Deserialize<List<RawCostMatrix>>(jsonContent);
            
            if (rawMatrices == null)
            {
                _logger.LogWarning("Failed to deserialize cost matrices from {FilePath}", filePath);
                return new List<CostMatrix>();
            }

            var costMatrices = new List<CostMatrix>();
            foreach (var raw in rawMatrices)
            {
                var matrix = new CostMatrix
                {
                    Region = raw.Region ?? string.Empty,
                    BuildingType = raw.BuildingType ?? string.Empty,
                    BuildingTypeDescription = raw.BuildingTypeDescription ?? string.Empty,
                    BaseCost = raw.BaseCost,
                    MatrixYear = raw.MatrixYear,
                    SourceMatrixId = raw.SourceMatrixId,
                    MatrixDescription = raw.MatrixDescription ?? string.Empty,
                    DataPoints = raw.DataPoints,
                    MinCost = raw.MinCost,
                    MaxCost = raw.MaxCost,
                    County = raw.County ?? string.Empty,
                    State = raw.State ?? string.Empty,
                    AdjustmentFactors = raw.AdjustmentFactors != null ? JsonSerializer.Serialize(raw.AdjustmentFactors) : "{}",
                    CostPerSqFt = raw.BaseCost, // Legacy compatibility
                    EffectiveDate = DateTime.UtcNow
                };
                
                costMatrices.Add(matrix);
            }

            _logger.LogInformation("Loaded {Count} cost matrices from {FilePath}", costMatrices.Count, filePath);
            return costMatrices;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading cost matrices from {FilePath}", filePath);
            return new List<CostMatrix>();
        }
    }

    public async System.Threading.Tasks.Task RefreshCostMatricesAsync()
    {
        try
        {
            _costMatrices.Clear();
            
            if (!Directory.Exists(_dataPath))
            {
                _logger.LogWarning("Cost matrices directory not found: {DataPath}", _dataPath);
                return;
            }

            var jsonFiles = Directory.GetFiles(_dataPath, "*.json", SearchOption.TopDirectoryOnly)
                .Where(f => !Path.GetFileName(f).StartsWith("package") && !Path.GetFileName(f).StartsWith("tsconfig"))
                .ToList();

            foreach (var file in jsonFiles)
            {
                var matrices = await LoadCostMatricesFromFileAsync(file);
                _costMatrices.AddRange(matrices);
            }

            _lastLoaded = DateTime.UtcNow;
            _logger.LogInformation("Refreshed cost matrices: {Count} total matrices loaded from {FileCount} files", 
                _costMatrices.Count, jsonFiles.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing cost matrices");
        }
    }

    private async System.Threading.Tasks.Task EnsureCostMatricesLoadedAsync()
    {
        if (_costMatrices.Count == 0 || DateTime.UtcNow.Subtract(_lastLoaded).TotalHours > 1)
        {
            await RefreshCostMatricesAsync();
        }
    }
}

// Raw cost matrix structure for JSON deserialization
public class RawCostMatrix
{
    public string? Region { get; set; }
    public string? BuildingType { get; set; }
    public string? BuildingTypeDescription { get; set; }
    public decimal BaseCost { get; set; }
    public int MatrixYear { get; set; }
    public int SourceMatrixId { get; set; }
    public string? MatrixDescription { get; set; }
    public int DataPoints { get; set; }
    public decimal MinCost { get; set; }
    public decimal MaxCost { get; set; }
    public string? County { get; set; }
    public string? State { get; set; }
    public AdjustmentFactors? AdjustmentFactors { get; set; }
}
