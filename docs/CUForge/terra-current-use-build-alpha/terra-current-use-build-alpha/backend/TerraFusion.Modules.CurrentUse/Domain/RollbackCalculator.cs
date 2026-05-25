using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Domain;

public sealed class RollbackCalculator
{
    public const string PolicyVersion = "2025.09.01";
    public const string CalculationVersion = "CU_ROLLBACK_ENGINE_v2026_05_ALPHA";

    public RollbackCalculationResultDto Calculate(RollbackCalculationRequestDto request)
    {
        var rollbackYears = GetRollbackYears(request.ClassificationType, request.RemovalDate, request.TaxYearOfRemoval);
        var selected = request.TaxYears.Where(x => rollbackYears.Contains(x.TaxYear)).OrderBy(x => x.TaxYear).ToArray();

        var yearResults = selected.Select(row =>
        {
            var taxableDifference = Math.Max(row.TrueAndFairValue - row.CurrentUseValue, 0);
            var additionalTax = RoundCurrency((taxableDifference / 1000m) * row.LevyRatePerThousand);
            var interest = RoundCurrency(additionalTax * row.AnnualInterestRate);
            return new RollbackYearResultDto(row.TaxYear, additionalTax, interest);
        }).ToArray();

        var additionalTaxSubtotal = RoundCurrency(yearResults.Sum(x => x.AdditionalTax));
        var interestSubtotal = RoundCurrency(yearResults.Sum(x => x.Interest));
        var penaltyAmount = request.PenaltySuppressed ? 0 : RoundCurrency(additionalTaxSubtotal * 0.2m);
        var totalDue = RoundCurrency(additionalTaxSubtotal + interestSubtotal + penaltyAmount);

        return new RollbackCalculationResultDto(
            request.ParcelId,
            rollbackYears,
            CalculationVersion,
            PolicyVersion,
            yearResults,
            additionalTaxSubtotal,
            interestSubtotal,
            penaltyAmount,
            totalDue,
            new[]
            {
                $"Policy version {PolicyVersion} resolved rollback years for {request.ClassificationType}.",
                $"Rollback years selected: {string.Join(", ", rollbackYears)}.",
                "Additional tax = (true and fair value - current use value) ÷ 1000 × levy rate.",
                "Interest is shown as alpha annual estimate pending final statutory interest validation.",
                request.PenaltySuppressed
                    ? "Penalty is suppressed because staff selected a qualifying suppression condition."
                    : "Penalty is calculated as 20% of additional tax subtotal.",
                "Final review remains with authorized county staff."
            });
    }

    public IReadOnlyList<int> GetRollbackYears(string classificationType, DateOnly removalDate, int taxYearOfRemoval)
    {
        var count = classificationType == "FARM_AND_AGRICULTURAL" && removalDate >= new DateOnly(2025, 9, 1)
            ? 4
            : 7;

        return Enumerable.Range(taxYearOfRemoval - count, count).ToArray();
    }

    private static decimal RoundCurrency(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
