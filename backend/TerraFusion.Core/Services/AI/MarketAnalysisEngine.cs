using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Services.AI;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.AI;

/// <summary>
/// Market analysis engine providing comprehensive market insights and trend analysis
/// </summary>
public interface IMarketAnalysisEngine
{
    Task<MarketAnalysisReport> GenerateMarketAnalysisAsync(MarketAnalysisRequest request);
    Task<MarketTrendAnalysis> AnalyzeMarketTrendsAsync(string region, TimeSpan period);
    Task<PriceIndexAnalysis> CalculatePriceIndexAsync(string region, DateTime startDate, DateTime endDate);
    Task<MarketSegmentAnalysis> AnalyzeMarketSegmentAsync(string propertyType, string region);
    Task<SupplyDemandAnalysis> AnalyzeSupplyDemandAsync(string region);
    Task<MarketForecast> GenerateMarketForecastAsync(string region, int monthsAhead);
    Task<ComparativeMarketAnalysis> PerformComparativeAnalysisAsync(List<string> regions);
    Task<MarketHealthScore> CalculateMarketHealthAsync(string region);
}

public class MarketAnalysisEngine : IMarketAnalysisEngine
{
    private readonly ILogger<MarketAnalysisEngine> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly IConfiguration _configuration;
    private readonly IAzureOpenAIService _openAIService;
    private readonly IDataProcessingPipeline _dataProcessor;

    public MarketAnalysisEngine(
        ILogger<MarketAnalysisEngine> logger,
        IStructuredLogger structuredLogger,
        IConfiguration configuration,
        IAzureOpenAIService openAIService,
        IDataProcessingPipeline dataProcessor)
    {
        _logger = logger;
        _structuredLogger = structuredLogger;
        _configuration = configuration;
        _openAIService = openAIService;
        _dataProcessor = dataProcessor;
    }

    public async Task<MarketAnalysisReport> GenerateMarketAnalysisAsync(MarketAnalysisRequest request)
    {
        var analysisId = Guid.NewGuid().ToString();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _structuredLogger.LogAIEvent("MarketAnalysisStarted",
                $"Starting market analysis for region {request.Region}",
                context: new { 
                    AnalysisId = analysisId,
                    Region = request.Region,
                    PropertyType = request.PropertyType,
                    AnalysisType = request.AnalysisType
                });

            // Step 1: Collect market data
            var marketData = await CollectMarketDataAsync(request);

            // Step 2: Analyze market trends
            var trendAnalysis = await AnalyzeMarketTrendsAsync(request.Region, request.AnalysisPeriod);

            // Step 3: Calculate price indices
            var priceIndex = await CalculatePriceIndexAsync(request.Region, 
                DateTime.UtcNow.AddDays(-request.AnalysisPeriod.Days), DateTime.UtcNow);

            // Step 4: Analyze supply and demand
            var supplyDemand = await AnalyzeSupplyDemandAsync(request.Region);

            // Step 5: Generate market forecast
            var forecast = await GenerateMarketForecastAsync(request.Region, 12);

            // Step 6: Calculate market health score
            var healthScore = await CalculateMarketHealthAsync(request.Region);

            // Step 7: Generate AI-powered insights
            var aiInsights = await GenerateMarketInsightsAsync(request, trendAnalysis, supplyDemand, forecast);

            stopwatch.Stop();

            var report = new MarketAnalysisReport
            {
                AnalysisId = analysisId,
                Region = request.Region,
                PropertyType = request.PropertyType,
                AnalysisDate = DateTime.UtcNow,
                TrendAnalysis = trendAnalysis,
                PriceIndex = priceIndex,
                SupplyDemandAnalysis = supplyDemand,
                MarketForecast = forecast,
                MarketHealthScore = healthScore,
                AIInsights = aiInsights,
                ProcessingTime = stopwatch.Elapsed,
                DataSources = GetDataSources(),
                Methodology = "AI-Enhanced Market Analysis with Predictive Modeling"
            };

            _structuredLogger.LogAIEvent("MarketAnalysisCompleted",
                $"Market analysis completed successfully",
                context: new { 
                    AnalysisId = analysisId,
                    ProcessingTime = stopwatch.ElapsedMilliseconds,
                    MarketHealthScore = healthScore.OverallScore
                });

            return report;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Market analysis failed for region {Region}", request.Region);

            return new MarketAnalysisReport
            {
                AnalysisId = analysisId,
                Region = request.Region,
                Error = ex.Message,
                ProcessingTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<MarketTrendAnalysis> AnalyzeMarketTrendsAsync(string region, TimeSpan period)
    {
        try
        {
            _structuredLogger.LogAIEvent("TrendAnalysisStarted",
                $"Starting trend analysis for region {region}",
                context: new { Region = region, Period = period.Days });

            // Collect historical price data
            var priceHistory = await GetPriceHistoryAsync(region, period);

            // Calculate trend metrics
            var trendMetrics = await CalculateTrendMetricsAsync(priceHistory);

            // Analyze seasonal patterns
            var seasonalAnalysis = await AnalyzeSeasonalPatternsAsync(priceHistory);

            // Detect trend changes and momentum
            var momentumAnalysis = await AnalyzeMomentumAsync(priceHistory);

            // Generate predictive trend indicators
            var trendIndicators = await GenerateTrendIndicatorsAsync(priceHistory);

            return new MarketTrendAnalysis
            {
                Region = region,
                AnalysisPeriod = period,
                OverallTrend = trendMetrics.OverallTrend,
                TrendStrength = trendMetrics.TrendStrength,
                GrowthRate = trendMetrics.GrowthRate,
                Volatility = trendMetrics.Volatility,
                SeasonalPatterns = seasonalAnalysis,
                MomentumIndicators = momentumAnalysis,
                TrendIndicators = trendIndicators,
                PriceHistory = priceHistory,
                AnalysisDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Trend analysis failed for region {Region}", region);
            throw;
        }
    }

    public async Task<PriceIndexAnalysis> CalculatePriceIndexAsync(string region, DateTime startDate, DateTime endDate)
    {
        try
        {
            // Calculate various price indices
            var averagePriceIndex = await CalculateAveragePriceIndexAsync(region, startDate, endDate);
            var medianPriceIndex = await CalculateMedianPriceIndexAsync(region, startDate, endDate);
            var pricePerSqFtIndex = await CalculatePricePerSqFtIndexAsync(region, startDate, endDate);

            // Calculate index changes
            var indexChanges = await CalculateIndexChangesAsync(region, startDate, endDate);

            return new PriceIndexAnalysis
            {
                Region = region,
                StartDate = startDate,
                EndDate = endDate,
                AveragePriceIndex = averagePriceIndex,
                MedianPriceIndex = medianPriceIndex,
                PricePerSquareFootIndex = pricePerSqFtIndex,
                IndexChanges = indexChanges,
                CalculationDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Price index calculation failed for region {Region}", region);
            throw;
        }
    }

    public async Task<MarketSegmentAnalysis> AnalyzeMarketSegmentAsync(string propertyType, string region)
    {
        try
        {
            var segmentData = await GetSegmentDataAsync(propertyType, region);
            var competitiveAnalysis = await PerformCompetitiveAnalysisAsync(propertyType, region);
            var segmentTrends = await AnalyzeSegmentTrendsAsync(propertyType, region);

            return new MarketSegmentAnalysis
            {
                PropertyType = propertyType,
                Region = region,
                MarketShare = segmentData.MarketShare,
                AveragePrice = segmentData.AveragePrice,
                MedianPrice = segmentData.MedianPrice,
                InventoryLevels = segmentData.InventoryLevels,
                DaysOnMarket = segmentData.DaysOnMarket,
                PriceAppreciation = segmentData.PriceAppreciation,
                CompetitivePosition = competitiveAnalysis,
                SegmentTrends = segmentTrends,
                AnalysisDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Market segment analysis failed for {PropertyType} in {Region}", propertyType, region);
            throw;
        }
    }

    public async Task<SupplyDemandAnalysis> AnalyzeSupplyDemandAsync(string region)
    {
        try
        {
            var supplyMetrics = await CalculateSupplyMetricsAsync(region);
            var demandMetrics = await CalculateDemandMetricsAsync(region);
            var equilibriumAnalysis = await AnalyzeMarketEquilibriumAsync(supplyMetrics, demandMetrics);

            return new SupplyDemandAnalysis
            {
                Region = region,
                SupplyMetrics = supplyMetrics,
                DemandMetrics = demandMetrics,
                SupplyDemandRatio = supplyMetrics.TotalInventory / demandMetrics.MonthlyDemand,
                MarketBalance = equilibriumAnalysis.MarketBalance,
                PressurePoints = equilibriumAnalysis.PressurePoints,
                Recommendations = equilibriumAnalysis.Recommendations,
                AnalysisDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Supply demand analysis failed for region {Region}", region);
            throw;
        }
    }

    public async Task<MarketForecast> GenerateMarketForecastAsync(string region, int monthsAhead)
    {
        try
        {
            _structuredLogger.LogAIEvent("MarketForecastStarted",
                $"Generating market forecast for region {region}",
                context: new { Region = region, MonthsAhead = monthsAhead });

            var historicalData = await GetHistoricalMarketDataAsync(region);
            var economicIndicators = await GetEconomicIndicatorsAsync(region);
            var marketDrivers = await AnalyzeMarketDriversAsync(region);

            // Use time series analysis for price forecasting
            var priceForecast = await GeneratePriceForecastAsync(historicalData, monthsAhead);

            // Forecast market activity levels
            var activityForecast = await GenerateActivityForecastAsync(historicalData, monthsAhead);

            // Apply economic factor adjustments
            var adjustedForecast = await ApplyEconomicAdjustmentsAsync(priceForecast, economicIndicators);

            // Generate confidence intervals
            var confidenceIntervals = await CalculateForecastConfidenceAsync(adjustedForecast, monthsAhead);

            return new MarketForecast
            {
                Region = region,
                ForecastPeriod = monthsAhead,
                PriceForecast = adjustedForecast,
                ActivityForecast = activityForecast,
                ConfidenceIntervals = confidenceIntervals,
                KeyAssumptions = marketDrivers.KeyAssumptions,
                RiskFactors = marketDrivers.RiskFactors,
                ScenarioAnalysis = await GenerateScenarioAnalysisAsync(region, monthsAhead),
                ForecastDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Market forecast generation failed for region {Region}", region);
            throw;
        }
    }

    public async Task<ComparativeMarketAnalysis> PerformComparativeAnalysisAsync(List<string> regions)
    {
        try
        {
            var regionalAnalyses = new Dictionary<string, RegionalMetrics>();

            foreach (var region in regions)
            {
                var metrics = await GetRegionalMetricsAsync(region);
                regionalAnalyses[region] = metrics;
            }

            var comparisons = await GenerateRegionalComparisonsAsync(regionalAnalyses);
            var rankings = await RankRegionalPerformanceAsync(regionalAnalyses);
            var insights = await GenerateComparativeInsightsAsync(regionalAnalyses);

            return new ComparativeMarketAnalysis
            {
                Regions = regions,
                RegionalMetrics = regionalAnalyses,
                PerformanceComparisons = comparisons,
                RegionalRankings = rankings,
                ComparativeInsights = insights,
                AnalysisDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Comparative market analysis failed");
            throw;
        }
    }

    public async Task<MarketHealthScore> CalculateMarketHealthAsync(string region)
    {
        try
        {
            var healthMetrics = await GetMarketHealthMetricsAsync(region);
            var stabilityScore = await CalculateStabilityScoreAsync(healthMetrics);
            var liquidityScore = await CalculateLiquidityScoreAsync(healthMetrics);
            var growthScore = await CalculateGrowthScoreAsync(healthMetrics);
            var affordabilityScore = await CalculateAffordabilityScoreAsync(healthMetrics);

            var overallScore = (stabilityScore * 0.25) + (liquidityScore * 0.25) + 
                              (growthScore * 0.25) + (affordabilityScore * 0.25);

            return new MarketHealthScore
            {
                Region = region,
                OverallScore = overallScore,
                StabilityScore = stabilityScore,
                LiquidityScore = liquidityScore,
                GrowthScore = growthScore,
                AffordabilityScore = affordabilityScore,
                HealthIndicators = await GetHealthIndicatorsAsync(region),
                Recommendations = await GenerateHealthRecommendationsAsync(overallScore, healthMetrics),
                CalculationDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Market health calculation failed for region {Region}", region);
            throw;
        }
    }

    // Private helper methods
    private async Task<MarketData> CollectMarketDataAsync(MarketAnalysisRequest request)
    {
        await Task.Delay(50);
        return new MarketData
        {
            Region = request.Region,
            DataPoints = 1000,
            CollectionDate = DateTime.UtcNow
        };
    }

    private async Task<string> GenerateMarketInsightsAsync(MarketAnalysisRequest request, MarketTrendAnalysis trends, SupplyDemandAnalysis supplyDemand, MarketForecast forecast)
    {
        try
        {
            var prompt = $@"Generate comprehensive market insights for:
Region: {request.Region}
Property Type: {request.PropertyType}
Current Trend: {trends.OverallTrend}
Growth Rate: {trends.GrowthRate:P2}
Supply/Demand Ratio: {supplyDemand.SupplyDemandRatio:F2}
Market Balance: {supplyDemand.MarketBalance}

Provide insights on:
1. Market conditions and outlook
2. Investment opportunities and risks
3. Price trend predictions
4. Supply/demand dynamics
5. Strategic recommendations";

            var aiRequest = new ChatCompletionRequest
            {
                Model = "gpt-4",
                Messages = new List<ChatMessage>
                {
                    new ChatMessage { Role = "system", Content = "You are a senior market analyst providing professional real estate market insights." },
                    new ChatMessage { Role = "user", Content = prompt }
                },
                MaxTokens = 500,
                Temperature = 0.3
            };

            var response = await _openAIService.GetChatCompletionAsync(aiRequest);
            return response.Choices?.FirstOrDefault()?.Message?.Content ?? "Market insights unavailable";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate market insights");
            return "Market insights unavailable due to processing error";
        }
    }

    // Placeholder implementations for market analysis methods
    private async Task<List<PriceDataPoint>> GetPriceHistoryAsync(string region, TimeSpan period)
    {
        await Task.Delay(10);
        return new List<PriceDataPoint>();
    }

    private async Task<TrendMetrics> CalculateTrendMetricsAsync(List<PriceDataPoint> priceHistory)
    {
        await Task.Delay(10);
        return new TrendMetrics
        {
            OverallTrend = TrendDirection.Increasing,
            TrendStrength = 0.75,
            GrowthRate = 0.05,
            Volatility = 0.15
        };
    }

    private async Task<SeasonalAnalysis> AnalyzeSeasonalPatternsAsync(List<PriceDataPoint> priceHistory)
    {
        await Task.Delay(10);
        return new SeasonalAnalysis();
    }

    private async Task<MomentumAnalysis> AnalyzeMomentumAsync(List<PriceDataPoint> priceHistory)
    {
        await Task.Delay(10);
        return new MomentumAnalysis();
    }

    private async Task<List<TrendIndicator>> GenerateTrendIndicatorsAsync(List<PriceDataPoint> priceHistory)
    {
        await Task.Delay(10);
        return new List<TrendIndicator>();
    }

    private async Task<double> CalculateAveragePriceIndexAsync(string region, DateTime start, DateTime end)
    {
        await Task.Delay(5);
        return 105.5; // 5.5% increase
    }

    private async Task<double> CalculateMedianPriceIndexAsync(string region, DateTime start, DateTime end)
    {
        await Task.Delay(5);
        return 103.2; // 3.2% increase
    }

    private async Task<double> CalculatePricePerSqFtIndexAsync(string region, DateTime start, DateTime end)
    {
        await Task.Delay(5);
        return 107.1; // 7.1% increase
    }

    private async Task<Dictionary<string, double>> CalculateIndexChangesAsync(string region, DateTime start, DateTime end)
    {
        await Task.Delay(5);
        return new Dictionary<string, double>
        {
            ["Monthly"] = 0.8,
            ["Quarterly"] = 2.4,
            ["Annual"] = 9.6
        };
    }

    private async Task<SegmentData> GetSegmentDataAsync(string propertyType, string region)
    {
        await Task.Delay(10);
        return new SegmentData();
    }

    private async Task<CompetitiveAnalysis> PerformCompetitiveAnalysisAsync(string propertyType, string region)
    {
        await Task.Delay(10);
        return new CompetitiveAnalysis();
    }

    private async Task<List<SegmentTrend>> AnalyzeSegmentTrendsAsync(string propertyType, string region)
    {
        await Task.Delay(10);
        return new List<SegmentTrend>();
    }

    private async Task<SupplyMetrics> CalculateSupplyMetricsAsync(string region)
    {
        await Task.Delay(10);
        return new SupplyMetrics { TotalInventory = 2500 };
    }

    private async Task<DemandMetrics> CalculateDemandMetricsAsync(string region)
    {
        await Task.Delay(10);
        return new DemandMetrics { MonthlyDemand = 180 };
    }

    private async Task<EquilibriumAnalysis> AnalyzeMarketEquilibriumAsync(SupplyMetrics supply, DemandMetrics demand)
    {
        await Task.Delay(10);
        return new EquilibriumAnalysis
        {
            MarketBalance = MarketBalance.Balanced,
            PressurePoints = new List<string>(),
            Recommendations = new List<string>()
        };
    }

    // Additional placeholder methods...
    private async Task<MarketData> GetHistoricalMarketDataAsync(string region) { await Task.Delay(5); return new MarketData(); }
    private async Task<EconomicIndicators> GetEconomicIndicatorsAsync(string region) { await Task.Delay(5); return new EconomicIndicators(); }
    private async Task<MarketDrivers> AnalyzeMarketDriversAsync(string region) { await Task.Delay(5); return new MarketDrivers(); }
    private async Task<List<decimal>> GeneratePriceForecastAsync(MarketData data, int months) { await Task.Delay(10); return new List<decimal>(); }
    private async Task<List<int>> GenerateActivityForecastAsync(MarketData data, int months) { await Task.Delay(10); return new List<int>(); }
    private async Task<List<decimal>> ApplyEconomicAdjustmentsAsync(List<decimal> forecast, EconomicIndicators indicators) { await Task.Delay(5); return forecast; }
    private async Task<List<ConfidenceInterval>> CalculateForecastConfidenceAsync(List<decimal> forecast, int months) { await Task.Delay(5); return new List<ConfidenceInterval>(); }
    private async Task<ScenarioAnalysis> GenerateScenarioAnalysisAsync(string region, int months) { await Task.Delay(10); return new ScenarioAnalysis(); }
    private async Task<RegionalMetrics> GetRegionalMetricsAsync(string region) { await Task.Delay(5); return new RegionalMetrics(); }
    private async Task<Dictionary<string, object>> GenerateRegionalComparisonsAsync(Dictionary<string, RegionalMetrics> metrics) { await Task.Delay(10); return new Dictionary<string, object>(); }
    private async Task<Dictionary<string, int>> RankRegionalPerformanceAsync(Dictionary<string, RegionalMetrics> metrics) { await Task.Delay(5); return new Dictionary<string, int>(); }
    private async Task<List<string>> GenerateComparativeInsightsAsync(Dictionary<string, RegionalMetrics> metrics) { await Task.Delay(5); return new List<string>(); }
    private async Task<HealthMetrics> GetMarketHealthMetricsAsync(string region) { await Task.Delay(5); return new HealthMetrics(); }
    private async Task<double> CalculateStabilityScoreAsync(HealthMetrics metrics) { await Task.Delay(5); return 0.85; }
    private async Task<double> CalculateLiquidityScoreAsync(HealthMetrics metrics) { await Task.Delay(5); return 0.78; }
    private async Task<double> CalculateGrowthScoreAsync(HealthMetrics metrics) { await Task.Delay(5); return 0.82; }
    private async Task<double> CalculateAffordabilityScoreAsync(HealthMetrics metrics) { await Task.Delay(5); return 0.71; }
    private async Task<List<HealthIndicator>> GetHealthIndicatorsAsync(string region) { await Task.Delay(5); return new List<HealthIndicator>(); }
    private async Task<List<string>> GenerateHealthRecommendationsAsync(double score, HealthMetrics metrics) { await Task.Delay(5); return new List<string>(); }

    private List<string> GetDataSources()
    {
        return new List<string>
        {
            "Property Sales Database",
            "MLS Listings",
            "Economic Indicators",
            "Demographic Data",
            "Market Reports"
        };
    }
}

// Data models for market analysis
public class MarketAnalysisRequest
{
    public string Region { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public MarketAnalysisType AnalysisType { get; set; }
    public TimeSpan AnalysisPeriod { get; set; } = TimeSpan.FromDays(365);
}

public class MarketAnalysisReport
{
    public string AnalysisId { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public DateTime AnalysisDate { get; set; }
    public MarketTrendAnalysis TrendAnalysis { get; set; } = new();
    public PriceIndexAnalysis PriceIndex { get; set; } = new();
    public SupplyDemandAnalysis SupplyDemandAnalysis { get; set; } = new();
    public MarketForecast MarketForecast { get; set; } = new();
    public MarketHealthScore MarketHealthScore { get; set; } = new();
    public string AIInsights { get; set; } = string.Empty;
    public string? Error { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public List<string> DataSources { get; set; } = new();
    public string Methodology { get; set; } = string.Empty;
}

public class MarketTrendAnalysis
{
    public string Region { get; set; } = string.Empty;
    public TimeSpan AnalysisPeriod { get; set; }
    public TrendDirection OverallTrend { get; set; }
    public double TrendStrength { get; set; }
    public double GrowthRate { get; set; }
    public double Volatility { get; set; }
    public SeasonalAnalysis SeasonalPatterns { get; set; } = new();
    public MomentumAnalysis MomentumIndicators { get; set; } = new();
    public List<TrendIndicator> TrendIndicators { get; set; } = new();
    public List<PriceDataPoint> PriceHistory { get; set; } = new();
    public DateTime AnalysisDate { get; set; }
}

public class PriceIndexAnalysis
{
    public string Region { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public double AveragePriceIndex { get; set; }
    public double MedianPriceIndex { get; set; }
    public double PricePerSquareFootIndex { get; set; }
    public Dictionary<string, double> IndexChanges { get; set; } = new();
    public DateTime CalculationDate { get; set; }
}

public class MarketSegmentAnalysis
{
    public string PropertyType { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public double MarketShare { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal MedianPrice { get; set; }
    public int InventoryLevels { get; set; }
    public int DaysOnMarket { get; set; }
    public double PriceAppreciation { get; set; }
    public CompetitiveAnalysis CompetitivePosition { get; set; } = new();
    public List<SegmentTrend> SegmentTrends { get; set; } = new();
    public DateTime AnalysisDate { get; set; }
}

public class SupplyDemandAnalysis
{
    public string Region { get; set; } = string.Empty;
    public SupplyMetrics SupplyMetrics { get; set; } = new();
    public DemandMetrics DemandMetrics { get; set; } = new();
    public double SupplyDemandRatio { get; set; }
    public MarketBalance MarketBalance { get; set; }
    public List<string> PressurePoints { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public DateTime AnalysisDate { get; set; }
}

public class MarketForecast
{
    public string Region { get; set; } = string.Empty;
    public int ForecastPeriod { get; set; }
    public List<decimal> PriceForecast { get; set; } = new();
    public List<int> ActivityForecast { get; set; } = new();
    public List<ConfidenceInterval> ConfidenceIntervals { get; set; } = new();
    public List<string> KeyAssumptions { get; set; } = new();
    public List<string> RiskFactors { get; set; } = new();
    public ScenarioAnalysis ScenarioAnalysis { get; set; } = new();
    public DateTime ForecastDate { get; set; }
}

public class ComparativeMarketAnalysis
{
    public List<string> Regions { get; set; } = new();
    public Dictionary<string, RegionalMetrics> RegionalMetrics { get; set; } = new();
    public Dictionary<string, object> PerformanceComparisons { get; set; } = new();
    public Dictionary<string, int> RegionalRankings { get; set; } = new();
    public List<string> ComparativeInsights { get; set; } = new();
    public DateTime AnalysisDate { get; set; }
}

public class MarketHealthScore
{
    public string Region { get; set; } = string.Empty;
    public double OverallScore { get; set; }
    public double StabilityScore { get; set; }
    public double LiquidityScore { get; set; }
    public double GrowthScore { get; set; }
    public double AffordabilityScore { get; set; }
    public List<HealthIndicator> HealthIndicators { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public DateTime CalculationDate { get; set; }
}

// Supporting data models
public class MarketData 
{ 
    public string Region { get; set; } = string.Empty;
    public int DataPoints { get; set; }
    public DateTime CollectionDate { get; set; }
}
public class TrendMetrics 
{
    public TrendDirection OverallTrend { get; set; }
    public double TrendStrength { get; set; }
    public double GrowthRate { get; set; }
    public double Volatility { get; set; }
}
public class SeasonalAnalysis { }
public class MomentumAnalysis { }
public class TrendIndicator { }
public class PriceDataPoint { }
public class SegmentData 
{ 
    public double MarketShare { get; set; }
    public decimal AveragePrice { get; set; }
    public decimal MedianPrice { get; set; }
    public int InventoryLevels { get; set; }
    public int DaysOnMarket { get; set; }
    public double PriceAppreciation { get; set; }
}
public class CompetitiveAnalysis { }
public class SegmentTrend { }
public class SupplyMetrics { public double TotalInventory { get; set; } }
public class DemandMetrics { public double MonthlyDemand { get; set; } }
public class EquilibriumAnalysis 
{
    public MarketBalance MarketBalance { get; set; }
    public List<string> PressurePoints { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}
public class EconomicIndicators { }
public class MarketDrivers 
{
    public List<string> KeyAssumptions { get; set; } = new();
    public List<string> RiskFactors { get; set; } = new();
}
public class ScenarioAnalysis { }
public class RegionalMetrics { }
public class HealthMetrics { }
public class HealthIndicator { }

public enum MarketAnalysisType
{
    Comprehensive,
    TrendOnly,
    SupplyDemandOnly,
    ForecastOnly,
    Comparative
}

public enum TrendDirection
{
    Increasing,
    Decreasing,
    Stable,
    Volatile
}

public enum MarketBalance
{
    SupplyExcess,
    Balanced,
    DemandExcess
}
