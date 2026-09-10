using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Data;
using TerraFusion.AI.Entities;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Gpt;
using TerraFusion.Data;
using Xunit;
using CoreEntities = TerraFusion.Core.Entities;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedAnswerTests
{
    [Theory]
    [InlineData(99, "test-user", 1)]
    [InlineData(42, "foreign-user", 1)]
    [InlineData(42, "test-user", 2)]
    public async Task ForeignConversationOrConfigurationStopsBeforeRetrievalAndPersistence(int county, string user, int config)
    {
        await using var db = await DatabaseAsync();
        var context = new Mock<IGptGroundedContextConsumer>(MockBehavior.Strict);
        var provider = new Mock<IGptLocalInferenceProvider>(MockBehavior.Strict);
        var service = Service(db, context.Object, provider.Object);
        var action = () => service.SendAsync(config, 10, "Synthetic question", user, county, "trace-test");
        await action.Should().ThrowAsync<UnauthorizedAccessException>();
        (await db.Set<GPTMessage>().CountAsync()).Should().Be(0);
        context.VerifyNoOtherCalls(); provider.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("OpenAI", "local-embed", 3)]
    [InlineData("ollama", "foreign-model", 3)]
    [InlineData("ollama", "local-embed", 1536)]
    public async Task IncompatibleExistingEmbeddingsFailClosedWithoutRetrievalOrRewrite(string providerName, string model, int dimension)
    {
        await using var db = await DatabaseAsync();
        var dataset = await db.Set<RAGDataset>().SingleAsync();
        dataset.EmbeddingProvider = providerName; dataset.EmbeddingModel = model; dataset.VectorDimension = dimension;
        await db.SaveChangesAsync();
        var context = new Mock<IGptGroundedContextConsumer>(MockBehavior.Strict);
        var provider = new Mock<IGptLocalInferenceProvider>(MockBehavior.Strict);
        var service = Service(db, context.Object, provider.Object);
        var action = () => service.SendAsync(1, 10, "Synthetic question", "test-user", 42, "trace-test");
        await action.Should().ThrowAsync<InvalidOperationException>().WithMessage("*embedding*incompatible*");
        context.VerifyNoOtherCalls(); provider.VerifyNoOtherCalls();
        dataset.EmbeddingProvider.Should().Be(providerName);
        dataset.EmbeddingModel.Should().Be(model);
        dataset.VectorDimension.Should().Be(dimension);
        (await db.Set<GPTMessage>().CountAsync()).Should().Be(0);
    }

    [Theory]
    [InlineData("DENIED", "DATASET_NOT_ALLOWED")]
    [InlineData("NO_RELEVANT_CONTEXT", null)]
    public async Task DeniedOrEmptyContextNeverCallsGenerationAndPersistsNoModelContent(string status, string? denial)
    {
        await using var db = await DatabaseAsync();
        var context = Context(status, denial);
        var provider = new Mock<IGptLocalInferenceProvider>(MockBehavior.Strict);
        var message = await Service(db, context.Object, provider.Object).SendAsync(1, 10, "Synthetic question", "test-user", 42, "trace-test");
        var envelope = JsonNode.Parse(message.FunctionResult!)!;
        envelope["result"]!["status"]!.GetValue<string>().Should().Be(status);
        envelope["result"]!["answer"].Should().BeNull();
        envelope["result"]!["provider"].Should().BeNull();
        envelope["result"]!["usage"].Should().BeNull();
        envelope["result"]!["citations"]!.AsArray().Should().BeEmpty();
        provider.VerifyNoOtherCalls();
        (await db.Set<GPTUsageMetric>().CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task ActualAnswerEnvelopeAndTracePersistAndReopenWithExactSourceChunkAndUnknownUsage()
    {
        var databaseName = $"eo-gpt-persistence-{Guid.NewGuid():N}";
        await using (var db = await DatabaseAsync(databaseName))
        {
            var context = Context("GROUNDED");
            var provider = Generated();
            var message = await Service(db, context.Object, provider.Object).SendAsync(1, 10, "Synthetic question", "test-user", 42, "trace-test");
            message.Content.Should().Be("Synthetic supported answer");
            message.Provider.Should().Be("ollama");
            message.ModelUsed.Should().Be("local-model");
            var audit = await db.Set<GPTAudit>().SingleAsync();
            audit.MessageId.Should().Be(message.Id);
            audit.CountyId.Should().Be(42);
            audit.RAGChunkDetails.Should().Contain("rag-chunk:29");
            audit.LLMProvider.Should().Be("ollama");
            (await db.Set<GPTUsageMetric>().CountAsync()).Should().Be(0);
        }
        await using var reopened = Database(databaseName);
        var persisted = await reopened.Set<GPTMessage>().SingleAsync(message => message.Role == "assistant");
        var envelope = JsonNode.Parse(persisted.FunctionResult!)!;
        JsonNode.Parse(persisted.FunctionArgs!)!["sourceCommit"]!.GetValue<string>()
            .Should().Be("afbcba88c7606e78d3705010b39bcb0527270134");
        envelope["result"]!["traceId"]!.GetValue<string>().Should().Be("trace-test");
        envelope["result"]!["citations"]![0]!["sourceId"]!.GetValue<string>().Should().Be("rag-document:11");
        envelope["result"]!["usage"].Should().BeNull();
    }

    [Fact]
    public async Task CanonicalAnswerRejectionPreventsPersistingGeneratedContent()
    {
        await using var db = await DatabaseAsync();
        var validator = new Mock<IGptGroundedAnswerProcessHost>(MockBehavior.Strict);
        validator.Setup(host => host.ValidateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GptGroundedAnswerValidation(true, false, null, "ANSWER_REJECTED"));
        var service = Service(db, Context("GROUNDED").Object, Generated().Object, validator.Object);
        var action = () => service.SendAsync(1, 10, "Synthetic question", "test-user", 42, "trace-test");
        await action.Should().ThrowAsync<InvalidOperationException>();
        (await db.Set<GPTMessage>().CountAsync()).Should().Be(0);
        (await db.Set<GPTAudit>().CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task AuthorizationChangeDuringGenerationDoesNotPersistAnswer()
    {
        await using var db = await DatabaseAsync();
        var provider = Generated();
        provider.Setup(candidate => candidate.GenerateAsync(It.IsAny<string>(), It.IsAny<IReadOnlyList<GptGroundedCitation>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                var dataset = db.Set<RAGDataset>().Single(); dataset.CountyId = 99; db.SaveChanges();
                return Answer();
            });
        var service = Service(db, Context("GROUNDED").Object, provider.Object);
        var action = () => service.SendAsync(1, 10, "Synthetic question", "test-user", 42, "trace-test");
        await action.Should().ThrowAsync<UnauthorizedAccessException>();
        (await db.Set<GPTMessage>().CountAsync()).Should().Be(0);
    }

    [Theory]
    [InlineData("PROVIDER_UNAVAILABLE", "UNREACHABLE")]
    [InlineData("PROVIDER_ERROR", "HTTP_ERROR")]
    public async Task ProviderFailurePersistsTypedTraceButNeverInventsContentOrUsage(string status, string code)
    {
        await using var db = await DatabaseAsync();
        var provider = new Mock<IGptLocalInferenceProvider>(MockBehavior.Strict);
        provider.Setup(value => value.GenerateAsync(It.IsAny<string>(), It.IsAny<IReadOnlyList<GptGroundedCitation>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GptLocalInferenceResult(status, code, null));
        var message = await Service(db, Context("GROUNDED").Object, provider.Object)
            .SendAsync(1, 10, "Synthetic question", "test-user", 42, "trace-failure");
        message.Content.Should().BeEmpty();
        message.Provider.Should().BeNull();
        message.ModelUsed.Should().BeNull();
        var result = JsonNode.Parse(message.FunctionResult!)!["result"]!;
        result["status"]!.GetValue<string>().Should().Be(status);
        result["failureCode"]!.GetValue<string>().Should().Be(code);
        result["usage"].Should().BeNull();
        result["citations"]!.AsArray().Should().BeEmpty();
        (await db.Set<GPTUsageMetric>().CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task ReusingConversationAfterDatasetSwitchStopsBeforeRetrieval()
    {
        await using var db = await DatabaseAsync();
        db.Set<GPTMessage>().Add(new GPTMessage
        {
            ConversationId = 10, Role = "assistant", Content = "Prior synthetic answer",
            FunctionName = "gpt.grounded-answer@1.0.0",
            FunctionResult = """{"result":{"countyId":"42","datasetKey":"rag-dataset:8"}}""",
        });
        await db.SaveChangesAsync();
        var context = new Mock<IGptGroundedContextConsumer>(MockBehavior.Strict);
        var provider = new Mock<IGptLocalInferenceProvider>(MockBehavior.Strict);
        var action = () => Service(db, context.Object, provider.Object).SendAsync(1, 10, "Synthetic question", "test-user", 42, "trace-new");
        await action.Should().ThrowAsync<UnauthorizedAccessException>();
        context.VerifyNoOtherCalls(); provider.VerifyNoOtherCalls();
        (await db.Set<GPTMessage>().CountAsync()).Should().Be(1);
    }

    private static GptGroundedAnswerService Service(TerraFusionDbContext db, IGptGroundedContextConsumer context, IGptLocalInferenceProvider provider, IGptGroundedAnswerProcessHost? validator = null)
    {
        var echo = new Mock<IGptGroundedAnswerProcessHost>(MockBehavior.Strict);
        echo.Setup(host => host.ValidateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string json, CancellationToken _) => new GptGroundedAnswerValidation(true, true, json, null));
        return new GptGroundedAnswerService(db, context, provider, validator ?? echo.Object, Options.Create(new GptLocalInferenceOptions
        {
            Enabled = true, Model = "local-model", EmbeddingModel = "local-embed", EmbeddingDimensions = 3,
            Endpoint = "http://127.0.0.1:11434",
        }));
    }
    private static Mock<IGptLocalInferenceProvider> Generated()
    {
        var provider = new Mock<IGptLocalInferenceProvider>(MockBehavior.Strict);
        provider.Setup(candidate => candidate.GenerateAsync("Synthetic question", It.IsAny<IReadOnlyList<GptGroundedCitation>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Answer());
        return provider;
    }
    private static GptLocalInferenceResult Answer() => new("ANSWERED", null, JsonNode.Parse("""{"answer":"Synthetic supported answer","provider":"ollama","model":"local-model","citations":[{"sourceId":"rag-document:11","chunkId":"rag-chunk:29"}]}""")!.AsObject());
    private static Mock<IGptGroundedContextConsumer> Context(string status, string? denial = null)
    {
        var context = new Mock<IGptGroundedContextConsumer>(MockBehavior.Strict);
        context.Setup(candidate => candidate.ConsumeAsync(It.IsAny<GptGroundedContextRequest>(), 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GptGroundedContextRequest request, int? _, CancellationToken _) => new GptGroundedContextConsumption(
                true, GptGroundedContextConsumerFailure.None, new GptGroundedContextResult
                {
                    SchemaVersion = "1.0.0", CountyId = request.CountyId, DatasetKey = request.DatasetKey,
                    TraceId = request.TraceId, Status = status, DenialCode = denial,
                    Citations = status == "GROUNDED" ? [new GptGroundedCitation
                    {
                        SourceId = "rag-document:11", ChunkId = "rag-chunk:29", ChunkIndex = 0,
                        Excerpt = "Admitted synthetic excerpt", Score = 0.9m,
                    }] : [],
                }, [], null, null, null, null, null));
        return context;
    }
    private static TerraFusionDbContext Database(string name)
    {
        return new AnswerTestDbContext(new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(name).Options);
    }
    private sealed class AnswerTestDbContext(DbContextOptions<TerraFusionDbContext> options)
        : TerraFusionDbContext(options, new ConfigurationBuilder().Build())
    {
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            GptAiEntityConfigurations.Apply(builder, Database.ProviderName);
        }
    }
    private static async Task<TerraFusionDbContext> DatabaseAsync(string? name = null)
    {
        var db = Database(name ?? $"eo-gpt-answer-{Guid.NewGuid():N}");
        db.Set<CoreEntities.GPTConfiguration>().Add(new()
        {
            Id = 1, CountyId = 42, Name = "Synthetic GPT", DisplayName = "Synthetic GPT", Status = "Active",
            ModelProvider = "ollama", ModelName = "local-model", SystemPrompt = "Unused remote prompt",
            EnableRAG = true, RAGDatasetId = 7, RAGTopK = 2,
        });
        db.Set<CoreEntities.GPTConversation>().Add(new()
        {
            Id = 10, GPTConfigurationId = 1, CountyId = 42, UserId = "test-user", Status = "Active",
        });
        db.Set<RAGDataset>().Add(new()
        {
            Id = 7, CountyId = 42, Name = "Synthetic dataset", Status = "Active",
            EmbeddingProvider = "ollama", EmbeddingModel = "local-embed", VectorDimension = 3,
        });
        await db.SaveChangesAsync(); return db;
    }
}
