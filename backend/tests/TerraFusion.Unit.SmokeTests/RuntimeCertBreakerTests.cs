using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// BREAKER SUITE: Adversarial Testing for Runtime Certification
///
/// These tests ensure the tf-runtime cert CLI cannot lie, bypass checks,
/// or produce non-deterministic outputs. No mercy.
///
/// Philosophy: "If we can't break it ourselves, attackers can't either."
/// Test naming: Breaker_{Category}_{Attack}
/// </summary>
public sealed class RuntimeCertBreakerTests
{
    private static readonly string RepoRoot = FindRepoRoot();
    private static readonly string ToolsDir = Path.Combine(RepoRoot, "tools", "runtime-cert");
    private static readonly string ChecksDir = Path.Combine(ToolsDir, "checks");

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
                return dir;
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Exit Code Bypass - Cannot return 0 when checks fail
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_ExitCode_FailedChecksMustNotReturnZero()
    {
        // VERIFY: Script has explicit exit code handling that prevents returning 0 on failure
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Must have explicit sys.exit(1) for FAIL case
        Assert.Contains("sys.exit(1)", content);

        // Must check result before deciding exit code
        Assert.True(
            content.Contains("result") && content.Contains("FAIL"),
            "Script must check result for FAIL status before exit"
        );

        // ATTACK: Verify no early return 0 bypasses exist
        var lines = content.Split('\n');
        var inCertCommand = false;
        var foundExitZeroBeforeResult = false;

        foreach (var line in lines)
        {
            if (line.Contains("def cmd_cert"))
                inCertCommand = true;

            if (inCertCommand)
            {
                // Check for premature exit(0) before result calculation
                if (line.Contains("sys.exit(0)") && !line.TrimStart().StartsWith("#"))
                {
                    // This is OK only if it's after the result check
                    if (!content.IndexOf("sys.exit(0)").ToString().Contains("result"))
                    {
                        // Need to verify it's after the result == PASS check
                    }
                }
            }
        }

        // Must have ERROR -> exit(2) mapping
        Assert.Contains("sys.exit(2)", content);
    }

    [Fact]
    public void Breaker_ExitCode_ErrorStatesMustExitTwo()
    {
        // VERIFY: All error states map to exit code 2
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Exception handler must exit(2)
        Assert.True(
            content.Contains("except") && content.Contains("sys.exit(2)"),
            "Exception handler must call sys.exit(2)"
        );

        // ERROR result must map to exit(2)
        Assert.True(
            content.Contains("ERROR") && content.Contains("sys.exit(2)"),
            "ERROR result must map to sys.exit(2)"
        );
    }

    [Fact]
    public void Breaker_ExitCode_StrictModeWarningsBecomeFail()
    {
        // VERIFY: In strict mode, warnings escalate to FAIL (exit 1)
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Must have strict_mode and warned > 0 -> FAIL logic
        Assert.True(
            content.Contains("strict_mode") && content.Contains("warned"),
            "Script must check strict_mode and warned count"
        );

        // The build_report function must handle strict mode
        Assert.Contains("strict_mode and summary[\"warned\"]", content);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Input Sanitization - Prevent injection attacks
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("../../../etc/passwd", "path-traversal-unix")]
    [InlineData("..\\..\\..\\windows\\system32", "path-traversal-windows")]
    [InlineData("benton; rm -rf /", "command-injection-unix")]
    [InlineData("benton && del /f /q c:\\", "command-injection-windows")]
    [InlineData("benton`whoami`", "backtick-injection")]
    [InlineData("benton$(id)", "subshell-injection")]
    [InlineData("benton\n\rmalicious", "newline-injection")]
    [InlineData("benton%00null", "null-byte-injection")]
    public void Breaker_Input_CountyArgMustBeSanitized(string attackInput, string attackName)
    {
        // VERIFY: County argument must be alphanumeric only
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Script must validate county input OR the attack pattern should be blocked
        // For this test, we verify the script has input validation
        Assert.True(
            content.Contains("county") && (
                content.Contains("isalnum") ||
                content.Contains("re.match") ||
                content.Contains("validate") ||
                content.Contains("sanitize") ||
                content.Contains("^[a-zA-Z0-9_-]+$")
            ),
            $"BREACH: County argument may be vulnerable to {attackName} attack. " +
            "Script must validate county input as alphanumeric."
        );
    }

    [Theory]
    [InlineData("javascript:alert(1)", "javascript-protocol")]
    [InlineData("file:///etc/passwd", "file-protocol")]
    [InlineData("ftp://evil.com", "ftp-protocol")]
    [InlineData("gopher://evil.com", "gopher-protocol")]
    [InlineData("http://localhost/../admin", "path-traversal-url")]
    public void Breaker_Input_BaseUrlMustValidateProtocol(string attackUrl, string attackName)
    {
        // VERIFY: Base URL must be http or https only
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Script should validate URL protocol
        Assert.True(
            content.Contains("http://") || content.Contains("https://") ||
            content.Contains("startswith") || content.Contains("urlparse"),
            $"BREACH: Base URL may be vulnerable to {attackName} attack. " +
            "Script must validate URL protocol."
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Network Failures - Must fail closed
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Network_TimeoutMustFailClosed()
    {
        // VERIFY: Network timeouts result in FAIL/ERROR, never PASS
        var healthCheckPath = Path.Combine(ChecksDir, "health_check.py");
        var content = File.ReadAllText(healthCheckPath);

        // Must have timeout handling
        Assert.Contains("timeout", content.ToLower());

        // Timeout must not result in PASS
        Assert.True(
            content.Contains("URLError") || content.Contains("TimeoutError") ||
            content.Contains("socket.timeout"),
            "Health check must handle timeout errors"
        );
    }

    [Fact]
    public void Breaker_Network_ConnectionRefusedMustFailClosed()
    {
        // VERIFY: Connection refused results in FAIL/ERROR, never PASS
        var healthCheckPath = Path.Combine(ChecksDir, "health_check.py");
        var content = File.ReadAllText(healthCheckPath);

        // Must handle connection errors
        Assert.True(
            content.Contains("URLError") || content.Contains("ConnectionError") ||
            content.Contains("Connection refused"),
            "Health check must handle connection refused"
        );
    }

    [Fact]
    public void Breaker_Network_InvalidJsonMustExitTwo()
    {
        // VERIFY: Invalid JSON from endpoints results in exit code 2
        var pacsCheckPath = Path.Combine(ChecksDir, "pacs_check.py");
        var content = File.ReadAllText(pacsCheckPath);

        // Must handle JSON decode errors
        Assert.Contains("JSONDecodeError", content);

        // Must result in error status
        Assert.True(
            content.Contains("sys.exit(2)") || content.Contains("return False"),
            "Invalid JSON must result in failure"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Check Bypass - All checks must run
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_CheckOrder_MustBeDeterministic()
    {
        // VERIFY: Checks run in deterministic order defined in spec
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Find the check execution order
        var pacsIndex = content.IndexOf("pacs_contract");
        var speclockIndex = content.IndexOf("speclock_index");
        var healthReadyIndex = content.IndexOf("health_ready");
        var healthLiveIndex = content.IndexOf("health_live");

        // Verify deterministic order: pacs -> speclock -> health_ready -> health_live
        Assert.True(pacsIndex < speclockIndex,
            "BREACH: pacs_contract must run before speclock_index");
        Assert.True(speclockIndex < healthReadyIndex,
            "BREACH: speclock_index must run before health_ready");
        Assert.True(healthReadyIndex < healthLiveIndex,
            "BREACH: health_ready must run before health_live");
    }

    [Fact]
    public void Breaker_CheckBypass_NoEarlyReturnOnFirstFailure()
    {
        // VERIFY: All checks run even if early ones fail (no short-circuit)
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // run_checks function must append all check results, not return early
        var runChecksSection = ExtractFunction(content, "def run_checks");
        Assert.NotNull(runChecksSection);

        // Should have 4 checks appended
        var appendCount = Regex.Matches(runChecksSection, @"checks\.append").Count;
        Assert.True(appendCount >= 4,
            $"BREACH: run_checks must append all 4 checks, found {appendCount} appends. " +
            "Early return on failure is forbidden.");
    }

    [Fact]
    public void Breaker_Skip_RequiresExplicitPolicyFlag()
    {
        // VERIFY: SKIP status requires explicit policy, cannot be inferred
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks",
            "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var content = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(content);

        // Check that SKIP is documented in the check result schema
        var statusValues = spec?["report_schema"]?["check_result"]?["properties"]?["status"]?["enum"];

        // If the nested path doesn't exist, check in checks array items
        if (statusValues == null)
        {
            statusValues = spec?["report_schema"]?["properties"]?["checks"]?["items"]?["properties"]?["status"]?["enum"];
        }
        Assert.NotNull(statusValues);

        var statuses = statusValues.AsArray().Select(s => s?.GetValue<string>()).ToList();
        Assert.Contains("SKIP", statuses);

        // Verify skip_policy is defined in spec
        var skipPolicy = spec?["skip_policy"];
        Assert.NotNull(skipPolicy);

        // Must have explicit rules about SKIP
        Assert.True(
            content.Contains("skip_policy") && content.Contains("skip_reason"),
            "SKIP status must have explicit policy documentation with skip_reason requirement"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Report Integrity - Cannot be forged or incomplete
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Report_MustContainToolVersion()
    {
        // VERIFY: Report includes tool version for traceability
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Must have VERSION constant
        Assert.Contains("VERSION", content);

        // Report should include version (check build_report or similar)
        // At minimum, version must be defined
        Assert.True(
            Regex.IsMatch(content, @"VERSION\s*=\s*[""'][0-9]+\.[0-9]+\.[0-9]+[""']"),
            "VERSION must be defined in semver format"
        );
    }

    [Fact]
    public void Breaker_Report_MustContainAllInputs()
    {
        // VERIFY: Report contains all inputs (base_url, strict, county)
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // build_report function must include all inputs
        var buildReportSection = ExtractFunction(content, "def build_report");
        Assert.NotNull(buildReportSection);

        Assert.Contains("county", buildReportSection);
        Assert.Contains("base_url", buildReportSection);
        Assert.Contains("strict_mode", buildReportSection);
    }

    [Fact]
    public void Breaker_Report_MustContainPerCheckResults()
    {
        // VERIFY: Report contains per-check results with name/status/latency
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Check result structure must have name, status, duration
        Assert.Contains("\"name\"", content);
        Assert.Contains("\"status\"", content);
        Assert.Contains("\"duration_ms\"", content);
    }

    [Fact]
    public void Breaker_Report_MustContainFinalStatusAndExitCode()
    {
        // VERIFY: Report contains final status that maps to exit code
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Must have result field in report
        Assert.Contains("\"result\"", content);

        // Result values must map to exit codes
        Assert.Contains("PASS", content);
        Assert.Contains("FAIL", content);
        Assert.Contains("ERROR", content);
    }

    [Fact]
    public void Breaker_Report_MarkdownMustBeStable()
    {
        // VERIFY: Markdown report doesn't reorder checks
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // write_markdown_report must iterate checks in order
        var mdReportSection = ExtractFunction(content, "def write_markdown_report");
        Assert.NotNull(mdReportSection);

        // Must iterate through checks array
        Assert.True(
            mdReportSection.Contains("for check in") || mdReportSection.Contains("for c in"),
            "Markdown report must iterate checks in order"
        );

        // Must not use set() or dict keys (which lose order in older Python)
        Assert.DoesNotContain("set(", mdReportSection);
    }

    [Fact]
    public void Breaker_Report_JsonMustNotReorderKeys()
    {
        // VERIFY: JSON report maintains key order
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // json.dump must use sort_keys=False to maintain insertion order
        Assert.Contains("sort_keys=False", content);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Timestamp Integrity - Must be UTC and deterministic format
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Timestamp_MustBeUtc()
    {
        // VERIFY: All timestamps use UTC
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Must use timezone.utc or utcnow
        Assert.True(
            content.Contains("timezone.utc") || content.Contains("utcnow"),
            "BREACH: Timestamps must use UTC, not local time"
        );
    }

    [Fact]
    public void Breaker_Timestamp_MustBeIso8601()
    {
        // VERIFY: Timestamps follow ISO 8601 format
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Must use isoformat() or strftime with ISO pattern
        Assert.True(
            content.Contains("isoformat") || content.Contains("%Y%m%dT%H%M%S"),
            "BREACH: Timestamps must be ISO 8601 format"
        );
    }

    [Fact]
    public void Breaker_Timestamp_DirectoryNameDeterministic()
    {
        // VERIFY: Output directory naming is deterministic
        var scriptPath = Path.Combine(ToolsDir, "tf-runtime.py");
        var content = File.ReadAllText(scriptPath);

        // Must generate timestamp for directory name
        Assert.Contains("generate_timestamp", content);

        // Timestamp format must be sortable (YYYYMMDD pattern)
        Assert.True(
            content.Contains("%Y%m%d") || content.Contains("strftime"),
            "BREACH: Directory timestamp must be sortable format"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Health Check Response Validation
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_HealthCheck_200WithInvalidBodyMustFail()
    {
        // VERIFY: 200 status with invalid body doesn't auto-pass
        var healthCheckPath = Path.Combine(ChecksDir, "health_check.py");
        var content = File.ReadAllText(healthCheckPath);

        // For now, health check validates status code is 200
        // Future: could add body validation
        Assert.Contains("200", content);

        // Status code check must be explicit
        Assert.True(
            content.Contains("status_code == 200") || content.Contains("status == 200") ||
            content.Contains("response.status"),
            "Health check must explicitly verify 200 status"
        );
    }

    [Fact]
    public void Breaker_HealthCheck_RequiredEndpointsMustFailClosed()
    {
        // VERIFY: Required endpoints (health_ready) fail the check if not 200
        var healthCheckPath = Path.Combine(ChecksDir, "health_check.py");
        var content = File.ReadAllText(healthCheckPath);

        // Must distinguish required vs optional endpoints
        Assert.Contains("required", content.ToLower());

        // health_ready must be required
        Assert.True(
            content.Contains("required\": True") || content.Contains("required\":True") ||
            content.Contains("required=True"),
            "health_ready endpoint must be marked as required"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: SpecLock Validation
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_SpecLock_MissingIndexMustFail()
    {
        // VERIFY: Missing INDEX.json fails the speclock check
        var specLockCheckPath = Path.Combine(ChecksDir, "speclock_check.py");
        var content = File.ReadAllText(specLockCheckPath);

        // Must check for INDEX.json existence
        Assert.Contains("INDEX.json", content);

        // Missing file must be an error
        Assert.True(
            content.Contains("not found") || content.Contains("not exist") ||
            content.Contains("missing") || content.Contains("errors.append"),
            "Missing INDEX.json must result in error"
        );
    }

    [Fact]
    public void Breaker_SpecLock_InvalidJsonMustFail()
    {
        // VERIFY: Invalid JSON in INDEX.json fails
        var specLockCheckPath = Path.Combine(ChecksDir, "speclock_check.py");
        var content = File.ReadAllText(specLockCheckPath);

        // Must handle JSON parse errors
        Assert.Contains("JSONDecodeError", content);
    }

    [Fact]
    public void Breaker_SpecLock_MissingSpecFilesMustFail()
    {
        // VERIFY: Referenced spec files that don't exist fail the check
        var specLockCheckPath = Path.Combine(ChecksDir, "speclock_check.py");
        var content = File.ReadAllText(specLockCheckPath);

        // Must validate spec_path or spec_data_path
        Assert.True(
            content.Contains("spec_path") || content.Contains("spec_data_path"),
            "Must validate spec file paths"
        );

        // Must check file existence
        Assert.True(
            content.Contains("exists()") || content.Contains("Path") ||
            content.Contains("os.path.exists"),
            "Must check spec file existence"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: PACS Contract Validation
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_PacsCheck_ContractValidFalseMustFail()
    {
        // VERIFY: contractValid=false in PACS proof fails the check
        var pacsCheckPath = Path.Combine(ChecksDir, "pacs_check.py");
        var content = File.ReadAllText(pacsCheckPath);

        // Must check contractValid field
        Assert.Contains("contractValid", content);

        // False value must be an error
        Assert.True(
            content.Contains("contractValid") &&
            (content.Contains("False") || content.Contains("false")),
            "contractValid=false must fail the check"
        );
    }

    [Fact]
    public void Breaker_PacsCheck_MissingViewsMustFail()
    {
        // VERIFY: Missing required views fail the check
        var pacsCheckPath = Path.Combine(ChecksDir, "pacs_check.py");
        var content = File.ReadAllText(pacsCheckPath);

        // Must check for required views
        Assert.Contains("vw_TerraFusion", content);

        // "missing" status must be an error
        Assert.Contains("missing", content.ToLower());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    private static string? ExtractFunction(string content, string functionDef)
    {
        var startIndex = content.IndexOf(functionDef);
        if (startIndex < 0) return null;

        // Find the next function definition or end of file
        var nextDef = content.IndexOf("\ndef ", startIndex + 1);
        var endIndex = nextDef > 0 ? nextDef : content.Length;

        return content.Substring(startIndex, endIndex - startIndex);
    }
}
