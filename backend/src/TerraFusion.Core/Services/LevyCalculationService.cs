// LEV-005 — Levy Calculation Service (WA State Specific)
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Static utility for Washington State property tax levy calculations.
    /// Implements RCW 84.52 rate computation, statutory limit checks,
    /// and banked capacity logic.
    /// </summary>
    public static class LevyCalculationService
    {
        /// <summary>Default WA aggregate statutory limit per $1,000 of assessed value.</summary>
        public const decimal DefaultStatutoryLimitPerThousand = 5.90m;

        /// <summary>WA constitutional limit per $1,000 of assessed value.</summary>
        public const decimal ConstitutionalLimitPerThousand = 10.00m;

        /// <summary>Maximum annual increase factor under RCW 84.55 (1%).</summary>
        public const decimal MaxAnnualIncreaseFactor = 0.01m;

        /// <summary>
        /// Calculate the levy rate per $1,000 of assessed value.
        /// Rate = (LevyAmount / AssessedValue) * 1000
        /// </summary>
        /// <param name="levyAmount">Total dollar amount to be levied.</param>
        /// <param name="assessedValue">Total assessed value of the district.</param>
        /// <returns>Rate per $1,000 of assessed value, or zero if AV is zero.</returns>
        public static decimal CalculateRate(decimal levyAmount, decimal assessedValue)
        {
            if (assessedValue <= 0) return 0m;
            return Math.Round((levyAmount / assessedValue) * 1000m, 6);
        }

        /// <summary>
        /// Calculate the tax owed on a property given its assessed value and the rate.
        /// Tax = (AssessedValue / 1000) * Rate
        /// </summary>
        public static decimal CalculateTax(decimal assessedValue, decimal ratePerThousand)
        {
            return Math.Round((assessedValue / 1000m) * ratePerThousand, 2);
        }

        /// <summary>
        /// Check whether a proposed rate exceeds the aggregate statutory limit.
        /// Default limit is $5.90/$1,000 per RCW 84.52.043.
        /// </summary>
        /// <returns>True if the rate is within the statutory limit.</returns>
        public static bool CheckStatutoryLimit(
            decimal ratePerThousand,
            decimal limitPerThousand = 5.90m)
        {
            return ratePerThousand <= limitPerThousand;
        }

        /// <summary>
        /// Calculate the highest lawful levy under the 1% annual increase cap (RCW 84.55).
        /// HighestLawful = PriorYearLevy * 1.01 + NewConstruction + Annexation
        /// </summary>
        /// <param name="priorYearLevy">Previous year's highest lawful levy amount.</param>
        /// <param name="newConstruction">Levy attributable to new construction value.</param>
        /// <param name="annexation">Levy attributable to annexed property value.</param>
        /// <returns>Maximum allowable levy for the current year.</returns>
        public static decimal Calculate1PercentLimit(
            decimal priorYearLevy,
            decimal newConstruction = 0m,
            decimal annexation = 0m)
        {
            var inflationAdjusted = priorYearLevy * (1m + MaxAnnualIncreaseFactor);
            return Math.Round(inflationAdjusted + newConstruction + annexation, 2);
        }

        /// <summary>
        /// Apply banked capacity to a current levy. Banked capacity is the unused
        /// portion of the 1% limit that a district may reclaim in future years.
        /// </summary>
        /// <param name="currentLevy">The district's current levy amount.</param>
        /// <param name="bankedCapacity">Accumulated banked capacity dollars.</param>
        /// <returns>Adjusted levy after applying banked capacity.</returns>
        public static decimal ApplyBankedCapacity(decimal currentLevy, decimal bankedCapacity)
        {
            if (bankedCapacity < 0) bankedCapacity = 0;
            return Math.Round(currentLevy + bankedCapacity, 2);
        }

        /// <summary>
        /// Compute banked capacity — the difference between the highest lawful
        /// levy and the amount actually levied.
        /// </summary>
        public static decimal ComputeBankedCapacity(decimal highestLawfulLevy, decimal actualLevy)
        {
            var capacity = highestLawfulLevy - actualLevy;
            return capacity > 0 ? Math.Round(capacity, 2) : 0m;
        }
    }
}
