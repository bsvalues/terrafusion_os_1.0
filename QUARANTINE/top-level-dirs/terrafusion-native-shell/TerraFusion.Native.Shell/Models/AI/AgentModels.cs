using System;
using System.Collections.Generic;

namespace TerraFusion.Native.Shell.Models.AI
{
    /// <summary>
    /// Agent group model for AI orchestration management
    /// </summary>
    public class AgentGroup
    {
        public string GroupId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AgentCount { get; set; }
        public AgentGroupType Type { get; set; }
        public AgentGroupStatus Status { get; set; }
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Configuration { get; set; } = new();
        public List<string> Capabilities { get; set; } = new();
        public double PerformanceScore { get; set; }
        public bool IsQuantumEnhanced { get; set; }

        // Additional orchestration properties
        public string Role { get; set; } = string.Empty;
        public int MaxAgents { get; set; } = 100;
        public bool QuantumOptimizationEnabled { get; set; } = true;
        public double SwarmIntelligenceLevel { get; set; } = 1.0;
        public List<AIAgent> Agents { get; set; } = new();
    }

    /// <summary>
    /// Agent coordination event arguments
    /// </summary>
    public class AgentCoordinationEventArgs : EventArgs
    {
        public string EventType { get; set; } = string.Empty;
        public string GroupId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Data { get; set; } = new();
    }

    /// <summary>
    /// Swarm intelligence update event arguments
    /// </summary>
    public class SwarmIntelligenceUpdateEventArgs : EventArgs
    {
        public string UpdateType { get; set; } = string.Empty;
        public double CoherenceScore { get; set; }
        public double QuantumOptimizationFactor { get; set; }
        public int ActiveAgents { get; set; }
        public SwarmState State { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public Dictionary<string, double> GroupMetrics { get; set; } = new();
    }

    /// <summary>
    /// Agent group types for specialized operations
    /// </summary>
    public enum AgentGroupType
    {
        PropertyManagement,
        TaxCollection,
        DataAnalysis,
        Valuation,
        Compliance,
        Notification,
        SwarmCoordination,
        PerformanceMonitoring,
        QualityAssurance,
        SecurityAudit,
        UserInterface,
        DataIntegration,
        ReportGeneration,
        SystemMonitoring,
        AutomatedTesting
    }

    /// <summary>
    /// Agent group status enumeration
    /// </summary>
    public enum AgentGroupStatus
    {
        Inactive,
        Initializing,
        Active,
        Coordinating,
        Optimizing,
        Transcendent,
        Suspended,
        Error
    }

    /// <summary>
    /// Swarm intelligence state enumeration
    /// </summary>
    public enum SwarmState
    {
        Initializing,
        Active,
        Optimizing,
        Coordinating,
        Transcendent,
        Recovering,
        Suspended
    }

    /// <summary>
    /// Individual AI agent model
    /// </summary>
    public class AIAgent
    {
        public string AgentId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public AgentGroupStatus Status { get; set; } = AgentGroupStatus.Active;
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();
        public double PerformanceScore { get; set; } = 1.0;
        public bool IsQuantumEnhanced { get; set; } = true;
    }
}
