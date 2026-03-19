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

    /// <summary>
    /// Phase 8: emitIntent must exist in terraTrace.ts.
    /// Proves the frontend paired API is present — source-text contract.
    /// </summary>
    [Fact]
    public void Frontend_TerraTrace_Must_Export_EmitIntent()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("export function emitIntent",
            "terraTrace.ts must export emitIntent for intent/result pairing (Phase 8 contract)");
    }

    /// <summary>Phase 8: emitResult must exist in terraTrace.ts.</summary>
    [Fact]
    public void Frontend_TerraTrace_Must_Export_EmitResult()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("export function emitResult",
            "terraTrace.ts must export emitResult for intent/result pairing (Phase 8 contract)");
    }

    /// <summary>Phase 8: getUnpairedIntents must exist — enables sweep tooling.</summary>
    [Fact]
    public void Frontend_TerraTrace_Must_Export_GetUnpairedIntents()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("export function getUnpairedIntents",
            "terraTrace.ts must export getUnpairedIntents so sweep tooling can detect incomplete pairs");
    }

    /// <summary>
    /// Phase 8: TraceIntent must carry countyId — county isolation contract.
    /// </summary>
    [Fact]
    public void Frontend_TraceIntent_Must_Carry_CountyId()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("countyId",
            "TraceIntent must carry countyId for county isolation — every intent is county-scoped");
    }

    /// <summary>
    /// Phase 8: sweep.ts CLI tool must exist in tools/tf/.
    /// Proves drift detection tooling is present and deployable.
    /// </summary>
    [Fact]
    public void SweepTool_Must_Exist_In_Tools_Tf()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var sweepFile = Path.Combine(repoRoot, "tools", "tf", "sweep.ts");

        File.Exists(sweepFile).Should().BeTrue(
            "tools/tf/sweep.ts must exist — Phase 8 drift detection CLI tool required");
    }

    /// <summary>
    /// Phase 8: verify-ops.ts CLI tool must exist in tools/tf/.
    /// Proves shadow write detection tooling is present and deployable.
    /// </summary>
    [Fact]
    public void VerifyOpsTool_Must_Exist_In_Tools_Tf()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var verifyOpsFile = Path.Combine(repoRoot, "tools", "tf", "verify-ops.ts");

        File.Exists(verifyOpsFile).Should().BeTrue(
            "tools/tf/verify-ops.ts must exist — Phase 8 shadow write detection CLI tool required");
    }

    /// <summary>
    /// Phase 8: sweep.ts must reference getUnpairedIntents or equivalent unpaired detection.
    /// Proves the sweep tool actually uses the API — not just an empty file.
    /// </summary>
    [Fact]
    public void SweepTool_Must_Reference_Unpaired_Detection()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var sweepFile = Path.Combine(repoRoot, "tools", "tf", "sweep.ts");

        if (!File.Exists(sweepFile)) return;

        var content = File.ReadAllText(sweepFile);
        var hasUnpairedRef =
            content.Contains("unpaired", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("getUnpairedIntents", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("emitIntent", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("drift", StringComparison.OrdinalIgnoreCase);

        hasUnpairedRef.Should().BeTrue(
            "sweep.ts must reference unpaired intent detection or drift — an empty stub is insufficient");
    }

    /// <summary>
    /// Phase 8: verify-ops.ts must reference SaveChangesAsync or direct mutation detection.
    /// Proves the verify-ops tool targets actual shadow write patterns.
    /// </summary>
    [Fact]
    public void VerifyOpsTool_Must_Reference_SaveChanges_Detection()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var verifyOpsFile = Path.Combine(repoRoot, "tools", "tf", "verify-ops.ts");

        if (!File.Exists(verifyOpsFile)) return;

        var content = File.ReadAllText(verifyOpsFile);
        var hasShadowWriteRef =
            content.Contains("SaveChanges", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("shadow", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("bypass", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("mutation", StringComparison.OrdinalIgnoreCase);

        hasShadowWriteRef.Should().BeTrue(
            "verify-ops.ts must reference SaveChanges, shadow writes, or mutation bypass detection");
    }

    /// <summary>
    /// Phase 8: DistributedTracingService must exist in TerraFusion.Core.
    /// Validates the intent/result correlation service is in the sovereign spine.
    /// </summary>
    [Fact]
    public void DistributedTracingService_Must_Exist_In_Core()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var tracingFile = Directory.GetFiles(
                BackendSrcDir, "DistributedTracingService.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .FirstOrDefault();

        tracingFile.Should().NotBeNull(
            "DistributedTracingService.cs must exist in backend/src — required for intent/result correlation");

        var content = File.ReadAllText(tracingFile!);
        content.Should().Contain("IDistributedTracingService",
            "DistributedTracingService must implement IDistributedTracingService interface");
    }

    /// <summary>
    /// Phase 8: No raw phone numbers or tax IDs in log format strings.
    /// Extends PII sweep to government-specific sensitive fields.
    /// </summary>
    [Fact]
    public void No_Raw_TaxId_Or_Phone_In_Log_Format_Strings()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var taxIdPattern = new Regex(
            @"_logger\.Log\w+\([^;]*\{[Tt]ax[Ii][Dd]\}[^;]*,\s*\w*[Tt]ax[Ii][Dd]",
            RegexOptions.Compiled);

        var phonePattern = new Regex(
            @"_logger\.Log\w+\([^;]*\{[Pp]hone(Number)?\}[^;]*,\s*\w*[Pp]hone",
            RegexOptions.Compiled);

        var taxViolations = ScanForViolations(taxIdPattern, "Raw {TaxId} in log");
        var phoneViolations = ScanForViolations(phonePattern, "Raw {Phone} in log");

        taxViolations.Should().BeEmpty(
            "PII contract: tax IDs must never appear as raw values in log format strings");
        phoneViolations.Should().BeEmpty(
            "PII contract: phone numbers must never appear as raw values in log format strings");
    }

    /// <summary>
    /// Phase 8: terraTrace.ts must propagate countyId from TraceIntent through emitIntent.
    /// County isolation — cross-county trace leakage is a governance violation.
    /// </summary>
    [Fact]
    public void Frontend_EmitIntent_Must_Use_CountyId_Parameter()
    {
        var repoRoot = Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir))!;
        var traceFile = Path.Combine(
            repoRoot, "frontend", "apps", "os-shell", "src", "services", "terraTrace.ts");

        if (!File.Exists(traceFile)) return;

        var content = File.ReadAllText(traceFile);
        content.Should().Contain("intent.countyId",
            "emitIntent must propagate countyId from TraceIntent — no county-anonymous intents allowed");
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
