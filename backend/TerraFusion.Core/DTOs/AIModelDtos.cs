using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    // Property Valuation DTOs
    public class PropertyValuationRequest
    {
        [Required]
        [StringLength(50)]
        public string PropertyId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Location { get; set; } = string.Empty;
        
        [Range(1, 50000)]
        public decimal? SquareFootage { get; set; }
        
        [Range(0, 20)]
        public int? Bedrooms { get; set; }
        
        [Range(0, 20)]
        public decimal? Bathrooms { get; set; }
        
        [Range(1800, 2100)]
        public int? YearBuilt { get; set; }
        
        [Required]
        [StringLength(100)]
        public string PropertyType { get; set; } = string.Empty;
        
        public Dictionary<string, object> PropertyDetails { get; set; } = new();
        
        [StringLength(50)]
        public string ValuationType { get; set; } = string.Empty;
    }

    public class PropertyValuationResult
    {
        [Required]
        [StringLength(50)]
        public string PropertyId { get; set; } = string.Empty;
        
        [Range(0, double.MaxValue)]
        public decimal EstimatedValue { get; set; }
        
        public DateTime ValuationDate { get; set; }
        
        [Range(0, 1)]
        public decimal ConfidenceScore { get; set; }
        
        [StringLength(100)]
        public string Methodology { get; set; } = string.Empty;
        
        public List<string> ComparableProperties { get; set; } = new();
        public List<string> MarketFactors { get; set; } = new();
    }

    // Cost Prediction DTOs
    public class CostPredictionRequest
    {
        [Required]
        [StringLength(50)]
        public string ProjectId { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string ProjectType { get; set; } = string.Empty;
        
        [Required]
        [StringLength(200)]
        public string Location { get; set; } = string.Empty;
        
        [Range(1, 100000)]
        public decimal? SquareFootage { get; set; }
        
        public Dictionary<string, object> ProjectDetails { get; set; } = new();
    }

    public class CostPredictionResult
    {
        public decimal TotalCost { get; set; }
        public Dictionary<string, decimal> CostBreakdown { get; set; } = new();
        public decimal ConfidenceScore { get; set; }
        public (decimal Low, decimal High) PredictionRange { get; set; }
        public List<string> FactorsConsidered { get; set; } = new();
        public Dictionary<string, decimal> MarketAdjustments { get; set; } = new();
    }

    // ROI Prediction DTOs
    public class ROIPredictionRequest
    {
        public string PropertyId { get; set; } = string.Empty;
        public decimal? InvestmentAmount { get; set; }
        public string? TimeHorizon { get; set; }
        public string? Region { get; set; }
        public Dictionary<string, object> InvestmentDetails { get; set; } = new();
    }

    public class ROIPredictionResult
    {
        public decimal PredictedROI { get; set; }
        public (decimal Low, decimal High) ConfidenceInterval { get; set; }
        public string TimeHorizon { get; set; } = string.Empty;
        public List<string> RiskFactors { get; set; } = new();
        public decimal ModelAccuracy { get; set; }
    }

    // Market Trend DTOs
    public class MarketTrendRequest
    {
        public string Region { get; set; } = string.Empty;
        public string PropertyType { get; set; } = string.Empty;
        public string TimeFrame { get; set; } = string.Empty;
    }

    public class MarketTrendResult
    {
        public string Region { get; set; } = string.Empty;
        public string TrendDirection { get; set; } = string.Empty;
        public decimal Confidence { get; set; }
        public decimal PredictedGrowth { get; set; }
        public List<string> MarketFactors { get; set; } = new();
    }

    // Risk Assessment DTOs
    public class RiskAssessmentRequest
    {
        public string PropertyId { get; set; } = string.Empty;
        public string InvestmentType { get; set; } = string.Empty;
        public decimal InvestmentAmount { get; set; }
        public string Region { get; set; } = string.Empty;
        public Dictionary<string, object> RiskParameters { get; set; } = new();
    }

    public class RiskAssessmentResult
    {
        public string OverallRisk { get; set; } = string.Empty;
        public decimal RiskScore { get; set; }
        public List<RiskFactorResult> RiskFactors { get; set; } = new();
        public List<string> MitigationStrategies { get; set; } = new();
    }

    public class RiskFactorResult
    {
        public string Factor { get; set; } = string.Empty;
        public string Impact { get; set; } = string.Empty;
        public decimal Probability { get; set; }
        public decimal Severity { get; set; }
    }

    // Cost Factor DTOs
    public class CostFactor
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal BaseCost { get; set; }
        public decimal AdjustmentFactor { get; set; }
        public decimal RegionalMultiplier { get; set; }
        public decimal VolatilityIndex { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    // Model Status DTOs
    public class ModelStatusResult
    {
        public List<string> LoadedModels { get; set; } = new();
        public Dictionary<string, string> ModelVersions { get; set; } = new();
        public Dictionary<string, string> TrainingStatus { get; set; } = new();
        public DateTime LastUpdated { get; set; }
    }
}
