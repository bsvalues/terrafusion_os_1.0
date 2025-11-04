using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public class AIAnalyticsService : IAIAnalyticsService
    {
        public System.Threading.Tasks.Task<AIAnalyticsDataDto> GetAnalyticsDataAsync()
        {
            // Mock data for development purposes
            var mockData = new AIAnalyticsDataDto
            {
                ModelsLoaded = 5,
                DatasetsProcessed = 12345,
                InferenceAccuracy = 0.94,
                ModelPerformance = new List<ModelPerformanceDto>
                {
                    new ModelPerformanceDto { ModelName = "ValuationPredictor", Accuracy = 0.95, Precision = 0.92, Recall = 0.98 },
                    new ModelPerformanceDto { ModelName = "RiskAssessor", Accuracy = 0.92, Precision = 0.90, Recall = 0.94 },
                    new ModelPerformanceDto { ModelName = "FraudDetector", Accuracy = 0.98, Precision = 0.97, Recall = 0.99 },
                }
            };

            return Task.FromResult(mockData);
        }
    }
}
