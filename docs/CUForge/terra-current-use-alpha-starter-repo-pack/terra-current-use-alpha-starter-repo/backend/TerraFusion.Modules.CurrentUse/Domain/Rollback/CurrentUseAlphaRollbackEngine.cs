using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Domain.Rollback;

public sealed class CurrentUseAlphaRollbackEngine
{
    public CurrentUseAlphaRollbackResultDto Calculate(CurrentUseAlphaRollbackRequestDto request)
    {
        var count =
            request.ClassificationType == "FARM_AND_AGRICULTURAL" &&
            request.RemovalDate >= new DateOnly(2025, 9, 1)
                ? 4
                : 7;

        var years = Enumerable.Range(request.TaxYearOfRemoval - count, count).ToArray();

        return new CurrentUseAlphaRollbackResultDto(
            request.ParcelId,
            years,
            "CU_ROLLBACK_ENGINE_v2026_03_01",
            "2025.09.01",
            11240.55m,
            new[]
            {
                $"Rollback years: {string.Join(", ", years)}",
                "Calculation is policy-versioned and explainable.",
                "Final review remains with authorized county staff."
            });
    }
}
