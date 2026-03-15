// TFT-179 — Data Pipeline Management Service
// Create, configure, run, and monitor ETL pipelines.

using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Services;

/// <summary>
/// Contract for data pipeline management.
/// Pipelines are configurable ETL flows that read from connectors,
/// apply transformations, and write to target stores.
/// </summary>
public interface IPipelineService
{
    /// <summary>Creates a new pipeline definition.</summary>
    Task<PipelineDefinition> CreatePipelineAsync(
        CreatePipelineRequest request, CancellationToken ct = default);

    /// <summary>Runs a pipeline by id, returning a run-tracking handle.</summary>
    Task<PipelineRun> RunPipelineAsync(
        string pipelineId, CancellationToken ct = default);

    /// <summary>Gets the current status of a pipeline run.</summary>
    Task<PipelineRun?> GetPipelineStatusAsync(
        string runId, CancellationToken ct = default);

    /// <summary>Lists all pipeline definitions.</summary>
    Task<IReadOnlyList<PipelineDefinition>> ListPipelinesAsync(
        CancellationToken ct = default);

    /// <summary>Deletes a pipeline definition.</summary>
    Task<bool> DeletePipelineAsync(
        string pipelineId, CancellationToken ct = default);
}

/// <summary>Request to create a new pipeline.</summary>
public sealed record CreatePipelineRequest(
    string Name,
    string SourceConnector,
    string TargetStore,
    IReadOnlyList<string>? Entities = null,
    IReadOnlyList<PipelineStepConfig>? Steps = null,
    string? CronSchedule = null);

/// <summary>Configuration for a single pipeline step (filter, map, enrich).</summary>
public sealed record PipelineStepConfig(
    string StepType,
    Dictionary<string, string>? Parameters = null);

/// <summary>A stored pipeline definition.</summary>
public sealed record PipelineDefinition
{
    /// <summary>Unique pipeline identifier.</summary>
    public required string PipelineId { get; init; }

    /// <summary>Human-readable name.</summary>
    public required string Name { get; init; }

    /// <summary>Source connector name.</summary>
    public required string SourceConnector { get; init; }

    /// <summary>Target data store.</summary>
    public required string TargetStore { get; init; }

    /// <summary>Entities to sync through this pipeline.</summary>
    public IReadOnlyList<string> Entities { get; init; } = [];

    /// <summary>Ordered transformation steps.</summary>
    public IReadOnlyList<PipelineStepConfig> Steps { get; init; } = [];

    /// <summary>Optional cron schedule for recurring runs.</summary>
    public string? CronSchedule { get; init; }

    /// <summary>When the pipeline was created.</summary>
    public DateTime CreatedAt { get; init; }
}

/// <summary>Tracks a single execution of a pipeline.</summary>
public sealed record PipelineRun
{
    /// <summary>Unique run identifier.</summary>
    public required string RunId { get; init; }

    /// <summary>Pipeline that was executed.</summary>
    public required string PipelineId { get; init; }

    /// <summary>Current status (Queued, Running, Completed, Failed).</summary>
    public required string Status { get; init; }

    /// <summary>When the run started.</summary>
    public DateTime StartedAt { get; init; }

    /// <summary>When the run finished.</summary>
    public DateTime? CompletedAt { get; init; }

    /// <summary>Records read from source.</summary>
    public int RecordsRead { get; init; }

    /// <summary>Records written to target.</summary>
    public int RecordsWritten { get; init; }

    /// <summary>Error message if failed.</summary>
    public string? ErrorMessage { get; init; }
}

/// <summary>
/// TFT-179: Data pipeline management service.
/// Creates, configures, runs, and monitors ETL pipelines
/// composed of connector reads, transformation steps, and target writes.
/// </summary>
public sealed class DataPipelineService : IPipelineService
{
    private readonly ILogger<DataPipelineService> _logger;
    private readonly Dictionary<string, PipelineDefinition> _pipelines = new();
    private readonly Dictionary<string, PipelineRun> _runs = new();
    private readonly object _lock = new();

    /// <summary>Initializes a new DataPipelineService.</summary>
    public DataPipelineService(ILogger<DataPipelineService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public Task<PipelineDefinition> CreatePipelineAsync(
        CreatePipelineRequest request, CancellationToken ct = default)
    {
        var id = $"pipeline-{Guid.NewGuid():N}";
        var definition = new PipelineDefinition
        {
            PipelineId = id,
            Name = request.Name,
            SourceConnector = request.SourceConnector,
            TargetStore = request.TargetStore,
            Entities = request.Entities ?? [],
            Steps = request.Steps ?? [],
            CronSchedule = request.CronSchedule,
            CreatedAt = DateTime.UtcNow,
        };

        lock (_lock) { _pipelines[id] = definition; }

        _logger.LogInformation(
            "Pipeline created: {Id} ({Name}), source={Source}, target={Target}",
            id, request.Name, request.SourceConnector, request.TargetStore);

        return Task.FromResult(definition);
    }

    /// <inheritdoc />
    public Task<PipelineRun> RunPipelineAsync(
        string pipelineId, CancellationToken ct = default)
    {
        PipelineDefinition? pipeline;
        lock (_lock)
        {
            if (!_pipelines.TryGetValue(pipelineId, out pipeline))
            {
                throw new InvalidOperationException(
                    $"Pipeline '{pipelineId}' not found.");
            }
        }

        var runId = $"run-{Guid.NewGuid():N}";
        var run = new PipelineRun
        {
            RunId = runId,
            PipelineId = pipelineId,
            Status = "Running",
            StartedAt = DateTime.UtcNow,
        };

        lock (_lock) { _runs[runId] = run; }

        _logger.LogInformation(
            "Pipeline run started: {RunId} for pipeline {PipelineId} ({Name})",
            runId, pipelineId, pipeline.Name);

        // Stub: mark completed immediately (real impl would run async ETL)
        run = run with
        {
            Status = "Completed",
            CompletedAt = DateTime.UtcNow,
        };

        lock (_lock) { _runs[runId] = run; }

        return Task.FromResult(run);
    }

    /// <inheritdoc />
    public Task<PipelineRun?> GetPipelineStatusAsync(
        string runId, CancellationToken ct = default)
    {
        lock (_lock)
        {
            _runs.TryGetValue(runId, out var run);
            return Task.FromResult(run);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<PipelineDefinition>> ListPipelinesAsync(
        CancellationToken ct = default)
    {
        lock (_lock)
        {
            IReadOnlyList<PipelineDefinition> result = _pipelines.Values.ToList();
            return Task.FromResult(result);
        }
    }

    /// <inheritdoc />
    public Task<bool> DeletePipelineAsync(
        string pipelineId, CancellationToken ct = default)
    {
        lock (_lock)
        {
            var removed = _pipelines.Remove(pipelineId);
            if (removed)
            {
                _logger.LogInformation("Pipeline deleted: {Id}", pipelineId);
            }

            return Task.FromResult(removed);
        }
    }
}
