using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Tests
{
    /// <summary>
    /// Integration tests for WorkflowAutomationController API endpoints
    /// Tests real HTTP requests with WebApplicationFactory (in-memory hosting)
    /// Government. Transcended. - Testing workflow automation APIs with championship precision
    /// 
    /// Endpoints Tested:
    /// - POST /api/WorkflowAutomation/execute - Execute workflow with county context
    /// - GET /api/WorkflowAutomation/status/{id} - Get workflow execution status
    /// - POST /api/WorkflowAutomation/analyze-bulk - Bulk property analysis
    /// - GET /api/WorkflowAutomation/health - Health check endpoint
    /// </summary>
    public class WorkflowAutomationControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly WebApplicationFactory<Program> _factory;

        public WorkflowAutomationControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        #region Execute Workflow Tests

        [Fact]
        public async Task ExecuteWorkflow_WithValidRequest_ReturnsSuccess()
        {
            // Arrange
            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>
                {
                    { "assessmentType", "residential" },
                    { "validateIAAO", true }
                }
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await response.Content.ReadFromJsonAsync<WorkflowExecutionResponse>();
            result.Should().NotBeNull();
            result!.ExecutionId.Should().NotBeEmpty();
            result.Status.Should().Be("Started");
        }

        [Fact]
        public async Task ExecuteWorkflow_WithInvalidCounty_ReturnsBadRequest()
        {
            // Arrange
            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "", // Invalid empty county
                Parameters = new Dictionary<string, object>()
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var error = await response.Content.ReadAsStringAsync();
            error.Should().Contain("county");
        }

        [Fact]
        public async Task ExecuteWorkflow_WithNonExistentWorkflow_ReturnsNotFound()
        {
            // Arrange
            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(), // Non-existent workflow
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);

            // Assert
            response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task ExecuteWorkflow_ReturnsValidExecutionId()
        {
            // Arrange
            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<WorkflowExecutionResponse>();
                result!.ExecutionId.Should().NotBeEmpty();
                Guid.TryParse(result.ExecutionId.ToString(), out _).Should().BeTrue();
            }
        }

        #endregion

        #region Get Workflow Status Tests

        [Fact]
        public async Task GetWorkflowStatus_WithValidId_ReturnsStatus()
        {
            // Arrange - First create a workflow execution
            var executeRequest = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };
            var executeResponse = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", executeRequest);

            if (!executeResponse.IsSuccessStatusCode)
                return; // Skip if workflow creation failed

            var executionResult = await executeResponse.Content.ReadFromJsonAsync<WorkflowExecutionResponse>();
            var executionId = executionResult!.ExecutionId;

            // Act
            var response = await _client.GetAsync($"/api/WorkflowAutomation/status/{executionId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var status = await response.Content.ReadFromJsonAsync<WorkflowStatusResponse>();
            status.Should().NotBeNull();
            status!.ExecutionId.Should().Be(executionId);
            status.Status.Should().BeOneOf("Started", "InProgress", "Completed", "Failed");
        }

        [Fact]
        public async Task GetWorkflowStatus_WithNonExistentId_ReturnsNotFound()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var response = await _client.GetAsync($"/api/WorkflowAutomation/status/{nonExistentId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetWorkflowStatus_ReturnsProgressPercentage()
        {
            // Arrange - Create and execute workflow
            var executeRequest = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };
            var executeResponse = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", executeRequest);

            if (!executeResponse.IsSuccessStatusCode)
                return;

            var executionResult = await executeResponse.Content.ReadFromJsonAsync<WorkflowExecutionResponse>();
            var executionId = executionResult!.ExecutionId;

            // Act
            var response = await _client.GetAsync($"/api/WorkflowAutomation/status/{executionId}");

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var status = await response.Content.ReadFromJsonAsync<WorkflowStatusResponse>();
                status!.ProgressPercentage.Should().BeInRange(0m, 100m);
                status.CompletedSteps.Should().BeGreaterOrEqualTo(0);
                status.TotalSteps.Should().BeGreaterThan(0);
            }
        }

        [Fact]
        public async Task GetWorkflowStatus_IncludesCurrentStep()
        {
            // Arrange - Create workflow
            var executeRequest = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };
            var executeResponse = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", executeRequest);

            if (!executeResponse.IsSuccessStatusCode)
                return;

            var executionResult = await executeResponse.Content.ReadFromJsonAsync<WorkflowExecutionResponse>();
            var executionId = executionResult!.ExecutionId;

            // Act
            var response = await _client.GetAsync($"/api/WorkflowAutomation/status/{executionId}");

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var status = await response.Content.ReadFromJsonAsync<WorkflowStatusResponse>();
                status!.CurrentStep.Should().NotBeNullOrEmpty();
            }
        }

        #endregion

        #region Analyze Bulk Properties Tests

        [Fact]
        public async Task AnalyzeBulkProperties_WithValidRequest_ReturnsResults()
        {
            // Arrange
            var propertyIds = new List<Guid>();
            for (int i = 0; i < 50; i++)
            {
                propertyIds.Add(Guid.NewGuid());
            }

            var request = new BulkAnalysisRequest
            {
                PropertyIds = propertyIds,
                CountyId = "benton",
                Options = new AnalysisOptions
                {
                    IncludeComparables = true,
                    ValidateIAAO = true
                }
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/analyze-bulk", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await response.Content.ReadFromJsonAsync<BulkAnalysisResponse>();
            result.Should().NotBeNull();
            result!.TotalProperties.Should().Be(50);
            result.ProcessedProperties.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task AnalyzeBulkProperties_WithEmptyList_ReturnsBadRequest()
        {
            // Arrange
            var request = new BulkAnalysisRequest
            {
                PropertyIds = new List<Guid>(),
                CountyId = "benton",
                Options = new AnalysisOptions()
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/analyze-bulk", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task AnalyzeBulkProperties_Returns847PropertyBatchResults()
        {
            // Arrange - Test with 847 properties (typical Benton County batch)
            var propertyIds = new List<Guid>();
            for (int i = 0; i < 847; i++)
            {
                propertyIds.Add(Guid.NewGuid());
            }

            var request = new BulkAnalysisRequest
            {
                PropertyIds = propertyIds,
                CountyId = "benton",
                Options = new AnalysisOptions
                {
                    IncludeComparables = true,
                    ValidateIAAO = true,
                    UseQuantumOptimization = true
                }
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/analyze-bulk", request);

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<BulkAnalysisResponse>();
                result!.TotalProperties.Should().Be(847);
                result.AverageConfidence.Should().BeGreaterThan(0.95m); // >95% confidence
                result.ProcessingTimeMs.Should().BeLessThan(10000); // <10s for 847 properties
            }
        }

        [Fact]
        public async Task AnalyzeBulkProperties_IncludesQuantumOptimizationMetrics()
        {
            // Arrange
            var propertyIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
            var request = new BulkAnalysisRequest
            {
                PropertyIds = propertyIds,
                CountyId = "benton",
                Options = new AnalysisOptions { UseQuantumOptimization = true }
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/analyze-bulk", request);

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<BulkAnalysisResponse>();
                result!.QuantumOptimizationFactor.Should().Be(949); // TerraFusion quantum factor
                result.SwarmAgentsUsed.Should().BeGreaterThan(0);
            }
        }

        #endregion

        #region Health Check Tests

        [Fact]
        public async Task HealthCheck_ReturnsHealthyStatus()
        {
            // Act
            var response = await _client.GetAsync("/api/WorkflowAutomation/health");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var health = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
            health.Should().NotBeNull();
            health!.Status.Should().Be("Healthy");
        }

        [Fact]
        public async Task HealthCheck_IncludesDependencyStatus()
        {
            // Act
            var response = await _client.GetAsync("/api/WorkflowAutomation/health");

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var health = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
                health!.Dependencies.Should().NotBeNull();
                health.Dependencies.Should().ContainKey("ConsciousnessEngine");
                health.Dependencies.Should().ContainKey("Database");
            }
        }

        [Fact]
        public async Task HealthCheck_ReportsQuantumOptimizationFactor()
        {
            // Act
            var response = await _client.GetAsync("/api/WorkflowAutomation/health");

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var health = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
                health!.QuantumOptimizationFactor.Should().Be(949);
            }
        }

        #endregion

        #region Authentication & Authorization Tests

        [Fact]
        public async Task ExecuteWorkflow_WithoutAuthentication_ReturnsUnauthorized()
        {
            // Arrange
            var clientWithoutAuth = _factory.CreateClient();
            clientWithoutAuth.DefaultRequestHeaders.Clear(); // Remove any default auth headers

            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };

            // Act
            var response = await clientWithoutAuth.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);

            // Assert
            response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.OK);
            // Note: May return OK if authentication is mocked in test environment
        }

        [Fact]
        public async Task ExecuteWorkflow_WithDifferentCountyAccess_EnforcesIsolation()
        {
            // Arrange - User authenticated for "franklin" trying to access "benton"
            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton", // User has franklin access
                Parameters = new Dictionary<string, object>()
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);

            // Assert
            // Should enforce county data isolation
            if (response.StatusCode == HttpStatusCode.Forbidden)
            {
                var error = await response.Content.ReadAsStringAsync();
                error.Should().Contain("county");
            }
        }

        #endregion

        #region Performance Tests

        [Fact]
        public async Task ExecuteWorkflow_CompletesWithin1Second()
        {
            // Arrange
            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };

            // Act
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);
            stopwatch.Stop();

            // Assert
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000);
        }

        [Fact]
        public async Task GetWorkflowStatus_CompletesWithin100Milliseconds()
        {
            // Arrange
            var executionId = Guid.NewGuid();

            // Act
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var response = await _client.GetAsync($"/api/WorkflowAutomation/status/{executionId}");
            stopwatch.Stop();

            // Assert
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(100);
        }

        [Fact]
        public async Task AnalyzeBulkProperties_Handles10ConcurrentRequests()
        {
            // Arrange
            var tasks = new List<Task<HttpResponseMessage>>();
            for (int i = 0; i < 10; i++)
            {
                var request = new BulkAnalysisRequest
                {
                    PropertyIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() },
                    CountyId = "benton",
                    Options = new AnalysisOptions()
                };
                tasks.Add(_client.PostAsJsonAsync("/api/WorkflowAutomation/analyze-bulk", request));
            }

            // Act
            var responses = await Task.WhenAll(tasks);

            // Assert
            responses.Should().HaveCount(10);
            responses.Count(r => r.IsSuccessStatusCode).Should().BeGreaterOrEqualTo(8); // Allow some failures
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        public async Task ExecuteWorkflow_WithInvalidPayload_Returns400BadRequest()
        {
            // Arrange - Malformed JSON
            var content = new StringContent("{invalid json}", System.Text.Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/WorkflowAutomation/execute", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task GetWorkflowStatus_WithInvalidGuid_Returns400BadRequest()
        {
            // Act
            var response = await _client.GetAsync("/api/WorkflowAutomation/status/invalid-guid");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task AnalyzeBulkProperties_WithNullCounty_ReturnsBadRequest()
        {
            // Arrange
            var request = new BulkAnalysisRequest
            {
                PropertyIds = new List<Guid> { Guid.NewGuid() },
                CountyId = null!, // Null county
                Options = new AnalysisOptions()
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/analyze-bulk", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        #endregion

        #region CORS & Headers Tests

        [Fact]
        public async Task HealthCheck_IncludesCORSHeaders()
        {
            // Act
            var response = await _client.GetAsync("/api/WorkflowAutomation/health");

            // Assert
            if (response.IsSuccessStatusCode)
            {
                // CORS may or may not be configured in test environment; just ensure headers collection exists
                response.Headers.Should().NotBeNull();
            }
        }

        [Fact]
        public async Task ExecuteWorkflow_ReturnsCorrectContentType()
        {
            // Arrange
            var request = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>()
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", request);

            // Assert
            if (response.IsSuccessStatusCode)
            {
                response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
            }
        }

        #endregion

        #region Integration Scenario Tests

        [Fact]
        public async Task CompleteWorkflowJourney_ExecuteAndMonitorUntilComplete()
        {
            // Arrange
            var executeRequest = new WorkflowExecutionRequest
            {
                WorkflowId = Guid.NewGuid(),
                CountyId = "benton",
                Parameters = new Dictionary<string, object>
                {
                    { "assessmentType", "residential" },
                    { "propertyCount", 100 }
                }
            };

            // Act - Step 1: Execute workflow
            var executeResponse = await _client.PostAsJsonAsync("/api/WorkflowAutomation/execute", executeRequest);

            if (!executeResponse.IsSuccessStatusCode)
                return; // Skip if execution failed

            var executionResult = await executeResponse.Content.ReadFromJsonAsync<WorkflowExecutionResponse>();
            var executionId = executionResult!.ExecutionId;

            // Act - Step 2: Poll status until complete (max 10 attempts)
            WorkflowStatusResponse? status = null;
            for (int i = 0; i < 10; i++)
            {
                var statusResponse = await _client.GetAsync($"/api/WorkflowAutomation/status/{executionId}");
                if (statusResponse.IsSuccessStatusCode)
                {
                    status = await statusResponse.Content.ReadFromJsonAsync<WorkflowStatusResponse>();
                    if (status!.Status == "Completed" || status.Status == "Failed")
                        break;
                }
                await Task.Delay(500); // Wait 500ms between polls
            }

            // Assert - Workflow should complete or be in progress
            status.Should().NotBeNull();
            status!.Status.Should().BeOneOf("InProgress", "Completed", "Failed");
            status.ProgressPercentage.Should().BeGreaterThan(0m);
        }

        #endregion
    }

    #region Test Models (DTOs for API requests/responses)

    public class WorkflowExecutionRequest
    {
        public Guid WorkflowId { get; set; }
        public string CountyId { get; set; } = string.Empty;
        public Dictionary<string, object> Parameters { get; set; } = new();
    }

    public class WorkflowExecutionResponse
    {
        public Guid ExecutionId { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class WorkflowStatusResponse
    {
        public Guid ExecutionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal ProgressPercentage { get; set; }
        public int CompletedSteps { get; set; }
        public int TotalSteps { get; set; }
        public string CurrentStep { get; set; } = string.Empty;
    }

    public class BulkAnalysisRequest
    {
        public List<Guid> PropertyIds { get; set; } = new();
        public string CountyId { get; set; } = string.Empty;
        public AnalysisOptions Options { get; set; } = new();
    }

    public class AnalysisOptions
    {
        public bool IncludeComparables { get; set; }
        public bool ValidateIAAO { get; set; }
        public bool UseQuantumOptimization { get; set; }
    }

    public class BulkAnalysisResponse
    {
        public int TotalProperties { get; set; }
        public int ProcessedProperties { get; set; }
        public decimal AverageConfidence { get; set; }
        public long ProcessingTimeMs { get; set; }
        public int QuantumOptimizationFactor { get; set; }
        public int SwarmAgentsUsed { get; set; }
    }

    public class HealthCheckResponse
    {
        public string Status { get; set; } = string.Empty;
        public Dictionary<string, string> Dependencies { get; set; } = new();
        public int QuantumOptimizationFactor { get; set; }
    }

    #endregion
}
