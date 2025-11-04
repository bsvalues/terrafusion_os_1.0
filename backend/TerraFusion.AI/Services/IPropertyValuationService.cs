using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services
{
    public interface IPropertyValuationService
    {
        System.Threading.Tasks.Task<PropertyValuationResult> AnalyzePropertyAsync(PropertyValuationRequest request);
        System.Threading.Tasks.Task<CostPredictionResult> PredictCostsAsync(CostPredictionRequest request);
        System.Threading.Tasks.Task<List<CostFactor>> GenerateCostFactorsAsync(string location, string projectType);

        // AI Assistant Integration Methods
        Task<QuantumValuation> GetQuantumValuationAsync(string parcelId, string countyId);
        Task<List<ComparableProperty>> GetComparablesAsync(string parcelId, string countyId);
    }
}
