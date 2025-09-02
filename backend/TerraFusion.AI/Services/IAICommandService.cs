using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services;

public interface IAICommandService
{
    Task<IEnumerable<AIModelDto>> GetAllModelsAsync();
    Task<AIModelDto?> GetModelByIdAsync(int id);
    Task<AIModelDto> DeployModelAsync(int modelId);
    Task<bool> UndeployModelAsync(int modelId);
    Task<AIModelHealthDto> GetModelHealthAsync(int modelId);
    Task<IEnumerable<AIModelHealthDto>> GetAllModelHealthAsync();
    Task<PredictionResultDto> RunPredictionAsync(int modelId, PredictionInputDto input);
    Task<BatchPredictionResultDto> RunBatchPredictionAsync(int modelId, IEnumerable<PredictionInputDto> inputs);
    Task<TerraFusion.AI.DTOs.AICommandStatsDto> GetAICommandStatsAsync();
    Task<bool> StartModelTrainingAsync(int modelId, TrainingConfigDto config);
    Task<TerraFusion.AI.DTOs.TrainingStatusDto> GetTrainingStatusAsync(int modelId);
}
