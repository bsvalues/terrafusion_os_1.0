using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Adapters;
using TerraFusion.API.Configuration;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Services.Dais;

public interface IDaisAppealWorkflowConsumer
{
    Task<DaisAppealWorkflowConsumerResult> ConsumeAsync(
        DaisAppealWorkflowReadRequest request,
        IReadOnlyList<Appeal> appeals,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Maps sovereign appeal records through the frozen OS adapter, then requires
/// acceptance by the exact staged Dais projection module and schema.
/// </summary>
public sealed class DaisAppealWorkflowConsumer : IDaisAppealWorkflowConsumer
{
    private static readonly JsonSerializerOptions RequestSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IDaisAppealWorkflowProcessHost _processHost;
    private readonly DaisAppealWorkflowOptions _options;

    public DaisAppealWorkflowConsumer(
        IDaisAppealWorkflowProcessHost processHost,
        IOptions<DaisAppealWorkflowOptions> options)
    {
        _processHost = processHost;
        _options = options.Value;
    }

    public async Task<DaisAppealWorkflowConsumerResult> ConsumeAsync(
        DaisAppealWorkflowReadRequest request,
        IReadOnlyList<Appeal> appeals,
        CancellationToken cancellationToken = default)
    {
        if (_options.Mode != DaisAppealWorkflowMode.LocalExact)
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.Disabled,
                "Canonical Dais appeal-workflow runtime is disabled.");
        }

        if (request is null || appeals is null)
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.InvalidRequest,
                "A frozen request and sovereign appeal records are required.");
        }

        string exchangeJson;
        JsonElement expectedRequest;
        JsonElement expectedResult;
        try
        {
            var requestJson = JsonSerializer.Serialize(request, RequestSerializerOptions);
            var resultJson = DaisAppealWorkflowReadAdapter.Serialize(request, appeals);
            exchangeJson = $"{{\"request\":{requestJson},\"result\":{resultJson}}}";

            using var expectedExchange = JsonDocument.Parse(exchangeJson);
            expectedRequest = expectedExchange.RootElement.GetProperty("request").Clone();
            expectedResult = expectedExchange.RootElement.GetProperty("result").Clone();
        }
        catch (Exception exception) when (
            exception is ArgumentException or InvalidOperationException or JsonException)
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.InvalidRequest,
                $"The sovereign appeal records violate the frozen Dais contract: {exception.Message}");
        }

        DaisAppealWorkflowProcessResult validation;
        try
        {
            validation = await _processHost.ValidateAsync(
                    _options.ModulePath,
                    DaisAppealWorkflowOptions.ExpectedModuleSha256,
                    _options.SchemaPath,
                    DaisAppealWorkflowOptions.ExpectedSchemaSha256,
                    exchangeJson,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.RuntimeFailed,
                "Canonical Dais appeal-workflow invocation failed.");
        }

        if (validation.Failure == DaisAppealWorkflowFailure.Cancelled
            && cancellationToken.IsCancellationRequested)
        {
            cancellationToken.ThrowIfCancellationRequested();
        }

        if (validation.Outcome == DaisAppealWorkflowOutcome.Rejected)
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.RuntimeRejected,
                "The exact Dais module rejected the appeal-workflow exchange.");
        }

        if (!validation.Success || validation.Outcome != DaisAppealWorkflowOutcome.Accepted)
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.RuntimeFailed,
                $"The exact Dais module failed closed with {validation.Failure}/{validation.Outcome}.");
        }

        if (!HasExactProvenance(validation))
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.ProvenanceMismatch,
                "The Dais runtime did not prove the exact module and schema byte identities.");
        }

        if (!string.Equals(validation.RequestCountyId, request.CountyId, StringComparison.Ordinal)
            || !string.Equals(validation.ResultCountyId, request.CountyId, StringComparison.Ordinal)
            || string.IsNullOrWhiteSpace(validation.NormalizedExchangeJson))
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.IdentityMismatch,
                "The Dais runtime returned mismatched request or result identity.");
        }

        try
        {
            using var normalizedExchange = JsonDocument.Parse(validation.NormalizedExchangeJson);
            if (!TryReadExactExchange(
                    normalizedExchange.RootElement,
                    out var normalizedRequest,
                    out var normalizedResult)
                || !JsonIdentityEquals(expectedRequest, normalizedRequest)
                || !JsonIdentityEquals(expectedResult, normalizedResult))
            {
                return DaisAppealWorkflowConsumerResult.Failed(
                    DaisAppealWorkflowConsumerFailure.IdentityMismatch,
                    "The Dais runtime changed the exact request or result identity.");
            }

            return DaisAppealWorkflowConsumerResult.Accepted(
                normalizedResult.GetRawText(),
                validation.SourceModuleSha256!,
                validation.CopiedModuleSha256!,
                validation.SourceSchemaSha256!,
                validation.CopiedSchemaSha256!);
        }
        catch (JsonException)
        {
            return DaisAppealWorkflowConsumerResult.Failed(
                DaisAppealWorkflowConsumerFailure.IdentityMismatch,
                "The Dais runtime returned invalid normalized exchange JSON.");
        }
    }

    private static bool HasExactProvenance(DaisAppealWorkflowProcessResult result) =>
        string.Equals(
            result.SourceModuleSha256,
            DaisAppealWorkflowOptions.ExpectedModuleSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.CopiedModuleSha256,
            DaisAppealWorkflowOptions.ExpectedModuleSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.SourceSchemaSha256,
            DaisAppealWorkflowOptions.ExpectedSchemaSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.CopiedSchemaSha256,
            DaisAppealWorkflowOptions.ExpectedSchemaSha256,
            StringComparison.Ordinal);

    private static bool TryReadExactExchange(
        JsonElement exchange,
        out JsonElement request,
        out JsonElement result)
    {
        request = default;
        result = default;
        if (exchange.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        var count = 0;
        var requestCount = 0;
        var resultCount = 0;
        foreach (var property in exchange.EnumerateObject())
        {
            count++;
            if (string.Equals(property.Name, "request", StringComparison.Ordinal))
            {
                requestCount++;
                request = property.Value;
            }
            else if (string.Equals(property.Name, "result", StringComparison.Ordinal))
            {
                resultCount++;
                result = property.Value;
            }
        }

        return count == 2 && requestCount == 1 && resultCount == 1;
    }

    private static bool JsonIdentityEquals(JsonElement expected, JsonElement actual)
    {
        if (expected.ValueKind != actual.ValueKind)
        {
            return false;
        }

        switch (expected.ValueKind)
        {
            case JsonValueKind.Object:
                var expectedProperties = expected.EnumerateObject().ToArray();
                var actualProperties = actual.EnumerateObject().ToArray();
                if (expectedProperties.Length != actualProperties.Length
                    || expectedProperties.Select(property => property.Name).Distinct(StringComparer.Ordinal).Count()
                        != expectedProperties.Length
                    || actualProperties.Select(property => property.Name).Distinct(StringComparer.Ordinal).Count()
                        != actualProperties.Length)
                {
                    return false;
                }

                foreach (var property in expectedProperties)
                {
                    if (!actual.TryGetProperty(property.Name, out var actualValue)
                        || !JsonIdentityEquals(property.Value, actualValue))
                    {
                        return false;
                    }
                }

                return true;

            case JsonValueKind.Array:
                var expectedItems = expected.EnumerateArray().ToArray();
                var actualItems = actual.EnumerateArray().ToArray();
                return expectedItems.Length == actualItems.Length
                    && expectedItems.Zip(actualItems, JsonIdentityEquals).All(equal => equal);

            case JsonValueKind.String:
                return string.Equals(expected.GetString(), actual.GetString(), StringComparison.Ordinal);

            case JsonValueKind.Number:
                return string.Equals(expected.GetRawText(), actual.GetRawText(), StringComparison.Ordinal);

            case JsonValueKind.True:
            case JsonValueKind.False:
            case JsonValueKind.Null:
                return true;

            default:
                return false;
        }
    }
}

public enum DaisAppealWorkflowConsumerOutcome
{
    Accepted,
    Failed,
}

public enum DaisAppealWorkflowConsumerFailure
{
    None,
    Disabled,
    InvalidRequest,
    RuntimeRejected,
    RuntimeFailed,
    ProvenanceMismatch,
    IdentityMismatch,
}

public sealed record DaisAppealWorkflowConsumerResult(
    DaisAppealWorkflowConsumerOutcome Outcome,
    DaisAppealWorkflowConsumerFailure Failure,
    string? NormalizedResultJson,
    string? ErrorMessage,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? SourceSchemaSha256,
    string? CopiedSchemaSha256)
{
    public bool Success => Outcome == DaisAppealWorkflowConsumerOutcome.Accepted
        && Failure == DaisAppealWorkflowConsumerFailure.None;

    public static DaisAppealWorkflowConsumerResult Accepted(
        string normalizedResultJson,
        string sourceModuleSha256,
        string copiedModuleSha256,
        string sourceSchemaSha256,
        string copiedSchemaSha256) =>
        new(
            DaisAppealWorkflowConsumerOutcome.Accepted,
            DaisAppealWorkflowConsumerFailure.None,
            normalizedResultJson,
            null,
            sourceModuleSha256,
            copiedModuleSha256,
            sourceSchemaSha256,
            copiedSchemaSha256);

    public static DaisAppealWorkflowConsumerResult Failed(
        DaisAppealWorkflowConsumerFailure failure,
        string errorMessage) =>
        new(
            DaisAppealWorkflowConsumerOutcome.Failed,
            failure,
            null,
            errorMessage,
            null,
            null,
            null,
            null);
}
