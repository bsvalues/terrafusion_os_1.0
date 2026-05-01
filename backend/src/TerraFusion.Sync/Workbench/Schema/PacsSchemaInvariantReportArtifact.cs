using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C53-CONS-D: persists a
/// <see cref="PacsSchemaInvariantReport"/> to a JSON artifact at an
/// operator-supplied path so audits / catalog-build telemetry can
/// consume the report without scraping log output.
///
/// <para>Pure file I/O over the in-memory report. Caller decides
/// whether and where to persist; the catalog itself remains
/// I/O-free per HG3 read-only semantics. Typical usage:</para>
/// <code>
/// var catalog = await PacsSchemaCatalog.BuildAsync(source, ct);
/// if (artifactPath is not null)
/// {
///     await PacsSchemaInvariantReportArtifact.WriteAsync(
///         catalog.InvariantReport, artifactPath, ct);
/// }
/// </code>
///
/// <para>Wire format: indented JSON with stable field ordering.
/// Fields are camelCase, mirroring the
/// <see cref="PacsSchemaInvariantResult"/> record shape. The
/// artifact is intentionally human-readable so an operator can
/// scan it without tooling.</para>
///
/// <para>HG7 fail-closed: the writer throws on null arguments,
/// empty path, and I/O failures. It does NOT swallow exceptions —
/// the caller decides how to log / surface persistence failures.</para>
/// </summary>
public static class PacsSchemaInvariantReportArtifact
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
        PacsSchemaInvariantReport report,
        string path,
        CancellationToken ct)
    {
        if (report is null) throw new ArgumentNullException(nameof(report));
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new ArgumentException("Artifact path must be non-empty.", nameof(path));
        }

        var artifact = new ArtifactWireFormat(
            InvariantSetVersion: report.InvariantSetVersion,
            ProducedAtUtc: report.ProducedAtUtc.ToString("O"),
            ErrorCount: report.Errors.Count(),
            WarningCount: report.Warnings.Count(),
            AdvisoryCount: report.Advisories.Count(),
            IsClean: report.IsClean,
            Results: report.Results.Select(r => new ResultWireFormat(
                Severity: r.Severity.ToString(),
                Code: r.Code,
                Message: r.Message,
                TableName: r.TableName,
                ColumnName: r.ColumnName,
                Provenance: r.Provenance)).ToArray());

        var json = JsonSerializer.Serialize(artifact, JsonOptions);

        var directory = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using var fs = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true);
        using var writer = new StreamWriter(fs);
        await writer.WriteAsync(json.AsMemory(), ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Wire format for the artifact's top-level shape. Field order
    /// kept stable for diffability across catalog builds.
    /// </summary>
    private sealed record ArtifactWireFormat(
        string InvariantSetVersion,
        string ProducedAtUtc,
        int ErrorCount,
        int WarningCount,
        int AdvisoryCount,
        bool IsClean,
        ResultWireFormat[] Results);

    private sealed record ResultWireFormat(
        string Severity,
        string Code,
        string Message,
        string? TableName,
        string? ColumnName,
        string Provenance);
}
