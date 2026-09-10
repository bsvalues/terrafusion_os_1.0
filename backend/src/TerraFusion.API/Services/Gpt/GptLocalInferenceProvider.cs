using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Configuration;

namespace TerraFusion.API.Services.Gpt;

/// <summary>Bounded Ollama adapter. Only explicitly admitted loopback or private IP literals;
/// no DNS, proxy, redirects, credentials, retry, remote factory, or simulated fallback.</summary>
public sealed class GptLocalInferenceProvider(
    HttpClient client, IOptions<GptLocalInferenceOptions> configured, IHostEnvironment environment)
    : IGptLocalInferenceProvider, IEmbeddingService
{
    private const int MaxResponseBytes = 262144;
    private readonly GptLocalInferenceOptions options = configured.Value;
    public string ProviderName => "ollama";

    private bool TryAdmission(out Uri endpoint) => TryAdmission(options.Endpoint, out endpoint);

    private bool TryAdmission(string configuredEndpoint, out Uri endpoint)
    {
        endpoint = null!;
        if (!options.Enabled || !environment.IsDevelopment()
            || options.TimeoutSeconds is < 1 or > 120
            || !Identifier(options.Model, 100) || !Identifier(options.EmbeddingModel, 100)
            || options.EmbeddingDimensions is < 1 or > 16384
            || !Uri.TryCreate(configuredEndpoint, UriKind.Absolute, out var candidate)
            || candidate.Scheme != "http" || candidate.UserInfo.Length != 0
            || candidate.Query.Length != 0 || candidate.Fragment.Length != 0
            || candidate.AbsolutePath != "/" || candidate.Port <= 0
            || !IPAddress.TryParse(candidate.Host.Trim('[', ']'), out var address)) return false;
        var bytes = address.GetAddressBytes();
        var local = IPAddress.IsLoopback(address)
            || (bytes.Length == 4 && (bytes[0] == 10
                || (bytes[0] == 172 && bytes[1] is >= 16 and <= 31)
                || (bytes[0] == 192 && bytes[1] == 168)));
        if (!local) return false;
        endpoint = candidate;
        return true;
    }

    private static bool Identifier(string value, int maximum) => !string.IsNullOrWhiteSpace(value)
        && value.Length <= maximum && value.Trim() == value && !value.Any(char.IsControl);

    public async Task<GptLocalInferenceResult> GenerateAsync(string question,
        IReadOnlyList<GptGroundedCitation> sources, CancellationToken cancellationToken = default)
    {
        if (!TryAdmission(out var endpoint)) return Unavailable("UNCONFIGURED");
        if (cancellationToken.IsCancellationRequested) return Unavailable("CANCELLED");
        // Admission and canonical context validation precede this transport. Never send empty context.
        if (string.IsNullOrWhiteSpace(question) || question.Length > 16000 || sources.Count is < 1 or > 20)
            return Error("ANSWER_REJECTED");
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(options.TimeoutSeconds));
        try
        {
            var answerSchema = new Dictionary<string, object?>
            {
                ["type"] = "object",
                ["additionalProperties"] = false,
                ["properties"] = new Dictionary<string, object?>
                {
                    ["answer"] = new Dictionary<string, object?> { ["type"] = "string", ["minLength"] = 1 },
                    ["citations"] = new Dictionary<string, object?>
                    {
                        ["type"] = "array",
                        ["minItems"] = 1,
                        ["items"] = new Dictionary<string, object?>
                        {
                            ["type"] = "object",
                            ["additionalProperties"] = false,
                            ["properties"] = new Dictionary<string, object?>
                            {
                                ["sourceId"] = new Dictionary<string, object?> { ["type"] = "string" },
                                ["chunkId"] = new Dictionary<string, object?> { ["type"] = "string" },
                            },
                            ["required"] = new[] { "sourceId", "chunkId" },
                        },
                    },
                },
                ["required"] = new[] { "answer", "citations" },
            };
            var exemplar = new
            {
                answer = "One sentence grounded answer using only the supplied excerpts.",
                citations = new[] { new { sources[0].SourceId, sources[0].ChunkId } },
            };
            var body = new
            {
                model = options.Model,
                stream = false,
                format = answerSchema,
                messages = new[]
                {
                    new { role = "system", content = "You are a strict JSON API. Return exactly one JSON object matching the requested schema. Answer only using supplied source excerpts. Every citation must use sourceId and chunkId exactly as supplied. Do not return {}. Do not include markdown, prose outside JSON, or unsupplied citations." },
                    new { role = "user", content = JsonSerializer.Serialize(new { question, sources, requiredOutputExample = exemplar }) },
                },
                options = new { num_predict = 1024, temperature = 0 },
            };
            using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(endpoint, "api/chat"))
            { Content = JsonContent.Create(body) };
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            if (!response.IsSuccessStatusCode) return Error("HTTP_ERROR");
            var text = await ReadBoundedAsync(response.Content, timeout.Token);
            try
            {
            var root = JsonNode.Parse(text, documentOptions: new JsonDocumentOptions { MaxDepth = 16 })!.AsObject();
            if (root["model"]?.GetValue<string>() != options.Model) return Error("MODEL_MISMATCH");
            if (root["done"]?.GetValue<bool>() != true || root["message"]?["role"]?.GetValue<string>() != "assistant")
                return Error("INVALID_RESPONSE");
            var generated = JsonNode.Parse(root["message"]!["content"]!.GetValue<string>(),
                documentOptions: new JsonDocumentOptions { MaxDepth = 16 })!.AsObject();
            if (generated.Count != 2 || !generated.ContainsKey("answer") || !generated.ContainsKey("citations"))
                return Error("INVALID_RESPONSE");
            generated["provider"] = ProviderName;
            generated["model"] = root["model"]!.DeepClone();
            var usage = new JsonObject();
            foreach (var (source, target) in new[] { ("prompt_eval_count", "promptTokens"), ("eval_count", "completionTokens") })
            {
                if (!root.ContainsKey(source)) continue;
                if (root[source] is not JsonValue value || !value.TryGetValue<long>(out var count)
                    || count is < 0 or > 9007199254740991) return Error("INVALID_RESPONSE");
                usage[target] = count;
            }
            if (usage.Count != 0) generated["usage"] = usage;
            // Citation membership and all answer semantics belong to the protected suite validator.
            return new("ANSWERED", null, generated);
            }
            catch (ArgumentException)
            {
                // JsonObject materializes duplicate members lazily. Refuse that ambiguity only
                // inside bounded response parsing; do not conceal unrelated transport arguments.
                return Error("INVALID_RESPONSE");
            }
        }
        catch (OperationCanceledException) { return Unavailable(cancellationToken.IsCancellationRequested ? "CANCELLED" : "TIMEOUT"); }
        catch (ResponseLimitException) { return Error("RESPONSE_TOO_LARGE"); }
        catch (HttpRequestException) { return Unavailable("UNREACHABLE"); }
        catch (IOException) { return Unavailable("UNREACHABLE"); }
        catch (Exception exception) when (exception is JsonException or InvalidOperationException or FormatException or NullReferenceException or System.Text.DecoderFallbackException)
        { return Error("INVALID_RESPONSE"); }
    }

    public async Task<float[]> GenerateProviderEmbeddingAsync(string text, string model = "text-embedding-3-small")
    {
        var embeddingEndpoint = string.IsNullOrWhiteSpace(options.EmbeddingEndpoint)
            ? options.Endpoint
            : options.EmbeddingEndpoint;
        if (!TryAdmission(embeddingEndpoint, out var endpoint) || model != options.EmbeddingModel || string.IsNullOrWhiteSpace(text) || text.Length > 16000)
            throw new InvalidOperationException("Local embedding admission unavailable or incompatible.");
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(options.TimeoutSeconds));
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(endpoint, "api/embed"))
        { Content = JsonContent.Create(new { model, input = text, truncate = false }) };
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Local embedding provider unavailable.");
        var root = JsonNode.Parse(await ReadBoundedAsync(response.Content, timeout.Token),
            documentOptions: new JsonDocumentOptions { MaxDepth = 8 })!.AsObject();
        if (root["model"]?.GetValue<string>() != options.EmbeddingModel
            || root["embeddings"] is not JsonArray vectors || vectors.Count != 1
            || vectors[0] is not JsonArray vector || vector.Count != options.EmbeddingDimensions)
            throw new InvalidOperationException("Local embedding response incompatible.");
        var result = vector.Select(value => value!.GetValue<float>()).ToArray();
        if (result.Any(value => !float.IsFinite(value))) throw new InvalidOperationException("Local embedding response incompatible.");
        return result;
    }

    // This adapter is retrieval-only. It must never become an ingestion/reindexing provider.
    public Task<float[]> GenerateEmbeddingAsync(string text, string model = "text-embedding-3-small") =>
        throw new InvalidOperationException("GPT local admission permits retrieval only, not dataset writes.");
    public Task<List<float[]>> GenerateBatchEmbeddingsAsync(IEnumerable<string> texts, string model = "text-embedding-3-small") =>
        throw new InvalidOperationException("GPT local admission permits retrieval only, not dataset writes.");
    public int GetVectorDimension(string model) => model == options.EmbeddingModel ? options.EmbeddingDimensions
        : throw new InvalidOperationException("Local embedding model incompatible.");
    public Task<bool> IsAvailableAsync() => Task.FromResult(false); // No reachability assertion from configuration.

    private static GptLocalInferenceResult Unavailable(string code) => new("PROVIDER_UNAVAILABLE", code, null);
    private static GptLocalInferenceResult Error(string code) => new("PROVIDER_ERROR", code, null);
    private sealed class ResponseLimitException : Exception { }
    private static async Task<string> ReadBoundedAsync(HttpContent content, CancellationToken cancellation)
    {
        if (content.Headers.ContentLength > MaxResponseBytes) throw new ResponseLimitException();
        await using var stream = await content.ReadAsStreamAsync(cancellation);
        using var output = new MemoryStream();
        var buffer = new byte[8192];
        int count;
        while ((count = await stream.ReadAsync(buffer, cancellation)) != 0)
        {
            if (output.Length + count > MaxResponseBytes) throw new ResponseLimitException();
            output.Write(buffer, 0, count);
        }
        return new System.Text.UTF8Encoding(false, true).GetString(output.ToArray());
    }
}
