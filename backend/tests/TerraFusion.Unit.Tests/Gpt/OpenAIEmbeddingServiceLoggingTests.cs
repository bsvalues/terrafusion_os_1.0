using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedContextEmbeddingLoggingTests
{
    [Fact]
    public async Task MissingProviderConfigurationFailsClosedInsteadOfSimulating()
    {
        using var client = new HttpClient(new UnexpectedRequestHandler());
        var logger = new CapturingLogger<OpenAIEmbeddingService>();
        var configuration = new ConfigurationBuilder().Build();
        var service = new OpenAIEmbeddingService(client, configuration, logger);

        var action = () => service.GenerateProviderEmbeddingAsync("bounded query");

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*provider-backed embedding is unavailable*");
    }

    [Fact]
    public async Task ProviderErrorBodyCannotEchoQueryIntoLogs()
    {
        const string sensitiveQuery = "private-query-marker-4b957b5c";
        using var client = new HttpClient(new ErrorHandler(sensitiveQuery));
        var logger = new CapturingLogger<OpenAIEmbeddingService>();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["OpenAI:ApiKey"] = "unit-test-key",
                ["OpenAI:BaseUrl"] = "https://unit-test.invalid/v1",
            }).Build();
        var service = new OpenAIEmbeddingService(client, configuration, logger);

        var action = () => service.GenerateEmbeddingAsync(sensitiveQuery);

        await action.Should().ThrowAsync<HttpRequestException>();
        logger.Messages.Should().NotContain(message =>
            message.Contains(sensitiveQuery, StringComparison.Ordinal));
        logger.Messages.Should().ContainSingle(message =>
            message.Contains("response body omitted", StringComparison.Ordinal));
    }

    private sealed class ErrorHandler(string query) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent($"provider echoed: {query}"),
            });
    }

    private sealed class UnexpectedRequestHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Missing-provider proof must not call the network.");
    }

    private sealed class CapturingLogger<T> : ILogger<T>
    {
        public List<string> Messages { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) =>
            Messages.Add(formatter(state, exception));
    }
}
