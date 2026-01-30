/*
 * Workflow Entity
 *
 * Represents a visual workflow for AI agent orchestration and data processing.
 * Stores workflow definition (nodes/edges) and execution history.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 3
 */

using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Visual workflow for AI agent orchestration
/// </summary>
public class Workflow
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Workflow name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Workflow description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Owning user ID (from GovernmentUser)
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// County context (for data isolation)
    /// </summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// Workflow category (data-processing, ai-analysis, integration, monitoring)
    /// </summary>
    public string Category { get; set; } = "data-processing";

    /// <summary>
    /// Complexity level (simple, moderate, complex)
    /// </summary>
    public string Complexity { get; set; } = "moderate";

    /// <summary>
    /// Workflow definition (JSON serialized)
    /// Structure: { nodes: [{id, type, position, data}], edges: [{id, source, target}] }
    /// React Flow compatible format
    /// </summary>
    public string DefinitionJson { get; set; } = "{}";

    /// <summary>
    /// Workflow metadata (JSON serialized)
    /// Structure: { version, author, dependencies, estimatedRuntime }
    /// </summary>
    public string? MetadataJson { get; set; }

    /// <summary>
    /// Is workflow template (reusable)
    /// </summary>
    public bool IsTemplate { get; set; } = false;

    /// <summary>
    /// Template source ID (if derived from template)
    /// </summary>
    public int? TemplateId { get; set; }

    /// <summary>
    /// Workflow visibility (private, shared, public)
    /// </summary>
    public string Visibility { get; set; } = "private";

    /// <summary>
    /// Is workflow favorited by user
    /// </summary>
    public bool IsFavorite { get; set; } = false;

    /// <summary>
    /// Is workflow archived
    /// </summary>
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// Total node count
    /// </summary>
    public int NodeCount { get; set; } = 0;

    /// <summary>
    /// Total execution count
    /// </summary>
    public int ExecutionCount { get; set; } = 0;

    /// <summary>
    /// Last execution timestamp
    /// </summary>
    public DateTime? LastExecutedAt { get; set; }

    /// <summary>
    /// Last execution status (completed, failed, running)
    /// </summary>
    public string? LastExecutionStatus { get; set; }

    /// <summary>
    /// Average execution time in seconds
    /// </summary>
    public double? AverageExecutionTime { get; set; }

    /// <summary>
    /// Tags for categorization (comma-separated)
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// Navigation: Owning user
    /// </summary>
    public virtual GovernmentUser? User { get; set; }

    /// <summary>
    /// Navigation: County
    /// </summary>
    public virtual County? County { get; set; }

    /// <summary>
    /// Navigation: Workflow executions
    /// </summary>
    public virtual ICollection<WorkflowExecution> Executions { get; set; } = new List<WorkflowExecution>();

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
