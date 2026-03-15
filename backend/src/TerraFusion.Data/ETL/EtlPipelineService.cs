// TFT-182 — canon-etl: Airflow DAG equivalent for real-estate ETL in C#
// TerraCanon domain — sync/ETL infrastructure. No valuation math.

using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.ETL;

#region Contracts

/// <summary>
/// Represents a single step in an ETL pipeline.
/// </summary>
public interface IEtlStep
{
    /// <summary>Unique identifier for this step.</summary>
    string StepId { get; }

    /// <summary>Human-readable name.</summary>
    string Name { get; }

    /// <summary>IDs of steps that must complete before this step can run.</summary>
    IReadOnlyList<string> DependsOn { get; }

    /// <summary>Maximum number of retry attempts on failure.</summary>
    int MaxRetries { get; }

    /// <summary>Execute the step, returning a result summary.</summary>
    Task<EtlStepResult> ExecuteAsync(EtlContext context, CancellationToken ct = default);
}

/// <summary>
/// Orchestrates a directed-acyclic-graph (DAG) of <see cref="IEtlStep"/> instances.
/// </summary>
public interface IEtlPipelineService
{
    /// <summary>Register a step with the pipeline.</summary>
    void RegisterStep(IEtlStep step);

    /// <summary>Run the full pipeline, respecting dependency order.</summary>
    Task<EtlPipelineResult> RunAsync(EtlContext context, CancellationToken ct = default);

    /// <summary>Get the current progress snapshot.</summary>
    EtlProgressSnapshot GetProgress();
}

#endregion

#region Models

/// <summary>
/// Shared context bag passed to every step in a pipeline run.
/// </summary>
public sealed class EtlContext
{
    /// <summary>Unique run identifier.</summary>
    public string RunId { get; } = Guid.NewGuid().ToString("N")[..12];

    /// <summary>Source system tag (e.g. "MLS", "CountyRecorder", "SalesHistory").</summary>
    public string SourceSystem { get; init; } = "Unknown";

    /// <summary>Target county FIPS code.</summary>
    public string CountyFips { get; init; } = string.Empty;

    /// <summary>Arbitrary key/value bag for inter-step data.</summary>
    public ConcurrentDictionary<string, object> Bag { get; } = new();

    /// <summary>UTC timestamp when the run started.</summary>
    public DateTimeOffset StartedAtUtc { get; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// Result produced by a single step execution.
/// </summary>
public sealed record EtlStepResult
{
    public required string StepId { get; init; }
    public bool Success { get; init; }
    public int RecordsProcessed { get; init; }
    public int RecordsFailed { get; init; }
    public TimeSpan Duration { get; init; }
    public string? ErrorMessage { get; init; }
    public int AttemptNumber { get; init; } = 1;
}

/// <summary>
/// Aggregate result for a full pipeline run.
/// </summary>
public sealed record EtlPipelineResult
{
    public required string RunId { get; init; }
    public bool Success { get; init; }
    public TimeSpan TotalDuration { get; init; }
    public IReadOnlyList<EtlStepResult> StepResults { get; init; } = [];
    public string? ErrorMessage { get; init; }
}

/// <summary>
/// Real-time progress snapshot.
/// </summary>
public sealed record EtlProgressSnapshot
{
    public string? RunId { get; init; }
    public int TotalSteps { get; init; }
    public int CompletedSteps { get; init; }
    public int FailedSteps { get; init; }
    public string? CurrentStepId { get; init; }
    public double PercentComplete => TotalSteps == 0 ? 0 : Math.Round(100.0 * CompletedSteps / TotalSteps, 1);
}

#endregion

#region Built-in step bases

/// <summary>
/// Convenience base class for extraction steps.
/// </summary>
public abstract class ExtractStep : IEtlStep
{
    public abstract string StepId { get; }
    public abstract string Name { get; }
    public virtual IReadOnlyList<string> DependsOn => [];
    public virtual int MaxRetries => 3;
    public abstract Task<EtlStepResult> ExecuteAsync(EtlContext context, CancellationToken ct);
}

/// <summary>
/// Convenience base class for transformation steps.
/// </summary>
public abstract class TransformStep : IEtlStep
{
    public abstract string StepId { get; }
    public abstract string Name { get; }
    public abstract IReadOnlyList<string> DependsOn { get; }
    public virtual int MaxRetries => 2;
    public abstract Task<EtlStepResult> ExecuteAsync(EtlContext context, CancellationToken ct);
}

/// <summary>
/// Convenience base class for load steps.
/// </summary>
public abstract class LoadStep : IEtlStep
{
    public abstract string StepId { get; }
    public abstract string Name { get; }
    public abstract IReadOnlyList<string> DependsOn { get; }
    public virtual int MaxRetries => 2;
    public abstract Task<EtlStepResult> ExecuteAsync(EtlContext context, CancellationToken ct);
}

/// <summary>
/// Convenience base class for validation steps.
/// </summary>
public abstract class ValidateStep : IEtlStep
{
    public abstract string StepId { get; }
    public abstract string Name { get; }
    public abstract IReadOnlyList<string> DependsOn { get; }
    public virtual int MaxRetries => 1;
    public abstract Task<EtlStepResult> ExecuteAsync(EtlContext context, CancellationToken ct);
}

#endregion

#region Pipeline service

/// <summary>
/// DAG-based ETL pipeline orchestrator.
/// Resolves step dependencies via topological sort and executes with retry logic.
/// </summary>
public sealed class EtlPipelineService : IEtlPipelineService
{
    private readonly ILogger<EtlPipelineService> _logger;
    private readonly Dictionary<string, IEtlStep> _steps = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _lock = new();

    // progress tracking
    private volatile string? _runId;
    private volatile string? _currentStepId;
    private int _completedSteps;
    private int _failedSteps;

    public EtlPipelineService(ILogger<EtlPipelineService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public void RegisterStep(IEtlStep step)
    {
        ArgumentNullException.ThrowIfNull(step);
        lock (_lock)
        {
            if (!_steps.TryAdd(step.StepId, step))
                throw new InvalidOperationException($"Step '{step.StepId}' is already registered.");
        }
    }

    /// <inheritdoc />
    public async Task<EtlPipelineResult> RunAsync(EtlContext context, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        var sw = Stopwatch.StartNew();
        _runId = context.RunId;
        _completedSteps = 0;
        _failedSteps = 0;
        _currentStepId = null;

        _logger.LogInformation("ETL pipeline {RunId} starting — source={Source}, county={County}, steps={Count}",
            context.RunId, context.SourceSystem, context.CountyFips, _steps.Count);

        List<IEtlStep> ordered;
        try
        {
            ordered = TopologicalSort();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "ETL pipeline {RunId} has a dependency cycle", context.RunId);
            return new EtlPipelineResult
            {
                RunId = context.RunId,
                Success = false,
                TotalDuration = sw.Elapsed,
                ErrorMessage = ex.Message
            };
        }

        var results = new List<EtlStepResult>(ordered.Count);

        foreach (var step in ordered)
        {
            ct.ThrowIfCancellationRequested();
            _currentStepId = step.StepId;

            var stepResult = await ExecuteWithRetryAsync(step, context, ct);
            results.Add(stepResult);

            if (stepResult.Success)
            {
                Interlocked.Increment(ref _completedSteps);
            }
            else
            {
                Interlocked.Increment(ref _failedSteps);
                _logger.LogError("ETL pipeline {RunId} aborting — step {StepId} failed after {Attempts} attempt(s): {Error}",
                    context.RunId, step.StepId, stepResult.AttemptNumber, stepResult.ErrorMessage);

                return new EtlPipelineResult
                {
                    RunId = context.RunId,
                    Success = false,
                    TotalDuration = sw.Elapsed,
                    StepResults = results,
                    ErrorMessage = $"Step '{step.StepId}' failed: {stepResult.ErrorMessage}"
                };
            }
        }

        sw.Stop();
        _logger.LogInformation("ETL pipeline {RunId} completed successfully in {Duration}",
            context.RunId, sw.Elapsed);

        return new EtlPipelineResult
        {
            RunId = context.RunId,
            Success = true,
            TotalDuration = sw.Elapsed,
            StepResults = results
        };
    }

    /// <inheritdoc />
    public EtlProgressSnapshot GetProgress()
    {
        return new EtlProgressSnapshot
        {
            RunId = _runId,
            TotalSteps = _steps.Count,
            CompletedSteps = _completedSteps,
            FailedSteps = _failedSteps,
            CurrentStepId = _currentStepId
        };
    }

    // ── Private helpers ──────────────────────────────────────────────

    private async Task<EtlStepResult> ExecuteWithRetryAsync(IEtlStep step, EtlContext context, CancellationToken ct)
    {
        var maxAttempts = Math.Max(1, step.MaxRetries);
        EtlStepResult? lastResult = null;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            var sw = Stopwatch.StartNew();
            try
            {
                _logger.LogInformation("ETL step {StepId} attempt {Attempt}/{Max} starting",
                    step.StepId, attempt, maxAttempts);

                lastResult = await step.ExecuteAsync(context, ct);

                if (lastResult.Success)
                {
                    _logger.LogInformation("ETL step {StepId} succeeded — {Records} records in {Duration}",
                        step.StepId, lastResult.RecordsProcessed, lastResult.Duration);
                    return lastResult;
                }

                _logger.LogWarning("ETL step {StepId} returned failure on attempt {Attempt}: {Error}",
                    step.StepId, attempt, lastResult.ErrorMessage);
            }
            catch (OperationCanceledException)
            {
                throw; // propagate cancellation
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogWarning(ex, "ETL step {StepId} threw on attempt {Attempt}", step.StepId, attempt);

                lastResult = new EtlStepResult
                {
                    StepId = step.StepId,
                    Success = false,
                    Duration = sw.Elapsed,
                    ErrorMessage = ex.Message,
                    AttemptNumber = attempt
                };
            }

            if (attempt < maxAttempts)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt)); // exponential back-off
                _logger.LogInformation("ETL step {StepId} retrying in {Delay}", step.StepId, delay);
                await Task.Delay(delay, ct);
            }
        }

        return lastResult!;
    }

    /// <summary>
    /// Kahn's algorithm for topological sort. Throws on cycles.
    /// </summary>
    private List<IEtlStep> TopologicalSort()
    {
        var inDegree = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var adjacency = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var (id, _) in _steps)
        {
            inDegree.TryAdd(id, 0);
            adjacency.TryAdd(id, []);
        }

        foreach (var (id, step) in _steps)
        {
            foreach (var dep in step.DependsOn)
            {
                if (!_steps.ContainsKey(dep))
                    throw new InvalidOperationException($"Step '{id}' depends on unknown step '{dep}'.");

                adjacency[dep].Add(id);
                inDegree[id] = inDegree.GetValueOrDefault(id) + 1;
            }
        }

        var queue = new Queue<string>(inDegree.Where(kv => kv.Value == 0).Select(kv => kv.Key));
        var sorted = new List<IEtlStep>(_steps.Count);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            sorted.Add(_steps[current]);

            foreach (var neighbor in adjacency[current])
            {
                inDegree[neighbor]--;
                if (inDegree[neighbor] == 0)
                    queue.Enqueue(neighbor);
            }
        }

        if (sorted.Count != _steps.Count)
            throw new InvalidOperationException("ETL pipeline contains a dependency cycle.");

        return sorted;
    }
}

#endregion
