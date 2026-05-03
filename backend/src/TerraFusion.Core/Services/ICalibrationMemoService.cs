using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Services;

public interface ICalibrationMemoService
{
    System.Threading.Tasks.Task<CalibrationMemo> AutoDraftAsync(int matrixVersionId, Guid countyId, CancellationToken ct = default);
    System.Threading.Tasks.Task<CalibrationMemo> UpdateSectionAsync(int memoId, string sectionKey, string content, CancellationToken ct = default);
    System.Threading.Tasks.Task<int> ComputeCompletenessAsync(int memoId, CancellationToken ct = default);
    System.Threading.Tasks.Task<bool> IsReadyForReviewAsync(int memoId, CancellationToken ct = default);
}
