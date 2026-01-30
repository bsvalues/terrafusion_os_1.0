// =============================================================================
// Phase 42: Auto-Remediation Policy Engine - Implementation
// =============================================================================
// POLICY SPEC LOCK v1.0.0
// Core implementation of the remediation policy engine.
// =============================================================================

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks.Remediation;

/// <summary>
/// Core implementation of <see cref="IRemediationPolicyEngine"/>.
/// POLICY SPEC LOCK v1.0.0
///
/// Rule Matching Precedence (highest to lowest):
/// 1. Explicit DenyAutoExecute always wins if matched
/// 2. Higher Priority value wins
/// 3. More specific rules (more non-null filters) win over general rules
/// 4. County-specific rules win over global rules
/// 5. First matching rule in list order breaks ties
///
/// Default Behavior:
/// - If no rule matches: RequireHumanApproval (conservative)
/// </summary>
public sealed class RemediationPolicyEngine : IRemediationPolicyEngine
{
    private readonly RemediationPolicyOptions _options;
    private readonly ILogger<RemediationPolicyEngine> _logger;

    /// <summary>
    /// Initializes a new instance of <see cref="RemediationPolicyEngine"/>.
    /// </summary>
    public RemediationPolicyEngine(
        IOptions<RemediationPolicyOptions> options,
        ILogger<RemediationPolicyEngine> logger)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public RemediationDecision Evaluate(RemediationPolicyContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        // Resolve the applicable policy (county-specific first, then global)
        var (policy, scopeId) = ResolvePolicy(context.CountyId);

        if (policy is null || policy.Rules.Count == 0)
        {
            var defaultDecision = RemediationDecision.Default(scopeId);
            LogEvaluation(context, defaultDecision);
            return defaultDecision;
        }

        // Find all matching rules
        var matchingRules = policy.Rules
            .Where(r => RuleMatches(r, context))
            .ToList();

        if (matchingRules.Count == 0)
        {
            var defaultDecision = RemediationDecision.Default(scopeId);
            LogEvaluation(context, defaultDecision);
            return defaultDecision;
        }

        // Apply precedence to select the winning rule
        var winningRule = SelectWinningRule(matchingRules, context);

        var decision = new RemediationDecision(
            winningRule.Decision,
            winningRule.RuleId,
            scopeId,
            $"Matched rule '{winningRule.RuleId}'"
        );

        LogEvaluation(context, decision);
        return decision;
    }

    /// <inheritdoc />
    public IReadOnlyDictionary<string, RemediationDecision> EvaluatePlan(
        string countyId,
        IncidentSeverity severity,
        RunbookPlan plan,
        DateTimeOffset timestamp,
        IReadOnlyList<string>? alertNames = null)
    {
        ArgumentNullException.ThrowIfNull(plan);

        var results = new Dictionary<string, RemediationDecision>();

        foreach (var step in plan.Steps)
        {
            var context = new RemediationPolicyContext(
                countyId,
                severity,
                plan,
                step,
                timestamp,
                alertNames
            );

            results[step.StepId] = Evaluate(context);
        }

        return results;
    }

    /// <summary>
    /// Resolves the applicable policy for the given county.
    /// </summary>
    private (RemediationPolicy? Policy, string ScopeId) ResolvePolicy(string countyId)
    {
        // Try county-specific first
        if (!string.IsNullOrWhiteSpace(countyId) &&
            _options.CountyPolicies.TryGetValue(countyId.ToLowerInvariant(), out var countyPolicy))
        {
            return (countyPolicy, countyId.ToLowerInvariant());
        }

        // Fall back to global
        return (_options.GlobalPolicy, _options.GlobalScopeId);
    }

    /// <summary>
    /// Checks if a rule matches the given context.
    /// </summary>
    private static bool RuleMatches(RemediationRule rule, RemediationPolicyContext context)
    {
        // County filter
        if (rule.CountyId is not null &&
            !string.Equals(rule.CountyId, context.CountyId, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Component filter (uses step Title as proxy since RunbookStep doesn't have a Component property)
        if (rule.Component is not null &&
            !context.Step.Title.Contains(rule.Component, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // StepKind filter
        if (rule.StepKind.HasValue && rule.StepKind.Value != context.Step.Kind)
        {
            return false;
        }

        // SafetyLevel filter
        if (rule.SafetyLevel.HasValue && rule.SafetyLevel.Value != context.Step.SafetyLevel)
        {
            return false;
        }

        // Severity range filter
        if (rule.MinSeverity.HasValue && context.Severity < rule.MinSeverity.Value)
        {
            return false;
        }

        if (rule.MaxSeverity.HasValue && context.Severity > rule.MaxSeverity.Value)
        {
            return false;
        }

        // Alert names filter (any match = pass)
        if (rule.AlertNames is { Count: > 0 } && context.AlertNames is { Count: > 0 })
        {
            var hasMatch = rule.AlertNames.Any(rn =>
                context.AlertNames.Any(cn =>
                    cn.Contains(rn, StringComparison.OrdinalIgnoreCase)));

            if (!hasMatch)
            {
                return false;
            }
        }

        // Time window filter (optional, skip if not configured)
        if (rule.ActiveFromUtcOffset.HasValue && rule.ActiveToUtcOffset.HasValue)
        {
            var currentTimeOfDay = context.Timestamp.TimeOfDay;
            var from = rule.ActiveFromUtcOffset.Value;
            var to = rule.ActiveToUtcOffset.Value;

            // Handle overnight windows (e.g., 22:00 to 06:00)
            if (from <= to)
            {
                if (currentTimeOfDay < from || currentTimeOfDay > to)
                {
                    return false;
                }
            }
            else
            {
                if (currentTimeOfDay < from && currentTimeOfDay > to)
                {
                    return false;
                }
            }
        }

        return true;
    }

    /// <summary>
    /// Selects the winning rule based on precedence.
    /// </summary>
    private static RemediationRule SelectWinningRule(
        List<RemediationRule> matchingRules,
        RemediationPolicyContext context)
    {
        // Rule 1: Explicit DenyAutoExecute always wins
        var denyRule = matchingRules.FirstOrDefault(r =>
            r.Decision == RemediationDecisionKind.DenyAutoExecute);
        if (denyRule is not null)
        {
            return denyRule;
        }

        // Rule 2-5: Sort by priority (desc), specificity (desc), then list order
        return matchingRules
            .OrderByDescending(r => r.Priority)
            .ThenByDescending(r => CalculateSpecificity(r))
            .First();
    }

    /// <summary>
    /// Calculates a specificity score for a rule (more non-null filters = higher score).
    /// </summary>
    private static int CalculateSpecificity(RemediationRule rule)
    {
        var score = 0;

        if (rule.CountyId is not null) score += 10; // County-specific gets high weight
        if (rule.Component is not null) score += 5;
        if (rule.StepKind.HasValue) score += 3;
        if (rule.SafetyLevel.HasValue) score += 3;
        if (rule.MinSeverity.HasValue) score += 2;
        if (rule.MaxSeverity.HasValue) score += 2;
        if (rule.AlertNames is { Count: > 0 }) score += 2;
        if (rule.ActiveFromUtcOffset.HasValue) score += 1;

        return score;
    }

    /// <summary>
    /// Logs the evaluation result.
    /// </summary>
    private void LogEvaluation(RemediationPolicyContext context, RemediationDecision decision)
    {
        if (!_options.LogEvaluations) return;

        _logger.LogInformation(
            "Policy evaluation: County={CountyId}, Step={StepId}, Kind={StepKind}, Safety={SafetyLevel}, " +
            "Decision={Decision}, RuleId={RuleId}, Scope={ScopeId}",
            context.CountyId,
            context.Step.StepId,
            context.Step.Kind,
            context.Step.SafetyLevel,
            decision.Kind,
            decision.AppliedRuleId ?? "(default)",
            decision.ScopeId);
    }
}
