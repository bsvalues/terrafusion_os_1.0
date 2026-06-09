using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Sync.Corpus;
using TerraFusion.Data.Services.Workbench.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2-V2 tests for stage-level-resume body shape produced
/// by <see cref="HttpCorpusLaneRunner"/>. We attach a fake
/// <see cref="HttpMessageHandler"/> to capture the request body and
/// assert that <c>laneResultId</c> + <c>resumeFromStage</c> are passed
/// through correctly to the lane endpoint.
/// </summary>
public sealed class HttpCorpusLaneRunnerStageResumeTests
{
    private static (HttpCorpusLaneRunner runner, CapturingHandler handler) Build()
    {
        var handler = new CapturingHandler();
        var factory = new SingleClientFactory(handler);
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["FullCorpus:LoopbackBaseUrl"] = "http://localhost:5000",
            }).Build();
        var runner = new HttpCorpusLaneRunner(
            factory, config, NullLogger<HttpCorpusLaneRunner>.Instance);
        return (runner, handler);
    }

    [Fact]
    public async Task RunLaneAsync_first_attempt_includes_no_resumeFromStage()
    {
        var (runner, handler) = Build();
        var laneResultId = Guid.NewGuid();
        await runner.RunLaneAsync(
            "parcel", "op", 2026, fullCorpus: true, topN: null,
            laneResultId: laneResultId,
            resumeFromStage: null,
            cancellationToken: CancellationToken.None);

        handler.LastBody.Should().NotBeNull();
        var doc = JsonDocument.Parse(handler.LastBody!);
        doc.RootElement.TryGetProperty("laneResultId", out var lid).Should().BeTrue();
        lid.GetGuid().Should().Be(laneResultId);
        // Null resumeFromStage is serialized as JSON null — verify by
        // checking the property exists but is null (or absent).
        var resumeKind = doc.RootElement.TryGetProperty("resumeFromStage", out var r)
            ? r.ValueKind : JsonValueKind.Null;
        resumeKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task RunLaneAsync_retry_with_resume_passes_resumeFromStage()
    {
        var (runner, handler) = Build();
        var laneResultId = Guid.NewGuid();
        await runner.RunLaneAsync(
            "owner-wsdor", "op", 2026, fullCorpus: true, topN: null,
            laneResultId: laneResultId,
            resumeFromStage: "Owner-Truth",
            cancellationToken: CancellationToken.None);

        var doc = JsonDocument.Parse(handler.LastBody!);
        doc.RootElement.GetProperty("laneResultId").GetGuid().Should().Be(laneResultId);
        doc.RootElement.GetProperty("resumeFromStage").GetString().Should().Be("Owner-Truth");
    }

    [Fact]
    public async Task RunLaneAsync_legacy_overload_includes_no_laneResultId()
    {
        // Manual operator curls through the old overload: the lane
        // endpoint sees null laneResultId/resumeFromStage and runs as
        // it always has.
        var (runner, handler) = Build();
        await runner.RunLaneAsync(
            "parcel", "op", 2026, fullCorpus: true, topN: null,
            CancellationToken.None);

        var doc = JsonDocument.Parse(handler.LastBody!);
        var lidKind = doc.RootElement.TryGetProperty("laneResultId", out var l)
            ? l.ValueKind : JsonValueKind.Null;
        lidKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task RunLaneAsync_includes_operator_year_fullCorpus_topN_in_body()
    {
        var (runner, handler) = Build();
        await runner.RunLaneAsync(
            "improvement", "op-X", 2026, fullCorpus: false, topN: 200,
            laneResultId: Guid.NewGuid(),
            resumeFromStage: null,
            cancellationToken: CancellationToken.None);

        var doc = JsonDocument.Parse(handler.LastBody!);
        doc.RootElement.GetProperty("operatorName").GetString().Should().Be("op-X");
        doc.RootElement.GetProperty("workingYear").GetInt32().Should().Be(2026);
        doc.RootElement.GetProperty("fullCorpus").GetBoolean().Should().BeFalse();
        doc.RootElement.GetProperty("topN").GetInt32().Should().Be(200);
    }

    [Fact]
    public async Task RunLaneAsync_unknown_lane_short_circuits_without_HTTP()
    {
        var (runner, handler) = Build();
        var result = await runner.RunLaneAsync(
            "not-a-lane", "op", 2026, fullCorpus: true, topN: null,
            laneResultId: Guid.NewGuid(),
            resumeFromStage: "Owner-Truth",
            cancellationToken: CancellationToken.None);

        result.Outcome.Should().Be(CorpusLaneRunOutcome.UnknownLane);
        handler.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task RunLaneAsync_targets_correct_lane_url_path()
    {
        var (runner, handler) = Build();
        await runner.RunLaneAsync(
            "geometry", "op", 2026, fullCorpus: true, topN: null,
            laneResultId: Guid.NewGuid(),
            resumeFromStage: null,
            cancellationToken: CancellationToken.None);

        handler.LastUrl.Should().EndWith("/api/sync/doctrine/drain/geometry");
    }

    [Fact]
    public async Task RunLaneAsync_resumeFromStage_value_round_trips_through_body()
    {
        // Each lane should be able to receive its own canonical stage
        // names. Spot-check a representative sample: the most-burdened
        // lanes' canonical mid-points.
        foreach (var (lane, stage) in new[]
        {
            ("owner-wsdor", "Owner-Truth"),
            ("improvement", "Imprv-S1"),
            ("land", "Land-Truth"),
            ("sales", "Sale-Truth"),
        })
        {
            var (runner, handler) = Build();
            await runner.RunLaneAsync(
                lane, "op", 2026, fullCorpus: true, topN: null,
                laneResultId: Guid.NewGuid(),
                resumeFromStage: stage,
                cancellationToken: CancellationToken.None);

            var doc = JsonDocument.Parse(handler.LastBody!);
            doc.RootElement.GetProperty("resumeFromStage").GetString().Should().Be(stage,
                $"lane={lane} should round-trip its resumeFromStage hint");
        }
    }

    // ── Fakes ────────────────────────────────────────────────────────

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public string? LastBody { get; private set; }
        public string? LastUrl { get; private set; }
        public int CallCount { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            LastUrl = request.RequestUri?.ToString();
            LastBody = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);

            // Return a Succeeded response so the parser is happy.
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"lane\":\"x\",\"status\":\"Succeeded\",\"batchIds\":[]}",
                    System.Text.Encoding.UTF8, "application/json"),
            };
            return response;
        }
    }

    private sealed class SingleClientFactory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;
        public SingleClientFactory(HttpMessageHandler handler) => _handler = handler;
        public HttpClient CreateClient(string name)
            => new(_handler, disposeHandler: false);
    }
}
