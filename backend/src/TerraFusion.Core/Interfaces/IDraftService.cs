using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

public interface IDraftService
{
    Task<PilotDraft> CreateDraftAsync(string countyId, string proposedBy, string actionSummary, string actionPayloadJson, CancellationToken ct = default);
    Task<PilotDraft?> GetDraftAsync(Guid draftId, string countyId, CancellationToken ct = default);
    Task<PilotDraft> ApproveDraftAsync(Guid draftId, string countyId, string humanApproverId, CancellationToken ct = default);
    Task<PilotDraft> RejectDraftAsync(Guid draftId, string countyId, string humanApproverId, string reason, CancellationToken ct = default);
    Task<IReadOnlyList<PilotDraft>> GetPendingDraftsAsync(string countyId, CancellationToken ct = default);
}
