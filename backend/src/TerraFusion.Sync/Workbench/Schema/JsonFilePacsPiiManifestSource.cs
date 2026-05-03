using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C51-PII-B: default <see cref="IPacsPiiManifestSource"/>
/// implementation. Reads a single JSON file at an explicitly-
/// configured path (HG-PII-1: no glob, no walk).
///
/// <para>Wire format (binding for C51-PII-B; matches the JSON
/// example in the C51-PII-A policy doc):</para>
/// <code>
/// {
///   "manifestVersion": "1.0.0",
///   "manifestEvent": "Benton-2026-PACS-PII-tagging-pass-1",
///   "tableExhaustive": [ "imprv_det_class", "land_soil" ],
///   "tables": [
///     { "name": "owner", "classification": "Direct", "reason": "..." }
///   ],
///   "columns": [
///     { "table": "chg_of_owner", "column": "grantor_cv",
///       "classification": "Direct", "reason": "..." }
///   ]
/// }
/// </code>
/// </summary>
public sealed class JsonFilePacsPiiManifestSource : IPacsPiiManifestSource
{
    private readonly string? _manifestPath;

    public JsonFilePacsPiiManifestSource(string? manifestPath)
    {
        _manifestPath = manifestPath;
    }

    /// <inheritdoc />
    public async Task<PacsPiiManifest?> ReadAsync(CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_manifestPath))
        {
            return null;
        }

        if (!File.Exists(_manifestPath))
        {
            throw new FileNotFoundException(
                $"[JsonFilePacsPiiManifestSource] PII manifest path '{_manifestPath}' " +
                $"does not exist. HG-PII-1: no auto-discovery; the operator must place the file at the " +
                $"configured path or unset RequirePiiManifest.");
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
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' deserialized to null.");
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException(
                $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' is not valid JSON: {ex.Message}",
                ex);
        }

        var manifestVersion = parsed.ManifestVersion ?? throw new InvalidDataException(
            $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' missing required 'manifestVersion'.");
        var manifestEvent = parsed.ManifestEvent ?? throw new InvalidDataException(
            $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' missing required 'manifestEvent'.");

        var tableExhaustive = new HashSet<string>(parsed.TableExhaustive ?? new List<string>(0), StringComparer.Ordinal);

        var tableEntries = new List<PacsPiiTableEntry>(parsed.Tables?.Count ?? 0);
        var seenTables = new HashSet<string>(StringComparer.Ordinal);
        foreach (var t in parsed.Tables ?? new List<TableEntryWire>(0))
        {
            if (string.IsNullOrWhiteSpace(t.Name))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' has a table entry with empty 'name'.");
            }
            if (!seenTables.Add(t.Name))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' has duplicate table entry for '{t.Name}'.");
            }
            var classification = ParseClassification(t.Classification, $"table '{t.Name}'", _manifestPath);
            if (string.IsNullOrWhiteSpace(t.Reason))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' table entry '{t.Name}' has empty 'reason'. " +
                    $"Reason is required for audit-trail integrity.");
            }
            tableEntries.Add(new PacsPiiTableEntry(t.Name, classification, t.Reason));
        }

        var columnEntries = new List<PacsPiiColumnEntry>(parsed.Columns?.Count ?? 0);
        var seenColumns = new HashSet<string>(StringComparer.Ordinal);
        foreach (var c in parsed.Columns ?? new List<ColumnEntryWire>(0))
        {
            if (string.IsNullOrWhiteSpace(c.Table))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' has a column entry with empty 'table'.");
            }
            if (string.IsNullOrWhiteSpace(c.Column))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' has a column entry under '{c.Table}' with empty 'column'.");
            }
            var key = $"{c.Table}.{c.Column}";
            if (!seenColumns.Add(key))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' has duplicate column entry for '{key}'.");
            }
            var classification = ParseClassification(c.Classification, $"column '{key}'", _manifestPath);
            if (string.IsNullOrWhiteSpace(c.Reason))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsPiiManifestSource] Manifest at '{_manifestPath}' column entry '{key}' has empty 'reason'. " +
                    $"Reason is required for audit-trail integrity.");
            }
            columnEntries.Add(new PacsPiiColumnEntry(c.Table, c.Column, classification, c.Reason));
        }

        return new PacsPiiManifest(
            ManifestPath: _manifestPath,
            ManifestVersion: manifestVersion,
            ManifestEvent: manifestEvent,
            TableExhaustiveFlags: tableExhaustive,
            TableEntries: tableEntries,
            ColumnEntries: columnEntries);
    }

    private static PiiClassification ParseClassification(string? raw, string context, string manifestPath)
    {
        if (!Enum.TryParse<PiiClassification>(raw, ignoreCase: false, out var classification))
        {
            throw new InvalidDataException(
                $"[JsonFilePacsPiiManifestSource] Manifest at '{manifestPath}' {context} has invalid 'classification' value '{raw}'. " +
                $"Allowed: None, Indirect, Direct.");
        }
        return classification;
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
        [JsonPropertyName("tableExhaustive")] public List<string>? TableExhaustive { get; set; }
        [JsonPropertyName("tables")]          public List<TableEntryWire>?  Tables  { get; set; }
        [JsonPropertyName("columns")]         public List<ColumnEntryWire>? Columns { get; set; }
    }

    private sealed class TableEntryWire
    {
        [JsonPropertyName("name")]           public string? Name { get; set; }
        [JsonPropertyName("classification")] public string? Classification { get; set; }
        [JsonPropertyName("reason")]         public string? Reason { get; set; }
    }

    private sealed class ColumnEntryWire
    {
        [JsonPropertyName("table")]          public string? Table { get; set; }
        [JsonPropertyName("column")]         public string? Column { get; set; }
        [JsonPropertyName("classification")] public string? Classification { get; set; }
        [JsonPropertyName("reason")]         public string? Reason { get; set; }
    }
}
