using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Services;

public interface IMatrixDiagnosticService
{
    Task<IReadOnlyList<CalibrationFinding>> RunDiagnosticsAsync(int matrixVersionId, CancellationToken ct = default);
    Task<DiagnosticsSummary> GetSummaryAsync(CancellationToken ct = default);
}

public record DiagnosticsSummary(
    decimal Prd,
    decimal Prb,
    decimal Cod,
    int SaleCount,
    int OpenFindingCount,
    DateTime ComputedAt);
