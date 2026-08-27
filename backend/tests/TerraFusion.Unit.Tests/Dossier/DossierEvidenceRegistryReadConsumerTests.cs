using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Entities;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierEvidenceRegistryReadConsumerTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid EvidenceId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task ConsumeAsync_MapsSovereignRecord_InvokesExactPins_AndReturnsOnlyNormalizedResult()
    {
        var host = new StubHost((exchange, _) => Accepted(exchange));
        var consumer = CreateConsumer(host);

        var result = await consumer.ConsumeAsync(CreateRequest(), 1, [CreateEvidence()]);

        result.Success.Should().BeTrue();
        result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.None);
        result.NormalizedResultJson.Should().NotBeNull();
        using var normalizedResult = JsonDocument.Parse(result.NormalizedResultJson!);
        normalizedResult.RootElement.GetProperty("countyId").GetString().Should().Be(CountyId.ToString("D"));
        normalizedResult.RootElement.GetProperty("results")[0]
            .GetProperty("evidenceId").GetString().Should().Be(EvidenceId.ToString("D"));
        normalizedResult.RootElement.TryGetProperty("request", out _).Should().BeFalse();

        host.CallCount.Should().Be(1);
        host.ModulePath.Should().Be(Path.GetFullPath("synthetic-dossier-module.mjs"));
        host.SchemaPath.Should().Be(Path.GetFullPath("synthetic-dossier-schema.json"));
        host.ModuleHash.Should().Be(DossierEvidenceRegistryReadOptions.ExpectedModuleSha256);
        host.SchemaHash.Should().Be(DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256);
        host.ExchangeJson.Should().Contain("\"request\":");
        host.ExchangeJson.Should().Contain("\"result\":");
        host.ExchangeJson.Should().NotContain("CreatedBy");
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsDisabledFailure_WithoutMappingOrInvocation()
    {
        var host = new StubHost((exchange, _) => Accepted(exchange));
        var consumer = CreateConsumer(host, DossierEvidenceRegistryReadMode.Disabled);

        var result = await consumer.ConsumeAsync(CreateRequest(), 1, [CreateEvidence(countyId: Guid.NewGuid())]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.Disabled);
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
            1,
            [CreateEvidence(countyId: Guid.NewGuid())]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.InvalidRequest);
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsRuntimeRejected_WhenExactModuleRejectsExchange()
    {
        var host = new StubHost((_, _) => new DossierEvidenceRegistryReadProcessResult(
            DossierEvidenceRegistryReadOutcome.Rejected,
            DossierEvidenceRegistryReadFailure.None,
            null,
            [new DossierEvidenceRegistryReadViolation("COUNTY_MISMATCH", "synthetic rejection")],
            CountyId.ToString("D"),
            CountyId.ToString("D"),
            DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
            DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
            DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
            DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
            null));

        var result = await CreateConsumer(host).ConsumeAsync(CreateRequest(), 1, [CreateEvidence()]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.RuntimeRejected);
        result.NormalizedResultJson.Should().BeNull();
    }

    [Fact]
    public async Task ConsumeAsync_ReturnsRuntimeFailed_WhenProcessHostFails()
    {
        var host = new StubHost((_, _) => new DossierEvidenceRegistryReadProcessResult(
            DossierEvidenceRegistryReadOutcome.Failed,
            DossierEvidenceRegistryReadFailure.SourceModuleHashMismatch,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "synthetic hash mismatch"));

        var result = await CreateConsumer(host).ConsumeAsync(CreateRequest(), 1, [CreateEvidence()]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.RuntimeFailed);
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
            1,
            [CreateEvidence()],
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
            1,
            [CreateEvidence()],
            CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.RuntimeFailed);
        result.NormalizedResultJson.Should().BeNull();
        result.ErrorMessage.Should().Contain(nameof(DossierEvidenceRegistryReadFailure.Cancelled));
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

        var result = await CreateConsumer(host).ConsumeAsync(CreateRequest(), 1, [CreateEvidence()]);

        result.Success.Should().BeFalse();
        result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.ProvenanceMismatch);
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
                "request" => $"{{\"request\":{{\"schemaVersion\":\"1.0.0\",\"countyId\":\"{CountyId:D}\",\"parcelId\":\"changed\",\"limit\":25,\"offset\":0}},\"result\":{result}}}",
                "result" => $"{{\"request\":{request},\"result\":{{\"schemaVersion\":\"1.0.0\",\"countyId\":\"{CountyId:D}\",\"parcelId\":\"synthetic-parcel-001\",\"results\":[],\"total\":0,\"hasMore\":false,\"limit\":25,\"offset\":0}}}}",
                "extra-property" => $"{{\"request\":{request},\"result\":{result},\"extra\":true}}",
                _ => exchange,
            };

            var accepted = Accepted(normalized);
            return mismatch == "county"
                ? accepted with { ResultCountyId = Guid.NewGuid().ToString("D") }
                : accepted;
        });

        var consumerResult = await CreateConsumer(host).ConsumeAsync(CreateRequest(), 1, [CreateEvidence()]);

        consumerResult.Success.Should().BeFalse();
        consumerResult.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.IdentityMismatch);
        consumerResult.NormalizedResultJson.Should().BeNull();
    }

    [Fact]
    public async Task ConsumeAsync_PropagatesCancellation()
    {
        var host = new StubHost((_, _) => throw new OperationCanceledException());
        var action = () => CreateConsumer(host).ConsumeAsync(CreateRequest(), 1, [CreateEvidence()]);

        await action.Should().ThrowAsync<OperationCanceledException>();
    }

    private static DossierEvidenceRegistryReadConsumer CreateConsumer(
        IDossierEvidenceRegistryReadProcessHost host,
        DossierEvidenceRegistryReadMode mode = DossierEvidenceRegistryReadMode.LocalExact) =>
        new(
            host,
            Options.Create(new DossierEvidenceRegistryReadOptions
            {
                Mode = mode,
                ModulePath = Path.GetFullPath("synthetic-dossier-module.mjs"),
                SchemaPath = Path.GetFullPath("synthetic-dossier-schema.json"),
            }));

    private static DossierEvidenceRegistryReadRequest CreateRequest() => new()
    {
        SchemaVersion = "1.0.0",
        CountyId = CountyId.ToString("D"),
        ParcelId = "synthetic-parcel-001",
        Limit = 25,
        Offset = 0,
        TraceId = "synthetic-trace",
    };

    private static DossierEvidence CreateEvidence(Guid? countyId = null) => new()
    {
        Id = EvidenceId,
        CountyId = countyId ?? CountyId,
        ParcelId = "synthetic-parcel-001",
        EvidenceType = "legal-document",
        Integrity = "verified",
        CreatedAt = new DateTime(2026, 1, 10, 18, 30, 0, DateTimeKind.Utc),
    };

    private static DossierEvidenceRegistryReadProcessResult Accepted(string normalizedExchangeJson) => new(
        DossierEvidenceRegistryReadOutcome.Accepted,
        DossierEvidenceRegistryReadFailure.None,
        normalizedExchangeJson,
        [],
        CountyId.ToString("D"),
        CountyId.ToString("D"),
        DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
        DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
        DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
        DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
        null);

    private static DossierEvidenceRegistryReadProcessResult Cancelled() => new(
        DossierEvidenceRegistryReadOutcome.Failed,
        DossierEvidenceRegistryReadFailure.Cancelled,
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
        Func<string, CancellationToken, DossierEvidenceRegistryReadProcessResult> handler)
        : IDossierEvidenceRegistryReadProcessHost
    {
        public int CallCount { get; private set; }
        public string? ModulePath { get; private set; }
        public string? ModuleHash { get; private set; }
        public string? SchemaPath { get; private set; }
        public string? SchemaHash { get; private set; }
        public string? ExchangeJson { get; private set; }

        public Task<DossierEvidenceRegistryReadProcessResult> ValidateAsync(
            string modulePath,
            string expectedModuleSha256,
            string schemaPath,
            string expectedSchemaSha256,
            string evidenceRegistryExchangeJson,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            ModulePath = modulePath;
            ModuleHash = expectedModuleSha256;
            SchemaPath = schemaPath;
            SchemaHash = expectedSchemaSha256;
            ExchangeJson = evidenceRegistryExchangeJson;
            return Task.FromResult(handler(evidenceRegistryExchangeJson, cancellationToken));
        }
    }
}
