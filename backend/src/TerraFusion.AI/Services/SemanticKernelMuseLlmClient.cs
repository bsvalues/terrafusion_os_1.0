using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

/// <summary>
/// Semantic Kernel-backed implementation of IMuseLlmClient.
///
/// Provider-agnostic by design — the injected IChatCompletionService
/// is configured at startup from MuseLlmOptions (Local / AzureOpenAI / any
/// future SK connector). This class knows nothing about vendors.
///
/// Failure contract:
///   - Connection refused, model unavailable, timeout → returns string.Empty
///   - Never throws — MuseService treats empty as "use static fallback"
/// </summary>
public sealed class SemanticKernelMuseLlmClient : IMuseLlmClient
{
    private readonly IChatCompletionService _chat;
    private readonly ILogger<SemanticKernelMuseLlmClient> _logger;

    public SemanticKernelMuseLlmClient(
        IChatCompletionService chat,
        ILogger<SemanticKernelMuseLlmClient> logger)
    {
        _chat = chat;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<string> CompleteAsync(
        string systemPrompt,
        string userQuery,
        CancellationToken ct = default)
    {
        try
        {
            var history = new ChatHistory();
            history.AddSystemMessage(systemPrompt);
            history.AddUserMessage(userQuery);

            _logger.LogDebug(
                "SemanticKernelMuseLlmClient: sending — system={SysLen} chars, query={QueryLen} chars",
                systemPrompt.Length, userQuery.Length);

            var results = await _chat.GetChatMessageContentsAsync(
                history,
                cancellationToken: ct);

            var text = results.FirstOrDefault()?.Content;

            if (string.IsNullOrWhiteSpace(text))
            {
                _logger.LogDebug("SemanticKernelMuseLlmClient: empty response from backend");
                return string.Empty;
            }

            _logger.LogDebug(
                "SemanticKernelMuseLlmClient: completion received — {Len} chars",
                text.Length);

            return text.Trim();
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("SemanticKernelMuseLlmClient: request cancelled or timed out");
            return string.Empty;
        }
        catch (Exception ex)
        {
            // Log at Debug level — a local model being offline is normal during dev.
            // Log at Warning when endpoint is explicitly configured.
            _logger.LogDebug(ex, "SemanticKernelMuseLlmClient: backend unavailable");
            return string.Empty;
        }
    }
}
