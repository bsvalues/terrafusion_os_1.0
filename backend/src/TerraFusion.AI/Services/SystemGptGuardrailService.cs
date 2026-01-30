// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TerraFusion SystemGPT Guardrail Service
// Phase 26: SystemGPT Autonomous Guardrails (v1)
// Evaluates GPT requests against policy, metrics, and capacity for auto-decisions
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 26: Interface for SystemGPT guardrail evaluation.
/// Consumes policy, metrics, and capacity to make automatic decisions.
/// </summary>
public interface ISystemGptGuardrailService
{
    /// <summary>
    /// Evaluate guardrails for a GPT request.
    /// </summary>
    /// <param name="countyId">County ID enum.</param>
    /// <param name="request">GPT request context.</param>
    /// <param name="metrics">Current metrics snapshot (can be null if unavailable).</param>
    /// <param name="policy">County policy (can be null if unavailable).</param>
    /// <param name="isCountyConfigured">Whether this county has AI services configured.</param>
    /// <returns>GuardrailDecision with allow/deny and behavioral flags.</returns>
    GuardrailDecision EvaluateGuardrails(
        CountyId countyId,
        GptRequestContext request,
        SystemGptMetricsSnapshotDto? metrics,
        SystemGptPolicyDto? policy,
        bool isCountyConfigured);

    /// <summary>
    /// Get the last guardrail decision for a county (for diagnostics).
    /// </summary>
    /// <param name="countyId">County to retrieve decision for.</param>
    /// <returns>Last decision or null if none recorded.</returns>
    GuardrailDecision? GetLastDecision(CountyId countyId);

    /// <summary>
    /// Get all recent guardrail decisions (for Herald integration).
    /// </summary>
    /// <param name="maxCount">Maximum decisions to return.</param>
    /// <returns>Recent decisions ordered by timestamp descending.</returns>
    IReadOnlyList<GuardrailDecision> GetRecentDecisions(int maxCount = 10);
}

/// <summary>
/// Phase 26: In-memory implementation of SystemGPT guardrail evaluation.
/// Uses deterministic rules based on policy, metrics, and capacity.
/// </summary>
public class SystemGptGuardrailService : ISystemGptGuardrailService
{
    private readonly ILogger<SystemGptGuardrailService> _logger;
    private readonly ConcurrentDictionary<CountyId, GuardrailDecision> _lastDecisions = new();
    private readonly ConcurrentQueue<GuardrailDecision> _recentDecisions = new();

    /// <summary>Maximum recent decisions to retain.</summary>
    private const int MaxRecentDecisions = 100;

    // ═══════════════════════════════════════════════════════════════════════════
    // Configurable Thresholds (v1: hardcoded, future: from config)
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>Error rate threshold (%) that triggers Safe Mode recommendation.</summary>
    public const double SafeModeErrorRateThreshold = 5.0;

    /// <summary>High saturation risk level string for throttle rule.</summary>
    public const string HighSaturationRisk = "High";

    public SystemGptGuardrailService(ILogger<SystemGptGuardrailService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _logger.LogInformation("Phase 26: SystemGptGuardrailService initialized - Autonomous Guardrails ready");
    }

    /// <inheritdoc />
    public GuardrailDecision EvaluateGuardrails(
        CountyId countyId,
        GptRequestContext request,
        SystemGptMetricsSnapshotDto? metrics,
        SystemGptPolicyDto? policy,
        bool isCountyConfigured)
    {
        var countyIdStr = GetCountyIdString(countyId);
        var advisoryParts = new List<string>();

        _logger.LogDebug(
            "Phase 26: Evaluating guardrails for county={County}, context={Context}, configured={Configured}",
            countyIdStr, request.ContextId ?? "none", isCountyConfigured);

        // ─────────────────────────────────────────────────────────────────────
        // Rule 1: County Configuration Check
        // ─────────────────────────────────────────────────────────────────────
        if (!isCountyConfigured)
        {
            var decision = GuardrailDecision.CreateDenied(
                "SystemGPT is not configured for this county.",
                GuardrailDecisionKind.DeniedUnconfigured,
                countyIdStr,
                request.ContextId,
                "County does not have AI/RAG services configured. Contact your administrator.");

            RecordDecision(countyId, decision);
            _logger.LogWarning("Phase 26: GuardrailDeny - County {County} not configured", countyIdStr);
            return decision;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Rule 2: Policy-Level Allow/Deny
        // ─────────────────────────────────────────────────────────────────────
        if (policy != null)
        {
            // 2a: GPT send message disabled
            if (!policy.AllowGptSendMessage)
            {
                var decision = GuardrailDecision.CreateDenied(
                    "GPT operations are disabled by policy for this county.",
                    GuardrailDecisionKind.DeniedByPolicy,
                    countyIdStr,
                    request.ContextId,
                    "County policy has disabled GPT messaging.");

                RecordDecision(countyId, decision);
                _logger.LogWarning("Phase 26: GuardrailDeny - GPT disabled by policy for {County}", countyIdStr);
                return decision;
            }

            // 2b: RAG disabled but request requires RAG
            if (request.RequiresRag && !policy.AllowRagQueries)
            {
                var decision = GuardrailDecision.CreateDenied(
                    "RAG queries are disabled by policy for this county.",
                    GuardrailDecisionKind.DeniedByPolicy,
                    countyIdStr,
                    request.ContextId,
                    "This operation requires RAG retrieval, which is disabled by policy.");

                RecordDecision(countyId, decision);
                _logger.LogWarning("Phase 26: GuardrailDeny - RAG disabled by policy for {County}", countyIdStr);
                return decision;
            }

            // 2c: Embeddings disabled but request requires embeddings
            if (request.RequiresEmbedding && !policy.AllowEmbeddings)
            {
                var decision = GuardrailDecision.CreateDenied(
                    "Embedding operations are disabled by policy for this county.",
                    GuardrailDecisionKind.DeniedByPolicy,
                    countyIdStr,
                    request.ContextId,
                    "This operation requires embeddings, which are disabled by policy.");

                RecordDecision(countyId, decision);
                _logger.LogWarning("Phase 26: GuardrailDeny - Embeddings disabled by policy for {County}", countyIdStr);
                return decision;
            }

            // 2d: Prompt matches deny patterns
            if (policy.DenyPromptPatterns.Count > 0 && !string.IsNullOrEmpty(request.Prompt))
            {
                foreach (var pattern in policy.DenyPromptPatterns)
                {
                    try
                    {
                        if (Regex.IsMatch(request.Prompt, pattern, RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(100)))
                        {
                            var decision = GuardrailDecision.CreateDenied(
                                "Prompt contains prohibited content.",
                                GuardrailDecisionKind.DeniedByPolicy,
                                countyIdStr,
                                request.ContextId,
                                $"The prompt matched a prohibited pattern defined in county policy.");

                            RecordDecision(countyId, decision);
                            _logger.LogWarning("Phase 26: GuardrailDeny - Prompt pattern match for {County}", countyIdStr);
                            return decision;
                        }
                    }
                    catch (RegexMatchTimeoutException)
                    {
                        _logger.LogWarning("Phase 26: Regex timeout evaluating deny pattern for {County}", countyIdStr);
                    }
                }
            }

            // 2e: Context ID in deny list
            if (policy.DenyContextIds.Count > 0 && !string.IsNullOrEmpty(request.ContextId))
            {
                if (policy.DenyContextIds.Contains(request.ContextId, StringComparer.OrdinalIgnoreCase))
                {
                    var decision = GuardrailDecision.CreateDenied(
                        $"Context '{request.ContextId}' is blocked by policy.",
                        GuardrailDecisionKind.DeniedByPolicy,
                        countyIdStr,
                        request.ContextId,
                        "This context is not allowed for AI operations by county policy.");

                    RecordDecision(countyId, decision);
                    _logger.LogWarning("Phase 26: GuardrailDeny - Context {Context} blocked for {County}",
                        request.ContextId, countyIdStr);
                    return decision;
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Rule 3: Policy-Driven Sanitization
        // ─────────────────────────────────────────────────────────────────────
        var autoSanitize = false;
        if (policy?.SanitizeOwnerNames == true)
        {
            autoSanitize = true;
            advisoryParts.Add("Owner names will be sanitized by policy.");
        }

        // ─────────────────────────────────────────────────────────────────────
        // Rule 4: Valuation Context → Force Explain
        // ─────────────────────────────────────────────────────────────────────
        var forceExplain = false;
        if (IsValuationContext(request.ContextId) && (policy?.RequireExplainOnValuation ?? false))
        {
            forceExplain = true;
            advisoryParts.Add("ExplainGPT is required for valuation-related responses.");
        }

        // ─────────────────────────────────────────────────────────────────────
        // Rule 5: Capacity-Based AutoThrottle
        // ─────────────────────────────────────────────────────────────────────
        var autoThrottle = false;
        if (metrics?.Capacity != null)
        {
            if (string.Equals(metrics.Capacity.SaturationRisk, HighSaturationRisk, StringComparison.OrdinalIgnoreCase))
            {
                autoThrottle = true;
                advisoryParts.Add("System under high saturation risk; applying throttling for this request.");
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Rule 6: Safe Mode Recommendation (rising latency + error rate)
        // ─────────────────────────────────────────────────────────────────────
        var safeModeRecommended = false;
        if (metrics?.Capacity != null)
        {
            var latencyIncreasing = metrics.Capacity.LatencyIncreasing;
            var errorRateIncreasing = metrics.Capacity.ErrorRateIncreasing;
            var errorRateHigh = metrics.ErrorRatePercent >= SafeModeErrorRateThreshold;

            if (latencyIncreasing && errorRateIncreasing && errorRateHigh)
            {
                safeModeRecommended = true;
                advisoryParts.Add(
                    $"Rising latency and error rate detected ({metrics.ErrorRatePercent:F1}%); Safe Mode is recommended.");
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Build Final Decision (Allowed with flags)
        // ─────────────────────────────────────────────────────────────────────
        var advisory = advisoryParts.Count > 0
            ? string.Join(" ", advisoryParts)
            : "Request allowed; no guardrail actions required.";

        var allowedDecision = GuardrailDecision.CreateAllowed(
            countyIdStr,
            request.ContextId,
            autoSanitize,
            forceExplain,
            autoThrottle,
            safeModeRecommended,
            advisory);

        RecordDecision(countyId, allowedDecision);

        // Log significant flags
        if (autoThrottle)
            _logger.LogInformation("Phase 26: GuardrailAutoThrottle for {County}", countyIdStr);
        if (safeModeRecommended)
            _logger.LogWarning("Phase 26: GuardrailSafeModeRecommended for {County}", countyIdStr);
        if (forceExplain)
            _logger.LogInformation("Phase 26: GuardrailForceExplain for {County}, context={Context}",
                countyIdStr, request.ContextId);
        if (autoSanitize)
            _logger.LogInformation("Phase 26: GuardrailSanitize for {County}", countyIdStr);

        return allowedDecision;
    }

    /// <inheritdoc />
    public GuardrailDecision? GetLastDecision(CountyId countyId)
    {
        return _lastDecisions.TryGetValue(countyId, out var decision) ? decision : null;
    }

    /// <inheritdoc />
    public IReadOnlyList<GuardrailDecision> GetRecentDecisions(int maxCount = 10)
    {
        return _recentDecisions
            .OrderByDescending(d => d.DecisionTimestampUtc)
            .Take(maxCount)
            .ToList();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Private Helpers
    // ═══════════════════════════════════════════════════════════════════════════

    private void RecordDecision(CountyId countyId, GuardrailDecision decision)
    {
        _lastDecisions[countyId] = decision;
        _recentDecisions.Enqueue(decision);

        // Prune old decisions
        while (_recentDecisions.Count > MaxRecentDecisions)
        {
            _recentDecisions.TryDequeue(out _);
        }
    }

    private static string GetCountyIdString(CountyId countyId)
    {
        return countyId switch
        {
            CountyId.Benton => "benton",
            CountyId.Yakima => "yakima",
            CountyId.Franklin => "franklin",
            _ => "unknown"
        };
    }

    private static bool IsValuationContext(string? contextId)
    {
        if (string.IsNullOrEmpty(contextId)) return false;

        // Match common valuation-related context IDs
        return contextId.Contains("valuation", StringComparison.OrdinalIgnoreCase)
               || contextId.Contains("assessment", StringComparison.OrdinalIgnoreCase)
               || contextId.Contains("appraisal", StringComparison.OrdinalIgnoreCase)
               || contextId.Equals("comps", StringComparison.OrdinalIgnoreCase)
               || contextId.Equals("market-value", StringComparison.OrdinalIgnoreCase);
    }
}
