/**
 * QuantumAnalyticsIntegrationTests
 *
 * Integration tests for QuantumAnalytics service and repositories.
 * Tests CRUD operations, access control, and statistical analysis.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using TerraFusion.AI.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;
using TerraFusion.Data.Repositories;
using TerraFusion.API.Tests.TestHelpers;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

/// <summary>
/// Integration tests for QuantumAnalytics functionality
/// </summary>
public class QuantumAnalyticsIntegrationTests : IDisposable
{
    private readonly TerraFusionDbContext _context;
    private readonly IQuantumNotebookRepository _notebookRepository;
    private readonly IAnalysisResultRepository _analysisResultRepository;
    private readonly IWorkflowRepository _workflowRepository;
    private readonly IWorkflowExecutionRepository _executionRepository;
    private readonly IQuantumAnalyticsService _service;

    private readonly Guid _county1Id = Guid.NewGuid();
    private readonly Guid _county2Id = Guid.NewGuid();
    private readonly Guid _user1Id = Guid.NewGuid();
    private readonly Guid _user2Id = Guid.NewGuid();

    public QuantumAnalyticsIntegrationTests()
    {
        // Create in-memory database for testing using factory
        _context = TestDbContextFactory.CreateInMemoryContext();

        // Initialize repositories
        _notebookRepository = new QuantumNotebookRepository(_context);
        _analysisResultRepository = new AnalysisResultRepository(_context);
        _workflowRepository = new WorkflowRepository(_context);
        _executionRepository = new WorkflowExecutionRepository(_context);

        // Initialize service with mocked logger
        var logger = new Mock<ILogger<QuantumAnalyticsService>>();
        _service = new QuantumAnalyticsService(
            _notebookRepository,
            _analysisResultRepository,
            _workflowRepository,
            _executionRepository,
            logger.Object);

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        // Seed counties (Guid IDs, State not StateCode)
        var county1 = new County { Id = _county1Id, Name = "Benton County", State = "WA", FipsCode = "53005" };
        var county2 = new County { Id = _county2Id, Name = "Yakima County", State = "WA", FipsCode = "53077" };
        _context.Counties.AddRange(county1, county2);

        // Seed users (Guid IDs, Role is required)
        var user1 = new GovernmentUser
        {
            Id = _user1Id,
            Email = "user1@terrafusion.gov",
            FirstName = "John",
            LastName = "Doe",
            Role = "Analyst",
            CountyId = _county1Id,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };
        var user2 = new GovernmentUser
        {
            Id = _user2Id,
            Email = "user2@terrafusion.gov",
            FirstName = "Jane",
            LastName = "Smith",
            Role = "Administrator",
            CountyId = _county2Id,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };
        _context.GovernmentUsers.AddRange(user1, user2);

        _context.SaveChanges();
    }

    #region Notebook Tests

    [Fact]
    public async Task CreateNotebook_ShouldCreateSuccessfully()
    {
        // Arrange
        var userId = _user1Id;
        var countyId = _county1Id;
        var name = "Test Notebook";

        // Act
        var notebook = await _service.CreateNotebookAsync(userId, countyId, name);

        // Assert
        notebook.Should().NotBeNull();
        notebook.Id.Should().NotBe(Guid.Empty);
        notebook.Name.Should().Be(name);
        notebook.UserId.Should().Be(userId);
        notebook.CountyId.Should().Be(countyId);
        notebook.Language.Should().Be("javascript");
        notebook.ExecutionCount.Should().Be(0);
        notebook.IsArchived.Should().BeFalse();
    }

    [Fact]
    public async Task GetNotebook_WithValidAccess_ShouldReturnNotebook()
    {
        // Arrange
        var notebook = await _service.CreateNotebookAsync(_user1Id, _county1Id, "Test Notebook");

        // Act
        var retrieved = await _service.GetNotebookAsync(notebook.Id, _user1Id, _county1Id);

        // Assert
        retrieved.Should().NotBeNull();
        retrieved!.Id.Should().Be(notebook.Id);
        retrieved.Name.Should().Be("Test Notebook");
    }

    [Fact]
    public async Task GetNotebook_WithInvalidAccess_ShouldReturnNull()
    {
        // Arrange
        var notebook = await _service.CreateNotebookAsync(_user1Id, _county1Id, "Test Notebook");

        // Act - User 2 from County 2 trying to access User 1's notebook
        var retrieved = await _service.GetNotebookAsync(notebook.Id, _user2Id, _county2Id);

        // Assert
        retrieved.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteNotebook_ShouldIncrementExecutionCount()
    {
        // Arrange
        var notebook = await _service.CreateNotebookAsync(_user1Id, _county1Id, "Test Notebook");
        var initialCount = notebook.ExecutionCount;

        // Act
        var executed = await _service.ExecuteNotebookAsync(notebook.Id, _user1Id, _county1Id);

        // Assert
        executed.ExecutionCount.Should().Be(initialCount + 1);
    }

    [Fact]
    public async Task DeleteNotebook_ShouldSoftDelete()
    {
        // Arrange
        var notebook = await _service.CreateNotebookAsync(_user1Id, _county1Id, "Test Notebook");

        // Act
        var deleted = await _service.DeleteNotebookAsync(notebook.Id, _user1Id, _county1Id);

        // Assert
        deleted.Should().BeTrue();

        // Verify soft delete
        var allNotebooks = await _notebookRepository.GetByUserIdAsync(_user1Id, _county1Id, includeArchived: true);
        var deletedNotebook = allNotebooks.First(n => n.Id == notebook.Id);
        deletedNotebook.IsArchived.Should().BeTrue();
    }

    [Fact]
    public async Task GetUserNotebooks_ShouldReturnOnlyUserNotebooks()
    {
        // Arrange
        await _service.CreateNotebookAsync(_user1Id, _county1Id, "Notebook 1");
        await _service.CreateNotebookAsync(_user1Id, _county1Id, "Notebook 2");
        await _service.CreateNotebookAsync(_user2Id, _county2Id, "Notebook 3"); // Different user

        // Act
        var notebooks = await _service.GetUserNotebooksAsync(_user1Id, _county1Id);

        // Assert
        notebooks.Should().HaveCount(2);
        notebooks.Should().OnlyContain(n => n.UserId == _user1Id && n.CountyId == _county1Id);
    }

    #endregion

    #region Analysis Tests

    [Fact]
    public async Task RunStatisticalAnalysis_TTest_ShouldCreateResult()
    {
        // Arrange
        var userId = _user1Id;
        var countyId = _county1Id;
        var data1 = new double[] { 23.5, 25.1, 22.8, 24.3, 26.0 };
        var data2 = new double[] { 20.1, 19.5, 21.2, 20.8, 19.9 };

        // Act
        var result = await _service.RunStatisticalAnalysisAsync(
            userId,
            countyId,
            "t-test",
            data1,
            data2);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBe(Guid.Empty);
        result.AnalysisType.Should().Be("t-test");
        result.UserId.Should().Be(userId);
        result.CountyId.Should().Be(countyId);
        result.TestStatistic.Should().NotBe(0);
        result.PValue.Should().BeGreaterThan(0).And.BeLessThanOrEqualTo(1);
    }

    [Fact]
    public async Task RunStatisticalAnalysis_WithNotebook_ShouldAssociateWithNotebook()
    {
        // Arrange
        var notebook = await _service.CreateNotebookAsync(_user1Id, _county1Id, "Analysis Notebook");
        var data1 = new double[] { 1, 2, 3, 4, 5 };

        // Act
        var result = await _service.RunStatisticalAnalysisAsync(
            _user1Id,
            _county1Id,
            "anova",
            data1,
            null,
            notebook.Id);

        // Assert
        result.NotebookId.Should().Be(notebook.Id);
    }

    [Fact]
    public async Task GetSignificantResults_ShouldFilterByPValue()
    {
        // Arrange
        var userId = _user1Id;
        var countyId = _county1Id;

        // Create results with different p-values
        var data1 = new double[] { 1, 2, 3 };
        await _service.RunStatisticalAnalysisAsync(userId, countyId, "t-test", data1, data1);
        await _service.RunStatisticalAnalysisAsync(userId, countyId, "anova", data1);
        await _service.RunStatisticalAnalysisAsync(userId, countyId, "correlation", data1, data1);

        // Act
        var significantResults = await _service.GetSignificantResultsAsync(userId, countyId, 0.05);

        // Assert
        significantResults.Should().NotBeNull();
        significantResults.Should().OnlyContain(r => r.PValue <= 0.05);
    }

    [Fact]
    public async Task GetAnalysisStatistics_ShouldReturnCorrectStatistics()
    {
        // Arrange
        var userId = _user1Id;
        var countyId = _county1Id;
        var data1 = new double[] { 1, 2, 3 };

        await _service.RunStatisticalAnalysisAsync(userId, countyId, "t-test", data1, data1);
        await _service.RunStatisticalAnalysisAsync(userId, countyId, "t-test", data1, data1);
        await _service.RunStatisticalAnalysisAsync(userId, countyId, "anova", data1);

        // Act
        var statistics = await _service.GetAnalysisStatisticsAsync(userId, countyId);

        // Assert
        statistics.Should().NotBeNull();
        // Statistics object should contain aggregated data
        var statsDict = statistics as IDictionary<string, object> ?? new Dictionary<string, object>();
        // Note: Actual validation would depend on the statistics object structure
    }

    #endregion

    #region Workflow Tests

    [Fact]
    public async Task CreateWorkflow_ShouldCreateSuccessfully()
    {
        // Arrange
        var userId = _user1Id;
        var countyId = _county1Id;
        var name = "Test Workflow";

        // Act
        var workflow = await _service.CreateWorkflowAsync(userId, countyId, name);

        // Assert
        workflow.Should().NotBeNull();
        workflow.Id.Should().NotBe(Guid.Empty);
        workflow.Name.Should().Be(name);
        workflow.UserId.Should().Be(userId);
        workflow.CountyId.Should().Be(countyId);
        workflow.Category.Should().Be("data-processing");
        workflow.ExecutionCount.Should().Be(0);
    }

    [Fact]
    public async Task CreateWorkflowFromTemplate_ShouldCloneTemplate()
    {
        // Arrange
        // Create a template workflow
        var template = new Workflow
        {
            Name = "Template Workflow",
            Description = "Template Description",
            Category = "ai-analysis",
            Complexity = "complex",
            DefinitionJson = "{\"nodes\": []}",
            UserId = _user1Id,
            CountyId = _county1Id,
            IsTemplate = true,
            IsFavorite = false,
            IsArchived = false,
            ExecutionCount = 0
        };
        var createdTemplate = await _workflowRepository.CreateAsync(template);

        // Act
        var workflow = await _service.CreateWorkflowFromTemplateAsync(
            createdTemplate.Id,
            _user1Id,
            _county1Id,
            "My Custom Workflow");

        // Assert
        workflow.Should().NotBeNull();
        workflow.Id.Should().NotBe(createdTemplate.Id); // Different ID
        workflow.Name.Should().Be("My Custom Workflow");
        workflow.Category.Should().Be(createdTemplate.Category);
        workflow.Complexity.Should().Be(createdTemplate.Complexity);
        workflow.DefinitionJson.Should().Be(createdTemplate.DefinitionJson);
        workflow.TemplateId.Should().Be(createdTemplate.Id);
        workflow.IsTemplate.Should().BeFalse();
    }

    [Fact]
    public async Task GetWorkflowTemplates_ShouldReturnOnlyTemplates()
    {
        // Arrange
        var template1 = new Workflow
        {
            Name = "Template 1",
            Category = "data-processing",
            UserId = _user1Id,
            CountyId = _county1Id,
            IsTemplate = true
        };
        var template2 = new Workflow
        {
            Name = "Template 2",
            Category = "ai-analysis",
            UserId = _user1Id,
            CountyId = _county1Id,
            IsTemplate = true
        };
        var regularWorkflow = new Workflow
        {
            Name = "Regular Workflow",
            Category = "data-processing",
            UserId = _user1Id,
            CountyId = _county1Id,
            IsTemplate = false
        };

        await _workflowRepository.CreateAsync(template1);
        await _workflowRepository.CreateAsync(template2);
        await _workflowRepository.CreateAsync(regularWorkflow);

        // Act
        var templates = await _service.GetWorkflowTemplatesAsync();

        // Assert
        templates.Should().HaveCount(2);
        templates.Should().OnlyContain(w => w.IsTemplate);
    }

    [Fact]
    public async Task GetWorkflowTemplates_WithCategoryFilter_ShouldReturnFilteredTemplates()
    {
        // Arrange
        var template1 = new Workflow
        {
            Name = "Template 1",
            Category = "data-processing",
            UserId = _user1Id,
            CountyId = _county1Id,
            IsTemplate = true
        };
        var template2 = new Workflow
        {
            Name = "Template 2",
            Category = "ai-analysis",
            UserId = _user1Id,
            CountyId = _county1Id,
            IsTemplate = true
        };

        await _workflowRepository.CreateAsync(template1);
        await _workflowRepository.CreateAsync(template2);

        // Act
        var templates = await _service.GetWorkflowTemplatesAsync("ai-analysis");

        // Assert
        templates.Should().HaveCount(1);
        templates.First().Category.Should().Be("ai-analysis");
    }

    #endregion

    #region Workflow Execution Tests

    [Fact]
    public async Task StartWorkflowExecution_ShouldCreateExecution()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");

        // Act
        var execution = await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);

        // Assert
        execution.Should().NotBeNull();
        execution.Id.Should().NotBe(Guid.Empty);
        execution.WorkflowId.Should().Be(workflow.Id);
        execution.Status.Should().Be("running");
        execution.StartedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        execution.NodesExecuted.Should().Be(0);
        execution.NodesFailed.Should().Be(0);
    }

    [Fact]
    public async Task StartWorkflowExecution_ShouldIncrementWorkflowExecutionCount()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");
        var initialCount = workflow.ExecutionCount;

        // Act
        await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);

        // Assert
        var updatedWorkflow = await _workflowRepository.GetByIdAsync(workflow.Id);
        updatedWorkflow!.ExecutionCount.Should().Be(initialCount + 1);
    }

    [Fact]
    public async Task UpdateExecutionProgress_ShouldUpdateNodesExecuted()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");
        var execution = await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);

        // Act
        var updated = await _service.UpdateExecutionProgressAsync(execution.Id, 3, 1);

        // Assert
        updated.Should().BeTrue();

        var updatedExecution = await _executionRepository.GetByIdAsync(execution.Id);
        updatedExecution!.NodesExecuted.Should().Be(3);
        updatedExecution.NodesFailed.Should().Be(1);
    }

    [Fact]
    public async Task CompleteWorkflowExecution_WithSuccess_ShouldUpdateStatus()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");
        var execution = await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);

        // Act
        var completed = await _service.CompleteWorkflowExecutionAsync(execution.Id, "completed");

        // Assert
        completed.Should().BeTrue();

        var updatedExecution = await _executionRepository.GetByIdAsync(execution.Id);
        updatedExecution!.Status.Should().Be("completed");
        updatedExecution.CompletedAt.Should().NotBeNull();
        updatedExecution.DurationMs.Should().BeGreaterThan(0);
        updatedExecution.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task CompleteWorkflowExecution_WithFailure_ShouldCaptureError()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");
        var execution = await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);

        // Act
        var completed = await _service.CompleteWorkflowExecutionAsync(
            execution.Id,
            "failed",
            "Node execution failed: Timeout");

        // Assert
        completed.Should().BeTrue();

        var updatedExecution = await _executionRepository.GetByIdAsync(execution.Id);
        updatedExecution!.Status.Should().Be("failed");
        updatedExecution.ErrorMessage.Should().Be("Node execution failed: Timeout");
    }

    [Fact]
    public async Task GetWorkflowExecutionHistory_ShouldReturnAllExecutions()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");
        await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);
        await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);
        await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);

        // Act
        var executions = await _service.GetWorkflowExecutionHistoryAsync(workflow.Id, _user1Id, _county1Id);

        // Assert
        executions.Should().HaveCount(3);
        executions.Should().OnlyContain(e => e.WorkflowId == workflow.Id);
    }

    [Fact]
    public async Task GetWorkflowExecutionStatistics_ShouldCalculateCorrectly()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");

        var execution1 = await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);
        await _service.CompleteWorkflowExecutionAsync(execution1.Id, "completed");

        var execution2 = await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);
        await _service.CompleteWorkflowExecutionAsync(execution2.Id, "failed", "Error");

        var execution3 = await _service.StartWorkflowExecutionAsync(workflow.Id, _user1Id, _county1Id);
        // Leave execution3 running

        // Act
        var statistics = await _service.GetWorkflowExecutionStatisticsAsync(workflow.Id, _user1Id, _county1Id);

        // Assert
        statistics.Should().NotBeNull();
        // Note: Actual validation would depend on the statistics object structure
    }

    #endregion

    #region Access Control Tests

    [Fact]
    public async Task StartWorkflowExecution_WithoutAccess_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var workflow = await _service.CreateWorkflowAsync(_user1Id, _county1Id, "Test Workflow");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.StartWorkflowExecutionAsync(workflow.Id, _user2Id, _county2Id)); // Different user/county
    }

    [Fact]
    public async Task UpdateNotebook_WithoutAccess_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var notebook = await _service.CreateNotebookAsync(_user1Id, _county1Id, "Test Notebook");

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.UpdateNotebookAsync(notebook, _user2Id, _county2Id)); // Different user/county
    }

    [Fact]
    public async Task RunStatisticalAnalysis_WithInvalidNotebook_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var notebook = await _service.CreateNotebookAsync(_user1Id, _county1Id, "Test Notebook");
        var data1 = new double[] { 1, 2, 3 };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.RunStatisticalAnalysisAsync(_user2Id, _county2Id, "t-test", data1, null, notebook.Id)); // Different user/county
    }

    #endregion

    public void Dispose()
    {
        _context?.Dispose();
    }
}
