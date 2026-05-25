
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Reporting;

public interface ICurrentUseStateReportingService
{
    Task<CurrentUseSubmissionBatchDto> GenerateBatchAsync(
        Guid countyId,
        string stateCode,
        string reportingYear,
        string generatedBy,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseStateReportingService : ICurrentUseStateReportingService
{
    public Task<CurrentUseSubmissionBatchDto> GenerateBatchAsync(
        Guid countyId,
        string stateCode,
        string reportingYear,
        string generatedBy,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseSubmissionRowDto> rows =
        [
            new(
                Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "FARM_AND_AGRICULTURAL",
                "ACTIVE_MONITORING",
                18.42m,
                11240.55m),

            new(
                Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                "OPEN_SPACE",
                "ACTIVE_COMPLIANT",
                40m,
                null)
        ];

        return Task.FromResult(
            new CurrentUseSubmissionBatchDto(
                Guid.NewGuid(),
                countyId,
                stateCode,
                reportingYear,
                CurrentUseSubmissionStatus.Validated,
                rows.Count,
                rows,
                DateTimeOffset.UtcNow,
                generatedBy));
    }
}
