using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Adapters;
using TerraFusion.API.Configuration;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Services.Dossier;

public interface IDossierEvidenceRegistryReadConsumer
{
    bool IsAvailable { get; }

    Task<DossierEvidenceRegistryReadConsumerResult> ConsumeAsync(
        DossierEvidenceRegistryReadRequest request,
        int total,
        IReadOnlyList<DossierEvidence> sourcePage,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Maps sovereign evidence records through the frozen OS adapter, then requires
/// acceptance by the exact staged Dossier projection module and schema.
/// </summary>
public sealed class DossierEvidenceRegistryReadConsumer : IDossierEvidenceRegistryReadConsumer
{
    private static readonly JsonSerializerOptions RequestSerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IDossierEvidenceRegistryReadProcessHost _processHost;
    private readonly DossierEvidenceRegistryReadOptions _options;

    public DossierEvidenceRegistryReadConsumer(
        IDossierEvidenceRegistryReadProcessHost processHost,
        IOptions<DossierEvidenceRegistryReadOptions> options)
    {
        _processHost = processHost;
        _options = options.Value;
    }

    public bool IsAvailable => _options.Mode == DossierEvidenceRegistryReadMode.LocalExact;

    public async Task<DossierEvidenceRegistryReadConsumerResult> ConsumeAsync(
        DossierEvidenceRegistryReadRequest request,
        int total,
        IReadOnlyList<DossierEvidence> sourcePage,
        CancellationToken cancellationToken = default)
    {
        if (_options.Mode != DossierEvidenceRegistryReadMode.LocalExact)
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.Disabled,
                "Canonical Dossier evidence-registry-read runtime is disabled.");
        }

        if (request is null || sourcePage is null)
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.InvalidRequest,
                "A frozen request and sovereign evidence records are required.");
        }

        string exchangeJson;
        JsonElement expectedRequest;
        JsonElement expectedResult;
        try
        {
            var requestJson = JsonSerializer.Serialize(request, RequestSerializerOptions);
            var resultJson = DossierEvidenceRegistryReadAdapter.Serialize(request, total, sourcePage);
            exchangeJson = $"{{\"request\":{requestJson},\"result\":{resultJson}}}";

            using var expectedExchange = JsonDocument.Parse(exchangeJson);
            expectedRequest = expectedExchange.RootElement.GetProperty("request").Clone();
            expectedResult = expectedExchange.RootElement.GetProperty("result").Clone();
        }
        catch (Exception exception) when (
            exception is ArgumentException or InvalidOperationException or JsonException)
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.InvalidRequest,
                $"The sovereign evidence records violate the frozen Dossier contract: {exception.Message}");
        }

        DossierEvidenceRegistryReadProcessResult validation;
        try
        {
            validation = await _processHost.ValidateAsync(
                    _options.ModulePath,
                    DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
                    _options.SchemaPath,
                    DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
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
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.RuntimeFailed,
                "Canonical Dossier evidence-registry-read invocation failed.");
        }

        if (validation.Failure == DossierEvidenceRegistryReadFailure.Cancelled
            && cancellationToken.IsCancellationRequested)
        {
            cancellationToken.ThrowIfCancellationRequested();
        }

        if (validation.Outcome == DossierEvidenceRegistryReadOutcome.Rejected)
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.RuntimeRejected,
                "The exact Dossier module rejected the evidence-registry-read exchange.");
        }

        if (!validation.Success || validation.Outcome != DossierEvidenceRegistryReadOutcome.Accepted)
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.RuntimeFailed,
                $"The exact Dossier module failed closed with {validation.Failure}/{validation.Outcome}.");
        }

        if (!HasExactProvenance(validation))
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.ProvenanceMismatch,
                "The Dossier runtime did not prove the exact module and schema byte identities.");
        }

        if (!string.Equals(validation.RequestCountyId, request.CountyId, StringComparison.Ordinal)
            || !string.Equals(validation.ResultCountyId, request.CountyId, StringComparison.Ordinal)
            || string.IsNullOrWhiteSpace(validation.NormalizedExchangeJson))
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.IdentityMismatch,
                "The Dossier runtime returned mismatched request or result identity.");
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
                return DossierEvidenceRegistryReadConsumerResult.Failed(
                    DossierEvidenceRegistryReadConsumerFailure.IdentityMismatch,
                    "The Dossier runtime changed the exact request or result identity.");
            }

            return DossierEvidenceRegistryReadConsumerResult.Accepted(
                normalizedResult.GetRawText(),
                validation.SourceModuleSha256!,
                validation.CopiedModuleSha256!,
                validation.SourceSchemaSha256!,
                validation.CopiedSchemaSha256!);
        }
        catch (JsonException)
        {
            return DossierEvidenceRegistryReadConsumerResult.Failed(
                DossierEvidenceRegistryReadConsumerFailure.IdentityMismatch,
                "The Dossier runtime returned invalid normalized exchange JSON.");
        }
    }

    private static bool HasExactProvenance(DossierEvidenceRegistryReadProcessResult result) =>
        string.Equals(
            result.SourceModuleSha256,
            DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.CopiedModuleSha256,
            DossierEvidenceRegistryReadOptions.ExpectedModuleSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.SourceSchemaSha256,
            DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.CopiedSchemaSha256,
            DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256,
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

public enum DossierEvidenceRegistryReadConsumerOutcome
{
    Accepted,
    Failed,
}

public enum DossierEvidenceRegistryReadConsumerFailure
{
    None,
    Disabled,
    InvalidRequest,
    RuntimeRejected,
    RuntimeFailed,
    ProvenanceMismatch,
    IdentityMismatch,
}

public sealed record DossierEvidenceRegistryReadConsumerResult(
    DossierEvidenceRegistryReadConsumerOutcome Outcome,
    DossierEvidenceRegistryReadConsumerFailure Failure,
    string? NormalizedResultJson,
    string? ErrorMessage,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? SourceSchemaSha256,
    string? CopiedSchemaSha256)
{
    public bool Success => Outcome == DossierEvidenceRegistryReadConsumerOutcome.Accepted
        && Failure == DossierEvidenceRegistryReadConsumerFailure.None;

    public static DossierEvidenceRegistryReadConsumerResult Accepted(
        string normalizedResultJson,
        string sourceModuleSha256,
        string copiedModuleSha256,
        string sourceSchemaSha256,
        string copiedSchemaSha256) =>
        new(
            DossierEvidenceRegistryReadConsumerOutcome.Accepted,
            DossierEvidenceRegistryReadConsumerFailure.None,
            normalizedResultJson,
            null,
            sourceModuleSha256,
            copiedModuleSha256,
            sourceSchemaSha256,
            copiedSchemaSha256);

    public static DossierEvidenceRegistryReadConsumerResult Failed(
        DossierEvidenceRegistryReadConsumerFailure failure,
        string errorMessage) =>
        new(
            DossierEvidenceRegistryReadConsumerOutcome.Failed,
            failure,
            null,
            errorMessage,
            null,
            null,
            null,
            null);
}
