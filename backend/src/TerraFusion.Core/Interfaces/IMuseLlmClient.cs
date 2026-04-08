namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Thin LLM completion client for the Muse explain pipeline.
///
/// Implementations are provider-agnostic from the caller's perspective.
/// The contract is intentionally minimal: system prompt + user query → text.
///
/// Returns null (never throws) when the LLM is unavailable or unconfigured,
/// allowing MuseService to degrade gracefully to the static placeholder explanation.
/// </summary>
public interface IMuseLlmClient
{
    /// <summary>
    /// True when the client has a configured API key and is ready to accept requests.
    /// MuseService skips the LLM call entirely when this is false.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Sends the enriched context preamble as the system prompt and the user's
    /// natural-language query as the user message.
    ///
    /// Returns the completion text on success, or null when the LLM is
    /// unavailable, unconfigured, rate-limited, or returns an empty response.
    /// Callers must treat null as "fall back to static explanation" — never as an error.
    /// </summary>
    Task<string?> CompleteAsync(
        string systemPrompt,
        string userQuery,
        CancellationToken ct = default);
}
