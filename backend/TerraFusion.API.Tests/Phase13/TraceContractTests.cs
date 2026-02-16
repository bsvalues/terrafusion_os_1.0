using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase13;

/// <summary>
/// Phase 13 — Trace Contract Hardening.
/// Enforces PII sanitization, correlation-ID propagation, and
/// payload-by-reference discipline across all backend logging.
/// </summary>
[Trait("Category", "Phase13")]
[Trait("Category", "Governance")]
public class TraceContractTests
{
    private static readonly string BackendSrcDir = FindBackendSrcDir();

    private static string FindBackendSrcDir()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null)
        {
            var candidate = Path.Combine(dir, "backend", "src");
            if (Directory.Exists(candidate)) return candidate;
            var gitDir = Path.Combine(dir, ".git");
            if (Directory.Exists(gitDir) || File.Exists(gitDir))
            {
                candidate = Path.Combine(dir, "backend", "src");
                if (Directory.Exists(candidate)) return candidate;
            }
            dir = Path.GetDirectoryName(dir);
        }
        return string.Empty;
    }

    /// <summary>
    /// PII fields (email, SSN, password) must NEVER appear as raw values
    /// in structured-log format strings.  Allowed patterns:
    ///   - Hashed/masked references: {EmailHash}, {UserIdHash}
    ///   - Redacted placeholders: [REDACTED]
    ///   - Config/flag mentions (not value interpolation)
    ///
    /// Violations: _logger.Log*("... {Email} ...", email)
    ///             _logger.Log*("... {Password} ...", password)
    /// </summary>
    [Fact]
    public void No_Raw_Email_In_Log_Format_Strings()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        // Pattern: _logger.Log*(... "{Email}" or "{email}" ..., email)
        // Matches format string interpolation holes that expose raw email values
        var emailLogPattern = new Regex(
            @"_logger\.Log\w+\([^;]*\{[Ee]mail\}[^;]*,\s*\w*[Ee]mail",
            RegexOptions.Compiled);

        var violations = ScanForViolations(emailLogPattern, "Raw {Email} in log");

        violations.Should().BeEmpty(
            "PII contract: email addresses must not appear as raw values in log format strings. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations.Take(20)));
    }

    [Fact]
    public void No_Raw_Password_In_Log_Format_Strings()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        // Matches log calls that interpolate password-related values
        var passwordLogPattern = new Regex(
            @"_logger\.Log\w+\([^;]*\{[Pp]assword\}",
            RegexOptions.Compiled);

        var violations = ScanForViolations(passwordLogPattern, "Raw {Password} in log");

        violations.Should().BeEmpty(
            "PII contract: password values must never appear in log format strings. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations.Take(20)));
    }

    [Fact]
    public void No_Raw_SSN_In_Log_Format_Strings()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var ssnLogPattern = new Regex(
            @"_logger\.Log\w+\([^;]*\{[Ss][Ss][Nn]\}",
            RegexOptions.Compiled);

        var violations = ScanForViolations(ssnLogPattern, "Raw {SSN} in log");

        violations.Should().BeEmpty(
            "PII contract: SSN values must never appear in log format strings. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations.Take(20)));
    }

    /// <summary>
    /// Every HTTP middleware or audit service that generates log entries
    /// must reference a CorrelationId, X-Correlation-ID, or TraceIdentifier.
    /// This ensures all log events are traceable across service boundaries.
    /// </summary>
    [Theory]
    [InlineData("AuditLogger.cs")]
    [InlineData("DatabaseAuditLogger.cs")]
    public void Audit_Services_Must_Propagate_CorrelationId(string fileName)
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var files = Directory.GetFiles(BackendSrcDir, fileName, SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        files.Should().NotBeEmpty($"audit service {fileName} must exist in backend/src");

        foreach (var file in files)
        {
            var content = File.ReadAllText(file);
            var hasCorrelation =
                content.Contains("CorrelationId", StringComparison.OrdinalIgnoreCase) ||
                content.Contains("X-Correlation-ID", StringComparison.OrdinalIgnoreCase) ||
                content.Contains("TraceIdentifier", StringComparison.OrdinalIgnoreCase) ||
                content.Contains("Activity.Current", StringComparison.OrdinalIgnoreCase);

            hasCorrelation.Should().BeTrue(
                $"{fileName} must propagate correlation IDs for trace compliance " +
                "(CorrelationId, X-Correlation-ID, TraceIdentifier, or Activity.Current)");
        }
    }

    /// <summary>
    /// The TerraPilot tool registry must define piiHandling and tracePolicy
    /// for every registered tool. No tool may omit these fields.
    /// </summary>
    [Fact]
    public void TerraPilot_Tools_Must_Declare_PII_And_Trace_Policy()
    {
        if (string.IsNullOrEmpty(BackendSrcDir))
            return;

        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");

        if (!File.Exists(toolsFile))
            return; // Tool registry not present in this checkout

        var content = File.ReadAllText(toolsFile);

        // Every tool entry must have piiHandling
        var toolPattern = new Regex(@"""toolId""\s*:\s*""([^""]+)""", RegexOptions.Compiled);
        var piiPattern = new Regex(@"""piiHandling""\s*:", RegexOptions.Compiled);
        var tracePattern = new Regex(@"""tracePolicy""\s*:", RegexOptions.Compiled);

        var toolCount = toolPattern.Matches(content).Count;
        var piiCount = piiPattern.Matches(content).Count;
        var traceCount = tracePattern.Matches(content).Count;

        piiCount.Should().Be(toolCount,
            $"every tool ({toolCount} total) must declare piiHandling — found {piiCount}");
        traceCount.Should().Be(toolCount,
            $"every tool ({toolCount} total) must declare tracePolicy — found {traceCount}");
    }

    /// <summary>
    /// OpenTelemetry must be configured in the API entry point (Program.cs).
    /// This ensures distributed tracing is active for all requests.
    /// </summary>
    [Fact]
    public void OpenTelemetry_Must_Be_Configured_In_API()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var programCs = Directory.GetFiles(BackendSrcDir, "Program.cs", SearchOption.AllDirectories)
            .Where(f => f.Contains("TerraFusion.API") && !f.Contains("Test") &&
                        !f.Contains("obj") && !f.Contains("bin"))
            .FirstOrDefault();

        programCs.Should().NotBeNull("TerraFusion.API/Program.cs must exist");

        var content = File.ReadAllText(programCs!);

        content.Should().Contain("AddOpenTelemetry",
            "Program.cs must configure OpenTelemetry for distributed tracing");

        content.Should().Contain("WithTracing",
            "Program.cs must enable OpenTelemetry tracing");
    }

    /// <summary>
    /// TracingConstants must be spec-locked (Phase 36 invariant).
    /// Verifies the constants file exists and contains required ActivitySource names.
    /// </summary>
    [Fact]
    public void TracingConstants_Must_Define_Required_ActivitySources()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var constFiles = Directory.GetFiles(BackendSrcDir, "TracingConstants.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        if (constFiles.Length == 0)
            return; // Phase 36 tracing not present

        var content = File.ReadAllText(constFiles[0]);
        content.Should().Contain("TerraFusion.",
            "TracingConstants must define TerraFusion.* ActivitySource names");
    }

    /// <summary>
    /// Console.WriteLine must not be used for request/response logging in
    /// production code paths. Use structured logging (ILogger) instead.
    /// Scans API controllers and middleware for Console.Write* calls.
    /// </summary>
    [Fact]
    public void No_Console_WriteLine_In_API_Controllers_Or_Middleware()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var apiDir = Path.Combine(BackendSrcDir, "TerraFusion.API");
        if (!Directory.Exists(apiDir))
            return;

        var controllerFiles = Directory.GetFiles(
                Path.Combine(apiDir, "Controllers"), "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var middlewareDir = Path.Combine(apiDir, "Middleware");
        var middlewareFiles = Directory.Exists(middlewareDir)
            ? Directory.GetFiles(middlewareDir, "*.cs", SearchOption.AllDirectories)
                .Where(f => !f.Contains("obj") && !f.Contains("bin"))
                .ToArray()
            : Array.Empty<string>();

        var consolePattern = new Regex(
            @"Console\.(Write|WriteLine)\s*\(",
            RegexOptions.Compiled);

        var violations = new List<string>();

        foreach (var file in controllerFiles.Concat(middlewareFiles))
        {
            var content = File.ReadAllText(file);
            if (consolePattern.IsMatch(content))
            {
                var rel = Path.GetRelativePath(BackendSrcDir, file);
                violations.Add(rel);
            }
        }

        violations.Should().BeEmpty(
            "API controllers and middleware must use ILogger, not Console.Write*. " +
            $"Found {violations.Count} file(s) with Console.Write*:\n" +
            string.Join("\n", violations));
    }

    #region Helpers

    private List<string> ScanForViolations(Regex pattern, string label)
    {
        var violations = new List<string>();
        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test") &&
                        !f.Contains("Migrations"))
            .ToArray();

        foreach (var file in csFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                if (pattern.IsMatch(lines[i]))
                {
                    var rel = Path.GetRelativePath(BackendSrcDir, file);
                    violations.Add($"  {rel}:{i + 1} — {label}");
                }
            }
        }

        return violations;
    }

    #endregion
}
