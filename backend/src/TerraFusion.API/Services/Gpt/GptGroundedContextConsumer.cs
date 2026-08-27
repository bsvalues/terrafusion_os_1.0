using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Interfaces;

namespace TerraFusion.API.Services.Gpt;

/// <summary>
/// Governed sovereign integration boundary for the GPT-owned grounded-context judgment.
/// The suite module validates the request before retrieval and validates the bounded citations
/// after retrieval. Provider generation is deliberately outside this read-only runtime path.
/// </summary>
public sealed class GptGroundedContextConsumer(
    IGptGroundedContextProcessHost processHost,
    IRAGService ragService,
    ILogger<GptGroundedContextConsumer> logger) : IGptGroundedContextConsumer
{
    private const string SchemaVersion = "1.0.0";
    private const string DatasetKeyPrefix = "rag-dataset:";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public async Task<GptGroundedContextConsumption> ConsumeAsync(
        GptGroundedContextRequest request,
        int? authenticatedCountyId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (authenticatedCountyId is null)
        {
            return await DeniedAsync(request, "COUNTY_CONTEXT_MISSING", cancellationToken)
                .ConfigureAwait(false);
        }

        var expectedCounty = authenticatedCountyId.Value.ToString(CultureInfo.InvariantCulture);
        if (!string.Equals(request.CountyId, expectedCounty, StringComparison.Ordinal))
        {
            return await DeniedAsync(request, "COUNTY_MISMATCH", cancellationToken)
                .ConfigureAwait(false);
        }

        if (!TryParseDatasetKey(request.DatasetKey, out var datasetId))
        {
            return await DeniedAsync(request, "DATASET_NOT_ALLOWED", cancellationToken)
                .ConfigureAwait(false);
        }

        // The first suite invocation is a real preflight, not a local regex shadow. It prevents
        // raw PII or a malformed request from reaching logs, embeddings, retrieval, or providers.
        var preflight = await ValidateAsync(
                request,
                Result(request, "NO_RELEVANT_CONTEXT", Array.Empty<GptGroundedCitation>()),
                cancellationToken)
            .ConfigureAwait(false);
        if (!preflight.Success)
        {
            var queryRejected = preflight.Violations.Any(violation =>
                string.Equals(violation.Class, "RAW_PII_QUERY", StringComparison.Ordinal));
            return preflight with
            {
                Failure = queryRejected
                    ? GptGroundedContextConsumerFailure.QueryRejected
                    : preflight.Failure,
            };
        }

        RAGSearchResult? search;
        try
        {
            search = await ragService.GetRelevantContextForCountyAsync(
                    datasetId,
                    authenticatedCountyId.Value,
                    request.QueryText,
                    request.TopK,
                    request.ScoreThreshold)
                .ConfigureAwait(false);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Grounded-context retrieval failed for dataset {DatasetId}; query text omitted",
                datasetId);
            return Failure(
                GptGroundedContextConsumerFailure.RetrievalFailed,
                "Grounded-context retrieval failed closed.",
                preflight);
        }

        if (search is null)
        {
            return await DeniedAsync(request, "DATASET_NOT_ALLOWED", cancellationToken)
                .ConfigureAwait(false);
        }

        var citations = search.ChunkDetails
            .Select(detail => new GptGroundedCitation
            {
                SourceId = $"rag-document:{detail.DocumentId.ToString(CultureInfo.InvariantCulture)}",
                ChunkId = $"rag-chunk:{detail.ChunkId.ToString(CultureInfo.InvariantCulture)}",
                ChunkIndex = detail.ChunkIndex,
                Excerpt = detail.TextSnippet,
                Score = detail.Score,
                SourceTitle = string.IsNullOrWhiteSpace(detail.DocumentTitle)
                    ? null
                    : detail.DocumentTitle,
            })
            .OrderByDescending(citation => citation.Score)
            .ThenBy(citation => citation.SourceId, StringComparer.Ordinal)
            .ThenBy(citation => citation.ChunkIndex)
            .ThenBy(citation => citation.ChunkId, StringComparer.Ordinal)
            .ToArray();

        var result = Result(
            request,
            citations.Length == 0 ? "NO_RELEVANT_CONTEXT" : "GROUNDED",
            citations);
        return await ValidateAsync(request, result, cancellationToken).ConfigureAwait(false);
    }

    private async Task<GptGroundedContextConsumption> DeniedAsync(
        GptGroundedContextRequest request,
        string denialCode,
        CancellationToken cancellationToken) =>
        await ValidateAsync(
                request,
                Result(request, "DENIED", Array.Empty<GptGroundedCitation>(), denialCode),
                cancellationToken)
            .ConfigureAwait(false);

    private async Task<GptGroundedContextConsumption> ValidateAsync(
        GptGroundedContextRequest request,
        GptGroundedContextResult result,
        CancellationToken cancellationToken)
    {
        var exchangeJson = JsonSerializer.Serialize(new { request, result }, JsonOptions);
        var validation = await processHost.ValidateAsync(exchangeJson, cancellationToken)
            .ConfigureAwait(false);
        if (!validation.Succeeded)
        {
            return new GptGroundedContextConsumption(
                false,
                GptGroundedContextConsumerFailure.RuntimeUnavailable,
                null,
                validation.Violations,
                validation.SourceModuleSha256,
                validation.CopiedModuleSha256,
                validation.SourceSchemaSha256,
                validation.CopiedSchemaSha256,
                "Canonical GPT runtime is unavailable.");
        }
        if (!validation.Accepted || validation.NormalizedExchangeJson is null)
        {
            return new GptGroundedContextConsumption(
                false,
                GptGroundedContextConsumerFailure.RuntimeRejected,
                null,
                validation.Violations,
                validation.SourceModuleSha256,
                validation.CopiedModuleSha256,
                validation.SourceSchemaSha256,
                validation.CopiedSchemaSha256,
                "The canonical GPT suite rejected the exchange.");
        }

        using var normalized = JsonDocument.Parse(validation.NormalizedExchangeJson);
        var normalizedResult = normalized.RootElement.GetProperty("result")
            .Deserialize<GptGroundedContextResult>(JsonOptions)
            ?? throw new InvalidOperationException("Canonical GPT output omitted the result.");
        return new GptGroundedContextConsumption(
            true,
            GptGroundedContextConsumerFailure.None,
            normalizedResult,
            validation.Violations,
            validation.SourceModuleSha256,
            validation.CopiedModuleSha256,
            validation.SourceSchemaSha256,
            validation.CopiedSchemaSha256,
            null);
    }

    private static GptGroundedContextResult Result(
        GptGroundedContextRequest request,
        string status,
        IReadOnlyList<GptGroundedCitation> citations,
        string? denialCode = null) => new()
    {
        SchemaVersion = SchemaVersion,
        CountyId = request.CountyId,
        DatasetKey = request.DatasetKey,
        Status = status,
        Citations = citations,
        TraceId = request.TraceId,
        DenialCode = denialCode,
    };

    private static bool TryParseDatasetKey(string? value, out int datasetId)
    {
        datasetId = 0;
        if (value is null || !value.StartsWith(DatasetKeyPrefix, StringComparison.Ordinal))
        {
            return false;
        }

        if (!int.TryParse(
                value.AsSpan(DatasetKeyPrefix.Length),
                NumberStyles.None,
                CultureInfo.InvariantCulture,
                out datasetId)
            || datasetId <= 0)
        {
            datasetId = 0;
            return false;
        }

        return string.Equals(
            value,
            $"{DatasetKeyPrefix}{datasetId.ToString(CultureInfo.InvariantCulture)}",
            StringComparison.Ordinal);
    }

    private static GptGroundedContextConsumption Failure(
        GptGroundedContextConsumerFailure failure,
        string message,
        GptGroundedContextConsumption identity) => identity with
    {
        Success = false,
        Failure = failure,
        Result = null,
        Message = message,
    };
}
