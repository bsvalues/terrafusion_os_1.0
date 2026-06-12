using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — reconciliation + the deterministic valuation engine (pack V1/V2/V7/V8/V12). A TF-owned
/// rule weights approaches by property type; the engine produces an explainable ValuationResult and
/// the authoritative value never depends on any AI path.
/// </summary>
public class ValuationEngineTests
{
    private static readonly Guid Parcel = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static ParcelValuationInput Residential() => new(
        Parcel, 2025, CountyA, "Residential",
        new[] { new ApproachValue("Cost", 200_000m), new ApproachValue("Sales", 220_000m) });

    [Fact] // V7
    public void reconciliation_weights_approaches_by_property_type()
    {
        var result = ValuationEngine.Value(Residential());
        result.Found.Should().BeTrue();
        result.IndicatedValue.Should().Be(210_000m, "Residential = 0.5 Cost + 0.5 Sales");
        result.Breakdown.Should().Contain(b => b.Approach == "Cost" && b.Weight == 0.5m);
        result.Breakdown.Should().Contain(b => b.Approach == "Sales" && b.Weight == 0.5m);
    }

    [Fact] // V7b — single available approach takes full weight
    public void single_available_approach_is_fully_weighted()
    {
        var input = new ParcelValuationInput(Parcel, 2025, CountyA, "IncomeProperty",
            new[] { new ApproachValue("Income", 1_000_000m) });
        ValuationEngine.Value(input).IndicatedValue.Should().Be(1_000_000m);
    }

    [Fact] // V1
    public void engine_is_deterministic()
    {
        var a = ValuationEngine.Value(Residential());
        var b = ValuationEngine.Value(Residential());
        a.IndicatedValue.Should().Be(b.IndicatedValue);
        a.Explanation.Should().Be(b.Explanation);
        a.Breakdown.Should().BeEquivalentTo(b.Breakdown);
    }

    [Fact] // V2
    public void authoritative_value_never_depends_on_ai()
    {
        var advisory = new ThrowingAdvisory();
        var result = ValuationEngine.Value(Residential(), advisory);
        result.Found.Should().BeTrue();
        result.IndicatedValue.Should().Be(210_000m);
        advisory.Invoked.Should().BeFalse("AI advisory must never be consulted for the authoritative value");
    }

    [Fact] // V8
    public void result_carries_a_complete_explanation()
    {
        var result = ValuationEngine.Value(Residential());
        result.Explanation.Should().NotBeNullOrWhiteSpace();
        result.Breakdown.Should().HaveCount(2);
        result.Breakdown.Sum(b => b.Contribution).Should().Be(result.IndicatedValue);
    }

    [Fact] // V12
    public void result_is_workbench_consumable_json()
    {
        var json = JsonSerializer.Serialize(ValuationEngine.Value(Residential()));
        json.Should().Contain("\"IndicatedValue\":210000");
        json.Should().Contain("Breakdown");
        json.Should().Contain(Parcel.ToString());
    }

    [Fact] // no approaches => explicit
    public void no_approaches_is_explicit()
    {
        var input = new ParcelValuationInput(Parcel, 2025, CountyA, "Residential", Array.Empty<ApproachValue>());
        ValuationEngine.Value(input).Found.Should().BeFalse();
    }

    private sealed class ThrowingAdvisory : IValuationAdvisory
    {
        public bool Invoked { get; private set; }
        public IReadOnlyList<decimal> SuggestComparables(ParcelValuationInput input)
        {
            Invoked = true;
            throw new InvalidOperationException("advisory must not be in the value path");
        }
    }
}
