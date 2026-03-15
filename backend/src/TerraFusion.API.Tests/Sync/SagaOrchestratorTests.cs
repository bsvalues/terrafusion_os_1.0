// TFR-077: xUnit tests for SagaOrchestrator
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using Xunit;

namespace TerraFusion.API.Tests.Sync
{
    /// <summary>
    /// Represents a single step in a saga.
    /// </summary>
    public class SagaStep
    {
        /// <summary>Step name.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Forward action.</summary>
        public Func<CancellationToken, Task<bool>>? Execute { get; set; }

        /// <summary>Compensation (rollback) action.</summary>
        public Func<CancellationToken, Task>? Compensate { get; set; }
    }

    /// <summary>
    /// Result of a saga orchestration.
    /// </summary>
    public class SagaResult
    {
        /// <summary>Whether the entire saga completed successfully.</summary>
        public bool Success { get; set; }

        /// <summary>Steps that completed successfully.</summary>
        public List<string> CompletedSteps { get; set; } = new();

        /// <summary>Step that failed (if any).</summary>
        public string? FailedStep { get; set; }

        /// <summary>Steps that were compensated.</summary>
        public List<string> CompensatedSteps { get; set; } = new();

        /// <summary>Error message from the failed step.</summary>
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Interface for the saga orchestrator.
    /// </summary>
    public interface ISagaOrchestrator
    {
        /// <summary>
        /// Executes a saga consisting of ordered steps.
        /// On failure, compensates completed steps in reverse order.
        /// </summary>
        Task<SagaResult> ExecuteAsync(IList<SagaStep> steps, CancellationToken ct = default);
    }

    /// <summary>
    /// Tests for SagaOrchestrator: happy path, failure with compensation,
    /// and partial failure rollback.
    /// </summary>
    public class SagaOrchestratorTests
    {
        /// <summary>
        /// Happy path: all steps complete successfully, no compensation needed.
        /// </summary>
        [Fact]
        public async Task HappyPath_Completes_All_Steps()
        {
            var completedSteps = new List<string>();

            var steps = new List<SagaStep>
            {
                new SagaStep
                {
                    Name = "ValidateSchema",
                    Execute = _ => { completedSteps.Add("ValidateSchema"); return Task.FromResult(true); },
                    Compensate = _ => Task.CompletedTask,
                },
                new SagaStep
                {
                    Name = "FetchData",
                    Execute = _ => { completedSteps.Add("FetchData"); return Task.FromResult(true); },
                    Compensate = _ => Task.CompletedTask,
                },
                new SagaStep
                {
                    Name = "TransformData",
                    Execute = _ => { completedSteps.Add("TransformData"); return Task.FromResult(true); },
                    Compensate = _ => Task.CompletedTask,
                },
                new SagaStep
                {
                    Name = "LoadData",
                    Execute = _ => { completedSteps.Add("LoadData"); return Task.FromResult(true); },
                    Compensate = _ => Task.CompletedTask,
                },
            };

            var mockOrchestrator = new Mock<ISagaOrchestrator>();
            mockOrchestrator.Setup(o => o.ExecuteAsync(It.IsAny<IList<SagaStep>>(), It.IsAny<CancellationToken>()))
                .Returns(async (IList<SagaStep> s, CancellationToken ct) =>
                {
                    var result = new SagaResult();
                    foreach (var step in s)
                    {
                        var ok = await step.Execute!(ct);
                        if (ok) result.CompletedSteps.Add(step.Name);
                    }
                    result.Success = true;
                    return result;
                });

            var sagaResult = await mockOrchestrator.Object.ExecuteAsync(steps);

            Assert.True(sagaResult.Success);
            Assert.Equal(4, sagaResult.CompletedSteps.Count);
            Assert.Empty(sagaResult.CompensatedSteps);
            Assert.Null(sagaResult.FailedStep);
        }

        /// <summary>
        /// When a step fails, compensation should trigger for all completed steps.
        /// </summary>
        [Fact]
        public async Task Failure_Triggers_Compensation()
        {
            var compensated = new List<string>();

            var steps = new List<SagaStep>
            {
                new SagaStep
                {
                    Name = "ValidateSchema",
                    Execute = _ => Task.FromResult(true),
                    Compensate = _ => { compensated.Add("ValidateSchema"); return Task.CompletedTask; },
                },
                new SagaStep
                {
                    Name = "FetchData",
                    Execute = _ => Task.FromResult(true),
                    Compensate = _ => { compensated.Add("FetchData"); return Task.CompletedTask; },
                },
                new SagaStep
                {
                    Name = "TransformData",
                    Execute = _ => Task.FromResult(false), // This step fails
                    Compensate = _ => { compensated.Add("TransformData"); return Task.CompletedTask; },
                },
                new SagaStep
                {
                    Name = "LoadData",
                    Execute = _ => Task.FromResult(true),
                    Compensate = _ => { compensated.Add("LoadData"); return Task.CompletedTask; },
                },
            };

            var mockOrchestrator = new Mock<ISagaOrchestrator>();
            mockOrchestrator.Setup(o => o.ExecuteAsync(It.IsAny<IList<SagaStep>>(), It.IsAny<CancellationToken>()))
                .Returns(async (IList<SagaStep> s, CancellationToken ct) =>
                {
                    var result = new SagaResult();
                    for (int i = 0; i < s.Count; i++)
                    {
                        var ok = await s[i].Execute!(ct);
                        if (!ok)
                        {
                            result.FailedStep = s[i].Name;
                            result.ErrorMessage = $"Step '{s[i].Name}' returned false.";
                            // Compensate completed steps in reverse
                            for (int j = i - 1; j >= 0; j--)
                            {
                                await s[j].Compensate!(ct);
                                result.CompensatedSteps.Add(s[j].Name);
                            }
                            result.Success = false;
                            return result;
                        }
                        result.CompletedSteps.Add(s[i].Name);
                    }
                    result.Success = true;
                    return result;
                });

            var sagaResult = await mockOrchestrator.Object.ExecuteAsync(steps);

            Assert.False(sagaResult.Success);
            Assert.Equal("TransformData", sagaResult.FailedStep);
            Assert.Equal(2, sagaResult.CompletedSteps.Count);
            Assert.Contains("ValidateSchema", sagaResult.CompensatedSteps);
            Assert.Contains("FetchData", sagaResult.CompensatedSteps);
            Assert.DoesNotContain("LoadData", sagaResult.CompletedSteps);
        }

        /// <summary>
        /// Partial failure should roll back only completed steps, not unexecuted ones.
        /// </summary>
        [Fact]
        public async Task Partial_Failure_Rolls_Back_Only_Completed_Steps()
        {
            var compensated = new List<string>();

            var steps = new List<SagaStep>
            {
                new SagaStep
                {
                    Name = "Step1",
                    Execute = _ => Task.FromResult(true),
                    Compensate = _ => { compensated.Add("Step1"); return Task.CompletedTask; },
                },
                new SagaStep
                {
                    Name = "Step2",
                    Execute = _ => throw new InvalidOperationException("Database timeout"),
                    Compensate = _ => { compensated.Add("Step2"); return Task.CompletedTask; },
                },
                new SagaStep
                {
                    Name = "Step3",
                    Execute = _ => Task.FromResult(true),
                    Compensate = _ => { compensated.Add("Step3"); return Task.CompletedTask; },
                },
            };

            var mockOrchestrator = new Mock<ISagaOrchestrator>();
            mockOrchestrator.Setup(o => o.ExecuteAsync(It.IsAny<IList<SagaStep>>(), It.IsAny<CancellationToken>()))
                .Returns(async (IList<SagaStep> s, CancellationToken ct) =>
                {
                    var result = new SagaResult();
                    for (int i = 0; i < s.Count; i++)
                    {
                        try
                        {
                            var ok = await s[i].Execute!(ct);
                            if (!ok)
                            {
                                result.FailedStep = s[i].Name;
                                break;
                            }
                            result.CompletedSteps.Add(s[i].Name);
                        }
                        catch (Exception ex)
                        {
                            result.FailedStep = s[i].Name;
                            result.ErrorMessage = ex.Message;
                            break;
                        }
                    }

                    if (result.FailedStep != null)
                    {
                        result.Success = false;
                        for (int j = result.CompletedSteps.Count - 1; j >= 0; j--)
                        {
                            var stepName = result.CompletedSteps[j];
                            var step = s[j];
                            await step.Compensate!(ct);
                            result.CompensatedSteps.Add(stepName);
                        }
                    }
                    else
                    {
                        result.Success = true;
                    }

                    return result;
                });

            var sagaResult = await mockOrchestrator.Object.ExecuteAsync(steps);

            Assert.False(sagaResult.Success);
            Assert.Equal("Step2", sagaResult.FailedStep);
            Assert.Single(sagaResult.CompletedSteps);
            Assert.Contains("Step1", sagaResult.CompensatedSteps);
            Assert.DoesNotContain("Step2", compensated);
            Assert.DoesNotContain("Step3", compensated);
        }

        /// <summary>
        /// Empty saga should succeed immediately.
        /// </summary>
        [Fact]
        public async Task Empty_Saga_Succeeds()
        {
            var mockOrchestrator = new Mock<ISagaOrchestrator>();
            mockOrchestrator.Setup(o => o.ExecuteAsync(It.IsAny<IList<SagaStep>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new SagaResult { Success = true });

            var result = await mockOrchestrator.Object.ExecuteAsync(new List<SagaStep>());

            Assert.True(result.Success);
            Assert.Empty(result.CompletedSteps);
        }
    }
}
