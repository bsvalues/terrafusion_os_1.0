using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dais;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Dais;

public sealed class DaisAppealMutationDecisionPortTests
{
    private static readonly string CommandId = "11111111-1111-1111-1111-111111111111";
    private static readonly string CountyId = "22222222-2222-2222-2222-222222222222";

    [Fact]
    public async Task DecideCreateAsync_UsesUtcZuluAndRequiresExactProvenance()
    {
        var host = new RecordingHost((requestJson, _) =>
        {
            using var request = JsonDocument.Parse(requestJson);
            request.RootElement.GetProperty("effectiveAt").GetString().Should().Be("2026-02-03T04:05:06Z");
            return Task.FromResult(Success($$"""
                {"schemaVersion":"1.0.0","operation":"create","commandId":"{{CommandId}}","countyId":"{{CountyId}}","decision":"accepted","mutation":{"ground":"MARKET_VALUE","status":"filed","taxYear":2026,"filedAt":"2026-02-03T04:05:06Z","updatedAt":"2026-02-03T04:05:06Z"},"violations":[]}
                """));
        });
        var port = CreatePort(host);

        var result = await port.DecideCreateAsync(CreateRequest());

        result.Decision.Should().Be(DaisAppealMutationDecision.accepted);
        host.Calls.Should().Be(1);
    }

    [Fact]
    public async Task DecideCreateAsync_RejectsNonUtcRequestBeforeInvocation()
    {
        var host = new RecordingHost((_, _) => throw new InvalidOperationException("must not invoke"));
        var port = CreatePort(host);
        var request = CreateRequest() with
        {
            EffectiveAt = new DateTimeOffset(2026, 2, 3, 4, 5, 6, TimeSpan.FromHours(1)),
        };

        var act = () => port.DecideCreateAsync(request);

        await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
        host.Calls.Should().Be(0);
    }

    [Theory]
    [InlineData("duplicate")]
    [InlineData("extra")]
    [InlineData("identity")]
    public async Task DecideCreateAsync_RejectsDuplicateExtraOrMismatchedIdentity(string failure)
    {
        var json = failure switch
        {
            "duplicate" => $$"""{"schemaVersion":"1.0.0","schemaVersion":"1.0.0","operation":"create","commandId":"{{CommandId}}","countyId":"{{CountyId}}","decision":"rejected","violations":[{"code":"INVALID_GROUND","message":"x"}]}""",
            "extra" => $$"""{"schemaVersion":"1.0.0","operation":"create","commandId":"{{CommandId}}","countyId":"{{CountyId}}","decision":"rejected","violations":[{"code":"INVALID_GROUND","message":"x"}],"unexpected":true}""",
            _ => $$"""{"schemaVersion":"1.0.0","operation":"create","commandId":"33333333-3333-3333-3333-333333333333","countyId":"{{CountyId}}","decision":"rejected","violations":[{"code":"INVALID_GROUND","message":"x"}]}""",
        };
        var port = CreatePort(new RecordingHost((_, _) => Task.FromResult(Success(json))));

        var act = () => port.DecideCreateAsync(CreateRequest());

        await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
    }

    [Fact]
    public async Task DecideCreateAsync_RejectsMissingCopiedArtifactProvenance()
    {
        var valid = $$"""{"schemaVersion":"1.0.0","operation":"create","commandId":"{{CommandId}}","countyId":"{{CountyId}}","decision":"rejected","violations":[{"code":"INVALID_GROUND","message":"x"}]}""";
        var result = Success(valid) with { CopiedSchemaSha256 = new string('0', 64) };
        var port = CreatePort(new RecordingHost((_, _) => Task.FromResult(result)));

        var act = () => port.DecideCreateAsync(CreateRequest());

        await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
    }

    private static DaisAppealCreateDecisionRequest CreateRequest() => new()
    {
        SchemaVersion = "1.0.0",
        Operation = DaisAppealMutationOperation.create,
        CommandId = CommandId,
        CountyId = CountyId,
        EffectiveAt = new DateTimeOffset(2026, 2, 3, 4, 5, 6, TimeSpan.Zero),
        Command = new DaisAppealCreateDecisionCommand { Ground = "MARKET_VALUE", TaxYear = 2026 },
    };

    private static DaisAppealMutationDecisionPort CreatePort(IDaisAppealMutationProcessHost host) =>
        new(host, Options.Create(new DaisAppealMutationOptions
        {
            Mode = DaisAppealMutationMode.LocalExact,
            ModulePath = Path.GetFullPath("module.mjs"),
            SchemaPath = Path.GetFullPath("schema.json"),
        }));

    private static DaisAppealMutationProcessResult Success(string json) => new(
        DaisAppealMutationProcessFailure.None,
        json,
        DaisAppealMutationOptions.ExpectedModuleSha256,
        DaisAppealMutationOptions.ExpectedModuleSha256,
        DaisAppealMutationOptions.ExpectedSchemaSha256,
        DaisAppealMutationOptions.ExpectedSchemaSha256,
        null);

    private sealed class RecordingHost(
        Func<string, CancellationToken, Task<DaisAppealMutationProcessResult>> decide)
        : IDaisAppealMutationProcessHost
    {
        public int Calls { get; private set; }

        public Task<DaisAppealMutationProcessResult> DecideAsync(
            string modulePath,
            string expectedModuleSha256,
            string schemaPath,
            string expectedSchemaSha256,
            string requestJson,
            CancellationToken cancellationToken = default)
        {
            Calls++;
            modulePath.Should().EndWith("module.mjs");
            schemaPath.Should().EndWith("schema.json");
            expectedModuleSha256.Should().Be(DaisAppealMutationOptions.ExpectedModuleSha256);
            expectedSchemaSha256.Should().Be(DaisAppealMutationOptions.ExpectedSchemaSha256);
            return decide(requestJson, cancellationToken);
        }
    }
}
