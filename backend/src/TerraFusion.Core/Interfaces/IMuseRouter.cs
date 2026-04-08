namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Task-aware LLM router for the Muse pipeline.
///
/// Sits above <see cref="IMuseLlmClient"/>: given a task classification and the
/// assembled context, it selects the right backend (dev, reasoning, tools, or
/// document lane) and delegates to the appropriate <see cref="IMuseLlmClient"/>.
///
/// MuseService calls this instead of IMuseLlmClient directly when the routing
/// matrix is enabled. When the matrix is NOT configured, a passthrough
/// implementation delegates to the single registered IMuseLlmClient so the
/// existing DI wiring requires no change.
///
/// Contract (same as IMuseLlmClient):
///   - Always returns a string (never null, never throws)
///   - Returns string.Empty when every backend is unavailable
/// </summary>
public interface IMuseRouter
{
    /// <summary>
    /// Route the completion request to the appropriate model lane.
    /// </summary>
    Task<string> CompleteAsync(
        MuseTaskType task,
        string systemPrompt,
        string userQuery,
        CancellationToken ct = default);
}
