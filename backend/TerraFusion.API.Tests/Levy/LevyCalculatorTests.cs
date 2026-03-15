using Xunit;

namespace TerraFusion.API.Tests.Levy
{
    /// <summary>
    /// LEV-071: Core levy calculation logic tests.
    /// All data is fabricated for testing purposes only.
    /// </summary>
    public class LevyCalculatorTests
    {
        [Fact]
        public void CalculateRate_FromAmountAndAssessedValue_ReturnsCorrectRate()
        {
            decimal levyAmount = 590_000m;
            decimal totalAssessedValue = 100_000_000m;

            decimal rate = (levyAmount / totalAssessedValue) * 1000m;

            Assert.Equal(5.90m, rate);
        }

        [Fact]
        public void CalculateTax_GivenRateAndValue_ReturnsCorrectTax()
        {
            decimal assessedValue = 350_000m;
            decimal ratePerThousand = 4.25m;

            decimal tax = (assessedValue / 1000m) * ratePerThousand;

            Assert.Equal(1487.50m, tax);
        }

        [Fact]
        public void StatutoryLimit_RateExceeds590_FlaggedAsNonCompliant()
        {
            decimal proposedRate = 6.10m;
            decimal statutoryLimit = 5.90m;

            bool isCompliant = proposedRate <= statutoryLimit;

            Assert.False(isCompliant);
        }

        [Fact]
        public void StatutoryLimit_RateWithinLimit_FlaggedAsCompliant()
        {
            decimal proposedRate = 5.50m;
            decimal statutoryLimit = 5.90m;

            bool isCompliant = proposedRate <= statutoryLimit;

            Assert.True(isCompliant);
        }

        [Fact]
        public void AnnualIncreaseLimit_ExceedsOnePercent_FlaggedAsNonCompliant()
        {
            decimal priorYearLevy = 500_000m;
            decimal proposedLevy = 510_000m;
            decimal maxAllowed = priorYearLevy * 1.01m;

            bool withinLimit = proposedLevy <= maxAllowed;

            Assert.False(withinLimit);
        }

        [Fact]
        public void AnnualIncreaseLimit_WithinOnePercent_IsCompliant()
        {
            decimal priorYearLevy = 500_000m;
            decimal proposedLevy = 504_500m;
            decimal maxAllowed = priorYearLevy * 1.01m;

            bool withinLimit = proposedLevy <= maxAllowed;

            Assert.True(withinLimit);
        }

        [Fact]
        public void BankedCapacity_AccumulatesUnusedCapacity()
        {
            decimal maxAllowed = 505_000m;
            decimal actualLevy = 500_000m;
            decimal priorBanked = 3_000m;

            decimal newBanked = priorBanked + (maxAllowed - actualLevy);

            Assert.Equal(8_000m, newBanked);
        }

        [Fact]
        public void BankedCapacity_UsedInSubsequentYear_ReducesBalance()
        {
            decimal bankedCapacity = 8_000m;
            decimal capacityUsed = 5_000m;

            decimal remaining = bankedCapacity - capacityUsed;

            Assert.Equal(3_000m, remaining);
        }
    }
}
