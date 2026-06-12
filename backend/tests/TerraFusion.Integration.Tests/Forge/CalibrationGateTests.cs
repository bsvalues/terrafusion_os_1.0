using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — calibration/QC ratio-acceptance gate (pack success criterion 6). TF-owned IAAO-style
/// thresholds flag out-of-tolerance models on appraisal level (median), uniformity (COD) and
/// vertical equity (PRD). Deterministic; thresholds are county-settable.
/// </summary>
public class CalibrationGateTests
{
    private static readonly CalibrationThresholds Default = new();

    private static RatioStudyResult Study(decimal median, decimal cod, decimal prd, int count = 30)
        => new(true, count, median, cod, prd, "fixture");

    [Fact] // CG1
    public void in_tolerance_study_passes()
    {
        CalibrationGate.Evaluate(Study(1.00m, 10.0m, 1.00m), Default).Passed.Should().BeTrue();
    }

    [Fact] // CG2 — uniformity
    public void high_cod_is_flagged()
    {
        var status = CalibrationGate.Evaluate(Study(1.00m, 25.0m, 1.00m), Default);
        status.Passed.Should().BeFalse();
        status.Findings.Should().Contain(f => f.Contains("COD"));
    }

    [Fact] // CG3 — vertical equity / regressivity
    public void prd_out_of_band_is_flagged()
    {
        var status = CalibrationGate.Evaluate(Study(1.00m, 10.0m, 1.08m), Default);
        status.Passed.Should().BeFalse();
        status.Findings.Should().Contain(f => f.Contains("PRD"));
    }

    [Fact] // CG4 — appraisal level
    public void median_out_of_band_is_flagged()
    {
        var status = CalibrationGate.Evaluate(Study(0.80m, 10.0m, 1.00m), Default);
        status.Passed.Should().BeFalse();
        status.Findings.Should().Contain(f => f.Contains("median") || f.Contains("level"));
    }

    [Fact] // CG5 — sample size
    public void small_sample_is_flagged()
    {
        CalibrationGate.Evaluate(Study(1.00m, 10.0m, 1.00m, count: 3), Default).Passed.Should().BeFalse();
    }

    [Fact] // CG6 — no qualified sales
    public void no_study_is_flagged()
    {
        var status = CalibrationGate.Evaluate(new RatioStudyResult(false, 0, 0m, 0m, 0m, "none"), Default);
        status.Passed.Should().BeFalse();
        status.Findings.Should().NotBeEmpty();
    }

    [Fact] // deterministic
    public void evaluation_is_deterministic()
    {
        CalibrationGate.Evaluate(Study(1.00m, 25.0m, 1.08m), Default)
            .Should().BeEquivalentTo(CalibrationGate.Evaluate(Study(1.00m, 25.0m, 1.08m), Default));
    }
}
