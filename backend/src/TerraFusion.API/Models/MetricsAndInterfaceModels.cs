using System;
using System.Collections.Generic;

namespace TerraFusion.API.Models.Metrics;

// NOTE: This file contains only unique metrics classes
// Interfaces are in TerraFusion.API.Interfaces.IMigrationServices.cs
// TerraFusionHub is in TerraFusion.API.Hubs.HarrisPACSEnhancementHub.cs
// Migration result types are in TerraFusion.API.Interfaces.IMigrationServices.cs
/// <summary>
/// AI Agent Metrics for performance tracking
/// </summary>
public class AIAgentMetrics
{
    public string AgentId { get; set; } = string.Empty;
    public string AgentType { get; set; } = string.Empty;
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int FailedTasks { get; set; }
    public double SuccessRate { get; set; }
    public double AverageExecutionTimeMs { get; set; }
    public double AccuracyScore { get; set; }
    public DateTime LastActivityTime { get; set; }
    public Dictionary<string, int> TaskBreakdown { get; set; } = new();
}

/// <summary>
/// Compliance Metric for FISMA-High tracking
/// </summary>
public class ComplianceMetric
{
    public string MetricId { get; set; } = string.Empty;
    public string MetricName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double CurrentValue { get; set; }
    public double TargetValue { get; set; }
    public bool IsCompliant { get; set; }
    public DateTime MeasuredAt { get; set; }
    public string Severity { get; set; } = "Info";
}

/// <summary>
/// Audit Log Entry for comprehensive logging
/// </summary>
public class AuditLogEntry
{
    public string EntryId { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string IPAddress { get; set; } = string.Empty;
    public Dictionary<string, string> Metadata { get; set; } = new();
    public bool Success { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string EventDescription { get; set; } = string.Empty;
    public string ComplianceLevel { get; set; } = string.Empty;
    public decimal EncryptionStrength { get; set; }
    public string ThreatLevel { get; set; } = string.Empty;
    public decimal SecurityScore { get; set; }
    public decimal ComplianceScore { get; set; }
    public string IncidentId { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string AdditionalData { get; set; } = string.Empty;
}
