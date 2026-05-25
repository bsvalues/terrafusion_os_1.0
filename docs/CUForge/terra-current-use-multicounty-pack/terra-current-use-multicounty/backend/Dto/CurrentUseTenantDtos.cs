namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUseTenantStatus
{
    Draft,
    Onboarding,
    Active,
    Suspended,
    Archived
}

public sealed record CurrentUseCountyTenantDto(
    Guid CountyId,
    string CountyName,
    string StateCode,
    CurrentUseTenantStatus Status,
    string PolicyVersion,
    string Theme,
    bool AiAssistEnabled,
    bool AtlasEnabled,
    bool DossierEnabled,
    bool DaisEnabled,
    bool TreasurerEnabled,
    DateTimeOffset CreatedAt,
    string CreatedBy
);

public sealed record CreateCurrentUseCountyTenantDto(
    Guid CountyId,
    string CountyName,
    string StateCode,
    string PolicyVersion,
    string Theme,
    string CreatedBy
);
