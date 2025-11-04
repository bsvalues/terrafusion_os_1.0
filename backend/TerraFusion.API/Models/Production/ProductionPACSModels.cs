/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - PRODUCTION PACS DATA MODELS
 * Real Benton County Data Structure Integration
 * Championship-Level Property Assessment Data Models
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using TerraFusion.Core.DTOs;

namespace TerraFusion.API.Models.Production;

/// <summary>
/// Production property record using real CURR_PROP_INFO_VW schema
/// </summary>
public class ProductionPropertyRecord
{
    public string PropertyId { get; set; } = string.Empty;
    public string? SupplementalNumber { get; set; }
    public int ValuationYear { get; set; }
    public decimal LandHomesteadValue { get; set; }
    public decimal LandNonHomesteadValue { get; set; }
    public decimal ImprovementHomesteadValue { get; set; }
    public decimal ImprovementNonHomesteadValue { get; set; }
    public decimal AppraisedValue { get; set; }
    public decimal AssessedValue { get; set; }
    public decimal MarketValue { get; set; }
    public string? LegalDescription { get; set; }
    public decimal LegalAcreage { get; set; }
    public string? OwnerName { get; set; }
    public string? PropertyAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? PropertyType { get; set; }
    public string? GeoId { get; set; }
    public DateTime ExtractionTimestamp { get; set; }
}

/// <summary>
/// Production building permit record using real building permit schema
/// Based on 60,907+ permit records from Benton County
/// </summary>
public class ProductionBuildingPermitRecord
{
    public int PermitId { get; set; }
    public string? PermitStatus { get; set; }
    public string? CADStatus { get; set; }
    public string? PermitType { get; set; }
    public string? PermitSubType { get; set; }
    public string? PermitNumber { get; set; }
    public string? Issuer { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? CompletionDate { get; set; }
    public decimal PermitValue { get; set; }
    public decimal PermitArea { get; set; }
    public decimal PercentComplete { get; set; }
    public string? Builder { get; set; }
    public string? BuilderPhone { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastChanged { get; set; }
    public string? Comments { get; set; }
    public string? IssuedTo { get; set; }
    public string? ResidentialCommercial { get; set; }
    public string? StreetNumber { get; set; }
    public string? StreetName { get; set; }
    public string? City { get; set; }
    public string? LandUse { get; set; }
    public decimal CalculatedValue { get; set; }
    public string? Description { get; set; }
    public decimal CountyPercentComplete { get; set; }
    public DateTime? ImportDate { get; set; }
    public DateTime ExtractionTimestamp { get; set; }
}

/// <summary>
/// Property training record for AI agent learning
/// </summary>
public class PropertyTrainingRecord
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal MarketValue { get; set; }
    public decimal AssessedValue { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public decimal LegalAcreage { get; set; }
    public string PropertyType { get; set; } = string.Empty;
    public string PropertyAddress { get; set; } = string.Empty;
    public Dictionary<string, object> Features { get; set; } = new();
    public double AssessmentAccuracy { get; set; }
    public DateTime TrainingTimestamp { get; set; }
}

/// <summary>
/// Building permit training record for AI analysis
/// </summary>
public class BuildingPermitTrainingRecord
{
    public int PermitId { get; set; }
    public string PermitType { get; set; } = string.Empty;
    public decimal PermitValue { get; set; }
    public decimal PermitArea { get; set; }
    public decimal PercentComplete { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? CompletionDate { get; set; }
    public Dictionary<string, object> Features { get; set; } = new();
    public double CompletionPrediction { get; set; }
    public double ValueAccuracy { get; set; }
    public DateTime TrainingTimestamp { get; set; }
}

/// <summary>
/// Assessment validation record for IAAO compliance
/// </summary>
public class AssessmentValidationRecord
{
    public string PropertyId { get; set; } = string.Empty;
    public decimal AssessedValue { get; set; }
    public decimal MarketValue { get; set; }
    public double AssessmentRatio { get; set; }
    public bool IAAOCompliant { get; set; }
    public double AccuracyScore { get; set; }
    public Dictionary<string, object> ValidationMetrics { get; set; } = new();
    public DateTime ValidationTimestamp { get; set; }
}

/// <summary>
/// Production database configuration
/// </summary>
public class ProductionDatabase
{
    public string Name { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string[] ExpectedTables { get; set; } = Array.Empty<string>();
    public string[] CriticalViews { get; set; } = Array.Empty<string>();
    public string[] StoredProcedures { get; set; } = Array.Empty<string>();
}

/// <summary>
/// PACS integration result
/// </summary>
public class PACSIntegrationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<DatabaseIntegrationResult> DatabaseIntegrations { get; set; } = new();
    public SchemaValidationResult SchemaValidation { get; set; } = new();
    public HistoricalDataAnalysisResult HistoricalAnalysis { get; set; } = new();
    public AITrainingDatasetResult TrainingDatasets { get; set; } = new();
    public AIInitializationResult AIInitialization { get; set; } = new();
    public ComplianceValidationResult ComplianceValidation { get; set; } = new();
    public int ProductionRecordsProcessed { get; set; }
    public int AIAgentsTraining { get; set; }
    public bool ProductionReady { get; set; }
    public DateTime IntegrationTimestamp { get; set; }
}

/// <summary>
/// Database integration result
/// </summary>
public class DatabaseIntegrationResult
{
    public string DatabaseName { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TablesIntegrated { get; set; }
    public int ViewsIntegrated { get; set; }
    public int StoredProceduresIntegrated { get; set; }
    public TimeSpan IntegrationDuration { get; set; }
    public DateTime IntegrationTimestamp { get; set; }
}

/// <summary>
/// Property data extraction result
/// </summary>
public class PropertyDataExtractionResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int PropertiesExtracted { get; set; }
    public List<ProductionPropertyRecord> Properties { get; set; } = new();
    public int TrainingRecordsGenerated { get; set; }
    public DateTime ExtractionTimestamp { get; set; }
}

/// <summary>
/// Building permit extraction result
/// </summary>
public class BuildingPermitExtractionResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int PermitsExtracted { get; set; }
    public List<ProductionBuildingPermitRecord> Permits { get; set; } = new();
    public int TrainingRecordsGenerated { get; set; }
    public DateRange HistoricalDataSpan { get; set; } = new();
    public DateTime ExtractionTimestamp { get; set; }
}

/// <summary>
/// AI training dataset result
/// </summary>
public class AITrainingDatasetResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<TrainingDataset> Datasets { get; set; } = new();
    public int PropertyRecords { get; set; }
    public int PermitRecords { get; set; }
    public int TotalTrainingRecords { get; set; }
    public double DatasetQuality { get; set; }
    public double ProductionDataIntegrity { get; set; }
    public DateTime PreparationTimestamp { get; set; }
}

/// <summary>
/// Training dataset definition
/// </summary>
public class TrainingDataset
{
    public string Name { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public int RecordCount { get; set; }
    public double QualityScore { get; set; }
    public Dictionary<string, object> Features { get; set; } = new();
    public DateTime CreationTimestamp { get; set; }
}

/// <summary>
/// AI initialization result
/// </summary>
public class AIInitializationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int AgentsInitialized { get; set; }
    public int TrainingDatasetsLoaded { get; set; }
    public double InitializationAccuracy { get; set; }
    public DateTime InitializationTimestamp { get; set; }
}

/// <summary>
/// Production sync result
/// </summary>
public class ProductionSyncResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<DatabaseSyncOperation> SyncOperations { get; set; } = new();
    public ConsistencyValidationResult ConsistencyValidation { get; set; } = new();
    public bool TrainingDataUpdated { get; set; }
    public int TotalRecordsSynchronized { get; set; }
    public TimeSpan SyncDuration { get; set; }
    public double ProductionIntegrity { get; set; }
    public DateTime SyncTimestamp { get; set; }
}

/// <summary>
/// Database sync operation
/// </summary>
public class DatabaseSyncOperation
{
    public string DatabaseName { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int RecordsSynchronized { get; set; }
    public TimeSpan Duration { get; set; }
    public DateTime SyncTimestamp { get; set; }
}

/// <summary>
/// Consistency validation result
/// </summary>
public class ConsistencyValidationResult
{
    public bool IsConsistent { get; set; }
    public string Message { get; set; } = string.Empty;
    public double IntegrityScore { get; set; }
    public List<string> InconsistencyReports { get; set; } = new();
    public DateTime ValidationTimestamp { get; set; }
}

/// <summary>
/// Historical data analysis result
/// </summary>
public class HistoricalDataAnalysisResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateRange AnalysisPeriod { get; set; } = new();
    public int TotalArchivesAnalyzed { get; set; }
    public int TotalRecordsAnalyzed { get; set; }
    public DataQualityPatterns DataQualityPatterns { get; set; } = new();
    public ValueTrends ValueTrends { get; set; } = new();
    public SeasonalPatterns SeasonalPatterns { get; set; } = new();
    public CompletionTrends CompletionTrends { get; set; } = new();
    public ArchiveAnalysis ArchiveAnalysis { get; set; } = new();
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>
/// Date range
/// </summary>
public class DateRange
{
    public DateRange() { }

    public DateRange(DateTime start, DateTime end)
    {
        Start = start;
        End = end;
    }

    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public TimeSpan Duration => End - Start;
}

/// <summary>
/// Data quality patterns
/// </summary>
public class DataQualityPatterns
{
    public double OverallQuality { get; set; }
    public Dictionary<string, double> FieldQuality { get; set; } = new();
    public List<string> QualityIssues { get; set; } = new();
    public double CompletionRate { get; set; }
    public double MissingDataPercentage { get; set; }
    public int DuplicateRecords { get; set; }
    public double DataConsistencyScore { get; set; }
}

/// <summary>
/// Value trends analysis
/// </summary>
public class ValueTrends
{
    public double AverageGrowthRate { get; set; }
    public Dictionary<string, double> MonthlyTrends { get; set; } = new();
    public Dictionary<string, double> PropertyTypeTrends { get; set; } = new();
    public List<TrendPoint> TrendData { get; set; } = new();
    public string TrendDirection { get; set; } = string.Empty;
    public double AverageAnnualGrowth { get; set; }
    public double ValueVolatility { get; set; }
}

/// <summary>
/// Trend point
/// </summary>
public class TrendPoint
{
    public DateTime Date { get; set; }
    public decimal Value { get; set; }
    public string Category { get; set; } = string.Empty;
}

/// <summary>
/// Seasonal patterns
/// </summary>
public class SeasonalPatterns
{
    public Dictionary<string, double> MonthlyPatterns { get; set; } = new();
    public Dictionary<string, double> QuarterlyPatterns { get; set; } = new();
    public double SeasonalityStrength { get; set; }
    public string PeakSeason { get; set; } = string.Empty;
    public bool HasSeasonalPattern { get; set; }
    public List<string> PeakMonths { get; set; } = new();
    public List<string> LowMonths { get; set; } = new();
    public double SeasonalVariance { get; set; }
}

/// <summary>
/// Completion trends
/// </summary>
public class CompletionTrends
{
    public double AverageCompletionRate { get; set; }
    public Dictionary<string, double> CompletionByType { get; set; } = new();
    public TimeSpan AverageCompletionTime { get; set; }
    public List<CompletionPoint> CompletionData { get; set; } = new();
    public double AverageCompletionDays { get; set; }
    public double CompletionRateImprovement { get; set; }
    public double OnTimeCompletionRate { get; set; }
}

/// <summary>
/// Completion point
/// </summary>
public class CompletionPoint
{
    public DateTime Date { get; set; }
    public double CompletionRate { get; set; }
    public string PermitType { get; set; } = string.Empty;
    public TimeSpan AverageTime { get; set; }
}

/// <summary>
/// Archive analysis
/// </summary>
public class ArchiveAnalysis
{
    public int TotalArchives { get; set; }
    public int TotalRecords { get; set; }
    public Dictionary<string, int> RecordsByYear { get; set; } = new();
    public Dictionary<string, int> RecordsByType { get; set; } = new();
    public double DataIntegrity { get; set; }
}

/// <summary>
/// Schema validation result
/// </summary>
public class SchemaValidationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<DatabaseSchemaValidation> ValidationResults { get; set; } = new();
    public double OverallValidationRate { get; set; }
    public int CriticalIssuesFound { get; set; }
    public DateTime ValidationTimestamp { get; set; }
}

/// <summary>
/// Database schema validation
/// </summary>
public class DatabaseSchemaValidation
{
    public string DatabaseName { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TablesValidated { get; set; }
    public int ViewsValidated { get; set; }
    public int StoredProceduresValidated { get; set; }
    public int CriticalIssues { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
    public DateTime ValidationTimestamp { get; set; }
}

/// <summary>
/// Performance optimization result
/// </summary>
public class PerformanceOptimizationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<QueryOptimization> Optimizations { get; set; } = new();
    public double AveragePerformanceGain { get; set; }
    public int TotalQueriesOptimized { get; set; }
    public DateTime OptimizationTimestamp { get; set; }
}

/// <summary>
/// Query optimization
/// </summary>
public class QueryOptimization
{
    public string QueryType { get; set; } = string.Empty;
    public double PerformanceGain { get; set; }
    public int QueriesOptimized { get; set; }
    public TimeSpan OriginalExecutionTime { get; set; }
    public TimeSpan OptimizedExecutionTime { get; set; }
    public string OptimizationDescription { get; set; } = string.Empty;
}

/// <summary>
/// Compliance validation result
/// </summary>
public class ComplianceValidationResult
{
    public bool IsCompliant { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ComplianceCheck> ComplianceChecks { get; set; } = new();
    public double OverallComplianceRate { get; set; }
    public int CriticalViolations { get; set; }
    public DateTime ValidationTimestamp { get; set; }
}

/// <summary>
/// Training data update result
/// </summary>
public class TrainingDataUpdateResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int RecordsUpdated { get; set; }
    public int AgentsRetrained { get; set; }
    public double AccuracyImprovement { get; set; }
    public DateTime UpdateTimestamp { get; set; }
}
