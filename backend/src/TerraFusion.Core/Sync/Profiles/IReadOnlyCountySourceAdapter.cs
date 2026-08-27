using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Profiles;

/// <summary>
/// Governed identity and extraction contract for one county source.
/// Credentials and connection material deliberately do not belong in this profile.
/// </summary>
public sealed record ReadOnlyCountySourceProfile
{
    public ReadOnlyCountySourceProfile(
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
        if (countyId == Guid.Empty)
        {
            throw new ArgumentException("County identity must not be empty.", nameof(countyId));
        }

        if (freshnessTarget <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(
                nameof(freshnessTarget),
                "Freshness target must be positive.");
        }

        CountyId = countyId;
        CountyCode = RequireIdentity(countyCode, nameof(countyCode));
        SourceIdentity = RequireIdentity(sourceIdentity, nameof(sourceIdentity));
        SourceFamily = RequireIdentity(sourceFamily, nameof(sourceFamily));
        ExtractionMethod = RequireIdentity(extractionMethod, nameof(extractionMethod));
        SchemaVersion = RequireIdentity(schemaVersion, nameof(schemaVersion));
        MappingVersion = RequireIdentity(mappingVersion, nameof(mappingVersion));
        CheckpointStrategy = RequireIdentity(checkpointStrategy, nameof(checkpointStrategy));
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

    private static string RequireIdentity(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Source-profile identity must not be blank.", parameterName);
        }

        return value.Trim();
    }
}

/// <summary>
/// A command admitted by <see cref="ReadOnlySourceCommand.RequireRead"/>.
/// The constructor is private so every caller, including other code in this assembly, must use the
/// lexical guard.
/// </summary>
public sealed partial record ReadOnlySourceCommand
{
    private ReadOnlySourceCommand(string text)
    {
        Text = text;
    }

    public string Text { get; }
}

/// <summary>A page request structurally bound to one governed source profile.</summary>
public sealed record ReadOnlySourceReadRequest
{
    public const int MaximumRows = 10_000;

    public ReadOnlySourceReadRequest(
        ReadOnlyCountySourceProfile profile,
        ReadOnlySourceCommand command,
        IReadOnlyDictionary<string, object?> parameters,
        int maxRows,
        string? checkpoint = null)
    {
        ArgumentNullException.ThrowIfNull(profile);
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(parameters);

        if (maxRows is < 1 or > MaximumRows)
        {
            throw new ArgumentOutOfRangeException(
                nameof(maxRows),
                $"Page size must be between 1 and {MaximumRows} rows.");
        }

        Profile = profile;
        Command = command;
        Parameters = new ReadOnlyDictionary<string, object?>(
            parameters.ToDictionary(
                pair => pair.Key,
                pair => pair.Value,
                StringComparer.Ordinal));
        MaxRows = maxRows;
        Checkpoint = checkpoint;
    }

    public ReadOnlyCountySourceProfile Profile { get; }

    public ReadOnlySourceCommand Command { get; }

    public IReadOnlyDictionary<string, object?> Parameters { get; }

    public int MaxRows { get; }

    public string? Checkpoint { get; }
}

/// <summary>One bounded read result with the source observation time and next checkpoint.</summary>
public sealed record ReadOnlySourceReadPage(
    IReadOnlyList<IReadOnlyDictionary<string, object?>> Rows,
    string? NextCheckpoint,
    DateTimeOffset ObservedAtUtc);

/// <summary>
/// Read-shaped mock adapter contract. It intentionally exposes no write, schema mutation,
/// connection lifecycle, or synchronization-back operation. A later sealed executor must enforce
/// this request against a real read-only source credential before live use.
/// </summary>
public interface IReadOnlyCountySourceAdapter
{
    Task<ReadOnlySourceReadPage> ReadPageAsync(
        ReadOnlySourceReadRequest request,
        CancellationToken cancellationToken = default);
}
