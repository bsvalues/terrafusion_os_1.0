// TFR-018 — Distributed saga pattern for multi-step sync operations
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Represents a single step in a saga with execute and compensate (rollback) actions.
    /// </summary>
    public sealed class SagaStep
    {
        /// <summary>Human-readable name for this step (e.g. "extract", "validate").</summary>
        public string Name { get; }

        /// <summary>Forward action. Receives context dictionary, returns updated context.</summary>
        public Func<SagaContext, CancellationToken, Task<SagaContext>> Execute { get; }

        /// <summary>Compensating action invoked if a later step fails.</summary>
        public Func<SagaContext, CancellationToken, Task> Compensate { get; }

        public SagaStep(
            string name,
            Func<SagaContext, CancellationToken, Task<SagaContext>> execute,
            Func<SagaContext, CancellationToken, Task> compensate)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Execute = execute ?? throw new ArgumentNullException(nameof(execute));
            Compensate = compensate ?? throw new ArgumentNullException(nameof(compensate));
        }
    }

    /// <summary>
    /// Mutable context bag passed through saga steps.
    /// </summary>
    public sealed class SagaContext
    {
        public string SagaId { get; } = Guid.NewGuid().ToString("N");
        public Dictionary<string, object?> Data { get; } = new();
        public List<string> CompletedSteps { get; } = new();
        public List<string> Errors { get; } = new();

        public T? Get<T>(string key) =>
            Data.TryGetValue(key, out var val) && val is T typed ? typed : default;

        public void Set(string key, object? value) => Data[key] = value;
    }

    /// <summary>
    /// Result of a saga execution.
    /// </summary>
    public sealed record SagaResult
    {
        public string SagaId { get; init; } = string.Empty;
        public bool Success { get; init; }
        public IReadOnlyList<string> CompletedSteps { get; init; } = Array.Empty<string>();
        public IReadOnlyList<string> CompensatedSteps { get; init; } = Array.Empty<string>();
        public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
        public string? FailedStep { get; init; }
    }

    /// <summary>
    /// Orchestrates a sequence of saga steps (extract → validate → transform → load → verify).
    /// On failure, executes compensating transactions in reverse order for all completed steps.
    /// </summary>
    public class SagaOrchestrator
    {
        private readonly List<SagaStep> _steps = new();

        /// <summary>
        /// Adds a step to the saga pipeline.
        /// </summary>
        public SagaOrchestrator AddStep(SagaStep step)
        {
            _steps.Add(step ?? throw new ArgumentNullException(nameof(step)));
            return this;
        }

        /// <summary>
        /// Adds a step to the saga pipeline using inline delegates.
        /// </summary>
        public SagaOrchestrator AddStep(
            string name,
            Func<SagaContext, CancellationToken, Task<SagaContext>> execute,
            Func<SagaContext, CancellationToken, Task> compensate)
        {
            return AddStep(new SagaStep(name, execute, compensate));
        }

        /// <summary>
        /// Builds the standard five-step sync saga: extract → validate → transform → load → verify.
        /// Each step delegate is caller-supplied; each has a compensating rollback.
        /// </summary>
        public static SagaOrchestrator BuildSyncSaga(
            Func<SagaContext, CancellationToken, Task<SagaContext>> extract,
            Func<SagaContext, CancellationToken, Task> rollbackExtract,
            Func<SagaContext, CancellationToken, Task<SagaContext>> validate,
            Func<SagaContext, CancellationToken, Task> rollbackValidate,
            Func<SagaContext, CancellationToken, Task<SagaContext>> transform,
            Func<SagaContext, CancellationToken, Task> rollbackTransform,
            Func<SagaContext, CancellationToken, Task<SagaContext>> load,
            Func<SagaContext, CancellationToken, Task> rollbackLoad,
            Func<SagaContext, CancellationToken, Task<SagaContext>> verify,
            Func<SagaContext, CancellationToken, Task> rollbackVerify)
        {
            return new SagaOrchestrator()
                .AddStep("extract", extract, rollbackExtract)
                .AddStep("validate", validate, rollbackValidate)
                .AddStep("transform", transform, rollbackTransform)
                .AddStep("load", load, rollbackLoad)
                .AddStep("verify", verify, rollbackVerify);
        }

        /// <summary>
        /// Executes the saga. If any step fails, compensating actions run in reverse order.
        /// </summary>
        public async Task<SagaResult> ExecuteAsync(SagaContext? context = null, CancellationToken ct = default)
        {
            context ??= new SagaContext();
            var completed = new Stack<SagaStep>();
            string? failedStep = null;

            foreach (var step in _steps)
            {
                ct.ThrowIfCancellationRequested();
                try
                {
                    context = await step.Execute(context, ct);
                    context.CompletedSteps.Add(step.Name);
                    completed.Push(step);
                }
                catch (Exception ex)
                {
                    failedStep = step.Name;
                    context.Errors.Add($"Step '{step.Name}' failed: {ex.Message}");
                    break;
                }
            }

            // If a step failed, run compensating transactions in reverse
            var compensated = new List<string>();
            if (failedStep != null)
            {
                while (completed.Count > 0)
                {
                    var step = completed.Pop();
                    try
                    {
                        await step.Compensate(context, ct);
                        compensated.Add(step.Name);
                    }
                    catch (Exception ex)
                    {
                        context.Errors.Add($"Compensation for '{step.Name}' failed: {ex.Message}");
                    }
                }
            }

            return new SagaResult
            {
                SagaId = context.SagaId,
                Success = failedStep == null,
                CompletedSteps = context.CompletedSteps,
                CompensatedSteps = compensated,
                Errors = context.Errors,
                FailedStep = failedStep
            };
        }
    }
}
