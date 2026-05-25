using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Domain.Rollback;

public sealed class RollbackCalculator
{
    public RollbackCalculationResultDto Calculate(RollbackCalculationInputDto input)
    {
        var rollbackYearCount = RollbackRules.DetermineRollbackYearCount(
            input.ClassificationType,
            input.RemovalDate);

        var rollbackYears = RollbackRules.BuildRollbackYears(input.TaxYearOfRemoval, rollbackYearCount);
        var explanation = new List<RollbackExplanationLineDto>();

        decimal additionalTaxSubtotal = 0;
        decimal interestSubtotal = 0;

        foreach (var taxYear in rollbackYears)
        {
            var currentUseValue = input.CurrentUseAssessedValuesByYear.FirstOrDefault(x => x.TaxYear == taxYear)?.Value;
            var trueAndFairValue = input.TrueAndFairValuesByYear.FirstOrDefault(x => x.TaxYear == taxYear)?.Value;
            var levyRate = input.LevyRatesByYear.FirstOrDefault(x => x.TaxYear == taxYear)?.RatePerThousand;
            var interestRate = input.InterestRatesByYear.FirstOrDefault(x => x.TaxYear == taxYear)?.AnnualRate ?? 0m;

            if (currentUseValue is null || trueAndFairValue is null || levyRate is null)
            {
                explanation.Add(new RollbackExplanationLineDto(
                    taxYear.ToString(),
                    "Skipped year — missing required value or levy rate",
                    null,
                    null,
                    "Current-use value, true and fair value, and levy rate are required."));
                continue;
            }

            var currentUseTax = CalculateTax(currentUseValue.Value, levyRate.Value);
            var trueAndFairTax = CalculateTax(trueAndFairValue.Value, levyRate.Value);
            var additionalTax = Math.Max(0, trueAndFairTax - currentUseTax);
            var interest = CalculateSimpleInterest(additionalTax, interestRate);

            additionalTaxSubtotal += additionalTax;
            interestSubtotal += interest;

            explanation.Add(new RollbackExplanationLineDto(
                taxYear.ToString(),
                "Additional tax difference",
                $"({trueAndFairValue} / 1000 × {levyRate}) - ({currentUseValue} / 1000 × {levyRate})",
                RoundCurrency(additionalTax),
                null));

            explanation.Add(new RollbackExplanationLineDto(
                taxYear.ToString(),
                "Estimated statutory interest",
                $"{RoundCurrency(additionalTax)} × {interestRate}",
                RoundCurrency(interest),
                "Phase 1 uses simplified annual interest. Production must compute statutory date-based interest."));
        }

        var statutoryExceptionApplied =
            input.StatutoryExceptionReason is not null and not StatutoryExceptionReason.None;

        var penaltyApplied = !RollbackRules.ShouldSuppressPenalty(
            input.PenaltySuppressionReason,
            input.StatutoryExceptionReason);

        var penaltyBase = additionalTaxSubtotal + interestSubtotal;
        var penaltyAmount = penaltyApplied ? penaltyBase * 0.20m : 0m;
        var totalDue = statutoryExceptionApplied ? 0m : penaltyBase + penaltyAmount;

        explanation.Add(new RollbackExplanationLineDto(
            "SUMMARY",
            "Rollback period",
            null,
            null,
            $"{rollbackYearCount} rollback year(s) applied for {input.ClassificationType}."));

        explanation.Add(new RollbackExplanationLineDto(
            "SUMMARY",
            penaltyApplied ? "20% penalty applied" : "20% penalty suppressed",
            penaltyApplied ? $"({RoundCurrency(penaltyBase)}) × 0.20" : null,
            RoundCurrency(penaltyAmount),
            input.PenaltySuppressionReason?.ToString() ?? input.StatutoryExceptionReason?.ToString()));

        if (statutoryExceptionApplied)
        {
            explanation.Add(new RollbackExplanationLineDto(
                "SUMMARY",
                "Statutory exception applied",
                null,
                0,
                $"Total due set to $0 because exception reason was marked: {input.StatutoryExceptionReason}"));
        }

        return new RollbackCalculationResultDto(
            Guid.NewGuid(),
            input.ParcelId,
            rollbackYears,
            RoundCurrency(additionalTaxSubtotal),
            RoundCurrency(interestSubtotal),
            RoundCurrency(penaltyAmount),
            RoundCurrency(totalDue),
            penaltyApplied,
            input.PenaltySuppressionReason,
            statutoryExceptionApplied,
            input.StatutoryExceptionReason,
            RollbackRules.CalculationVersion,
            explanation,
            DateTimeOffset.UtcNow,
            input.CreatedBy);
    }

    private static decimal CalculateTax(decimal value, decimal ratePerThousand)
    {
        return value / 1000m * ratePerThousand;
    }

    private static decimal CalculateSimpleInterest(decimal additionalTax, decimal annualRate)
    {
        // Phase 1 placeholder. Production must compute date-based statutory interest.
        return additionalTax * annualRate;
    }

    private static decimal RoundCurrency(decimal value)
    {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }
}
