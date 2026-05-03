using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice BENTON-SYNC-7-B: persists a
/// <see cref="SalesQualificationCoverageReport"/> to a JSON artifact
/// at an operator-supplied path, mirroring the
/// <c>DictionaryLoaderPreflightEvidenceArtifact</c> precedent
/// (BENTON-SYNC-6-B).
///
/// <para>Pure file I/O over the in-memory report. Caller decides
/// whether and where to persist; the runner remains read-only-with-
/// respect-to-PACS-and-canonical per HG3. Wire format: indented JSON
/// with stable field ordering, camelCase fields. Enum-equivalent
/// strings (decision statuses) serialize as strings already in the
/// report record, so no special converter is needed.</para>
///
/// <para>HG7 fail-closed: the writer throws on null arguments,
/// empty path, and I/O failures. The caller decides how to log /
/// surface persistence failures, and the SyncAtlas wiring (per
/// BENTON-SYNC-6-C reconciliation) prints a stderr line on failure
/// but preserves the run's primary exit code.</para>
/// </summary>
public static class SalesQualificationCoverageReportArtifact
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    /// <summary>
    /// Serialize <paramref name="report"/> to JSON and write it to
    /// <paramref name="path"/>. Creates parent directories as needed.
    /// </summary>
    /// <exception cref="ArgumentNullException">
    /// <paramref name="report"/> is null.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// <paramref name="path"/> is null / empty / whitespace.
    /// </exception>
    /// <exception cref="IOException">Underlying file write failed.</exception>
    public static async Task WriteAsync(
        SalesQualificationCoverageReport report,
        string path,
        CancellationToken ct)
    {
        if (report is null) throw new ArgumentNullException(nameof(report));
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new ArgumentException("Artifact path must be non-empty.", nameof(path));
        }

        var json = JsonSerializer.Serialize(report, JsonOptions);

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
