using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dais;
using TerraFusion.Core.Entities;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Dais;

public sealed class DaisAppealWorkflowConsumerTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid AppealId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task ConsumeAsync_MapsSovereignRecord_InvokesExactPins_AndReturnsOnlyNormalizedResult()
    {
        var host = new StubHost((exchange, _) => Accepted(exchange));
        var consumer = CreateConsumer(host);

        var result = await consumer.ConsumeAsync(CreateRequest(), [CreateAppeal()]);

        result.Success.Should().BeTrue();
        result.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.None);
        result.NormalizedResultJson.Should().NotBeNull();
        using var normalizedResult = JsonDocument.Parse(result.NormalizedResultJson!);
        normalizedResult.RootElement.GetProperty("countyId").GetString().Should().Be(CountyId.ToString("D"));
        normalizedResult.RootElement.GetProperty("appeals")[0]
            .GetProperty("appealId").GetString().Should().Be(AppealId.ToString("D"));
        normalizedResult.RootElement.TryGetProperty("request", out _).Should().BeFalse();

        host.CallCount.Should().Be(1);
        host.ModulePath.Should().Be(Path.GetFullPath("synthetic-dais-module.mjs"));
        host.SchemaPath.Should().Be(Path.GetFullPath("synthetic-dais-schema.json"));
        host.ModuleHash.Should().Be(DaisAppealWorkflowOptions.ExpectedModuleSha256);
        host.SchemaHash.Should().Be(DaisAppealWorkflowOptions.ExpectedSchemaSha256);
        host.ExchangeJson.Should().Contain("\"request\":");
        host.ExchangeJson.Should().Contain("\"result\":");
        host.ExchangeJson.Should().NotContain("PetitionerName");
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsDisabledFailure_WithoutMappingOrInvocation()
    {
        var host = new StubHost((exchange, _) => Accepted(exchange));
        var consumer = CreateConsumer(host, DaisAppealWorkflowMode.Disabled);

        var result = await consumer.ConsumeAsync(CreateRequest(), [CreateAppeal(countyId: Guid.NewGuid())]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.Disabled);
        result.NormalizedResultJson.Should().BeNull();
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsInvalidRequest_WhenSovereignMappingFails()
    {
        var host = new StubHost((exchange, _) => Accepted(exchange));
        var consumer = CreateConsumer(host);

        var result = await consumer.ConsumeAsync(
            CreateRequest(),
            [CreateAppeal(countyId: Guid.NewGuid())]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.InvalidRequest);
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsRuntimeRejected_WhenExactModuleRejectsExchange()
    {
        var host = new StubHost((_, _) => new DaisAppealWorkflowProcessResult(
            DaisAppealWorkflowOutcome.Rejected,
            DaisAppealWorkflowFailure.None,
            null,
            [new DaisAppealWorkflowViolation("COUNTY_MISMATCH", "synthetic rejection")],
            CountyId.ToString("D"),
            CountyId.ToString("D"),
            DaisAppealWorkflowOptions.ExpectedModuleSha256,
            DaisAppealWorkflowOptions.ExpectedModuleSha256,
            DaisAppealWorkflowOptions.ExpectedSchemaSha256,
            DaisAppealWorkflowOptions.ExpectedSchemaSha256,
            null));

        var result = await CreateConsumer(host).ConsumeAsync(CreateRequest(), [CreateAppeal()]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.RuntimeRejected);
        result.NormalizedResultJson.Should().BeNull();
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsRuntimeFailed_WhenProcessHostFails()
    {
        var host = new StubHost((_, _) => new DaisAppealWorkflowProcessResult(
            DaisAppealWorkflowOutcome.Failed,
            DaisAppealWorkflowFailure.SourceModuleHashMismatch,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "synthetic hash mismatch"));

        var result = await CreateConsumer(host).ConsumeAsync(CreateRequest(), [CreateAppeal()]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.RuntimeFailed);
        result.NormalizedResultJson.Should().BeNull();
    }

    [Fact]
    public async Task ConsumeAsync_ThrowsCancellation_WhenHostReturnsCancelledForCancelledToken()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var host = new StubHost((_, _) => Cancelled());
        var action = () => CreateConsumer(host).ConsumeAsync(
            CreateRequest(),
            [CreateAppeal()],
            cancellation.Token);

        var exception = await action.Should().ThrowAsync<OperationCanceledException>();

        exception.Which.CancellationToken.Should().Be(cancellation.Token);
        host.CallCount.Should().Be(1);
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsRuntimeFailed_WhenHostReturnsCancelledWithoutCancelledToken()
    {
        var host = new StubHost((_, _) => Cancelled());

        var result = await CreateConsumer(host).ConsumeAsync(
            CreateRequest(),
            [CreateAppeal()],
            CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.RuntimeFailed);
        result.NormalizedResultJson.Should().BeNull();
        result.ErrorMessage.Should().Contain(nameof(DaisAppealWorkflowFailure.Cancelled));
        host.CallCount.Should().Be(1);
    }

    [Theory]
    [InlineData("source-module")]
    [InlineData("copied-module")]
    [InlineData("source-schema")]
    [InlineData("copied-schema")]
    public async Task ConsumeAsync_ReturnsProvenanceMismatch_WhenAnyByteIdentityDiffers(string field)
    {
        var host = new StubHost((exchange, _) => field switch
        {
            "source-module" => Accepted(exchange) with { SourceModuleSha256 = new string('0', 64) },
            "copied-module" => Accepted(exchange) with { CopiedModuleSha256 = new string('0', 64) },
            "source-schema" => Accepted(exchange) with { SourceSchemaSha256 = new string('0', 64) },
            _ => Accepted(exchange) with { CopiedSchemaSha256 = new string('0', 64) },
        });

        var result = await CreateConsumer(host).ConsumeAsync(CreateRequest(), [CreateAppeal()]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.ProvenanceMismatch);
        result.NormalizedResultJson.Should().BeNull();
    }

    [Theory]
    [InlineData("request")]
    [InlineData("result")]
    [InlineData("county")]
    [InlineData("extra-property")]
    public async Task ConsumeAsync_ReturnsIdentityMismatch_WhenNormalizedIdentityChanges(string mismatch)
    {
        var host = new StubHost((exchange, _) =>
        {
            using var parsed = JsonDocument.Parse(exchange);
            var request = parsed.RootElement.GetProperty("request").GetRawText();
            var result = parsed.RootElement.GetProperty("result").GetRawText();
            var normalized = mismatch switch
            {
                "request" => $"{{\"request\":{{\"schemaVersion\":\"1.0.0\",\"countyId\":\"{CountyId:D}\",\"selector\":{{\"taxYear\":2025}}}},\"result\":{result}}}",
                "result" => $"{{\"request\":{request},\"result\":{{\"schemaVersion\":\"1.0.0\",\"countyId\":\"{CountyId:D}\",\"appeals\":[]}}}}",
                "extra-property" => $"{{\"request\":{request},\"result\":{result},\"extra\":true}}",
                _ => exchange,
            };

            var accepted = Accepted(normalized);
            return mismatch == "county"
                ? accepted with { ResultCountyId = Guid.NewGuid().ToString("D") }
                : accepted;
        });

        var consumerResult = await CreateConsumer(host).ConsumeAsync(CreateRequest(), [CreateAppeal()]);

        consumerResult.Success.Should().BeFalse();
        consumerResult.Failure.Should().Be(DaisAppealWorkflowConsumerFailure.IdentityMismatch);
        consumerResult.NormalizedResultJson.Should().BeNull();
    }

    [Fact]
    public async Task ConsumeAsync_PropagatesCancellation()
    {
        var host = new StubHost((_, _) => throw new OperationCanceledException());
        var action = () => CreateConsumer(host).ConsumeAsync(CreateRequest(), [CreateAppeal()]);

        await action.Should().ThrowAsync<OperationCanceledException>();
    }

    private static DaisAppealWorkflowConsumer CreateConsumer(
        IDaisAppealWorkflowProcessHost host,
        DaisAppealWorkflowMode mode = DaisAppealWorkflowMode.LocalExact) =>
        new(
            host,
            Options.Create(new DaisAppealWorkflowOptions
            {
                Mode = mode,
                ModulePath = Path.GetFullPath("synthetic-dais-module.mjs"),
                SchemaPath = Path.GetFullPath("synthetic-dais-schema.json"),
            }));

    private static DaisAppealWorkflowReadRequest CreateRequest() => new()
    {
        SchemaVersion = "1.0.0",
        CountyId = CountyId.ToString("D"),
        Selector = new DaisAppealSelector { AppealId = AppealId.ToString("D") },
        TraceId = "synthetic-trace",
    };

    private static Appeal CreateAppeal(Guid? countyId = null) => new()
    {
        Id = AppealId,
        CountyId = countyId ?? CountyId,
        ParcelId = "synthetic-parcel-001",
        TaxYear = 2026,
        AppealGround = "MARKET_VALUE",
        Status = "filed",
        FiledDate = new DateTime(2026, 1, 10, 18, 30, 0, DateTimeKind.Utc),
    };

    private static DaisAppealWorkflowProcessResult Accepted(string normalizedExchangeJson) => new(
        DaisAppealWorkflowOutcome.Accepted,
        DaisAppealWorkflowFailure.None,
        normalizedExchangeJson,
        [],
        CountyId.ToString("D"),
        CountyId.ToString("D"),
        DaisAppealWorkflowOptions.ExpectedModuleSha256,
        DaisAppealWorkflowOptions.ExpectedModuleSha256,
        DaisAppealWorkflowOptions.ExpectedSchemaSha256,
        DaisAppealWorkflowOptions.ExpectedSchemaSha256,
        null);

    private static DaisAppealWorkflowProcessResult Cancelled() => new(
        DaisAppealWorkflowOutcome.Failed,
        DaisAppealWorkflowFailure.Cancelled,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "synthetic cancellation");

    private sealed class StubHost(
        Func<string, CancellationToken, DaisAppealWorkflowProcessResult> handler)
        : IDaisAppealWorkflowProcessHost
    {
        public int CallCount { get; private set; }
        public string? ModulePath { get; private set; }
        public string? ModuleHash { get; private set; }
        public string? SchemaPath { get; private set; }
        public string? SchemaHash { get; private set; }
        public string? ExchangeJson { get; private set; }

        public Task<DaisAppealWorkflowProcessResult> ValidateAsync(
            string modulePath,
            string expectedModuleSha256,
            string schemaPath,
            string expectedSchemaSha256,
            string appealWorkflowExchangeJson,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            ModulePath = modulePath;
            ModuleHash = expectedModuleSha256;
            SchemaPath = schemaPath;
            SchemaHash = expectedSchemaSha256;
            ExchangeJson = appealWorkflowExchangeJson;
            return Task.FromResult(handler(appealWorkflowExchangeJson, cancellationToken));
        }
    }
}
