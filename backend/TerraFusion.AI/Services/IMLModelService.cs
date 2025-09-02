using System.Threading.Tasks;
using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface IMLModelService
    {
        Task<ROIPredictionResult> PredictROIAsync(ROIPredictionRequest request);
        Task<MarketTrendResult> AnalyzeMarketTrendsAsync(MarketTrendRequest request);
        Task<RiskAssessmentResult> AssessRiskAsync(RiskAssessmentRequest request);
        Task<ModelStatusResult> GetModelStatusAsync();
    }
}
