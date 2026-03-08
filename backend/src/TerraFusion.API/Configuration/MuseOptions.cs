namespace TerraFusion.API.Configuration;

/// <summary>
/// Strongly-typed configuration for the Muse NLP engine.
/// Bound from appsettings "Muse" section.
///
/// Engine selection:
///   - "muse-template-v1" (default): Deterministic template-based generation
///   - "claude-*": Anthropic Claude API-powered generation (requires ApiKey)
///
/// The Model value is a config key, not a hardcoded promise.
/// Deployable without code change by updating appsettings.
/// </summary>
public class MuseOptions
{
    public const string SectionName = "Muse";

    /// <summary>Engine identifier. Starts with "claude" to activate AI engine.</summary>
    public string Engine { get; set; } = "muse-template-v1";

    /// <summary>Anthropic API key. From environment MUSE_ANTHROPIC_API_KEY or config.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Claude model identifier (e.g., "claude-sonnet-4-5-20250514").</summary>
    public string Model { get; set; } = "claude-sonnet-4-5-20250514";

    /// <summary>Maximum tokens for Claude API response.</summary>
    public int MaxTokens { get; set; } = 2048;

    /// <summary>Temperature for Claude API (0.0-1.0). Lower = more deterministic.</summary>
    public double Temperature { get; set; } = 0.3;

    /// <summary>Timeout in seconds for Claude API calls.</summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>Whether the Claude engine is effectively active (engine starts with "claude" AND key is present).</summary>
    public bool IsClaudeActive => Engine.StartsWith("claude", StringComparison.OrdinalIgnoreCase)
                                  && !string.IsNullOrEmpty(ApiKey);
}
