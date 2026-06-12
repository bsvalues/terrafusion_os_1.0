using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.Forge;
using TerraFusion.Core.Time;
using TerraFusion.Data;
using TerraFusion.Data.Interceptors;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 canonical-extension slice (Forge-lane, in-lane): ParcelValuationAssembler builds a
/// ParcelValuationInput from canonical entities (A1–A6), runs the deterministic engine in shadow,
/// and persists ParcelValuation. Neighborhood is an injected dependency (the Sync-lane addition of
/// TfParcel.Neighborhood is a separate handoff). No parity, no authoritative swap.
/// </summary>
public class ParcelValuationAssemblerTests
{
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CountyB = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ParcelId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private static CostFactorSet Costs(Guid county = default) => new()
    {
        CountyId = county == default ? CountyA : county,
        EffectiveYear = 2025, Version = "v1", Origin = ReferenceDataOrigin.TerraFusionOwned, ProvenanceAuthor = "TF",
        Factors = { new CostFactor { ImprovementClassCode = "R1", SizeBandMinSqFt = 1500, SizeBandMaxSqFt = 3000, UnitCostPerSqFt = 110m } },
    };

    private static DepreciationSchedule Depr() => new()
    {
        CountyId = CountyA, EffectiveYear = 2025, Version = "v1", Origin = ReferenceDataOrigin.TerraFusionOwned, ProvenanceAuthor = "TF",
        Factors = { new DepreciationFactor { AgeMinYears = 10, AgeMaxYears = 19, DepreciationFraction = 0.20m } },
    };

    private static LandScheduleSet Land() => new()
    {
        CountyId = CountyA, EffectiveYear = 2025, Version = "v1", Origin = ReferenceDataOrigin.TerraFusionOwned, ProvenanceAuthor = "TF",
        Rates = { new LandRate { Neighborhood = "N100", MarketUnitValue = 12m, CurrentUseUnitValue = 2m } },
    };

    private static (TfParcel parcel, List<TfImprovement> imps, Dictionary<Guid, IReadOnlyList<TfImprovementFeature>> feats, List<TfLand> lands)
        ResidentialParcel(int effYearBuilt = 2010)
    {
        var parcel = new TfParcel { TfParcelId = ParcelId, CountyId = CountyA, PropertyType = "Residential" };
        var imp = new TfImprovement { TfImprovementId = Guid.NewGuid(), CountyId = CountyA, TfParcelId = ParcelId, ImprvClassCd = "R1", EffectiveYearBuilt = (short)effYearBuilt };
        var feats = new Dictionary<Guid, IReadOnlyList<TfImprovementFeature>>
        {
            [imp.TfImprovementId] = new List<TfImprovementFeature>
            {
                new() { TfImprovementId = imp.TfImprovementId, Area = 1000m },
                new() { TfImprovementId = imp.TfImprovementId, Area = 1000m },
            },
        };
        var land = new TfLand { TfLandId = Guid.NewGuid(), CountyId = CountyA, TfParcelId = ParcelId, SizeSquareFeet = 5000m, IsHomesite = true };
        return (parcel, new List<TfImprovement> { imp }, feats, new List<TfLand> { land });
    }

    [Fact] // A1
    public void cost_size_aggregates_improvement_feature_area()
    {
        var (_, imps, feats, _) = ResidentialParcel();
        ParcelValuationAssembler.ImprovementSizeSqFt(imps[0].TfImprovementId, feats).Should().Be(2000m);
    }

    [Fact] // A2
    public void current_use_is_mapped_from_ag_value_and_homesite()
    {
        var ag = new TfLand { IsHomesite = false, LandSegAgValue = 5_000m };
        var homesite = new TfLand { IsHomesite = true, LandSegAgValue = 5_000m };
        var market = new TfLand { IsHomesite = false, LandSegAgValue = null };

        ParcelValuationAssembler.IsCurrentUse(ag).Should().BeTrue();
        ParcelValuationAssembler.IsCurrentUse(homesite).Should().BeFalse("a homesite is not in current-use/ag");
        ParcelValuationAssembler.IsCurrentUse(market).Should().BeFalse();
    }

    [Fact] // A3
    public void sales_qualification_maps_and_excludes_disqualified()
    {
        var sales = new List<TfSale>
        {
            new() { SlPrice = 100m, SlDt = new DateTime(2025, 1, 1), SaleQualified = true, DorRatioQualified = true },
            new() { SlPrice = 100m, SlDt = new DateTime(2025, 1, 1), SaleQualified = true, DorRatioQualified = true },
            new() { SlPrice = 100m, SlDt = new DateTime(2025, 1, 1), SaleQualified = false, DorRatioQualified = true },
        };
        var mapped = ParcelValuationAssembler.MapSales(sales, _ => 95m);
        mapped.Count(r => r.Qualified).Should().Be(2);
    }

    [Fact] // A4
    public void reference_sets_select_by_county_year_and_cross_county_is_rejected()
    {
        var sets = new[] { Costs(CountyA), Costs(CountyB) };
        ReferenceCatalog.Select(sets, CountyA, 2025)!.CountyId.Should().Be(CountyA);
        ReferenceCatalog.Select(sets, CountyA, 2099).Should().BeNull();

        var (parcel, imps, feats, lands) = ResidentialParcel();
        var assembled = new AssembledParcel(parcel, "N100", imps, feats, lands, Array.Empty<TfSale>());
        FluentActions.Invoking(() => ParcelValuationAssembler.Assemble(assembled, 2025, Costs(CountyB), Depr(), Land(), null))
            .Should().Throw<InvalidOperationException>("a county-B cost set cannot value a county-A parcel");
    }

    [Fact] // A5 — end to end in shadow
    public async System.Threading.Tasks.Task assembled_parcel_values_through_engine_and_persists()
    {
        var (parcel, imps, feats, lands) = ResidentialParcel(effYearBuilt: 2010); // age 15 @2025 → 0.20 dep
        var assembled = new AssembledParcel(parcel, "N100", imps, feats, lands, Array.Empty<TfSale>());

        var input = ParcelValuationAssembler.Assemble(assembled, 2025, Costs(), Depr(), Land(), null);
        var result = ValuationEngine.Value(input);

        // improvement: 110×2000=220000 RCN × (1−0.20)=176000; + land 12×5000=60000 = 236000 (Cost only for Residential)
        result.Found.Should().BeTrue();
        result.IndicatedValue.Should().Be(236_000m);

        await using var ctx = Ctx(nameof(assembled_parcel_values_through_engine_and_persists));
        ctx.ParcelValuations.Add(ParcelValuation.FromResult(result, "forge-native-v1"));
        await ctx.SaveChangesAsync();
        ctx.ParcelValuations.Single(v => v.TfParcelId == ParcelId && v.Year == 2025).IndicatedValue.Should().Be(236_000m);
    }

    [Fact] // A6
    public void missing_inputs_produce_an_explicit_unfound_result()
    {
        var (parcel, imps, feats, lands) = ResidentialParcel();
        var assembled = new AssembledParcel(parcel, Neighborhood: null, imps, feats, lands, Array.Empty<TfSale>());
        // no land schedule + class present but neighborhood null → land skipped; cost still computes...
        // use an unknown class so cost finds nothing AND no land → no approaches.
        assembled.Improvements[0].ImprvClassCd = "ZZZ";
        var input = ParcelValuationAssembler.Assemble(assembled, 2025, Costs(), Depr(), Land(), null);
        ValuationEngine.Value(input).Found.Should().BeFalse();
    }

    private static TerraFusionDbContext Ctx(string db)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(db)
            .AddInterceptors(new AuditableEntityInterceptor(
                new FixedClock(new DateTime(2026, 6, 6, 12, 0, 0, DateTimeKind.Utc)),
                new FakeUser { Current = new RequestUserContext(true, "assessor.jane", CountyA.ToString(), Array.Empty<string>()) }))
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = "InMemory" }).Build();
        return new TerraFusionDbContext(options, config);
    }

    private sealed class FixedClock : IClock
    {
        public FixedClock(DateTime utc) => UtcNow = utc;
        public DateTime UtcNow { get; }
    }

    private sealed class FakeUser : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; set; } = RequestUserContext.Anonymous;
    }
}
