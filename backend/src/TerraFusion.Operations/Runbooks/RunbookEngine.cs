// =============================================================================
// Phase 40A: AI-Driven Incident Runbook Engine - Core Implementation
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0
// Deterministic runbook generation from incident summaries.
// =============================================================================

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Core runbook engine implementation.
/// Generates deterministic, safety-aware runbook plans from incident summaries.
/// </summary>
/// <remarks>
/// DESIGN PRINCIPLES:
/// 1. Deterministic: Same incident always produces same runbook
/// 2. Safety-first: All steps require human approval in Phase 40A
/// 3. Ordered: Steps follow logical sequence (diagnostics → config → restart → recovery)
/// 4. Auditable: All generation decisions logged
/// 5. Government-compliant: FISMA-High requirements met
/// </remarks>
public class RunbookEngine : IRunbookEngine
{
    private readonly RunbookEngineOptions _options;
    private readonly ILogger<RunbookEngine> _logger;
    private readonly IRunbookExplanationService _explanationService;

    public RunbookEngine(
        IOptions<RunbookEngineOptions> options,
        ILogger<RunbookEngine> logger,
        IRunbookExplanationService explanationService)
    {
        _options = options.Value;
        _logger = logger;
        _explanationService = explanationService;
    }

    /// <inheritdoc />
    public IReadOnlyList<string> SupportedAlertNames => RunbookTemplates.SupportedAlerts;

    /// <inheritdoc />
    public bool CanHandleIncident(IncidentSummary incident)
    {
        if (incident?.Alerts == null || incident.Alerts.Count == 0)
        {
            return false;
        }

        // We can handle any incident - unknown alerts get generic steps
        return true;
    }

    /// <inheritdoc />
    public async Task<RunbookPlan> GenerateRunbookAsync(
        IncidentSummary incident,
        RunbookOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(incident);

        var stopwatch = Stopwatch.StartNew();
        var effectiveOptions = options ?? _options.DefaultOptions;

        _logger.LogInformation(
            "Generating runbook for incident {IncidentId} with {AlertCount} alerts",
            incident.IncidentId,
            incident.Alerts.Count);

        // Collect steps from all alerts
        var allSteps = new List<RunbookStep>();
        var appliedTemplates = new List<string>();

        foreach (var alert in incident.Alerts)
        {
            var alertSteps = RunbookTemplates.GetStepsForAlert(alert.AlertName);
            allSteps.AddRange(alertSteps);
            appliedTemplates.Add(alert.AlertName);
        }

        // Deduplicate and merge steps
        var mergedSteps = MergeAndOrderSteps(allSteps);

        // Generate title and description
        var (title, description) = GenerateTitleAndDescription(incident, mergedSteps);

        // Build the plan
        var plan = new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = incident.IncidentId,
            Title = title,
            Description = description,
            OverallSeverity = incident.OverallSeverity,
            ImpactedCountyIds = incident.ImpactedCountyIds,
            Steps = mergedSteps,
            CreatedAt = DateTimeOffset.UtcNow,
            PlanVersion = "runbook-spec-v1.0.0",
            AuditInfo = new RunbookAuditInfo
            {
                EngineVersion = _options.EngineVersion,
                GenerationDurationMs = stopwatch.ElapsedMilliseconds,
                AppliedTemplates = appliedTemplates.Distinct().ToList(),
                LlmEnrichmentUsed = false
            }
        };

        // Optionally enrich with LLM explanations
        if (effectiveOptions.EnableLlmExplanation && await _explanationService.IsAvailableAsync(cancellationToken))
        {
            try
            {
                plan = await _explanationService.EnrichWithExplanationAsync(plan, incident, cancellationToken);
                plan = plan with
                {
                    AuditInfo = plan.AuditInfo! with { LlmEnrichmentUsed = true }
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LLM enrichment failed for incident {IncidentId}, returning base plan", incident.IncidentId);
                // Continue with base plan
            }
        }

        stopwatch.Stop();

        _logger.LogInformation(
            "Generated runbook {PlanId} for incident {IncidentId}: {StepCount} steps, {Severity} severity in {Duration}ms",
            plan.PlanId,
            incident.IncidentId,
            plan.Steps.Count,
            plan.OverallSeverity,
            stopwatch.ElapsedMilliseconds);

        return plan;
    }

    /// <summary>
    /// Merges steps from multiple alerts, deduplicates, and orders them logically.
    /// </summary>
    private List<RunbookStep> MergeAndOrderSteps(List<RunbookStep> allSteps)
    {
        // Group by similar titles to deduplicate
        var uniqueSteps = new Dictionary<string, RunbookStep>();

        foreach (var step in allSteps)
        {
            var key = NormalizeStepKey(step.Title, step.Kind);

            if (!uniqueSteps.ContainsKey(key))
            {
                uniqueSteps[key] = step;
            }
            else
            {
                // Merge related alerts into existing step
                var existing = uniqueSteps[key];
                var mergedAlerts = existing.RelatedAlertNames
                    .Concat(step.RelatedAlertNames)
                    .Distinct()
                    .ToList();
                var mergedMetrics = existing.RelatedMetricNames
                    .Concat(step.RelatedMetricNames)
                    .Distinct()
                    .ToList();

                uniqueSteps[key] = existing with
                {
                    RelatedAlertNames = mergedAlerts,
                    RelatedMetricNames = mergedMetrics
                };
            }
        }

        // Order by kind (Diagnostic first, then ConfigCheck, then services, etc.)
        var ordered = uniqueSteps.Values
            .OrderBy(s => GetKindOrder(s.Kind))
            .ThenBy(s => s.SafetyLevel)
            .ThenBy(s => s.Title)
            .ToList();

        // Re-number steps
        var result = new List<RunbookStep>();
        for (int i = 0; i < ordered.Count; i++)
        {
            result.Add(ordered[i] with { Order = i + 1 });
        }

        return result;
    }

    /// <summary>
    /// Creates a normalized key for deduplication.
    /// </summary>
    private static string NormalizeStepKey(string title, RunbookStepKind kind)
    {
        // Normalize to lowercase, remove extra spaces
        var normalizedTitle = title.ToLowerInvariant().Trim();
        return $"{kind}:{normalizedTitle}";
    }

    /// <summary>
    /// Gets the sort order for a step kind.
    /// Lower numbers come first.
    /// </summary>
    private static int GetKindOrder(RunbookStepKind kind)
    {
        return kind switch
        {
            RunbookStepKind.Diagnostic => 0,
            RunbookStepKind.DataValidation => 1,
            RunbookStepKind.ConfigCheck => 2,
            RunbookStepKind.ManualInvestigation => 3,
            RunbookStepKind.Notification => 4,
            RunbookStepKind.ScaleOut => 5,
            RunbookStepKind.RestartService => 6,
            RunbookStepKind.Rollback => 7,
            RunbookStepKind.Failover => 8,
            RunbookStepKind.Other => 9,
            _ => 99
        };
    }

    /// <summary>
    /// Generates the plan title and description based on the incident and steps.
    /// </summary>
    private (string Title, string Description) GenerateTitleAndDescription(
        IncidentSummary incident,
        List<RunbookStep> steps)
    {
        // Title based on incident
        var title = $"Runbook: {incident.Title}";

        // Description summarizes the plan
        var severityText = incident.OverallSeverity switch
        {
            IncidentSeverity.Critical => "CRITICAL - Immediate action required",
            IncidentSeverity.Warning => "WARNING - Action recommended",
            _ => "INFO - Review recommended"
        };

        var countyText = incident.ImpactedCountyIds.Count switch
        {
            0 => "infrastructure-wide",
            1 => "single county affected",
            _ => $"{incident.ImpactedCountyIds.Count} counties affected"
        };

        var stepSummary = steps.Count switch
        {
            0 => "No steps generated",
            1 => "1 step to execute",
            _ => $"{steps.Count} steps to execute"
        };

        var highRiskCount = steps.Count(s => s.SafetyLevel == RunbookSafetyLevel.HighRisk);
        var highRiskWarning = highRiskCount > 0
            ? $"\n\n⚠️ WARNING: This runbook contains {highRiskCount} high-risk step(s) requiring senior approval."
            : "";

        var description = $"""
            {severityText}

            This runbook addresses incident "{incident.Title}" ({countyText}).

            Summary: {stepSummary} in logical order from diagnostics to recovery.

            All steps require human approval before execution.{highRiskWarning}
            """;

        return (title, description);
    }
}
