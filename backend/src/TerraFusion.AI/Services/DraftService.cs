using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.AI.Services;

public sealed class DraftService : IDraftService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DraftService> _logger;

    public DraftService(TerraFusionDbContext db, ILogger<DraftService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PilotDraft> CreateDraftAsync(
        string countyId,
        string proposedBy,
        string actionSummary,
        string actionPayloadJson,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(countyId);
        ArgumentException.ThrowIfNullOrWhiteSpace(proposedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(actionSummary);

        var draft = new PilotDraft
        {
            CountyId = countyId,
            ProposedBy = proposedBy,
            ActionSummary = actionSummary,
            ActionPayloadJson = actionPayloadJson,
            Status = DraftStatus.Pending,
        };

        _db.PilotDrafts.Add(draft);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Draft {DraftId} created by {ProposedBy} in county {CountyId}",
            draft.Id, proposedBy, countyId);

        return draft;
    }

    public async Task<PilotDraft?> GetDraftAsync(
        Guid draftId,
        string countyId,
        CancellationToken ct = default)
    {
        return await _db.PilotDrafts
            .Where(d => d.Id == draftId && d.CountyId == countyId)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<PilotDraft> ApproveDraftAsync(
        Guid draftId,
        string countyId,
        string humanApproverId,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(humanApproverId, nameof(humanApproverId));

        var draft = await _db.PilotDrafts
            .Where(d => d.Id == draftId && d.CountyId == countyId)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException($"Draft {draftId} not found in county {countyId}");

        if (draft.Status != DraftStatus.Pending)
            throw new InvalidOperationException($"Draft {draftId} is already {draft.Status}. Only Pending drafts can be approved.");

        // TruthGate: HumanApproverId must be a non-empty string.
        draft.HumanApproverId = humanApproverId;
        draft.Status = DraftStatus.Approved;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Draft {DraftId} approved by {HumanApproverId} in county {CountyId}",
            draftId, humanApproverId, countyId);

        return draft;
    }

    public async Task<PilotDraft> RejectDraftAsync(
        Guid draftId,
        string countyId,
        string humanApproverId,
        string reason,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(humanApproverId, nameof(humanApproverId));
        ArgumentException.ThrowIfNullOrWhiteSpace(reason, nameof(reason));

        var draft = await _db.PilotDrafts
            .Where(d => d.Id == draftId && d.CountyId == countyId)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException($"Draft {draftId} not found in county {countyId}");

        if (draft.Status != DraftStatus.Pending)
            throw new InvalidOperationException($"Draft {draftId} is already {draft.Status}. Only Pending drafts can be rejected.");

        draft.HumanApproverId = humanApproverId;
        draft.Status = DraftStatus.Rejected;
        draft.RejectionReason = reason;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Draft {DraftId} rejected by {HumanApproverId} in county {CountyId}. Reason recorded.",
            draftId, humanApproverId, countyId);

        return draft;
    }

    public async Task<IReadOnlyList<PilotDraft>> GetPendingDraftsAsync(
        string countyId,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(countyId);

        return await _db.PilotDrafts
            .Where(d => d.CountyId == countyId && d.Status == DraftStatus.Pending)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(ct);
    }
}
