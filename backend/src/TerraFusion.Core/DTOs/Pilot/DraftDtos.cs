namespace TerraFusion.Core.DTOs.Pilot;

public record CreateDraftRequest(
    string CountyId,
    string ProposedBy,
    string ActionSummary,
    string ActionPayloadJson
);

public record ApproveDraftRequest(
    string CountyId,
    string HumanApproverId
);

public record RejectDraftRequest(
    string CountyId,
    string HumanApproverId,
    string Reason
);
