using System.Text.Json;
using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase14;

/// <summary>
/// Phase 14 — Tool RiskPolicy + Write-Lane Enforcement.
/// Ensures the TerraPilot tool registry enforces risk levels,
/// write-lane ownership, and that backend authorization policies
/// referenced by controllers are actually registered.
/// </summary>
[Trait("Category", "Phase14")]
[Trait("Category", "Governance")]
public class ToolRiskPolicyTests
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

    private static string? GetRepoRoot()
    {
        if (string.IsNullOrEmpty(BackendSrcDir)) return null;
        return Path.GetDirectoryName(Path.GetDirectoryName(BackendSrcDir));
    }

    #region Tool Registry — Risk + WriteLane Invariants

    /// <summary>
    /// Every tool with risk != "read_only" MUST declare a non-null writeLane.
    /// Write operations need lane discipline to prevent cross-service mutation.
    /// </summary>
    [Fact]
    public void Write_Tools_Must_Declare_WriteLane()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.GetProperty("toolId").GetString()!;
            var risk = tool.GetProperty("risk").GetString()!;
            var writeLane = tool.TryGetProperty("writeLane", out var wl)
                ? wl.ValueKind == JsonValueKind.Null ? null : wl.GetString()
                : null;

            if (risk != "read_only" && string.IsNullOrEmpty(writeLane))
            {
                violations.Add($"  {toolId} (risk={risk}) has no writeLane");
            }
        }

        violations.Should().BeEmpty(
            "all tools with risk > read_only must declare a writeLane for ownership discipline. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Read-only tools MUST have writeLane = null.
    /// A read-only tool with a write lane is a contradiction.
    /// </summary>
    [Fact]
    public void ReadOnly_Tools_Must_Have_Null_WriteLane()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.GetProperty("toolId").GetString()!;
            var risk = tool.GetProperty("risk").GetString()!;
            var writeLane = tool.TryGetProperty("writeLane", out var wl)
                ? wl.ValueKind == JsonValueKind.Null ? null : wl.GetString()
                : null;

            if (risk == "read_only" && !string.IsNullOrEmpty(writeLane))
            {
                violations.Add($"  {toolId} (read_only) declares writeLane={writeLane}");
            }
        }

        violations.Should().BeEmpty(
            "read_only tools must have writeLane=null — a read tool should not own a write lane. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Irreversible tools MUST require supervisor approval.
    /// The schema mandates requiresSupervisorApproval for irreversible risk.
    /// </summary>
    [Fact]
    public void Irreversible_Tools_Must_Require_Supervisor_Approval()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.GetProperty("toolId").GetString()!;
            var risk = tool.GetProperty("risk").GetString()!;

            if (risk == "irreversible")
            {
                var requiresSupervisor = tool.TryGetProperty("requiresSupervisorApproval", out var rs)
                    && rs.GetBoolean();

                if (!requiresSupervisor)
                {
                    violations.Add($"  {toolId} (irreversible) missing requiresSupervisorApproval=true");
                }
            }
        }

        violations.Should().BeEmpty(
            "irreversible tools must require supervisor approval — " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Write-high and irreversible tools MUST require user confirmation.
    /// </summary>
    [Fact]
    public void High_Risk_Tools_Must_Require_Confirmation()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.GetProperty("toolId").GetString()!;
            var risk = tool.GetProperty("risk").GetString()!;

            if (risk is "write_high" or "irreversible")
            {
                var requiresConfirmation = tool.TryGetProperty("requiresConfirmation", out var rc)
                    && rc.GetBoolean();

                if (!requiresConfirmation)
                {
                    violations.Add($"  {toolId} (risk={risk}) missing requiresConfirmation=true");
                }
            }
        }

        violations.Should().BeEmpty(
            "write_high and irreversible tools must require user confirmation — " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Tool risk values must be from the canonical enum: read_only, write_low, write_high, irreversible.
    /// </summary>
    [Fact]
    public void Tool_Risk_Values_Must_Be_Canonical()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        var validRisks = new HashSet<string> { "read_only", "write_low", "write_high", "irreversible" };

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.GetProperty("toolId").GetString()!;
            var risk = tool.GetProperty("risk").GetString()!;

            if (!validRisks.Contains(risk))
            {
                violations.Add($"  {toolId} has invalid risk={risk}");
            }
        }

        violations.Should().BeEmpty(
            "all tool risk values must be canonical (read_only|write_low|write_high|irreversible). " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// WriteLane values must be from canonical suites: dais, forge, os, dossier, atlas, pilot, gpt.
    /// </summary>
    [Fact]
    public void WriteLane_Values_Must_Be_Canonical_Suites()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        var validLanes = new HashSet<string> { "forge", "atlas", "dais", "dossier", "os", "pilot", "gpt" };

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.GetProperty("toolId").GetString()!;
            if (tool.TryGetProperty("writeLane", out var wl) && wl.ValueKind != JsonValueKind.Null)
            {
                var lane = wl.GetString()!;
                if (!validLanes.Contains(lane))
                {
                    violations.Add($"  {toolId} has non-canonical writeLane={lane}");
                }
            }
        }

        violations.Should().BeEmpty(
            "writeLane values must be canonical suites (forge|atlas|dais|dossier|os|pilot|gpt). " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region Authorization Policy Registration

    /// <summary>
    /// Every [Authorize(Policy = "X")] used on a controller MUST be
    /// registered in AddAuthorization(). Unregistered policies cause
    /// runtime 500 errors on first request.
    /// </summary>
    [Fact]
    public void All_Referenced_Policies_Must_Be_Registered()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        // Step 1: Find all Policy references in [Authorize] attributes
        var policyRefPattern = new Regex(
            @"\[Authorize\s*\(\s*Policy\s*=\s*""(\w+)""",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        var referencedPolicies = new HashSet<string>();
        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in policyRefPattern.Matches(content))
            {
                referencedPolicies.Add(match.Groups[1].Value);
            }
        }

        // Step 2: Find all registered policies in AddAuthorization
        var registeredPolicies = new HashSet<string>();
        var addPolicyPattern = new Regex(
            @"AddPolicy\s*\(\s*""(\w+)""",
            RegexOptions.Compiled);

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in addPolicyPattern.Matches(content))
            {
                registeredPolicies.Add(match.Groups[1].Value);
            }
        }

        var unregistered = referencedPolicies.Except(registeredPolicies).ToList();

        unregistered.Should().BeEmpty(
            "every [Authorize(Policy = \"X\")] must have a matching AddPolicy(\"X\") registration. " +
            "Unregistered policies cause runtime 500 errors. " +
            $"Found {unregistered.Count} unregistered policy(ies): {string.Join(", ", unregistered)}");
    }

    /// <summary>
    /// Critical controllers that handle sensitive operations must have
    /// class-level [Authorize] or [AllowAnonymous] attributes.
    /// Phase 14 focuses on controllers with policy-gated access or
    /// AI agent execution endpoints.
    /// </summary>
    [Theory]
    [InlineData("CoPilotController.cs")]
    [InlineData("AISwarmController.cs")]
    [InlineData("EliteSecurityController.cs")]
    [InlineData("MultiCountyIntegrationController.cs")]
    public void Critical_Controllers_Must_Have_Authorization(string fileName)
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var files = Directory.GetFiles(BackendSrcDir, fileName, SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        if (files.Length == 0)
            return; // Controller not present in this checkout

        var authorizePattern = new Regex(@"\[Authorize", RegexOptions.Compiled);
        var allowAnonymousPattern = new Regex(@"\[AllowAnonymous\]", RegexOptions.Compiled);

        foreach (var file in files)
        {
            var content = File.ReadAllText(file);
            var hasAuth = authorizePattern.IsMatch(content) || allowAnonymousPattern.IsMatch(content);

            hasAuth.Should().BeTrue(
                $"{fileName} must have [Authorize] or [AllowAnonymous] — " +
                "unsecured controllers handling sensitive operations violate FISMA-HIGH");
        }
    }

    #endregion

    #region Tool Registry Schema Compliance

    /// <summary>
    /// The tool registry must validate against the schema.
    /// Every tool must have required fields: toolId, suite, risk.
    /// </summary>
    [Fact]
    public void All_Tools_Must_Have_Required_Fields()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        var index = 0;
        foreach (var tool in tools.EnumerateArray())
        {
            var missingFields = new List<string>();

            if (!tool.TryGetProperty("toolId", out _)) missingFields.Add("toolId");
            if (!tool.TryGetProperty("suite", out _)) missingFields.Add("suite");
            if (!tool.TryGetProperty("risk", out _)) missingFields.Add("risk");

            if (missingFields.Count > 0)
            {
                var toolId = tool.TryGetProperty("toolId", out var tid)
                    ? tid.GetString() ?? $"tool[{index}]"
                    : $"tool[{index}]";
                violations.Add($"  {toolId} missing: {string.Join(", ", missingFields)}");
            }
            index++;
        }

        violations.Should().BeEmpty(
            "every tool must declare required fields (toolId, suite, risk). " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Every tool's suite value must match the canonical enum from the schema.
    /// </summary>
    [Fact]
    public void Tool_Suite_Values_Must_Be_Canonical()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        var validSuites = new HashSet<string> { "forge", "atlas", "dais", "dossier", "os", "pilot", "gpt" };

        using var doc = JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var violations = new List<string>();
        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.GetProperty("toolId").GetString()!;
            var suite = tool.GetProperty("suite").GetString()!;

            if (!validSuites.Contains(suite))
            {
                violations.Add($"  {toolId} has non-canonical suite={suite}");
            }
        }

        violations.Should().BeEmpty(
            "all tool suite values must be canonical (forge|atlas|dais|dossier|os|pilot|gpt). " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion
}
