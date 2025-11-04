/**
 * AnalysisResult Entity
 *
 * Stores results from statistical analyses, hypothesis tests, and other
 * PhD-level computations performed by QuantumAnalytics service.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 3
 */

using System;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Statistical analysis result with publication-ready output
/// </summary>
public class AnalysisResult
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Analysis type (t-test, anova, mann-whitney, kruskal-wallis, correlation, etc.)
    /// </summary>
    public string AnalysisType { get; set; } = string.Empty;

    /// <summary>
    /// Owning user ID (from GovernmentUser)
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// County context (for data isolation)
    /// </summary>
    public int CountyId { get; set; }

    /// <summary>
    /// Optional notebook association
    /// </summary>
    public int? NotebookId { get; set; }

    /// <summary>
    /// Input data (JSON serialized)
    /// Structure: { dataset: { group1: [], group2: [] }, hypothesis: {...}, alpha: 0.05 }
    /// </summary>
    public string InputDataJson { get; set; } = "{}";

    /// <summary>
    /// Analysis parameters (JSON serialized)
    /// Structure: { testType, alternative, confidenceLevel, effectSizeType }
    /// </summary>
    public string? ParametersJson { get; set; }

    /// <summary>
    /// Test statistic value
    /// </summary>
    public double TestStatistic { get; set; }

    /// <summary>
    /// P-value
    /// </summary>
    public double PValue { get; set; }

    /// <summary>
    /// Degrees of freedom (if applicable)
    /// </summary>
    public double? DegreesOfFreedom { get; set; }

    /// <summary>
    /// Effect size type (cohens-d, eta-squared, cramers-v, etc.)
    /// </summary>
    public string? EffectSizeType { get; set; }

    /// <summary>
    /// Effect size value
    /// </summary>
    public double? EffectSizeValue { get; set; }

    /// <summary>
    /// Confidence interval lower bound
    /// </summary>
    public double? ConfidenceIntervalLower { get; set; }

    /// <summary>
    /// Confidence interval upper bound
    /// </summary>
    public double? ConfidenceIntervalUpper { get; set; }

    /// <summary>
    /// Statistical conclusion (plain text)
    /// </summary>
    public string? Conclusion { get; set; }

    /// <summary>
    /// LaTeX formatted output for publications
    /// </summary>
    public string? LatexOutput { get; set; }

    /// <summary>
    /// APA 7th edition formatted output
    /// </summary>
    public string? ApaOutput { get; set; }

    /// <summary>
    /// Full result object (JSON serialized)
    /// Complete result for storage and retrieval
    /// </summary>
    public string ResultJson { get; set; } = "{}";

    /// <summary>
    /// Execution time in milliseconds
    /// </summary>
    public int ExecutionTimeMs { get; set; }

    /// <summary>
    /// Is result favorited by user
    /// </summary>
    public bool IsFavorite { get; set; } = false;

    /// <summary>
    /// Is result archived
    /// </summary>
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// Tags for categorization (comma-separated)
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// User-provided notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Navigation: Owning user
    /// </summary>
    public virtual GovernmentUser? User { get; set; }

    /// <summary>
    /// Navigation: County
    /// </summary>
    public virtual County? County { get; set; }

    /// <summary>
    /// Navigation: Associated notebook (optional)
    /// </summary>
    public virtual QuantumNotebook? Notebook { get; set; }

    // ========================================
    // AUDIT FIELDS (Auto-populated by interceptor)
    // ========================================

    /// <summary>
    /// Created timestamp (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Last updated timestamp (UTC)
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Created by user (username or system)
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Last updated by user (username or system)
    /// </summary>
    public string UpdatedBy { get; set; } = string.Empty;
}
