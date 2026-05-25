using TerraFusion.Modules.CurrentUse.Domain;

namespace TerraFusion.Modules.CurrentUse.Domain.Rollback;

public static class RollbackRules
{
    public const string CalculationVersion = "CU_ROLLBACK_ENGINE_v2026_03_01";

    private static readonly DateOnly FarmAgFourYearEffectiveDate = new(2025, 9, 1);

    public static int DetermineRollbackYearCount(ClassificationType classificationType, DateOnly removalDate)
    {
        if (classificationType == ClassificationType.FarmAndAgricultural &&
            removalDate >= FarmAgFourYearEffectiveDate)
        {
            return 4;
        }

        return classificationType switch
        {
            ClassificationType.OpenSpace => 7,
            ClassificationType.TimberLand => 7,
            ClassificationType.FarmAndAgricultural => 7,
            ClassificationType.DesignatedForestland => 7,
            _ => 7
        };
    }

    public static IReadOnlyList<int> BuildRollbackYears(int taxYearOfRemoval, int rollbackYearCount)
    {
        return Enumerable
            .Range(1, rollbackYearCount)
            .Select(offset => taxYearOfRemoval - offset)
            .OrderBy(year => year)
            .ToArray();
    }

    public static bool ShouldSuppressPenalty(
        PenaltySuppressionReason? penaltySuppressionReason,
        StatutoryExceptionReason? statutoryExceptionReason)
    {
        if (statutoryExceptionReason is not null and not StatutoryExceptionReason.None)
        {
            return true;
        }

        return penaltySuppressionReason is
            PenaltySuppressionReason.QualifyingVoluntaryWithdrawal or
            PenaltySuppressionReason.StatutoryException;
    }
}
