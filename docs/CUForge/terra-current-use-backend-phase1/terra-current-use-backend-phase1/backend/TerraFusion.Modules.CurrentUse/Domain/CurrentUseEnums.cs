namespace TerraFusion.Modules.CurrentUse.Domain;

public enum ClassificationType
{
    OpenSpace,
    FarmAndAgricultural,
    TimberLand,
    DesignatedForestland,
    FarmAndAgConservationLand,
    Unknown
}

public enum CurrentUseLifecycleState
{
    DraftApplication,
    Submitted,
    UnderReview,
    ApprovedClassified,
    ActiveCompliant,
    ActiveMonitoring,
    TransferReviewRequired,
    ContinuancePending,
    ContinuanceAccepted,
    AtRisk,
    IntentToRemoveIssued,
    OwnerWithdrawalRequested,
    RemovalPending,
    Removed,
    Withdrawn,
    ReclassificationPending,
    Reclassified,
    Appealed,
    Closed
}

public enum RemovalType
{
    AssessorInitiatedRemoval,
    OwnerVoluntaryWithdrawal,
    TransferTriggeredRemoval,
    ChangeInUseRemoval,
    IncomeFailureRemoval,
    ErrorNoFaultRemoval,
    ExemptTransferRemoval,
    ReclassificationRemoval
}

public enum PenaltySuppressionReason
{
    QualifyingVoluntaryWithdrawal,
    StatutoryException,
    AuthorizedStaffOverride,
    NotApplicable
}

public enum StatutoryExceptionReason
{
    GovernmentTransferExchange,
    EminentDomain,
    NaturalDisaster,
    OfficialActionDisallowsUse,
    ChurchTransferExemption,
    QualifiedConservationAcquisition,
    FarmAgConservationRemoval,
    NewStatutoryExemption,
    ForestryRiparianEasement,
    ConservationEasement,
    PostDeathTransferRule,
    ErrorNoFaultOfOwner,
    GovernmentTimberManagementTransfer,
    None
}
