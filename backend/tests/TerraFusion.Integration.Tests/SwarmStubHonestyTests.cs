using System.Text.Json;
using Xunit;
using FluentAssertions;
using TerraFusion.AI.Services;
using TerraFusion.AI.DTOs;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// WO-AI-CONSOLIDATION-004b — status-surface truthfulness.
/// The compatibility swarm stub must never emit a fabricated agent count
/// (the historical "1008" claim) or fabricated swarm-activity scores.
/// </summary>
public class SwarmStubHonestyTests
{
    [Fact]
    public async System.Threading.Tasks.Task GetSwarmDataAsync_ReportsZeroAgents_AndUnavailable()
    {
        var service = new SwarmIntelligenceService();

        var data = await service.GetSwarmDataAsync();
        var json = JsonSerializer.Serialize(data);

        json.Should().NotContain("1008");
        json.Should().Contain("\"Agents\":0");
        json.Should().Contain("\"Available\":false");
        json.Should().Contain("unavailable");
    }

    [Fact]
    public async System.Threading.Tasks.Task OptimizeAsync_EmitsNoFabricatedSwarmActivity()
    {
        var service = new SwarmIntelligenceService();

        var result = await service.OptimizeAsync(new SwarmOptimizationRequest
        {
            Jurisdiction = "BENTON",
            OptimizationType = "revenue-forecasting",
            ForecastHorizon = 3
        });

        result.SwarmMetrics.ActiveAgents.Should().Be(0, "no governed swarm runtime exists");
        result.SwarmMetrics.CollectiveIntelligence.Should().Be(0.0);
        result.SwarmMetrics.EmergentBehaviorScore.Should().Be(0.0);
        result.SwarmMetrics.ConsensusLevel.Should().Be(0.0);
        result.SwarmMetrics.PatternsDiscovered.Should().Be(0);
        result.OptimizationScore.Should().Be(0.0);
        result.SwarmConsensus.Should().Be(0.0);
    }
}
