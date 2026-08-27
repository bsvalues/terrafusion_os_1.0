namespace TerraFusion.API.Services.Gpt;

public interface IGptGroundedContextProcessHost
{
    Task<GptGroundedContextProcessResult> ValidateAsync(
        string exchangeJson,
        CancellationToken cancellationToken = default);
}

public sealed record GptGroundedContextViolation(string Class, string Message);

public sealed record GptGroundedContextProcessResult(
    bool Succeeded,
    bool Accepted,
    IReadOnlyList<GptGroundedContextViolation> Violations,
    string? NormalizedExchangeJson,
    string? SourceModuleSha256,
    string? CopiedModuleSha256,
    string? SourceSchemaSha256,
    string? CopiedSchemaSha256,
    string? Failure);
