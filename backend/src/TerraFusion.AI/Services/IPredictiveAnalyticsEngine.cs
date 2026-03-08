using System.Threading.Tasks;

namespace TerraFusion.AI.Services;

/// <summary>
/// Predictive analytics engine interface.
/// Implementation uses ML.NET models for revenue forecasting and trend analysis.
/// </summary>
public interface IPredictiveAnalyticsEngine
{
    System.Threading.Tasks.Task<object> GetPredictionAsync();
}
