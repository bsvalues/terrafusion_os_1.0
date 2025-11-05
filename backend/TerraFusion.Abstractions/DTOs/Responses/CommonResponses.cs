// TerraFusion.Abstractions/DTOs/Responses/CommonResponses.cs
// Canonical definitions for cross-project response DTOs
// Created: 2025-11-04 05:59:44
// Updated: Property enrichment with complete property unions

namespace TerraFusion.Abstractions.DTOs.Responses;

/// <summary>
/// CANONICAL: Optimization recommendation response
/// Replaces: TerraFusion.API.Interfaces.OptimizationRecommendation
///          TerraFusion.API.Models.Performance.OptimizationRecommendation
///          TerraFusion.Abstractions.Interfaces.OptimizationRecommendation
/// Property Union: Complete set from all source variants
/// </summary>
public class OptimizationRecommendation
{
    // Primary identification
    public string RecommendationId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Recommendation classification
    public string RecommendationType { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    // Priority (dual type support for interface compatibility)
    public string Priority { get; set; } = string.Empty;
    public int PriorityInt { get; set; }

    // Impact assessment
    public double EstimatedImpact { get; set; }
    public double ImpactScore { get; set; }
    public decimal ExpectedImprovement { get; set; }

    // Implementation details
    public string Implementation { get; set; } = string.Empty;
    public string ImplementationEffort { get; set; } = string.Empty;
    public string Complexity { get; set; } = string.Empty;
    public List<string> ImplementationSteps { get; set; } = new();
    public List<string> ActionItems { get; set; } = new();

    // Automation and approval
    public bool AutoApprove { get; set; }

    // Validation and metadata
    public double Confidence { get; set; }
    public List<string> Prerequisites { get; set; } = new();
    public List<string> Benefits { get; set; } = new();
    public List<string> Risks { get; set; } = new();
    public Dictionary<string, double> Metrics { get; set; } = new();

    // Temporal tracking
    public DateTime CreatedAt { get; set; }
    public DateTime GeneratedAt { get; set; }

    // Status management
    public string Status { get; set; } = "Pending";
}

/// <summary>
/// CANONICAL: Elite performance metrics response
/// Replaces: TerraFusion.API.Services.ElitePerformanceMetrics
///          TerraFusion.Abstractions.Interfaces.ElitePerformanceMetrics
///          TerraFusion.Operations.Models.ElitePerformanceMetrics
/// </summary>
public class ElitePerformanceMetrics
{
    public double CPUUtilization { get; set; }
    public double MemoryUtilization { get; set; }
    public double DiskUtilization { get; set; }
    public double NetworkUtilization { get; set; }
    public TimeSpan ResponseTime { get; set; }
    public double ThroughputPerSecond { get; set; }
    public double ErrorRate { get; set; }
    public double PerformanceScore { get; set; }
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// CANONICAL: Synchronization result response
/// Replaces: TerraFusion.Core.Interfaces.SyncResult
///          TerraFusion.Core.Services.SyncResult
/// Property Union: Complete set from all source variants
/// </summary>
public class SyncResult
{
    // Core status
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    // Temporal tracking
    public DateTime Timestamp { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public DateTime SyncTime { get; set; }
    public DateTime SyncTimestamp { get; set; }

    // Duration metrics
    public TimeSpan Duration { get; set; }
    public TimeSpan SyncDuration { get; set; }

    // Record processing counts
    public int RecordsProcessed { get; set; }
    public int RecordsInserted { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsAdded { get; set; }
    public int RecordsSynced { get; set; }
    public int RecordsSkipped { get; set; }
    public int RecordsFailed { get; set; }
    public int ErrorCount { get; set; }
    public int TotalRecordsSynced { get; set; }

    // Collections
    public List<string> Errors { get; set; } = new();
    public List<string> SyncOperations { get; set; } = new();

    // Context identification
    public string? CountyName { get; set; }
    public string SyncId { get; set; } = string.Empty;

    // AI integration tracking
    public bool AITrainingDataUpdated { get; set; }

    // Extensibility
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// CANONICAL: Compliance violation response
/// Replaces: TerraFusion.Abstractions.DTOs.ComplianceViolation
///          TerraFusion.Core.Services.ComplianceViolation
/// Property Union: Complete set from all source variants
/// </summary>
public class ComplianceViolation
{
    // Primary identification
    public string ViolationId { get; set; } = string.Empty;
    public string ViolationType { get; set; } = string.Empty;

    // Rule information
    public string RuleId { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    // Details
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;

    // Entity association
    public string EntityId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;

    // Temporal tracking
    public DateTime DetectedAt { get; set; }

    // Remediation guidance (dual format support)
    public string RemediationSteps { get; set; } = string.Empty;
    public List<string> RemediationStepsList { get; set; } = new();

    // Additional context
    public Dictionary<string, object> Context { get; set; } = new();
}
