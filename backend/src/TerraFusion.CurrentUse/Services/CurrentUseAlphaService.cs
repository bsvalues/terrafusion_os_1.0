using TerraFusion.CurrentUse.Dto;
using TerraFusion.CurrentUse.Domain.Rollback;

namespace TerraFusion.CurrentUse.Services;

public interface ICurrentUseAlphaService
{
    Task<CurrentUseAlphaOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken ct = default);
    Task<CurrentUseAlphaRollbackResultDto> CalculateRollbackAsync(
        CurrentUseAlphaRollbackRequestDto request, CancellationToken ct = default);
}

public sealed class CurrentUseAlphaService : ICurrentUseAlphaService
{
    private readonly CurrentUseAlphaRollbackEngine _engine;

    public CurrentUseAlphaService(CurrentUseAlphaRollbackEngine engine)
        => _engine = engine;

    public Task<CurrentUseAlphaOverviewDto> GetOverviewAsync(Guid parcelId, CancellationToken ct = default)
    {
        // Alpha: stub overview — real persistence wired in Beta.
        var dto = new CurrentUseAlphaOverviewDto(
            ParcelId: parcelId.ToString(),
            ClassificationType: null,
            ProgramStatus: "UNKNOWN",
            EnrollmentDate: null,
            EngineVersion: "CU_ROLLBACK_ENGINE_v2026_03_01"
        );
        return Task.FromResult(dto);
    }

    public Task<CurrentUseAlphaRollbackResultDto> CalculateRollbackAsync(
        CurrentUseAlphaRollbackRequestDto request, CancellationToken ct = default)
    {
        if (!DateOnly.TryParse(request.RemovalDate, out var removalDate))
            throw new ArgumentException($"Invalid RemovalDate: {request.RemovalDate}", nameof(request));

        var result = _engine.Calculate(request.ClassificationType, removalDate, request.TaxYearOfRemoval);

        var dto = new CurrentUseAlphaRollbackResultDto(
            RollbackYears: result.RollbackYears,
            CalculationVersion: result.CalculationVersion,
            PolicyVersion: result.PolicyVersion,
            AdditionalTaxSubtotal: result.AdditionalTaxSubtotal,
            InterestSubtotal: result.InterestSubtotal,
            PenaltyAmount: result.PenaltyAmount,
            TotalDue: result.TotalDue,
            Explanation: result.Explanation
        );
        return Task.FromResult(dto);
    }
}
