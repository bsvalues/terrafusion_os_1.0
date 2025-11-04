using TerraFusion.Core.DTOs;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

public interface ICostForgeService
{
    System.Threading.Tasks.Task<TerraFusion.AI.DTOs.ValuationDto> CalculatePropertyValueAsync(int propertyId);
    System.Threading.Tasks.Task<IEnumerable<TerraFusion.AI.DTOs.ValuationDto>> BatchCalculateValuesAsync(IEnumerable<int> propertyIds);
    System.Threading.Tasks.Task<CostMatrixDto> GetCostMatrixAsync(string region, string buildingType);
    System.Threading.Tasks.Task<IEnumerable<CostMatrixDto>> GetAllCostMatricesAsync();
    System.Threading.Tasks.Task<CostMatrixDto> UpdateCostMatrixAsync(int id, UpdateCostMatrixDto updateDto);
    System.Threading.Tasks.Task<CostForgeStatsDto> GetCostForgeStatsAsync();
    System.Threading.Tasks.Task<bool> TrainModelAsync(int modelId, TrainingDataDto trainingData);
}
