using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Sync.Profiles;

namespace TerraFusion.Core.Sync.Execution;

/// <summary>
/// Executes one profile-bound read against an explicitly supplied adapter. This mock-only envelope
/// performs no discovery, connection management, retry, persistence, checkpoint advancement, or
/// canonical promotion.
/// </summary>
public sealed class ReadOnlyCountySourceExecutor
{
    public const string ContractId = "wal.external-readonly.execution-envelope.v1";
    public const int MaximumFieldsPerRow = 256;

    private readonly IReadOnlyCountySourceAdapter _adapter;
    private readonly ReadOnlyCountySourceExecutionProvenance _configuredProvenance;
    private readonly int _resultFieldLimit;
    private readonly int _resultRowLimit;

    public ReadOnlyCountySourceExecutor(
        IReadOnlyCountySourceAdapter adapter,
        ReadOnlyCountySourceProfile profile,
        int resultRowLimit,
        int resultFieldLimit)
    {
        ArgumentNullException.ThrowIfNull(adapter);
        ArgumentNullException.ThrowIfNull(profile);

        if (resultRowLimit is < 1 or > ReadOnlySourceReadRequest.MaximumRows)
        {
            throw new ArgumentOutOfRangeException(
                nameof(resultRowLimit),
                $"Result row limit must be between 1 and {ReadOnlySourceReadRequest.MaximumRows} rows.");
        }

        if (resultFieldLimit is < 1 or > MaximumFieldsPerRow)
        {
            throw new ArgumentOutOfRangeException(
                nameof(resultFieldLimit),
                $"Result field limit must be between 1 and {MaximumFieldsPerRow} fields per row.");
        }

        _adapter = adapter;
        _configuredProvenance = ReadOnlyCountySourceExecutionProvenance.From(profile);
        _resultFieldLimit = resultFieldLimit;
        _resultRowLimit = resultRowLimit;
    }

    /// <summary>
    /// Validates the request against the configured execution envelope and invokes the adapter
    /// exactly once. Adapter exceptions and cancellation are intentionally allowed to propagate.
    /// </summary>
    public async Task<ReadOnlyCountySourceExecutionResult> ExecuteAsync(
        ReadOnlySourceReadRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (!_configuredProvenance.Matches(request.Profile))
        {
            throw new InvalidOperationException(
                "The request source profile does not match the executor's configured provenance.");
        }

        if (request.MaxRows > _resultRowLimit)
        {
            throw new InvalidOperationException(
                "The request row bound exceeds the executor's configured result row limit.");
        }

        var page = await _adapter
            .ReadPageAsync(request, cancellationToken)
            .ConfigureAwait(false);

        if (page is null)
        {
            throw new InvalidOperationException("The read adapter returned no result page.");
        }

        return ReadOnlyCountySourceExecutionResult.Create(
            _configuredProvenance,
            request,
            page,
            _resultRowLimit,
            _resultFieldLimit);
    }
}

/// <summary>An immutable snapshot of the governed profile used for one execution.</summary>
public sealed record ReadOnlyCountySourceExecutionProvenance
{
    private ReadOnlyCountySourceExecutionProvenance(
        Guid countyId,
        string countyCode,
        string sourceIdentity,
        string sourceFamily,
        string extractionMethod,
        string schemaVersion,
        string mappingVersion,
        string checkpointStrategy,
        TimeSpan freshnessTarget)
    {
        CountyId = countyId;
        CountyCode = countyCode;
        SourceIdentity = sourceIdentity;
        SourceFamily = sourceFamily;
        ExtractionMethod = extractionMethod;
        SchemaVersion = schemaVersion;
        MappingVersion = mappingVersion;
        CheckpointStrategy = checkpointStrategy;
        FreshnessTarget = freshnessTarget;
    }

    public Guid CountyId { get; }

    public string CountyCode { get; }

    public string SourceIdentity { get; }

    public string SourceFamily { get; }

    public string ExtractionMethod { get; }

    public string SchemaVersion { get; }

    public string MappingVersion { get; }

    public string CheckpointStrategy { get; }

    public TimeSpan FreshnessTarget { get; }

    internal static ReadOnlyCountySourceExecutionProvenance From(
        ReadOnlyCountySourceProfile profile)
    {
        return new ReadOnlyCountySourceExecutionProvenance(
            profile.CountyId,
            profile.CountyCode,
            profile.SourceIdentity,
            profile.SourceFamily,
            profile.ExtractionMethod,
            profile.SchemaVersion,
            profile.MappingVersion,
            profile.CheckpointStrategy,
            profile.FreshnessTarget);
    }

    internal bool Matches(ReadOnlyCountySourceProfile profile)
    {
        return CountyId == profile.CountyId
            && string.Equals(CountyCode, profile.CountyCode, StringComparison.Ordinal)
            && string.Equals(SourceIdentity, profile.SourceIdentity, StringComparison.Ordinal)
            && string.Equals(SourceFamily, profile.SourceFamily, StringComparison.Ordinal)
            && string.Equals(ExtractionMethod, profile.ExtractionMethod, StringComparison.Ordinal)
            && string.Equals(SchemaVersion, profile.SchemaVersion, StringComparison.Ordinal)
            && string.Equals(MappingVersion, profile.MappingVersion, StringComparison.Ordinal)
            && string.Equals(CheckpointStrategy, profile.CheckpointStrategy, StringComparison.Ordinal)
            && FreshnessTarget == profile.FreshnessTarget;
    }
}

/// <summary>
/// Deep immutable snapshot of the request provenance and one bounded adapter result page.
/// </summary>
public sealed class ReadOnlyCountySourceExecutionResult
{
    private ReadOnlyCountySourceExecutionResult(
        ReadOnlyCountySourceExecutionProvenance provenance,
        string commandText,
        IReadOnlyDictionary<string, object?> parameters,
        int requestMaxRows,
        int resultRowLimit,
        int resultFieldLimit,
        string? requestedCheckpoint,
        IReadOnlyList<IReadOnlyDictionary<string, object?>> rows,
        string? nextCheckpoint,
        DateTimeOffset observedAtUtc)
    {
        Provenance = provenance;
        CommandText = commandText;
        Parameters = parameters;
        RequestMaxRows = requestMaxRows;
        ResultRowLimit = resultRowLimit;
        ResultFieldLimit = resultFieldLimit;
        RequestedCheckpoint = requestedCheckpoint;
        Rows = rows;
        NextCheckpoint = nextCheckpoint;
        ObservedAtUtc = observedAtUtc;
    }

    public ReadOnlyCountySourceExecutionProvenance Provenance { get; }

    public string CommandText { get; }

    public IReadOnlyDictionary<string, object?> Parameters { get; }

    public int RequestMaxRows { get; }

    public int ResultRowLimit { get; }

    public int ResultFieldLimit { get; }

    public string? RequestedCheckpoint { get; }

    public IReadOnlyList<IReadOnlyDictionary<string, object?>> Rows { get; }

    public string? NextCheckpoint { get; }

    public DateTimeOffset ObservedAtUtc { get; }

    internal static ReadOnlyCountySourceExecutionResult Create(
        ReadOnlyCountySourceExecutionProvenance provenance,
        ReadOnlySourceReadRequest request,
        ReadOnlySourceReadPage page,
        int resultRowLimit,
        int resultFieldLimit)
    {
        if (page.Rows is null)
        {
            throw new InvalidOperationException("The read adapter returned a null row collection.");
        }

        var allowedRowCount = Math.Min(request.MaxRows, resultRowLimit);
        if (page.Rows.Count > allowedRowCount)
        {
            throw new InvalidOperationException(
                "The read adapter returned more rows than the request or execution envelope allows.");
        }

        var rows = SnapshotRows(page.Rows, allowedRowCount, resultFieldLimit);

        return new ReadOnlyCountySourceExecutionResult(
            provenance,
            request.Command.Text,
            SnapshotValues(
                request.Parameters,
                "request parameter",
                ReadOnlyCountySourceExecutor.MaximumFieldsPerRow),
            request.MaxRows,
            resultRowLimit,
            resultFieldLimit,
            request.Checkpoint,
            rows,
            page.NextCheckpoint,
            page.ObservedAtUtc);
    }

    private static IReadOnlyList<IReadOnlyDictionary<string, object?>> SnapshotRows(
        IReadOnlyList<IReadOnlyDictionary<string, object?>> sourceRows,
        int allowedRowCount,
        int resultFieldLimit)
    {
        var rows = new List<IReadOnlyDictionary<string, object?>>(allowedRowCount);
        foreach (var row in sourceRows)
        {
            if (rows.Count >= allowedRowCount)
            {
                throw new InvalidOperationException(
                    "The read adapter returned more rows than the request or execution envelope allows.");
            }

            if (row is null)
            {
                throw new InvalidOperationException("The read adapter returned a null row.");
            }

            rows.Add(SnapshotValues(row, "result value", resultFieldLimit));
        }

        return rows.AsReadOnly();
    }

    private static IReadOnlyDictionary<string, object?> SnapshotValues(
        IReadOnlyDictionary<string, object?> source,
        string valueKind,
        int maximumValues)
    {
        var snapshot = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var pair in source)
        {
            if (snapshot.Count >= maximumValues)
            {
                throw new InvalidOperationException(
                    $"The {valueKind} collection exceeds the {maximumValues}-value limit.");
            }

            if (pair.Key is null)
            {
                throw new InvalidOperationException($"A {valueKind} key must not be null.");
            }

            if (!IsImmutableScalar(pair.Value))
            {
                throw new InvalidOperationException(
                    $"The {valueKind} '{pair.Key}' is not a supported immutable scalar.");
            }

            snapshot.Add(pair.Key, pair.Value);
        }

        return new ReadOnlyDictionary<string, object?>(snapshot);
    }

    private static bool IsImmutableScalar(object? value)
    {
        if (value is null || value.GetType().IsEnum)
        {
            return true;
        }

        return value is string
            or bool
            or byte
            or sbyte
            or short
            or ushort
            or int
            or uint
            or long
            or ulong
            or float
            or double
            or decimal
            or char
            or Guid
            or DateTime
            or DateTimeOffset
            or TimeSpan
            or DateOnly
            or TimeOnly;
    }
}
