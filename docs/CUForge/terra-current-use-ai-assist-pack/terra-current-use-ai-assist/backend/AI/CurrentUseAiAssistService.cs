using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.AI;

public interface ICurrentUseAiAssistService
{
    Task<CurrentUseAiAssistResponseDto> AssistAsync(
        CurrentUseAiAssistRequestDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseAiAssistService : ICurrentUseAiAssistService
{
    public Task<CurrentUseAiAssistResponseDto> AssistAsync(
        CurrentUseAiAssistRequestDto request,
        CancellationToken cancellationToken)
    {
        CurrentUseAiGuardrails.AssertAllowed(request.Action.ToString());

        var text = request.Action switch
        {
            CurrentUseAiAction.ExplainCalculation =>
                "Rollback compares Current Use tax against true and fair value tax for each rollback year, then adds interest and any applicable penalty. This is an explanation only, not a final tax determination.",

            CurrentUseAiAction.IdentifyMissingEvidence =>
                "Review evidence checklist for missing income proof, lease documents, farm plan, continuance response, and inspection notes.",

            CurrentUseAiAction.SummarizeTimeline =>
                "Summarize classification, evidence, notice, calculation, and review events in chronological order.",

            CurrentUseAiAction.DraftNoticeLanguage =>
                "Draft language must include parcel context, reason for review, response deadline, assessor contact, and human-review disclaimer.",

            _ => "Current Use AI assist placeholder. Wire to TerraPilot/RAG layer when available."
        };

        var response = new CurrentUseAiAssistResponseDto(
            Guid.NewGuid(),
            request.Action,
            text,
            "MEDIUM",
            Array.Empty<string>(),
            CurrentUseAiGuardrails.Disclaimer,
            DateTimeOffset.UtcNow);

        return Task.FromResult(response);
    }
}
