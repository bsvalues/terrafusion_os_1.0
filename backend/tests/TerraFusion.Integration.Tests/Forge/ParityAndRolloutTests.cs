using System;
using System.Linq;
using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — parity is a GATE, not a source (pack V13/V14); the shadow-first rollout flag; and the
/// engine-integrity governance checks EI-1 (determinism) and EI-2 (no vendor doctrine).
/// </summary>
public class ParityAndRolloutTests
{
    private static readonly Guid Parcel = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static ParcelValuationInput Residential() => new(
        Parcel, 2025, CountyA, "Residential",
        new[] { new ApproachValue("Cost", 200_000m), new ApproachValue("Sales", 220_000m) });

    [Fact] // V13
    public void parity_reports_delta_and_tolerance_without_adopting_the_comparison_value()
    {
        var report = ParityComparer.Compare(tfValue: 210_000m, comparisonValue: 212_000m, new ParityTolerance(0.02m));
        report.WithinTolerance.Should().BeTrue("|−2000|/212000 ≈ 0.94% ≤ 2%");
        report.Delta.Should().Be(-2_000m);
        report.TfValue.Should().Be(210_000m, "the TF value is reported, never replaced by the comparison value");

        var outside = ParityComparer.Compare(210_000m, 260_000m, new ParityTolerance(0.02m));
        outside.WithinTolerance.Should().BeFalse();
    }

    [Fact] // V14
    public void parity_comparison_does_not_mutate_the_tf_value()
    {
        var result = ValuationEngine.Value(Residential());
        var before = result.IndicatedValue;

        var report = ParityComparer.Compare(result, comparisonValue: 999_999m, new ParityTolerance(0.01m));

        result.IndicatedValue.Should().Be(before, "comparison is read-only/informational");
        report.TfValue.Should().Be(before);
    }

    [Fact] // rollout flag — shadow-first
    public void engine_mode_defaults_to_shadow_and_is_selectable()
    {
        ForgeEngineOptions.FromConfiguration(null).Mode.Should().Be(ForgeEngineMode.Shadow);
        ForgeEngineOptions.FromConfiguration("Native").Mode.Should().Be(ForgeEngineMode.Native);
        ForgeEngineOptions.FromConfiguration("legacy").Mode.Should().Be(ForgeEngineMode.AiNarrativeLegacy);
    }

    [Fact] // EI-1
    public void engine_is_repeatable_across_many_runs()
    {
        var values = Enumerable.Range(0, 50).Select(_ => ValuationEngine.Value(Residential()).IndicatedValue).Distinct().ToList();
        values.Should().ContainSingle().Which.Should().Be(210_000m);
    }

    [Fact] // EI-2
    public void no_vendor_doctrine_is_representable_or_embedded()
    {
        var names = Enum.GetNames(typeof(ReferenceDataOrigin));
        names.Should().OnlyContain(n =>
            !n.ToLowerInvariant().Contains("vendor") &&
            !n.ToLowerInvariant().Contains("thirdparty") &&
            !n.ToLowerInvariant().Contains("marshall") &&
            !n.ToLowerInvariant().Contains("swift"));

        new CostFactorSet().IsVendorDependent.Should().BeFalse();
        new LandScheduleSet().IsVendorDependent.Should().BeFalse();
        new DepreciationSchedule().IsVendorDependent.Should().BeFalse();
        new CapRateSet().IsVendorDependent.Should().BeFalse();
    }
}
