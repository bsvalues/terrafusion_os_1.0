// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TerraFusion SystemGPT Policy Evaluator
// Phase 24: AI Policy Engine (v1) - Policy enforcement for GPT operations
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 24: Service interface for evaluating GPT requests against county policies.
/// The heart of the AI Policy Engine - enforces rules before GPT execution.
/// </summary>
public interface ISystemGptPolicyEvaluator
{
    /// <summary>
    /// Evaluate a GPT request against the county's policy.
    /// </summary>
    /// <param name="request">Request context with all relevant information.</param>
    /// <returns>Evaluation result indicating allow/deny and any modifications.</returns>
    Task<PolicyEvaluationResult> EvaluateRequestAsync(GptRequestContext request);
}

/// <summary>
/// Phase 24: Implementation of the policy evaluator.
/// Applies county-specific rules to determine if GPT operations are allowed.
/// </summary>
public class SystemGptPolicyEvaluator : ISystemGptPolicyEvaluator
{
    private readonly ICountyPolicyService _policyService;
    private readonly ISystemGptEventService? _eventService;
    private readonly ILogger<SystemGptPolicyEvaluator> _logger;

    /// <summary>
    /// Regex pattern for sanitizing owner names (simple v1 implementation).
    /// Matches common name patterns: "John Doe", "SMITH, JOHN", etc.
    /// </summary>
    private static readonly Regex OwnerNamePattern = new(
        @"\b[A-Z][a-z]+\s+[A-Z][a-z]+\b|\b[A-Z]+,\s*[A-Z]+\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    /// <summary>
    /// Replacement text for sanitized owner names.
    /// </summary>
    private const string SanitizedOwnerPlaceholder = "[OWNER_REDACTED]";

    public SystemGptPolicyEvaluator(
        ICountyPolicyService policyService,
        ILogger<SystemGptPolicyEvaluator> logger,
        ISystemGptEventService? eventService = null)
    {
        _policyService = policyService;
        _logger = logger;
        _eventService = eventService;
    }

    /// <inheritdoc />
    public async Task<PolicyEvaluationResult> EvaluateRequestAsync(GptRequestContext request)
    {
        var policy = await _policyService.GetPolicyAsync(request.CountyId);

        _logger.LogDebug("Phase 24: Evaluating policy for {County}, GPTConfig={Config}, ContextId={Context}",
            request.CountyId, request.GptConfigKey, request.ContextId);

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 1: Check if GPT send message is allowed
        // ═══════════════════════════════════════════════════════════════════════
        if (!policy.AllowGptSendMessage && !request.IsExplainRequest)
        {
            return LogAndReturnDeny(policy, request,
                $"GPT messaging is disabled for {policy.CountyName}",
                "AllowGptSendMessage=false",
                PolicyEventKind.PolicyDeny);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 2: Check if RAG is allowed (when required)
        // ═══════════════════════════════════════════════════════════════════════
        if (request.RequiresRag && !policy.AllowRagQueries)
        {
            return LogAndReturnDeny(policy, request,
                $"RAG queries are disabled for {policy.CountyName}",
                "AllowRagQueries=false",
                PolicyEventKind.PolicyDeny);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 3: Check if embeddings are allowed (when required)
        // ═══════════════════════════════════════════════════════════════════════
        if (request.RequiresEmbedding && !policy.AllowEmbeddings)
        {
            return LogAndReturnDeny(policy, request,
                $"Embedding generation is disabled for {policy.CountyName}",
                "AllowEmbeddings=false",
                PolicyEventKind.PolicyDeny);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 4: Check if ExplainGPT is allowed (for explain requests)
        // ═══════════════════════════════════════════════════════════════════════
        if (request.IsExplainRequest && !policy.AllowExplainGpt)
        {
            return LogAndReturnDeny(policy, request,
                $"ExplainGPT is disabled for {policy.CountyName}",
                "AllowExplainGpt=false",
                PolicyEventKind.PolicyDeny);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 5: Check deny context IDs
        // ═══════════════════════════════════════════════════════════════════════
        if (!string.IsNullOrEmpty(request.ContextId) && policy.DenyContextIds.Count > 0)
        {
            var blockedContext = policy.DenyContextIds
                .FirstOrDefault(c => string.Equals(c, request.ContextId, StringComparison.OrdinalIgnoreCase));

            if (blockedContext != null)
            {
                return LogAndReturnDeny(policy, request,
                    $"Context '{request.ContextId}' is blocked by policy for {policy.CountyName}",
                    $"DenyContextIds contains '{blockedContext}'",
                    PolicyEventKind.PolicyDeny);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 6: Check deny prompt patterns (regex)
        // ═══════════════════════════════════════════════════════════════════════
        if (!string.IsNullOrEmpty(request.Prompt) && policy.DenyPromptPatterns.Count > 0)
        {
            foreach (var pattern in policy.DenyPromptPatterns)
            {
                try
                {
                    if (Regex.IsMatch(request.Prompt, pattern, RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(100)))
                    {
                        return LogAndReturnDeny(policy, request,
                            $"Prompt matches denied pattern for {policy.CountyName}",
                            $"DenyPromptPatterns matched: '{pattern}'",
                            PolicyEventKind.PolicyDeny);
                    }
                }
                catch (RegexMatchTimeoutException)
                {
                    _logger.LogWarning("Policy regex timeout for pattern: {Pattern}", pattern);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 7: Apply sanitization if configured
        // ═══════════════════════════════════════════════════════════════════════
        string? sanitizedPrompt = null;
        bool wasSanitized = false;

        if (policy.SanitizeOwnerNames && !string.IsNullOrEmpty(request.Prompt))
        {
            var originalPrompt = request.Prompt;
            sanitizedPrompt = OwnerNamePattern.Replace(request.Prompt, SanitizedOwnerPlaceholder);
            wasSanitized = sanitizedPrompt != originalPrompt;

            if (wasSanitized)
            {
                _logger.LogInformation("Phase 24: Owner names sanitized for {County}", policy.CountyName);
                LogPolicyEvent(PolicyEventKind.PolicySanitize, policy, request,
                    "Owner names sanitized from prompt");
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Rule 8: Check if ExplainGPT is required for valuation contexts
        // ═══════════════════════════════════════════════════════════════════════
        bool requiresExplain = false;
        if (policy.RequireExplainOnValuation)
        {
            var valuationContexts = new[] { "valuation", "assessment", "value", "appraisal" };
            if (!string.IsNullOrEmpty(request.ContextId) &&
                valuationContexts.Any(v => request.ContextId.Contains(v, StringComparison.OrdinalIgnoreCase)))
            {
                requiresExplain = true;
                _logger.LogInformation("Phase 24: ExplainGPT required for valuation context in {County}", policy.CountyName);
                LogPolicyEvent(PolicyEventKind.PolicyForceExplain, policy, request,
                    $"ExplainGPT required for context '{request.ContextId}'");
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // All rules passed - allow the request
        // ═══════════════════════════════════════════════════════════════════════
        _logger.LogDebug("Phase 24: Policy evaluation ALLOWED for {County}", policy.CountyName);

        return new PolicyEvaluationResult
        {
            Allowed = true,
            SanitizedPrompt = wasSanitized ? sanitizedPrompt : null,
            WasSanitized = wasSanitized,
            RequiresExplain = requiresExplain,
            PolicyVersion = policy.PolicyVersion,
            EvaluatedAtUtc = DateTimeOffset.UtcNow
        };
    }

    /// <summary>
    /// Log denial and return result.
    /// </summary>
    private PolicyEvaluationResult LogAndReturnDeny(
        SystemGptPolicyDto policy,
        GptRequestContext request,
        string reason,
        string rule,
        PolicyEventKind eventKind)
    {
        _logger.LogWarning("Phase 24: Policy DENIED for {County} - {Reason} (Rule: {Rule})",
            policy.CountyName, reason, rule);

        LogPolicyEvent(eventKind, policy, request, $"{reason} [Rule: {rule}]");

        return PolicyEvaluationResult.Deny(reason, rule);
    }

    /// <summary>
    /// Log policy event to Herald/event service.
    /// </summary>
    private void LogPolicyEvent(
        PolicyEventKind kind,
        SystemGptPolicyDto policy,
        GptRequestContext request,
        string details)
    {
        if (_eventService == null) return;

        try
        {
            var severity = kind == PolicyEventKind.PolicyDeny ? "warning" : "info";
            var summary = kind switch
            {
                PolicyEventKind.PolicyDeny => $"Policy denied request for {policy.CountyName}",
                PolicyEventKind.PolicySanitize => $"Policy sanitized prompt for {policy.CountyName}",
                PolicyEventKind.PolicyForceExplain => $"Policy requires ExplainGPT for {policy.CountyName}",
                _ => $"Policy event for {policy.CountyName}"
            };

            _eventService.RecordEvent(new SystemGptEventDto
            {
                TimestampUtc = DateTimeOffset.UtcNow,
                Kind = SystemGptEventKind.HeraldWarning, // Map to existing enum
                Severity = severity,
                Summary = summary,
                Details = details,
                Actor = request.UserId,
                CorrelationId = $"policy-{request.CountyId}-{Guid.NewGuid():N}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to record policy event (non-critical)");
        }
    }
}
