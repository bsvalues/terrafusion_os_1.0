using System.Threading.Tasks;
using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface IMLModelService
    {
        System.Threading.Tasks.Task<ROIPredictionResult> PredictROIAsync(ROIPredictionRequest request);
        System.Threading.Tasks.Task<MarketTrendResult> AnalyzeMarketTrendsAsync(MarketTrendRequest request);
        System.Threading.Tasks.Task<RiskAssessmentResult> AssessRiskAsync(RiskAssessmentRequest request);
        System.Threading.Tasks.Task<ModelStatusResult> GetModelStatusAsync();
    }
}
