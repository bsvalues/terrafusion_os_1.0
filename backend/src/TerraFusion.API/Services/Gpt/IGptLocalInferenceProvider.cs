using System.Text.Json.Nodes;
using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.API.Services.Gpt;

public interface IGptLocalInferenceProvider
{
    Task<GptLocalInferenceResult> GenerateAsync(string question,
        IReadOnlyList<GptGroundedCitation> sources, CancellationToken cancellationToken = default);
}

public sealed record GptLocalInferenceResult(string Status, string? FailureCode, JsonObject? Generated);
