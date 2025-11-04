using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services;

public interface IAICommandService
{
    System.Threading.Tasks.Task<IEnumerable<AIModelDto>> GetAllModelsAsync();
    System.Threading.Tasks.Task<AIModelDto?> GetModelByIdAsync(int id);
    System.Threading.Tasks.Task<AIModelDto> DeployModelAsync(int modelId);
    System.Threading.Tasks.Task<bool> UndeployModelAsync(int modelId);
    System.Threading.Tasks.Task<AIModelHealthDto> GetModelHealthAsync(int modelId);
    System.Threading.Tasks.Task<IEnumerable<AIModelHealthDto>> GetAllModelHealthAsync();
    System.Threading.Tasks.Task<PredictionResultDto> RunPredictionAsync(int modelId, PredictionInputDto input);
    System.Threading.Tasks.Task<BatchPredictionResultDto> RunBatchPredictionAsync(int modelId, IEnumerable<PredictionInputDto> inputs);
    System.Threading.Tasks.Task<TerraFusion.AI.DTOs.AICommandStatsDto> GetAICommandStatsAsync();
    System.Threading.Tasks.Task<bool> StartModelTrainingAsync(int modelId, TrainingConfigDto config);
    System.Threading.Tasks.Task<TerraFusion.AI.DTOs.TrainingStatusDto> GetTrainingStatusAsync(int modelId);
}
