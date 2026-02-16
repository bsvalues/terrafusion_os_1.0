using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase12;

[Trait("Category", "Phase12")]
[Trait("Category", "Governance")]
public class OrphanInterfaceGuardTests
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
    /// The 10 interfaces fixed in Phase 12 must each have at least one
    /// concrete class implementing them in backend/src.
    /// </summary>
    [Theory]
    [InlineData("ICommonPasswordService", "CommonPasswordService")]
    [InlineData("IPasswordHistoryRepository", "InMemoryPasswordHistoryRepository")]
    [InlineData("IContextEnrichmentService", "ContextEnrichmentService")]
    [InlineData("IQuantumAIRoutingService", "QuantumAIRoutingService")]
    [InlineData("IWhiteboardService", "WhiteboardService")]
    [InlineData("IIntegrationService", "IntegrationService")]
    [InlineData("IAnalyticsService", "AnalyticsService")]
    [InlineData("IExportService", "ExportService")]
    [InlineData("ICitizenContextService", "CitizenContextService")]
    [InlineData("IServiceDiscoveryService", "ServiceDiscoveryService")]
    public void Phase12_Interface_Should_Have_Implementation(string interfaceName, string expectedImpl)
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        // Verify the interface exists
        var interfaceExists = csFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            return Regex.IsMatch(content, $@"public\s+interface\s+{Regex.Escape(interfaceName)}\b");
        });

        interfaceExists.Should().BeTrue(
            $"interface {interfaceName} must be declared in backend/src");

        // Verify a class implements it
        var implementationPattern = new Regex(
            $@"class\s+\w+[^{{]*:\s*[^{{]*{Regex.Escape(interfaceName)}\b",
            RegexOptions.Compiled);

        var hasImplementation = csFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            return implementationPattern.IsMatch(content);
        });

        hasImplementation.Should().BeTrue(
            $"interface {interfaceName} must have a concrete implementation class " +
            $"(expected: {expectedImpl}) — orphan interfaces are not allowed");
    }

    /// <summary>
    /// Guard: no new orphan interfaces may be introduced in Phase 12+ files.
    /// Scans only files created/modified in Phase 12+ for orphan interfaces.
    /// </summary>
    [Fact]
    public void No_New_Orphan_Interfaces_In_Security_Or_Abstractions()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var securityDir = Path.Combine(BackendSrcDir, "TerraFusion.Security");
        var abstractionsDir = Path.Combine(BackendSrcDir, "TerraFusion.Abstractions");

        var interfaceFiles = new List<string>();
        if (Directory.Exists(securityDir))
            interfaceFiles.AddRange(Directory.GetFiles(securityDir, "I*.cs", SearchOption.AllDirectories)
                .Where(f => !f.Contains("obj") && !f.Contains("bin")));
        if (Directory.Exists(abstractionsDir))
            interfaceFiles.AddRange(Directory.GetFiles(abstractionsDir, "I*.cs", SearchOption.AllDirectories)
                .Where(f => !f.Contains("obj") && !f.Contains("bin")));

        var allSrcFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var interfacePattern = new Regex(@"public\s+interface\s+(I\w+)", RegexOptions.Compiled);
        var orphans = new List<string>();

        foreach (var file in interfaceFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in interfacePattern.Matches(content))
            {
                var name = match.Groups[1].Value;
                var implPattern = new Regex(
                    $@"class\s+\w+[^{{]*:\s*[^{{]*{Regex.Escape(name)}\b",
                    RegexOptions.Compiled);

                var hasImpl = allSrcFiles.Any(f =>
                {
                    var src = File.ReadAllText(f);
                    return implPattern.IsMatch(src);
                });

                if (!hasImpl)
                {
                    var rel = Path.GetRelativePath(BackendSrcDir, file);
                    orphans.Add($"{name} ({rel})");
                }
            }
        }

        orphans.Should().BeEmpty(
            "all interfaces in TerraFusion.Security and TerraFusion.Abstractions " +
            "must have implementations — " +
            $"Found {orphans.Count} orphan(s): {string.Join(", ", orphans)}"
        );
    }
}
