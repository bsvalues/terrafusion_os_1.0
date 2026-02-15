using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase9;

/// <summary>
/// Phase 9: Security Hardening governance tests.
/// Prevents hardcoded credentials, dev backdoors, silent exception
/// swallowing, and sync-over-async deadlock patterns from recurring.
/// </summary>
[Trait("Phase", "9")]
[Trait("Component", "Security")]
[Trait("Category", "Governance")]
public sealed class HardcodedCredentialTests
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
    public void SecurityService_NoHardcodedPasswords()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core",
            "Services", "SecurityService.cs");
        File.Exists(filePath).Should().BeTrue("SecurityService.cs must exist");

        var content = File.ReadAllText(filePath);

        // Must NOT contain any plaintext passwords
        content.Should().NotContain("Admin123", "hardcoded admin password must be removed");
        content.Should().NotContain("Assessor123", "hardcoded assessor password must be removed");
        content.Should().NotContain("Auditor123", "hardcoded auditor password must be removed");
    }

    [Fact]
    public void SecurityService_NoTestAccountDictionary()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core",
            "Services", "SecurityService.cs");
        var content = File.ReadAllText(filePath);

        // Must NOT contain a test accounts dictionary
        content.Should().NotContain("testAccounts",
            "hardcoded test account dictionary must be removed");
    }

    [Fact]
    public void SecurityService_NoSyncOverAsync_TaskDelayWait()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core",
            "Services", "SecurityService.cs");
        var content = File.ReadAllText(filePath);

        content.Should().NotContain("Task.Delay(100).Wait()",
            "sync-over-async Task.Delay().Wait() is a thread-pool waste — use await");
    }
}

[Trait("Phase", "9")]
[Trait("Component", "Security")]
[Trait("Category", "Governance")]
public sealed class DevLdapGuardTests
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
    public void AuthenticationConfig_HasEnvironmentParameter()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Security", "AuthenticationConfiguration.cs");
        var content = File.ReadAllText(filePath);

        // Method signature must accept IHostEnvironment
        content.Should().Contain("IHostEnvironment",
            "AddTerraFusionSecurityServices must accept IHostEnvironment to guard dev services");
    }

    [Fact]
    public void AuthenticationConfig_ChecksIsDevelopment()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Security", "AuthenticationConfiguration.cs");
        var content = File.ReadAllText(filePath);

        content.Should().Contain("IsDevelopment",
            "DevelopmentLdapService registration must be guarded by IsDevelopment() check");
    }

    [Fact]
    public void ProgramCs_PassesEnvironmentToSecurityServices()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API", "Program.cs");
        var content = File.ReadAllText(filePath);

        content.Should().Contain("builder.Environment",
            "Program.cs must pass builder.Environment to AddTerraFusionSecurityServices");
    }
}

[Trait("Phase", "9")]
[Trait("Component", "Security")]
[Trait("Category", "Governance")]
public sealed class JwtDefaultKeyTests
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
    public void JwtAuthService_DefaultKeyDetectionUsesBoolFlag()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Security", "JwtAuthService.cs");
        var content = File.ReadAllText(filePath);

        // Must use a boolean flag pattern, not re-calling GenerateDefaultKey
        content.Should().Contain("_usingDefaultKey",
            "JWT default key detection must use a stored boolean, not re-calling GenerateDefaultKey()");
    }

    [Fact]
    public void JwtAuthService_NoDoubleGenerateDefaultKeyComparison()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Security", "JwtAuthService.cs");
        var content = File.ReadAllText(filePath);

        // The old buggy pattern: _secretKey == GenerateDefaultKey()
        content.Should().NotContain("_secretKey == GenerateDefaultKey()",
            "comparing _secretKey to GenerateDefaultKey() is always false (new GUID each call)");
    }
}

[Trait("Phase", "9")]
[Trait("Component", "Security")]
[Trait("Category", "Governance")]
public sealed class AuditLoggingTests
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
    public void AuditLoggingMiddleware_NoBareCatchBlocks()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Middleware", "AuditLoggingMiddleware.cs");
        var content = File.ReadAllText(filePath);

        // No bare catch { } blocks — FISMA-HIGH requires audit failures are logged
        var bareCatchPattern = Regex.IsMatch(content, @"catch\s*\{[\s\r\n]*\}");
        bareCatchPattern.Should().BeFalse(
            "bare 'catch { }' blocks are forbidden in audit middleware — FISMA-HIGH requires all audit failures are logged");
    }

    [Fact]
    public void AuditLoggingMiddleware_LogsExceptionInCatch()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Middleware", "AuditLoggingMiddleware.cs");
        var content = File.ReadAllText(filePath);

        content.Should().Contain("LogWarning",
            "audit log error handler must log the exception, not silently discard it");
    }
}

[Trait("Phase", "9")]
[Trait("Component", "Security")]
[Trait("Category", "Governance")]
public sealed class SyncOverAsyncTests
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
    public void GovernmentSecurityEngine_NoGetAwaiterGetResult()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Services", "GovernmentGradeSecurityEngine.cs");
        var content = File.ReadAllText(filePath);

        // The 4 timer callback methods must NOT use .GetAwaiter().GetResult()
        var executeMethods = ExtractExecuteMethods(content);
        foreach (var method in executeMethods)
        {
            method.Should().NotContain(".GetAwaiter().GetResult()",
                "timer callbacks must not use sync-over-async — use Task.Run with async lambda instead");
        }
    }

    [Fact]
    public void GovernmentSecurityEngine_UsesTaskRunAsync()
    {
        var filePath = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.API",
            "Services", "GovernmentGradeSecurityEngine.cs");
        var content = File.ReadAllText(filePath);

        // Must use Task.Run(async () => ...) pattern
        content.Should().Contain("Task.Run(async",
            "timer callbacks should use Task.Run(async () => ...) to avoid deadlocks");
    }

    private static string[] ExtractExecuteMethods(string content)
    {
        // Extract the 4 Execute* method bodies
        var methods = new[] {
            "ExecuteComplianceMonitoring",
            "ExecuteThreatAnalysis",
            "ExecuteSecurityAssessment",
            "ExecuteAuditReporting"
        };

        var results = new List<string>();
        foreach (var methodName in methods)
        {
            var idx = content.IndexOf($"private void {methodName}");
            if (idx >= 0)
            {
                // Grab next 500 chars as approximate method body
                var end = Math.Min(idx + 500, content.Length);
                results.Add(content[idx..end]);
            }
        }
        return results.ToArray();
    }
}

[Trait("Phase", "9")]
[Trait("Component", "Cleanup")]
[Trait("Category", "Governance")]
public sealed class BackupFileCleanupTests
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
    public void BackendSrc_NoBackupFiles()
    {
        var backendSrc = Path.Combine(RepoRoot, "backend", "src");
        var backupFiles = Directory.GetFiles(backendSrc, "*.BACKUP*", SearchOption.AllDirectories);

        backupFiles.Should().BeEmpty(
            "no .BACKUP files should exist in backend/src/ — they clutter search results");
    }
}
