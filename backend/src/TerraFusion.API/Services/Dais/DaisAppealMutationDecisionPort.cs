using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services.Dais;

public sealed class DaisAppealMutationDecisionPort : IDaisAppealMutationDecisionPort
{
    private static readonly JsonSerializerOptions SerializerOptions = CreateSerializerOptions();

    private readonly IDaisAppealMutationProcessHost _processHost;
    private readonly DaisAppealMutationOptions _options;

    public DaisAppealMutationDecisionPort(
        IDaisAppealMutationProcessHost processHost,
        IOptions<DaisAppealMutationOptions> options)
    {
        _processHost = processHost;
        _options = options.Value;
    }

    public async Task<DaisAppealCreateDecisionResult> DecideCreateAsync(
        DaisAppealCreateDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        RequireRequestIdentity(
            request.SchemaVersion,
            request.Operation,
            request.CommandId,
            request.CountyId,
            request.EffectiveAt,
            DaisAppealMutationOperation.create);
        var resultJson = await InvokeAsync(
                JsonSerializer.Serialize(request, SerializerOptions),
                cancellationToken)
            .ConfigureAwait(false);
        var result = DeserializeExact<DaisAppealCreateDecisionResult>(resultJson);
        RequireResultIdentity(
            request.SchemaVersion,
            request.Operation,
            request.CommandId,
            request.CountyId,
            request.TraceId,
            result.SchemaVersion,
            result.Operation,
            result.CommandId,
            result.CountyId,
            result.TraceId);
        RequireDecisionShape(result.Decision, result.Mutation, result.Violations);
        return result;
    }

    public async Task<DaisAppealTransitionDecisionResult> DecideTransitionAsync(
        DaisAppealTransitionDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        RequireRequestIdentity(
            request.SchemaVersion,
            request.Operation,
            request.CommandId,
            request.CountyId,
            request.EffectiveAt,
            DaisAppealMutationOperation.transition);
        var resultJson = await InvokeAsync(
                JsonSerializer.Serialize(request, SerializerOptions),
                cancellationToken)
            .ConfigureAwait(false);
        var result = DeserializeExact<DaisAppealTransitionDecisionResult>(resultJson);
        RequireResultIdentity(
            request.SchemaVersion,
            request.Operation,
            request.CommandId,
            request.CountyId,
            request.TraceId,
            result.SchemaVersion,
            result.Operation,
            result.CommandId,
            result.CountyId,
            result.TraceId);
        RequireDecisionShape(result.Decision, result.Mutation, result.Violations);
        return result;
    }

    private async Task<string> InvokeAsync(
        string requestJson,
        CancellationToken cancellationToken)
    {
        if (_options.Mode != DaisAppealMutationMode.LocalExact)
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais appeal-mutation runtime is disabled.");
        }

        DaisAppealMutationProcessResult invocation;
        try
        {
            invocation = await _processHost.DecideAsync(
                    _options.ModulePath,
                    DaisAppealMutationOptions.ExpectedModuleSha256,
                    _options.SchemaPath,
                    DaisAppealMutationOptions.ExpectedSchemaSha256,
                    requestJson,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais appeal-mutation invocation failed.",
                exception);
        }

        if (invocation.Failure == DaisAppealMutationProcessFailure.Cancelled
            && cancellationToken.IsCancellationRequested)
        {
            cancellationToken.ThrowIfCancellationRequested();
        }
        if (!invocation.Success || string.IsNullOrWhiteSpace(invocation.ResultJson))
        {
            throw new DaisAppealMutationUnavailableException(
                $"Canonical Dais appeal-mutation failed closed with {invocation.Failure}: "
                + invocation.ErrorMessage);
        }
        if (!HasExactProvenance(invocation))
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais appeal-mutation did not prove exact module and schema identity.");
        }
        return invocation.ResultJson;
    }

    private static bool HasExactProvenance(DaisAppealMutationProcessResult result) =>
        string.Equals(
            result.SourceModuleSha256,
            DaisAppealMutationOptions.ExpectedModuleSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.CopiedModuleSha256,
            DaisAppealMutationOptions.ExpectedModuleSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.SourceSchemaSha256,
            DaisAppealMutationOptions.ExpectedSchemaSha256,
            StringComparison.Ordinal)
        && string.Equals(
            result.CopiedSchemaSha256,
            DaisAppealMutationOptions.ExpectedSchemaSha256,
            StringComparison.Ordinal);

    private static T DeserializeExact<T>(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            RejectDuplicateProperties(document.RootElement, "$");
            return JsonSerializer.Deserialize<T>(json, SerializerOptions)
                ?? throw new JsonException("Dais returned null JSON.");
        }
        catch (JsonException exception)
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais appeal-mutation returned invalid exact JSON.",
                exception);
        }
    }

    private static void RequireRequestIdentity(
        string schemaVersion,
        DaisAppealMutationOperation operation,
        string commandId,
        string countyId,
        DateTimeOffset effectiveAt,
        DaisAppealMutationOperation expectedOperation)
    {
        if (!string.Equals(schemaVersion, "1.0.0", StringComparison.Ordinal)
            || operation != expectedOperation
            || !IsCanonicalGuid(commandId)
            || !IsCanonicalGuid(countyId)
            || effectiveAt.Offset != TimeSpan.Zero)
        {
            throw new DaisAppealMutationUnavailableException(
                "Sovereign Dais appeal-mutation request identity is invalid.");
        }
    }

    private static void RequireResultIdentity(
        string expectedSchemaVersion,
        DaisAppealMutationOperation expectedOperation,
        string expectedCommandId,
        string expectedCountyId,
        string? expectedTraceId,
        string actualSchemaVersion,
        DaisAppealMutationOperation actualOperation,
        string actualCommandId,
        string actualCountyId,
        string? actualTraceId)
    {
        if (!string.Equals(actualSchemaVersion, expectedSchemaVersion, StringComparison.Ordinal)
            || actualOperation != expectedOperation
            || !string.Equals(actualCommandId, expectedCommandId, StringComparison.Ordinal)
            || !string.Equals(actualCountyId, expectedCountyId, StringComparison.Ordinal)
            || !string.Equals(actualTraceId, expectedTraceId, StringComparison.Ordinal))
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais appeal-mutation result identity is invalid.");
        }
    }

    private static void RequireDecisionShape<TMutation>(
        DaisAppealMutationDecision decision,
        TMutation? mutation,
        IReadOnlyList<DaisAppealMutationViolation> violations)
        where TMutation : class
    {
        if ((decision == DaisAppealMutationDecision.accepted
                && (mutation is null || violations.Count != 0))
            || (decision == DaisAppealMutationDecision.rejected
                && (mutation is not null || violations.Count == 0)))
        {
            throw new DaisAppealMutationUnavailableException(
                "Canonical Dais appeal-mutation result decision shape is invalid.");
        }
    }

    private static bool IsCanonicalGuid(string value) =>
        Guid.TryParseExact(value, "D", out var parsed)
        && string.Equals(parsed.ToString("D"), value, StringComparison.Ordinal);

    private static void RejectDuplicateProperties(JsonElement element, string location)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            var names = new HashSet<string>(StringComparer.Ordinal);
            foreach (var property in element.EnumerateObject())
            {
                if (!names.Add(property.Name))
                {
                    throw new JsonException($"Duplicate property at {location}.{property.Name}.");
                }
                RejectDuplicateProperties(property.Value, $"{location}.{property.Name}");
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            var index = 0;
            foreach (var item in element.EnumerateArray())
            {
                RejectDuplicateProperties(item, $"{location}[{index++}]");
            }
        }
    }

    private static JsonSerializerOptions CreateSerializerOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        };
        options.Converters.Add(new UtcZuluDateTimeOffsetConverter());
        return options;
    }

    private sealed class UtcZuluDateTimeOffsetConverter : JsonConverter<DateTimeOffset>
    {
        public override DateTimeOffset Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.String)
            {
                throw new JsonException("Dais timestamps must be strings.");
            }
            var text = reader.GetString();
            if (text is null
                || !text.EndsWith('Z')
                || !DateTimeOffset.TryParseExact(
                    text,
                    new[]
                    {
                        "yyyy-MM-dd'T'HH:mm:ss'Z'",
                        "yyyy-MM-dd'T'HH:mm:ss.FFFFFFF'Z'",
                    },
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                    out var value))
            {
                throw new JsonException("Dais timestamps must be valid RFC 3339 UTC-Z instants.");
            }
            return value;
        }

        public override void Write(
            Utf8JsonWriter writer,
            DateTimeOffset value,
            JsonSerializerOptions options)
        {
            if (value.Offset != TimeSpan.Zero)
            {
                throw new JsonException("Dais timestamps must have a zero UTC offset.");
            }
            writer.WriteStringValue(
                value.UtcDateTime.ToString(
                    "yyyy-MM-dd'T'HH:mm:ss.FFFFFFF'Z'",
                    CultureInfo.InvariantCulture));
        }
    }
}

internal sealed class UnavailableDaisAppealMutationDecisionPort(
    string message) : IDaisAppealMutationDecisionPort
{
    public Task<DaisAppealCreateDecisionResult> DecideCreateAsync(
        DaisAppealCreateDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromException<DaisAppealCreateDecisionResult>(
            new DaisAppealMutationUnavailableException(message));

    public Task<DaisAppealTransitionDecisionResult> DecideTransitionAsync(
        DaisAppealTransitionDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromException<DaisAppealTransitionDecisionResult>(
            new DaisAppealMutationUnavailableException(message));
}
