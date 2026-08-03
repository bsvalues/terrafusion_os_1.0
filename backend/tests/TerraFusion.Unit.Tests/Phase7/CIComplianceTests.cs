using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase7;

/// <summary>
/// Governance tests that prevent CI-blocking regressions.
/// Phase 7: Ensures required checks have no temporary escape hatches, eslint config is singular,
/// and Dockerfile pins nginx to a specific version.
/// </summary>
[Trait("Phase", "7")]
[Trait("Component", "CI")]
[Trait("Category", "Governance")]
public sealed class CIComplianceTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null && !File.Exists(Path.Combine(dir, "pnpm-workspace.yaml")))
            dir = Directory.GetParent(dir)?.FullName;
        return dir ?? throw new InvalidOperationException("Could not find repo root (pnpm-workspace.yaml)");
    }

    [Fact]
    public void SealGateWorkflow_RequiredChecksHaveNoTemporaryEscapeHatches()
    {
        // Arrange
        var workflowPath = Path.Combine(RepoRoot, ".github", "workflows", "seal-gate-fast.yml");
        File.Exists(workflowPath).Should().BeTrue("seal-gate-fast.yml must exist");

        var content = File.ReadAllText(workflowPath);

        content.Should().NotMatchRegex(
            @"(?i)(escape[- ]?hatch|temporar(?:y|ily)\s+non[- ]blocking|cutoff\s*[:=]|expires?\s+\d{4}-\d{2}-\d{2})",
            "temporary and date-based required-check bypasses are prohibited");

        var stepBlocks = Regex.Matches(
                content,
                @"(?ms)^\s{6}- name:\s*(?<name>[^\r\n]+)\r?\n(?<body>.*?)(?=^\s{6}- name:|\z)")
            .Cast<Match>()
            .Where(match => Regex.IsMatch(match.Value, @"(?m)^\s*continue-on-error:\s*true\s*$"))
            .ToArray();

        var softFailStepIds = stepBlocks
            .Select(match => Regex.Match(match.Value, @"(?m)^\s*id:\s*(?<id>[^\s#]+)\s*$"))
            .Select(match => match.Success ? match.Groups["id"].Value : "<missing>");

        softFailStepIds.Should().Equal("scope-classifier", "shape-guard");

        stepBlocks.Single(match => match.Groups["name"].Value == "Scope classifier (optional)").Value
            .Should().Contain("if: hashFiles('tools/scope-classifier/package.json') != ''",
                "the only unenforced soft-fail step must remain an explicitly optional diagnostic");

        content.Should().MatchRegex(
            @"(?ms)^\s{6}- name:\s*Repo shape guard \(root spine allowlist\).*?^\s*id:\s*shape-guard\s*$.*?^\s*continue-on-error:\s*true\s*$.*?^\s{6}- name:\s*Repo shape guard enforcement\s*$\r?\n\s*if:\s*steps\.shape-guard\.outcome == 'failure'\s*$",
            "the shape guard may collect a failure only when the next step enforces its outcome");
    }

    [Fact]
    public void FrontendEslintConfig_SingleSource()
    {
        // Arrange — only ONE eslint config should exist (the .cjs)
        var frontendDir = Path.Combine(RepoRoot, "frontend");

        var eslintCjs = File.Exists(Path.Combine(frontendDir, ".eslintrc.cjs"));
        var eslintJson = File.Exists(Path.Combine(frontendDir, ".eslintrc.json"));
        var eslintJs = File.Exists(Path.Combine(frontendDir, ".eslintrc.js"));

        // Assert — exactly one config should exist
        eslintCjs.Should().BeTrue(".eslintrc.cjs should be the single ESLint config");
        eslintJson.Should().BeFalse(".eslintrc.json conflicts with .eslintrc.cjs — delete it");
        eslintJs.Should().BeFalse(".eslintrc.js conflicts with .eslintrc.cjs — delete it");
    }

    [Fact]
    public void FrontendDockerfile_NginxVersionPinned()
    {
        // Arrange
        var dockerfilePath = Path.Combine(RepoRoot, "frontend", "Dockerfile");
        File.Exists(dockerfilePath).Should().BeTrue("frontend/Dockerfile must exist");

        var content = File.ReadAllText(dockerfilePath);

        // Act — find the nginx FROM line
        var match = Regex.Match(content, @"FROM\s+nginx:(\S+)\s+AS\s+production");
        match.Success.Should().BeTrue("Dockerfile must contain a nginx production stage");

        var tag = match.Groups[1].Value;

        // Assert — tag must be pinned (contains a version number, not just 'alpine')
        tag.Should().NotBe("alpine", "nginx must be pinned to a specific version, not bare 'alpine'");
        tag.Should().NotBe("latest", "nginx must not use 'latest' tag");
        tag.Should().MatchRegex(@"\d+\.\d+",
            "nginx tag must include a version number (e.g., 1.27-alpine)");
    }
}
