using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C53-CONS-D unit tests for
/// <see cref="PacsSchemaInvariantReportArtifact"/>. Covers:
/// happy-path serialization, header counts derived from projections,
/// null/empty-path validation, parent-directory creation, and
/// round-trip preservation of all result rows.
/// </summary>
public sealed class PacsSchemaInvariantReportArtifactTests : IDisposable
{
    private readonly string _tempDir;

    public PacsSchemaInvariantReportArtifactTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"c53-cons-d-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, recursive: true); } catch { /* ignore */ }
    }

    private static PacsSchemaInvariantReport BuildReport(params PacsSchemaInvariantResult[] results) =>
        new(InvariantSetVersion: "1.1.0",
            ProducedAtUtc: new DateTime(2026, 4, 30, 16, 34, 11, DateTimeKind.Utc),
            Results: results);

    [Fact]
    public async Task WriteAsync_NullReport_Throws()
    {
        var path = Path.Combine(_tempDir, "out.json");
        var act = async () => await PacsSchemaInvariantReportArtifact.WriteAsync(null!, path, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task WriteAsync_EmptyPath_Throws()
    {
        var report = BuildReport();
        var act = async () => await PacsSchemaInvariantReportArtifact.WriteAsync(report, "", CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task WriteAsync_WhitespacePath_Throws()
    {
        var report = BuildReport();
        var act = async () => await PacsSchemaInvariantReportArtifact.WriteAsync(report, "   ", CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task WriteAsync_CleanReport_ProducesValidJsonWithZeroErrorCount()
    {
        var report = BuildReport();
        var path = Path.Combine(_tempDir, "out.json");

        await PacsSchemaInvariantReportArtifact.WriteAsync(report, path, CancellationToken.None);

        File.Exists(path).Should().BeTrue();
        var json = await File.ReadAllTextAsync(path);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        root.GetProperty("invariantSetVersion").GetString().Should().Be("1.1.0");
        root.GetProperty("errorCount").GetInt32().Should().Be(0);
        root.GetProperty("warningCount").GetInt32().Should().Be(0);
        root.GetProperty("advisoryCount").GetInt32().Should().Be(0);
        root.GetProperty("isClean").GetBoolean().Should().BeTrue();
        root.GetProperty("results").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task WriteAsync_MixedSeverities_HeaderCountsMatchProjections()
    {
        var report = BuildReport(
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Error, "TBL-002",
                "duplicate", "owner", null, "table:owner"),
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Warning, "DICT-005",
                "no description column", "lookup", null, "dictionary:lookup"),
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Warning, "FK-006",
                "inferred not promoted", "imprv", null, "fk:..."),
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Advisory, "DICT-006",
                "code column has no FK", "sale", "ratio_cd", "..."));
        var path = Path.Combine(_tempDir, "mixed.json");

        await PacsSchemaInvariantReportArtifact.WriteAsync(report, path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        root.GetProperty("errorCount").GetInt32().Should().Be(1);
        root.GetProperty("warningCount").GetInt32().Should().Be(2);
        root.GetProperty("advisoryCount").GetInt32().Should().Be(1);
        root.GetProperty("isClean").GetBoolean().Should().BeFalse();
        root.GetProperty("results").GetArrayLength().Should().Be(4);
    }

    [Fact]
    public async Task WriteAsync_RoundTripsResultFields()
    {
        var report = BuildReport(
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Error, "FK-003",
                "FK 'X' SourceColumn 'ghost' does not exist on table 'src'.",
                "src", "ghost", "fk:X"));
        var path = Path.Combine(_tempDir, "rt.json");

        await PacsSchemaInvariantReportArtifact.WriteAsync(report, path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.GetProperty("results")[0];
        first.GetProperty("severity").GetString().Should().Be("Error");
        first.GetProperty("code").GetString().Should().Be("FK-003");
        first.GetProperty("tableName").GetString().Should().Be("src");
        first.GetProperty("columnName").GetString().Should().Be("ghost");
        first.GetProperty("provenance").GetString().Should().Be("fk:X");
        first.GetProperty("message").GetString().Should().Contain("ghost");
    }

    [Fact]
    public async Task WriteAsync_NullColumnName_PreservedAsJsonNull()
    {
        var report = BuildReport(
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Warning, "TBL-004",
                "table has zero columns", "orphan", null, "table:orphan"));
        var path = Path.Combine(_tempDir, "null-col.json");

        await PacsSchemaInvariantReportArtifact.WriteAsync(report, path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.GetProperty("results")[0];
        first.GetProperty("columnName").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task WriteAsync_CreatesParentDirectoryWhenMissing()
    {
        var nested = Path.Combine(_tempDir, "nested", "deeper", "out.json");
        var report = BuildReport();

        await PacsSchemaInvariantReportArtifact.WriteAsync(report, nested, CancellationToken.None);

        File.Exists(nested).Should().BeTrue();
    }

    [Fact]
    public async Task WriteAsync_OverwritesExistingFile()
    {
        var path = Path.Combine(_tempDir, "overwrite.json");
        await File.WriteAllTextAsync(path, "stale-content");

        var report = BuildReport();
        await PacsSchemaInvariantReportArtifact.WriteAsync(report, path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        json.Should().NotContain("stale-content");
        json.Should().Contain("invariantSetVersion");
    }

    [Fact]
    public async Task WriteAsync_ProducesIndentedJsonForReadability()
    {
        var report = BuildReport();
        var path = Path.Combine(_tempDir, "indent.json");

        await PacsSchemaInvariantReportArtifact.WriteAsync(report, path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        // Indented JSON has at least one newline.
        json.Should().Contain("\n");
    }
}
