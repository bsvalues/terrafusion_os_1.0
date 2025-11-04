using NBomber.CSharp;
using NBomber.Http.CSharp;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using TerraFusion.Core.Models;

namespace TerraFusion.Performance.Tests.LoadTests;

/// <summary>
/// 🚀 Concurrent Valuation Load Testing - Championship Performance Validation
/// 
/// Tests system performance under concurrent load to validate championship targets:
/// - 100 Concurrent Valuations: <2s P95 latency, <5% error rate
/// - 500 Concurrent Valuations: <3s P95 latency, <10% error rate
/// - 1,000 Concurrent Valuations: <5s P95 latency, <10% error rate
/// - 5,000 Concurrent Valuations: <10s P95 latency, graceful degradation
/// 
/// Load Profile: Ramp up over 30 seconds, sustain for 5 minutes, ramp down over 30 seconds
/// Success Criteria: >90% successful requests, P95 latency within targets, no crashes
/// </summary>
public class ConcurrentValuationLoadTests
{
    private const string BaseUrl = "https://localhost:5001";
    private const string ValuationEndpoint = "/api/propertyvaluation/enhance";
    private readonly HttpClient _httpClient;

    public ConcurrentValuationLoadTests()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(BaseUrl),
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    [Fact(Skip = "Load test - run manually with 'dotnet test --filter LoadTest100Concurrent'")]
    [Trait("Category", "LoadTest")]
    [Trait("Concurrency", "100")]
    public async Task LoadTest_100ConcurrentValuations_MeetsChampionshipTargets()
    {
        // 🏆 Championship Target: <2s P95 latency with 100 concurrent requests
        var scenario = CreateValuationLoadScenario(
            concurrentUsers: 100,
            rampUpSeconds: 30,
            sustainSeconds: 300,
            rampDownSeconds: 30
        );

        var stats = NBomberRunner
            .RegisterScenarios(scenario)
            .Run();

        // Validate championship performance targets
        var valuationStep = stats.ScenarioStats[0].StepStats[0];

        valuationStep.Ok.Request.RPS.Should().BeGreaterThan(45,
            "System should handle >45 requests/second with 100 concurrent users");

        valuationStep.Ok.Latency.Percent95.Should().BeLessThan(2000,
            "P95 latency should be <2s for 100 concurrent valuations (championship target)");

        valuationStep.Fail.Request.Count.Should().BeLessThan(valuationStep.Ok.Request.Count * 0.05,
            "Error rate should be <5% for 100 concurrent valuations");
    }

    [Fact(Skip = "Load test - run manually with 'dotnet test --filter LoadTest500Concurrent'")]
    [Trait("Category", "LoadTest")]
    [Trait("Concurrency", "500")]
    public async Task LoadTest_500ConcurrentValuations_MeetsPerformanceTargets()
    {
        // 🎯 Target: <3s P95 latency with 500 concurrent requests
        var scenario = CreateValuationLoadScenario(
            concurrentUsers: 500,
            rampUpSeconds: 60,
            sustainSeconds: 300,
            rampDownSeconds: 60
        );

        var stats = NBomberRunner
            .RegisterScenarios(scenario)
            .Run();

        var valuationStep = stats.ScenarioStats[0].StepStats[0];

        valuationStep.Ok.Request.RPS.Should().BeGreaterThan(150,
            "System should handle >150 requests/second with 500 concurrent users");

        valuationStep.Ok.Latency.Percent95.Should().BeLessThan(3000,
            "P95 latency should be <3s for 500 concurrent valuations");

        valuationStep.Fail.Request.Count.Should().BeLessThan(valuationStep.Ok.Request.Count * 0.10,
            "Error rate should be <10% for 500 concurrent valuations");
    }

    [Fact(Skip = "Load test - run manually with 'dotnet test --filter LoadTest1000Concurrent'")]
    [Trait("Category", "LoadTest")]
    [Trait("Concurrency", "1000")]
    public async Task LoadTest_1000ConcurrentValuations_ValidatesScalability()
    {
        // 🎯 Target: <5s P95 latency with 1,000 concurrent requests
        var scenario = CreateValuationLoadScenario(
            concurrentUsers: 1000,
            rampUpSeconds: 120,
            sustainSeconds: 300,
            rampDownSeconds: 120
        );

        var stats = NBomberRunner
            .RegisterScenarios(scenario)
            .Run();

        var valuationStep = stats.ScenarioStats[0].StepStats[0];

        valuationStep.Ok.Request.RPS.Should().BeGreaterThan(200,
            "System should handle >200 requests/second with 1,000 concurrent users");

        valuationStep.Ok.Latency.Percent95.Should().BeLessThan(5000,
            "P95 latency should be <5s for 1,000 concurrent valuations");

        valuationStep.Fail.Request.Count.Should().BeLessThan(valuationStep.Ok.Request.Count * 0.10,
            "Error rate should be <10% for 1,000 concurrent valuations");
    }

    [Fact(Skip = "Stress test - run manually with 'dotnet test --filter StressTest5000Concurrent'")]
    [Trait("Category", "StressTest")]
    [Trait("Concurrency", "5000")]
    public async Task StressTest_5000ConcurrentValuations_ValidatesGracefulDegradation()
    {
        // 🎯 Target: <10s P95 latency with 5,000 concurrent requests (graceful degradation)
        var scenario = CreateValuationLoadScenario(
            concurrentUsers: 5000,
            rampUpSeconds: 180,
            sustainSeconds: 300,
            rampDownSeconds: 180
        );

        var stats = NBomberRunner
            .RegisterScenarios(scenario)
            .Run();

        var valuationStep = stats.ScenarioStats[0].StepStats[0];

        // Under extreme stress, validate graceful degradation rather than failure
        valuationStep.Ok.Request.RPS.Should().BeGreaterThan(400,
            "System should handle >400 requests/second even under extreme stress");

        valuationStep.Ok.Latency.Percent95.Should().BeLessThan(10000,
            "P95 latency should be <10s even under extreme stress (graceful degradation)");

        // Allow higher error rate under stress, but no complete failures
        valuationStep.Ok.Request.Count.Should().BeGreaterThan(0,
            "System should continue processing requests under stress (no complete failure)");
    }

    [Fact(Skip = "Sustained load test - run manually")]
    [Trait("Category", "SustainedLoad")]
    [Trait("Duration", "1Hour")]
    public async Task SustainedLoadTest_100RequestsPerSecond_1Hour_ValidatesStability()
    {
        // 🎯 Target: Maintain 100 RPS for 1 hour with <2s P95 latency
        var scenario = CreateValuationLoadScenario(
            concurrentUsers: 200,
            rampUpSeconds: 60,
            sustainSeconds: 3600, // 1 hour
            rampDownSeconds: 60
        );

        var stats = NBomberRunner
            .RegisterScenarios(scenario)
            .Run();

        var valuationStep = stats.ScenarioStats[0].StepStats[0];

        valuationStep.Ok.Request.RPS.Should().BeGreaterThan(95,
            "System should maintain >95 requests/second for 1 hour");

        valuationStep.Ok.Latency.Percent95.Should().BeLessThan(2500,
            "P95 latency should remain <2.5s after 1 hour of sustained load");

        // Validate no significant memory leaks (error rate should remain consistent)
        valuationStep.Fail.Request.Count.Should().BeLessThan(valuationStep.Ok.Request.Count * 0.05,
            "Error rate should remain <5% after 1 hour of sustained load (no memory leaks)");
    }

    private ScenarioProps CreateValuationLoadScenario(
        int concurrentUsers,
        int rampUpSeconds,
        int sustainSeconds,
        int rampDownSeconds)
    {
        var valuationStep = Step.Create("property_valuation", async context =>
        {
            var request = new PropertyValuationRequest
            {
                ParcelNumber = $"12-{Random.Shared.Next(100, 999)}-{Random.Shared.Next(100, 999)}-{Random.Shared.Next(10, 99)}",
                County = GetRandomCounty(),
                ValuationPurpose = "AnnualAssessment",
                TaxYear = 2024,
                RequestedBy = $"loadtest{context.InvocationNumber}@test.gov"
            };

            var httpRequest = Http.CreateRequest("POST", ValuationEndpoint)
                .WithJsonBody(request)
                .WithHeader("Content-Type", "application/json")
                .WithHeader("Authorization", "Bearer test-token"); // Mock auth for load testing

            var response = await Http.Send(_httpClient, httpRequest);

            return response;
        });

        var scenario = ScenarioBuilder
            .CreateScenario("concurrent_property_valuations", valuationStep)
            .WithLoadSimulations(
                Simulation.RampingInject(
                    rate: concurrentUsers,
                    interval: TimeSpan.FromSeconds(1),
                    during: TimeSpan.FromSeconds(rampUpSeconds)
                ),
                Simulation.Inject(
                    rate: concurrentUsers,
                    interval: TimeSpan.FromSeconds(1),
                    during: TimeSpan.FromSeconds(sustainSeconds)
                ),
                Simulation.RampingInject(
                    rate: 0,
                    interval: TimeSpan.FromSeconds(1),
                    during: TimeSpan.FromSeconds(rampDownSeconds)
                )
            );

        return scenario;
    }

    private string GetRandomCounty()
    {
        var counties = new[] { "King", "Pierce", "Spokane", "Benton", "Clark", "Thurston", "Snohomish", "Yakima" };
        return counties[Random.Shared.Next(counties.Length)];
    }
}
