using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface IPropertyValuationService
    {
        Task<PropertyValuationResult> AnalyzePropertyAsync(PropertyValuationRequest request);
        Task<CostPredictionResult> PredictCostsAsync(CostPredictionRequest request);
        Task<List<CostFactor>> GenerateCostFactorsAsync(string location, string projectType);
    }
}
