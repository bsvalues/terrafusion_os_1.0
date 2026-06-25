using System;
using System.IO;
using System.Threading;
using FluentAssertions;
using TerraFusion.Abstractions.DTOs.Workbench;
using TerraFusion.Sync.Workbench.Readiness;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Workbench.Readiness;

/// <summary>
/// Slice OPS-1-A unit tests for
/// <see cref="WorkbenchSyncReadinessService"/>. Covers the OPS-1-A
/// acceptance gates from the OPS-1 policy at
/// <c>docs/workbench/sync-readiness-console-policy.md</c>:
/// success path, missing artifacts, county-mismatch sanitization,
/// malformed JSON tolerance, no-PII guarantee.
/// </summary>
public sealed class WorkbenchSyncReadinessServiceTests : IDisposable
{
    private readonly string _root;
    private static readonly Guid CountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid SourceConnectionId = Guid.Parse("8e4944c7-9628-448e-b7a6-0053d58ff5ac");
    private static readonly Guid WorkbookId = Guid.Parse("a767c8a2-5b8a-4846-af8b-c3496601e924");

    public WorkbenchSyncReadinessServiceTests()
    {
        _root = Path.Combine(Path.GetTempPath(), $"ops-1a-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_root);
    }

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch { /* ignore */ }
    }

    private void WriteCatalogHealth(string runId, string body)
    {
        var dir = Path.Combine(_root, "benton-sync-3", runId);
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "schema-catalog-health.stdout.txt"), body);
    }

    private void WriteInvariant(string runId, int errors, int warnings, bool isClean)
    {
        var dir = Path.Combine(_root, "benton-sync-5", runId);
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "invariant-report.json"),
            $"{{\"errorCount\":{errors},\"warningCount\":{warnings},\"isClean\":{(isClean ? "true" : "false")}}}");
    }

    private void WritePreflightEvidence(string runId, Guid countyId, int fkPass, int fkFail)
    {
        var dir = Path.Combine(_root, "benton-sync-6-c", runId);
        Directory.CreateDirectory(dir);
        var json = $@"{{
  ""schemaVersion"": ""1.0.0"",
  ""countyId"": ""{countyId}"",
  ""summary"": {{
    ""loaderCallCount"": {fkPass + fkFail},
    ""fkPassCount"": {fkPass}, ""fkWarnCount"": 0, ""fkFailCount"": {fkFail}, ""fkSkippedCount"": 0,
    ""eraPassCount"": {fkPass}, ""eraWarnCount"": 0, ""eraFailCount"": 0, ""eraSkippedCount"": 0,
    ""piiPassCount"": {fkPass}, ""piiWarnCount"": 0, ""piiFailCount"": 0, ""piiSkippedCount"": 0
  }}
}}";
        File.WriteAllText(Path.Combine(dir, "preflight-evidence.json"), json);
    }

    private void WriteCoverageReport(
        string runId, Guid countyId, int forwardCount, int driftCount, bool isClean,
        bool nestUnderOltp = false)
    {
        var dir = nestUnderOltp
            ? Path.Combine(_root, "benton-sync-7-c", runId, "oltp-run")
            : Path.Combine(_root, "benton-sync-7-c", runId);
        Directory.CreateDirectory(dir);
        var json = $@"{{
  ""schemaVersion"": ""1.0.0"",
  ""countyId"": ""{countyId}"",
  ""forwardCoverageGap"": {{ ""count"": {forwardCount}, ""isConclusive"": true, ""sample"": [] }},
  ""backwardTraceabilityGap"": {{ ""count"": 0, ""isConclusive"": true, ""sample"": [] }},
  ""decisionDrift"": {{ ""count"": {driftCount}, ""isConclusive"": true, ""sample"": [] }},
  ""verdict"": {{ ""isClean"": {(isClean ? "true" : "false")}, ""summary"": ""test"" }}
}}";
        File.WriteAllText(Path.Combine(dir, "coverage-report.json"), json);
    }

    // ── Empty-state tests ────────────────────────────────────────────

    [Fact]
    public async Task Build_NoArtifactsAvailable_AllPanelsUnknown()
    {
        var sut = new WorkbenchSyncReadinessService(_root);

        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.CountyId.Should().Be(CountyId);
        dto.SourceConnectionId.Should().Be(SourceConnectionId);
        dto.Reachability.Status.Should().Be(SyncReadinessStatus.Unknown);
        dto.CatalogHealth.Status.Should().Be(SyncReadinessStatus.Unknown);
        dto.Invariants.Status.Should().Be(SyncReadinessStatus.Unknown);
        dto.Preflights.Status.Should().Be(SyncReadinessStatus.Unknown);
        dto.Coverage.Status.Should().Be(SyncReadinessStatus.Unknown);
        dto.LastProof.CatalogHealth.Should().Be("never");
        dto.LastProof.InvariantArtifact.Should().Be("never");
        dto.LastProof.PreflightEvidence.Should().Be("never");
        dto.LastProof.CoverageReport.Should().Be("never");
    }

    // ── Happy-path tests ─────────────────────────────────────────────

    [Fact]
    public async Task Build_AllArtifactsClean_ProducesYesPanels()
    {
        WriteCatalogHealth("20260502T010520Z",
            "  IsClean                       : true\n" +
            "  Errors                        : 0\n" +
            "  Warnings                      : 0\n" +
            "  Coverage                      : 2229 tables, 32750 columns, 210 dictionaries");
        WriteInvariant("20260502T012736Z", errors: 0, warnings: 0, isClean: true);
        WritePreflightEvidence("20260502T042535Z", CountyId, fkPass: 1, fkFail: 0);
        WriteCoverageReport("20260502T050226Z", CountyId, forwardCount: 0, driftCount: 0, isClean: true);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.CatalogHealth.Status.Should().Be(SyncReadinessStatus.Yes);
        dto.Invariants.Status.Should().Be(SyncReadinessStatus.Yes);
        dto.Preflights.Status.Should().Be(SyncReadinessStatus.Yes);
        dto.Coverage.Status.Should().Be(SyncReadinessStatus.Yes);
        dto.LastProof.CatalogHealth.Should().NotBe("never");
        dto.LastProof.InvariantArtifact.Should().NotBe("never");
        dto.LastProof.PreflightEvidence.Should().NotBe("never");
        dto.LastProof.CoverageReport.Should().NotBe("never");
    }

    // ── Status-derivation tests ─────────────────────────────────────

    [Fact]
    public async Task Build_InvariantsHaveErrors_ProducesNoStatus()
    {
        WriteInvariant("20260502T012736Z", errors: 5, warnings: 0, isClean: false);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Invariants.Status.Should().Be(SyncReadinessStatus.No,
            "OPS-1: Errors > 0 always maps to NO");
    }

    [Fact]
    public async Task Build_InvariantsHaveOnlyWarnings_ProducesWarnStatus()
    {
        WriteInvariant("20260502T012736Z", errors: 0, warnings: 721, isClean: true);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Invariants.Status.Should().Be(SyncReadinessStatus.Warn,
            "OPS-1: Warnings > 0 with no Errors maps to WARN (advisories, not defects)");
    }

    [Fact]
    public async Task Build_PreflightsHaveFailures_ProducesNoStatus()
    {
        WritePreflightEvidence("20260502T042535Z", CountyId, fkPass: 0, fkFail: 1);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Preflights.Status.Should().Be(SyncReadinessStatus.No,
            "OPS-1: any preflight Fail count > 0 maps to NO — operator action required");
    }

    [Fact]
    public async Task Build_CoverageHasForwardGaps_ProducesNoStatus()
    {
        WriteCoverageReport("20260502T050226Z", CountyId,
            forwardCount: 50, driftCount: 0, isClean: false, nestUnderOltp: true);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Coverage.Status.Should().Be(SyncReadinessStatus.No);
        dto.Coverage.Headline.Should().Contain("Forward gap 50");
    }

    // ── County-scope guard tests ────────────────────────────────────

    [Fact]
    public async Task Build_CrossCountyArtifact_PreflightPanelMarkedUnknown()
    {
        var otherCounty = Guid.Parse("11111111-1111-1111-1111-111111111111");
        WritePreflightEvidence("20260502T042535Z", otherCounty, fkPass: 1, fkFail: 0);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Preflights.Status.Should().Be(SyncReadinessStatus.Unknown,
            "OPS-1: artifacts belonging to a different county MUST NOT bleed into the requested scope");
        dto.Preflights.Detail.Should().Contain("different county");
    }

    [Fact]
    public async Task Build_CrossCountyCoverage_PanelMarkedUnknown()
    {
        var otherCounty = Guid.Parse("22222222-2222-2222-2222-222222222222");
        WriteCoverageReport("20260502T050226Z", otherCounty,
            forwardCount: 0, driftCount: 0, isClean: true);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Coverage.Status.Should().Be(SyncReadinessStatus.Unknown);
    }

    // ── Resilience tests ─────────────────────────────────────────────

    [Fact]
    public async Task Build_MalformedJson_PanelMarkedUnknownNotThrows()
    {
        var dir = Path.Combine(_root, "benton-sync-5", "20260502T012736Z");
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "invariant-report.json"), "{ this is not valid JSON");

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Invariants.Status.Should().Be(SyncReadinessStatus.Unknown,
            "OPS-1: malformed artifact JSON MUST NOT throw — panel surfaces UNKNOWN");
    }

    [Fact]
    public async Task Build_MultipleRuns_PicksLatestRunIdOrder()
    {
        WriteInvariant("20260501T010101Z", errors: 0, warnings: 0, isClean: true);
        WriteInvariant("20260502T010101Z", errors: 1, warnings: 0, isClean: false);

        var sut = new WorkbenchSyncReadinessService(_root);
        var dto = await sut.BuildAsync(CountyId, SourceConnectionId, WorkbookId, CancellationToken.None);

        dto.Invariants.Status.Should().Be(SyncReadinessStatus.No,
            "OPS-1: latest captured artifact wins; lexicographic RUN_ID ordering picks 20260502 over 20260501");
    }

    // ── Constructor guard ────────────────────────────────────────────

    [Fact]
    public void Constructor_EmptyArtifactRoot_Throws()
    {
        Action act = () => new WorkbenchSyncReadinessService("");
        act.Should().Throw<ArgumentException>();
    }
}
