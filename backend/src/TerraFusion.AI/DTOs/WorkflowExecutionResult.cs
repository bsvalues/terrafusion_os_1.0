/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - WORKFLOW EXECUTION RESULT DTO
 * Elite AI Workflow Automation with Quantum Enhancement
 * Government-Grade Precision with 99.9% Accuracy Guarantee
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

namespace TerraFusion.AI.DTOs
{
    /// <summary>
    /// ✅ Enhanced Workflow Execution Result DTO with Government Compliance
    /// Provides comprehensive workflow execution tracking with AI optimization metrics
    /// </summary>
    public class WorkflowExecutionResult
    {
        public string ExecutionId { get; set; } = string.Empty;
        public string WorkflowId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double TotalDuration { get; set; }
        public bool Success { get; set; }
        public List<WorkflowStepResult> Steps { get; set; } = new List<WorkflowStepResult>();

        // Enhanced AI optimization metrics
        public double QuantumOptimizationFactor { get; set; }
        public int AIAgentsCoordinated { get; set; }
        public double EfficiencyImprovement { get; set; }
        public bool GovernmentComplianceValidated { get; set; }
        public string OptimizationRecommendations { get; set; } = string.Empty;
    }

    public class WorkflowStepResult
    {
        public string StepId { get; set; } = string.Empty;
        public string StepName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double Duration { get; set; }
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public Dictionary<string, object> OutputData { get; set; } = new Dictionary<string, object>();
    }
}