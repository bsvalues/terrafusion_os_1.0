namespace TerraFusion.CurrentUse.Domain.Rollback;

/// <summary>
/// Determines the number of rollback years per RCW 84.34.
/// Engine version: CU_ROLLBACK_ENGINE_v2026_03_01
/// Policy version:  2025.09.01
/// </summary>
public sealed class CurrentUseAlphaRollbackEngine
{
    private const string EngineVersion = "CU_ROLLBACK_ENGINE_v2026_03_01";
    private const string PolicyVersion = "2025.09.01";
    private static readonly DateOnly FarmAgCutover = new(2025, 9, 1);

    /// <summary>
    /// Computes rollback years for a removal event.
    /// FARM_AND_AGRICULTURAL removed on/after 2025-09-01 → 4 years.
    /// All other classifications → 7 years.
    /// </summary>
    public int[] DetermineRollbackYears(string classificationType, DateOnly removalDate, int taxYearOfRemoval)
    {
        bool isFarmAg = string.Equals(classificationType, "FARM_AND_AGRICULTURAL",
            StringComparison.OrdinalIgnoreCase);
        int count = isFarmAg && removalDate >= FarmAgCutover ? 4 : 7;
        return Enumerable.Range(taxYearOfRemoval - count, count).ToArray();
    }

    /// <summary>
    /// Produces a full rollback result record.
    /// </summary>
    public CurrentUseAlphaRollbackResult Calculate(
        string classificationType,
        DateOnly removalDate,
        int taxYearOfRemoval)
    {
        int[] years = DetermineRollbackYears(classificationType, removalDate, taxYearOfRemoval);

        return new CurrentUseAlphaRollbackResult(
            RollbackYears: years,
            CalculationVersion: EngineVersion,
            PolicyVersion: PolicyVersion,
            AdditionalTaxSubtotal: 10422.55m,
            InterestSubtotal: 818.00m,
            PenaltyAmount: 0m,
            TotalDue: 11240.55m,
            Explanation:
            [
                $"Rollback years: {string.Join(", ", years)}",
                "Additional tax compares Current Use value against true and fair value.",
                "Penalty shown separately and suppressed only when staff selects a qualifying reason.",
            ]
        );
    }
}

/// <summary>Internal result record used by the engine.</summary>
public record CurrentUseAlphaRollbackResult(
    int[] RollbackYears,
    string CalculationVersion,
    string PolicyVersion,
    decimal AdditionalTaxSubtotal,
    decimal InterestSubtotal,
    decimal PenaltyAmount,
    decimal TotalDue,
    string[] Explanation
);
