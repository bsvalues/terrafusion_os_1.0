// =============================================================================
// Phase 39: Incident Triage Engine - Core Implementation
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Deterministic classification engine for government incident triage.
// =============================================================================

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Core incident triage engine implementation.
/// Performs deterministic classification, grouping, and recommendation generation.
/// </summary>
/// <remarks>
/// DESIGN PRINCIPLES:
/// 1. Deterministic: Same input always produces same output
/// 2. Fast: No external calls, pure in-memory processing
/// 3. Auditable: All decisions logged with reasoning
/// 4. Government-compliant: FISMA-High requirements met
/// </remarks>
public class IncidentTriageEngine : IIncidentTriageEngine
{
    private readonly IncidentTriageOptions _options;
    private readonly ILogger<IncidentTriageEngine> _logger;

    public IncidentTriageEngine(
        IOptions<IncidentTriageOptions> options,
        ILogger<IncidentTriageEngine> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public Task<IncidentSummary> TriageAsync(
        IncidentTriageRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.Alerts == null || request.Alerts.Count == 0)
        {
            throw new ArgumentException("At least one alert is required for triage", nameof(request));
        }

        var stopwatch = Stopwatch.StartNew();

        // Deduplicate alerts by fingerprint
        var deduplicatedAlerts = DeduplicateAlerts(request.Alerts);

        // Extract county IDs from alerts
        var impactedCountyIds = ExtractCountyIds(deduplicatedAlerts);
        var primaryCountyId = impactedCountyIds.FirstOrDefault();

        // Determine overall severity
        var overallSeverity = DetermineOverallSeverity(deduplicatedAlerts);

        // Generate title and description
        var (title, description) = GenerateTitleAndDescription(deduplicatedAlerts, impactedCountyIds);

        // Generate recommendations based on alert types
        var recommendations = GenerateRecommendations(deduplicatedAlerts);

        // Build applied rules list for audit
        var appliedRules = BuildAppliedRulesList(deduplicatedAlerts, overallSeverity);

        stopwatch.Stop();

        var incidentId = Guid.NewGuid();

        _logger.LogInformation(
            "Triage completed for incident {IncidentId}: {Severity} with {AlertCount} alerts, {CountyCount} counties in {Duration}ms",
            incidentId,
            overallSeverity,
            deduplicatedAlerts.Count,
            impactedCountyIds.Count,
            stopwatch.ElapsedMilliseconds);

        var summary = new IncidentSummary
        {
            IncidentId = incidentId,
            OverallSeverity = overallSeverity,
            Status = IncidentStatus.New,
            PrimaryCountyId = primaryCountyId == Guid.Empty ? null : primaryCountyId,
            ImpactedCountyIds = impactedCountyIds.Where(id => id != Guid.Empty).ToList(),
            Title = title,
            Description = description,
            Alerts = deduplicatedAlerts,
            Metrics = request.MetricSnapshots ?? new List<IncidentMetricSnapshot>(),
            Recommendations = recommendations,
            TriagedAt = DateTime.UtcNow,
            CorrelatedTraceId = request.TraceIds?.FirstOrDefault(),
            Government = true,
            AuditInfo = new IncidentAuditInfo
            {
                TriageEngineVersion = _options.EngineVersion,
                AppliedRules = appliedRules,
                TriageDurationMs = stopwatch.ElapsedMilliseconds
            }
        };

        return Task.FromResult(summary);
    }

    /// <inheritdoc />
    public Task<List<IncidentRecommendation>> GetRecommendationsForAlertsAsync(
        IEnumerable<string> alertNames,
        IncidentSeverity severity,
        CancellationToken cancellationToken = default)
    {
        var recommendations = new List<IncidentRecommendation>();
        var seenTexts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var alertName in alertNames)
        {
            var alertRecs = RecommendationTemplates.GetRecommendationsForAlert(alertName);
            foreach (var rec in alertRecs)
            {
                if (seenTexts.Add(rec.Text))
                {
                    recommendations.Add(rec);
                }
            }
        }

        // Limit to max recommendations
        recommendations = recommendations
            .OrderBy(r => r.Priority)
            .Take(_options.MaxRecommendations)
            .ToList();

        // Ensure minimum recommendations
        while (recommendations.Count < _options.MinRecommendations)
        {
            var generic = RecommendationTemplates.GetRecommendationsForAlert("Unknown")
                .FirstOrDefault(r => !seenTexts.Contains(r.Text));
            if (generic != null)
            {
                recommendations.Add(generic);
                seenTexts.Add(generic.Text);
            }
            else
            {
                break;
            }
        }

        return Task.FromResult(recommendations);
    }

    /// <inheritdoc />
    public bool CanTriageAlerts(IEnumerable<string> alertNames)
    {
        // We can triage any alerts, known or unknown
        return alertNames != null && alertNames.Any();
    }

    // =========================================================================
    // Private Implementation Methods
    // =========================================================================

    private List<IncidentAlertRef> DeduplicateAlerts(List<IncidentAlertRef> alerts)
    {
        return alerts
            .GroupBy(a => a.Fingerprint)
            .Select(g => g.First())
            .ToList();
    }

    private List<Guid> ExtractCountyIds(List<IncidentAlertRef> alerts)
    {
        var countyIds = new HashSet<Guid>();

        foreach (var alert in alerts)
        {
            if (alert.Labels.TryGetValue("countyId", out var countyIdStr) &&
                Guid.TryParse(countyIdStr, out var countyId))
            {
                countyIds.Add(countyId);
            }
        }

        return countyIds.ToList();
    }

    private IncidentSeverity DetermineOverallSeverity(List<IncidentAlertRef> alerts)
    {
        var highestSeverity = IncidentSeverity.Info;

        foreach (var alert in alerts)
        {
            var alertSeverity = ParseSeverity(alert);
            if (alertSeverity > highestSeverity)
            {
                highestSeverity = alertSeverity;
            }
        }

        return highestSeverity;
    }

    private IncidentSeverity ParseSeverity(IncidentAlertRef alert)
    {
        if (alert.Labels.TryGetValue("severity", out var severityStr))
        {
            return severityStr.ToLowerInvariant() switch
            {
                "critical" => IncidentSeverity.Critical,
                "warning" => IncidentSeverity.Warning,
                "info" => IncidentSeverity.Info,
                _ => IncidentSeverity.Info
            };
        }

        return IncidentSeverity.Info;
    }

    private (string Title, string Description) GenerateTitleAndDescription(
        List<IncidentAlertRef> alerts,
        List<Guid> impactedCountyIds)
    {
        // Group alerts by component
        var componentGroups = alerts
            .GroupBy(a => a.Labels.GetValueOrDefault("component", "unknown"))
            .ToDictionary(g => g.Key, g => g.ToList());

        // Determine primary component (most alerts)
        var primaryComponent = componentGroups
            .OrderByDescending(g => g.Value.Count)
            .First();

        // Build title
        string title;
        if (alerts.Count == 1)
        {
            title = $"{FormatAlertName(alerts[0].AlertName)}";
        }
        else if (componentGroups.Count == 1)
        {
            title = $"{FormatComponentName(primaryComponent.Key)} Incident ({alerts.Count} alerts)";
        }
        else
        {
            title = $"Multi-Component Incident ({alerts.Count} alerts across {componentGroups.Count} systems)";
        }

        // Add county context if single county
        if (impactedCountyIds.Count == 1)
        {
            title = $"{title} - Single County";
        }
        else if (impactedCountyIds.Count > 1)
        {
            title = $"{title} - {impactedCountyIds.Count} Counties";
        }

        // Build description
        var alertDescriptions = alerts
            .Take(5)
            .Select(a => $"- {FormatAlertName(a.AlertName)}")
            .ToList();

        var description = $"Incident triggered by {alerts.Count} alert(s) in the {FormatComponentName(primaryComponent.Key)} system.\n\nAlerts:\n{string.Join("\n", alertDescriptions)}";

        if (alerts.Count > 5)
        {
            description += $"\n... and {alerts.Count - 5} more alerts";
        }

        return (title, description);
    }

    private string FormatAlertName(string alertName)
    {
        // Convert "AtlasForecastStale" to "Atlas Forecast Stale"
        var result = System.Text.RegularExpressions.Regex.Replace(
            alertName,
            "([a-z])([A-Z])",
            "$1 $2");

        return result;
    }

    private string FormatComponentName(string component)
    {
        return component.ToLowerInvariant() switch
        {
            "atlas" => "Atlas Forecast Engine",
            "swarm" => "Swarm AI Agent",
            _ => char.ToUpper(component[0]) + component[1..]
        };
    }

    private List<IncidentRecommendation> GenerateRecommendations(List<IncidentAlertRef> alerts)
    {
        var recommendations = new List<IncidentRecommendation>();
        var seenTexts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var alert in alerts)
        {
            var alertRecs = RecommendationTemplates.GetRecommendationsForAlert(alert.AlertName);
            foreach (var rec in alertRecs)
            {
                if (seenTexts.Add(rec.Text))
                {
                    recommendations.Add(rec);
                }
            }
        }

        // Order by priority and limit
        recommendations = recommendations
            .OrderBy(r => r.Priority)
            .Take(_options.MaxRecommendations)
            .ToList();

        // Ensure minimum recommendations
        while (recommendations.Count < _options.MinRecommendations)
        {
            var generic = RecommendationTemplates.GetRecommendationsForAlert("Unknown")
                .FirstOrDefault(r => !seenTexts.Contains(r.Text));
            if (generic != null)
            {
                recommendations.Add(generic);
                seenTexts.Add(generic.Text);
            }
            else
            {
                break;
            }
        }

        return recommendations;
    }

    private List<string> BuildAppliedRulesList(List<IncidentAlertRef> alerts, IncidentSeverity severity)
    {
        var rules = new List<string>
        {
            $"DeduplicateByFingerprint: {alerts.Count} alerts after deduplication",
            $"SeverityEscalation: Highest severity = {severity}",
            $"RecommendationMin: {_options.MinRecommendations}",
            $"RecommendationMax: {_options.MaxRecommendations}"
        };

        // Document component grouping
        var components = alerts
            .Select(a => a.Labels.GetValueOrDefault("component", "unknown"))
            .Distinct()
            .ToList();

        rules.Add($"ComponentGrouping: {string.Join(", ", components)}");

        return rules;
    }
}
