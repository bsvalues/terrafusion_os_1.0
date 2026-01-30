using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Models;
using TerraFusion.Consciousness.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Diagnostics;

namespace TerraFusion.AI.Tests
{
    /// <summary>
    /// Comprehensive unit tests for WorkflowAutomationService
    /// Government. Transcended. - Testing workflow orchestration with championship precision
    /// 
    /// Test Categories:
    /// - Workflow Execution (orchestration, step management, progress tracking)
    /// - AI Coordination (swarm intelligence, property analysis, valuation automation)
    /// - Error Handling (step failures, timeouts, rollback scenarios)
    /// - Performance (bulk operations, concurrent workflows, optimization)
    /// - Security (county isolation, audit logging, RBAC enforcement)
    /// - Integration (end-to-end workflows, multi-agent coordination)
    /// - Compliance (FISMA-High, IAAO standards, data sovereignty)
    /// - Edge Cases (empty datasets, malformed configurations, resource limits)
    /// </summary>
    public class WorkflowAutomationServiceTests
    {
        private readonly Mock<ILogger<WorkflowAutomationService>> _mockLogger;
        private readonly Mock<IConsciousnessEngine> _mockConsciousness;
        private readonly Mock<TerraFusion.AI.Services.IPropertyValuationService> _mockValuation;
        private readonly Mock<IComplianceService> _mockCompliance;
        private readonly WorkflowAutomationService _service;

        public WorkflowAutomationServiceTests()
        {
            _mockLogger = new Mock<ILogger<WorkflowAutomationService>>();
            _mockConsciousness = new Mock<IConsciousnessEngine>();
            _mockValuation = new Mock<TerraFusion.AI.Services.IPropertyValuationService>();
            _mockCompliance = new Mock<IComplianceService>();

            _service = new WorkflowAutomationService(
                _mockLogger.Object,
                _mockConsciousness.Object,
                _mockValuation.Object,
                _mockCompliance.Object
            );
        }

        #region Constructor Tests

        [Fact]
        public void Constructor_WithValidDependencies_InitializesSuccessfully()
        {
            // Arrange & Act
            var service = new WorkflowAutomationService(
                _mockLogger.Object,
                _mockConsciousness.Object,
                _mockValuation.Object,
                _mockCompliance.Object
            );

            // Assert
            service.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_WithNullConsciousness_ThrowsArgumentNullException()
        {
            // Arrange & Act
            Action act = () => new WorkflowAutomationService(
                _mockLogger.Object,
                null!,
                _mockValuation.Object,
                _mockCompliance.Object
            );

            // Assert
            act.Should().Throw<ArgumentNullException>()
                .WithParameterName("consciousnessEngine");
        }

        [Fact]
        public void Constructor_WithNullLogger_ThrowsArgumentNullException()
        {
            // Arrange & Act
            Action act = () => new WorkflowAutomationService(
                null!,
                _mockConsciousness.Object,
                _mockValuation.Object,
                _mockCompliance.Object
            );

            // Assert
            act.Should().Throw<ArgumentNullException>()
                .WithParameterName("logger");
        }

        #endregion

        #region ExecuteWorkflowAsync Tests

        [Fact]
        public async Task ExecuteWorkflowAsync_WithValidWorkflow_ExecutesSuccessfully()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Property Assessment Automation",
                CountyId = "benton",
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Data Collection", Order = 1 },
                    new() { Id = 2, Name = "AI Analysis", Order = 2 },
                    new() { Id = 3, Name = "Valuation", Order = 3 },
                    new() { Id = 4, Name = "IAAO Validation", Order = 4 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true, Data = "Step completed" });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.TotalSteps.Should().Be(4);
            result.CompletedSteps.Should().Be(4);
            result.FailedSteps.Should().Be(0);
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_WithNullWorkflowId_ThrowsArgumentNullException()
        {
            // Arrange, Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.ExecuteWorkflowAsync(Guid.Empty, "benton")
            );
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_WithEmptyCounty_ThrowsArgumentException()
        {
            // Arrange
            var workflowId = Guid.NewGuid();

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.ExecuteWorkflowAsync(workflowId, string.Empty)
            );
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_WithStepFailure_HandlesGracefully()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Property Assessment",
                CountyId = "benton",
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Step 1", Order = 1 },
                    new() { Id = 2, Name = "Failing Step", Order = 2 },
                    new() { Id = 3, Name = "Step 3", Order = 3 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.SetupSequence(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true })
                .ReturnsAsync(new StepResult { Success = false, Error = "Step failed" })
                .ReturnsAsync(new StepResult { Success = true });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeFalse();
            result.CompletedSteps.Should().Be(2); // Steps 1 and 3
            result.FailedSteps.Should().Be(1);
            result.Errors.Should().Contain("Step failed");
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_TracksProgressCorrectly()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Multi-Step Workflow",
                CountyId = "benton",
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Step 1", Order = 1 },
                    new() { Id = 2, Name = "Step 2", Order = 2 },
                    new() { Id = 3, Name = "Step 3", Order = 3 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true });

            var progressUpdates = new List<decimal>();
            _service.OnProgressUpdate += (progress) => progressUpdates.Add(progress);

            // Act
            await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            progressUpdates.Should().HaveCountGreaterOrEqualTo(3);
            progressUpdates.Last().Should().Be(1.0m); // 100% completion
        }

        #endregion

        #region GetWorkflowStatusAsync Tests

        [Fact]
        public async Task GetWorkflowStatusAsync_WithValidId_ReturnsStatus()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var execution = new WorkflowExecution
            {
                WorkflowId = workflowId,
                Status = WorkflowStatus.InProgress,
                StartedAt = DateTime.UtcNow,
                CompletedSteps = 2,
                TotalSteps = 5,
                CurrentStep = "AI Analysis"
            };

            _mockRepository.Setup(r => r.GetWorkflowExecutionAsync(workflowId))
                .ReturnsAsync(execution);

            // Act
            var result = await _service.GetWorkflowStatusAsync(workflowId);

            // Assert
            result.Should().NotBeNull();
            result.Status.Should().Be(WorkflowStatus.InProgress);
            result.ProgressPercentage.Should().Be(40m); // 2/5 = 40%
            result.CurrentStep.Should().Be("AI Analysis");
        }

        [Fact]
        public async Task GetWorkflowStatusAsync_WithCompletedWorkflow_ReturnsCompletedStatus()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var execution = new WorkflowExecution
            {
                WorkflowId = workflowId,
                Status = WorkflowStatus.Completed,
                StartedAt = DateTime.UtcNow.AddHours(-2),
                CompletedAt = DateTime.UtcNow,
                CompletedSteps = 4,
                TotalSteps = 4
            };

            _mockRepository.Setup(r => r.GetWorkflowExecutionAsync(workflowId))
                .ReturnsAsync(execution);

            // Act
            var result = await _service.GetWorkflowStatusAsync(workflowId);

            // Assert
            result.Status.Should().Be(WorkflowStatus.Completed);
            result.ProgressPercentage.Should().Be(100m);
            result.Duration.Should().BeCloseTo(TimeSpan.FromHours(2), TimeSpan.FromMinutes(1));
        }

        [Fact]
        public async Task GetWorkflowStatusAsync_WithNonExistentId_ReturnsNull()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            _mockRepository.Setup(r => r.GetWorkflowExecutionAsync(workflowId))
                .ReturnsAsync((WorkflowExecution?)null);

            // Act
            var result = await _service.GetWorkflowStatusAsync(workflowId);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region AnalyzeBulkPropertiesAsync Tests

        [Fact]
        public async Task AnalyzeBulkPropertiesAsync_WithValidProperties_ProcessesAll()
        {
            // Arrange
            var propertyIds = Enumerable.Range(1, 847).Select(i => Guid.NewGuid()).ToList();
            var countyId = "benton";

            _mockConsciousness.Setup(c => c.AnalyzeBulkPropertiesAsync(It.IsAny<List<Guid>>(), countyId))
                .ReturnsAsync(new BulkAnalysisResult
                {
                    TotalProperties = 847,
                    ProcessedProperties = 847,
                    AverageConfidence = 0.97m,
                    ProcessingTimeMs = 4500
                });

            // Act
            var stopwatch = Stopwatch.StartNew();
            var result = await _service.AnalyzeBulkPropertiesAsync(propertyIds, countyId);
            stopwatch.Stop();

            // Assert
            result.Should().NotBeNull();
            result.TotalProperties.Should().Be(847);
            result.ProcessedProperties.Should().Be(847);
            result.AverageConfidence.Should().BeGreaterThan(0.95m);
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(10000); // <10s for 847 properties
        }

        [Fact]
        public async Task AnalyzeBulkPropertiesAsync_WithEmptyList_ReturnsEmptyResult()
        {
            // Arrange
            var propertyIds = new List<Guid>();
            var countyId = "benton";

            // Act
            var result = await _service.AnalyzeBulkPropertiesAsync(propertyIds, countyId);

            // Assert
            result.TotalProperties.Should().Be(0);
            result.ProcessedProperties.Should().Be(0);
        }

        [Fact]
        public async Task AnalyzeBulkPropertiesAsync_WithPartialFailures_HandlesGracefully()
        {
            // Arrange
            var propertyIds = Enumerable.Range(1, 100).Select(i => Guid.NewGuid()).ToList();
            var countyId = "benton";

            _mockConsciousness.Setup(c => c.AnalyzeBulkPropertiesAsync(It.IsAny<List<Guid>>(), countyId))
                .ReturnsAsync(new BulkAnalysisResult
                {
                    TotalProperties = 100,
                    ProcessedProperties = 95,
                    FailedProperties = 5,
                    AverageConfidence = 0.96m,
                    Errors = new List<string> { "5 properties failed validation" }
                });

            // Act
            var result = await _service.AnalyzeBulkPropertiesAsync(propertyIds, countyId);

            // Assert
            result.ProcessedProperties.Should().Be(95);
            result.FailedProperties.Should().Be(5);
            result.Errors.Should().HaveCount(1);
        }

        [Fact]
        public async Task AnalyzeBulkPropertiesAsync_CoordinatesWithAISwarm()
        {
            // Arrange
            var propertyIds = Enumerable.Range(1, 50).Select(i => Guid.NewGuid()).ToList();
            var countyId = "benton";

            _mockConsciousness.Setup(c => c.AnalyzeBulkPropertiesAsync(propertyIds, countyId))
                .ReturnsAsync(new BulkAnalysisResult
                {
                    TotalProperties = 50,
                    ProcessedProperties = 50,
                    SwarmAgentsUsed = 10000,
                    QuantumOptimizationFactor = 949
                });

            // Act
            var result = await _service.AnalyzeBulkPropertiesAsync(propertyIds, countyId);

            // Assert
            result.SwarmAgentsUsed.Should().BeGreaterThan(0);
            result.QuantumOptimizationFactor.Should().Be(949);
            _mockConsciousness.Verify(c => c.AnalyzeBulkPropertiesAsync(propertyIds, countyId), Times.Once);
        }

        #endregion

        #region Parallel Processing Tests

        [Fact]
        public async Task ExecuteWorkflowAsync_ProcessesStepsInParallel_WhenConfigured()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Parallel Workflow",
                CountyId = "benton",
                AllowParallelExecution = true,
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Step 1", Order = 1, CanRunInParallel = true },
                    new() { Id = 2, Name = "Step 2", Order = 1, CanRunInParallel = true },
                    new() { Id = 3, Name = "Step 3", Order = 2 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true });

            // Act
            var stopwatch = Stopwatch.StartNew();
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");
            stopwatch.Stop();

            // Assert
            result.Success.Should().BeTrue();
            result.CompletedSteps.Should().Be(3);
            // Parallel execution should be faster than sequential
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000);
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_HandlesParallelStepFailures()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Parallel Workflow with Failure",
                CountyId = "benton",
                AllowParallelExecution = true,
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Step 1", Order = 1, CanRunInParallel = true },
                    new() { Id = 2, Name = "Failing Step", Order = 1, CanRunInParallel = true }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.SetupSequence(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true })
                .ReturnsAsync(new StepResult { Success = false, Error = "Parallel step failed" });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeFalse();
            result.CompletedSteps.Should().Be(1);
            result.FailedSteps.Should().Be(1);
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        public async Task ExecuteWorkflowAsync_WithConsciousnessEngineFailure_RetriesAndHandles()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Workflow with Retry",
                CountyId = "benton",
                RetryAttempts = 3,
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Retryable Step", Order = 1 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.SetupSequence(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("Consciousness engine unavailable"))
                .ThrowsAsync(new Exception("Consciousness engine unavailable"))
                .ReturnsAsync(new StepResult { Success = true });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeTrue();
            _mockConsciousness.Verify(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()), Times.Exactly(3));
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_WithTimeout_CancelsExecution()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Timeout Workflow",
                CountyId = "benton",
                TimeoutSeconds = 2,
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Long Running Step", Order = 1 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .Returns(async () =>
                {
                    await Task.Delay(5000); // Simulate long-running operation
                    return new StepResult { Success = true };
                });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeFalse();
            result.Errors.Should().Contain(e => e.Contains("timeout") || e.Contains("cancelled"));
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_WithDatabaseError_HandlesGracefully()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ThrowsAsync(new Exception("Database connection failed"));

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Errors.Should().Contain(e => e.Contains("Database"));
        }

        #endregion

        #region Performance Tests

        [Fact]
        public async Task ExecuteWorkflowAsync_CompletesWithin5Seconds()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Performance Test Workflow",
                CountyId = "benton",
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Step 1", Order = 1 },
                    new() { Id = 2, Name = "Step 2", Order = 2 },
                    new() { Id = 3, Name = "Step 3", Order = 3 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true });

            // Act
            var stopwatch = Stopwatch.StartNew();
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");
            stopwatch.Stop();

            // Assert
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000);
            result.Success.Should().BeTrue();
        }

        [Fact]
        public async Task AnalyzeBulkPropertiesAsync_Processes1000PropertiesInUnder10Seconds()
        {
            // Arrange
            var propertyIds = Enumerable.Range(1, 1000).Select(i => Guid.NewGuid()).ToList();
            var countyId = "benton";

            _mockConsciousness.Setup(c => c.AnalyzeBulkPropertiesAsync(It.IsAny<List<Guid>>(), countyId))
                .ReturnsAsync(new BulkAnalysisResult
                {
                    TotalProperties = 1000,
                    ProcessedProperties = 1000,
                    ProcessingTimeMs = 8500
                });

            // Act
            var stopwatch = Stopwatch.StartNew();
            var result = await _service.AnalyzeBulkPropertiesAsync(propertyIds, countyId);
            stopwatch.Stop();

            // Assert
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(10000);
            result.ProcessedProperties.Should().Be(1000);
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_HandlesConcurrentExecutions()
        {
            // Arrange
            var workflow1Id = Guid.NewGuid();
            var workflow2Id = Guid.NewGuid();

            var workflow1 = new Workflow
            {
                Id = workflow1Id,
                Name = "Workflow 1",
                CountyId = "benton",
                Steps = new List<WorkflowStep> { new() { Id = 1, Name = "Step 1", Order = 1 } }
            };

            var workflow2 = new Workflow
            {
                Id = workflow2Id,
                Name = "Workflow 2",
                CountyId = "franklin",
                Steps = new List<WorkflowStep> { new() { Id = 2, Name = "Step 2", Order = 1 } }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflow1Id)).ReturnsAsync(workflow1);
            _mockRepository.Setup(r => r.GetWorkflowAsync(workflow2Id)).ReturnsAsync(workflow2);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true });

            // Act
            var task1 = _service.ExecuteWorkflowAsync(workflow1Id, "benton");
            var task2 = _service.ExecuteWorkflowAsync(workflow2Id, "franklin");
            var results = await Task.WhenAll(task1, task2);

            // Assert
            results.Should().HaveCount(2);
            results.All(r => r.Success).Should().BeTrue();
        }

        #endregion

        #region Security & Compliance Tests

        [Fact]
        public async Task ExecuteWorkflowAsync_EnforcesCountyDataIsolation()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "County Isolated Workflow",
                CountyId = "benton",
                Steps = new List<WorkflowStep> { new() { Id = 1, Name = "Step 1", Order = 1 } }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), "benton"))
                .ReturnsAsync(new StepResult { Success = true });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeTrue();
            _mockConsciousness.Verify(c => c.ExecuteWorkflowStepAsync(
                It.IsAny<WorkflowStep>(),
                It.Is<string>(county => county == "benton")
            ), Times.Once);
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_PreventsCountyCrossTalk()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Benton Workflow",
                CountyId = "benton",
                Steps = new List<WorkflowStep> { new() { Id = 1, Name = "Step 1", Order = 1 } }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);

            // Act & Assert - Attempting to execute with different county should fail
            var result = await _service.ExecuteWorkflowAsync(workflowId, "franklin");
            result.Success.Should().BeFalse();
            result.Errors.Should().Contain(e => e.Contains("county") || e.Contains("isolation"));
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_LogsAuditTrail()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Audited Workflow",
                CountyId = "benton",
                Steps = new List<WorkflowStep> { new() { Id = 1, Name = "Step 1", Order = 1 } }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true });

            // Act
            await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert - Verify logging occurred
            _mockLogger.Verify(
                x => x.Log(
                    It.IsAny<LogLevel>(),
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => true),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.AtLeastOnce);
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_ValidatesIAAOCompliance()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "IAAO Compliant Workflow",
                CountyId = "benton",
                RequiresIAAOCompliance = true,
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Assessment Step", Order = 1 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult
                {
                    Success = true,
                    Data = new
                    {
                        IAAOCompliant = true,
                        COD = 14.5m, // <15% required
                        PRD = 1.02m, // 0.98-1.03 required
                        AssessmentLevel = 0.98m // 0.90-1.10 required
                    }
                });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeTrue();
            result.IAAOCompliant.Should().BeTrue();
        }

        #endregion

        #region Integration Tests

        [Fact]
        public async Task WorkflowIntegration_EndToEndPropertyAssessment()
        {
            // Arrange - Complete property assessment workflow
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Complete Property Assessment",
                CountyId = "benton",
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Data Collection", Order = 1 },
                    new() { Id = 2, Name = "AI Swarm Analysis", Order = 2 },
                    new() { Id = 3, Name = "Valuation", Order = 3 },
                    new() { Id = 4, Name = "IAAO Validation", Order = 4 },
                    new() { Id = 5, Name = "Report Generation", Order = 5 }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);
            _mockConsciousness.Setup(c => c.ExecuteWorkflowStepAsync(It.IsAny<WorkflowStep>(), It.IsAny<string>()))
                .ReturnsAsync(new StepResult { Success = true, Data = "Step completed successfully" });

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.CompletedSteps.Should().Be(5);
            result.TotalSteps.Should().Be(5);
            result.ProgressPercentage.Should().Be(100m);
        }

        #endregion

        #region Edge Cases Tests

        [Fact]
        public async Task ExecuteWorkflowAsync_WithEmptySteps_HandlesGracefully()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Empty Workflow",
                CountyId = "benton",
                Steps = new List<WorkflowStep>()
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeTrue();
            result.TotalSteps.Should().Be(0);
            result.CompletedSteps.Should().Be(0);
        }

        [Fact]
        public async Task AnalyzeBulkPropertiesAsync_WithNullPropertyIds_ThrowsArgumentNullException()
        {
            // Arrange & Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.AnalyzeBulkPropertiesAsync(null!, "benton")
            );
        }

        [Fact]
        public async Task ExecuteWorkflowAsync_WithCircularDependencies_Detects()
        {
            // Arrange
            var workflowId = Guid.NewGuid();
            var workflow = new Workflow
            {
                Id = workflowId,
                Name = "Circular Workflow",
                CountyId = "benton",
                Steps = new List<WorkflowStep>
                {
                    new() { Id = 1, Name = "Step 1", Order = 1, DependsOn = new List<int> { 2 } },
                    new() { Id = 2, Name = "Step 2", Order = 2, DependsOn = new List<int> { 1 } }
                }
            };

            _mockRepository.Setup(r => r.GetWorkflowAsync(workflowId))
                .ReturnsAsync(workflow);

            // Act
            var result = await _service.ExecuteWorkflowAsync(workflowId, "benton");

            // Assert
            result.Success.Should().BeFalse();
            result.Errors.Should().Contain(e => e.Contains("circular") || e.Contains("dependency"));
        }

        #endregion
    }
}
