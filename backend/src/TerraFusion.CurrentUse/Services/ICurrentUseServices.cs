using TerraFusion.CurrentUse.DTOs;

namespace TerraFusion.CurrentUse.Services;

public interface IClassificationService
{
    Task<ClassificationsResponse> ListAsync(string? status, string? classificationCode, int page, int pageSize, CancellationToken ct = default);
    Task<ClassificationDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ClassificationDto> CreateAsync(ClassificationCreateRequest request, CancellationToken ct = default);
}

public interface IRollbackCalculationService
{
    Task<RollbackResult> CalculateAsync(RollbackCalculationRequest request, CancellationToken ct = default);
}

public interface IInterestService
{
    Task<List<InterestRateDto>> GetRatesAsync(CancellationToken ct = default);
    Task<InterestCalcResult> CalculateAsync(decimal principal, int startYear, int endYear, CancellationToken ct = default);
}

public interface IRemovalService
{
    Task<List<RemovalDto>> ListAsync(CancellationToken ct = default);
    Task<RemovalDto> InitiateAsync(RemovalInitiateRequest request, CancellationToken ct = default);
}

public interface IPenaltyExceptionService
{
    Task<List<PenaltyExceptionDto>> EvaluateAsync(string parcelId, CancellationToken ct = default);
}

public interface ICaseStateService
{
    Task<List<CaseStateDto>> ListAsync(CancellationToken ct = default);
    Task<CaseStateDto?> GetByCaseIdAsync(Guid caseId, CancellationToken ct = default);
    Task<CaseStateDto> UpsertAsync(Guid caseId, CaseStateUpsertRequest request, CancellationToken ct = default);
}
