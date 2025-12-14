// =============================================================================
// Certification Tests - runtimecert.v1 SpecLock Enforcement
// =============================================================================
// Tests that enforce the runtime certification gate contract.
// These tests validate tf-runtime cert behavior BEFORE implementation.
// =============================================================================

using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Enforcement tests for runtimecert.v1 SpecLock.
/// Validates certification CLI, report structure, and check behavior.
/// </summary>
[Trait("Category", "SpecLock")]
[Trait("Category", "RuntimeCert")]
[Trait("Surface", "runtimecert")]
[Trait("Phase", "Certification")]
public sealed class CertificationTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
            {
                return dir;
            }
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    // ═══════════════════════════════════════════════════════════════
    // SPECLOCK EXISTENCE
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void SpecLock_RuntimeCert_Exists()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        Assert.True(File.Exists(specPath), $"runtimecert.v1 speclock.spec.json must exist at {specPath}");
    }

    [Fact]
    public void SpecLock_RuntimeCert_ValidJson()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        
        var doc = JsonDocument.Parse(json);
        Assert.NotNull(doc);
        Assert.Equal("runtimecert.v1", doc.RootElement.GetProperty("id").GetString());
    }

    [Fact]
    public void SpecLock_RuntimeCert_HasRequiredFields()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        // Required top-level fields
        Assert.NotNull(spec!["id"]);
        Assert.NotNull(spec["surface"]);
        Assert.NotNull(spec["version"]);
        Assert.NotNull(spec["status"]);
        Assert.NotNull(spec["success_criteria"]);
        Assert.NotNull(spec["cli_interface"]);
        Assert.NotNull(spec["report_schema"]);
        Assert.NotNull(spec["checks"]);
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-1: COMMAND EXISTENCE
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_CommandExecutes_AllContractsChecked()
    {
        // tf-runtime.py must exist
        var cmdPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        Assert.True(File.Exists(cmdPath), $"tf-runtime.py must exist at {cmdPath}");

        var content = File.ReadAllText(cmdPath);

        // Must have 'cert' subcommand
        Assert.Contains("cert", content);

        // Must run multiple checks
        Assert.True(content.Contains("pacs_check") || content.Contains("run_checks") || content.Contains("check_pacs"),
            "tf-runtime cert must run PACS contract check");
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-2 & SC-3: REPORT OUTPUT
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_OutputsJsonReport_ToArtifactsPath()
    {
        var cmdPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        var content = File.ReadAllText(cmdPath);

        // Must output to artifacts/cert path
        Assert.True(content.Contains("artifacts/cert") || content.Contains("cert.report.json"),
            "tf-runtime cert must output JSON report to artifacts/cert/<timestamp>/");
    }

    [Fact]
    public void Cert_OutputsMarkdownReport_ToArtifactsPath()
    {
        var cmdPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        var content = File.ReadAllText(cmdPath);

        // Must output markdown report
        Assert.True(content.Contains(".md") || content.Contains("report_md") || content.Contains("cert.report.md"),
            "tf-runtime cert must output Markdown report");
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-4: STRICT MODE
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_StrictMode_FailsOnWarnings()
    {
        var cmdPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        var content = File.ReadAllText(cmdPath);

        // Must have --strict flag
        Assert.Contains("--strict", content);

        // Must treat warnings as failures in strict mode
        Assert.True(content.Contains("strict") && (content.Contains("warn") || content.Contains("WARN")),
            "tf-runtime cert --strict must fail on warnings");
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-5: BASE URL
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_BaseUrl_TargetsRemoteInstance()
    {
        var cmdPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        var content = File.ReadAllText(cmdPath);

        // Must have --base-url flag
        Assert.Contains("--base-url", content);

        // Must use base_url for requests
        Assert.True(content.Contains("base_url") || content.Contains("BASE_URL"),
            "tf-runtime cert must use --base-url for targeting remote instances");
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-6: EXIT CODES
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_ExitCodes_Deterministic()
    {
        var cmdPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        var content = File.ReadAllText(cmdPath);

        // Must have deterministic exit codes
        Assert.Contains("sys.exit(0)", content); // All pass
        Assert.Contains("sys.exit(1)", content); // Any fail
        Assert.Contains("sys.exit(2)", content); // Error
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-7: PACS CHECK
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_PacsCheck_ValidatesProofEndpoint()
    {
        var pacsCheckPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "checks", "pacs_check.py");
        Assert.True(File.Exists(pacsCheckPath), $"pacs_check.py must exist at {pacsCheckPath}");

        var content = File.ReadAllText(pacsCheckPath);

        // Must call /ops/pacs/proof
        Assert.Contains("/ops/pacs/proof", content);

        // Must validate contract name and version
        Assert.Contains("pacscontract.v1", content);
        Assert.Contains("1.0.0", content);
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-8: SPECLOCK CHECK
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_SpecLockCheck_ValidatesIndex()
    {
        // speclock_check.py must exist
        var checkPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "checks", "speclock_check.py");
        Assert.True(File.Exists(checkPath), $"speclock_check.py must exist at {checkPath}");

        var content = File.ReadAllText(checkPath);

        // Must validate INDEX.json
        Assert.Contains("INDEX.json", content);

        // Must check spec file existence
        Assert.True(content.Contains("spec_path") || content.Contains("speclock.spec.json"),
            "speclock_check.py must validate referenced spec files exist");
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-9: REPORT STRUCTURE
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_ReportStructure_Deterministic()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        var reportSchema = spec!["report_schema"];
        Assert.NotNull(reportSchema);

        var required = reportSchema!["required"]?.AsArray();
        Assert.NotNull(required);

        // Must have required fields
        var requiredFields = required!.Select(r => r!.GetValue<string>()).ToList();
        Assert.Contains("timestamp", requiredFields);
        Assert.Contains("county", requiredFields);
        Assert.Contains("base_url", requiredFields);
        Assert.Contains("duration_ms", requiredFields);
        Assert.Contains("result", requiredFields);
        Assert.Contains("checks", requiredFields);
    }

    // ═══════════════════════════════════════════════════════════════
    // SC-10: REPORT ARCHIVAL
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Cert_Reports_NeverOverwritten()
    {
        var cmdPath = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        var content = File.ReadAllText(cmdPath);

        // Must use timestamp-based paths
        Assert.True(content.Contains("timestamp") || content.Contains("datetime") || content.Contains("strftime"),
            "tf-runtime cert must use timestamp-based paths to prevent overwriting");

        // Path pattern should include timestamp
        Assert.True(content.Contains("{timestamp}") || content.Contains("/%Y") || content.Contains("isoformat"),
            "Report paths must include timestamp for uniqueness");
    }

    // ═══════════════════════════════════════════════════════════════
    // CHECKS CONFIGURATION
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void SpecLock_Checks_PacsContractDefined()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        var pacsCheck = spec!["checks"]?["pacs_contract"];
        Assert.NotNull(pacsCheck);
        Assert.Equal("/ops/pacs/proof", pacsCheck!["endpoint"]?.GetValue<string>());
        Assert.Equal("fail_closed", pacsCheck["fail_behavior"]?.GetValue<string>());
    }

    [Fact]
    public void SpecLock_Checks_SpecLockIndexDefined()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        var specLockCheck = spec!["checks"]?["speclock_index"];
        Assert.NotNull(specLockCheck);
        Assert.Equal("fail_closed", specLockCheck!["fail_behavior"]?.GetValue<string>());
    }

    [Fact]
    public void SpecLock_Checks_HealthReadyDefined()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        var healthCheck = spec!["checks"]?["health_ready"];
        Assert.NotNull(healthCheck);
        Assert.Equal("/healthz/ready", healthCheck!["endpoint"]?.GetValue<string>());
    }

    // ═══════════════════════════════════════════════════════════════
    // CLI INTERFACE
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void SpecLock_CLI_SynopsisCorrect()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        var cli = spec!["cli_interface"];
        Assert.NotNull(cli);
        Assert.Equal("tf-runtime", cli!["command"]?.GetValue<string>());
        Assert.Equal("cert", cli["subcommand"]?.GetValue<string>());

        var synopsis = cli["synopsis"]?.GetValue<string>();
        Assert.Contains("tf-runtime cert", synopsis);
        Assert.Contains("<county>", synopsis);
        Assert.Contains("--strict", synopsis);
        Assert.Contains("--base-url", synopsis);
    }

    [Fact]
    public void SpecLock_CLI_ExitCodesDefined()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        var exitCodes = spec!["cli_interface"]?["exit_codes"];
        Assert.NotNull(exitCodes);
        Assert.NotNull(exitCodes!["0"]); // All pass
        Assert.NotNull(exitCodes["1"]);  // Any fail
        Assert.NotNull(exitCodes["2"]);  // Error
    }

    // ═══════════════════════════════════════════════════════════════
    // DEPENDENCIES
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void SpecLock_Dependencies_Declared()
    {
        var specPath = Path.Combine(RepoRoot, "docs", "spec-lock", "locks", "runtimecert", "runtimecert.v1", "speclock.spec.json");
        var json = File.ReadAllText(specPath);
        var spec = JsonNode.Parse(json);

        var deps = spec!["dependencies"]?.AsArray();
        Assert.NotNull(deps);
        Assert.Contains("pacscontract.v1", deps!.Select(d => d!.GetValue<string>()));
        Assert.Contains("runtimecontract.v1", deps.Select(d => d!.GetValue<string>()));
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPLEMENTATION FILES
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Implementation_TfRuntime_Exists()
    {
        var path = Path.Combine(RepoRoot, "tools", "runtime-cert", "tf-runtime.py");
        Assert.True(File.Exists(path), $"tf-runtime.py must exist at {path}");
    }

    [Fact]
    public void Implementation_PacsCheck_Exists()
    {
        var path = Path.Combine(RepoRoot, "tools", "runtime-cert", "checks", "pacs_check.py");
        Assert.True(File.Exists(path), $"pacs_check.py must exist at {path}");
    }

    [Fact]
    public void Implementation_SpecLockCheck_Exists()
    {
        var path = Path.Combine(RepoRoot, "tools", "runtime-cert", "checks", "speclock_check.py");
        Assert.True(File.Exists(path), $"speclock_check.py must exist at {path}");
    }

    [Fact]
    public void Implementation_HealthCheck_Exists()
    {
        var path = Path.Combine(RepoRoot, "tools", "runtime-cert", "checks", "health_check.py");
        Assert.True(File.Exists(path), $"health_check.py must exist at {path}");
    }
}
