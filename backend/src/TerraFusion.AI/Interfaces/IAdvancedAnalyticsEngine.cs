using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Interfaces
{
    public interface IAdvancedAnalyticsEngine
    {
        Task<bool> InitializeAnalyticsEngine();
        Task<PredictiveInsights> GeneratePredictiveInsights(AnalyticsRequest request);
        Task<List<AnalyticsPattern>> DetectPatterns(string domain);
        Task<PerformanceForecast> GeneratePerformanceForecast(string moduleId, int daysAhead);
        Task<RiskAssessment> AnalyzeRisks(string systemComponent);
        Task<AnalyticsDashboardData> GetDashboardData();
        Task<List<Recommendation>> GenerateRecommendations(string context);
        Task<bool> TrainPredictiveModel(string modelType, TrainingData data);
        Task<AnalyticsMetrics> GetAnalyticsMetrics();
    }
}