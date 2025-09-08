using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Services.AI;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.AI;

/// <summary>
/// Comparative Market Analysis (CMA) service providing detailed property comparisons and market positioning
/// </summary>
public interface IComparativeMarketAnalysisService
{
    Task<ComparativeMarketAnalysisReport> GenerateCMAReportAsync(CMARequest request);
    Task<List<ComparableProperty>> FindComparablePropertiesAsync(CMASearchCriteria criteria);
    Task<PropertyComparison> ComparePropertiesAsync(string subjectPropertyId, List<string> comparablePropertyIds);
    Task<MarketPositionAnalysis> AnalyzeMarketPositionAsync(string propertyId);
    Task<PricingRecommendation> GeneratePricingRecommendationAsync(string propertyId);
    Task<CompetitiveAnalysisReport> PerformCompetitiveAnalysisAsync(string propertyId, string purpose);
    Task<CMAValidationResult> ValidateCMAAsync(string cmaId);
    Task<List<MarketAdjustment>> CalculateMarketAdjustmentsAsync(string subjectPropertyId, List<string> comparableIds);
}

public class ComparativeMarketAnalysisService : IComparativeMarketAnalysisService
{
    private readonly ILogger<ComparativeMarketAnalysisService> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly IConfiguration _configuration;
    private readonly IAzureOpenAIService _openAIService;
    private readonly IPropertyValuationService _valuationService;
    private readonly IMarketAnalysisEngine _marketAnalysis;

    public ComparativeMarketAnalysisService(
        ILogger<ComparativeMarketAnalysisService> logger,
        IStructuredLogger structuredLogger,
        IConfiguration configuration,
        IAzureOpenAIService openAIService,
        IPropertyValuationService valuationService,
        IMarketAnalysisEngine marketAnalysis)
    {
        _logger = logger;
        _structuredLogger = structuredLogger;
        _configuration = configuration;
        _openAIService = openAIService;
        _valuationService = valuationService;
        _marketAnalysis = marketAnalysis;
    }

    public async Task<ComparativeMarketAnalysisReport> GenerateCMAReportAsync(CMARequest request)
    {
        var cmaId = Guid.NewGuid().ToString();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _structuredLogger.LogAIEvent("CMAReportGenerationStarted",
                $"Starting CMA report generation for property {request.SubjectPropertyId}",
                context: new { 
                    CMAId = cmaId,
                    SubjectPropertyId = request.SubjectPropertyId,
                    Purpose = request.Purpose,
                    RequestedComparables = request.MaxComparables
                });

            // Step 1: Get subject property details
            var subjectProperty = await GetPropertyDetailsAsync(request.SubjectPropertyId);

            // Step 2: Find comparable properties
            var searchCriteria = BuildSearchCriteria(subjectProperty, request);
            var comparables = await FindComparablePropertiesAsync(searchCriteria);

            // Step 3: Perform detailed property comparisons
            var propertyComparisons = await ComparePropertiesAsync(request.SubjectPropertyId, 
                comparables.Take(request.MaxComparables).Select(c => c.PropertyId).ToList());

            // Step 4: Calculate market adjustments
            var marketAdjustments = await CalculateMarketAdjustmentsAsync(request.SubjectPropertyId,
                comparables.Take(request.MaxComparables).Select(c => c.PropertyId).ToList());

            // Step 5: Analyze market position
            var marketPosition = await AnalyzeMarketPositionAsync(request.SubjectPropertyId);

            // Step 6: Generate pricing recommendation
            var pricingRecommendation = await GeneratePricingRecommendationAsync(request.SubjectPropertyId);

            // Step 7: Perform competitive analysis
            var competitiveAnalysis = await PerformCompetitiveAnalysisAsync(request.SubjectPropertyId, request.Purpose);

            // Step 8: Generate AI-powered insights and narrative
            var cmaInsights = await GenerateCMAInsightsAsync(subjectProperty, comparables, marketPosition, pricingRecommendation);
            var executiveSummary = await GenerateExecutiveSummaryAsync(request, marketPosition, pricingRecommendation);

            stopwatch.Stop();

            var report = new ComparativeMarketAnalysisReport
            {
                CMAId = cmaId,
                SubjectProperty = subjectProperty,
                ComparableProperties = comparables.Take(request.MaxComparables).ToList(),
                PropertyComparisons = propertyComparisons,
                MarketAdjustments = marketAdjustments,
                MarketPosition = marketPosition,
                PricingRecommendation = pricingRecommendation,
                CompetitiveAnalysis = competitiveAnalysis,
                ExecutiveSummary = executiveSummary,
                CMAInsights = cmaInsights,
                Purpose = request.Purpose,
                AnalysisDate = DateTime.UtcNow,
                ValidityPeriod = TimeSpan.FromDays(90),
                ProcessingTime = stopwatch.Elapsed,
                Methodology = "AI-Enhanced Comparative Market Analysis",
                Disclaimers = GetCMADisclaimers()
            };

            _structuredLogger.LogAIEvent("CMAReportGenerationCompleted",
                $"CMA report generation completed successfully",
                context: new { 
                    CMAId = cmaId,
                    ComparablesFound = comparables.Count,
                    ProcessingTime = stopwatch.ElapsedMilliseconds,
                    RecommendedPrice = pricingRecommendation.RecommendedPrice
                });

            return report;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "CMA report generation failed for property {PropertyId}", request.SubjectPropertyId);

            return new ComparativeMarketAnalysisReport
            {
                CMAId = cmaId,
                Error = ex.Message,
                ProcessingTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<List<ComparableProperty>> FindComparablePropertiesAsync(CMASearchCriteria criteria)
    {
        try
        {
            _structuredLogger.LogAIEvent("ComparableSearchStarted",
                $"Searching for comparable properties",
                context: new { 
                    SubjectPropertyId = criteria.SubjectPropertyId,
                    SearchRadius = criteria.SearchRadiusMiles,
                    MaxResults = criteria.MaxResults
                });

            // Step 1: Initial property search based on basic criteria
            var candidateProperties = await SearchCandidatePropertiesAsync(criteria);

            // Step 2: Apply similarity scoring using AI
            var scoredProperties = await ScorePropertySimilarityAsync(criteria.SubjectPropertyId, candidateProperties);

            // Step 3: Filter by recency and market conditions
            var recentProperties = FilterByRecencyAsync(scoredProperties, criteria.MaxDaysOnMarket);

            // Step 4: Apply quality scoring and ranking
            var rankedProperties = await RankComparableQualityAsync(recentProperties);

            // Step 5: Apply market adjustments for timing and conditions
            var adjustedProperties = await ApplyTimingAdjustmentsAsync(rankedProperties);

            // Step 6: Final validation and selection
            var validatedComparables = await ValidateComparablesAsync(adjustedProperties, criteria);

            return validatedComparables.Take(criteria.MaxResults).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Comparable property search failed");
            return new List<ComparableProperty>();
        }
    }

    public async Task<PropertyComparison> ComparePropertiesAsync(string subjectPropertyId, List<string> comparablePropertyIds)
    {
        try
        {
            var subjectProperty = await GetPropertyDetailsAsync(subjectPropertyId);
            var comparableProperties = new List<PropertyDetails>();

            foreach (var id in comparablePropertyIds)
            {
                var property = await GetPropertyDetailsAsync(id);
                comparableProperties.Add(property);
            }

            // Generate detailed feature comparisons
            var featureComparisons = await GenerateFeatureComparisonsAsync(subjectProperty, comparableProperties);

            // Calculate similarity scores
            var similarityScores = await CalculateSimilarityScoresAsync(subjectProperty, comparableProperties);

            // Identify key differences and adjustments needed
            var keyDifferences = await IdentifyKeyDifferencesAsync(subjectProperty, comparableProperties);

            // Generate comparison insights
            var comparisonInsights = await GenerateComparisonInsightsAsync(subjectProperty, comparableProperties, featureComparisons);

            return new PropertyComparison
            {
                SubjectProperty = subjectProperty,
                ComparableProperties = comparableProperties,
                FeatureComparisons = featureComparisons,
                SimilarityScores = similarityScores,
                KeyDifferences = keyDifferences,
                ComparisonInsights = comparisonInsights,
                ComparisonDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Property comparison failed");
            throw;
        }
    }

    public async Task<MarketPositionAnalysis> AnalyzeMarketPositionAsync(string propertyId)
    {
        try
        {
            var property = await GetPropertyDetailsAsync(propertyId);
            var marketData = await GetLocalMarketDataAsync(property.Address);
            var priceDistribution = await CalculatePriceDistributionAsync(property);
            var competitivePosition = await AnalyzeCompetitivePositionAsync(property);

            // Calculate market percentiles
            var marketPercentiles = await CalculateMarketPercentilesAsync(property, marketData);

            // Analyze price positioning
            var pricePositioning = await AnalyzePricePositioningAsync(property, marketData);

            // Assess market opportunities
            var marketOpportunities = await AssessMarketOpportunitiesAsync(property, marketData);

            return new MarketPositionAnalysis
            {
                PropertyId = propertyId,
                MarketPercentiles = marketPercentiles,
                PriceDistribution = priceDistribution,
                CompetitivePosition = competitivePosition,
                PricePositioning = pricePositioning,
                MarketOpportunities = marketOpportunities,
                MarketStrengths = await IdentifyMarketStrengthsAsync(property, marketData),
                MarketWeaknesses = await IdentifyMarketWeaknessesAsync(property, marketData),
                AnalysisDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Market position analysis failed for property {PropertyId}", propertyId);
            throw;
        }
    }

    public async Task<PricingRecommendation> GeneratePricingRecommendationAsync(string propertyId)
    {
        try
        {
            // Get AI valuation
            var valuationRequest = await BuildValuationRequestAsync(propertyId);
            var aiValuation = await _valuationService.CalculatePropertyValueAsync(valuationRequest);

            // Get market analysis
            var marketPosition = await AnalyzeMarketPositionAsync(propertyId);

            // Analyze pricing strategy options
            var pricingStrategies = await AnalyzePricingStrategiesAsync(propertyId, aiValuation, marketPosition);

            // Generate pricing recommendations for different scenarios
            var recommendations = await GeneratePricingRecommendationsAsync(propertyId, pricingStrategies);

            // Calculate confidence intervals
            var confidenceIntervals = await CalculatePricingConfidenceAsync(aiValuation, marketPosition);

            return new PricingRecommendation
            {
                PropertyId = propertyId,
                RecommendedPrice = recommendations.OptimalPrice,
                PriceRange = new PriceRange
                {
                    MinPrice = recommendations.ConservativePrice,
                    MaxPrice = recommendations.AggressivePrice,
                    OptimalPrice = recommendations.OptimalPrice
                },
                PricingStrategies = pricingStrategies,
                ConfidenceInterval = confidenceIntervals,
                MarketConditionsImpact = await AssessMarketConditionsImpactAsync(propertyId),
                PricingRationale = await GeneratePricingRationaleAsync(recommendations, marketPosition),
                RecommendationDate = DateTime.UtcNow,
                ValidityPeriod = TimeSpan.FromDays(30)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Pricing recommendation generation failed for property {PropertyId}", propertyId);
            throw;
        }
    }

    public async Task<CompetitiveAnalysisReport> PerformCompetitiveAnalysisAsync(string propertyId, string purpose)
    {
        try
        {
            var property = await GetPropertyDetailsAsync(propertyId);
            var competitors = await IdentifyCompetitorsAsync(property, purpose);
            var competitiveMetrics = await CalculateCompetitiveMetricsAsync(property, competitors);
            var marketAdvantages = await IdentifyMarketAdvantagesAsync(property, competitors);
            var competitiveThreats = await IdentifyCompetitiveThreatsAsync(property, competitors);

            return new CompetitiveAnalysisReport
            {
                PropertyId = propertyId,
                Purpose = purpose,
                Competitors = competitors,
                CompetitiveMetrics = competitiveMetrics,
                MarketAdvantages = marketAdvantages,
                CompetitiveThreats = competitiveThreats,
                CompetitiveStrategies = await DevelopCompetitiveStrategiesAsync(property, competitors),
                AnalysisDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Competitive analysis failed for property {PropertyId}", propertyId);
            throw;
        }
    }

    public async Task<CMAValidationResult> ValidateCMAAsync(string cmaId)
    {
        try
        {
            var cmaReport = await GetCMAReportAsync(cmaId);
            var validationChecks = await PerformValidationChecksAsync(cmaReport);
            var accuracyAssessment = await AssessCMAAccuracyAsync(cmaReport);
            var reliabilityScore = await CalculateReliabilityScoreAsync(cmaReport, validationChecks);

            return new CMAValidationResult
            {
                CMAId = cmaId,
                IsValid = validationChecks.All(c => c.Passed),
                ReliabilityScore = reliabilityScore,
                ValidationChecks = validationChecks,
                AccuracyAssessment = accuracyAssessment,
                ValidationDate = DateTime.UtcNow,
                ValidatorComments = await GenerateValidatorCommentsAsync(validationChecks, accuracyAssessment)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CMA validation failed for CMA {CMAId}", cmaId);
            throw;
        }
    }

    public async Task<List<MarketAdjustment>> CalculateMarketAdjustmentsAsync(string subjectPropertyId, List<string> comparableIds)
    {
        try
        {
            var adjustments = new List<MarketAdjustment>();
            var subjectProperty = await GetPropertyDetailsAsync(subjectPropertyId);

            foreach (var comparableId in comparableIds)
            {
                var comparable = await GetPropertyDetailsAsync(comparableId);
                var adjustment = await CalculateIndividualAdjustmentAsync(subjectProperty, comparable);
                adjustments.Add(adjustment);
            }

            return adjustments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Market adjustments calculation failed");
            throw;
        }
    }

    // Private helper methods
    private async Task<PropertyDetails> GetPropertyDetailsAsync(string propertyId)
    {
        await Task.Delay(10);
        return new PropertyDetails { PropertyId = propertyId };
    }

    private CMASearchCriteria BuildSearchCriteria(PropertyDetails subjectProperty, CMARequest request)
    {
        return new CMASearchCriteria
        {
            SubjectPropertyId = request.SubjectPropertyId,
            PropertyType = subjectProperty.PropertyType,
            SearchRadiusMiles = request.SearchRadiusMiles,
            MaxDaysOnMarket = request.MaxDaysOnMarket,
            MaxResults = request.MaxComparables
        };
    }

    private async Task<string> GenerateCMAInsightsAsync(PropertyDetails subject, List<ComparableProperty> comparables, 
        MarketPositionAnalysis position, PricingRecommendation pricing)
    {
        try
        {
            var prompt = $@"Generate comprehensive CMA insights for:
Subject Property: {subject.PropertyType} at {subject.Address}
Comparable Properties: {comparables.Count} analyzed
Market Position: {position.PricePositioning}
Recommended Price: ${pricing.RecommendedPrice:N0}

Provide insights on:
1. Market competitiveness and positioning
2. Pricing strategy recommendations
3. Key market trends affecting value
4. Competitive advantages and disadvantages
5. Market timing considerations";

            var aiRequest = new ChatCompletionRequest
            {
                Model = "gpt-4",
                Messages = new List<ChatMessage>
                {
                    new ChatMessage { Role = "system", Content = "You are a professional real estate analyst providing CMA insights." },
                    new ChatMessage { Role = "user", Content = prompt }
                },
                MaxTokens = 400,
                Temperature = 0.3
            };

            var response = await _openAIService.GetChatCompletionAsync(aiRequest);
            return response.Choices?.FirstOrDefault()?.Message?.Content ?? "CMA insights unavailable";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate CMA insights");
            return "CMA insights unavailable due to processing error";
        }
    }

    private async Task<string> GenerateExecutiveSummaryAsync(CMARequest request, MarketPositionAnalysis position, PricingRecommendation pricing)
    {
        try
        {
            var summary = $@"
EXECUTIVE SUMMARY - Comparative Market Analysis

Property: {request.SubjectPropertyId}
Analysis Purpose: {request.Purpose}
Analysis Date: {DateTime.UtcNow:MMMM dd, yyyy}

KEY FINDINGS:
• Recommended Market Value: ${pricing.RecommendedPrice:N0}
• Price Range: ${pricing.PriceRange.MinPrice:N0} - ${pricing.PriceRange.MaxPrice:N0}
• Market Position: {position.PricePositioning}
• Market Confidence: {pricing.ConfidenceInterval.Lower:P0} - {pricing.ConfidenceInterval.Upper:P0}

MARKET ANALYSIS:
The subject property is positioned competitively within the local market. Based on analysis of comparable sales and current market conditions, the recommended pricing strategy supports optimal market performance.

RECOMMENDATIONS:
1. Price competitively within the recommended range
2. Monitor market conditions for timing optimization
3. Leverage identified competitive advantages
4. Address any property-specific concerns highlighted in the analysis
";

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate executive summary");
            return "Executive summary unavailable";
        }
    }

    // Placeholder implementations for various analysis methods
    private async Task<List<PropertyDetails>> SearchCandidatePropertiesAsync(CMASearchCriteria criteria) { await Task.Delay(10); return new List<PropertyDetails>(); }
    private async Task<List<ScoredProperty>> ScorePropertySimilarityAsync(string subjectId, List<PropertyDetails> candidates) { await Task.Delay(10); return new List<ScoredProperty>(); }
    private List<ScoredProperty> FilterByRecencyAsync(List<ScoredProperty> properties, int maxDays) { return properties; }
    private async Task<List<RankedProperty>> RankComparableQualityAsync(List<ScoredProperty> properties) { await Task.Delay(10); return new List<RankedProperty>(); }
    private async Task<List<ComparableProperty>> ApplyTimingAdjustmentsAsync(List<RankedProperty> properties) { await Task.Delay(10); return new List<ComparableProperty>(); }
    private async Task<List<ComparableProperty>> ValidateComparablesAsync(List<ComparableProperty> properties, CMASearchCriteria criteria) { await Task.Delay(5); return properties; }
    private async Task<List<FeatureComparison>> GenerateFeatureComparisonsAsync(PropertyDetails subject, List<PropertyDetails> comparables) { await Task.Delay(10); return new List<FeatureComparison>(); }
    private async Task<List<double>> CalculateSimilarityScoresAsync(PropertyDetails subject, List<PropertyDetails> comparables) { await Task.Delay(5); return new List<double>(); }
    private async Task<List<PropertyDifference>> IdentifyKeyDifferencesAsync(PropertyDetails subject, List<PropertyDetails> comparables) { await Task.Delay(5); return new List<PropertyDifference>(); }
    private async Task<string> GenerateComparisonInsightsAsync(PropertyDetails subject, List<PropertyDetails> comparables, List<FeatureComparison> features) { await Task.Delay(5); return "Comparison insights"; }
    private async Task<LocalMarketData> GetLocalMarketDataAsync(string address) { await Task.Delay(5); return new LocalMarketData(); }
    private async Task<PriceDistribution> CalculatePriceDistributionAsync(PropertyDetails property) { await Task.Delay(5); return new PriceDistribution(); }
    private async Task<CompetitivePosition> AnalyzeCompetitivePositionAsync(PropertyDetails property) { await Task.Delay(5); return new CompetitivePosition(); }
    private async Task<Dictionary<string, double>> CalculateMarketPercentilesAsync(PropertyDetails property, LocalMarketData market) { await Task.Delay(5); return new Dictionary<string, double>(); }
    private async Task<string> AnalyzePricePositioningAsync(PropertyDetails property, LocalMarketData market) { await Task.Delay(5); return "Competitive"; }
    private async Task<List<string>> AssessMarketOpportunitiesAsync(PropertyDetails property, LocalMarketData market) { await Task.Delay(5); return new List<string>(); }
    private async Task<List<string>> IdentifyMarketStrengthsAsync(PropertyDetails property, LocalMarketData market) { await Task.Delay(5); return new List<string>(); }
    private async Task<List<string>> IdentifyMarketWeaknessesAsync(PropertyDetails property, LocalMarketData market) { await Task.Delay(5); return new List<string>(); }
    private async Task<PropertyValuationRequest> BuildValuationRequestAsync(string propertyId) { await Task.Delay(5); return new PropertyValuationRequest(); }
    private async Task<List<PricingStrategy>> AnalyzePricingStrategiesAsync(string propertyId, PropertyValuationResult valuation, MarketPositionAnalysis position) { await Task.Delay(10); return new List<PricingStrategy>(); }
    private async Task<PricingRecommendations> GeneratePricingRecommendationsAsync(string propertyId, List<PricingStrategy> strategies) { await Task.Delay(5); return new PricingRecommendations(); }
    private async Task<ConfidenceInterval> CalculatePricingConfidenceAsync(PropertyValuationResult valuation, MarketPositionAnalysis position) { await Task.Delay(5); return new ConfidenceInterval(); }
    private async Task<string> AssessMarketConditionsImpactAsync(string propertyId) { await Task.Delay(5); return "Favorable market conditions"; }
    private async Task<string> GeneratePricingRationaleAsync(PricingRecommendations recommendations, MarketPositionAnalysis position) { await Task.Delay(5); return "Pricing rationale"; }
    private async Task<List<CompetitorProperty>> IdentifyCompetitorsAsync(PropertyDetails property, string purpose) { await Task.Delay(10); return new List<CompetitorProperty>(); }
    private async Task<CompetitiveMetrics> CalculateCompetitiveMetricsAsync(PropertyDetails property, List<CompetitorProperty> competitors) { await Task.Delay(5); return new CompetitiveMetrics(); }
    private async Task<List<string>> IdentifyMarketAdvantagesAsync(PropertyDetails property, List<CompetitorProperty> competitors) { await Task.Delay(5); return new List<string>(); }
    private async Task<List<string>> IdentifyCompetitiveThreatsAsync(PropertyDetails property, List<CompetitorProperty> competitors) { await Task.Delay(5); return new List<string>(); }
    private async Task<List<string>> DevelopCompetitiveStrategiesAsync(PropertyDetails property, List<CompetitorProperty> competitors) { await Task.Delay(5); return new List<string>(); }
    private async Task<ComparativeMarketAnalysisReport> GetCMAReportAsync(string cmaId) { await Task.Delay(5); return new ComparativeMarketAnalysisReport(); }
    private async Task<List<ValidationCheck>> PerformValidationChecksAsync(ComparativeMarketAnalysisReport report) { await Task.Delay(10); return new List<ValidationCheck>(); }
    private async Task<AccuracyAssessment> AssessCMAAccuracyAsync(ComparativeMarketAnalysisReport report) { await Task.Delay(5); return new AccuracyAssessment(); }
    private async Task<double> CalculateReliabilityScoreAsync(ComparativeMarketAnalysisReport report, List<ValidationCheck> checks) { await Task.Delay(5); return 0.88; }
    private async Task<string> GenerateValidatorCommentsAsync(List<ValidationCheck> checks, AccuracyAssessment assessment) { await Task.Delay(5); return "Validation comments"; }
    private async Task<MarketAdjustment> CalculateIndividualAdjustmentAsync(PropertyDetails subject, PropertyDetails comparable) { await Task.Delay(5); return new MarketAdjustment(); }

    private List<string> GetCMADisclaimers()
    {
        return new List<string>
        {
            "This CMA is for informational purposes only and does not constitute an appraisal",
            "Market conditions may change rapidly affecting property values",
            "Actual sale price may vary based on negotiation and market timing",
            "AI analysis should be reviewed by qualified real estate professionals"
        };
    }
}

// Data models for CMA
public class CMARequest
{
    public string SubjectPropertyId { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public int MaxComparables { get; set; } = 5;
    public double SearchRadiusMiles { get; set; } = 1.0;
    public int MaxDaysOnMarket { get; set; } = 180;
}

public class CMASearchCriteria
{
    public string SubjectPropertyId { get; set; } = string.Empty;
    public string PropertyType { get; set; } = string.Empty;
    public double SearchRadiusMiles { get; set; }
    public int MaxDaysOnMarket { get; set; }
    public int MaxResults { get; set; }
}

public class ComparativeMarketAnalysisReport
{
    public string CMAId { get; set; } = string.Empty;
    public PropertyDetails SubjectProperty { get; set; } = new();
    public List<ComparableProperty> ComparableProperties { get; set; } = new();
    public PropertyComparison PropertyComparisons { get; set; } = new();
    public List<MarketAdjustment> MarketAdjustments { get; set; } = new();
    public MarketPositionAnalysis MarketPosition { get; set; } = new();
    public PricingRecommendation PricingRecommendation { get; set; } = new();
    public CompetitiveAnalysisReport CompetitiveAnalysis { get; set; } = new();
    public string ExecutiveSummary { get; set; } = string.Empty;
    public string CMAInsights { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime AnalysisDate { get; set; }
    public TimeSpan ValidityPeriod { get; set; }
    public string? Error { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public string Methodology { get; set; } = string.Empty;
    public List<string> Disclaimers { get; set; } = new();
}

public class ComparableProperty
{
    public string PropertyId { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal SalePrice { get; set; }
    public DateTime SaleDate { get; set; }
    public double SimilarityScore { get; set; }
    public double QualityScore { get; set; }
    public Dictionary<string, object> PropertyFeatures { get; set; } = new();
    public List<PropertyAdjustment> Adjustments { get; set; } = new();
}

public class PropertyComparison
{
    public PropertyDetails SubjectProperty { get; set; } = new();
    public List<PropertyDetails> ComparableProperties { get; set; } = new();
    public List<FeatureComparison> FeatureComparisons { get; set; } = new();
    public List<double> SimilarityScores { get; set; } = new();
    public List<PropertyDifference> KeyDifferences { get; set; } = new();
    public string ComparisonInsights { get; set; } = string.Empty;
    public DateTime ComparisonDate { get; set; }
}

public class MarketPositionAnalysis
{
    public string PropertyId { get; set; } = string.Empty;
    public string MarketSegment { get; set; } = string.Empty;
    public double CompetitiveScore { get; set; }
    public List<string> CompetitiveStrengths { get; set; } = new();
    public List<string> CompetitiveWeaknesses { get; set; } = new();
    public Dictionary<string, double> MarketPercentiles { get; set; } = new();
    public PriceDistribution PriceDistribution { get; set; } = new();
    public CompetitivePosition CompetitivePosition { get; set; } = new();
    public string PricePositioning { get; set; } = string.Empty;
    public List<string> MarketOpportunities { get; set; } = new();
    public List<string> MarketStrengths { get; set; } = new();
    public List<string> MarketWeaknesses { get; set; } = new();
    public DateTime AnalysisDate { get; set; }
}

public class PricingRecommendation
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal RecommendedPrice { get; set; }
    public PriceRange PriceRange { get; set; } = new();
    public List<PricingStrategy> PricingStrategies { get; set; } = new();
    public ConfidenceInterval ConfidenceInterval { get; set; } = new();
    public string MarketConditionsImpact { get; set; } = string.Empty;
    public string PricingRationale { get; set; } = string.Empty;
    public DateTime RecommendationDate { get; set; }
    public TimeSpan ValidityPeriod { get; set; }
}

public class CompetitiveAnalysisReport
{
    public string PropertyId { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public List<CompetitorProperty> Competitors { get; set; } = new();
    public CompetitiveMetrics CompetitiveMetrics { get; set; } = new();
    public List<string> MarketAdvantages { get; set; } = new();
    public List<string> CompetitiveThreats { get; set; } = new();
    public List<string> CompetitiveStrategies { get; set; } = new();
    public DateTime AnalysisDate { get; set; }
}

public class CMAValidationResult
{
    public string CMAId { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public double ReliabilityScore { get; set; }
    public List<ValidationCheck> ValidationChecks { get; set; } = new();
    public AccuracyAssessment AccuracyAssessment { get; set; } = new();
    public DateTime ValidationDate { get; set; }
    public string ValidatorComments { get; set; } = string.Empty;
}

public class MarketAdjustment
{
    public string ComparablePropertyId { get; set; } = string.Empty;
    public string AdjustmentType { get; set; } = string.Empty;
    public decimal AdjustmentAmount { get; set; }
    public double AdjustmentPercentage { get; set; }
    public string Rationale { get; set; } = string.Empty;
}

// Supporting data models
public class PropertyDetails { public string PropertyId { get; set; } = string.Empty; public string PropertyType { get; set; } = string.Empty; public string Address { get; set; } = string.Empty; }
public class ScoredProperty { }
public class RankedProperty { }
public class FeatureComparison { }
public class PropertyDifference { }
public class LocalMarketData { }
public class PriceDistribution { }
public class CompetitivePosition { }
public class PriceRange { public decimal MinPrice { get; set; } public decimal MaxPrice { get; set; } public decimal OptimalPrice { get; set; } }
public class PricingStrategy { }
public class PricingRecommendations { public decimal OptimalPrice { get; set; } public decimal ConservativePrice { get; set; } public decimal AggressivePrice { get; set; } }
public class CompetitorProperty { }
public class CompetitiveMetrics { }
public class ValidationCheck { public bool Passed { get; set; } }
public class AccuracyAssessment { }
public class PropertyAdjustment { }
