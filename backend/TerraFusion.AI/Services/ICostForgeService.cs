using TerraFusion.Core.DTOs;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

public interface ICostForgeService
{
    Task<TerraFusion.AI.DTOs.ValuationDto> CalculatePropertyValueAsync(int propertyId);
    Task<IEnumerable<TerraFusion.AI.DTOs.ValuationDto>> BatchCalculateValuesAsync(IEnumerable<int> propertyIds);
    Task<CostMatrixDto> GetCostMatrixAsync(string region, string buildingType);
    Task<IEnumerable<CostMatrixDto>> GetAllCostMatricesAsync();
    Task<CostMatrixDto> UpdateCostMatrixAsync(int id, UpdateCostMatrixDto updateDto);
    Task<CostForgeStatsDto> GetCostForgeStatsAsync();
    Task<bool> TrainModelAsync(int modelId, TrainingDataDto trainingData);
}
