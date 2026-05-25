namespace TerraFusion.Modules.CurrentUse.Domain.Notices;

public enum CurrentUseNoticeType
{
    RequestForInformationVerifyIntent,
    NoticeOfContinuance,
    NoticeOfIntentToRemove,
    NoticeOfRemoval,
    NoticeOfOwnerRequestToWithdraw,
    VoluntaryWithdrawalInstructions,
    FarmPlanRequest,
    MissingEvidenceRequest,
    ReclassificationOptionNotice
}

public enum CurrentUseNoticeStatus
{
    Draft,
    PreviewGenerated,
    PendingHumanReview,
    ApprovedForIssuance,
    Issued,
    Voided
}
