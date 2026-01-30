/*
 * WorkflowExecution Entity
 *
 * Tracks individual workflow execution runs with status, timing, and results.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 3
 */

using System;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Individual workflow execution instance
/// </summary>
public class WorkflowExecution
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Workflow ID
    /// </summary>
    public int WorkflowId { get; set; }

    /// <summary>
    /// User who triggered execution
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// County context
    /// </summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// Execution status (running, completed, failed, cancelled)
    /// </summary>
    public string Status { get; set; } = "running";

    /// <summary>
    /// Start timestamp
    /// </summary>
    public DateTime StartedAt { get; set; }

    /// <summary>
    /// Completion timestamp
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Total execution duration in milliseconds
    /// </summary>
    public int? DurationMs { get; set; }

    /// <summary>
    /// Total nodes in workflow
    /// </summary>
    public int TotalNodes { get; set; }

    /// <summary>
    /// Nodes executed successfully
    /// </summary>
    public int NodesExecuted { get; set; } = 0;

    /// <summary>
    /// Nodes failed
    /// </summary>
    public int NodesFailed { get; set; } = 0;

    /// <summary>
    /// Execution log (JSON serialized)
    /// Structure: [{ timestamp, nodeId, status, message, output }]
    /// </summary>
    public string? ExecutionLogJson { get; set; }

    /// <summary>
    /// Final output (JSON serialized)
    /// </summary>
    public string? OutputJson { get; set; }

    /// <summary>
    /// Error message (if failed)
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Stack trace (if failed)
    /// </summary>
    public string? ErrorStackTrace { get; set; }

    /// <summary>
    /// Execution context (JSON serialized)
    /// Structure: { environment, variables, triggers }
    /// </summary>
    public string? ContextJson { get; set; }

    /// <summary>
    /// Navigation: Workflow
    /// </summary>
    public virtual Workflow? Workflow { get; set; }

    /// <summary>
    /// Navigation: User
    /// </summary>
    public virtual GovernmentUser? User { get; set; }

    /// <summary>
    /// Navigation: County
    /// </summary>
    public virtual County? County { get; set; }

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
