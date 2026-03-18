using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace TerraFusion.API.Tests.Levy
{
    /// <summary>
    /// LEV-078: Property and business rule validation tests.
    /// All data is fabricated for testing purposes only.
    /// </summary>
    public class ValidationFrameworkTests
    {
        private record LevyEntry(string? DistrictCode, string? Name, decimal? Rate, int? Year);

        private static List<string> Validate(LevyEntry entry)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(entry.DistrictCode))
                errors.Add("DistrictCode is required.");

            if (string.IsNullOrWhiteSpace(entry.Name))
                errors.Add("Name is required.");

            if (entry.Rate is null)
                errors.Add("Rate is required.");
            else if (entry.Rate < 0m)
                errors.Add("Rate must be non-negative.");
            else if (entry.Rate > 5.90m)
                errors.Add("Rate exceeds statutory limit of 5.90.");

            if (entry.Year is not null && entry.Year < 2000)
                errors.Add("Year must be 2000 or later.");

            return errors;
        }

        [Fact]
        public void RequiredFields_MissingDistrictCode_ReturnsError()
        {
            var entry = new LevyEntry(null, "Test Dist", 1.50m, 2025);

            var errors = Validate(entry);

            Assert.Contains(errors, e => e.Contains("DistrictCode"));
        }

        [Fact]
        public void RequiredFields_MissingName_ReturnsError()
        {
            var entry = new LevyEntry("FD-01", null, 1.50m, 2025);

            var errors = Validate(entry);

            Assert.Contains(errors, e => e.Contains("Name"));
        }

        [Fact]
        public void ValueRange_NegativeRate_ReturnsError()
        {
            var entry = new LevyEntry("FD-01", "Test Dist", -1.00m, 2025);

            var errors = Validate(entry);

            Assert.Contains(errors, e => e.Contains("non-negative"));
        }

        [Fact]
        public void BusinessRule_RateExceedsStatutoryLimit_ReturnsError()
        {
            var entry = new LevyEntry("FD-01", "Test Dist", 6.50m, 2025);

            var errors = Validate(entry);

            Assert.Contains(errors, e => e.Contains("statutory limit"));
        }

        [Fact]
        public void CustomRule_InvalidYear_ReturnsError()
        {
            var entry = new LevyEntry("FD-01", "Test Dist", 1.50m, 1999);

            var errors = Validate(entry);

            Assert.Contains(errors, e => e.Contains("Year"));
        }

        [Fact]
        public void FullyValidEntry_ReturnsNoErrors()
        {
            var entry = new LevyEntry("FD-01", "Test Fire District", 2.50m, 2025);

            var errors = Validate(entry);

            Assert.Empty(errors);
        }
    }
}
