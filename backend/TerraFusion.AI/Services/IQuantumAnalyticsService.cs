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
    Task<QuantumNotebook> CreateNotebookAsync(int userId, int countyId, string name, string language = "javascript");
    Task<QuantumNotebook?> GetNotebookAsync(int notebookId, int userId, int countyId);
    Task<IEnumerable<QuantumNotebook>> GetUserNotebooksAsync(int userId, int countyId);
    Task<QuantumNotebook> UpdateNotebookAsync(QuantumNotebook notebook, int userId, int countyId);
    Task<bool> DeleteNotebookAsync(int notebookId, int userId, int countyId);
    Task<QuantumNotebook> ExecuteNotebookAsync(int notebookId, int userId, int countyId);

    // Analysis Operations
    Task<AnalysisResult> RunStatisticalAnalysisAsync(
        int userId,
        int countyId,
        string analysisType,
        double[] data1,
        double[]? data2 = null,
        int? notebookId = null);

    Task<AnalysisResult?> GetAnalysisResultAsync(int resultId, int userId, int countyId);
    Task<IEnumerable<AnalysisResult>> GetUserAnalysisResultsAsync(int userId, int countyId);
    Task<IEnumerable<AnalysisResult>> GetSignificantResultsAsync(int userId, int countyId, double pValueThreshold = 0.05);
    Task<object> GetAnalysisStatisticsAsync(int userId, int countyId);

    // Workflow Operations
    Task<Workflow> CreateWorkflowAsync(int userId, int countyId, string name, string category = "data-processing");
    Task<Workflow?> GetWorkflowAsync(int workflowId, int userId, int countyId);
    Task<IEnumerable<Workflow>> GetUserWorkflowsAsync(int userId, int countyId);
    Task<Workflow> CreateWorkflowFromTemplateAsync(int templateId, int userId, int countyId, string name);
    Task<IEnumerable<Workflow>> GetWorkflowTemplatesAsync(string? category = null);

    // Workflow Execution Operations
    Task<WorkflowExecution> StartWorkflowExecutionAsync(int workflowId, int userId, int countyId);
    Task<bool> UpdateExecutionProgressAsync(int executionId, int nodesExecuted, int nodesFailed);
    Task<bool> CompleteWorkflowExecutionAsync(int executionId, string status, string? errorMessage = null);
    Task<IEnumerable<WorkflowExecution>> GetWorkflowExecutionHistoryAsync(int workflowId, int userId, int countyId);
    Task<object> GetWorkflowExecutionStatisticsAsync(int workflowId, int userId, int countyId);
}
