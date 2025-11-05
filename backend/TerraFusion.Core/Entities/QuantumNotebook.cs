/**
 * QuantumNotebook Entity
 *
 * Represents a Jupyter-style notebook for PhD-level data analysis.
 * Stores notebook metadata, cells (code/markdown), and execution history.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 3
 */

using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Jupyter-style notebook for data analysis and scientific computing
/// </summary>
public class QuantumNotebook
{
    /// <summary>
    /// Unique identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Notebook name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Notebook description
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
    /// Notebook cells (JSON serialized)
    /// Structure: [{ id, type, content, output, executionTime, status }]
    /// </summary>
    public string CellsJson { get; set; } = "[]";

    /// <summary>
    /// Notebook metadata (JSON serialized)
    /// Structure: { language, kernelVersion, dependencies, tags }
    /// </summary>
    public string? MetadataJson { get; set; }

    /// <summary>
    /// Programming language (javascript, python, r, julia)
    /// </summary>
    public string Language { get; set; } = "javascript";

    /// <summary>
    /// Notebook visibility (private, shared, public)
    /// </summary>
    public string Visibility { get; set; } = "private";

    /// <summary>
    /// Is notebook favorited by user
    /// </summary>
    public bool IsFavorite { get; set; } = false;

    /// <summary>
    /// Is notebook archived
    /// </summary>
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// Last execution timestamp
    /// </summary>
    public DateTime? LastExecutedAt { get; set; }

    /// <summary>
    /// Execution count (total cells executed)
    /// </summary>
    public int ExecutionCount { get; set; } = 0;

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
