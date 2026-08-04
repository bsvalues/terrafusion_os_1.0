using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Unit.Tests.Forge;

[Trait("Category", "ForgeCostScheduleProjection")]
public sealed class ForgeCostScheduleProjectionTests
{
    private static readonly Guid CountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid CostSetId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CostRowId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid DepreciationId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid DepreciationRowId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [Fact]
    public void CanonicalHashes_MatchKnownAnswerVectors()
    {
        var (costs, depreciation) = CreateKnownAnswerSchedules();

        ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs)
            .Should().Be("a5eab9a2f0740cc1c16ba835654b41d97fa964e4aff5449de503b5cf479ca9f2");
        ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation)
            .Should().Be("2902186c7f8bf833d4153de57f1ead1d2a16c39c1cc8da78689cb0cfa75197a4");
    }

    [Fact]
    public void CanonicalHashes_AreOrderIndependentAndDecimalScaleIndependent()
    {
        var (costs, depreciation) = CreateSchedules();
        costs.Factors.Add(NewCost("R1", 1_001, 2_000, 155.00m));
        depreciation.Factors.Add(NewDepreciation(11, 20, 0.20m));

        var costHash = ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs);
        var depreciationHash = ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation);

        costs.Factors.Reverse();
        depreciation.Factors.Reverse();
        costs.Factors[0].UnitCostPerSqFt = 155m;
        depreciation.Factors[0].DepreciationFraction = 0.2m;

        ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs).Should().Be(costHash);
        ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation)
            .Should().Be(depreciationHash);
    }

    [Fact]
    public void CanonicalHashes_ChangeWhenSemanticContentChanges()
    {
        var (costs, depreciation) = CreateSchedules();
        var costHash = ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs);
        var depreciationHash = ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation);

        costs.Factors[0].UnitCostPerSqFt += 0.01m;
        depreciation.Factors[0].DepreciationFraction += 0.01m;

        ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs).Should().NotBe(costHash);
        ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation)
            .Should().NotBe(depreciationHash);
    }

    [Fact]
    public void CanonicalHashes_EncodeTinyDecimalsAsFixedPointWithoutExponentNotation()
    {
        var (costs, depreciation) = CreateKnownAnswerSchedules();
        costs.Factors[0].UnitCostPerSqFt = 0.0000000000000000000000000001m;
        depreciation.Factors[0].DepreciationFraction = 0.0000000000000000000000000001m;
        const string costJson = "{\"schema\":\"forge-cost-factor-set/v1\",\"id\":\"11111111-1111-1111-1111-111111111111\",\"countyId\":\"22222222-2222-2222-2222-222222222222\",\"effectiveYear\":2026,\"version\":\"v1\",\"origin\":\"TerraFusionOwned\",\"author\":\"tf\",\"revalCycle\":null,\"factors\":[{\"id\":\"33333333-3333-3333-3333-333333333333\",\"class\":\"R1\",\"minSqFt\":null,\"maxSqFt\":null,\"unitCost\":\"0.0000000000000000000000000001\"}]}";
        const string depreciationJson = "{\"schema\":\"forge-depreciation-schedule/v1\",\"id\":\"44444444-4444-4444-4444-444444444444\",\"countyId\":\"22222222-2222-2222-2222-222222222222\",\"effectiveYear\":2026,\"version\":\"v1\",\"origin\":\"TerraFusionOwned\",\"author\":\"tf\",\"revalCycle\":null,\"factors\":[{\"id\":\"55555555-5555-5555-5555-555555555555\",\"minAge\":0,\"maxAge\":10,\"fraction\":\"0.0000000000000000000000000001\"}]}";

        ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs)
            .Should().Be(Sha256(costJson));
        ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation)
            .Should().Be(Sha256(depreciationJson));
    }

    [Fact]
    public void Create_ReturnsOnlyDecimalBaseAndDepreciationRatesFromExactPins()
    {
        var (costs, depreciation) = CreateSchedules();
        var pin = Pin(costs, depreciation);

        var result = ForgeCostScheduleProjection.Create(costs, depreciation, pin, "r1", 900, 5);

        result.BaseRate.Should().Be(125.5m);
        result.DepreciationRate.Should().Be(0.1m);
        typeof(ForgeCostScheduleProjectionResult).GetProperties().Select(p => p.Name)
            .Should().Equal(nameof(result.BaseRate), nameof(result.DepreciationRate));
    }

    [Theory]
    [InlineData("county")]
    [InlineData("year")]
    [InlineData("cost-id")]
    [InlineData("depreciation-id")]
    [InlineData("cost-version")]
    [InlineData("depreciation-version")]
    [InlineData("cost-hash")]
    [InlineData("depreciation-hash")]
    public void Create_FailsClosedOnEveryPinMismatch(string mismatch)
    {
        var (costs, depreciation) = CreateSchedules();
        var pin = Pin(costs, depreciation);
        pin = mismatch switch
        {
            "county" => pin with { CountyId = Guid.NewGuid() },
            "year" => pin with { EffectiveYear = 2027 },
            "cost-id" => pin with { CostFactorSetId = Guid.NewGuid() },
            "depreciation-id" => pin with { DepreciationScheduleId = Guid.NewGuid() },
            "cost-version" => pin with { CostFactorSetVersion = "2" },
            "depreciation-version" => pin with { DepreciationScheduleVersion = "2" },
            "cost-hash" => pin with { CostFactorSetContentSha256 = new string('0', 64) },
            _ => pin with { DepreciationScheduleContentSha256 = new string('0', 64) },
        };

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Create_RejectsIdentityPinBeforeReadingMalformedRows()
    {
        var (costs, depreciation) = CreateSchedules();
        var pin = Pin(costs, depreciation) with { CountyId = Guid.NewGuid() };
        costs.Factors[0].SizeBandMinSqFt = 2_000;
        costs.Factors[0].SizeBandMaxSqFt = 1_000;

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Schedule county identity does not match the pin.");
    }

    [Fact]
    public void Create_TreatsVersionsAsOpaqueExactValuesRatherThanLexicalLatest()
    {
        var (costs, depreciation) = CreateSchedules();
        costs.Version = "10";
        depreciation.Version = "10";
        var pin = Pin(costs, depreciation) with
        {
            CostFactorSetVersion = "2",
            DepreciationScheduleVersion = "2",
        };

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*opaque exact pin*");
    }

    [Theory]
    [InlineData("missing-version")]
    [InlineData("missing-author")]
    [InlineData("trimmed-version")]
    [InlineData("trimmed-author")]
    [InlineData("trimmed-cycle")]
    [InlineData("non-nfc-author")]
    public void CanonicalHash_RejectsIncompleteOrNonCanonicalProvenance(string invalid)
    {
        var (costs, _) = CreateSchedules();
        switch (invalid)
        {
            case "missing-version": costs.Version = string.Empty; break;
            case "missing-author": costs.ProvenanceAuthor = " "; break;
            case "trimmed-version": costs.Version = " v1"; break;
            case "trimmed-author": costs.ProvenanceAuthor = "tf "; break;
            case "trimmed-cycle": costs.RevalCycle = " 2026"; break;
            default: costs.ProvenanceAuthor = "e\u0301"; break;
        }

        var act = () => ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Create_RejectsDuplicateScheduleIdentity()
    {
        var (costs, depreciation) = CreateSchedules();
        depreciation.Id = costs.Id;
        depreciation.Factors[0].DepreciationScheduleId = depreciation.Id;
        var pin = Pin(costs, depreciation);

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*identities must differ*");
    }

    [Fact]
    public void Create_RejectsNonCanonicalHashText()
    {
        var (costs, depreciation) = CreateSchedules();
        var pin = Pin(costs, depreciation) with
        {
            CostFactorSetContentSha256 = new string('A', 64),
        };

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*lowercase SHA-256 hex*");
    }

    [Fact]
    public void Create_UsesUniqueNarrowestCostAndDepreciationBands()
    {
        var (costs, depreciation) = CreateSchedules();
        costs.Factors.Add(NewCost("R1", null, null, 90m));
        costs.Factors.Add(NewCost("R1", 700, 1_000, 140m));
        depreciation.Factors.Add(NewDepreciation(0, 100, 0.4m));
        depreciation.Factors.Add(NewDepreciation(3, 7, 0.15m));
        var pin = Pin(costs, depreciation);

        var result = ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        result.Should().Be(new ForgeCostScheduleProjectionResult(140m, 0.15m));
    }

    [Theory]
    [InlineData(null, 1000, 500)]
    [InlineData(1001, null, 1500)]
    public void Create_AllowsUniqueOneSidedCostBands(int? minimum, int? maximum, int size)
    {
        var (costs, depreciation) = CreateSchedules();
        costs.Factors.Clear();
        costs.Factors.Add(NewCost("R1", minimum, maximum, 175m));
        var pin = Pin(costs, depreciation);

        ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", size, 5)
            .BaseRate.Should().Be(175m);
    }

    [Fact]
    public void Create_DoesNotTrimOrNormalizeClassCodesForMatching()
    {
        var (costs, depreciation) = CreateSchedules();
        var pin = Pin(costs, depreciation);

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, " R1", 900, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*No cost factor*");
    }

    [Fact]
    public void Create_RejectsEqualSpecificityCostAmbiguity()
    {
        var (costs, depreciation) = CreateSchedules();
        costs.Factors.Add(NewCost("R1", 500, 1_500, 200m));
        costs.Factors[0].SizeBandMinSqFt = 500;
        costs.Factors[0].SizeBandMaxSqFt = 1_500;
        var pin = Pin(costs, depreciation);

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*equal-specificity ambiguous*");
    }

    [Fact]
    public void Create_RejectsUnboundedCostAmbiguity()
    {
        var (costs, depreciation) = CreateSchedules();
        costs.Factors.Clear();
        costs.Factors.Add(NewCost("R1", null, 1_000, 100m));
        costs.Factors.Add(NewCost("R1", 500, null, 200m));
        var pin = Pin(costs, depreciation);

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 750, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*equal-specificity ambiguous*");
    }

    [Fact]
    public void Create_RejectsEqualSpecificityDepreciationAmbiguity()
    {
        var (costs, depreciation) = CreateSchedules();
        depreciation.Factors.Add(NewDepreciation(0, 10, 0.2m));
        var pin = Pin(costs, depreciation);

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*equal-specificity ambiguous*");
    }

    [Theory]
    [InlineData("cost")]
    [InlineData("depreciation")]
    public void Create_RejectsMissingBands(string missing)
    {
        var (costs, depreciation) = CreateSchedules();
        if (missing == "cost") costs.Factors[0].ImprovementClassCode = "C1";
        else
        {
            depreciation.Factors[0].AgeMinYears = 20;
            depreciation.Factors[0].AgeMaxYears = 30;
        }
        var pin = Pin(costs, depreciation);

        var act = () => ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        act.Should().Throw<InvalidOperationException>().WithMessage("*No * factor*");
    }

    [Theory]
    [InlineData("cost-bounds")]
    [InlineData("cost-value")]
    [InlineData("depreciation-bounds")]
    [InlineData("depreciation-value")]
    [InlineData("row-parent")]
    [InlineData("duplicate-row")]
    [InlineData("unknown-origin")]
    public void Create_RejectsInvalidScheduleStructure(string invalid)
    {
        var (costs, depreciation) = CreateSchedules();
        switch (invalid)
        {
            case "cost-bounds":
                costs.Factors[0].SizeBandMinSqFt = 2_000;
                costs.Factors[0].SizeBandMaxSqFt = 1_000;
                break;
            case "cost-value": costs.Factors[0].UnitCostPerSqFt = 0m; break;
            case "depreciation-bounds": depreciation.Factors[0].AgeMinYears = 11; break;
            case "depreciation-value": depreciation.Factors[0].DepreciationFraction = 1.01m; break;
            case "row-parent": costs.Factors[0].CostFactorSetId = Guid.NewGuid(); break;
            case "duplicate-row": costs.Factors.Add(WithId(NewCost("C1", 0, 10, 1m), costs.Factors[0].Id)); break;
            default: costs.Origin = (ReferenceDataOrigin)999; break;
        }

        var act = () => Pin(costs, depreciation);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Create_IsDeterministicAcrossShuffledInputs()
    {
        var (costs, depreciation) = CreateSchedules();
        costs.Factors.Add(NewCost("C1", null, null, 80m));
        depreciation.Factors.Add(NewDepreciation(11, 20, 0.2m));
        var pin = Pin(costs, depreciation);
        var first = ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        costs.Factors.Reverse();
        depreciation.Factors.Reverse();
        var second = ForgeCostScheduleProjection.Create(costs, depreciation, pin, "R1", 900, 5);

        second.Should().Be(first);
    }

    private static (CostFactorSet Costs, DepreciationSchedule Depreciation) CreateKnownAnswerSchedules()
    {
        var costs = NewCostSet("v1", CostSetId);
        costs.Factors.Add(new CostFactor
        {
            Id = CostRowId,
            CostFactorSetId = costs.Id,
            ImprovementClassCode = "R1",
            UnitCostPerSqFt = 125.5m,
        });
        var depreciation = NewDepreciationSchedule("v1", DepreciationId);
        depreciation.Factors.Add(new DepreciationFactor
        {
            Id = DepreciationRowId,
            DepreciationScheduleId = depreciation.Id,
            AgeMinYears = 0,
            AgeMaxYears = 10,
            DepreciationFraction = 0.1m,
        });
        return (costs, depreciation);
    }

    private static (CostFactorSet Costs, DepreciationSchedule Depreciation) CreateSchedules()
    {
        var costs = NewCostSet("v1", CostSetId);
        costs.Factors.Add(NewCost("R1", 0, 1_000, 125.5m));
        var depreciation = NewDepreciationSchedule("v1", DepreciationId);
        depreciation.Factors.Add(NewDepreciation(0, 10, 0.1m));
        return (costs, depreciation);
    }

    private static CostFactorSet NewCostSet(string version, Guid id) => new()
    {
        Id = id,
        CountyId = CountyId,
        EffectiveYear = 2026,
        Version = version,
        Origin = ReferenceDataOrigin.TerraFusionOwned,
        ProvenanceAuthor = "tf",
    };

    private static DepreciationSchedule NewDepreciationSchedule(string version, Guid id) => new()
    {
        Id = id,
        CountyId = CountyId,
        EffectiveYear = 2026,
        Version = version,
        Origin = ReferenceDataOrigin.TerraFusionOwned,
        ProvenanceAuthor = "tf",
    };

    private static CostFactor NewCost(string classCode, int? minimum, int? maximum, decimal rate) => new()
    {
        Id = Guid.NewGuid(),
        CostFactorSetId = CostSetId,
        ImprovementClassCode = classCode,
        SizeBandMinSqFt = minimum,
        SizeBandMaxSqFt = maximum,
        UnitCostPerSqFt = rate,
    };

    private static DepreciationFactor NewDepreciation(int minimum, int maximum, decimal rate) => new()
    {
        Id = Guid.NewGuid(),
        DepreciationScheduleId = DepreciationId,
        AgeMinYears = minimum,
        AgeMaxYears = maximum,
        DepreciationFraction = rate,
    };

    private static CostFactor WithId(CostFactor factor, Guid id)
    {
        factor.Id = id;
        return factor;
    }

    private static ForgeCostSchedulePin Pin(CostFactorSet costs, DepreciationSchedule depreciation)
        => new(
            costs.CountyId,
            costs.EffectiveYear,
            costs.Id,
            costs.Version,
            ForgeCostScheduleProjection.ComputeCostFactorSetContentSha256(costs),
            depreciation.Id,
            depreciation.Version,
            ForgeCostScheduleProjection.ComputeDepreciationScheduleContentSha256(depreciation));

    private static string Sha256(string value)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
