using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase10;

/// <summary>
/// Phase 10: Async safety governance tests.
/// Prevents sync-over-async deadlock patterns from recurring in production code.
/// </summary>
[Trait("Phase", "10")]
[Trait("Component", "Async")]
[Trait("Category", "Governance")]
public sealed class SyncOverAsyncEliminationTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "pnpm-workspace.yaml")))
            dir = Directory.GetParent(dir)?.FullName;
        return dir ?? throw new InvalidOperationException("Could not find repo root");
    }

    [Fact]
    public void TerraFusionSyncIntegrationService_NoGetAwaiterGetResult()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Services", "TerraFusionSyncIntegrationService.cs");
        File.Exists(filePath).Should().BeTrue();

        var content = File.ReadAllText(filePath);
        content.Should().NotContain(".GetAwaiter().GetResult()",
            "sync-over-async in constructors/init can deadlock the thread pool");
    }

    [Fact]
    public void DatabaseAuditLogger_NoRawGetAwaiterGetResult()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Services", "DatabaseAuditLogger.cs");
        File.Exists(filePath).Should().BeTrue();

        var content = File.ReadAllText(filePath);
        // The disposal path may use .Wait(timeout) which is acceptable,
        // but raw .GetAwaiter().GetResult() is not.
        content.Should().NotContain(".GetAwaiter().GetResult()",
            "sync-over-async in disposal can deadlock — use Task.Run().Wait(timeout) instead");
    }

    [Fact]
    public void GovernmentSecurityEngine_NoGetAwaiterGetResult()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Services", "GovernmentGradeSecurityEngine.cs");
        File.Exists(filePath).Should().BeTrue();

        var content = File.ReadAllText(filePath);
        content.Should().NotContain(".GetAwaiter().GetResult()",
            "timer callbacks must use Task.Run(async () => ...) not .GetAwaiter().GetResult()");
    }

    [Fact]
    public void AllApiServices_NoGetAwaiterGetResult()
    {
        // Governance test: scan ALL .cs files under API/Services for the pattern
        var servicesDir = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API", "Services");
        if (!Directory.Exists(servicesDir)) return;

        var violations = new List<string>();
        foreach (var file in Directory.GetFiles(servicesDir, "*.cs", SearchOption.AllDirectories))
        {
            var content = File.ReadAllText(file);
            if (content.Contains(".GetAwaiter().GetResult()"))
            {
                violations.Add(Path.GetFileName(file));
            }
        }

        violations.Should().BeEmpty(
            "no service files should use .GetAwaiter().GetResult() — " +
            $"violations: {string.Join(", ", violations)}");
    }
}

[Trait("Phase", "10")]
[Trait("Component", "Async")]
[Trait("Category", "Governance")]
public sealed class AsyncPatternTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "pnpm-workspace.yaml")))
            dir = Directory.GetParent(dir)?.FullName;
        return dir ?? throw new InvalidOperationException("Could not find repo root");
    }

    [Fact]
    public void SyncIntegrationService_UsesTaskRunForInit()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Services", "TerraFusionSyncIntegrationService.cs");
        var content = File.ReadAllText(filePath);

        content.Should().Contain("Task.Run(async",
            "init methods should use Task.Run(async ...) for fire-and-forget async initialization");
    }

    [Fact]
    public void DatabaseAuditLogger_UsesTimeoutForShutdown()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Services", "DatabaseAuditLogger.cs");
        var content = File.ReadAllText(filePath);

        content.Should().Contain("TimeSpan.FromSeconds",
            "shutdown flush should have a timeout to prevent hanging during disposal");
    }
}
