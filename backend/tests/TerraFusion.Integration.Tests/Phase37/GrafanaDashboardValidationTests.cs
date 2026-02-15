// ============================================================================
// PHASE 37: Grafana Dashboard Validation Tests
// Tests for Atlas & SystemGPT Dashboard Pack
// "Government. Transcended."
// ============================================================================

using System.Text.Json;
using System.Text.RegularExpressions;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase37;

/// <summary>
/// Phase 37: Grafana Dashboard JSON Validation Tests.
/// Ensures all dashboards are valid, reference correct metrics, and follow spec.
/// </summary>
[Trait("Category", "Phase37")]
[Trait("Feature", "GrafanaDashboards")]
public class GrafanaDashboardValidationTests
{
    // Dashboard file paths relative to repository root
    private static readonly string DashboardBasePath = Path.Combine(
        GetRepositoryRoot(),
        "ops", "observability", "grafana-dashboards", "phase37");

    private static readonly string[] ExpectedDashboards = new[]
    {
        "atlas-systemgpt-ops.json",
        "atlas-forecast-risk.json",
        "systemgpt-swarm-guardrails.json",
        "atlas-anomalies-telemetry.json",
        "atlas-cio-executive.json"
    };

    // Phase 35 METRICS SPEC LOCK - all valid metric names
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

    // ========================================================================
    // DASHBOARD EXISTENCE TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase37")]
    public void DashboardDirectory_Exists()
    {
        Assert.True(Directory.Exists(DashboardBasePath),
            $"Dashboard directory should exist at: {DashboardBasePath}");
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_FileExists(string dashboardFile)
    {
        var filePath = Path.Combine(DashboardBasePath, dashboardFile);
        Assert.True(File.Exists(filePath),
            $"Dashboard file should exist: {filePath}");
    }

    // ========================================================================
    // JSON VALIDITY TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_ValidJson(string dashboardFile)
    {
        var filePath = Path.Combine(DashboardBasePath, dashboardFile);
        if (!File.Exists(filePath))
        {
            Assert.Fail($"Dashboard file not found: {filePath}");
            return;
        }

        var json = File.ReadAllText(filePath);
        var exception = Record.Exception(() => JsonDocument.Parse(json));

        Assert.Null(exception);
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_HasSchemaVersion(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        Assert.True(doc.RootElement.TryGetProperty("schemaVersion", out var schemaVersion),
            $"{dashboardFile} should have schemaVersion property");
        Assert.True(schemaVersion.GetInt32() >= 38,
            $"{dashboardFile} schemaVersion should be >= 38");
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_HasTitle(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        Assert.True(doc.RootElement.TryGetProperty("title", out var title),
            $"{dashboardFile} should have title property");
        Assert.False(string.IsNullOrWhiteSpace(title.GetString()),
            $"{dashboardFile} title should not be empty");
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_HasPanels(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        Assert.True(doc.RootElement.TryGetProperty("panels", out var panels),
            $"{dashboardFile} should have panels array");
        Assert.True(panels.GetArrayLength() > 0,
            $"{dashboardFile} should have at least one panel");
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_HasTags(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        Assert.True(doc.RootElement.TryGetProperty("tags", out var tags),
            $"{dashboardFile} should have tags array");

        var tagList = tags.EnumerateArray().Select(t => t.GetString()).ToList();
        Assert.Contains("terrafusion", tagList);
        Assert.Contains("phase37", tagList);
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_HasRefreshInterval(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        Assert.True(doc.RootElement.TryGetProperty("refresh", out var refresh),
            $"{dashboardFile} should have refresh property");
        Assert.False(string.IsNullOrWhiteSpace(refresh.GetString()),
            $"{dashboardFile} refresh should not be empty");
    }

    // ========================================================================
    // PANEL STRUCTURE TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_PanelsHaveUniqueIds(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        var panels = doc.RootElement.GetProperty("panels");
        var ids = new HashSet<int>();

        foreach (var panel in panels.EnumerateArray())
        {
            if (panel.TryGetProperty("id", out var idProp))
            {
                var id = idProp.GetInt32();
                Assert.True(ids.Add(id),
                    $"{dashboardFile} has duplicate panel ID: {id}");
            }
        }
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_PanelsHaveGridPos(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        var panels = doc.RootElement.GetProperty("panels");

        foreach (var panel in panels.EnumerateArray())
        {
            // Skip row panels
            if (panel.TryGetProperty("type", out var typeProp) &&
                typeProp.GetString() == "row")
                continue;

            Assert.True(panel.TryGetProperty("gridPos", out _),
                $"{dashboardFile} panel should have gridPos");
        }
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_PanelsHaveType(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        var panels = doc.RootElement.GetProperty("panels");

        foreach (var panel in panels.EnumerateArray())
        {
            Assert.True(panel.TryGetProperty("type", out var typeProp),
                $"{dashboardFile} panel should have type");
            Assert.False(string.IsNullOrWhiteSpace(typeProp.GetString()),
                $"{dashboardFile} panel type should not be empty");
        }
    }

    // ========================================================================
    // METRIC REFERENCE VALIDATION
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_MetricsReferencePhase35Spec(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, dashboardFile));

        // Extract all metric references from PromQL expressions
        var metricPattern = new Regex(@"(atlas_\w+|swarm_\w+)");
        var matches = metricPattern.Matches(json);

        foreach (Match match in matches)
        {
            var metric = match.Value;
            // Allow metric_bucket for histograms
            var baseMetric = metric.Replace("_bucket", "").Replace("_count", "").Replace("_sum", "");

            Assert.True(Phase35Metrics.Any(m => baseMetric.StartsWith(m.Replace("_total", "").Replace("_seconds", ""))),
                $"{dashboardFile} references unknown metric: {metric}");
        }
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_NoHardcodedUrls(string dashboardFile)
    {
        var filePath = Path.Combine(DashboardBasePath, dashboardFile);
        if (!File.Exists(filePath)) return;

        var json = File.ReadAllText(filePath);

        // Check for hardcoded localhost or IP addresses
        Assert.DoesNotContain("localhost:", json);
        Assert.DoesNotContain("127.0.0.1", json);
        Assert.DoesNotContain("http://prometheus", json);
    }

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    [InlineData("atlas-cio-executive.json")]
    public void Dashboard_UsesPrometheusDataSource(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        var panels = doc.RootElement.GetProperty("panels");

        foreach (var panel in panels.EnumerateArray())
        {
            if (panel.TryGetProperty("targets", out var targets))
            {
                foreach (var target in targets.EnumerateArray())
                {
                    if (target.TryGetProperty("datasource", out var ds))
                    {
                        if (ds.TryGetProperty("type", out var dsType))
                        {
                            Assert.Equal("prometheus", dsType.GetString());
                        }
                    }
                }
            }
        }
    }

    // ========================================================================
    // OPS DASHBOARD CONTENT TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase37")]
    public void OpsOverview_HasOrchestratorPanel()
    {
        var doc = LoadDashboard("atlas-systemgpt-ops.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-systemgpt-ops.json"));
        Assert.Contains("orchestrator", json.ToLowerInvariant());
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void OpsOverview_HasForecastPanel()
    {
        var doc = LoadDashboard("atlas-systemgpt-ops.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-systemgpt-ops.json"));
        Assert.Contains("forecast", json.ToLowerInvariant());
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void OpsOverview_HasSwarmPanel()
    {
        var doc = LoadDashboard("atlas-systemgpt-ops.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-systemgpt-ops.json"));
        Assert.Contains("swarm", json.ToLowerInvariant());
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void OpsOverview_HasAnomalyPanel()
    {
        var doc = LoadDashboard("atlas-systemgpt-ops.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-systemgpt-ops.json"));
        Assert.Contains("anomal", json.ToLowerInvariant());
    }

    // ========================================================================
    // FORECAST DASHBOARD CONTENT TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase37")]
    public void ForecastRisk_HasDurationHistogram()
    {
        var doc = LoadDashboard("atlas-forecast-risk.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-forecast-risk.json"));
        Assert.Contains("duration", json.ToLowerInvariant());
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void ForecastRisk_HasCountyFilter()
    {
        var doc = LoadDashboard("atlas-forecast-risk.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-forecast-risk.json"));
        Assert.Contains("countyId", json);
    }

    // ========================================================================
    // SWARM DASHBOARD CONTENT TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase37")]
    public void SwarmGuardrails_HasActionCounter()
    {
        var doc = LoadDashboard("systemgpt-swarm-guardrails.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "systemgpt-swarm-guardrails.json"));
        Assert.Contains("swarm_predictive_actions_total", json);
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void SwarmGuardrails_HasPolicyEvaluations()
    {
        var doc = LoadDashboard("systemgpt-swarm-guardrails.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "systemgpt-swarm-guardrails.json"));
        Assert.Contains("swarm_predictive_policy_evaluations_total", json);
    }

    // ========================================================================
    // ANOMALY DASHBOARD CONTENT TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase37")]
    public void AnomaliesTelemetry_HasAnomalyTypeBreakdown()
    {
        var doc = LoadDashboard("atlas-anomalies-telemetry.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-anomalies-telemetry.json"));
        Assert.Contains("anomalyType", json);
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void AnomaliesTelemetry_HasTelemetryIngest()
    {
        var doc = LoadDashboard("atlas-anomalies-telemetry.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-anomalies-telemetry.json"));
        Assert.Contains("atlas_telemetry_ingest_total", json);
    }

    // ========================================================================
    // CIO DASHBOARD CONTENT TESTS
    // ========================================================================

    [Fact]
    [Trait("Category", "Phase37")]
    public void CioExecutive_HasHealthSummary()
    {
        var doc = LoadDashboard("atlas-cio-executive.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-cio-executive.json"));
        Assert.Contains("health", json.ToLowerInvariant());
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void CioExecutive_HasCountyStatus()
    {
        var doc = LoadDashboard("atlas-cio-executive.json");
        if (doc == null) return;

        var json = File.ReadAllText(Path.Combine(DashboardBasePath, "atlas-cio-executive.json"));
        Assert.Contains("county", json.ToLowerInvariant());
    }

    // ========================================================================
    // TEMPLATE VARIABLE TESTS
    // ========================================================================

    [Theory]
    [Trait("Category", "Phase37")]
    [InlineData("atlas-systemgpt-ops.json")]
    [InlineData("atlas-forecast-risk.json")]
    [InlineData("systemgpt-swarm-guardrails.json")]
    [InlineData("atlas-anomalies-telemetry.json")]
    public void Dashboard_HasTemplating(string dashboardFile)
    {
        var doc = LoadDashboard(dashboardFile);
        if (doc == null) return;

        Assert.True(doc.RootElement.TryGetProperty("templating", out var templating),
            $"{dashboardFile} should have templating property");
        Assert.True(templating.TryGetProperty("list", out var list),
            $"{dashboardFile} should have templating.list");
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    private JsonDocument? LoadDashboard(string dashboardFile)
    {
        var filePath = Path.Combine(DashboardBasePath, dashboardFile);
        if (!File.Exists(filePath))
        {
            Assert.Fail($"Dashboard file not found: {filePath}");
            return null;
        }

        var json = File.ReadAllText(filePath);
        return JsonDocument.Parse(json);
    }
}

/// <summary>
/// Phase 37: Dashboard Constants Validation Tests.
/// Ensures dashboard metadata follows standards.
/// </summary>
[Trait("Category", "Phase37")]
[Trait("Feature", "DashboardConstants")]
public class GrafanaDashboardConstantsTests
{
    [Fact]
    [Trait("Category", "Phase37")]
    public void DashboardSpecLock_Version()
    {
        // DASHBOARD SPEC LOCK v1.0.0
        Assert.Equal("1.0.0", GrafanaDashboardConstants.Version);
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void DashboardSpecLock_DashboardCount()
    {
        Assert.Equal(5, GrafanaDashboardConstants.DashboardIds.Length);
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void DashboardSpecLock_RequiredTags()
    {
        Assert.Contains("terrafusion", GrafanaDashboardConstants.RequiredTags);
        Assert.Contains("phase37", GrafanaDashboardConstants.RequiredTags);
        Assert.Contains("government", GrafanaDashboardConstants.RequiredTags);
    }

    [Fact]
    [Trait("Category", "Phase37")]
    public void DashboardSpecLock_MinSchemaVersion()
    {
        Assert.True(GrafanaDashboardConstants.MinSchemaVersion >= 38);
    }
}

/// <summary>
/// Dashboard constants for Phase 37 SPEC LOCK.
/// </summary>
public static class GrafanaDashboardConstants
{
    public const string Version = "1.0.0";
    public const int MinSchemaVersion = 39;

    public static readonly string[] DashboardIds = new[]
    {
        "atlas-systemgpt-ops",
        "atlas-forecast-risk",
        "systemgpt-swarm-guardrails",
        "atlas-anomalies-telemetry",
        "atlas-cio-executive"
    };

    public static readonly string[] RequiredTags = new[]
    {
        "terrafusion",
        "atlas",
        "phase37",
        "government"
    };
}
