
namespace TerraFusion.Modules.CurrentUse.Dto;

public sealed record CurrentUseStatuteReferenceDto(
    string StateCode,
    string Citation,
    string Topic,
    string Summary,
    string EffectiveVersion,
    string SourceUrl
);

public sealed record CurrentUseRuleProvenanceDto(
    string RuleKey,
    string PolicyVersion,
    string Citation,
    string Explanation
);
