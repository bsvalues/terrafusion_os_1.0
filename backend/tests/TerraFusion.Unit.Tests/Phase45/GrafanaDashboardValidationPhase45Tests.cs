// =============================================================================
// Phase 45: Grafana Dashboard Validation Tests — Spec Lock Enforcement
// =============================================================================
// OPS SPEC LOCK v1.0.0
// Parses DASHBOARD_SPEC_LOCK_v1.0.0.md and enforces:
// - Exact dashboard UID + title
// - Exact panel titles + exact PromQL
// - Unknown metrics → FAIL
// - Banned labels → FAIL
// =============================================================================

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase45;

/// <summary>
/// Comprehensive Phase 45 dashboard validation that:
/// - Loads dashboard JSON files
/// - Parses the Dashboard Spec Lock markdown
/// - Validates UID + title
/// - Recursively extracts all panels + PromQL targets
/// - Enforces exact panel titles + exact PromQL (string equality)
/// - Fails hard on unknown metrics and banned labels
/// </summary>
[Trait("Phase", "45")]
[Trait("Component", "GrafanaDashboards")]
[Trait("Category", "Core")]
public sealed class GrafanaDashboardValidationPhase45Tests
{
    // Paths relative to repo root (tests may run from different directories)
    private const string SpecRelativePath = "grafana/phase45/DASHBOARD_SPEC_LOCK_v1.0.0.md";
    private const string OpsDashboardRelativePath = "grafana/phase45/atlas-auto-remediation-benton-ops.json";
    private const string GovDashboardRelativePath = "grafana/phase45/atlas-auto-remediation-governance.json";

    #region Main Validation Test

    [Fact]
    public void Phase45_Dashboards_Match_SpecLock_And_DoNot_Reference_UnknownMetrics_Or_BannedLabels()
    {
        var spec = DashboardSpecLock.ParseFromMarkdown(ReadRepoText(SpecRelativePath));

        ValidateDashboard(
            dashboardPath: OpsDashboardRelativePath,
            expectedUid: spec.OpsDashboard.Uid,
            expectedTitle: spec.OpsDashboard.Title,
            expectedPanels: spec.OpsDashboard.PanelsByTitle,
            allowedMetricNames: spec.AllowedMetricNames,
            bannedLabels: spec.BannedLabels);

        ValidateDashboard(
            dashboardPath: GovDashboardRelativePath,
            expectedUid: spec.GovernanceDashboard.Uid,
            expectedTitle: spec.GovernanceDashboard.Title,
            expectedPanels: spec.GovernanceDashboard.PanelsByTitle,
            allowedMetricNames: spec.AllowedMetricNames,
            bannedLabels: spec.BannedLabels);
    }

    #endregion

    #region Individual Validation Tests

    [Fact]
    public void BentonOpsDashboard_Exists()
    {
        var path = GetRepoFilePath(OpsDashboardRelativePath);
        File.Exists(path).Should().BeTrue($"Benton Ops dashboard should exist at {path}");
    }

    [Fact]
    public void GovernanceDashboard_Exists()
    {
        var path = GetRepoFilePath(GovDashboardRelativePath);
        File.Exists(path).Should().BeTrue($"Governance dashboard should exist at {path}");
    }

    [Fact]
    public void SpecLock_Exists()
    {
        var path = GetRepoFilePath(SpecRelativePath);
        File.Exists(path).Should().BeTrue($"Dashboard Spec Lock should exist at {path}");
    }

    [Fact]
    public void BentonOpsDashboard_HasCorrectUid()
    {
        var spec = DashboardSpecLock.ParseFromMarkdown(ReadRepoText(SpecRelativePath));
        var json = ReadRepoText(OpsDashboardRelativePath);
        using var doc = JsonDocument.Parse(json);

        var uid = GetStringRequired(doc.RootElement, "uid");
        uid.Should().Be(spec.OpsDashboard.Uid, "Benton Ops dashboard UID must match spec lock");
    }

    [Fact]
    public void BentonOpsDashboard_HasCorrectTitle()
    {
        var spec = DashboardSpecLock.ParseFromMarkdown(ReadRepoText(SpecRelativePath));
        var json = ReadRepoText(OpsDashboardRelativePath);
        using var doc = JsonDocument.Parse(json);

        var title = GetStringRequired(doc.RootElement, "title");
        title.Should().Be(spec.OpsDashboard.Title, "Benton Ops dashboard title must match spec lock");
    }

    [Fact]
    public void GovernanceDashboard_HasCorrectUid()
    {
        var spec = DashboardSpecLock.ParseFromMarkdown(ReadRepoText(SpecRelativePath));
        var json = ReadRepoText(GovDashboardRelativePath);
        using var doc = JsonDocument.Parse(json);

        var uid = GetStringRequired(doc.RootElement, "uid");
        uid.Should().Be(spec.GovernanceDashboard.Uid, "Governance dashboard UID must match spec lock");
    }

    [Fact]
    public void GovernanceDashboard_HasCorrectTitle()
    {
        var spec = DashboardSpecLock.ParseFromMarkdown(ReadRepoText(SpecRelativePath));
        var json = ReadRepoText(GovDashboardRelativePath);
        using var doc = JsonDocument.Parse(json);

        var title = GetStringRequired(doc.RootElement, "title");
        title.Should().Be(spec.GovernanceDashboard.Title, "Governance dashboard title must match spec lock");
    }

    [Theory]
    [InlineData("atlas-auto-remediation-benton-ops.json")]
    [InlineData("atlas-auto-remediation-governance.json")]
    public void Dashboard_IsValidJson(string filename)
    {
        var path = GetRepoFilePath($"grafana/phase45/{filename}");
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var parseAction = () => JsonDocument.Parse(json);
        parseAction.Should().NotThrow($"Dashboard {filename} should be valid JSON");
    }

    [Theory]
    [InlineData("atlas-auto-remediation-benton-ops.json")]
    [InlineData("atlas-auto-remediation-governance.json")]
    public void Dashboard_UsesOnlyAllowedMetrics(string filename)
    {
        var spec = DashboardSpecLock.ParseFromMarkdown(ReadRepoText(SpecRelativePath));
        var json = ReadRepoText($"grafana/phase45/{filename}");
        using var doc = JsonDocument.Parse(json);

        var panels = ExtractPanelsRecursive(doc.RootElement);

        foreach (var panel in panels)
        {
            foreach (var expr in panel.PromQlExpressions)
            {
                var metricTokens = ExtractTfMetrics(expr);
                var unknown = metricTokens.Where(t => !spec.AllowedMetricNames.Contains(t)).ToArray();

                unknown.Should().BeEmpty(
                    $"Dashboard '{filename}', Panel '{panel.Title}' references unknown metrics: {string.Join(", ", unknown)}");
            }
        }
    }

    [Theory]
    [InlineData("atlas-auto-remediation-benton-ops.json")]
    [InlineData("atlas-auto-remediation-governance.json")]
    public void Dashboard_DoesNotUseBannedLabels(string filename)
    {
        var spec = DashboardSpecLock.ParseFromMarkdown(ReadRepoText(SpecRelativePath));
        var json = ReadRepoText($"grafana/phase45/{filename}");
        using var doc = JsonDocument.Parse(json);

        var panels = ExtractPanelsRecursive(doc.RootElement);

        foreach (var panel in panels)
        {
            foreach (var expr in panel.PromQlExpressions)
            {
                foreach (var bannedLabel in spec.BannedLabels)
                {
                    var pattern = $@"\b{Regex.Escape(bannedLabel)}\b\s*(=|!=|=~|!~)";
                    var hasBannedLabel = Regex.IsMatch(expr, pattern);

                    hasBannedLabel.Should().BeFalse(
                        $"Dashboard '{filename}', Panel '{panel.Title}' uses BANNED label '{bannedLabel}' in expr: {expr}");
                }
            }
        }
    }

    #endregion

    #region Validation Logic

    private static void ValidateDashboard(
        string dashboardPath,
        string expectedUid,
        string expectedTitle,
        IReadOnlyDictionary<string, IReadOnlyList<string>> expectedPanels,
        IReadOnlySet<string> allowedMetricNames,
        IReadOnlySet<string> bannedLabels)
    {
        var json = ReadRepoText(dashboardPath);
        using var doc = JsonDocument.Parse(json);

        var root = doc.RootElement;

        // Validate UID
        var uid = GetStringRequired(root, "uid");
        uid.Should().Be(expectedUid, $"Dashboard UID mismatch in '{dashboardPath}'");

        // Validate title
        var title = GetStringRequired(root, "title");
        title.Should().Be(expectedTitle, $"Dashboard title mismatch in '{dashboardPath}'");

        // Extract all panels
        var panels = ExtractPanelsRecursive(root);

        // Validate required panels exist and match exact PromQL targets
        foreach (var (panelTitle, expectedExprs) in expectedPanels)
        {
            var panel = panels.SingleOrDefault(p => string.Equals(p.Title, panelTitle, StringComparison.Ordinal));
            panel.Should().NotBeNull($"Missing required panel title: '{panelTitle}' in '{dashboardPath}'");

            var actualExprs = panel!.PromQlExpressions;

            // Exact match semantics (string equality, order-insensitive)
            AssertPromqlSetEqual(
                expected: expectedExprs,
                actual: actualExprs,
                context: $"Dashboard '{dashboardPath}', Panel '{panelTitle}'");

            // Validate PromQL safety for each expr
            foreach (var expr in actualExprs)
            {
                FailIfUsesUnknownMetrics(expr, allowedMetricNames, dashboardPath, panelTitle);
                FailIfUsesBannedLabels(expr, bannedLabels, dashboardPath, panelTitle);
            }
        }

        // Also ensure every PromQL in the dashboard uses only allowed metrics / no banned labels
        // (Catches "extra" panels that violate rules)
        foreach (var panel in panels)
        {
            foreach (var expr in panel.PromQlExpressions)
            {
                FailIfUsesUnknownMetrics(expr, allowedMetricNames, dashboardPath, panel.Title);
                FailIfUsesBannedLabels(expr, bannedLabels, dashboardPath, panel.Title);
            }
        }
    }

    private static void AssertPromqlSetEqual(
        IReadOnlyList<string> expected,
        IReadOnlyList<string> actual,
        string context)
    {
        static string Normalize(string s) => s.Replace("\r\n", "\n").Replace("\n", " ").Trim();

        var expectedSet = new HashSet<string>(expected.Select(Normalize), StringComparer.Ordinal);
        var actualSet = new HashSet<string>(actual.Select(Normalize), StringComparer.Ordinal);

        var missing = expectedSet.Except(actualSet).ToArray();
        var extra = actualSet.Except(expectedSet).ToArray();

        (missing.Length == 0 && extra.Length == 0).Should().BeTrue(
            $"{context}: PromQL mismatch.\n" +
            (missing.Length > 0 ? $"Missing:\n - {string.Join("\n - ", missing)}\n" : "") +
            (extra.Length > 0 ? $"Unexpected:\n - {string.Join("\n - ", extra)}\n" : ""));
    }

    private static void FailIfUsesUnknownMetrics(
        string expr,
        IReadOnlySet<string> allowedMetricNames,
        string dashboardPath,
        string panelTitle)
    {
        var metricTokens = ExtractTfMetrics(expr);
        var unknown = metricTokens.Where(t => !allowedMetricNames.Contains(t)).ToArray();

        unknown.Should().BeEmpty(
            $"Unknown metrics referenced in PromQL.\n" +
            $"Dashboard: {dashboardPath}\n" +
            $"Panel: {panelTitle}\n" +
            $"Expr: {expr}\n" +
            $"Unknown: {string.Join(", ", unknown)}");
    }

    private static void FailIfUsesBannedLabels(
        string expr,
        IReadOnlySet<string> bannedLabels,
        string dashboardPath,
        string panelTitle)
    {
        foreach (var label in bannedLabels)
        {
            var pattern = $@"\b{Regex.Escape(label)}\b\s*(=|!=|=~|!~)";
            var hasBannedLabel = Regex.IsMatch(expr, pattern);

            hasBannedLabel.Should().BeFalse(
                $"BANNED label used in PromQL.\n" +
                $"Dashboard: {dashboardPath}\n" +
                $"Panel: {panelTitle}\n" +
                $"Label: {label}\n" +
                $"Expr: {expr}");
        }
    }

    private static string[] ExtractTfMetrics(string expr)
    {
        // Extract tokens that look like metric identifiers starting with "tf_"
        return Regex.Matches(expr, @"\b[a-zA-Z_:][a-zA-Z0-9_:]*\b")
            .Select(m => m.Value)
            .Where(t => t.StartsWith("tf_", StringComparison.Ordinal))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
    }

    #endregion

    #region Panel Extraction

    private static List<PanelInfo> ExtractPanelsRecursive(JsonElement dashboardRoot)
    {
        var result = new List<PanelInfo>();

        if (dashboardRoot.TryGetProperty("panels", out var panelsEl) && panelsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var panelEl in panelsEl.EnumerateArray())
            {
                ExtractPanelTree(panelEl, result);
            }
        }

        return result;
    }

    private static void ExtractPanelTree(JsonElement panelEl, List<PanelInfo> result)
    {
        var title = panelEl.TryGetProperty("title", out var titleEl) && titleEl.ValueKind == JsonValueKind.String
            ? titleEl.GetString() ?? string.Empty
            : string.Empty;

        var promExprs = ExtractPromQlExpressions(panelEl);

        // Only store panels with titles (required panels are title-addressed)
        if (!string.IsNullOrWhiteSpace(title))
        {
            result.Add(new PanelInfo(title, promExprs));
        }

        // Recurse into nested panels (e.g., rows)
        if (panelEl.TryGetProperty("panels", out var nestedPanels) && nestedPanels.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in nestedPanels.EnumerateArray())
            {
                ExtractPanelTree(child, result);
            }
        }
    }

    private static List<string> ExtractPromQlExpressions(JsonElement panelEl)
    {
        var exprs = new List<string>();

        if (panelEl.TryGetProperty("targets", out var targetsEl) && targetsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var t in targetsEl.EnumerateArray())
            {
                if (t.TryGetProperty("expr", out var exprEl) && exprEl.ValueKind == JsonValueKind.String)
                {
                    var expr = exprEl.GetString();
                    if (!string.IsNullOrWhiteSpace(expr))
                    {
                        exprs.Add(expr!);
                    }
                }
            }
        }

        return exprs;
    }

    #endregion

    #region File Helpers

    private static string GetStringRequired(JsonElement root, string propertyName)
    {
        root.TryGetProperty(propertyName, out var el).Should().BeTrue($"Missing required property '{propertyName}'");
        el.ValueKind.Should().Be(JsonValueKind.String, $"Property '{propertyName}' must be a string");
        return el.GetString() ?? string.Empty;
    }

    private static string GetRepoFilePath(string relativePath)
    {
        // Walk up from AppContext.BaseDirectory looking for .git to find repo root.
        // This handles any test output depth (bin/Release/net8.0/ → repo root).
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var candidate = Path.GetFullPath(Path.Combine(dir.FullName, relativePath));
            if (File.Exists(candidate) &&
                (Directory.Exists(Path.Combine(dir.FullName, ".git")) ||
                 File.Exists(Path.Combine(dir.FullName, ".git"))))
            {
                return candidate;
            }
            dir = dir.Parent;
        }

        // Fallback: try relative to CWD (works when dotnet test runs from repo root)
        var cwdPath = Path.GetFullPath(relativePath);
        if (File.Exists(cwdPath))
            return cwdPath;

        // Last resort: return CWD-relative path — tests will fail with a clear assertion message
        return cwdPath;
    }

    private static string ReadRepoText(string relativePath)
    {
        var path = GetRepoFilePath(relativePath);
        File.Exists(path).Should().BeTrue($"Required file not found: '{relativePath}'");
        return File.ReadAllText(path);
    }

    #endregion

    #region Inner Types

    private sealed record PanelInfo(string Title, IReadOnlyList<string> PromQlExpressions);

    /// <summary>
    /// Parses the DASHBOARD_SPEC_LOCK_v1.0.0.md format specific to Phase 45.
    /// </summary>
    private sealed class DashboardSpecLock
    {
        public required IReadOnlySet<string> AllowedMetricNames { get; init; }
        public required IReadOnlySet<string> BannedLabels { get; init; }
        public required DashboardSpec OpsDashboard { get; init; }
        public required DashboardSpec GovernanceDashboard { get; init; }

        public sealed class DashboardSpec
        {
            public required string Uid { get; init; }
            public required string Title { get; init; }
            public required IReadOnlyDictionary<string, IReadOnlyList<string>> PanelsByTitle { get; init; }
        }

        public static DashboardSpecLock ParseFromMarkdown(string markdown)
        {
            var lines = markdown.Replace("\r\n", "\n").Split('\n');

            var allowedMetrics = new HashSet<string>(StringComparer.Ordinal);
            var bannedLabels = new HashSet<string>(StringComparer.Ordinal);

            DashboardSpec? ops = null;
            DashboardSpec? gov = null;

            int i = 0;
            while (i < lines.Length)
            {
                var line = lines[i].Trim();

                // Parse allowed metric names section
                if (line.Equals("Allowed metric names:", StringComparison.Ordinal))
                {
                    i++;
                    while (i < lines.Length && string.IsNullOrWhiteSpace(lines[i]))
                        i++;
                    while (i < lines.Length && lines[i].TrimStart().StartsWith("-", StringComparison.Ordinal))
                    {
                        var m = ExtractBackticked(lines[i]);
                        if (!string.IsNullOrWhiteSpace(m)) allowedMetrics.Add(m);
                        i++;
                    }
                    continue;
                }

                // Parse banned labels section
                if (line.StartsWith("Banned labels anywhere", StringComparison.Ordinal))
                {
                    i++;
                    while (i < lines.Length && string.IsNullOrWhiteSpace(lines[i]))
                        i++;
                    while (i < lines.Length && lines[i].TrimStart().StartsWith("-", StringComparison.Ordinal))
                    {
                        var l = ExtractBackticked(lines[i]);
                        if (!string.IsNullOrWhiteSpace(l)) bannedLabels.Add(l);
                        i++;
                    }
                    continue;
                }

                // Parse Dashboard 1: Benton Ops
                if (line.StartsWith("## 2) Dashboard 1:", StringComparison.Ordinal))
                {
                    ops = ParseDashboardBlock(lines, ref i);
                    continue;
                }

                // Parse Dashboard 2: Governance
                if (line.StartsWith("## 3) Dashboard 2:", StringComparison.Ordinal))
                {
                    gov = ParseDashboardBlock(lines, ref i);
                    continue;
                }

                i++;
            }

            ops.Should().NotBeNull("Spec lock parse failed: Benton Ops dashboard spec not found");
            gov.Should().NotBeNull("Spec lock parse failed: Governance dashboard spec not found");
            allowedMetrics.Count.Should().BeGreaterThan(0, "Spec lock parse failed: no allowed metrics found");
            bannedLabels.Count.Should().BeGreaterThan(0, "Spec lock parse failed: no banned labels found");

            return new DashboardSpecLock
            {
                AllowedMetricNames = allowedMetrics,
                BannedLabels = bannedLabels,
                OpsDashboard = ops!,
                GovernanceDashboard = gov!
            };
        }

        private static DashboardSpec ParseDashboardBlock(string[] lines, ref int index)
        {
            string? uid = null;
            string? title = null;
            var panels = new Dictionary<string, List<string>>(StringComparer.Ordinal);

            index++;

            while (index < lines.Length)
            {
                var line = lines[index].Trim();

                // Stop at next major section
                if (line.StartsWith("## ", StringComparison.Ordinal) && !line.Contains("Dashboard"))
                    break;

                // Stop at next dashboard block
                if (line.StartsWith("## 3)", StringComparison.Ordinal) || line.StartsWith("## 4)", StringComparison.Ordinal))
                    break;

                // Parse UID
                if (line.StartsWith("Dashboard UID", StringComparison.Ordinal))
                {
                    index++;
                    while (index < lines.Length && string.IsNullOrWhiteSpace(lines[index]))
                        index++;
                    uid = ExtractBackticked(lines[index]);
                    index++;
                    continue;
                }

                // Parse Title
                if (line.StartsWith("Dashboard Title", StringComparison.Ordinal))
                {
                    index++;
                    while (index < lines.Length && string.IsNullOrWhiteSpace(lines[index]))
                        index++;
                    title = ExtractBackticked(lines[index]);
                    index++;
                    continue;
                }

                // Parse Panel sections (#### P1, #### G1, etc.)
                if (line.StartsWith("#### ", StringComparison.Ordinal))
                {
                    var panelTitle = ParsePanelTitle(lines, ref index);
                    var exprs = ParsePanelPromqlTargets(lines, ref index);

                    if (!string.IsNullOrWhiteSpace(panelTitle) && exprs.Count > 0)
                    {
                        panels[panelTitle] = exprs;
                    }
                    continue;
                }

                index++;
            }

            uid.Should().NotBeNullOrWhiteSpace("Spec parse error: dashboard UID missing");
            title.Should().NotBeNullOrWhiteSpace("Spec parse error: dashboard title missing");
            panels.Count.Should().BeGreaterThan(0, $"Spec parse error: no panels found for dashboard '{title}'");

            return new DashboardSpec
            {
                Uid = uid!,
                Title = title!,
                PanelsByTitle = panels.ToDictionary(
                    k => k.Key,
                    v => (IReadOnlyList<string>)v.Value,
                    StringComparer.Ordinal)
            };
        }

        private static string ParsePanelTitle(string[] lines, ref int index)
        {
            // index is on "#### ..."
            index++;

            while (index < lines.Length)
            {
                var line = lines[index].Trim();

                // Found title marker
                if (line.Equals("Title:", StringComparison.Ordinal))
                {
                    index++;
                    while (index < lines.Length && string.IsNullOrWhiteSpace(lines[index]))
                        index++;
                    var bullet = lines[index];
                    var t = ExtractBackticked(bullet);
                    index++;
                    return t ?? string.Empty;
                }

                // Stop at next panel or section
                if (line.StartsWith("#### ", StringComparison.Ordinal) ||
                    line.StartsWith("## ", StringComparison.Ordinal))
                    break;

                index++;
            }

            return string.Empty;
        }

        private static List<string> ParsePanelPromqlTargets(string[] lines, ref int index)
        {
            var exprs = new List<string>();

            while (index < lines.Length)
            {
                var line = lines[index].Trim();

                // Stop at next panel or section
                if (line.StartsWith("#### ", StringComparison.Ordinal) ||
                    line.StartsWith("## ", StringComparison.Ordinal))
                    break;

                // Found PromQL code block
                if (line.Equals("```promql", StringComparison.Ordinal))
                {
                    index++;
                    var buf = new List<string>();
                    while (index < lines.Length && !lines[index].Trim().Equals("```", StringComparison.Ordinal))
                    {
                        buf.Add(lines[index]);
                        index++;
                    }

                    // Consume closing fence
                    if (index < lines.Length && lines[index].Trim().Equals("```", StringComparison.Ordinal))
                        index++;

                    var expr = string.Join("\n", buf).Trim();
                    if (!string.IsNullOrWhiteSpace(expr))
                        exprs.Add(expr);

                    continue;
                }

                index++;
            }

            return exprs;
        }

        private static string? ExtractBackticked(string line)
        {
            var m = Regex.Match(line, @"`([^`]+)`");
            return m.Success ? m.Groups[1].Value.Trim() : null;
        }
    }

    #endregion
}
