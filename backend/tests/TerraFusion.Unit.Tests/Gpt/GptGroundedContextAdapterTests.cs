using FluentAssertions;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Models;
using TerraFusion.API.Adapters;
using Xunit;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedContextAdapterTests
{
    private const string CountyId = "synthetic-county";
    private const string DatasetKey = "synthetic-dataset";
    private const string TraceId = "synthetic-trace";

    [Fact]
    public void Map_MapsGroundedResultFieldForFieldWithoutReranking()
    {
        var result = GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates:
            [
                Candidate("source-z", "chunk-z", 0, 0.9, "First excerpt", "First title"),
                Candidate("source-a", "chunk-a", 1, 0.8, "Second excerpt", null),
            ]));

        result.Should().BeEquivalentTo(new GptGroundedContextResult
        {
            SchemaVersion = "1.0.0",
            CountyId = CountyId,
            DatasetKey = DatasetKey,
            TraceId = TraceId,
            Status = "GROUNDED",
            DenialCode = null,
            Citations =
            [
                new GptGroundedCitation
                {
                    SourceId = "source-z",
                    ChunkId = "chunk-z",
                    ChunkIndex = 0,
                    Excerpt = "First excerpt",
                    Score = 0.9m,
                    SourceTitle = "First title",
                },
                new GptGroundedCitation
                {
                    SourceId = "source-a",
                    ChunkId = "chunk-a",
                    ChunkIndex = 1,
                    Excerpt = "Second excerpt",
                    Score = 0.8m,
                    SourceTitle = null,
                },
            ],
        }, options => options.WithStrictOrdering());
    }

    [Fact]
    public void Map_MapsNoRelevantContextResult()
    {
        var result = GptGroundedContextAdapter.Map(
            CreateResult(status: "NO_RELEVANT_CONTEXT"));

        result.Status.Should().Be("NO_RELEVANT_CONTEXT");
        result.DenialCode.Should().BeNull();
        result.Citations.Should().BeEmpty();
    }

    [Theory]
    [InlineData("COUNTY_CONTEXT_MISSING")]
    [InlineData("COUNTY_MISMATCH")]
    [InlineData("DATASET_NOT_ALLOWED")]
    [InlineData("QUERY_REJECTED")]
    [InlineData("SOURCE_NOT_AUTHORIZED")]
    public void Map_PreservesEveryFrozenDenialCode(string denialCode)
    {
        var result = GptGroundedContextAdapter.Map(CreateResult(
            authorization: "DENIED",
            status: "DENIED",
            denialCode: denialCode));

        result.Status.Should().Be("DENIED");
        result.DenialCode.Should().Be(denialCode);
        result.Citations.Should().BeEmpty();
    }

    [Fact]
    public void Map_RejectsNullResultCandidateCollectionOrCandidate()
    {
        var nullResult = () => GptGroundedContextAdapter.Map(null!);
        var nullCandidates = () => GptGroundedContextAdapter.Map(
            CreateResult(status: "GROUNDED") with { Candidates = null! });
        var nullCandidate = () => GptGroundedContextAdapter.Map(
            CreateResult(status: "GROUNDED", candidates: [null!]));

        nullResult.Should().Throw<ArgumentNullException>();
        nullCandidates.Should().Throw<ArgumentNullException>();
        nullCandidate.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("", DatasetKey, TraceId)]
    [InlineData(" county ", DatasetKey, TraceId)]
    [InlineData(CountyId, "", TraceId)]
    [InlineData(CountyId, "dataset\n", TraceId)]
    [InlineData(CountyId, DatasetKey, " ")]
    public void Map_RejectsMissingOrNonCanonicalResultIdentity(
        string countyId,
        string datasetKey,
        string traceId)
    {
        var action = () => GptGroundedContextAdapter.Map(
            CreateResult(status: "NO_RELEVANT_CONTEXT") with
            {
                CountyId = countyId,
                DatasetKey = datasetKey,
                TraceId = traceId,
            });

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("UNKNOWN", "NO_RELEVANT_CONTEXT", null)]
    [InlineData("DENIED", "DENIED", null)]
    [InlineData("DENIED", "DENIED", "UNKNOWN")]
    [InlineData("DENIED", "NO_RELEVANT_CONTEXT", "QUERY_REJECTED")]
    [InlineData("ALLOWED", "DENIED", null)]
    [InlineData("ALLOWED", "NO_RELEVANT_CONTEXT", "QUERY_REJECTED")]
    [InlineData("ALLOWED", "UNKNOWN", null)]
    public void Map_RejectsInvalidStateCombination(
        string authorization,
        string status,
        string? denialCode)
    {
        var action = () => GptGroundedContextAdapter.Map(
            CreateResult(authorization, status, denialCode));

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Map_RejectsStateAndCitationCardinalityContradictions()
    {
        var deniedWithCandidate = () => GptGroundedContextAdapter.Map(CreateResult(
            "DENIED",
            "DENIED",
            "QUERY_REJECTED",
            [Candidate()]));
        var groundedEmpty = () => GptGroundedContextAdapter.Map(CreateResult(status: "GROUNDED"));
        var emptyWithCitation = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "NO_RELEVANT_CONTEXT",
            candidates: [Candidate()]));

        deniedWithCandidate.Should().Throw<ArgumentException>();
        groundedEmpty.Should().Throw<ArgumentException>();
        emptyWithCitation.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("", "chunk-1", "excerpt")]
    [InlineData(" source-1 ", "chunk-1", "excerpt")]
    [InlineData("source-1", "", "excerpt")]
    [InlineData("source-1", "chunk-1", " excerpt ")]
    [InlineData("source-1", "chunk-1", "excerpt\n")]
    public void Map_RejectsMissingOrNonCanonicalCitationText(
        string sourceId,
        string chunkId,
        string excerpt)
    {
        var action = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates: [Candidate(sourceId, chunkId, excerpt: excerpt)]));

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Map_RejectsInvalidIndexAndTextBounds()
    {
        var negativeIndex = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates: [Candidate(chunkIndex: -1)]));
        var longExcerpt = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates: [Candidate(excerpt: new string('x', 501))]));
        var longTitle = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates: [Candidate(sourceTitle: new string('x', 201))]));

        negativeIndex.Should().Throw<ArgumentOutOfRangeException>();
        longExcerpt.Should().Throw<ArgumentException>();
        longTitle.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(double.NaN)]
    [InlineData(double.NegativeInfinity)]
    [InlineData(double.PositiveInfinity)]
    [InlineData(-0.01)]
    [InlineData(1.01)]
    public void Map_RejectsInvalidScores(double score)
    {
        var action = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates: [Candidate(score: score)]));

        action.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Map_ConvertsScoreBoundsDeterministically()
    {
        var result = GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates:
            [
                Candidate("source-a", "chunk-a", score: 1),
                Candidate("source-b", "chunk-b", score: 0),
            ]));

        result.Citations.Select(citation => citation.Score).Should().Equal(1m, 0m);
    }

    [Fact]
    public void Map_RejectsDuplicateSourceChunkPairs()
    {
        var action = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates:
            [
                Candidate("source-a", "chunk-a", score: 0.9),
                Candidate("source-a", "chunk-a", chunkIndex: 1, score: 0.8),
            ]));

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Map_RejectsNoncanonicalOrderingInsteadOfReranking()
    {
        var scoreOrder = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates:
            [
                Candidate("source-a", "chunk-a", score: 0.8),
                Candidate("source-b", "chunk-b", score: 0.9),
            ]));
        var tieOrder = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates:
            [
                Candidate("source-b", "chunk-b", chunkIndex: 1, score: 0.8),
                Candidate("source-a", "chunk-a", chunkIndex: 1, score: 0.8),
            ]));
        var chunkIndexOrder = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates:
            [
                Candidate("source-a", "chunk-b", chunkIndex: 2, score: 0.8),
                Candidate("source-a", "chunk-a", chunkIndex: 1, score: 0.8),
            ]));
        var chunkIdOrder = () => GptGroundedContextAdapter.Map(CreateResult(
            status: "GROUNDED",
            candidates:
            [
                Candidate("source-a", "chunk-b", chunkIndex: 1, score: 0.8),
                Candidate("source-a", "chunk-a", chunkIndex: 1, score: 0.8),
            ]));

        scoreOrder.Should().Throw<ArgumentException>();
        tieOrder.Should().Throw<ArgumentException>();
        chunkIndexOrder.Should().Throw<ArgumentException>();
        chunkIdOrder.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Map_HasOnlyTheCompletedE0ResultAsInput()
    {
        var method = typeof(GptGroundedContextAdapter).GetMethod(nameof(GptGroundedContextAdapter.Map));

        method.Should().NotBeNull();
        method!.GetParameters().Should().ContainSingle();
        method.GetParameters()[0].ParameterType.Should().Be<GptGroundedSourceIdentityResult>();
        method.ReturnType.Should().Be<GptGroundedContextResult>();
    }

    private static GptGroundedSourceIdentityResult CreateResult(
        string authorization = "ALLOWED",
        string status = "NO_RELEVANT_CONTEXT",
        string? denialCode = null,
        IReadOnlyList<GptGroundedSourceCandidate>? candidates = null) =>
        new(
            CountyId,
            DatasetKey,
            TraceId,
            authorization,
            status,
            denialCode,
            candidates ?? Array.Empty<GptGroundedSourceCandidate>());

    private static GptGroundedSourceCandidate Candidate(
        string sourceId = "source-1",
        string chunkId = "chunk-1",
        int chunkIndex = 0,
        double score = 0.8,
        string excerpt = "Sanitized synthetic excerpt.",
        string? sourceTitle = "Synthetic title") =>
        new(sourceId, chunkId, chunkIndex, excerpt, score, sourceTitle);
}
