using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Gpt;
using Xunit;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptLocalInferenceProviderTests
{
    [Fact]
    public async Task UnconfiguredProviderNeverTransmits()
    {
        var transport = new Transport((_, _) => throw new InvalidOperationException("No request permitted"));
        var result = await Provider(transport, new GptLocalInferenceOptions()).GenerateAsync("Synthetic question", Sources());
        result.Status.Should().Be("PROVIDER_UNAVAILABLE");
        result.FailureCode.Should().Be("UNCONFIGURED");
        result.Generated.Should().BeNull();
        transport.Calls.Should().Be(0);
    }

    [Theory]
    [InlineData("https://api.openai.com/v1", "Development")]
    [InlineData("http://127.0.0.1:11434", "Production")]
    [InlineData("http://user:secret@127.0.0.1:11434", "Development")]
    [InlineData("http://127.0.0.1:11434/?token=secret", "Development")]
    public async Task EndpointOrEnvironmentOutsideLocalAdmissionNeverTransmits(string endpoint, string environment)
    {
        var options = Configured(); options.Endpoint = endpoint;
        var transport = new Transport((_, _) => throw new InvalidOperationException("No request permitted"));
        var result = await Provider(transport, options, environment).GenerateAsync("Synthetic question", Sources());
        result.FailureCode.Should().Be("UNCONFIGURED");
        transport.Calls.Should().Be(0);
    }

    [Fact]
    public async Task SendsOnlyQuestionAndAdmittedSourcesAndPreservesActualProviderModelAndReturnedUsage()
    {
        string? sent = null;
        var transport = new Transport(async (request, cancellation) =>
        {
            request.RequestUri!.AbsolutePath.Should().Be("/api/chat");
            request.Headers.Authorization.Should().BeNull();
            sent = await request.Content!.ReadAsStringAsync(cancellation);
            return Json("""{"model":"test-local-model","done":true,"message":{"role":"assistant","content":"{\"answer\":\"Synthetic supported answer\",\"citations\":[{\"sourceId\":\"rag-document:11\",\"chunkId\":\"rag-chunk:29\"}]}"},"prompt_eval_count":12,"eval_count":4}""");
        });
        var result = await Provider(transport).GenerateAsync("Synthetic question", Sources());
        result.Status.Should().Be("ANSWERED");
        result.Generated!["provider"]!.GetValue<string>().Should().Be("ollama");
        result.Generated["model"]!.GetValue<string>().Should().Be("test-local-model");
        result.Generated["usage"]!["promptTokens"]!.GetValue<long>().Should().Be(12);
        result.Generated["usage"]!["completionTokens"]!.GetValue<long>().Should().Be(4);
        result.Generated["usage"]!["totalTokens"].Should().BeNull();
        using var body = JsonDocument.Parse(sent!);
        body.RootElement.GetProperty("stream").GetBoolean().Should().BeFalse();
        sent.Should().Contain("rag-document:11").And.Contain("Admitted synthetic excerpt");
        transport.Calls.Should().Be(1);
    }

    [Fact]
    public async Task MissingUsageRemainsUnknown()
    {
        var transport = new Transport((_, _) => Task.FromResult(Json("""{"model":"test-local-model","done":true,"message":{"role":"assistant","content":"{\"answer\":\"Synthetic answer\",\"citations\":[{\"sourceId\":\"rag-document:11\",\"chunkId\":\"rag-chunk:29\"}]}"}}""")));
        var result = await Provider(transport).GenerateAsync("Synthetic question", Sources());
        result.Status.Should().Be("ANSWERED");
        result.Generated!.ContainsKey("usage").Should().BeFalse();
        result.Generated.ContainsKey("cost").Should().BeFalse();
    }

    [Theory]
    [InlineData("{", "INVALID_RESPONSE")]
    [InlineData("{\"model\":\"other-model\",\"done\":true}", "MODEL_MISMATCH")]
    [InlineData("{\"model\":\"test-local-model\",\"done\":false}", "INVALID_RESPONSE")]
    public async Task InvalidResponseNeverBecomesAnswer(string body, string code)
    {
        var result = await Provider(new Transport((_, _) => Task.FromResult(Json(body))))
            .GenerateAsync("Synthetic question", Sources());
        result.Status.Should().Be("PROVIDER_ERROR");
        result.FailureCode.Should().Be(code);
        result.Generated.Should().BeNull();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task DuplicateProviderOrGeneratedObjectKeysRemainTypedInvalidResponse(bool duplicateOuterModel)
    {
        // Equal duplicate values are still malformed: neither first-key nor last-key acceptance
        // may turn an ambiguous provider envelope or generated answer into persisted content.
        var body = duplicateOuterModel
            ? """{"model":"test-local-model","model":"test-local-model","done":true,"message":{"role":"assistant","content":"{\"answer\":\"Synthetic answer\",\"citations\":[{\"sourceId\":\"rag-document:11\",\"chunkId\":\"rag-chunk:29\"}]}"}}"""
            : """{"model":"test-local-model","done":true,"message":{"role":"assistant","content":"{\"answer\":\"Synthetic answer\",\"answer\":\"Synthetic answer\",\"citations\":[{\"sourceId\":\"rag-document:11\",\"chunkId\":\"rag-chunk:29\"}]}"}}""";
        var transport = new Transport((_, _) => Task.FromResult(Json(body)));
        var result = await Provider(transport).GenerateAsync("Synthetic question", Sources());
        result.Status.Should().Be("PROVIDER_ERROR");
        result.FailureCode.Should().Be("INVALID_RESPONSE");
        result.Generated.Should().BeNull();
        transport.Calls.Should().Be(1);
    }

    [Theory]
    [InlineData(HttpStatusCode.Redirect)]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    public async Task HttpFailureDoesNotFallbackOrExposeBody(HttpStatusCode status)
    {
        var transport = new Transport((_, _) => Task.FromResult(new HttpResponseMessage(status)
        {
            Content = new StringContent("sensitive-provider-body"),
        }));
        var result = await Provider(transport).GenerateAsync("Synthetic question", Sources());
        result.FailureCode.Should().Be("HTTP_ERROR");
        result.Generated.Should().BeNull();
        JsonSerializer.Serialize(result).Should().NotContain("sensitive-provider-body");
        transport.Calls.Should().Be(1);
    }

    [Fact]
    public async Task CancellationAndTimeoutRemainDistinctWithoutRetry()
    {
        var transport = new Transport(async (_, cancellation) =>
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellation);
            throw new InvalidOperationException("unreachable");
        });
        using var cancelled = new CancellationTokenSource(); cancelled.Cancel();
        var result = await Provider(transport).GenerateAsync("Synthetic question", Sources(), cancelled.Token);
        result.FailureCode.Should().Be("CANCELLED");
        var options = Configured(); options.TimeoutSeconds = 1;
        result = await Provider(transport, options).GenerateAsync("Synthetic question", Sources());
        result.FailureCode.Should().Be("TIMEOUT");
        result.Generated.Should().BeNull();
    }

    [Fact]
    public async Task OversizedProviderResponseIsBounded()
    {
        var transport = new Transport((_, _) => Task.FromResult(Json(new string('x', 262145))));
        var result = await Provider(transport).GenerateAsync("Synthetic question", Sources());
        result.FailureCode.Should().Be("RESPONSE_TOO_LARGE");
        result.Generated.Should().BeNull();
    }

    [Fact]
    public async Task EmbeddingUsesOnlyAdmittedLocalModelAndReturnsActualFiniteVector()
    {
        var transport = new Transport(async (request, cancellation) =>
        {
            request.RequestUri!.AbsolutePath.Should().Be("/api/embed");
            var body = await request.Content!.ReadAsStringAsync(cancellation);
            body.Should().Contain("test-local-embedding");
            return Json("""{"model":"test-local-embedding","embeddings":[[0.1,0.2,0.3]]}""");
        });
        var provider = Provider(transport);
        var vector = await provider.GenerateProviderEmbeddingAsync("Synthetic question", "test-local-embedding");
        vector.Should().Equal(0.1f, 0.2f, 0.3f);
        var denied = () => provider.GenerateProviderEmbeddingAsync("Synthetic question", "remote-model");
        await denied.Should().ThrowAsync<InvalidOperationException>();
        transport.Calls.Should().Be(1);
    }

    [Fact]
    public async Task EmptyContextNeverTransmitsEvenWhenConfigured()
    {
        var transport = new Transport((_, _) => throw new InvalidOperationException("No request permitted"));
        var result = await Provider(transport).GenerateAsync("Synthetic question", []);
        result.Generated.Should().BeNull();
        transport.Calls.Should().Be(0);
    }

    [Theory]
    [InlineData("{\"model\":\"remote-embedding\",\"embeddings\":[[0.1,0.2,0.3]]}")]
    [InlineData("{\"model\":\"test-local-embedding\",\"embeddings\":[[0.1,0.2]]}")]
    public async Task ActualEmbeddingModelAndDimensionMismatchAreRejected(string body)
    {
        var transport = new Transport((_, _) => Task.FromResult(Json(body)));
        var provider = Provider(transport);
        var action = () => provider.GenerateProviderEmbeddingAsync("Synthetic question", "test-local-embedding");
        await action.Should().ThrowAsync<InvalidOperationException>();
        transport.Calls.Should().Be(1);
    }

    [Fact]
    public async Task DatasetGenerationMethodsCannotRewriteEmbeddings()
    {
        var transport = new Transport((_, _) => throw new InvalidOperationException("No request permitted"));
        var provider = Provider(transport);
        var single = () => provider.GenerateEmbeddingAsync("Synthetic", "test-local-embedding");
        var batch = () => provider.GenerateBatchEmbeddingsAsync(["Synthetic"], "test-local-embedding");
        await single.Should().ThrowAsync<InvalidOperationException>();
        await batch.Should().ThrowAsync<InvalidOperationException>();
        transport.Calls.Should().Be(0);
    }

    private static GptLocalInferenceProvider Provider(Transport transport, GptLocalInferenceOptions? options = null, string environment = "Development") =>
        new(new HttpClient(transport), Options.Create(options ?? Configured()), new Host(environment));
    private static GptLocalInferenceOptions Configured() => new()
    {
        Enabled = true, Endpoint = "http://127.0.0.1:11434", Model = "test-local-model",
        EmbeddingModel = "test-local-embedding", EmbeddingDimensions = 3, TimeoutSeconds = 5,
    };
    private static GptGroundedCitation[] Sources() => [new()
    {
        SourceId = "rag-document:11", ChunkId = "rag-chunk:29", ChunkIndex = 0,
        Excerpt = "Admitted synthetic excerpt", Score = 0.9m,
    }];
    private static HttpResponseMessage Json(string body) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(body, Encoding.UTF8, "application/json"),
    };
    private sealed class Transport(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> respond) : HttpMessageHandler
    {
        public int Calls { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++; return respond(request, cancellationToken);
        }
    }
    private sealed class Host(string environment) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environment;
        public string ApplicationName { get; set; } = "GPT tests";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
