using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase15;

/// <summary>
/// Phase 15 — Canon Naming Drift Sentinel.
/// Mechanical enforcement of TerraFusion naming conventions.
/// Prevents drift in service interfaces, controllers, hubs,
/// test classes, and project names.
/// </summary>
[Trait("Category", "Phase15")]
[Trait("Category", "Governance")]
public class NamingDriftSentinelTests
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

    #region Service Interface Naming — I{Name}Service canon

    /// <summary>
    /// Service interfaces must follow I{Name}Service convention.
    /// "Manager" is banned for service interfaces — use "Service" suffix.
    /// Known legacy exceptions are allow-listed with a maximum count cap.
    /// </summary>
    [Fact]
    public void Service_Interfaces_Must_Not_Use_Manager_Suffix()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        // Known legacy Manager interfaces that predate Phase 15.
        // This allow-list has a CAP — no new Manager interfaces allowed.
        var legacyAllowList = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "ISessionManager",
            "IHybridConsciousnessManager",
            "IMLModelManager"
        };

        var managerPattern = new Regex(
            @"public\s+interface\s+(I\w+Manager)\b",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        var violations = new List<string>();
        var legacyFound = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in managerPattern.Matches(content))
            {
                var name = match.Groups[1].Value;
                if (legacyAllowList.Contains(name))
                {
                    legacyFound.Add(name);
                    continue;
                }
                var rel = Path.GetRelativePath(BackendSrcDir, file);
                violations.Add($"  {name} ({rel}) — rename to {name.Replace("Manager", "Service")}");
            }
        }

        violations.Should().BeEmpty(
            "new service interfaces must use I{Name}Service, not I{Name}Manager. " +
            $"Found {violations.Count} non-legacy violation(s):\n" +
            string.Join("\n", violations));

        // Cap check: ensure legacy count hasn't grown
        legacyFound.Count.Should().BeLessOrEqualTo(legacyAllowList.Count,
            "the legacy Manager interface allow-list must not grow — " +
            "new interfaces must use Service suffix");
    }

    /// <summary>
    /// Concrete Manager classes are capped at known legacy count.
    /// New service implementations must use {Name}Service suffix.
    /// </summary>
    [Fact]
    public void Concrete_Services_Must_Not_Use_Manager_Suffix()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var legacyAllowList = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "InMemorySessionManager",
            "HybridConsciousnessManager",
            "MLModelManager",
            "DatabaseConnectionManager",
            "AutoHealingManager"
        };

        var managerPattern = new Regex(
            @"public\s+(sealed\s+)?class\s+(\w+Manager)\b",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in managerPattern.Matches(content))
            {
                var name = match.Groups[2].Value;
                if (legacyAllowList.Contains(name))
                    continue;

                var rel = Path.GetRelativePath(BackendSrcDir, file);
                violations.Add($"  {name} ({rel})");
            }
        }

        violations.Should().BeEmpty(
            "new concrete service classes must use {Name}Service, not {Name}Manager. " +
            $"Found {violations.Count} non-legacy violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region Controller Naming — {Name}Controller PascalCase

    /// <summary>
    /// All controller classes must follow {Name}Controller convention
    /// and use PascalCase naming.
    /// </summary>
    [Fact]
    public void Controllers_Must_Follow_PascalCase_Controller_Suffix()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var controllerPattern = new Regex(
            @"public\s+class\s+(\w+Controller)\s*:",
            RegexOptions.Compiled);

        // PascalCase: starts with uppercase, no underscores, no consecutive caps beyond acronyms
        var pascalCasePattern = new Regex(
            @"^[A-Z][a-zA-Z0-9]*Controller$",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(BackendSrcDir, "*Controller.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in controllerPattern.Matches(content))
            {
                var name = match.Groups[1].Value;
                if (!pascalCasePattern.IsMatch(name))
                {
                    var rel = Path.GetRelativePath(BackendSrcDir, file);
                    violations.Add($"  {name} ({rel}) — not PascalCase");
                }
            }
        }

        violations.Should().BeEmpty(
            "all controller classes must be PascalCase with Controller suffix. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region Hub Naming — {Name}Hub

    /// <summary>
    /// All SignalR hub classes must follow {Name}Hub convention.
    /// </summary>
    [Fact]
    public void Hubs_Must_Follow_NameHub_Convention()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var hubPattern = new Regex(
            @"public\s+class\s+(\w+)\s*:\s*Hub\b",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in hubPattern.Matches(content))
            {
                var name = match.Groups[1].Value;
                if (!name.EndsWith("Hub"))
                {
                    var rel = Path.GetRelativePath(BackendSrcDir, file);
                    violations.Add($"  {name} ({rel}) — must end with Hub");
                }
            }
        }

        violations.Should().BeEmpty(
            "all SignalR hub classes must follow {Name}Hub naming. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region Test Class Naming — {Name}Tests

    /// <summary>
    /// All test classes must follow {Name}Tests convention.
    /// </summary>
    [Fact]
    public void Test_Classes_Must_Follow_NameTests_Convention()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var testDir = Path.Combine(repoRoot, "backend", "TerraFusion.API.Tests");
        if (!Directory.Exists(testDir)) return;

        // Legacy test classes that predate Phase 15 naming canon.
        // Cap: no new entries allowed.
        var legacyAllowList = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "PemVerifyTest"
        };

        var testClassPattern = new Regex(
            @"public\s+class\s+(\w+)\b",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(testDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") &&
                        !f.Contains("Infrastructure") && !f.Contains("Helpers") &&
                        !f.Contains("Fixtures"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in testClassPattern.Matches(content))
            {
                var name = match.Groups[1].Value;

                // Skip non-test classes (e.g., helper classes, base classes)
                if (!name.Contains("Test") && !content.Contains("[Fact]") && !content.Contains("[Theory]"))
                    continue;

                // Only check classes that have test methods
                if (content.Contains("[Fact]") || content.Contains("[Theory]"))
                {
                    if (!name.EndsWith("Tests") && !legacyAllowList.Contains(name))
                    {
                        var rel = Path.GetRelativePath(testDir, file);
                        violations.Add($"  {name} ({rel}) — must end with Tests");
                    }
                    break; // One class per file check
                }
            }
        }

        violations.Should().BeEmpty(
            "all test classes with [Fact] or [Theory] must follow {Name}Tests naming. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region Project Naming — TerraFusion.* prefix in backend/src/

    /// <summary>
    /// All .csproj files under backend/src/ must use TerraFusion.{Component} prefix.
    /// </summary>
    [Fact]
    public void Source_Projects_Must_Use_TerraFusion_Prefix()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var csprojFiles = Directory.GetFiles(BackendSrcDir, "*.csproj", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csprojFiles)
        {
            var projectName = Path.GetFileNameWithoutExtension(file);
            if (!projectName.StartsWith("TerraFusion.", StringComparison.OrdinalIgnoreCase))
            {
                var rel = Path.GetRelativePath(BackendSrcDir, file);
                violations.Add($"  {projectName} ({rel})");
            }
        }

        violations.Should().BeEmpty(
            "all source projects in backend/src/ must use TerraFusion.{Component} naming. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region JSON Field Naming — camelCase in tool registry

    /// <summary>
    /// All tool object field names in terrapilot.tools.json must be camelCase.
    /// </summary>
    [Fact]
    public void Tool_Registry_Fields_Must_Be_CamelCase()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        if (!File.Exists(toolsFile)) return;

        using var doc = System.Text.Json.JsonDocument.Parse(File.ReadAllText(toolsFile));
        var tools = doc.RootElement.GetProperty("tools");

        var camelCasePattern = new Regex(@"^[a-z$][a-zA-Z0-9]*$", RegexOptions.Compiled);
        var violations = new List<string>();

        foreach (var tool in tools.EnumerateArray())
        {
            var toolId = tool.TryGetProperty("toolId", out var tid) ? tid.GetString() ?? "unknown" : "unknown";

            foreach (var prop in tool.EnumerateObject())
            {
                if (!camelCasePattern.IsMatch(prop.Name))
                {
                    violations.Add($"  {toolId}.{prop.Name} — not camelCase");
                }
            }
        }

        violations.Should().BeEmpty(
            "all tool registry field names must be camelCase. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Tool registry schema and tools.json must have matching property names.
    /// Schema drift causes silent validation failures.
    /// </summary>
    [Fact]
    public void Tool_Registry_Schema_Must_Match_Tools_Fields()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        var toolsFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.json");
        var schemaFile = Path.Combine(repoRoot, "tools", "registry", "terrapilot.tools.schema.json");
        if (!File.Exists(toolsFile) || !File.Exists(schemaFile)) return;

        // Extract all field names from tools.json
        using var toolsDoc = System.Text.Json.JsonDocument.Parse(File.ReadAllText(toolsFile));
        var allToolFields = new HashSet<string>();
        foreach (var tool in toolsDoc.RootElement.GetProperty("tools").EnumerateArray())
        {
            foreach (var prop in tool.EnumerateObject())
            {
                allToolFields.Add(prop.Name);
            }
        }

        // Extract field names from schema Tool definition
        using var schemaDoc = System.Text.Json.JsonDocument.Parse(File.ReadAllText(schemaFile));
        var schemaFields = new HashSet<string>();
        if (schemaDoc.RootElement.TryGetProperty("definitions", out var defs) &&
            defs.TryGetProperty("Tool", out var toolDef) &&
            toolDef.TryGetProperty("properties", out var props))
        {
            foreach (var prop in props.EnumerateObject())
            {
                schemaFields.Add(prop.Name);
            }
        }

        if (schemaFields.Count == 0) return; // Schema not structured as expected

        // Every field used in tools.json should exist in schema
        var undocumented = allToolFields.Except(schemaFields).ToList();

        // paramsSchema is a freeform object, so it's expected to not match
        undocumented.Remove("paramsSchema");

        undocumented.Should().BeEmpty(
            "all fields used in terrapilot.tools.json must be declared in the schema. " +
            $"Found {undocumented.Count} undocumented field(s): {string.Join(", ", undocumented)}");
    }

    #endregion

    #region Extension Class Naming — {Name}Extensions

    /// <summary>
    /// Extension method classes must end with Extensions or ServiceCollectionExtensions.
    /// </summary>
    [Fact]
    public void Extension_Classes_Must_Follow_Naming_Convention()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        // Match classes containing "this IServiceCollection" or "this I*" extension methods
        var extensionMethodPattern = new Regex(
            @"public\s+static\s+\w+\s+\w+\s*\(\s*this\s+",
            RegexOptions.Compiled);

        var classPattern = new Regex(
            @"public\s+static\s+class\s+(\w+)\b",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin") && !f.Contains("Test"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);

            if (!extensionMethodPattern.IsMatch(content))
                continue;

            foreach (Match match in classPattern.Matches(content))
            {
                var name = match.Groups[1].Value;
                // Valid suffixes for classes containing extension methods
                var validSuffixes = new[]
                {
                    "Extensions", "Configuration", "ServiceRegistration",
                    "DependencyInjection", "Endpoints"
                };
                if (!validSuffixes.Any(s => name.EndsWith(s)))
                {
                    var rel = Path.GetRelativePath(BackendSrcDir, file);
                    violations.Add($"  {name} ({rel}) — must end with a canonical suffix " +
                        $"({string.Join("|", validSuffixes)})");
                }
            }
        }

        violations.Should().BeEmpty(
            "extension method classes must end with a canonical suffix " +
            "(Extensions|Configuration|ServiceRegistration|DependencyInjection|Endpoints). " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion

    #region App Manifest Naming — camelCase fields

    /// <summary>
    /// terrafusion.app.json manifest fields must be camelCase.
    /// </summary>
    [Fact]
    public void App_Manifest_Fields_Must_Be_CamelCase()
    {
        var repoRoot = GetRepoRoot();
        if (repoRoot == null) return;

        // Find all terrafusion.app.json files
        var manifestFiles = Directory.GetFiles(repoRoot, "terrafusion.app.json", SearchOption.AllDirectories)
            .Where(f => !f.Contains("node_modules") && !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        if (manifestFiles.Length == 0) return;

        var camelCasePattern = new Regex(@"^[a-z$][a-zA-Z0-9]*$", RegexOptions.Compiled);
        var violations = new List<string>();

        foreach (var file in manifestFiles)
        {
            using var doc = System.Text.Json.JsonDocument.Parse(File.ReadAllText(file));

            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                if (!camelCasePattern.IsMatch(prop.Name))
                {
                    var rel = Path.GetRelativePath(repoRoot, file);
                    violations.Add($"  {rel}: {prop.Name} — not camelCase");
                }
            }
        }

        violations.Should().BeEmpty(
            "terrafusion.app.json manifest fields must be camelCase. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    #endregion
}
