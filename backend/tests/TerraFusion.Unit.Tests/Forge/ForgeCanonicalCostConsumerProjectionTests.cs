using FluentAssertions;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities.Forge;
using Xunit;
using ForgeCostFactor = TerraFusion.Core.Entities.Forge.CostFactor;

namespace TerraFusion.Unit.Tests.Forge;

[Trait("Category", "ForgeCanonicalCostConsumerProjection")]
public sealed class ForgeCanonicalCostConsumerProjectionTests
{
    private static readonly Guid CountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private const string ParcelId = "parcel-0001";

    [Fact]
    public void Create_ProducesNarrowExactKernelRequestAndDecimalProof()
    {
        var result = ForgeCanonicalCostConsumerProjection.Create(CreateInput());

        result.BaseRate.Should().Be(125.5m);
        result.DepreciationRate.Should().Be(0.1m);
        result.ReplacementCost.Should().Be(112950m);
        result.Depreciation.Should().Be(11295m);
        result.Rcnld.Should().Be(101655m);
        result.TotalValue.Should().Be(151655m);
        result.KernelRequest.Should().Be(new ForgeCanonicalValuationRequest(ParcelId, 112950d, 11295d, 101655d, 50000d));
        result.FactSnapshotSha256.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void Create_AllowsZeroDepreciationAndLand()
    {
        var input = CreateInput(depreciationRate: 0m, landValue: 0m);

        var result = ForgeCanonicalCostConsumerProjection.Create(input);

        result.Depreciation.Should().Be(0m);
        result.Rcnld.Should().Be(result.ReplacementCost);
        result.TotalValue.Should().Be(result.ReplacementCost);
    }

    [Fact]
    public void FactHash_IsStableAcrossScheduleOrderAndCallerOnlyIdentity()
    {
        var input = CreateInput();
        input.CostFactorSet.Factors.Add(NewCost(input.CostFactorSet.Id, "C1", 1m));
        input.DepreciationSchedule.Factors.Add(NewDepreciation(input.DepreciationSchedule.Id, 20, 30, 0.2m));
        input = input with { SchedulePin = Pin(input.CostFactorSet, input.DepreciationSchedule) };
        var first = ForgeCanonicalCostConsumerProjection.Create(input);

        input.CostFactorSet.Factors.Reverse();
        input.DepreciationSchedule.Factors.Reverse();
        input = input with
        {
            Authorization = input.Authorization with { SubjectId = "different-subject" },
            Identity = input.Identity with { CorrelationId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
        };

        ForgeCanonicalCostConsumerProjection.Create(input).FactSnapshotSha256.Should().Be(first.FactSnapshotSha256);
    }

    [Theory]
    [InlineData("unauthenticated")]
    [InlineData("permission")]
    [InlineData("auth-county")]
    [InlineData("cama-county")]
    [InlineData("land-county")]
    [InlineData("parcel")]
    [InlineData("year")]
    [InlineData("correlation")]
    [InlineData("size")]
    [InlineData("age")]
    [InlineData("land")]
    public void Create_FailsClosedOnInvalidAssertions(string invalid)
    {
        var input = CreateInput();
        input = invalid switch
        {
            "unauthenticated" => input with { Authorization = input.Authorization with { IsAuthenticated = false } },
            "permission" => input with { Authorization = input.Authorization with { Permission = "access:Forge" } },
            "auth-county" => input with { Authorization = input.Authorization with { CountyId = Guid.NewGuid() } },
            "cama-county" => input with { Cama = input.Cama with { CountyId = Guid.NewGuid() } },
            "land-county" => input with { Land = input.Land with { CountyId = Guid.NewGuid() } },
            "parcel" => input with { Land = input.Land with { ParcelId = "another" } },
            "year" => input with { Cama = input.Cama with { TaxYear = 2025 } },
            "correlation" => input with { Identity = input.Identity with { CorrelationId = "not-a-guid" } },
            "size" => input with { Cama = input.Cama with { SizeSqFt = 0 } },
            "age" => input with { Cama = input.Cama with { EffectiveAgeYears = -1 } },
            _ => input with { Land = input.Land with { LandValue = -1m } },
        };

        var act = () => ForgeCanonicalCostConsumerProjection.Create(input);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Create_RejectsArithmeticOverflow()
    {
        var input = CreateInput(baseRate: decimal.MaxValue);

        var act = () => ForgeCanonicalCostConsumerProjection.Create(input);

        act.Should().Throw<InvalidOperationException>().WithMessage("*overflowed*");
    }

    [Fact]
    public void Create_RejectsPrecisionLossAtKernelBoundary()
    {
        var input = CreateInput(landValue: 1234567890123456789012345678m);

        var act = () => ForgeCanonicalCostConsumerProjection.Create(input);

        act.Should().Throw<InvalidOperationException>().WithMessage("*loses precision*");
    }

    [Fact]
    public void FactHash_ChangesWhenSemanticFactChanges()
    {
        var first = ForgeCanonicalCostConsumerProjection.Create(CreateInput());
        var changed = CreateInput() with { Land = new ForgeCanonicalLandValueFact(CountyId, ParcelId, 2026, 50001m) };

        ForgeCanonicalCostConsumerProjection.Create(changed).FactSnapshotSha256.Should().NotBe(first.FactSnapshotSha256);
    }

    [Fact]
    public void ValidateResponse_AcceptsExactAndToleranceEdgeValues()
    {
        var projection = ForgeCanonicalCostConsumerProjection.Create(CreateInput());
        var response = new ForgeCanonicalValuationResponse(151655.000001d, 50000d, 101655.000001d);

        var validated = ForgeCanonicalCostConsumerProjection.ValidateResponse(projection, response);

        validated.TotalValue.Should().Be(151655.000001m);
        validated.BuildingValue.Should().Be(101655.000001m);
    }

    [Theory]
    [InlineData("nan")]
    [InlineData("infinity")]
    [InlineData("negative")]
    [InlineData("building")]
    [InlineData("land")]
    [InlineData("components")]
    public void ValidateResponse_FailsClosedOnInvalidKernelOutput(string invalid)
    {
        var projection = ForgeCanonicalCostConsumerProjection.Create(CreateInput());
        var response = invalid switch
        {
            "nan" => new ForgeCanonicalValuationResponse(double.NaN, 50000d, 101655d),
            "infinity" => new ForgeCanonicalValuationResponse(double.PositiveInfinity, 50000d, 101655d),
            "negative" => new ForgeCanonicalValuationResponse(-1d, 50000d, 101655d),
            "building" => new ForgeCanonicalValuationResponse(151656d, 50000d, 101656d),
            "land" => new ForgeCanonicalValuationResponse(151656d, 50001d, 101655d),
            _ => new ForgeCanonicalValuationResponse(151656d, 50000d, 101655d),
        };

        var act = () => ForgeCanonicalCostConsumerProjection.ValidateResponse(projection, response);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void BoundaryTypes_ExposeNoUnapprovedPolicyOrProtectedFields()
    {
        var names = typeof(ForgeCanonicalCostConsumerProjectionResult).GetProperties()
            .Select(property => property.Name)
            .Concat(typeof(ForgeCanonicalValuationRequest).GetProperties().Select(property => property.Name))
            .ToArray();

        names.Should().NotContain(name => new[]
        {
            "Owner", "Address", "Confidence", "Quality", "Condition", "Location", "Obsolescence",
            "Provider", "Model", "Prompt", "Token", "Credential", "AdjustmentFactors",
        }.Contains(name, StringComparer.OrdinalIgnoreCase));
    }

    private static ForgeCanonicalCostConsumerInput CreateInput(
        decimal baseRate = 125.5m,
        decimal depreciationRate = 0.1m,
        decimal landValue = 50000m)
    {
        var costSet = new CostFactorSet
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            CountyId = CountyId,
            EffectiveYear = 2026,
            Version = "cost-v1",
            Origin = ReferenceDataOrigin.TerraFusionOwned,
            ProvenanceAuthor = "tf",
        };
        costSet.Factors.Add(NewCost(costSet.Id, "R1", baseRate));

        var depreciation = new DepreciationSchedule
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            CountyId = CountyId,
            EffectiveYear = 2026,
            Version = "depreciation-v1",
            Origin = ReferenceDataOrigin.TerraFusionOwned,
            ProvenanceAuthor = "tf",
        };
        depreciation.Factors.Add(NewDepreciation(depreciation.Id, 0, 100, depreciationRate));

        return new ForgeCanonicalCostConsumerInput(
            new ForgeCanonicalRequestIdentity(CountyId, ParcelId, 2026, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            new ForgeCanonicalAuthorizationAssertion(true, "subject-1", CountyId, "access:forge"),
            new ForgeCanonicalCamaFact(CountyId, ParcelId, 2026, "R1", 900, 5),
            new ForgeCanonicalLandValueFact(CountyId, ParcelId, 2026, landValue),
            costSet,
            depreciation,
            Pin(costSet, depreciation));
    }

    private static ForgeCostFactor NewCost(Guid parentId, string classCode, decimal rate) => new()
    {
        Id = Guid.NewGuid(),
        CostFactorSetId = parentId,
        ImprovementClassCode = classCode,
        SizeBandMinSqFt = 0,
        SizeBandMaxSqFt = 1000,
        UnitCostPerSqFt = rate,
    };

    private static DepreciationFactor NewDepreciation(Guid parentId, int minimum, int maximum, decimal rate) => new()
    {
        Id = Guid.NewGuid(),
        DepreciationScheduleId = parentId,
        AgeMinYears = minimum,
        AgeMaxYears = maximum,
        DepreciationFraction = rate,
    };

    private static ForgeCostSchedulePin Pin(CostFactorSet costs, DepreciationSchedule depreciation) => new(
        costs.CountyId,
        costs.EffectiveYear,
        costs.Id,
        costs.Version,
        ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs),
        depreciation.Id,
        depreciation.Version,
        ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation));
}
