namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Provider-agnostic LLM completion client for the Muse explain pipeline.
///
/// MuseService knows nothing about vendors, endpoints, or model names.
/// It builds context and calls this interface. The registered implementation
/// decides which backend answers — local, Azure, or any future provider —
/// based purely on runtime configuration, never on business logic.
///
/// Contract:
///   - Always returns a string (never null, never throws)
///   - Returns string.Empty when the backend is unavailable or unconfigured;
///     MuseService treats empty as "fall back to static explanation"
/// </summary>
public interface IMuseLlmClient
{
    /// <summary>
    /// Complete a chat turn using the enriched context preamble as the system
    /// prompt and the user's natural-language query as the user message.
    ///
    /// Returns the completion text on success.
    /// Returns string.Empty when the backend is unavailable — never throws.
    /// </summary>
    Task<string> CompleteAsync(
        string systemPrompt,
        string userQuery,
        CancellationToken ct = default);
}
