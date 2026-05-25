using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Security;

public static class CurrentUseRoleCatalog
{
    public const string Viewer = "current-use.viewer";
    public const string Appraiser = "current-use.appraiser";
    public const string Supervisor = "current-use.supervisor";
    public const string Treasurer = "current-use.treasurer";
    public const string Auditor = "current-use.auditor";
    public const string Admin = "current-use.admin";

    public static IReadOnlyList<CurrentUseRoleDto> GetRoles()
    {
        return
        [
            new CurrentUseRoleDto(
                Viewer,
                "Current Use Viewer",
                [
                    CurrentUsePermission.ViewCurrentUse,
                    CurrentUsePermission.ViewEvidence,
                    CurrentUsePermission.ViewAuditTrace,
                    CurrentUsePermission.ViewPolicyPacks
                ]),

            new CurrentUseRoleDto(
                Appraiser,
                "Current Use Appraiser",
                [
                    CurrentUsePermission.ViewCurrentUse,
                    CurrentUsePermission.EditClassificationMetadata,
                    CurrentUsePermission.RunRollbackCalculation,
                    CurrentUsePermission.PreviewNotice,
                    CurrentUsePermission.ViewEvidence,
                    CurrentUsePermission.ReviewEvidence,
                    CurrentUsePermission.LinkEvidenceDocument,
                    CurrentUsePermission.ViewAuditTrace,
                    CurrentUsePermission.ViewWorkflowTasks,
                    CurrentUsePermission.ManageWorkflowTasks,
                    CurrentUsePermission.ViewSpatialReview,
                    CurrentUsePermission.ViewAppeals,
                    CurrentUsePermission.ViewCompliance,
                    CurrentUsePermission.ManageInspections
                ]),

            new CurrentUseRoleDto(
                Supervisor,
                "Current Use Supervisor",
                [
                    CurrentUsePermission.ViewCurrentUse,
                    CurrentUsePermission.EditClassificationMetadata,
                    CurrentUsePermission.RunRollbackCalculation,
                    CurrentUsePermission.LockRollbackCalculation,
                    CurrentUsePermission.PreviewNotice,
                    CurrentUsePermission.ApproveNotice,
                    CurrentUsePermission.IssueNotice,
                    CurrentUsePermission.ViewEvidence,
                    CurrentUsePermission.ReviewEvidence,
                    CurrentUsePermission.LinkEvidenceDocument,
                    CurrentUsePermission.ViewAuditTrace,
                    CurrentUsePermission.ViewPolicyPacks,
                    CurrentUsePermission.ViewWorkflowTasks,
                    CurrentUsePermission.ManageWorkflowTasks,
                    CurrentUsePermission.ViewAppeals,
                    CurrentUsePermission.ManageAppeals,
                    CurrentUsePermission.ViewCompliance,
                    CurrentUsePermission.ManageInspections,
                    CurrentUsePermission.UseAiAssist
                ]),

            new CurrentUseRoleDto(
                Treasurer,
                "Treasurer Current Use Payment Clerk",
                [
                    CurrentUsePermission.ViewCurrentUse,
                    CurrentUsePermission.ViewTreasurerHandoff,
                    CurrentUsePermission.MarkTreasurerPaymentPaid,
                    CurrentUsePermission.ViewAuditTrace
                ]),

            new CurrentUseRoleDto(
                Auditor,
                "Current Use Auditor",
                [
                    CurrentUsePermission.ViewCurrentUse,
                    CurrentUsePermission.ViewEvidence,
                    CurrentUsePermission.ViewAuditTrace,
                    CurrentUsePermission.ViewPolicyPacks,
                    CurrentUsePermission.ViewAnalytics
                ]),

            new CurrentUseRoleDto(
                Admin,
                "Current Use Administrator",
                Enum.GetValues<CurrentUsePermission>())
        ];
    }
}
