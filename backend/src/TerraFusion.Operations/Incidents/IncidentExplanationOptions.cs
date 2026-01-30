// =============================================================================
// Phase 39: Incident Triage Engine - Explanation Options
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Configuration options for the LLM explanation service.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Options for the LLM explanation service.
/// Controls how incident summaries are enriched with AI-generated explanations.
/// </summary>
/// <remarks>
/// Design principle: Deterministic classification + LLM-as-explainer
/// The LLM layer is optional and cannot change classification decisions.
/// </remarks>
public record IncidentExplanationOptions
{
    /// <summary>
    /// Whether LLM explanation is enabled for this request.
    /// Default: true (use configuration-level toggle to disable globally).
    /// </summary>
    public bool Enabled { get; init; } = true;

    /// <summary>
    /// Maximum tokens for LLM response.
    /// Default: 1024 (sufficient for title + description + recommendations).
    /// </summary>
    public int MaxTokens { get; init; } = 1024;

    /// <summary>
    /// Timeout for LLM explanation request.
    /// Default: 10 seconds. Falls back to deterministic summary on timeout.
    /// </summary>
    public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(10);

    /// <summary>
    /// Optional model key for LLM selection.
    /// If not specified, uses default SystemGPT configuration.
    /// </summary>
    public string? ModelKey { get; init; }

    /// <summary>
    /// Audience hint for LLM explanation style.
    /// Options: "ops" (on-call engineers), "cio" (executives), "county-it" (county staff).
    /// Default: "county-it"
    /// </summary>
    public string AudienceHint { get; init; } = "county-it";

    /// <summary>
    /// Temperature for LLM generation.
    /// Lower = more deterministic, higher = more creative.
    /// Default: 0.3 (conservative for incident triage).
    /// </summary>
    public double Temperature { get; init; } = 0.3;

    /// <summary>
    /// Whether to include raw alert details in the LLM prompt.
    /// May increase explanation quality but also token usage.
    /// </summary>
    public bool IncludeAlertDetails { get; init; } = true;

    /// <summary>
    /// Whether to include metric values in the LLM prompt.
    /// </summary>
    public bool IncludeMetricValues { get; init; } = true;
}

/// <summary>
/// Global configuration for the incident explanation service.
/// Loaded from appsettings.json or environment variables.
/// </summary>
public class IncidentExplanationConfiguration
{
    /// <summary>
    /// Configuration section name in appsettings.json.
    /// </summary>
    public const string SectionName = "IncidentExplanation";

    /// <summary>
    /// Whether LLM explanation is enabled globally.
    /// Can be overridden per-request via IncidentExplanationOptions.
    /// </summary>
    public bool EnableGlobally { get; set; } = false;

    /// <summary>
    /// Default model key for LLM explanation.
    /// Should reference a model configured in SystemGPT.
    /// </summary>
    public string DefaultModelKey { get; set; } = "systemgpt-default";

    /// <summary>
    /// Default timeout in seconds.
    /// </summary>
    public int DefaultTimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Default max tokens.
    /// </summary>
    public int DefaultMaxTokens { get; set; } = 1024;

    /// <summary>
    /// Default temperature.
    /// </summary>
    public double DefaultTemperature { get; set; } = 0.3;

    /// <summary>
    /// Whether to log LLM prompts/responses for debugging.
    /// WARNING: May contain sensitive incident details.
    /// </summary>
    public bool EnableDebugLogging { get; set; } = false;
}
