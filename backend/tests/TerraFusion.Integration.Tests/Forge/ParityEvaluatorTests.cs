using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using TerraFusion.Core.Entities.Forge;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 parity evaluator — turns the prepared run methodology into an executable that compares TF
/// shadow values to internal TruthPacs baselines and produces per-RP summaries. Gating is null
/// (ungated) until an Assessor tolerance AND pass rate exist — it cannot claim a G1 pass on unset
/// tolerances. RP-5 is exact-lineage, not tolerance. No invented tolerances; no real-data run here.
/// </summary>
public class ParityEvaluatorTests
{
    private static IEnumerable<ParityComparison> Cost(int within, int outside) =>
        Enumerable.Range(0, within).Select(_ => new ParityComparison("RP-1", "Residential", 100m, 100m))
        .Concat(Enumerable.Range(0, outside).Select(_ => new ParityComparison("RP-1", "Residential", 200m, 100m)));

    [Fact] // PE1 — gated pass
    public void gated_run_computes_pass_rate_and_gate()
    {
        var cfg = new ParityGateConfig
        {
            Tolerances = { [("RP-1", "Residential")] = 0.02m },
            AgreedRates = { ["RP-1"] = 0.90m },
        };
        var eval = ParityEvaluator.Evaluate(Cost(within: 5, outside: 0), cfg);
        var s = eval.Summaries.Single(x => x.Rp == "RP-1");
        s.PassRate.Should().Be(1.0m);
        s.GatePass.Should().Be(true);
    }

    [Fact] // PE2 — null tolerance keeps it ungated (cannot pass)
    public void unset_tolerance_is_ungated()
    {
        var eval = ParityEvaluator.Evaluate(Cost(5, 0), new ParityGateConfig()); // no tolerance
        eval.Rows.Should().OnlyContain(r => r.WithinTolerance == null);
        eval.Summaries.Single().GatePass.Should().BeNull("ungated: cannot claim a G1 pass without an approved tolerance");
    }

    [Fact] // PE3 — tolerance set but no agreed pass rate → still ungated
    public void tolerance_without_agreed_rate_is_ungated()
    {
        var cfg = new ParityGateConfig { Tolerances = { [("RP-1", "Residential")] = 0.02m } };
        ParityEvaluator.Evaluate(Cost(5, 0), cfg).Summaries.Single().GatePass.Should().BeNull();
    }

    [Fact] // PE4 — RP-5 exact lineage, not tolerance
    public void rp5_gates_on_exact_lineage()
    {
        var allExact = new[]
        {
            new ParityComparison("RP-5", "Residential", 100m, 100m, Rp5LineageExact: true),
            new ParityComparison("RP-5", "Residential", 50m, 50m, Rp5LineageExact: true),
        };
        ParityEvaluator.Evaluate(allExact, new ParityGateConfig()).Summaries.Single().GatePass.Should().Be(true);

        var oneBroken = allExact.Append(new ParityComparison("RP-5", "Residential", 1m, 2m, Rp5LineageExact: false));
        ParityEvaluator.Evaluate(oneBroken, new ParityGateConfig()).Summaries.Single().GatePass.Should().Be(false);

        var oneUnknown = allExact.Append(new ParityComparison("RP-5", "Residential", 1m, 1m, Rp5LineageExact: null));
        ParityEvaluator.Evaluate(oneUnknown, new ParityGateConfig()).Summaries.Single().GatePass.Should().BeNull();
    }

    [Fact] // PE5 — below agreed rate fails the gate
    public void below_agreed_rate_fails_gate()
    {
        var cfg = new ParityGateConfig
        {
            Tolerances = { [("RP-1", "Residential")] = 0.02m },
            AgreedRates = { ["RP-1"] = 0.90m },
        };
        var s = ParityEvaluator.Evaluate(Cost(within: 6, outside: 4), cfg).Summaries.Single(); // 60%
        s.PassRate.Should().Be(0.6m);
        s.GatePass.Should().Be(false);
    }

    [Fact] // PE6 — deterministic
    public void evaluation_is_deterministic()
    {
        var cfg = new ParityGateConfig { Tolerances = { [("RP-1", "Residential")] = 0.02m }, AgreedRates = { ["RP-1"] = 0.9m } };
        ParityEvaluator.Evaluate(Cost(3, 2), cfg).Should().BeEquivalentTo(ParityEvaluator.Evaluate(Cost(3, 2), cfg));
    }
}
