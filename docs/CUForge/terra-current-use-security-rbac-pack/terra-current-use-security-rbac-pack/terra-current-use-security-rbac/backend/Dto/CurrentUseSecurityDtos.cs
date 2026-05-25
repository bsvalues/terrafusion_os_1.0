namespace TerraFusion.Modules.CurrentUse.Dto;

public enum CurrentUsePermission
{
    ViewCurrentUse,
    EditClassificationMetadata,
    RunRollbackCalculation,
    LockRollbackCalculation,
    PreviewNotice,
    ApproveNotice,
    IssueNotice,
    VoidNotice,
    ViewEvidence,
    ReviewEvidence,
    LinkEvidenceDocument,
    ViewAuditTrace,
    ViewPolicyPacks,
    ManagePolicyPacks,
    ViewWorkflowTasks,
    ManageWorkflowTasks,
    ViewSpatialReview,
    ViewTreasurerHandoff,
    CreateTreasurerHandoff,
    MarkTreasurerPaymentPaid,
    ViewAppeals,
    ManageAppeals,
    ViewCompliance,
    ManageInspections,
    ViewAnalytics,
    ManageImports,
    UseAiAssist
}

public sealed record CurrentUseRoleDto(
    string RoleKey,
    string DisplayName,
    IReadOnlyList<CurrentUsePermission> Permissions
);

public sealed record CurrentUseAuthorizationRequestDto(
    string UserId,
    IReadOnlyList<string> Roles,
    CurrentUsePermission Permission,
    Guid CountyId,
    Guid? ParcelId
);

public sealed record CurrentUseAuthorizationResultDto(
    bool Allowed,
    string Reason,
    CurrentUsePermission Permission
);
