using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Services.Gpt;
using Xunit;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedContextConsumerTests
{
    [Fact]
    public async Task ConsumeAsync_MissingAuthenticatedCountyReturnsCanonicalDenialWithoutRetrieval()
    {
        var host = EchoHost();
        host.Setup(candidate => candidate.ValidateAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string json, CancellationToken _) => Accepted(json));
        var rag = new Mock<IRAGService>(MockBehavior.Strict);
        var consumer = new GptGroundedContextConsumer(
            host.Object,
            rag.Object,
            NullLogger<GptGroundedContextConsumer>.Instance);

        var consumption = await consumer.ConsumeAsync(Request(), null);

        consumption.Success.Should().BeTrue();
        consumption.Result!.Status.Should().Be("DENIED");
        consumption.Result.DenialCode.Should().Be("COUNTY_CONTEXT_MISSING");
        rag.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ConsumeAsync_PreflightsBeforeRetrievalAndReturnsBoundedCanonicalCitations()
    {
        var sequence = new MockSequence();
        var host = EchoHost();
        var rag = new Mock<IRAGService>(MockBehavior.Strict);
        host.InSequence(sequence)
            .Setup(candidate => candidate.ValidateAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string json, CancellationToken _) => Accepted(json));
        rag.InSequence(sequence)
            .Setup(candidate => candidate.GetRelevantContextForCountyAsync(
                7,
                42,
                "How is this classified?",
                2,
                0.7m))
            .ReturnsAsync(new RAGSearchResult
            {
                ChunkDetails =
                [
                    new RAGChunkDetail
                    {
                        DocumentId = 11,
                        ChunkId = 29,
                        ChunkIndex = 3,
                        DocumentTitle = "Assessment Manual",
                        TextSnippet = "Use is determined from the observed evidence.",
                        Score = 0.91m,
                        FullText = "This full text must not cross the contract boundary.",
                        SourceUrl = "provider://must-not-leak",
                    },
                ],
            });
        host.InSequence(sequence)
            .Setup(candidate => candidate.ValidateAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string json, CancellationToken _) => Accepted(json));
        var consumer = new GptGroundedContextConsumer(
            host.Object,
            rag.Object,
            NullLogger<GptGroundedContextConsumer>.Instance);

        var consumption = await consumer.ConsumeAsync(Request(), 42);

        consumption.Success.Should().BeTrue();
        consumption.Result!.Status.Should().Be("GROUNDED");
        consumption.Result.Citations.Should().ContainSingle();
        consumption.Result.Citations[0].Should().BeEquivalentTo(new GptGroundedCitation
        {
            SourceId = "rag-document:11",
            ChunkId = "rag-chunk:29",
            ChunkIndex = 3,
            SourceTitle = "Assessment Manual",
            Excerpt = "Use is determined from the observed evidence.",
            Score = 0.91m,
        });
        JsonSerializer.Serialize(consumption.Result).Should().NotContain("full text");
        JsonSerializer.Serialize(consumption.Result).Should().NotContain("provider://");
        host.VerifyAll();
        rag.VerifyAll();
    }

    [Fact]
    public async Task ConsumeAsync_ProviderFailureReturnsUnavailableWithoutPostflightClaim()
    {
        var host = EchoHost();
        host.Setup(candidate => candidate.ValidateAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string json, CancellationToken _) => Accepted(json));
        var rag = new Mock<IRAGService>(MockBehavior.Strict);
        rag.Setup(candidate => candidate.GetRelevantContextForCountyAsync(
                7,
                42,
                "How is this classified?",
                2,
                0.7m))
            .ThrowsAsync(new InvalidOperationException("provider unavailable"));
        var consumer = new GptGroundedContextConsumer(
            host.Object,
            rag.Object,
            NullLogger<GptGroundedContextConsumer>.Instance);

        var consumption = await consumer.ConsumeAsync(Request(), 42);

        consumption.Success.Should().BeFalse();
        consumption.Failure.Should().Be(GptGroundedContextConsumerFailure.RetrievalFailed);
        consumption.Result.Should().BeNull();
        host.Verify(candidate => candidate.ValidateAsync(
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
        rag.VerifyAll();
    }

    [Fact]
    public async Task ConsumeAsync_RawPiiSuiteRejectionNeverTouchesDatasetOrRetrieval()
    {
        var host = new Mock<IGptGroundedContextProcessHost>(MockBehavior.Strict);
        host.Setup(candidate => candidate.ValidateAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GptGroundedContextProcessResult(
                true,
                false,
                [new GptGroundedContextViolation("RAW_PII_QUERY", "raw query rejected")],
                null,
                "module",
                "module",
                "schema",
                "schema",
                null));
        var rag = new Mock<IRAGService>(MockBehavior.Strict);
        var consumer = new GptGroundedContextConsumer(
            host.Object,
            rag.Object,
            NullLogger<GptGroundedContextConsumer>.Instance);
        var request = Request() with { QueryText = "SSN 123-45-6789" };

        var consumption = await consumer.ConsumeAsync(request, 42);

        consumption.Success.Should().BeFalse();
        consumption.Failure.Should().Be(GptGroundedContextConsumerFailure.QueryRejected);
        rag.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ConsumeAsync_CountyMismatchReturnsCanonicalDenialWithoutRetrieval()
    {
        var host = EchoHost();
        host.Setup(candidate => candidate.ValidateAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string json, CancellationToken _) => Accepted(json));
        var rag = new Mock<IRAGService>(MockBehavior.Strict);
        var consumer = new GptGroundedContextConsumer(
            host.Object,
            rag.Object,
            NullLogger<GptGroundedContextConsumer>.Instance);

        var consumption = await consumer.ConsumeAsync(Request(), 99);

        consumption.Success.Should().BeTrue();
        consumption.Result!.Status.Should().Be("DENIED");
        consumption.Result.DenialCode.Should().Be("COUNTY_MISMATCH");
        consumption.Result.Citations.Should().BeEmpty();
        rag.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ConsumeAsync_DatasetMustBeActiveAndOwnedByAuthenticatedCounty()
    {
        var host = EchoHost();
        host.Setup(candidate => candidate.ValidateAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string json, CancellationToken _) => Accepted(json));
        var rag = new Mock<IRAGService>(MockBehavior.Strict);
        rag.Setup(candidate => candidate.GetRelevantContextForCountyAsync(
                7,
                42,
                "How is this classified?",
                2,
                0.7m))
            .ReturnsAsync((RAGSearchResult?)null);
        var consumer = new GptGroundedContextConsumer(
            host.Object,
            rag.Object,
            NullLogger<GptGroundedContextConsumer>.Instance);

        var consumption = await consumer.ConsumeAsync(Request(), 42);

        consumption.Success.Should().BeTrue();
        consumption.Result!.Status.Should().Be("DENIED");
        consumption.Result.DenialCode.Should().Be("DATASET_NOT_ALLOWED");
        rag.Verify(candidate => candidate.GetRelevantContextForCountyAsync(
            7,
            42,
            "How is this classified?",
            2,
            0.7m), Times.Once);
        rag.VerifyNoOtherCalls();
    }

    private static Mock<IGptGroundedContextProcessHost> EchoHost() =>
        new(MockBehavior.Strict);

    private static GptGroundedContextProcessResult Accepted(string json) => new(
        true,
        true,
        Array.Empty<GptGroundedContextViolation>(),
        json,
        "module",
        "module",
        "schema",
        "schema",
        null);

    private static GptGroundedContextRequest Request() => new()
    {
        SchemaVersion = "1.0.0",
        CountyId = "42",
        DatasetKey = "rag-dataset:7",
        QueryText = "How is this classified?",
        TopK = 2,
        ScoreThreshold = 0.7m,
        TraceId = "trace-runtime-001",
    };
}
