using System;
using System.Linq;
using FluentAssertions;
using TerraFusion.Core.Sync.Corpus;
using TerraFusion.Data.Services.Workbench.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2 unit tests for the response-parser inside
/// <see cref="HttpCorpusLaneRunner"/>. We don't issue real HTTP
/// calls — we exercise the JSON-shape parser against the documented
/// success and failure response shapes from
/// <c>DoctrineDrainController</c>.
/// </summary>
public sealed class HttpCorpusLaneRunnerTests
{
    [Fact]
    public void ParseLaneResponse_extracts_batch_ids_counts_gates_quarantine_on_success()
    {
        var batchA = Guid.NewGuid();
        var batchB = Guid.NewGuid();
        var json = $@"{{
            ""lane"":""parcel"",
            ""status"":""Succeeded"",
            ""batchIds"":[""{batchA}"",""{batchB}""],
            ""counts"":{{""rowsLanded"":42}},
            ""gateSummary"":{{""totals"":[]}},
            ""quarantineDelta"":{{""before"":0,""after"":0,""delta"":0}}
        }}";

        var result = HttpCorpusLaneRunner.ParseLaneResponse(true, json);
        result.Outcome.Should().Be(CorpusLaneRunOutcome.Completed);
        result.BatchIds.Should().Equal(batchA, batchB);
        result.CountsJson.Should().Contain("rowsLanded");
        result.GateSummaryJson.Should().Contain("totals");
        result.QuarantineDeltaJson.Should().Contain("delta");
    }

    [Fact]
    public void ParseLaneResponse_returns_Failed_with_composite_error_on_failure_response()
    {
        var json = @"{
            ""lane"":""improvement"",
            ""status"":""Failed"",
            ""failedStage"":""Imprv-Truth"",
            ""error"":""boom"",
            ""batchIds"":[]
        }";

        var result = HttpCorpusLaneRunner.ParseLaneResponse(false, json);
        result.Outcome.Should().Be(CorpusLaneRunOutcome.Failed);
        result.ErrorMessage.Should().Be("Imprv-Truth: boom");
    }

    [Fact]
    public void ParseLaneResponse_returns_Failed_when_response_status_is_not_Succeeded()
    {
        // 200 OK from the controller but status field says Failed.
        var json = @"{""lane"":""sales"",""status"":""Failed"",""batchIds"":[]}";
        var result = HttpCorpusLaneRunner.ParseLaneResponse(true, json);
        result.Outcome.Should().Be(CorpusLaneRunOutcome.Failed);
    }

    [Fact]
    public void ParseLaneResponse_handles_empty_response_text()
    {
        var result = HttpCorpusLaneRunner.ParseLaneResponse(true, string.Empty);
        result.Outcome.Should().Be(CorpusLaneRunOutcome.Failed);
        result.ErrorMessage.Should().Contain("Empty response");
    }

    [Fact]
    public void ParseLaneResponse_handles_invalid_json_gracefully()
    {
        var result = HttpCorpusLaneRunner.ParseLaneResponse(true, "not-json");
        result.Outcome.Should().Be(CorpusLaneRunOutcome.Failed);
        result.ErrorMessage.Should().Contain("parse");
    }

    [Fact]
    public void ParseLaneResponse_skips_invalid_batch_id_entries()
    {
        var goodId = Guid.NewGuid();
        var json = $@"{{
            ""lane"":""parcel"",
            ""status"":""Succeeded"",
            ""batchIds"":[""{goodId}"",""not-a-guid"",null,42]
        }}";
        var result = HttpCorpusLaneRunner.ParseLaneResponse(true, json);
        result.BatchIds.Should().ContainSingle().Which.Should().Be(goodId);
    }
}
