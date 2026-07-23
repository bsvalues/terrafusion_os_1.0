using FluentAssertions;
using System.Text.Json;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Adapters;
using TerraFusion.Core.Entities;
using Xunit;

namespace TerraFusion.Unit.Tests.Dais;

public sealed class DaisAppealWorkflowReadAdapterTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid AppealId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private const string ParcelId = "synthetic-parcel-001";

    [Fact]
    public void Map_MapsAppealIdSelectorAndPreservesSourceOrder()
    {
        var first = CreateAppeal(
            hearingDate: new DateTime(2026, 2, 10, 18, 30, 0, DateTimeKind.Utc));
        var second = CreateAppeal(
            id: Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
            ground: "UNIFORMITY",
            status: "decided");
        var request = CreateRequest(new DaisAppealSelector { AppealId = AppealId.ToString("D") });

        var result = DaisAppealWorkflowReadAdapter.Map(request, [first]);
        var ordered = DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [first, second]);

        result.Should().BeEquivalentTo(new DaisAppealWorkflowReadResult
        {
            SchemaVersion = "1.0.0",
            CountyId = CountyId.ToString("D"),
            TraceId = "synthetic-trace",
            Appeals =
            [
                new DaisAppealWorkflowRecord
                {
                    AppealId = AppealId.ToString("D"),
                    ParcelId = ParcelId,
                    TaxYear = 2026,
                    Ground = DaisAppealGround.MARKET_VALUE,
                    Status = DaisAppealStatus.filed,
                    FiledAt = new DateTimeOffset(2026, 1, 10, 18, 30, 0, TimeSpan.Zero),
                    HearingAt = new DateTimeOffset(2026, 2, 10, 18, 30, 0, TimeSpan.Zero),
                    DecisionAt = null,
                },
            ],
        });
        ordered.Appeals.Select(appeal => appeal.AppealId).Should().Equal(
            first.Id.ToString("D"),
            second.Id.ToString("D"));
    }

    [Fact]
    public void Map_MapsParcelAndTaxYearSelectors()
    {
        var appeal = CreateAppeal();

        var byParcel = DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { ParcelId = ParcelId }),
            [appeal]);
        var byTaxYear = DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [appeal]);

        byParcel.Appeals.Should().ContainSingle();
        byTaxYear.Appeals.Should().ContainSingle();
    }

    [Fact]
    public void Map_ProducesHonestEmptyResult()
    {
        var result = DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            []);

        result.Appeals.Should().BeEmpty();
        result.CountyId.Should().Be(CountyId.ToString("D"));
        result.TraceId.Should().Be("synthetic-trace");
    }

    [Fact]
    public void Serialize_OmitsAbsentOptionalFieldsAndCrossLaneData()
    {
        var request = CreateRequest(new DaisAppealSelector { ParcelId = ParcelId }) with
        {
            TraceId = null,
        };
        var source = CreateAppeal(hearingDate: null, decisionDate: null);
        source.PetitionerName = "must-not-cross";
        source.CurrentValue = 100m;
        source.RequestedValue = 200m;
        source.DecidedValue = 150m;
        source.DecisionNotes = "must-not-cross";
        source.CreatedBy = "must-not-cross";

        using var json = JsonDocument.Parse(DaisAppealWorkflowReadAdapter.Serialize(request, [source]));
        var root = json.RootElement;
        var appeal = root.GetProperty("appeals")[0];

        root.TryGetProperty("traceId", out _).Should().BeFalse();
        appeal.TryGetProperty("hearingAt", out _).Should().BeFalse();
        appeal.TryGetProperty("decisionAt", out _).Should().BeFalse();
        appeal.TryGetProperty("petitionerName", out _).Should().BeFalse();
        appeal.TryGetProperty("currentValue", out _).Should().BeFalse();
        appeal.TryGetProperty("requestedValue", out _).Should().BeFalse();
        appeal.TryGetProperty("decidedValue", out _).Should().BeFalse();
        appeal.TryGetProperty("decisionNotes", out _).Should().BeFalse();
        appeal.TryGetProperty("createdBy", out _).Should().BeFalse();
    }

    [Fact]
    public void Map_RejectsNullInputs()
    {
        var requestAction = () => DaisAppealWorkflowReadAdapter.Map(null!, []);
        var sourceAction = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            null!);

        requestAction.Should().Throw<ArgumentNullException>();
        sourceAction.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData("0.9.0")]
    [InlineData("")]
    public void Map_RejectsInvalidSchemaVersion(string schemaVersion)
    {
        var request = CreateRequest(new DaisAppealSelector { TaxYear = 2026 }) with
        {
            SchemaVersion = schemaVersion,
        };

        var action = () => DaisAppealWorkflowReadAdapter.Map(request, []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("{11111111-2222-3333-4444-555555555555}")]
    [InlineData("11111111222233334444555555555555")]
    [InlineData("11111111-2222-3333-4444-55555555555Z")]
    public void Map_RejectsNonCanonicalCountyIdentity(string countyId)
    {
        var request = CreateRequest(new DaisAppealSelector { TaxYear = 2026 }) with
        {
            CountyId = countyId,
        };

        var action = () => DaisAppealWorkflowReadAdapter.Map(request, []);

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Map_RejectsBlankTraceIdentity()
    {
        var request = CreateRequest(new DaisAppealSelector { TaxYear = 2026 }) with
        {
            TraceId = " ",
        };

        var action = () => DaisAppealWorkflowReadAdapter.Map(request, []);

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Map_RejectsMissingOrAmbiguousSelector()
    {
        var missing = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector()),
            []);
        var ambiguous = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { ParcelId = ParcelId, TaxYear = 2026 }),
            []);

        missing.Should().Throw<ArgumentException>();
        ambiguous.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Map_RejectsBlankParcelSelector(string parcelId)
    {
        var action = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { ParcelId = parcelId }),
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("{aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee}")]
    [InlineData("not-an-appeal-id")]
    public void Map_RejectsNonCanonicalAppealSelector(string appealId)
    {
        var action = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { AppealId = appealId }),
            []);

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(1899)]
    [InlineData(2201)]
    public void Map_RejectsOutOfRangeSelectorTaxYear(int taxYear)
    {
        var action = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = taxYear }),
            []);

        action.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Map_RejectsCountyMismatch()
    {
        var source = CreateAppeal();
        source.CountyId = Guid.NewGuid();

        var action = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [source]);

        action.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData("appeal")]
    [InlineData("parcel")]
    [InlineData("year")]
    public void Map_RejectsSelectorMismatch(string selector)
    {
        var request = selector switch
        {
            "appeal" => CreateRequest(new DaisAppealSelector { AppealId = Guid.NewGuid().ToString("D") }),
            "parcel" => CreateRequest(new DaisAppealSelector { ParcelId = "another-parcel" }),
            _ => CreateRequest(new DaisAppealSelector { TaxYear = 2025 }),
        };

        var action = () => DaisAppealWorkflowReadAdapter.Map(request, [CreateAppeal()]);

        action.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData("", "filed")]
    [InlineData("market_value", "filed")]
    [InlineData("0", "filed")]
    [InlineData("MARKET_VALUE", "FILED")]
    [InlineData("MARKET_VALUE", "unknown")]
    public void Map_RejectsUnknownOrMisCasedVocabulary(string ground, string status)
    {
        var action = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(ground: ground, status: status)]);

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Map_RejectsInvalidSourceIdentityAndTaxYear()
    {
        var emptyId = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(id: Guid.Empty)]);
        var blankParcel = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(parcelId: " ")]);
        var invalidYear = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(taxYear: 1800)]);

        emptyId.Should().Throw<InvalidOperationException>();
        blankParcel.Should().Throw<InvalidOperationException>();
        invalidYear.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Map_RejectsNonUtcTimestamps()
    {
        var filed = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(filedDate: DateTime.SpecifyKind(new DateTime(2026, 1, 10), DateTimeKind.Local))]);
        var hearing = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(hearingDate: DateTime.SpecifyKind(new DateTime(2026, 2, 10), DateTimeKind.Unspecified))]);
        var decision = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(decisionDate: DateTime.SpecifyKind(new DateTime(2026, 3, 10), DateTimeKind.Local))]);

        filed.Should().Throw<InvalidOperationException>();
        hearing.Should().Throw<InvalidOperationException>();
        decision.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Map_RejectsImpossibleDateOrdering()
    {
        var hearing = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(hearingDate: new DateTime(2026, 1, 9, 18, 30, 0, DateTimeKind.Utc))]);
        var decision = () => DaisAppealWorkflowReadAdapter.Map(
            CreateRequest(new DaisAppealSelector { TaxYear = 2026 }),
            [CreateAppeal(decisionDate: new DateTime(2026, 1, 9, 18, 30, 0, DateTimeKind.Utc))]);

        hearing.Should().Throw<InvalidOperationException>();
        decision.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ResultContract_DoesNotExposeCrossLaneFields()
    {
        Type[] contractTypes =
        [
            typeof(DaisAppealWorkflowReadResult),
            typeof(DaisAppealWorkflowRecord),
        ];
        var propertyNames = contractTypes
            .SelectMany(type => type.GetProperties())
            .Select(property => property.Name)
            .ToArray();

        propertyNames.Should().NotContain(name =>
            name.Contains("Petitioner", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Value", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Notes", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Audit", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Provider", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Token", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Created", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Updated", StringComparison.OrdinalIgnoreCase));
    }

    private static DaisAppealWorkflowReadRequest CreateRequest(DaisAppealSelector selector) => new()
    {
        SchemaVersion = "1.0.0",
        CountyId = CountyId.ToString("D"),
        Selector = selector,
        TraceId = "synthetic-trace",
    };

    private static Appeal CreateAppeal(
        Guid? id = null,
        string parcelId = ParcelId,
        int taxYear = 2026,
        string ground = "MARKET_VALUE",
        string status = "filed",
        DateTime? filedDate = null,
        DateTime? hearingDate = default,
        DateTime? decisionDate = null) =>
        new()
        {
            Id = id ?? AppealId,
            CountyId = CountyId,
            ParcelId = parcelId,
            TaxYear = taxYear,
            AppealGround = ground,
            Status = status,
            FiledDate = filedDate ?? new DateTime(2026, 1, 10, 18, 30, 0, DateTimeKind.Utc),
            HearingDate = hearingDate is null
                ? null
                : hearingDate == default
                    ? new DateTime(2026, 2, 10, 18, 30, 0, DateTimeKind.Utc)
                    : hearingDate,
            DecisionDate = decisionDate,
        };
}
