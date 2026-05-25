namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseAiAction
{
    SummarizeDocument,
    ExplainRule,
    ExplainCalculation,
    DraftNoticeLanguage,
    IdentifyMissingEvidence,
    CompareOwnerStatements,
    SummarizeTimeline,
    FlagPossibleInconsistency
}

public sealed record CurrentUseAiAssistRequestDto(
    CurrentUseAiAction Action,
    Guid ParcelId,
    Guid CountyId,
    Dictionary<string, object?> PromptContext,
    string RequestedBy
);

public sealed record CurrentUseAiAssistResponseDto(
    Guid ResponseId,
    CurrentUseAiAction Action,
    string Text,
    string Confidence,
    IReadOnlyList<string> Citations,
    string Disclaimer,
    DateTimeOffset CreatedAt
);
