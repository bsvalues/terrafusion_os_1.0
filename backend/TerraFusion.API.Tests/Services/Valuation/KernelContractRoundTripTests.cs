using System.IO;
using System.Text.Json;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class KernelContractRoundTripTests
{
    private static readonly string FixturesDir = Path.Combine(
        Path.GetDirectoryName(typeof(KernelContractRoundTripTests).Assembly.Location)!,
        "Services", "Valuation", "Fixtures", "Kernels");

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    [Fact]
    public void CostRequest_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "cost-request-basic.json"));
        var inv = JsonSerializer.Deserialize<KernelInvocation<CostKernelPayload>>(json, JsonOpts);

        Assert.NotNull(inv);
        Assert.Equal("1.0.0", inv!.ContractPackVersion);
        Assert.Equal("calculate_cost", inv.Action);
        Assert.Equal(1850.0, inv.Payload!.Subject.Attributes.Sqft);
        Assert.Equal("GOOD", inv.Payload.Subject.Attributes.Quality);
        Assert.Equal(145.50, inv.Payload.Tables.BaseRate);
        Assert.Equal(1.15, inv.Payload.Tables.Modifiers["GOOD"]);
    }

    [Fact]
    public void CostResponse_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "cost-response-basic.json"));
        var resp = JsonSerializer.Deserialize<KernelResponse<CostKernelResult>>(json, JsonOpts);

        Assert.NotNull(resp);
        Assert.True(resp!.Success);
        Assert.Equal(309558.75, resp.Data!.ReplacementCost);
        Assert.Equal(30955.88, resp.Data.Depreciation);
        Assert.Equal(278602.87, resp.Data.Rcnld);
        Assert.NotNull(resp.AuditEvent);
        Assert.Equal("terraforge.kernel.cost", resp.AuditEvent!.Module);
        Assert.StartsWith("git:", resp.AuditEvent.Hash);
    }

    [Fact]
    public void ValuationRequest_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "valuation-request-basic.json"));
        var inv = JsonSerializer.Deserialize<KernelInvocation<ValuationKernelPayload>>(json, JsonOpts);

        Assert.NotNull(inv);
        Assert.Equal("valuate", inv!.Action);
        Assert.Equal(278602.87, inv.Payload!.CostBreakdown.Rcnld);
        Assert.Equal(65000.0, inv.Payload.Model.LandValue);
        Assert.Equal(1.05, inv.Payload.Model.AdjustmentFactors!.Neighborhood);
    }

    [Fact]
    public void ValuationResponse_DeserializesFromGoldenFixture()
    {
        var json = File.ReadAllText(Path.Combine(FixturesDir, "valuation-response-basic.json"));
        var resp = JsonSerializer.Deserialize<KernelResponse<ValuationKernelResult>>(json, JsonOpts);

        Assert.NotNull(resp);
        Assert.True(resp!.Success);
        Assert.Equal(351708.06, resp.Data!.TotalValue);
        Assert.Equal(65000.0, resp.Data.Components.Land);
    }

    [Fact]
    public void CostRequest_RoundTripsSerialization()
    {
        var original = new KernelInvocation<CostKernelPayload>(
            ContractPackVersion: "1.0.0",
            ModuleApiVersion: "1.0.0",
            RequestId: "test-123",
            Action: "calculate_cost",
            Payload: new CostKernelPayload(
                Subject: new CostSubject("PARCEL-001", new CostAttributes(1850.0, "GOOD", "AVERAGE")),
                Tables: new CostTables(145.50, new Dictionary<string, double> { ["GOOD"] = 1.15 })));

        var json = JsonSerializer.Serialize(original, JsonOpts);
        var round = JsonSerializer.Deserialize<KernelInvocation<CostKernelPayload>>(json, JsonOpts)!;

        Assert.Equal(original.RequestId, round.RequestId);
        Assert.Equal(original.Payload!.Subject.Attributes.Sqft, round.Payload!.Subject.Attributes.Sqft);
    }
}
