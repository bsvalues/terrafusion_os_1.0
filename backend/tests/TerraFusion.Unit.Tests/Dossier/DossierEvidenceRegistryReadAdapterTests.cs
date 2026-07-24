using FluentAssertions;
using System.Text.Json;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Adapters;
using TerraFusion.Core.Entities;
using Xunit;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierEvidenceRegistryReadAdapterTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid FirstEvidenceId = Guid.Parse("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    private const string ParcelId = "synthetic-parcel-001";

    [Fact]
    public void Map_MapsAndCanonicallyOrdersEvidence()
    {
        var laterId = CreateEvidence(
            id: Guid.Parse("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff"),
            createdAt: new DateTime(2026, 4, 2, 18, 30, 0, DateTimeKind.Utc));
        var firstTieId = CreateEvidence(
            createdAt: new DateTime(2026, 4, 2, 18, 30, 0, DateTimeKind.Utc));
        var older = CreateEvidence(
            id: Guid.Parse("cccccccc-dddd-4eee-8fff-000000000000"),
            evidenceType: "field-inspection",
            integrity: "pending",
            hasDocument: false,
            createdAt: new DateTime(2026, 4, 1, 18, 30, 0, DateTimeKind.Utc));

        var result = DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(limit: 3),
            total: 3,
            [older, laterId, firstTieId]);

        result.Should().BeEquivalentTo(new DossierEvidenceRegistryReadResult
        {
            SchemaVersion = "1.0.0",
            CountyId = CountyId.ToString("D"),
            ParcelId = ParcelId,
            Total = 3,
            HasMore = false,
            Limit = 3,
            Offset = 0,
            TraceId = "synthetic-trace",
            Results =
            [
                new DossierEvidenceRegistryRecord
                {
                    EvidenceId = FirstEvidenceId.ToString("D"),
                    EvidenceType = "photo",
                    Integrity = "verified",
                    CreatedAt = new DateTimeOffset(2026, 4, 2, 18, 30, 0, TimeSpan.Zero),
                    DocumentId = laterId.DocumentId!.Value.ToString("D"),
                },
                new DossierEvidenceRegistryRecord
                {
                    EvidenceId = laterId.Id.ToString("D"),
                    EvidenceType = "photo",
                    Integrity = "verified",
                    CreatedAt = new DateTimeOffset(2026, 4, 2, 18, 30, 0, TimeSpan.Zero),
                    DocumentId = laterId.DocumentId!.Value.ToString("D"),
                },
                new DossierEvidenceRegistryRecord
                {
                    EvidenceId = older.Id.ToString("D"),
                    EvidenceType = "field-inspection",
                    Integrity = "pending",
                    CreatedAt = new DateTimeOffset(2026, 4, 1, 18, 30, 0, TimeSpan.Zero),
                    DocumentId = null,
                },
            ],
        }, options => options.WithStrictOrdering());
    }

    [Fact]
    public void Map_ProducesHonestEmptyAndNextPageResults()
    {
        var empty = DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            total: 0,
            []);
        var nextPage = DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(limit: 1),
            total: 2,
            [CreateEvidence()]);

        empty.Results.Should().BeEmpty();
        empty.HasMore.Should().BeFalse();
        nextPage.HasMore.Should().BeTrue();
    }

    [Fact]
    public void Serialize_OmitsAbsentOptionalsAndCrossLaneFields()
    {
        var source = CreateEvidence(hasDocument: false);
        source.Title = "must-not-cross";
        source.CreatedBy = "must-not-cross";
        var request = CreateRequest() with { TraceId = null };

        using var json = JsonDocument.Parse(
            DossierEvidenceRegistryReadAdapter.Serialize(request, total: 1, [source]));
        var root = json.RootElement;
        var record = root.GetProperty("results")[0];

        root.TryGetProperty("traceId", out _).Should().BeFalse();
        record.TryGetProperty("documentId", out _).Should().BeFalse();
        record.TryGetProperty("title", out _).Should().BeFalse();
        record.TryGetProperty("createdBy", out _).Should().BeFalse();
        record.TryGetProperty("countyId", out _).Should().BeFalse();
        record.TryGetProperty("parcelId", out _).Should().BeFalse();
        record.TryGetProperty("chainLength", out _).Should().BeFalse();
    }

    [Fact]
    public void Serialize_EmitsUtcZTimestamp()
    {
        using var json = JsonDocument.Parse(DossierEvidenceRegistryReadAdapter.Serialize(
            CreateRequest(),
            total: 1,
            [CreateEvidence()]));

        var timestamp = json.RootElement
            .GetProperty("results")[0]
            .GetProperty("createdAt")
            .GetString();

        timestamp.Should().NotBeNull();
        timestamp.Should().EndWith("Z");
        timestamp.Should().NotContain("+00:00");
    }

    [Fact]
    public void Map_RejectsNullInputsAndNullRows()
    {
        var nullRequest = () => DossierEvidenceRegistryReadAdapter.Map(null!, 0, []);
        var nullSource = () => DossierEvidenceRegistryReadAdapter.Map(CreateRequest(), 0, null!);
        var nullRow = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            1,
            [null!]);

        nullRequest.Should().Throw<ArgumentNullException>();
        nullSource.Should().Throw<ArgumentNullException>();
        nullRow.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData("0.9.0")]
    [InlineData("")]
    public void Map_RejectsInvalidSchemaVersion(string schemaVersion)
    {
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest() with { SchemaVersion = schemaVersion },
            0,
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("{11111111-2222-3333-4444-555555555555}")]
    [InlineData("11111111222233334444555555555555")]
    [InlineData("11111111-2222-3333-4444-55555555555Z")]
    public void Map_RejectsNonCanonicalCountyIdentity(string countyId)
    {
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest() with { CountyId = countyId },
            0,
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Map_RejectsBlankParcelIdentity(string parcelId)
    {
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest() with { ParcelId = parcelId },
            0,
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(101, 0)]
    [InlineData(10, -1)]
    public void Map_RejectsInvalidPaginationRequest(int limit, int offset)
    {
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(limit, offset),
            0,
            []);

        action.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Map_RejectsBlankTraceIdentity()
    {
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest() with { TraceId = " " },
            0,
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(-1, 0, 0)]
    [InlineData(0, 1, 0)]
    [InlineData(1, 2, 0)]
    public void Map_RejectsInconsistentPagination(int total, int sourceCount, int offset)
    {
        var source = Enumerable.Range(0, sourceCount)
            .Select(index => CreateEvidence(id: Guid.Parse($"aaaaaaaa-bbbb-4ccc-8ddd-{index + 1:000000000000}")))
            .ToArray();
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(limit: 1, offset),
            total,
            source);

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Map_RejectsPageLargerThanLimit()
    {
        var source = new[]
        {
            CreateEvidence(),
            CreateEvidence(id: Guid.Parse("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff")),
        };
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(limit: 1),
            total: 2,
            source);

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Map_RejectsCountyOrParcelMismatch()
    {
        var wrongCounty = CreateEvidence();
        wrongCounty.CountyId = Guid.NewGuid();
        var wrongParcel = CreateEvidence();
        wrongParcel.ParcelId = "another-parcel";

        var countyAction = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            1,
            [wrongCounty]);
        var parcelAction = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            1,
            [wrongParcel]);

        countyAction.Should().Throw<InvalidOperationException>();
        parcelAction.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData("unknown", "verified")]
    [InlineData("Photo", "verified")]
    [InlineData("photo", "unknown")]
    [InlineData("photo", "Verified")]
    [InlineData("", "verified")]
    public void Map_RejectsUnknownOrMisCasedVocabulary(string evidenceType, string integrity)
    {
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            1,
            [CreateEvidence(evidenceType: evidenceType, integrity: integrity)]);

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Map_RejectsInvalidEvidenceAndDocumentIdentity()
    {
        var emptyEvidenceId = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            1,
            [CreateEvidence(id: Guid.Empty)]);
        var emptyDocumentId = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            1,
            [CreateEvidence(documentId: Guid.Empty)]);

        emptyEvidenceId.Should().Throw<InvalidOperationException>();
        emptyDocumentId.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Map_RejectsDuplicateEvidenceIdentity()
    {
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(limit: 2),
            total: 2,
            [CreateEvidence(), CreateEvidence()]);

        action.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData(DateTimeKind.Local)]
    [InlineData(DateTimeKind.Unspecified)]
    public void Map_RejectsNonUtcCreatedAt(DateTimeKind kind)
    {
        var source = CreateEvidence(
            createdAt: DateTime.SpecifyKind(new DateTime(2026, 4, 2, 18, 30, 0), kind));
        var action = () => DossierEvidenceRegistryReadAdapter.Map(
            CreateRequest(),
            1,
            [source]);

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ResultContract_DoesNotExposeCrossLaneOrCustodyFields()
    {
        Type[] contractTypes =
        [
            typeof(DossierEvidenceRegistryReadResult),
            typeof(DossierEvidenceRegistryRecord),
        ];
        var propertyNames = contractTypes
            .SelectMany(type => type.GetProperties())
            .Select(property => property.Name)
            .ToArray();

        propertyNames.Should().NotContain(name =>
            name.Contains("Title", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Creator", StringComparison.OrdinalIgnoreCase)
            || name.Contains("CreatedBy", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Chain", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Custody", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Value", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Levy", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Note", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Provider", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Token", StringComparison.OrdinalIgnoreCase));
    }

    private static DossierEvidenceRegistryReadRequest CreateRequest(
        int limit = 100,
        int offset = 0) =>
        new()
        {
            SchemaVersion = "1.0.0",
            CountyId = CountyId.ToString("D"),
            ParcelId = ParcelId,
            Limit = limit,
            Offset = offset,
            TraceId = "synthetic-trace",
        };

    private static DossierEvidence CreateEvidence(
        Guid? id = null,
        string parcelId = ParcelId,
        string evidenceType = "photo",
        string integrity = "verified",
        Guid? documentId = default,
        bool hasDocument = true,
        DateTime? createdAt = null) =>
        new()
        {
            Id = id ?? FirstEvidenceId,
            CountyId = CountyId,
            ParcelId = parcelId,
            Title = "must-not-cross",
            EvidenceType = evidenceType,
            Integrity = integrity,
            DocumentId = hasDocument
                ? documentId ?? Guid.Parse("dddddddd-eeee-4fff-8aaa-bbbbbbbbbbbb")
                : null,
            CreatedBy = "must-not-cross",
            CreatedAt = createdAt ?? new DateTime(2026, 4, 2, 18, 30, 0, DateTimeKind.Utc),
        };
}
