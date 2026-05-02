using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice BENTON-SYNC-6-B: persists a
/// <see cref="DictionaryLoaderPreflightEvidence"/> document to a
/// JSON artifact at an operator-supplied path, mirroring the
/// <see cref="PacsSchemaInvariantReportArtifact"/> precedent.
///
/// <para>Pure file I/O over the in-memory document. Caller decides
/// whether and where to persist; the loaders themselves remain
/// I/O-free per HG3 read-only semantics. Wire format: indented JSON
/// with stable field ordering, camelCase fields. Enum values
/// serialize as strings so the artifact stays human-readable.</para>
///
/// <para>HG7 fail-closed: the writer throws on null arguments,
/// empty path, and I/O failures. The caller decides how to log /
/// surface persistence failures, and the caller is expected to call
/// <c>WriteAsync</c> from a try/finally so a partial artifact is
/// preserved when a later preflight throws.</para>
/// </summary>
public static class DictionaryLoaderPreflightEvidenceArtifact
{
    private static readonly JsonSerializerOptions JsonOptions = BuildJsonOptions();

    private static JsonSerializerOptions BuildJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };
        options.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        return options;
    }

    /// <summary>
    /// Serialize <paramref name="evidence"/> to JSON and write it to
    /// <paramref name="path"/>. Creates parent directories as needed.
    /// </summary>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="evidence"/> is null.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="path"/> is null / empty / whitespace.
    /// </exception>
    /// <exception cref="IOException">Underlying file write failed.</exception>
    public static async Task WriteAsync(
        DictionaryLoaderPreflightEvidence evidence,
        string path,
        CancellationToken ct)
    {
        if (evidence is null) throw new ArgumentNullException(nameof(evidence));
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new ArgumentException("Artifact path must be non-empty.", nameof(path));
        }

        var json = JsonSerializer.Serialize(evidence, JsonOptions);

        var directory = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using var fs = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true);
        using var writer = new StreamWriter(fs);
        await writer.WriteAsync(json.AsMemory(), ct).ConfigureAwait(false);
    }
}
