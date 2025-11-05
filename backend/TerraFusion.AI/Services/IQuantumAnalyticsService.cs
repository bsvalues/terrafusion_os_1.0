/**
 * IQuantumAnalyticsService Interface
 *
 * Service interface for quantum analytics operations including notebooks,
 * statistical analysis, and workflow management.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using TerraFusion.Core.Entities;

namespace TerraFusion.AI.Services;

/// <summary>
/// Service interface for quantum analytics operations
/// </summary>
public interface IQuantumAnalyticsService
{
    // Notebook Operations
    Task<QuantumNotebook> CreateNotebookAsync(Guid userId, Guid countyId, string name, string language = "javascript");
    Task<QuantumNotebook?> GetNotebookAsync(int notebookId, Guid userId, Guid countyId);
    Task<IEnumerable<QuantumNotebook>> GetUserNotebooksAsync(Guid userId, Guid countyId);
    Task<QuantumNotebook> UpdateNotebookAsync(QuantumNotebook notebook, Guid userId, Guid countyId);
    Task<bool> DeleteNotebookAsync(int notebookId, Guid userId, Guid countyId);
    Task<QuantumNotebook> ExecuteNotebookAsync(int notebookId, Guid userId, Guid countyId);

    // Analysis Operations
    Task<AnalysisResult> RunStatisticalAnalysisAsync(
        Guid userId,
        Guid countyId,
        string analysisType,
        double[] data1,
        double[]? data2 = null,
        int? notebookId = null);

    Task<AnalysisResult?> GetAnalysisResultAsync(int resultId, Guid userId, Guid countyId);
    Task<IEnumerable<AnalysisResult>> GetUserAnalysisResultsAsync(Guid userId, Guid countyId);
    Task<IEnumerable<AnalysisResult>> GetSignificantResultsAsync(Guid userId, Guid countyId, double pValueThreshold = 0.05);
    Task<object> GetAnalysisStatisticsAsync(Guid userId, Guid countyId);

    // Workflow Operations
    Task<Workflow> CreateWorkflowAsync(Guid userId, Guid countyId, string name, string category = "data-processing");
    Task<Workflow?> GetWorkflowAsync(int workflowId, Guid userId, Guid countyId);
    Task<IEnumerable<Workflow>> GetUserWorkflowsAsync(Guid userId, Guid countyId);
    Task<Workflow> CreateWorkflowFromTemplateAsync(int templateId, Guid userId, Guid countyId, string name);
    Task<IEnumerable<Workflow>> GetWorkflowTemplatesAsync(string? category = null);

    // Workflow Execution Operations
    Task<WorkflowExecution> StartWorkflowExecutionAsync(int workflowId, Guid userId, Guid countyId);
    Task<bool> UpdateExecutionProgressAsync(int executionId, int nodesExecuted, int nodesFailed);
    Task<bool> CompleteWorkflowExecutionAsync(int executionId, string status, string? errorMessage = null);
    Task<IEnumerable<WorkflowExecution>> GetWorkflowExecutionHistoryAsync(int workflowId, Guid userId, Guid countyId);
    Task<object> GetWorkflowExecutionStatisticsAsync(int workflowId, Guid userId, Guid countyId);
}
