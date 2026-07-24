using FluentAssertions;
using TerraFusion.AI.Models;
using Xunit;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedSourceIdentityProjectionTests
{
    private const string CountyId = "synthetic-county";
    private const string DatasetKey = "synthetic-dataset";
    private const string TraceId = "synthetic-trace";

    [Fact]
    public void Create_ProducesDeniedResultWithoutCandidates()
    {
        var result = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("DENIED", "DATASET_NOT_ALLOWED"),
            []);

        result.Should().BeEquivalentTo(new GptGroundedSourceIdentityResult(
            CountyId,
            DatasetKey,
            TraceId,
            "DENIED",
            "DENIED",
            "DATASET_NOT_ALLOWED",
            []));
    }

    [Fact]
    public void Create_ProducesNoRelevantContextForAllowedEmptyResult()
    {
        var result = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            []);

        result.Should().BeEquivalentTo(new GptGroundedSourceIdentityResult(
            CountyId,
            DatasetKey,
            TraceId,
            "ALLOWED",
            "NO_RELEVANT_CONTEXT",
            null,
            []));
    }

    [Fact]
    public void Create_ProducesGroundedResultInCanonicalOrder()
    {
        GptGroundedSourceCandidate[] candidates =
        [
            CreateCandidate("source-b", "chunk-b", 1, 0.8),
            CreateCandidate("source-a", "chunk-c", 2, 0.8),
            CreateCandidate("source-a", "chunk-a", 1, 0.8),
            CreateCandidate("source-z", "chunk-z", 0, 0.9),
            CreateCandidate("source-a", "chunk-b", 1, 0.8),
        ];

        var result = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            candidates);

        result.Status.Should().Be("GROUNDED");
        result.Candidates.Select(CandidateKey).Should().Equal(
            "source-z:0:chunk-z",
            "source-a:1:chunk-a",
            "source-a:1:chunk-b",
            "source-a:2:chunk-c",
            "source-b:1:chunk-b");
    }

    [Fact]
    public void Create_NormalizesShuffledInputsIdentically()
    {
        GptGroundedSourceCandidate[] candidates =
        [
            CreateCandidate("source-b", "chunk-b", 1, 0.8),
            CreateCandidate("source-a", "chunk-a", 0, 0.9),
            CreateCandidate("source-c", "chunk-c", 2, 0.7),
        ];

        var forward = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            candidates);
        var shuffled = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            candidates.Reverse().ToArray());

        shuffled.Should().BeEquivalentTo(
            forward,
            options => options.WithStrictOrdering());
    }

    [Fact]
    public void Create_PreservesExplicitHostProvenAssertions()
    {
        var candidate = CreateCandidate(
            "opaque-source",
            "opaque-chunk",
            7,
            0.42,
            excerpt: "Sanitized synthetic excerpt.",
            sourceTitle: "Synthetic title");

        var result = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [candidate]);

        result.CountyId.Should().Be(CountyId);
        result.DatasetKey.Should().Be(DatasetKey);
        result.TraceId.Should().Be(TraceId);
        result.Candidates.Should().ContainSingle().Which.Should().Be(candidate);
    }

    [Fact]
    public void Create_RejectsNullInputsAndNullCandidates()
    {
        var request = CreateRequest();
        var authorization = new GptGroundedSourceAuthorization("ALLOWED", null);

        var nullRequest = () => GptGroundedSourceIdentityProjection.Create(
            null!,
            authorization,
            []);
        var nullAuthorization = () => GptGroundedSourceIdentityProjection.Create(
            request,
            null!,
            []);
        var nullCandidates = () => GptGroundedSourceIdentityProjection.Create(
            request,
            authorization,
            null!);
        var nullCandidate = () => GptGroundedSourceIdentityProjection.Create(
            request,
            authorization,
            [null!]);

        nullRequest.Should().Throw<ArgumentNullException>();
        nullAuthorization.Should().Throw<ArgumentNullException>();
        nullCandidates.Should().Throw<ArgumentNullException>();
        nullCandidate.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("", DatasetKey, TraceId)]
    [InlineData(" ", DatasetKey, TraceId)]
    [InlineData(" county ", DatasetKey, TraceId)]
    [InlineData(CountyId, "", TraceId)]
    [InlineData(CountyId, " ", TraceId)]
    [InlineData(CountyId, " dataset ", TraceId)]
    [InlineData(CountyId, DatasetKey, "")]
    [InlineData(CountyId, DatasetKey, " ")]
    [InlineData(CountyId, DatasetKey, " trace ")]
    public void Create_RejectsMissingOrNonCanonicalRequestIdentity(
        string countyId,
        string datasetKey,
        string traceId)
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            new GptGroundedSourceIdentityRequest(countyId, datasetKey, traceId),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("allowed")]
    [InlineData("UNKNOWN")]
    public void Create_RejectsUnknownAuthorizationVocabulary(string authorization)
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization(authorization, null),
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("dataset_not_allowed")]
    [InlineData("UNKNOWN")]
    public void Create_RejectsMissingOrUnknownDeniedVocabulary(string? denialCode)
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("DENIED", denialCode),
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("COUNTY_CONTEXT_MISSING")]
    [InlineData("COUNTY_MISMATCH")]
    [InlineData("DATASET_NOT_ALLOWED")]
    [InlineData("QUERY_REJECTED")]
    [InlineData("SOURCE_NOT_AUTHORIZED")]
    public void Create_AcceptsEveryFrozenDenialCode(string denialCode)
    {
        var result = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("DENIED", denialCode),
            []);

        result.DenialCode.Should().Be(denialCode);
    }

    [Fact]
    public void Create_RejectsAllowedResultWithDenialCode()
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", "QUERY_REJECTED"),
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_RejectsDeniedResultWithCandidates()
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("DENIED", "SOURCE_NOT_AUTHORIZED"),
            [CreateCandidate()]);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("", "chunk-1", "excerpt")]
    [InlineData(" ", "chunk-1", "excerpt")]
    [InlineData(" source-1 ", "chunk-1", "excerpt")]
    [InlineData("source-1", "", "excerpt")]
    [InlineData("source-1", " ", "excerpt")]
    [InlineData("source-1", " chunk-1 ", "excerpt")]
    [InlineData("source-1", "chunk-1", "")]
    [InlineData("source-1", "chunk-1", " ")]
    [InlineData("source-1", "chunk-1", " excerpt ")]
    public void Create_RejectsMissingOrNonCanonicalCandidateText(
        string sourceId,
        string chunkId,
        string excerpt)
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [CreateCandidate(sourceId, chunkId, excerpt: excerpt)]);

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_RejectsNegativeChunkIndex()
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [CreateCandidate(chunkIndex: -1)]);

        action.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData(double.NaN)]
    [InlineData(double.NegativeInfinity)]
    [InlineData(double.PositiveInfinity)]
    [InlineData(-0.01)]
    [InlineData(1.01)]
    public void Create_RejectsInvalidScores(double score)
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [CreateCandidate(score: score)]);

        action.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Create_AcceptsScoreBounds()
    {
        var result = GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [
                CreateCandidate("source-a", "chunk-a", score: 0),
                CreateCandidate("source-b", "chunk-b", score: 1),
            ]);

        result.Candidates.Select(candidate => candidate.Score).Should().Equal(1, 0);
    }

    [Fact]
    public void Create_RejectsOversizedExcerptAndTitle()
    {
        var oversizedExcerpt = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [CreateCandidate(excerpt: new string('x', 501))]);
        var oversizedTitle = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [CreateCandidate(sourceTitle: new string('x', 201))]);

        oversizedExcerpt.Should().Throw<ArgumentException>();
        oversizedTitle.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(" ")]
    [InlineData(" title ")]
    [InlineData("title\nwith-control")]
    public void Create_RejectsUnsanitizedOptionalTitle(string sourceTitle)
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [CreateCandidate(sourceTitle: sourceTitle)]);

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_RejectsControlCharactersInBoundedText()
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [CreateCandidate(excerpt: "excerpt\twith-control")]);

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_RejectsDuplicateSourceChunkPairs()
    {
        var action = () => GptGroundedSourceIdentityProjection.Create(
            CreateRequest(),
            new GptGroundedSourceAuthorization("ALLOWED", null),
            [
                CreateCandidate("source-a", "chunk-a", chunkIndex: 0),
                CreateCandidate("source-a", "chunk-a", chunkIndex: 1),
            ]);

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ProjectionSurface_ContainsNoForbiddenRuntimeOrContentFields()
    {
        Type[] projectionTypes =
        [
            typeof(GptGroundedSourceIdentityRequest),
            typeof(GptGroundedSourceAuthorization),
            typeof(GptGroundedSourceCandidate),
            typeof(GptGroundedSourceIdentityResult),
        ];
        var forbiddenTerms = new[]
        {
            "Query",
            "FullText",
            "Url",
            "Provider",
            "Model",
            "Embedding",
            "Prompt",
            "Token",
            "Credential",
            "Persistence",
            "Database",
            "Http",
        };
        var propertyNames = projectionTypes
            .SelectMany(type => type.GetProperties())
            .Select(property => property.Name)
            .ToArray();

        propertyNames.Should().NotContain(name =>
            forbiddenTerms.Any(term => name.Contains(term, StringComparison.OrdinalIgnoreCase)));
        typeof(GptGroundedSourceIdentityProjection).GetConstructors().Should().BeEmpty();
    }

    private static GptGroundedSourceIdentityRequest CreateRequest() =>
        new(CountyId, DatasetKey, TraceId);

    private static GptGroundedSourceCandidate CreateCandidate(
        string sourceId = "source-1",
        string chunkId = "chunk-1",
        int chunkIndex = 0,
        double score = 0.75,
        string excerpt = "Sanitized synthetic excerpt.",
        string? sourceTitle = null) =>
        new(sourceId, chunkId, chunkIndex, excerpt, score, sourceTitle);

    private static string CandidateKey(GptGroundedSourceCandidate candidate) =>
        $"{candidate.SourceId}:{candidate.ChunkIndex}:{candidate.ChunkId}";
}
