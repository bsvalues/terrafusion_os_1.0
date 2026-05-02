using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Transforms.Sales;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Transforms.Sales;

/// <summary>
/// Slice BENTON-SYNC-7-B unit tests for
/// <see cref="SalesQualificationCoverageReportArtifact"/>. Mirrors the
/// BENTON-SYNC-6-B writer test pattern: null/empty-path guards,
/// parent-directory creation, JSON round-trip preservation.
/// </summary>
public sealed class SalesQualificationCoverageReportArtifactTests : IDisposable
{
    private readonly string _tempDir;

    public SalesQualificationCoverageReportArtifactTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"benton-sync-7-b-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, recursive: true); } catch { /* ignore */ }
    }

    private static SalesQualificationCoverageReport NewReport(
        int forwardCount = 0,
        int backwardCount = 0,
        int driftCount = 0,
        bool backwardConclusive = true) =>
        new(
            SchemaVersion: "1.0.0",
            RunId: "2026-05-02T05:00:00.0000000Z",
            CountyId: Guid.Parse("19190019-1919-1919-1919-191919191919"),
            WorkbookId: Guid.Parse("a767c8a2-5b8a-4846-af8b-c3496601e924"),
            SourceConnectionId: Guid.Parse("8e4944c7-9628-448e-b7a6-0053d58ff5ac"),
            PacsScope: new SalesQualificationCoveragePacsScope(
                RowsScanned: 100, MaxSalesApplied: backwardConclusive ? null : 100, RowsWithChgOfOwnerId: 95),
            CanonicalScope: new SalesQualificationCoverageCanonicalScope(
                RowCount: 90, QualifiedCount: 60, ExcludedCount: 20, InconclusiveCount: 10),
            ForwardCoverageGap: new SalesQualificationCoverageGap(
                Count: forwardCount, IsConclusive: true,
                Sample: new List<SalesQualificationCoverageGapEntry>()),
            BackwardTraceabilityGap: new SalesQualificationCoverageGap(
                Count: backwardCount, IsConclusive: backwardConclusive,
                Sample: new List<SalesQualificationCoverageGapEntry>()),
            DecisionDrift: new SalesQualificationCoverageGap(
                Count: driftCount, IsConclusive: true,
                Sample: new List<SalesQualificationCoverageGapEntry>()),
            Verdict: new SalesQualificationCoverageVerdict(
                IsClean: forwardCount == 0 && backwardCount == 0 && driftCount == 0,
                Summary: "test"));

    [Fact]
    public async Task WriteAsync_NullReport_Throws()
    {
        var path = Path.Combine(_tempDir, "out.json");
        var act = async () => await SalesQualificationCoverageReportArtifact
            .WriteAsync(null!, path, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task WriteAsync_EmptyPath_Throws()
    {
        var act = async () => await SalesQualificationCoverageReportArtifact
            .WriteAsync(NewReport(), "", CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task WriteAsync_CreatesParentDirectory()
    {
        var nested = Path.Combine(_tempDir, "a", "b", "c", "coverage.json");
        await SalesQualificationCoverageReportArtifact.WriteAsync(
            NewReport(), nested, CancellationToken.None);
        File.Exists(nested).Should().BeTrue();
    }

    [Fact]
    public async Task WriteAsync_RoundTrips_AllFields()
    {
        var report = NewReport(forwardCount: 3, backwardCount: 2, driftCount: 1);
        var path = Path.Combine(_tempDir, "round-trip.json");
        await SalesQualificationCoverageReportArtifact.WriteAsync(
            report, path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("schemaVersion").GetString().Should().Be("1.0.0");
        root.GetProperty("countyId").GetString().Should()
            .Be("19190019-1919-1919-1919-191919191919");

        var pacs = root.GetProperty("pacsScope");
        pacs.GetProperty("rowsScanned").GetInt32().Should().Be(100);
        pacs.GetProperty("rowsWithChgOfOwnerId").GetInt32().Should().Be(95);

        root.GetProperty("forwardCoverageGap").GetProperty("count").GetInt32().Should().Be(3);
        root.GetProperty("backwardTraceabilityGap").GetProperty("count").GetInt32().Should().Be(2);
        root.GetProperty("decisionDrift").GetProperty("count").GetInt32().Should().Be(1);

        root.GetProperty("verdict").GetProperty("isClean").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task WriteAsync_BoundedRun_PersistsInconclusiveBackwardGap()
    {
        var report = NewReport(backwardCount: 5, backwardConclusive: false);
        var path = Path.Combine(_tempDir, "bounded.json");
        await SalesQualificationCoverageReportArtifact.WriteAsync(
            report, path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        using var doc = JsonDocument.Parse(json);
        var backward = doc.RootElement.GetProperty("backwardTraceabilityGap");

        backward.GetProperty("isConclusive").GetBoolean().Should().BeFalse(
            "BENTON-SYNC-7-A: bounded scans MUST mark the backward gap as inconclusive " +
            "since canonical rows outside the bounded PACS scope may legitimately exist");
        backward.GetProperty("count").GetInt32().Should().Be(5);
    }
}
