using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

/// <summary>
/// Anthropic Messages API adapter for Muse explain completions.
///
/// Uses the claude-3-5-haiku model by default — fast, cost-effective,
/// and well-suited for focused dev co-pilot responses with a bounded context window.
///
/// Configuration (appsettings.json or environment variables):
///   Muse:ApiKey     — Anthropic API key (sk-ant-...). Required for live completions.
///   Muse:Model      — Model ID. Default: claude-3-5-haiku-20241022
///   Muse:MaxTokens  — Max completion tokens. Default: 1024
///   Muse:BaseUrl    — API base URL. Default: https://api.anthropic.com
///
/// When ApiKey is absent or empty, IsConfigured is false and CompleteAsync returns
/// null immediately — MuseService falls back to the static placeholder explanation.
/// The service never throws; all errors are logged and swallowed.
/// </summary>
public sealed class AnthropicMuseLlmClient : IMuseLlmClient
{
    private const string AnthropicVersion = "2023-06-01";
    private const string DefaultModel = "claude-3-5-haiku-20241022";
    private const int DefaultMaxTokens = 1024;
    private const int TimeoutMs = 30_000;

    private readonly HttpClient _http;
    private readonly ILogger<AnthropicMuseLlmClient> _logger;
    private readonly string? _apiKey;
    private readonly string _model;
    private readonly int _maxTokens;

    /// <inheritdoc/>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public AnthropicMuseLlmClient(
        HttpClient http,
        ILogger<AnthropicMuseLlmClient> logger,
        IConfiguration configuration)
    {
        _http = http;
        _logger = logger;

        _apiKey = configuration["Muse:ApiKey"];
        _model = configuration["Muse:Model"] ?? DefaultModel;
        _maxTokens = int.TryParse(configuration["Muse:MaxTokens"], out var mt) ? mt : DefaultMaxTokens;

        var baseUrl = configuration["Muse:BaseUrl"] ?? "https://api.anthropic.com";
        _http.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        _http.Timeout = TimeSpan.FromMilliseconds(TimeoutMs);
    }

    /// <inheritdoc/>
    public async Task<string?> CompleteAsync(
        string systemPrompt,
        string userQuery,
        CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogDebug("AnthropicMuseLlmClient: no API key configured — returning null");
            return null;
        }

        try
        {
            var body = new
            {
                model = _model,
                max_tokens = _maxTokens,
                system = systemPrompt,
                messages = new[]
                {
                    new { role = "user", content = userQuery }
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages");
            request.Headers.Add("x-api-key", _apiKey);
            request.Headers.Add("anthropic-version", AnthropicVersion);
            request.Content = JsonContent.Create(body);

            _logger.LogDebug(
                "AnthropicMuseLlmClient: sending to {Model}, system={SysLen} chars, query={QueryLen} chars",
                _model, systemPrompt.Length, userQuery.Length);

            using var response = await _http.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning(
                    "AnthropicMuseLlmClient: HTTP {Status} — {Error}",
                    (int)response.StatusCode,
                    error.Length > 300 ? error[..300] + "…" : error);
                return null;
            }

            var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);

            // Anthropic response: { "content": [{ "type": "text", "text": "..." }], ... }
            if (!json.TryGetProperty("content", out var content) || content.GetArrayLength() == 0)
            {
                _logger.LogWarning("AnthropicMuseLlmClient: response missing content array");
                return null;
            }

            var text = content[0].TryGetProperty("text", out var textProp)
                ? textProp.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(text))
            {
                _logger.LogDebug("AnthropicMuseLlmClient: response content was empty");
                return null;
            }

            _logger.LogDebug(
                "AnthropicMuseLlmClient: completion received — {Len} chars",
                text.Length);

            return text.Trim();
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("AnthropicMuseLlmClient: request cancelled or timed out");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AnthropicMuseLlmClient: completion failed");
            return null;
        }
    }
}
