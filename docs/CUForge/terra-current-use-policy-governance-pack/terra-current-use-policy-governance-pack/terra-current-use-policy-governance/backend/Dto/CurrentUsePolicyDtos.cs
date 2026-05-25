
namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUsePolicyStatus
{
    Draft,
    Active,
    Superseded,
    Archived
}

public sealed record CurrentUsePolicyRuleDto(
    string RuleKey,
    string RuleType,
    string Value,
    string Description
);

public sealed record CurrentUsePolicyPackDto(
    Guid PolicyPackId,
    Guid CountyId,
    string PolicyPackName,
    string PolicyVersion,
    CurrentUsePolicyStatus Status,
    DateOnly EffectiveStartDate,
    DateOnly? EffectiveEndDate,
    IReadOnlyList<CurrentUsePolicyRuleDto> Rules,
    string Notes,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    DateTimeOffset UpdatedAt,
    string UpdatedBy
);

public sealed record ResolveCurrentUsePolicyRequestDto(
    Guid CountyId,
    DateOnly EvaluationDate
);

public sealed record ResolvedCurrentUsePolicyDto(
    Guid PolicyPackId,
    string PolicyVersion,
    IReadOnlyList<CurrentUsePolicyRuleDto> Rules,
    DateOnly EffectiveStartDate
);
