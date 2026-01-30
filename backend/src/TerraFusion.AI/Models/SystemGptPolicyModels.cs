// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TerraFusion SystemGPT Policy Engine Models
// Phase 24: AI Policy Engine (v1) - County-scoped governance for GPT operations
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models;

/// <summary>
/// Phase 24: County-scoped AI policy configuration.
/// Defines what AI operations are allowed/denied for each county.
/// v1 is read-only; future phases may allow runtime modification.
/// </summary>
public sealed class SystemGptPolicyDto
{
    /// <summary>County code this policy applies to.</summary>
    public string CountyId { get; init; } = "benton";

    /// <summary>County display name for UI.</summary>
    public string CountyName { get; init; } = "Benton County";

    // ═══════════════════════════════════════════════════════════════════════════
    // Operation Permissions
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>Allow GPT chat/send message operations.</summary>
    public bool AllowGptSendMessage { get; init; } = true;

    /// <summary>Allow RAG (retrieval-augmented generation) queries.</summary>
    public bool AllowRagQueries { get; init; } = true;

    /// <summary>Allow embedding generation operations.</summary>
    public bool AllowEmbeddings { get; init; } = true;

    /// <summary>Allow ExplainGPT operations.</summary>
    public bool AllowExplainGpt { get; init; } = true;

    // ═══════════════════════════════════════════════════════════════════════════
    // Enforcement Rules
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>Require ExplainGPT for valuation-related contexts.</summary>
    public bool RequireExplainOnValuation { get; init; } = false;

    /// <summary>Sanitize owner names from prompts before processing.</summary>
    public bool SanitizeOwnerNames { get; init; } = false;

    // ═══════════════════════════════════════════════════════════════════════════
    // Deny Rules
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>Regex patterns that will cause prompt denial (case-insensitive).</summary>
    public IReadOnlyList<string> DenyPromptPatterns { get; init; } = Array.Empty<string>();

    /// <summary>Context IDs that are blocked from AI processing.</summary>
    public IReadOnlyList<string> DenyContextIds { get; init; } = Array.Empty<string>();

    // ═══════════════════════════════════════════════════════════════════════════
    // Metadata
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>When this policy was last updated.</summary>
    public DateTimeOffset LastUpdatedUtc { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Policy version for audit purposes.</summary>
    public string PolicyVersion { get; init; } = "1.0";

    /// <summary>Whether this is a placeholder policy for non-configured counties.</summary>
    public bool IsPlaceholder { get; init; } = false;
}

/// <summary>
/// Phase 24: Context for evaluating a GPT request against policy.
/// Contains all information needed to make a policy decision.
/// </summary>
public sealed class GptRequestContext
{
    /// <summary>County ID for this request.</summary>
    public CountyId CountyId { get; init; }

    /// <summary>User's prompt text.</summary>
    public string Prompt { get; init; } = string.Empty;

    /// <summary>GPT configuration key being invoked.</summary>
    public string? GptConfigKey { get; init; }

    /// <summary>Context ID (e.g., "valuation", "property-card", "comps").</summary>
    public string? ContextId { get; init; }

    /// <summary>Whether this request needs RAG retrieval.</summary>
    public bool RequiresRag { get; init; }

    /// <summary>Whether this request needs embedding generation.</summary>
    public bool RequiresEmbedding { get; init; }

    /// <summary>Whether this is an ExplainGPT request.</summary>
    public bool IsExplainRequest { get; init; }

    /// <summary>User identifier for audit purposes.</summary>
    public string? UserId { get; init; }

    /// <summary>Request timestamp.</summary>
    public DateTimeOffset RequestedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// Phase 24: Result of policy evaluation.
/// Indicates whether the request is allowed and any modifications needed.
/// </summary>
public sealed class PolicyEvaluationResult
{
    /// <summary>Whether the request is allowed to proceed.</summary>
    public bool Allowed { get; init; } = true;

    /// <summary>Reason for denial (if Allowed=false).</summary>
    public string? DenyReason { get; init; }

    /// <summary>Policy rule that caused denial (for audit logging).</summary>
    public string? DenyRule { get; init; }

    /// <summary>Sanitized/modified prompt (if sanitization was applied).</summary>
    public string? SanitizedPrompt { get; init; }

    /// <summary>Whether the prompt was modified by sanitization.</summary>
    public bool WasSanitized { get; init; }

    /// <summary>Whether ExplainGPT is required for this request.</summary>
    public bool RequiresExplain { get; init; }

    /// <summary>Warnings (non-blocking) for the request.</summary>
    public IReadOnlyList<string> Warnings { get; init; } = Array.Empty<string>();

    /// <summary>Policy version that was evaluated.</summary>
    public string PolicyVersion { get; init; } = "1.0";

    /// <summary>Evaluation timestamp.</summary>
    public DateTimeOffset EvaluatedAtUtc { get; init; } = DateTimeOffset.UtcNow;

    // ═══════════════════════════════════════════════════════════════════════════
    // Factory Methods
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>Create an "allowed" result.</summary>
    public static PolicyEvaluationResult Allow(string? sanitizedPrompt = null, bool requiresExplain = false)
    {
        return new PolicyEvaluationResult
        {
            Allowed = true,
            SanitizedPrompt = sanitizedPrompt,
            WasSanitized = sanitizedPrompt != null,
            RequiresExplain = requiresExplain
        };
    }

    /// <summary>Create a "denied" result.</summary>
    public static PolicyEvaluationResult Deny(string reason, string rule)
    {
        return new PolicyEvaluationResult
        {
            Allowed = false,
            DenyReason = reason,
            DenyRule = rule
        };
    }
}

/// <summary>
/// Phase 24: Policy event kinds for Herald logging.
/// </summary>
public enum PolicyEventKind
{
    /// <summary>Request was allowed by policy.</summary>
    PolicyAllow = 0,

    /// <summary>Request was denied by policy.</summary>
    PolicyDeny = 1,

    /// <summary>Prompt was sanitized by policy.</summary>
    PolicySanitize = 2,

    /// <summary>ExplainGPT was forced by policy.</summary>
    PolicyForceExplain = 3,

    /// <summary>Policy was updated.</summary>
    PolicyUpdated = 4
}
