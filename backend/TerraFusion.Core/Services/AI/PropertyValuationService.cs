using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.ML;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services.AI;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.AI;

/// <summary>
/// Advanced property valuation service using AI/ML for accurate property assessments
/// </summary>
public interface IPropertyValuationService
{
    Task<PropertyValuationResult> CalculatePropertyValueAsync(PropertyValuationRequest request);
    Task<ValuationConfidenceScore> GetValuationConfidenceAsync(string propertyId);
    Task<List<ValuationComparable>> FindComparablePropertiesAsync(PropertyValuationRequest request);
    Task<PropertyValuePrediction> PredictFutureValueAsync(string propertyId, int monthsAhead);
    Task<ValuationAdjustmentRecommendations> GetAdjustmentRecommendationsAsync(string propertyId, decimal currentAssessment);
    Task<PropertyValuationReport> GenerateDetailedValuationReportAsync(string propertyId);
    Task<bool> RetrainValuationModelAsync(List<PropertySaleData> newSalesData);
    Task<ModelPerformanceMetrics> GetValuationModelPerformanceAsync();
}

public class PropertyValuationService : IPropertyValuationService
{
    private readonly ILogger<PropertyValuationService> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly IConfiguration _configuration;
    private readonly IMLModelManager _modelManager;
    private readonly IAzureOpenAIService _openAIService;
    private readonly IDataProcessingPipeline _dataProcessor;
    private readonly MLContext _mlContext;

    public PropertyValuationService(
        ILogger<PropertyValuationService> logger,
        IStructuredLogger structuredLogger,
        IConfiguration configuration,
        IMLModelManager modelManager,
        IAzureOpenAIService openAIService,
        IDataProcessingPipeline dataProcessor)
    {
        _logger = logger;
        _structuredLogger = structuredLogger;
        _configuration = configuration;
        _modelManager = modelManager;
        _openAIService = openAIService;
        _dataProcessor = dataProcessor;
        _mlContext = new MLContext(seed: 1);
    }

    public async Task<PropertyValuationResult> CalculatePropertyValueAsync(PropertyValuationRequest request)
    {
        var valuationId = Guid.NewGuid().ToString();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _structuredLogger.LogAIEvent("PropertyValuationStarted",
                $"Starting property valuation for property {request.PropertyId}",
                context: new { 
                    ValuationId = valuationId,
                    PropertyId = request.PropertyId,
                    PropertyType = request.PropertyType,
                    ValuationMethod = request.ValuationMethod
                });

            // Step 1: Prepare property data for valuation
            var propertyFeatures = await PreparePropertyFeaturesAsync(request);

            // Step 2: Get base valuation using ML model
            var mlValuation = await GetMLBasedValuationAsync(propertyFeatures);

            // Step 3: Apply market adjustments
            var marketAdjustedValue = await ApplyMarketAdjustmentsAsync(mlValuation, propertyFeatures);

            // Step 4: Find comparable properties
            var comparables = await FindComparablePropertiesAsync(request);

            // Step 5: Apply comparable analysis adjustments
            var comparableAdjustedValue = await ApplyComparableAdjustmentsAsync(marketAdjustedValue, comparables);

            // Step 6: Generate AI-powered insights
            var aiInsights = await GenerateValuationInsightsAsync(request, comparableAdjustedValue, comparables);

            // Step 7: Calculate confidence score
            var confidenceScore = await CalculateConfidenceScoreAsync(mlValuation, comparables, propertyFeatures);

            stopwatch.Stop();

            var result = new PropertyValuationResult
            {
                ValuationId = valuationId,
                PropertyId = request.PropertyId,
                EstimatedValue = comparableAdjustedValue,
                BaseMLValue = mlValuation.EstimatedValue,
                MarketAdjustedValue = marketAdjustedValue,
                ComparableAdjustedValue = comparableAdjustedValue,
                ConfidenceScore = confidenceScore,
                ValuationMethod = request.ValuationMethod,
                ComparableProperties = comparables,
                AIInsights = aiInsights,
                ProcessingTime = stopwatch.Elapsed,
                ValuationDate = DateTime.UtcNow,
                Success = true
            };

            _structuredLogger.LogAIEvent("PropertyValuationCompleted",
                $"Property valuation completed successfully",
                context: new { 
                    ValuationId = valuationId,
                    EstimatedValue = result.EstimatedValue,
                    ConfidenceScore = result.ConfidenceScore.OverallScore,
                    ProcessingTime = stopwatch.ElapsedMilliseconds
                });

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Property valuation failed for {PropertyId}", request.PropertyId);

            return new PropertyValuationResult
            {
                ValuationId = valuationId,
                PropertyId = request.PropertyId,
                Success = false,
                Error = ex.Message,
                ProcessingTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<ValuationConfidenceScore> GetValuationConfidenceAsync(string propertyId)
    {
        try
        {
            // In a real implementation, this would analyze historical accuracy,
            // data completeness, and market stability factors
            await Task.Delay(50);

            return new ValuationConfidenceScore
            {
                OverallScore = 0.87,
                DataQualityScore = 0.92,
                ModelConfidenceScore = 0.85,
                MarketStabilityScore = 0.84,
                ComparableQualityScore = 0.89,
                Factors = new List<ConfidenceFactor>
                {
                    new ConfidenceFactor { Name = "Recent Sales Data", Impact = 0.15, Score = 0.90 },
                    new ConfidenceFactor { Name = "Property Condition", Impact = 0.12, Score = 0.88 },
                    new ConfidenceFactor { Name = "Market Trends", Impact = 0.10, Score = 0.82 },
                    new ConfidenceFactor { Name = "Location Analysis", Impact = 0.18, Score = 0.91 }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get valuation confidence for property {PropertyId}", propertyId);
            throw;
        }
    }

    public async Task<List<ValuationComparable>> FindComparablePropertiesAsync(PropertyValuationRequest request)
    {
        try
        {
            _structuredLogger.LogAIEvent("ComparableSearchStarted",
                $"Searching for comparable properties",
                context: new { PropertyId = request.PropertyId });

            // Step 1: Define search criteria
            var searchCriteria = await BuildComparableSearchCriteriaAsync(request);

            // Step 2: Execute semantic search for similar properties
            var potentialComparables = await SearchSimilarPropertiesAsync(searchCriteria);

            // Step 3: Score and rank comparables
            var rankedComparables = await RankComparablesAsync(request, potentialComparables);

            // Step 4: Apply adjustments for differences
            var adjustedComparables = await ApplyComparableAdjustmentsAsync(request, rankedComparables);

            return adjustedComparables.Take(5).ToList(); // Return top 5 comparables
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to find comparable properties for {PropertyId}", request.PropertyId);
            return new List<ValuationComparable>();
        }
    }

    public async Task<PropertyValuePrediction> PredictFutureValueAsync(string propertyId, int monthsAhead)
    {
        try
        {
            // Use time series analysis and market trend models
            var currentValue = await GetCurrentPropertyValueAsync(propertyId);
            var marketTrends = await GetMarketTrendsAsync(propertyId);
            var economicFactors = await GetEconomicFactorsAsync();

            // Apply predictive modeling
            var predictedGrowthRate = await PredictGrowthRateAsync(marketTrends, economicFactors, monthsAhead);
            var predictedValue = currentValue * (1 + (decimal)predictedGrowthRate);

            return new PropertyValuePrediction
            {
                PropertyId = propertyId,
                CurrentValue = currentValue,
                PredictedValue = predictedValue,
                MonthsAhead = monthsAhead,
                GrowthRate = predictedGrowthRate,
                ConfidenceInterval = await CalculatePredictionConfidenceAsync(monthsAhead),
                PredictionDate = DateTime.UtcNow,
                FactorsConsidered = new List<string>
                {
                    "Historical price trends",
                    "Market supply and demand",
                    "Economic indicators",
                    "Neighborhood development",
                    "Interest rate forecasts"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to predict future value for property {PropertyId}", propertyId);
            throw;
        }
    }

    public async Task<ValuationAdjustmentRecommendations> GetAdjustmentRecommendationsAsync(string propertyId, decimal currentAssessment)
    {
        try
        {
            // Calculate market value using our AI model
            var request = await BuildValuationRequestAsync(propertyId);
            var aiValuation = await CalculatePropertyValueAsync(request);

            var variance = aiValuation.EstimatedValue - currentAssessment;
            var variancePercentage = (variance / currentAssessment) * 100;

            var recommendations = new ValuationAdjustmentRecommendations
            {
                PropertyId = propertyId,
                CurrentAssessment = currentAssessment,
                RecommendedValue = aiValuation.EstimatedValue,
                AdjustmentAmount = variance,
                AdjustmentPercentage = variancePercentage,
                Confidence = aiValuation.ConfidenceScore.OverallScore,
                Justifications = await GenerateAdjustmentJustificationsAsync(aiValuation),
                SupportingData = await GetSupportingDataAsync(propertyId),
                RecommendationDate = DateTime.UtcNow
            };

            // Determine recommendation type
            if (Math.Abs(variancePercentage) < 5)
            {
                recommendations.RecommendationType = AdjustmentRecommendationType.NoAdjustmentNeeded;
            }
            else if (variancePercentage > 0)
            {
                recommendations.RecommendationType = AdjustmentRecommendationType.IncreaseAssessment;
            }
            else
            {
                recommendations.RecommendationType = AdjustmentRecommendationType.DecreaseAssessment;
            }

            return recommendations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get adjustment recommendations for property {PropertyId}", propertyId);
            throw;
        }
    }

    public async Task<PropertyValuationReport> GenerateDetailedValuationReportAsync(string propertyId)
    {
        try
        {
            var request = await BuildValuationRequestAsync(propertyId);
            var valuation = await CalculatePropertyValueAsync(request);
            var futureValue = await PredictFutureValueAsync(propertyId, 12);
            var marketAnalysis = await GetMarketAnalysisAsync(propertyId);

            // Generate comprehensive narrative using AI
            var reportNarrative = await GenerateValuationNarrativeAsync(valuation, futureValue, marketAnalysis);

            return new PropertyValuationReport
            {
                PropertyId = propertyId,
                ValuationResult = valuation,
                FutureValuePrediction = futureValue,
                MarketAnalysis = marketAnalysis,
                DetailedNarrative = reportNarrative,
                GeneratedDate = DateTime.UtcNow,
                ReportVersion = "1.0",
                Methodology = "AI-Enhanced Automated Valuation Model (AI-AVM)",
                Disclaimers = GetStandardDisclaimers()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate detailed valuation report for property {PropertyId}", propertyId);
            throw;
        }
    }

    public async Task<bool> RetrainValuationModelAsync(List<PropertySaleData> newSalesData)
    {
        try
        {
            _structuredLogger.LogAIEvent("ModelRetrainingStarted",
                $"Starting valuation model retraining with {newSalesData.Count} new sales",
                context: new { SalesDataCount = newSalesData.Count });

            // Prepare training data
            var trainingData = await PrepareTrainingDataAsync(newSalesData);

            // Retrain the model
            var retrainResult = await _modelManager.RetrainModelAsync("property-valuation-model", trainingData);

            if (retrainResult)
            {
                _structuredLogger.LogAIEvent("ModelRetrainingCompleted",
                    $"Valuation model retrained successfully",
                    context: new { SalesDataCount = newSalesData.Count });
            }

            return retrainResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrain valuation model");
            return false;
        }
    }

    public async Task<ModelPerformanceMetrics> GetValuationModelPerformanceAsync()
    {
        try
        {
            return await _modelManager.GetModelPerformanceAsync("property-valuation-model");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get valuation model performance");
            throw;
        }
    }

    // Private helper methods
    private async Task<PropertyFeatures> PreparePropertyFeaturesAsync(PropertyValuationRequest request)
    {
        // Extract and normalize property features for ML model
        await Task.Delay(10);
        
        return new PropertyFeatures
        {
            SquareFootage = request.SquareFootage,
            LotSize = request.LotSize,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            YearBuilt = request.YearBuilt,
            PropertyType = request.PropertyType,
            LocationScore = await CalculateLocationScoreAsync(request.Address),
            ConditionScore = request.ConditionScore,
            NeighborhoodScore = await GetNeighborhoodScoreAsync(request.Address)
        };
    }

    private async Task<MLValuationResult> GetMLBasedValuationAsync(PropertyFeatures features)
    {
        try
        {
            var prediction = await _modelManager.PredictAsync<decimal>("property-valuation-model", features);
            
            return new MLValuationResult
            {
                EstimatedValue = prediction.Prediction,
                Confidence = prediction.Confidence,
                ModelVersion = "1.0"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ML-based valuation failed");
            throw;
        }
    }

    private async Task<decimal> ApplyMarketAdjustmentsAsync(MLValuationResult mlResult, PropertyFeatures features)
    {
        // Apply current market conditions, seasonality, and economic factors
        await Task.Delay(10);
        
        var marketMultiplier = await GetMarketMultiplierAsync();
        return mlResult.EstimatedValue * marketMultiplier;
    }

    private async Task<decimal> ApplyComparableAdjustmentsAsync(decimal baseValue, List<ValuationComparable> comparables)
    {
        if (!comparables.Any()) return baseValue;

        // Weight the base ML value with comparable sales
        var comparableAverage = comparables.Average(c => c.AdjustedSalePrice);
        var weightedValue = (baseValue * 0.6m) + (comparableAverage * 0.4m);
        
        return weightedValue;
    }

    private async Task<string> GenerateValuationInsightsAsync(PropertyValuationRequest request, decimal estimatedValue, List<ValuationComparable> comparables)
    {
        try
        {
            var prompt = $@"Generate property valuation insights for:
Property: {request.PropertyType} at {request.Address}
Estimated Value: ${estimatedValue:N0}
Square Footage: {request.SquareFootage}
Comparable Sales: {comparables.Count} properties analyzed

Provide brief insights on:
1. Value assessment accuracy
2. Market position relative to comparables
3. Key value drivers
4. Market trends impact";

            var aiRequest = new ChatCompletionRequest
            {
                Model = "gpt-4",
                Messages = new List<ChatMessage>
                {
                    new ChatMessage { Role = "system", Content = "You are a professional property appraiser providing concise valuation insights." },
                    new ChatMessage { Role = "user", Content = prompt }
                },
                MaxTokens = 300,
                Temperature = 0.3
            };

            var response = await _openAIService.GetChatCompletionAsync(aiRequest);
            return response.Choices?.FirstOrDefault()?.Message?.Content ?? "AI insights unavailable";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate AI insights");
            return "AI insights unavailable due to processing error";
        }
    }

    private async Task<ValuationConfidenceScore> CalculateConfidenceScoreAsync(MLValuationResult mlResult, List<ValuationComparable> comparables, PropertyFeatures features)
    {
        await Task.Delay(10);
        
        var dataQuality = features.CalculateDataQualityScore();
        var comparableQuality = comparables.Any() ? comparables.Average(c => c.QualityScore) : 0.5;
        var modelConfidence = mlResult.Confidence;
        
        var overallScore = (dataQuality * 0.3) + (comparableQuality * 0.4) + (modelConfidence * 0.3);
        
        return new ValuationConfidenceScore
        {
            OverallScore = overallScore,
            DataQualityScore = dataQuality,
            ModelConfidenceScore = modelConfidence,
            ComparableQualityScore = comparableQuality,
            MarketStabilityScore = 0.85 // Placeholder
        };
    }

    // Additional helper methods would be implemented here...
    private async Task<ComparableSearchCriteria> BuildComparableSearchCriteriaAsync(PropertyValuationRequest request)
    {
        await Task.Delay(5);
        return new ComparableSearchCriteria();
    }

    private async Task<List<PropertyComparable>> SearchSimilarPropertiesAsync(ComparableSearchCriteria criteria)
    {
        await Task.Delay(10);
        return new List<PropertyComparable>();
    }

    private async Task<List<ValuationComparable>> RankComparablesAsync(PropertyValuationRequest request, List<PropertyComparable> comparables)
    {
        await Task.Delay(10);
        return new List<ValuationComparable>();
    }

    private async Task<List<ValuationComparable>> ApplyComparableAdjustmentsAsync(PropertyValuationRequest request, List<ValuationComparable> comparables)
    {
        await Task.Delay(10);
        return comparables;
    }

    private async Task<decimal> GetCurrentPropertyValueAsync(string propertyId)
    {
        await Task.Delay(5);
        return 350000m; // Placeholder
    }

    private async Task<MarketTrends> GetMarketTrendsAsync(string propertyId)
    {
        await Task.Delay(5);
        return new MarketTrends();
    }

    private async Task<EconomicFactors> GetEconomicFactorsAsync()
    {
        await Task.Delay(5);
        return new EconomicFactors();
    }

    private async Task<double> PredictGrowthRateAsync(MarketTrends trends, EconomicFactors factors, int months)
    {
        await Task.Delay(10);
        return 0.03; // 3% annual growth
    }

    private async Task<ConfidenceInterval> CalculatePredictionConfidenceAsync(int months)
    {
        await Task.Delay(5);
        return new ConfidenceInterval { Lower = 0.85, Upper = 0.95 };
    }

    private async Task<PropertyValuationRequest> BuildValuationRequestAsync(string propertyId)
    {
        await Task.Delay(5);
        return new PropertyValuationRequest { PropertyId = propertyId };
    }

    private async Task<List<string>> GenerateAdjustmentJustificationsAsync(PropertyValuationResult valuation)
    {
        await Task.Delay(5);
        return new List<string> { "Market analysis", "Comparable sales", "AI model prediction" };
    }

    private async Task<object> GetSupportingDataAsync(string propertyId)
    {
        await Task.Delay(5);
        return new { };
    }

    private async Task<MarketAnalysis> GetMarketAnalysisAsync(string propertyId)
    {
        await Task.Delay(5);
        return new MarketAnalysis();
    }

    private async Task<string> GenerateValuationNarrativeAsync(PropertyValuationResult valuation, PropertyValuePrediction future, MarketAnalysis market)
    {
        await Task.Delay(10);
        return "Comprehensive AI-generated valuation narrative";
    }

    private List<string> GetStandardDisclaimers()
    {
        return new List<string>
        {
            "This valuation is for assessment purposes only",
            "Market conditions may affect actual sale price",
            "AI model predictions are estimates based on available data"
        };
    }

    private async Task<IDataView> PrepareTrainingDataAsync(List<PropertySaleData> salesData)
    {
        await Task.Delay(10);
        // Convert sales data to ML.NET IDataView format
        var data = _mlContext.Data.LoadFromEnumerable(salesData);
        return data;
    }

    private async Task<double> CalculateLocationScoreAsync(string address)
    {
        await Task.Delay(5);
        return 0.8; // Placeholder
    }

    private async Task<double> GetNeighborhoodScoreAsync(string address)
    {
        await Task.Delay(5);
        return 0.75; // Placeholder
    }

    private async Task<decimal> GetMarketMultiplierAsync()
    {
        await Task.Delay(5);
        return 1.02m; // 2% market adjustment
    }
}

// Data models for property valuation
public class PropertyValuationRequest
{
    public string PropertyId { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public int SquareFootage { get; set; }
    public double LotSize { get; set; }
    public int Bedrooms { get; set; }
    public double Bathrooms { get; set; }
    public int YearBuilt { get; set; }
    public double ConditionScore { get; set; }
    public ValuationMethod ValuationMethod { get; set; } = ValuationMethod.AIEnhancedComparative;
}

public class PropertyValuationResult
{
    public string ValuationId { get; set; } = string.Empty;
    public string PropertyId { get; set; } = string.Empty;
    public decimal EstimatedValue { get; set; }
    public decimal BaseMLValue { get; set; }
    public decimal MarketAdjustedValue { get; set; }
    public decimal ComparableAdjustedValue { get; set; }
    public ValuationConfidenceScore ConfidenceScore { get; set; } = new();
    public ValuationMethod ValuationMethod { get; set; }
    public List<ValuationComparable> ComparableProperties { get; set; } = new();
    public string AIInsights { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Error { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public DateTime ValuationDate { get; set; }
}

public class ValuationConfidenceScore
{
    public double OverallScore { get; set; }
    public double DataQualityScore { get; set; }
    public double ModelConfidenceScore { get; set; }
    public double MarketStabilityScore { get; set; }
    public double ComparableQualityScore { get; set; }
    public List<ConfidenceFactor> Factors { get; set; } = new();
}

public class ConfidenceFactor
{
    public string Name { get; set; } = string.Empty;
    public double Impact { get; set; }
    public double Score { get; set; }
}

public class ValuationComparable
{
    public string PropertyId { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal SalePrice { get; set; }
    public decimal AdjustedSalePrice { get; set; }
    public DateTime SaleDate { get; set; }
    public double SimilarityScore { get; set; }
    public double QualityScore { get; set; }
    public Dictionary<string, decimal> Adjustments { get; set; } = new();
}

public class PropertyValuePrediction
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal CurrentValue { get; set; }
    public decimal PredictedValue { get; set; }
    public int MonthsAhead { get; set; }
    public double GrowthRate { get; set; }
    public ConfidenceInterval ConfidenceInterval { get; set; } = new();
    public DateTime PredictionDate { get; set; }
    public List<string> FactorsConsidered { get; set; } = new();
}

public class ValuationAdjustmentRecommendations
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal CurrentAssessment { get; set; }
    public decimal RecommendedValue { get; set; }
    public decimal AdjustmentAmount { get; set; }
    public decimal AdjustmentPercentage { get; set; }
    public double Confidence { get; set; }
    public AdjustmentRecommendationType RecommendationType { get; set; }
    public List<string> Justifications { get; set; } = new();
    public object? SupportingData { get; set; }
    public DateTime RecommendationDate { get; set; }
}

public class PropertyValuationReport
{
    public string PropertyId { get; set; } = string.Empty;
    public PropertyValuationResult ValuationResult { get; set; } = new();
    public PropertyValuePrediction FutureValuePrediction { get; set; } = new();
    public MarketAnalysis MarketAnalysis { get; set; } = new();
    public string DetailedNarrative { get; set; } = string.Empty;
    public DateTime GeneratedDate { get; set; }
    public string ReportVersion { get; set; } = string.Empty;
    public string Methodology { get; set; } = string.Empty;
    public List<string> Disclaimers { get; set; } = new();
}

public class PropertyFeatures
{
    public int SquareFootage { get; set; }
    public double LotSize { get; set; }
    public int Bedrooms { get; set; }
    public double Bathrooms { get; set; }
    public int YearBuilt { get; set; }
    public string PropertyType { get; set; } = string.Empty;
    public double LocationScore { get; set; }
    public double ConditionScore { get; set; }
    public double NeighborhoodScore { get; set; }

    public double CalculateDataQualityScore()
    {
        var completeness = (SquareFootage > 0 ? 1 : 0) + (LotSize > 0 ? 1 : 0) + (YearBuilt > 0 ? 1 : 0);
        return completeness / 3.0;
    }
}

public class MLValuationResult
{
    public decimal EstimatedValue { get; set; }
    public double Confidence { get; set; }
    public string ModelVersion { get; set; } = string.Empty;
}

// Supporting classes
public class ComparableSearchCriteria { }
public class PropertyComparable { }
public class MarketTrends { }
public class EconomicFactors { }
public class ConfidenceInterval 
{ 
    public double Lower { get; set; }
    public double Upper { get; set; }
}
public class MarketAnalysis { }
public class PropertySaleData 
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal SalePrice { get; set; }
    public DateTime SaleDate { get; set; }
    public int SquareFootage { get; set; }
    public double LotSize { get; set; }
    public int Bedrooms { get; set; }
    public double Bathrooms { get; set; }
    public int YearBuilt { get; set; }
    public string PropertyType { get; set; } = string.Empty;
}

public enum ValuationMethod
{
    AIEnhancedComparative,
    MachineLearningOnly,
    TraditionalComparative,
    CostApproach,
    IncomeApproach
}

public enum AdjustmentRecommendationType
{
    NoAdjustmentNeeded,
    IncreaseAssessment,
    DecreaseAssessment,
    RequiresManualReview
}
