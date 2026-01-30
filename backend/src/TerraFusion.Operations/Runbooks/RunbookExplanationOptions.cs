// =============================================================================
// Phase 40B: Runbook Explanation Options
// =============================================================================
// EXPLAINER SPEC LOCK v1.0.0
// Configuration for Azure OpenAI runbook explanation service.
// =============================================================================

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Configuration options for the Runbook Explanation Service.
/// EXPLAINER SPEC LOCK v1.0.0
/// </summary>
public record RunbookExplanationOptions
{
    /// <summary>
    /// Configuration section name for binding.
    /// </summary>
    public const string SectionName = "RunbookExplanation";

    /// <summary>
    /// Whether LLM-based explanation enrichment is enabled.
    /// Default: false (use NullRunbookExplanationService).
    /// </summary>
    public bool Enabled { get; init; } = false;

    /// <summary>
    /// Azure OpenAI endpoint URL.
    /// Example: "https://your-resource.openai.azure.com/"
    /// </summary>
    public string? AzureOpenAiEndpoint { get; init; }

    /// <summary>
    /// Azure OpenAI deployment name (model deployment).
    /// Example: "gpt-4o", "gpt-4-turbo"
    /// </summary>
    public string? AzureOpenAiDeploymentName { get; init; }

    /// <summary>
    /// Azure OpenAI API key.
    /// Can also use DefaultAzureCredential if not provided.
    /// </summary>
    public string? AzureOpenAiApiKey { get; init; }

    /// <summary>
    /// Maximum tokens for LLM response.
    /// Default: 2000
    /// </summary>
    public int MaxTokens { get; init; } = 2000;

    /// <summary>
    /// Temperature for LLM response (0.0 = deterministic, 1.0 = creative).
    /// Default: 0.3 (mostly deterministic with slight variation)
    /// </summary>
    public double Temperature { get; init; } = 0.3;

    /// <summary>
    /// Timeout for LLM API calls.
    /// Default: 30 seconds
    /// </summary>
    public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(30);

    /// <summary>
    /// Whether to use Azure Default Credential instead of API key.
    /// </summary>
    public bool UseDefaultAzureCredential { get; init; } = false;

    /// <summary>
    /// Validates that required configuration is present for Azure OpenAI.
    /// </summary>
    public bool IsConfiguredForAzureOpenAi =>
        !string.IsNullOrWhiteSpace(AzureOpenAiEndpoint) &&
        !string.IsNullOrWhiteSpace(AzureOpenAiDeploymentName) &&
        (UseDefaultAzureCredential || !string.IsNullOrWhiteSpace(AzureOpenAiApiKey));
}
