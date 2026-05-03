using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C50-CONV-B: default <see cref="IPacsConversionManifestSource"/>
/// implementation. Reads a single JSON file at an explicitly-
/// configured path (HG-CONV-1: no glob, no walk).
///
/// <para>Wire format (binding for C50-CONV-B; matches the JSON
/// example in the C50-CONV-A1 policy doc):</para>
/// <code>
/// {
///   "manifestVersion": "1.0.0",
///   "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
///   "tables": [
///     { "name": "pp_seg_history", "era": "Pre2017",
///       "reason": "...", "lastWriteEvidence": "..." }
///   ],
///   "columns": [
///     { "table": "imprv_detail", "column": "ascend_orig_meth_cd",
///       "era": "Pre2017", "reason": "..." }
///   ]
/// }
/// </code>
/// </summary>
public sealed class JsonFilePacsConversionManifestSource : IPacsConversionManifestSource
{
    private readonly string? _manifestPath;

    /// <summary>
    /// Constructs a source for an operator-supplied path. <c>null</c>
    /// means "no manifest configured" — <see cref="ReadAsync"/>
    /// returns <c>null</c> in that case.
    /// </summary>
    public JsonFilePacsConversionManifestSource(string? manifestPath)
    {
        _manifestPath = manifestPath;
    }

    /// <inheritdoc />
    public async Task<PacsConversionManifest?> ReadAsync(CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_manifestPath))
        {
            return null;
        }

        if (!File.Exists(_manifestPath))
        {
            throw new FileNotFoundException(
                $"[JsonFilePacsConversionManifestSource] Conversion manifest path '{_manifestPath}' " +
                $"does not exist. HG-CONV-1: no auto-discovery; the operator must place the file at the " +
                $"configured path or unset RequireConversionManifest.");
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
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' deserialized to null.");
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException(
                $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' is not valid JSON: {ex.Message}",
                ex);
        }

        var manifestVersion = parsed.ManifestVersion ?? throw new InvalidDataException(
            $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' missing required 'manifestVersion'.");
        var conversionEvent = parsed.ConversionEvent ?? throw new InvalidDataException(
            $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' missing required 'conversionEvent'.");

        var tableEntries = new List<PacsConversionTableEntry>(parsed.Tables?.Count ?? 0);
        var seenTables = new HashSet<string>(StringComparer.Ordinal);
        foreach (var t in parsed.Tables ?? new List<TableEntryWire>(0))
        {
            if (string.IsNullOrWhiteSpace(t.Name))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' has a table entry with empty 'name'.");
            }
            if (!seenTables.Add(t.Name))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' has duplicate table entry for '{t.Name}'.");
            }
            var era = ParseEra(t.Era, $"table '{t.Name}'", _manifestPath);
            if (string.IsNullOrWhiteSpace(t.Reason))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' table entry '{t.Name}' has empty 'reason'. " +
                    $"Reason is required for audit-trail integrity.");
            }
            tableEntries.Add(new PacsConversionTableEntry(t.Name, era, t.Reason, t.LastWriteEvidence));
        }

        var columnEntries = new List<PacsConversionColumnEntry>(parsed.Columns?.Count ?? 0);
        var seenColumns = new HashSet<string>(StringComparer.Ordinal);
        foreach (var c in parsed.Columns ?? new List<ColumnEntryWire>(0))
        {
            if (string.IsNullOrWhiteSpace(c.Table))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' has a column entry with empty 'table'.");
            }
            if (string.IsNullOrWhiteSpace(c.Column))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' has a column entry under '{c.Table}' with empty 'column'.");
            }
            var key = $"{c.Table}.{c.Column}";
            if (!seenColumns.Add(key))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' has duplicate column entry for '{key}'.");
            }
            var era = ParseEra(c.Era, $"column '{key}'", _manifestPath);
            if (string.IsNullOrWhiteSpace(c.Reason))
            {
                throw new InvalidDataException(
                    $"[JsonFilePacsConversionManifestSource] Manifest at '{_manifestPath}' column entry '{key}' has empty 'reason'. " +
                    $"Reason is required for audit-trail integrity.");
            }
            columnEntries.Add(new PacsConversionColumnEntry(c.Table, c.Column, era, c.Reason, c.LastWriteEvidence));
        }

        return new PacsConversionManifest(
            ManifestPath: _manifestPath,
            ManifestVersion: manifestVersion,
            ConversionEvent: conversionEvent,
            TableEntries: tableEntries,
            ColumnEntries: columnEntries);
    }

    private static PacsConversionEra ParseEra(string? raw, string context, string manifestPath)
    {
        if (!Enum.TryParse<PacsConversionEra>(raw, ignoreCase: false, out var era))
        {
            throw new InvalidDataException(
                $"[JsonFilePacsConversionManifestSource] Manifest at '{manifestPath}' {context} has invalid 'era' value '{raw}'. " +
                $"Allowed: Pre2017, Post2017, Both. (Unknown is a sentinel and MUST NOT be written; HG-CONV-2.)");
        }
        if (era == PacsConversionEra.Unknown)
        {
            throw new InvalidDataException(
                $"[JsonFilePacsConversionManifestSource] Manifest at '{manifestPath}' {context} declares 'era=Unknown'. " +
                $"Unknown is a sentinel for 'no manifest loaded' and MUST NOT appear in a manifest (HG-CONV-2).");
        }
        return era;
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
        [JsonPropertyName("conversionEvent")] public string? ConversionEvent { get; set; }
        [JsonPropertyName("tables")]          public List<TableEntryWire>?  Tables  { get; set; }
        [JsonPropertyName("columns")]         public List<ColumnEntryWire>? Columns { get; set; }
    }

    private sealed class TableEntryWire
    {
        [JsonPropertyName("name")]              public string? Name { get; set; }
        [JsonPropertyName("era")]               public string? Era { get; set; }
        [JsonPropertyName("reason")]            public string? Reason { get; set; }
        [JsonPropertyName("lastWriteEvidence")] public string? LastWriteEvidence { get; set; }
    }

    private sealed class ColumnEntryWire
    {
        [JsonPropertyName("table")]             public string? Table { get; set; }
        [JsonPropertyName("column")]            public string? Column { get; set; }
        [JsonPropertyName("era")]               public string? Era { get; set; }
        [JsonPropertyName("reason")]            public string? Reason { get; set; }
        [JsonPropertyName("lastWriteEvidence")] public string? LastWriteEvidence { get; set; }
    }
}
