using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.API.Services.Gpt;

public interface IGptGroundedContextConsumer
{
    Task<GptGroundedContextConsumption> ConsumeAsync(
        GptGroundedContextRequest request,
        int? authenticatedCountyId,
        CancellationToken cancellationToken = default);
}

public enum GptGroundedContextConsumerFailure
{
    None = 0,
    InvalidRequest,
    QueryRejected,
    RetrievalFailed,
    RuntimeRejected,
    RuntimeUnavailable,
}

public sealed record GptGroundedContextConsumption(
    bool Success,
    GptGroundedContextConsumerFailure Failure,
    GptGroundedContextResult? Result,
    IReadOnlyList<GptGroundedContextViolation> Violations,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? SourceSchemaSha256,
    string? CopiedSchemaSha256,
    string? Message);
