// ============================================================================
// PHASE 38: Prometheus Alert Rule Validation Tests
// Tests for Atlas & Swarm AI-Aware Alert Rules
// "Government. Transcended."
// ============================================================================

using System.Text.RegularExpressions;
using Xunit;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace TerraFusion.Integration.Tests.Phase38;

/// <summary>
/// Phase 38: Prometheus Alert Rule Validation Tests.
/// Ensures all alerts are valid, reference correct metrics, and follow spec.
/// </summary>
[Trait("Category", "Phase38")]
[Trait("Feature", "AlertRules")]
public class AlertRuleValidationTests
{
    private static readonly string AlertBasePath = Path.Combine(
        GetRepositoryRoot(),
        "ops", "observability", "alerting", "phase38");

    private static readonly string[] ExpectedAlertFiles = new[]
    {
        "atlas-alerts.yml",
        "swarm-alerts.yml"
    };

    // Phase 35 METRICS SPEC LOCK
    private static readonly string[] Phase35Metrics = new[]
    {
        "atlas_forecast_generated_total",
        "atlas_forecast_compute_duration_seconds",
        "atlas_forecast_engine_errors_total",
        "atlas_forecast_orchestrator_runs_total",
        "atlas_forecast_orchestrator_last_run_timestamp_seconds",
        "atlas_forecast_orchestrator_last_run_duration_seconds",
        "atlas_forecast_cleanup_runs_total",
        "atlas_forecast_entries_purged_total",
        "atlas_telemetry_ingest_total",
        "atlas_anomaly_detected_total",
        "swarm_predictive_policy_evaluations_total",
        "swarm_predictive_actions_total",
        "swarm_predictive_cooldown_activations_total"
    };

    private static readonly string[] ValidSeverities = new[] { "critical", "warning", "info" };

    private static string GetRepositoryRoot()
    {
        var current = Directory.GetCurrentDirectory();
        while (current != null)
        {
            var gitPath = Path.Combine(current, ".git");
            if (Directory.Exists(gitPath) || File.Exists(gitPath))
            {
                return current;
            }
            current = Directory.GetParent(current)?.FullName;
        }
        return current ?? Directory.GetCurrentDirectory();
    }

    private static Dictionary<string, object>? LoadYaml(string filePath)
    {
        if (!File.Exists(filePath)) return null;
        var yaml = File.ReadAllText(filePath);
        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build();
        return deserializer.Deserialize<Dictionary<string, object>>(yaml);
    }

    private static List<Dictionary<string, object>> GetAllAlerts(string filePath)
    {
        var alerts = new List<Dictionary<string, object>>();
        var yaml = LoadYaml(filePath);
        if (yaml == null) return alerts;

        if (yaml.TryGetValue("groups", out var groupsObj) && groupsObj is List<object> groups)
        {
            foreach (var group in groups)
            {
                if (group is Dictionary<object, object> groupDict)
                {
                    if (groupDict.TryGetValue("rules", out var rulesObj) && rulesObj is List<object> rules)
                    {
                        foreach (var rule in rules)
                        {
                            if (rule is Dictionary<object, object> ruleDict)
                            {
                                var converted = ruleDict.ToDictionary(
                                    k => k.Key?.ToString() ?? "",
                                    v => v.Value ?? new object());
                                if (converted.ContainsKey("alert"))
                                {
                                    alerts.Add(converted);
                                }
                            }
                        }
                    }
                }
            }
        }
        return alerts;
    }

    // ========================================================================
    // ALERT FILE EXISTENCE TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase38")]
    public void AlertDirectory_Exists()
    {
        Assert.True(Directory.Exists(AlertBasePath),
            $"Alert directory should exist at: {AlertBasePath}");
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void AlertFile_Exists(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        Assert.True(File.Exists(filePath),
            $"Alert file should exist: {filePath}");
    }

    // ========================================================================
    // YAML VALIDITY TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void AlertFile_ValidYaml(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var yaml = LoadYaml(filePath);
        Assert.NotNull(yaml);
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void AlertFile_HasGroups(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var yaml = LoadYaml(filePath);
        Assert.NotNull(yaml);
        Assert.True(yaml.ContainsKey("groups"), "Alert file should have 'groups' key");
    }

    // ========================================================================
    // ALERT STRUCTURE TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasAlertName(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            Assert.True(alert.ContainsKey("alert"),
                "Each alert rule should have 'alert' name");
            Assert.False(string.IsNullOrWhiteSpace(alert["alert"]?.ToString()),
                "Alert name should not be empty");
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasExpr(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            Assert.True(alert.ContainsKey("expr"),
                $"Alert '{alertName}' should have 'expr' PromQL expression");
            Assert.False(string.IsNullOrWhiteSpace(alert["expr"]?.ToString()),
                $"Alert '{alertName}' expr should not be empty");
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasForDuration(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            Assert.True(alert.ContainsKey("for"),
                $"Alert '{alertName}' should have 'for' duration");
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasLabels(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            Assert.True(alert.ContainsKey("labels"),
                $"Alert '{alertName}' should have 'labels'");
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasAnnotations(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            Assert.True(alert.ContainsKey("annotations"),
                $"Alert '{alertName}' should have 'annotations'");
        }
    }

    // ========================================================================
    // SEVERITY LABEL TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasSeverityLabel(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("labels", out var labelsObj) && labelsObj is Dictionary<object, object> labels)
            {
                Assert.True(labels.ContainsKey("severity"),
                    $"Alert '{alertName}' should have 'severity' label");
            }
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_SeverityIsValid(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("labels", out var labelsObj) && labelsObj is Dictionary<object, object> labels)
            {
                if (labels.TryGetValue("severity", out var severity))
                {
                    var severityStr = severity?.ToString() ?? "";
                    Assert.True(ValidSeverities.Contains(severityStr),
                        $"Alert '{alertName}' has invalid severity: {severityStr}. Valid values: {string.Join(", ", ValidSeverities)}");
                }
            }
        }
    }

    // ========================================================================
    // GOVERNMENT COMPLIANCE TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasGovernmentLabel(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("labels", out var labelsObj) && labelsObj is Dictionary<object, object> labels)
            {
                Assert.True(labels.ContainsKey("government"),
                    $"Alert '{alertName}' should have 'government' label for compliance");
            }
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasComponentLabel(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("labels", out var labelsObj) && labelsObj is Dictionary<object, object> labels)
            {
                Assert.True(labels.ContainsKey("component"),
                    $"Alert '{alertName}' should have 'component' label");
            }
        }
    }

    // ========================================================================
    // ANNOTATION TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasSummaryAnnotation(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("annotations", out var annotationsObj) && annotationsObj is Dictionary<object, object> annotations)
            {
                Assert.True(annotations.ContainsKey("summary"),
                    $"Alert '{alertName}' should have 'summary' annotation");
            }
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasDescriptionAnnotation(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("annotations", out var annotationsObj) && annotationsObj is Dictionary<object, object> annotations)
            {
                Assert.True(annotations.ContainsKey("description"),
                    $"Alert '{alertName}' should have 'description' annotation");
            }
        }
    }

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void Alert_HasActionAnnotation(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("annotations", out var annotationsObj) && annotationsObj is Dictionary<object, object> annotations)
            {
                Assert.True(annotations.ContainsKey("action"),
                    $"Alert '{alertName}' should have 'action' annotation for operators");
            }
        }
    }

    // ========================================================================
    // PROMQL METRIC REFERENCE TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void PromQL_ReferencesPhase35Metrics(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            var expr = alert["expr"]?.ToString() ?? "";

            // Extract metric names from PromQL (simplified pattern)
            var metricPattern = new Regex(@"(atlas_\w+|swarm_\w+)");
            var matches = metricPattern.Matches(expr);

            foreach (Match match in matches)
            {
                var metricName = match.Groups[1].Value;
                // Handle _bucket suffix for histograms
                var baseMetric = metricName.Replace("_bucket", "").Replace("_sum", "").Replace("_count", "");

                Assert.True(Phase35Metrics.Any(m => baseMetric.StartsWith(m.Replace("_seconds", "")) || m == baseMetric),
                    $"Alert '{alertName}' references unknown metric: {metricName}");
            }
        }
    }

    // ========================================================================
    // ALERT NAMING CONVENTION TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void AlertNames_FollowPascalCase(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);
        Assert.NotEmpty(alerts);

        var pascalCasePattern = new Regex(@"^[A-Z][a-zA-Z0-9]*$");

        foreach (var alert in alerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "";
            Assert.True(pascalCasePattern.IsMatch(alertName),
                $"Alert name '{alertName}' should follow PascalCase convention");
        }
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void AlertNames_NoDuplicates()
    {
        var allAlertNames = new List<string>();

        foreach (var file in ExpectedAlertFiles)
        {
            var filePath = Path.Combine(AlertBasePath, file);
            if (File.Exists(filePath))
            {
                var alerts = GetAllAlerts(filePath);
                allAlertNames.AddRange(alerts.Select(a => a["alert"]?.ToString() ?? ""));
            }
        }

        var duplicates = allAlertNames.GroupBy(x => x)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        Assert.Empty(duplicates);
    }

    // ========================================================================
    // SPECIFIC ALERT CONTENT TESTS - ATLAS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase38")]
    public void AtlasAlerts_HasForecastStaleAlert()
    {
        var filePath = Path.Combine(AlertBasePath, "atlas-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.Contains(alerts, a =>
            (a["alert"]?.ToString() ?? "").Contains("ForecastStale") ||
            (a["alert"]?.ToString() ?? "").Contains("Stale"));
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void AtlasAlerts_HasOrchestratorStallAlert()
    {
        var filePath = Path.Combine(AlertBasePath, "atlas-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.Contains(alerts, a =>
            (a["alert"]?.ToString() ?? "").Contains("OrchestratorStall") ||
            (a["alert"]?.ToString() ?? "").Contains("Orchestrator"));
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void AtlasAlerts_HasErrorRateAlert()
    {
        var filePath = Path.Combine(AlertBasePath, "atlas-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.Contains(alerts, a =>
            (a["alert"]?.ToString() ?? "").Contains("Error") ||
            (a["expr"]?.ToString() ?? "").Contains("error"));
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void AtlasAlerts_HasAnomalySpikeAlert()
    {
        var filePath = Path.Combine(AlertBasePath, "atlas-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.Contains(alerts, a =>
            (a["alert"]?.ToString() ?? "").Contains("Anomaly"));
    }

    // ========================================================================
    // SPECIFIC ALERT CONTENT TESTS - SWARM
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase38")]
    public void SwarmAlerts_HasActionSpikeAlert()
    {
        var filePath = Path.Combine(AlertBasePath, "swarm-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.Contains(alerts, a =>
            (a["alert"]?.ToString() ?? "").Contains("Action") ||
            (a["expr"]?.ToString() ?? "").Contains("actions"));
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void SwarmAlerts_HasCooldownAlert()
    {
        var filePath = Path.Combine(AlertBasePath, "swarm-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.Contains(alerts, a =>
            (a["alert"]?.ToString() ?? "").Contains("Cooldown") ||
            (a["expr"]?.ToString() ?? "").Contains("cooldown"));
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void SwarmAlerts_HasPolicyLoadAlert()
    {
        var filePath = Path.Combine(AlertBasePath, "swarm-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.Contains(alerts, a =>
            (a["alert"]?.ToString() ?? "").Contains("Policy") ||
            (a["expr"]?.ToString() ?? "").Contains("policy"));
    }

    // ========================================================================
    // ALERT COUNT TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase38")]
    public void AtlasAlerts_HasMinimumAlertCount()
    {
        var filePath = Path.Combine(AlertBasePath, "atlas-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.True(alerts.Count >= 5,
            $"Atlas alerts should have at least 5 alerts, found {alerts.Count}");
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void SwarmAlerts_HasMinimumAlertCount()
    {
        var filePath = Path.Combine(AlertBasePath, "swarm-alerts.yml");
        var alerts = GetAllAlerts(filePath);

        Assert.True(alerts.Count >= 4,
            $"Swarm alerts should have at least 4 alerts, found {alerts.Count}");
    }

    [Fact]
    [Trait("Category", "Phase38")]
    public void TotalAlerts_MeetsSpecLock()
    {
        var totalAlerts = 0;

        foreach (var file in ExpectedAlertFiles)
        {
            var filePath = Path.Combine(AlertBasePath, file);
            if (File.Exists(filePath))
            {
                totalAlerts += GetAllAlerts(filePath).Count;
            }
        }

        Assert.True(totalAlerts >= 9,
            $"Total alerts should be at least 9 per SPEC LOCK, found {totalAlerts}");
    }

    // ========================================================================
    // CRITICAL ALERT CITIZEN IMPACT TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase38")]
    [InlineData("atlas-alerts.yml")]
    [InlineData("swarm-alerts.yml")]
    public void CriticalAlerts_HaveCitizenImpact(string alertFile)
    {
        var filePath = Path.Combine(AlertBasePath, alertFile);
        var alerts = GetAllAlerts(filePath);

        var criticalAlerts = alerts.Where(a =>
        {
            if (a.TryGetValue("labels", out var labelsObj) && labelsObj is Dictionary<object, object> labels)
            {
                return labels.TryGetValue("severity", out var severity) &&
                       severity?.ToString() == "critical";
            }
            return false;
        }).ToList();

        foreach (var alert in criticalAlerts)
        {
            var alertName = alert["alert"]?.ToString() ?? "unknown";
            if (alert.TryGetValue("labels", out var labelsObj) && labelsObj is Dictionary<object, object> labels)
            {
                Assert.True(labels.ContainsKey("citizen_impact"),
                    $"Critical alert '{alertName}' should have 'citizen_impact' label");
            }
        }
    }
}
