using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C52-OVR-B: default <see cref="IPacsExportedFkManifestSource"/>
/// implementation. Reads a single JSON file at an explicitly-
/// configured path (HG-OVR-1: no glob, no walk).
///
/// <para>Wire format matches the C52-OVR-A policy doc example.</para>
/// </summary>
public sealed class JsonFilePacsExportedFkManifestSource : IPacsExportedFkManifestSource
{
    private readonly string? _manifestPath;

    public JsonFilePacsExportedFkManifestSource(string? manifestPath)
    {
        _manifestPath = manifestPath;
    }

    /// <inheritdoc />
    public async Task<PacsExportedFkManifest?> ReadAsync(CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_manifestPath))
        {
            return null;
        }

        if (!File.Exists(_manifestPath))
        {
            throw new FileNotFoundException(
                $"[JsonFilePacsExportedFkManifestSource] Exported FK manifest path '{_manifestPath}' " +
                $"does not exist. HG-OVR-1: no auto-discovery; the operator must place the file at the " +
                $"configured path or unset RequireExportedFkManifest.");
        }

        string raw;
        using (var fs = new FileStream(_manifestPath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true))
        using (var reader = new StreamReader(fs))
        {
            raw = await reader.ReadToEndAsync().ConfigureAwait(false);
        }

        WireFormat parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<WireFormat>(raw, JsonOptions)
                ?? throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' deserialized to null.");
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException(
                $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' is not valid JSON: {ex.Message}",
                ex);
        }

        var manifestVersion = parsed.ManifestVersion ?? throw new InvalidDataException(
            $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' missing required 'manifestVersion'.");
        var manifestEvent = parsed.ManifestEvent ?? throw new InvalidDataException(
            $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' missing required 'manifestEvent'.");

        var entries = new List<PacsExportedFkEntry>(parsed.Edges?.Count ?? 0);
        var seenConstraints = new HashSet<string>(StringComparer.Ordinal);
        foreach (var e in parsed.Edges ?? new List<EntryWire>(0))
        {
            if (string.IsNullOrWhiteSpace(e.ConstraintName))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' has an edge with empty 'constraintName'.");
            }
            if (!seenConstraints.Add(e.ConstraintName))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' has duplicate 'constraintName' '{e.ConstraintName}'.");
            }
            if (string.IsNullOrWhiteSpace(e.SourceTable))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' has empty 'sourceTable'.");
            }
            if (string.IsNullOrWhiteSpace(e.TargetTable))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' has empty 'targetTable'.");
            }
            if (e.SourceColumns is null || e.SourceColumns.Count == 0)
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' has empty 'sourceColumns'.");
            }
            if (e.TargetColumns is null || e.TargetColumns.Count == 0)
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' has empty 'targetColumns'.");
            }
            if (e.SourceColumns.Count != e.TargetColumns.Count)
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' arity mismatch: " +
                    $"sourceColumns.Count={e.SourceColumns.Count} but targetColumns.Count={e.TargetColumns.Count}.");
            }
            foreach (var c in e.SourceColumns)
            {
                if (string.IsNullOrWhiteSpace(c))
                {
                    throw new InvalidDataException(
                        $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' has empty entry in 'sourceColumns'.");
                }
            }
            foreach (var c in e.TargetColumns)
            {
                if (string.IsNullOrWhiteSpace(c))
                {
                    throw new InvalidDataException(
                        $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' has empty entry in 'targetColumns'.");
                }
            }
            if (string.IsNullOrWhiteSpace(e.Reason))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsExportedFkManifestSource] Manifest at '{_manifestPath}' edge '{e.ConstraintName}' has empty 'reason'. " +
                    $"Reason is required for audit-trail integrity.");
            }
            entries.Add(new PacsExportedFkEntry(
                ConstraintName: e.ConstraintName,
                SourceTable: e.SourceTable,
                SourceColumns: new List<string>(e.SourceColumns),
                TargetTable: e.TargetTable,
                TargetColumns: new List<string>(e.TargetColumns),
                Reason: e.Reason,
                AuditedBy: e.AuditedBy,
                AuditedOnUtc: e.AuditedOnUtc));
        }

        return new PacsExportedFkManifest(
            ManifestPath: _manifestPath,
            ManifestVersion: manifestVersion,
            ManifestEvent: manifestEvent,
            Edges: entries);
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    private sealed class WireFormat
    {
        [JsonPropertyName("manifestVersion")] public string? ManifestVersion { get; set; }
        [JsonPropertyName("manifestEvent")]   public string? ManifestEvent { get; set; }
        [JsonPropertyName("edges")]           public List<EntryWire>? Edges { get; set; }
    }

    private sealed class EntryWire
    {
        [JsonPropertyName("constraintName")] public string? ConstraintName { get; set; }
        [JsonPropertyName("sourceTable")]    public string? SourceTable { get; set; }
        [JsonPropertyName("sourceColumns")]  public List<string>? SourceColumns { get; set; }
        [JsonPropertyName("targetTable")]    public string? TargetTable { get; set; }
        [JsonPropertyName("targetColumns")]  public List<string>? TargetColumns { get; set; }
        [JsonPropertyName("reason")]         public string? Reason { get; set; }
        [JsonPropertyName("auditedBy")]      public string? AuditedBy { get; set; }
        [JsonPropertyName("auditedOnUtc")]   public string? AuditedOnUtc { get; set; }
    }
}
