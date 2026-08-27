using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.AI.Data;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Services;
using TerraFusion.Data;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedContextRagIsolationTests
{
    [Theory]
    [InlineData(99, "Active")]
    [InlineData(42, "Deleted")]
    public async Task CountyScopedRetrievalRejectsForeignOrInactiveDataset(
        int datasetCountyId,
        string status)
    {
        await using var context = Context();
        context.Set<RAGDataset>().Add(Dataset(7, datasetCountyId, status));
        await context.SaveChangesAsync();
        var repository = new Mock<IRAGEmbeddingRepository>(MockBehavior.Strict);
        var service = Service(context, repository.Object);

        var result = await service.GetRelevantContextForCountyAsync(
            7,
            42,
            "bounded query",
            2,
            0.7m);

        result.Should().BeNull();
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task StrictRepositoryFailurePropagatesInsteadOfBecomingNoRelevantContext()
    {
        await using var context = Context();
        context.Set<RAGDataset>().Add(Dataset(7, 42, "Active"));
        await context.SaveChangesAsync();
        var repository = new Mock<IRAGEmbeddingRepository>(MockBehavior.Strict);
        repository.Setup(candidate => candidate.SearchSimilarStrictAsync(
                7,
                It.IsAny<float[]>(),
                2,
                0.7f))
            .ThrowsAsync(new InvalidOperationException("storage unavailable"));
        var service = Service(context, repository.Object);

        var action = () => service.GetRelevantContextForCountyAsync(
            7,
            42,
            "bounded query",
            2,
            0.7m);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("storage unavailable");
    }

    [Fact]
    public async Task ProviderEmbeddingFailureStopsBeforeSimilaritySearch()
    {
        await using var context = Context();
        context.Set<RAGDataset>().Add(Dataset(7, 42, "Active"));
        await context.SaveChangesAsync();
        var repository = new Mock<IRAGEmbeddingRepository>(MockBehavior.Strict);
        var embeddingService = new Mock<IEmbeddingService>(MockBehavior.Strict);
        embeddingService.Setup(candidate => candidate.GenerateProviderEmbeddingAsync(
                "bounded query",
                "test-model"))
            .ThrowsAsync(new InvalidOperationException("provider unavailable"));
        var service = Service(context, repository.Object, embeddingService.Object);

        var action = () => service.GetRelevantContextForCountyAsync(
            7,
            42,
            "bounded query",
            2,
            0.7m);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("provider unavailable");
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TrueEmptyStrictSearchReturnsNoRelevantContext()
    {
        await using var context = Context();
        context.Set<RAGDataset>().Add(Dataset(7, 42, "Active"));
        await context.SaveChangesAsync();
        var repository = new Mock<IRAGEmbeddingRepository>(MockBehavior.Strict);
        repository.Setup(candidate => candidate.SearchSimilarStrictAsync(
                7,
                It.IsAny<float[]>(),
                2,
                0.7f))
            .ReturnsAsync([]);
        var service = Service(context, repository.Object);

        var result = await service.GetRelevantContextForCountyAsync(
            7,
            42,
            "bounded query",
            2,
            0.7m);

        result.Should().NotBeNull();
        result!.ChunksRetrieved.Should().Be(0);
        result.ChunkDetails.Should().BeEmpty();
    }

    [Fact]
    public async Task ForeignDocumentIdentityFailsClosed()
    {
        await using var context = Context();
        context.Set<RAGDataset>().AddRange(
            Dataset(7, 42, "Active"),
            Dataset(8, 42, "Active"));
        context.Set<RAGDocument>().Add(new RAGDocument
        {
            Id = 99,
            DatasetId = 8,
            Title = "Foreign document",
            Content = "must not cross the boundary",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();
        var repository = new Mock<IRAGEmbeddingRepository>(MockBehavior.Strict);
        repository.Setup(candidate => candidate.SearchSimilarStrictAsync(
                7,
                It.IsAny<float[]>(),
                2,
                0.7f))
            .ReturnsAsync([
                new RAGEmbeddingSearchResult
                {
                    EmbeddingId = 3,
                    DocumentId = 99,
                    DatasetId = 7,
                    ChunkIndex = 0,
                    ChunkText = "foreign",
                    SimilarityScore = 0.9f,
                },
            ]);
        var service = Service(context, repository.Object);

        var action = () => service.GetRelevantContextForCountyAsync(
            7,
            42,
            "bounded query",
            2,
            0.7m);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*outside the requested dataset*");
    }

    [Fact]
    public async Task AuthorizationChangeDuringRetrievalFailsClosed()
    {
        await using var context = Context();
        var dataset = Dataset(7, 42, "Active");
        context.Set<RAGDataset>().Add(dataset);
        await context.SaveChangesAsync();
        var repository = new Mock<IRAGEmbeddingRepository>(MockBehavior.Strict);
        repository.Setup(candidate => candidate.SearchSimilarStrictAsync(
                7,
                It.IsAny<float[]>(),
                2,
                0.7f))
            .ReturnsAsync(() =>
            {
                dataset.Status = "Deleted";
                context.SaveChanges();
                return new List<RAGEmbeddingSearchResult>();
            });
        var service = Service(context, repository.Object);

        var action = () => service.GetRelevantContextForCountyAsync(
            7,
            42,
            "bounded query",
            2,
            0.7m);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*authorization changed*");
    }

    private static RAGService Service(
        TerraFusionDbContext context,
        IRAGEmbeddingRepository repository,
        IEmbeddingService? embeddingService = null)
    {
        var defaultEmbeddingService = new Mock<IEmbeddingService>(MockBehavior.Strict);
        defaultEmbeddingService.Setup(candidate => candidate.GenerateProviderEmbeddingAsync(
                It.IsAny<string>(),
                It.IsAny<string>()))
            .ReturnsAsync([0.1f, 0.2f]);
        return new RAGService(
            context,
            repository,
            embeddingService ?? defaultEmbeddingService.Object,
            NullLogger<RAGService>.Instance);
    }

    private static TerraFusionDbContext Context()
    {
        TerraFusionDbContext.OnModelCreatingExtensions = GptAiEntityConfigurations.Apply;
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase($"gpt-grounded-isolation-{Guid.NewGuid():N}")
            .Options;
        return new TerraFusionDbContext(
            options,
            new ConfigurationBuilder().Build());
    }

    private static RAGDataset Dataset(int id, int countyId, string status) => new()
    {
        Id = id,
        CountyId = countyId,
        Name = $"Dataset {id}",
        Status = status,
        EmbeddingProvider = "Test",
        EmbeddingModel = "test-model",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        CreatedBy = "unit-test",
        UpdatedBy = "unit-test",
    };
}
