/*
 * ═══════════════════════════════════════════════════════════════
 * WORKFLOW REPOSITORY INTERFACE
 * TerraFusion.Consciousness - Workflow Management
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Workflow Repository Interface
    /// Manages workflow definitions and executions
    /// </summary>
    public interface IWorkflowRepository
    {
        Task<WorkflowDefinition?> GetWorkflowAsync(string workflowId);
        Task<List<WorkflowDefinition>> GetAllWorkflowsAsync();
        Task<bool> SaveWorkflowAsync(WorkflowDefinition workflow);
        Task<WorkflowExecution?> GetWorkflowExecutionAsync(string executionId);
        Task<bool> SaveWorkflowExecutionAsync(WorkflowExecution execution);
    }

    public class WorkflowDefinition
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Steps { get; set; } = new List<string>();
    }

    public class WorkflowExecution
    {
        public string ExecutionId { get; set; } = string.Empty;
        public string WorkflowId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
