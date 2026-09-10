using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Configuration;
using TerraFusion.Data;
using CoreEntities = TerraFusion.Core.Entities;

namespace TerraFusion.API.Services.Gpt;

/// <summary>OS custody, scoped retrieval, actual inference, canonical judgment, then one durable write.</summary>
public sealed class GptGroundedAnswerService(TerraFusionDbContext db,
    IGptGroundedContextConsumer contextConsumer, IGptLocalInferenceProvider provider,
    IGptGroundedAnswerProcessHost validator, IOptions<GptLocalInferenceOptions> configured)
    : IGptGroundedAnswerService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    public async Task<GPTMessage> SendAsync(int configId, int conversationId, string question,
        string userId, int countyId, string traceId, CancellationToken cancellationToken = default)
    {
        var (config, dataset) = await AuthorizeAsync(configId, conversationId, userId, countyId, cancellationToken);
        var priorEnvelope = await db.Set<GPTMessage>().AsNoTracking()
            .Where(value => value.ConversationId == conversationId && value.FunctionName == "gpt.grounded-answer@1.0.0")
            .OrderByDescending(value => value.Id).Select(value => value.FunctionResult).FirstOrDefaultAsync(cancellationToken);
        if (priorEnvelope is not null)
        {
            var prior = JsonNode.Parse(priorEnvelope)?["result"];
            if (prior?["datasetKey"]?.GetValue<string>() != $"rag-dataset:{dataset.Id.ToString(CultureInfo.InvariantCulture)}"
                || prior?["countyId"]?.GetValue<string>() != countyId.ToString(CultureInfo.InvariantCulture))
                throw new UnauthorizedAccessException("GPT conversation grounding scope changed; start a new conversation.");
        }
        var request = new GptGroundedContextRequest
        {
            SchemaVersion = "1.0.0", CountyId = countyId.ToString(CultureInfo.InvariantCulture),
            DatasetKey = $"rag-dataset:{dataset.Id.ToString(CultureInfo.InvariantCulture)}",
            QueryText = question, TopK = config.RAGTopK, ScoreThreshold = config.RAGScoreThreshold,
            TraceId = traceId,
        };
        var context = await contextConsumer.ConsumeAsync(request, countyId, cancellationToken);
        if (!context.Success || context.Result is null)
            throw new InvalidOperationException("Grounded context unavailable or rejected; no answer was persisted.");
        cancellationToken.ThrowIfCancellationRequested();
        var result = new JsonObject
        {
            ["schemaVersion"] = "1.0.0", ["countyId"] = request.CountyId,
            ["datasetKey"] = request.DatasetKey, ["traceId"] = traceId,
            ["status"] = context.Result.Status, ["citations"] = new JsonArray(),
        };
        if (context.Result.Status == "GROUNDED")
        {
            var generated = await provider.GenerateAsync(question, context.Result.Citations, cancellationToken);
            result["status"] = generated.Status;
            if (generated.FailureCode is not null) result["failureCode"] = generated.FailureCode;
            if (generated.Generated is not null)
            {
                foreach (var field in generated.Generated) result[field.Key] = field.Value?.DeepClone();
            }
        }
        else if (context.Result.Status == "DENIED") result["failureCode"] = context.Result.DenialCode;
        var exchange = new JsonObject
        {
            ["context"] = new JsonObject
            {
                ["request"] = JsonSerializer.SerializeToNode(request, JsonOptions),
                ["result"] = JsonSerializer.SerializeToNode(context.Result, JsonOptions),
            },
            ["result"] = result,
        };
        var judged = await validator.ValidateAsync(exchange.ToJsonString(JsonOptions), cancellationToken);
        if (!judged.Succeeded || !judged.Accepted || judged.NormalizedExchangeJson is null)
            throw new InvalidOperationException("Grounded answer unavailable or rejected; no answer was persisted.");
        var canonical = JsonNode.Parse(judged.NormalizedExchangeJson)!["result"]!.AsObject();

        // Re-read authoritative scope/metadata after provider latency, before attaching any writes.
        var (currentConfig, currentDataset) = await AuthorizeAsync(configId, conversationId, userId, countyId, cancellationToken);
        if (currentDataset.Id != dataset.Id || currentConfig.RAGTopK != config.RAGTopK
            || currentConfig.RAGScoreThreshold != config.RAGScoreThreshold
            || currentConfig.RequiredRole != config.RequiredRole || currentConfig.AllowedCounties != config.AllowedCounties)
            throw new UnauthorizedAccessException("GPT grounding scope changed during generation.");
        cancellationToken.ThrowIfCancellationRequested();
        var now = DateTime.UtcNow;
        var message = new GPTMessage
        {
            ConversationId = conversationId, Role = "assistant", CreatedAt = now,
            Content = canonical["answer"]?.GetValue<string>() ?? string.Empty,
            Provider = canonical["provider"]?.GetValue<string>(), ModelUsed = canonical["model"]?.GetValue<string>(),
            FunctionName = "gpt.grounded-answer@1.0.0", FunctionResult = judged.NormalizedExchangeJson,
            FunctionArgs = JsonSerializer.Serialize(new
            {
                sourceCommit = GptGroundedAnswerRuntimeOptions.ExpectedCommit,
                moduleSha256 = GptGroundedAnswerRuntimeOptions.Artifacts[0].Sha256,
                specificationSha256 = GptGroundedAnswerRuntimeOptions.Artifacts[3].Sha256,
            }),
            FinishReason = canonical["status"]!.GetValue<string>(),
            RAGDocumentsUsed = canonical["citations"]!.ToJsonString(),
        };
        var audit = new GPTAudit
        {
            Message = message, ConversationId = conversationId, GPTConfigurationId = configId,
            UserId = userId, CountyId = countyId, CreatedAt = now,
            RAGUsed = context.Result.Status == "GROUNDED", RAGDatasetId = dataset.Id,
            RAGChunkDetails = JsonSerializer.Serialize(context.Result.Citations, JsonOptions),
            RAGDocumentIds = canonical["citations"]!.ToJsonString(),
            RAGChunksRetrieved = context.Result.Citations.Count,
            EmbeddingProvider = context.Result.Status == "GROUNDED" ? dataset.EmbeddingProvider : null,
            EmbeddingModel = context.Result.Status == "GROUNDED" ? dataset.EmbeddingModel : null,
            LLMProvider = message.Provider, LLMModel = message.ModelUsed,
        };
        db.Set<GPTMessage>().Add(new GPTMessage
        { ConversationId = conversationId, Role = "user", Content = question, CreatedAt = now });
        db.Set<GPTMessage>().Add(message);
        db.Set<GPTAudit>().Add(audit);
        var conversation = await db.Set<CoreEntities.GPTConversation>().SingleAsync(value => value.Id == conversationId, cancellationToken);
        conversation.TotalMessages += 2;
        conversation.LastMessageAt = now;
        conversation.UpdatedAt = now;
        // Legacy nonnullable token/cost columns cannot represent unknown. The canonical envelope
        // is the usage authority; never fabricate totals, cost, or a GPTUsageMetric from defaults.
        await db.SaveChangesAsync(cancellationToken);
        return message;
    }

    private async Task<(CoreEntities.GPTConfiguration Config, RAGDataset Dataset)> AuthorizeAsync(
        int configId, int conversationId, string userId, int countyId, CancellationToken cancellation)
    {
        if (countyId < 0 || string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedAccessException();
        var conversation = await db.Set<CoreEntities.GPTConversation>().AsNoTracking().SingleOrDefaultAsync(
            value => value.Id == conversationId && value.CountyId == countyId && value.UserId == userId
                && value.GPTConfigurationId == configId && value.Status == "Active", cancellation);
        var config = await db.Set<CoreEntities.GPTConfiguration>().AsNoTracking().SingleOrDefaultAsync(
            value => value.Id == configId && value.CountyId == countyId && value.Status == "Active", cancellation);
        if (conversation is null || config is null || !config.EnableRAG || config.RAGDatasetId is null)
            throw new UnauthorizedAccessException("GPT conversation/configuration scope is not admitted.");
        var dataset = await db.Set<RAGDataset>().AsNoTracking().SingleOrDefaultAsync(
            value => value.Id == config.RAGDatasetId && value.CountyId == countyId && value.Status == "Active", cancellation);
        if (dataset is null) throw new UnauthorizedAccessException("GPT dataset scope is not admitted.");
        var options = configured.Value;
        if (dataset.EmbeddingProvider != "ollama" || string.IsNullOrWhiteSpace(options.EmbeddingModel)
            || dataset.EmbeddingModel != options.EmbeddingModel || options.EmbeddingDimensions <= 0
            || dataset.VectorDimension != options.EmbeddingDimensions)
            throw new InvalidOperationException("Existing embedding metadata is incompatible with admitted local retrieval.");
        if (config.ModelProvider != "ollama" || config.ModelName != options.Model)
            throw new InvalidOperationException("GPT model configuration is incompatible with admitted local inference.");
        return (config, dataset);
    }
}
