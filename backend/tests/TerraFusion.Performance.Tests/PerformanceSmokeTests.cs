using Xunit;
using NBomber.Contracts;
using NBomber.CSharp;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

namespace TerraFusion.Performance.Tests;

public class PerformanceSmokeTests
{
    [Fact]
    public void NBomber_SimpleLoadTest_Runs()
    {
        var step = Step.Create("hello_step", async context =>
        {
            await Task.Delay(10);
            return Response.Ok();
        });

        var scenario = ScenarioBuilder.CreateScenario("hello_scenario", step)
            .WithLoadSimulations(Simulation.KeepConstant(10, TimeSpan.FromSeconds(1)));

        var stats = NBomberRunner.RegisterScenarios(scenario).Run();
        Assert.True(stats.AllOk);
    }

    [Fact]
    public void BenchmarkDotNet_SimpleBenchmark_Runs()
    {
        var summary = BenchmarkRunner.Run<SimpleBenchmark>();
        Assert.NotNull(summary);
    }
}

public class SimpleBenchmark
{
    [Benchmark]
    public int AddNumbers() => 1 + 1;
}
