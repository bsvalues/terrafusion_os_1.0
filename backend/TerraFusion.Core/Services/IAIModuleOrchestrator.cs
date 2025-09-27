using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// AI Module Orchestrator Interface
    /// Coordinates the 1,008 AI agents across the TerraFusion ecosystem
    /// </summary>
    public interface IAIModuleOrchestrator
    {
        Task<AIExecutionResult> ExecuteAICommandAsync(string agentType, string command, object parameters);
        Task<List<AIAgent>> GetAvailableAgentsAsync(string agentType);
        Task<AIAgent> AssignAgentAsync(string agentType, string moduleId, string task);
        Task<bool> ReleaseAgentAsync(string agentId);
        Task<AISystemStatus> GetSystemStatusAsync();
    }

    /// <summary>
    /// AI Execution Result
    /// </summary>
    public class AIExecutionResult
    {
        public bool Success { get; set; }
        public string Result { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public long ExecutionTimeMs { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// AI Agent Model
    /// </summary>
    public class AIAgent
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = "available"; // available, busy, offline
        public string AssignedModule { get; set; } = string.Empty;
        public string CurrentTask { get; set; } = string.Empty;
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Capabilities { get; set; } = new();
    }

    /// <summary>
    /// AI System Status
    /// </summary>
    public class AISystemStatus
    {
        public int TotalAgents { get; set; } = 1008;
        public int AvailableAgents { get; set; }
        public int BusyAgents { get; set; }
        public int OfflineAgents { get; set; }
        public Dictionary<string, int> AgentsByType { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public string SystemHealth { get; set; } = "operational";
    }
}
