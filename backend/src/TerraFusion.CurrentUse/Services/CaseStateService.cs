using Microsoft.EntityFrameworkCore;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;
using TerraFusion.CurrentUse.Models;

namespace TerraFusion.CurrentUse.Services;

public class CaseStateService : ICaseStateService
{
    private readonly CurrentUseDbContext _db;

    public CaseStateService(CurrentUseDbContext db)
    {
        _db = db;
    }

    public async Task<List<CaseStateDto>> ListAsync(CancellationToken ct = default)
    {
        var states = await _db.CaseStates
            .AsNoTracking()
            .OrderByDescending(state => state.LastTouchedAt)
            .ToListAsync(ct);

        return states.Select(ToDto).ToList();
    }

    public async Task<CaseStateDto?> GetByCaseIdAsync(Guid caseId, CancellationToken ct = default)
    {
        var state = await _db.CaseStates
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.CaseId == caseId, ct);

        return state is null ? null : ToDto(state);
    }

    public async Task<CaseStateDto> UpsertAsync(Guid caseId, CaseStateUpsertRequest request, CancellationToken ct = default)
    {
        var state = await _db.CaseStates.FirstOrDefaultAsync(s => s.CaseId == caseId, ct);
        if (state is null)
        {
            state = new CurrentUseCaseState { CaseId = caseId };
            _db.CaseStates.Add(state);
        }

        state.CaseStage = Normalize(request.CaseStage, "MONITORING");
        state.AssignedAppraiser = Normalize(request.AssignedAppraiser, "Ag Appraiser");
        state.ChiefReviewStatus = Normalize(request.ChiefReviewStatus, "NotRequired");
        state.NoticeApprovalStatus = Normalize(request.NoticeApprovalStatus, "NotStarted");
        state.LocalCaseNotes = request.LocalCaseNotes?.Trim() ?? string.Empty;
        state.AgingBasisDate = request.AgingBasisDate;
        state.LastTouchedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ToDto(state);
    }

    private static string Normalize(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }

    private static CaseStateDto ToDto(CurrentUseCaseState state)
    {
        return new CaseStateDto(
            state.CaseId,
            state.CaseStage,
            state.AssignedAppraiser,
            state.ChiefReviewStatus,
            state.NoticeApprovalStatus,
            state.LocalCaseNotes,
            state.AgingBasisDate.ToString("yyyy-MM-dd"),
            state.LastTouchedAt.ToString("O")
        );
    }
}
