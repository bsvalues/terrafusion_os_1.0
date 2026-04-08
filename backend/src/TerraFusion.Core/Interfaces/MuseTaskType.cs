namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Task classification for Muse router dispatch.
///
/// Each value maps to a model lane in <see cref="TerraFusion.Core.Configuration.MuseRouterOptions"/>.
/// When no explicit route is configured for a task, the router falls back to
/// the default lane ("*") or the single registered IMuseLlmClient.
/// </summary>
public enum MuseTaskType
{
    /// <summary>
    /// Developer-assist completions: code review, diff explanation, build errors,
    /// surface contract queries. Latency-sensitive — favour small fast models.
    /// Example: devstral-small-2, phi-3-mini, codestral.
    /// </summary>
    DevAssist = 0,

    /// <summary>
    /// Multi-step reasoning: IAAO ratio analysis, legal statute interpretation,
    /// cost-approach calculations. Favours models with strong chain-of-thought.
    /// Example: deepseek-r1, qwen3, o3-mini.
    /// </summary>
    Reasoning = 1,

    /// <summary>
    /// Agentic tool-use: planner loop, function-calling, workflow orchestration.
    /// Favours models with reliable structured output and tool-call grammars.
    /// Example: qwen3.5, gpt-4o, claude-3-5-haiku.
    /// </summary>
    AgentTools = 2,

    /// <summary>
    /// Document generation: appeal letters, assessment narratives, export content.
    /// Favours models with long context and polished prose output.
    /// Example: gpt-4o, llama-3.1-70b, mistral-large.
    /// </summary>
    Document = 3,
}
