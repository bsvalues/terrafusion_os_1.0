// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TerraFusion SystemGPT Guardrails Models
// Phase 26: SystemGPT Autonomous Guardrails (v1)
// Automatic policy, metrics, and capacity-based decision making for GPT operations
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models;

/// <summary>
/// Phase 26: Guardrail decision kinds for categorizing decisions.
/// </summary>
public enum GuardrailDecisionKind
{
    /// <summary>No guardrail decision (default).</summary>
    None = 0,

    /// <summary>Request was allowed to proceed.</summary>
    Allowed = 1,

    /// <summary>Request was denied by policy rules.</summary>
    DeniedByPolicy = 2,

    /// <summary>Request was denied because county is not configured.</summary>
    DeniedUnconfigured = 3,

    /// <summary>Request was throttled due to capacity concerns.</summary>
    ThrottledByCapacity = 4,

    /// <summary>Safe Mode is recommended due to rising issues.</summary>
    SafeModeRecommended = 5,

    /// <summary>Prompt was sanitized by policy.</summary>
    Sanitized = 6,

    /// <summary>ExplainGPT was forced for this context.</summary>
    ForceExplainOnValuation = 7
}

/// <summary>
/// Phase 26: Result of guardrail evaluation for a GPT request.
/// Contains decision, flags, and advisory information for observability.
/// </summary>
public sealed class GuardrailDecision
{
    /// <summary>Whether the request is allowed to proceed.</summary>
    public bool Allow { get; init; } = true;

    /// <summary>Reason for denial (if Allow=false).</summary>
    public string? DenyReason { get; init; }

    /// <summary>Category of this decision for UI/logging.</summary>
    public GuardrailDecisionKind Kind { get; init; } = GuardrailDecisionKind.None;

    // ═══════════════════════════════════════════════════════════════════════════
    // Behavior Flags
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Safe Mode is recommended based on rising latency and error rates.
    /// v1: recommend only, not auto-execute.
    /// </summary>
    public bool AutoSafeModeRecommended { get; init; }

    /// <summary>
    /// Request should be throttled (delay or reduced tokens) due to capacity.
    /// </summary>
    public bool AutoThrottle { get; init; }

    /// <summary>
    /// ExplainGPT must be invoked for this request (e.g., valuation context).
    /// </summary>
    public bool ForceExplain { get; init; }

    /// <summary>
    /// Sanitization should be applied to the prompt before processing.
    /// </summary>
    public bool AutoSanitize { get; init; }

    // ═══════════════════════════════════════════════════════════════════════════
    // Diagnostics / UI
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Human-readable explanation of what happened and why.
    /// Displayed in SystemGPT Console and Herald logs.
    /// </summary>
    public string? Advisory { get; init; }

    /// <summary>
    /// Timestamp when this decision was made.
    /// </summary>
    public DateTimeOffset DecisionTimestampUtc { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// County ID this decision applies to.
    /// </summary>
    public string? CountyId { get; init; }

    /// <summary>
    /// Context ID of the request (e.g., "valuation", "property-card").
    /// </summary>
    public string? ContextId { get; init; }

    // ═══════════════════════════════════════════════════════════════════════════
    // Factory Methods
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>Create an "allowed" decision with optional flags.</summary>
    public static GuardrailDecision CreateAllowed(
        string? countyId = null,
        string? contextId = null,
        bool autoSanitize = false,
        bool forceExplain = false,
        bool autoThrottle = false,
        bool safeModeRecommended = false,
        string? advisory = null)
    {
        var kind = GuardrailDecisionKind.Allowed;
        if (autoThrottle) kind = GuardrailDecisionKind.ThrottledByCapacity;
        else if (safeModeRecommended) kind = GuardrailDecisionKind.SafeModeRecommended;
        else if (forceExplain) kind = GuardrailDecisionKind.ForceExplainOnValuation;
        else if (autoSanitize) kind = GuardrailDecisionKind.Sanitized;

        return new GuardrailDecision
        {
            Allow = true,
            Kind = kind,
            CountyId = countyId,
            ContextId = contextId,
            AutoSanitize = autoSanitize,
            ForceExplain = forceExplain,
            AutoThrottle = autoThrottle,
            AutoSafeModeRecommended = safeModeRecommended,
            Advisory = advisory
        };
    }

    /// <summary>Create a "denied" decision.</summary>
    public static GuardrailDecision CreateDenied(
        string reason,
        GuardrailDecisionKind kind,
        string? countyId = null,
        string? contextId = null,
        string? advisory = null)
    {
        return new GuardrailDecision
        {
            Allow = false,
            DenyReason = reason,
            Kind = kind,
            CountyId = countyId,
            ContextId = contextId,
            Advisory = advisory ?? reason
        };
    }
}

/// <summary>
/// Phase 26: DTO for exposing last guardrail decision in SystemGPT Console.
/// </summary>
public sealed class LastGuardrailDecisionDto
{
    /// <summary>Whether the request was allowed.</summary>
    public bool Allow { get; init; }

    /// <summary>Reason for denial (if Allow=false).</summary>
    public string? DenyReason { get; init; }

    /// <summary>Decision kind for categorization.</summary>
    public string Kind { get; init; } = "None";

    /// <summary>Safe Mode is recommended based on system state.</summary>
    public bool AutoSafeModeRecommended { get; init; }

    /// <summary>Request was/should be throttled.</summary>
    public bool AutoThrottle { get; init; }

    /// <summary>ExplainGPT is required for this request.</summary>
    public bool ForceExplain { get; init; }

    /// <summary>Sanitization was/should be applied.</summary>
    public bool AutoSanitize { get; init; }

    /// <summary>Human-readable advisory message.</summary>
    public string? Advisory { get; init; }

    /// <summary>When this decision was made.</summary>
    public DateTimeOffset DecisionTimestampUtc { get; init; }

    /// <summary>Context ID of the evaluated request.</summary>
    public string? ContextId { get; init; }

    /// <summary>Create DTO from internal GuardrailDecision.</summary>
    public static LastGuardrailDecisionDto FromDecision(GuardrailDecision decision)
    {
        return new LastGuardrailDecisionDto
        {
            Allow = decision.Allow,
            DenyReason = decision.DenyReason,
            Kind = decision.Kind.ToString(),
            AutoSafeModeRecommended = decision.AutoSafeModeRecommended,
            AutoThrottle = decision.AutoThrottle,
            ForceExplain = decision.ForceExplain,
            AutoSanitize = decision.AutoSanitize,
            Advisory = decision.Advisory,
            DecisionTimestampUtc = decision.DecisionTimestampUtc,
            ContextId = decision.ContextId
        };
    }
}

/// <summary>
/// Phase 26: Herald event kinds for guardrail logging.
/// </summary>
public enum GuardrailEventKind
{
    /// <summary>Request was allowed by guardrails.</summary>
    GuardrailAllow = 0,

    /// <summary>Request was denied by guardrails.</summary>
    GuardrailDeny = 1,

    /// <summary>Prompt was sanitized by guardrails.</summary>
    GuardrailSanitize = 2,

    /// <summary>ExplainGPT was forced by guardrails.</summary>
    GuardrailForceExplain = 3,

    /// <summary>Request was throttled by guardrails.</summary>
    GuardrailAutoThrottle = 4,

    /// <summary>Safe Mode was recommended by guardrails.</summary>
    GuardrailSafeModeRecommended = 5
}
