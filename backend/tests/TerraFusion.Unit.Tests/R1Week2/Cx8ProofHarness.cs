using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week2;

/// <summary>
/// CX-8 Proof Artifact — Outputs actual values for two Benton parcels.
/// This test exists solely to produce human-readable proof that CostForge
/// returns parcel-variable data from real DB records.
/// Run: dotnet test --filter "FullyQualifiedName~Cx8ProofHarness" -v n
/// </summary>
[Trait("Category", "R1Week2")]
[Trait("Category", "CX8")]
[Trait("Category", "Proof")]
public sealed class Cx8ProofHarness
    : IClassFixture<Cx8CostForgeRealFactory>, IAsyncLifetime
{
    private readonly Cx8CostForgeRealFactory _factory;
    private readonly ITestOutputHelper _output;

    public Cx8ProofHarness(Cx8CostForgeRealFactory factory, ITestOutputHelper output)
    {
        _factory = factory;
        _output = output;
    }

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Proof_TwoParcels_DifferentOutputs()
    {
        using var client = CreateBentonClient();

        // ── Property A ──
        var resultA = await Calculate(client, Cx8CostForgeRealFactory.PropertyAId);
        var totalA = resultA.GetProperty("totalCost").GetDecimal();
        var landA = resultA.GetProperty("landValue").GetDecimal();
        var improvA = resultA.GetProperty("improvementValue").GetDecimal();
        var confA = resultA.GetProperty("confidenceScore").GetDouble();
        var pidA = resultA.GetProperty("propertyId").GetString();

        // ── Property B ──
        var resultB = await Calculate(client, Cx8CostForgeRealFactory.PropertyBId);
        var totalB = resultB.GetProperty("totalCost").GetDecimal();
        var landB = resultB.GetProperty("landValue").GetDecimal();
        var improvB = resultB.GetProperty("improvementValue").GetDecimal();
        var confB = resultB.GetProperty("confidenceScore").GetDouble();
        var pidB = resultB.GetProperty("propertyId").GetString();

        // ── Print proof ──
        _output.WriteLine("════════════════════════════════════════════════════════════");
        _output.WriteLine("CX-8 PROOF ARTIFACT: CostForge Parcel-Variable Output");
        _output.WriteLine("════════════════════════════════════════════════════════════");
        _output.WriteLine("");
        _output.WriteLine($"Property A: {Cx8CostForgeRealFactory.PropertyAId}");
        _output.WriteLine($"  Parcel:       {Cx8CostForgeRealFactory.PropertyAParcelNumber}");
        _output.WriteLine($"  Seed Data:    LandValue=120000, ImprovementValue=80000, Assessed=200000");
        _output.WriteLine($"  CostForge →   TotalCost={totalA:C}, LandValue={landA:C}, ImprovementValue={improvA:C}");
        _output.WriteLine($"  Confidence:   {confA:P1}");
        _output.WriteLine($"  PropertyId:   {pidA}");
        _output.WriteLine("");
        _output.WriteLine($"Property B: {Cx8CostForgeRealFactory.PropertyBId}");
        _output.WriteLine($"  Parcel:       {Cx8CostForgeRealFactory.PropertyBParcelNumber}");
        _output.WriteLine($"  Seed Data:    LandValue=250000, ImprovementValue=400000, Assessed=650000");
        _output.WriteLine($"  CostForge →   TotalCost={totalB:C}, LandValue={landB:C}, ImprovementValue={improvB:C}");
        _output.WriteLine($"  Confidence:   {confB:P1}");
        _output.WriteLine($"  PropertyId:   {pidB}");
        _output.WriteLine("");
        _output.WriteLine("──────────────────────────────────────────────────────────");
        _output.WriteLine($"  A ≠ B:        TotalCost differs = {totalA != totalB}");
        _output.WriteLine($"  A ≠ B:        LandValue differs = {landA != landB}");
        _output.WriteLine($"  A ≠ B:        ImprovValue differs = {improvA != improvB}");
        _output.WriteLine($"  Both non-zero: A.Total={totalA > 0}, B.Total={totalB > 0}");
        _output.WriteLine("════════════════════════════════════════════════════════════");

        // Assert so xUnit marks it pass/fail
        Assert.True(totalA > 0 && totalB > 0, "Both outputs must be non-zero");
        Assert.NotEqual(totalA, totalB);
        Assert.Equal(Cx8CostForgeRealFactory.PropertyAId.ToString(), pidA);
        Assert.Equal(Cx8CostForgeRealFactory.PropertyBId.ToString(), pidB);
    }

    private static async Task<JsonElement> Calculate(HttpClient client, Guid propertyId)
    {
        var payload = JsonSerializer.Serialize(new
        {
            PropertyId = propertyId,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "RESIDENTIAL",
        });
        var response = await client.PostAsync("/api/CostForge/calculate",
            new StringContent(payload, Encoding.UTF8, "application/json"));
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<JsonElement>(json);
    }

    private HttpClient CreateBentonClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx8CostForgeRealFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx8-proof-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId",
            Cx8CostForgeRealFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id",
            Cx8CostForgeRealFactory.PluginAllPermsId.ToString());
        return client;
    }
}
