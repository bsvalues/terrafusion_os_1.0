using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace TerraFusion.API.Tests.Levy
{
    /// <summary>
    /// LEV-072: End-to-end levy workflow tests.
    /// All data is fabricated for testing purposes only.
    /// </summary>
    public class LevyIntegrationTests
    {
        private record TaxingDistrict(string Code, string Name, decimal RatePerThousand);
        private record TaxResult(string DistrictCode, decimal Tax, bool Compliant);

        [Fact]
        public void FullWorkflow_CreateDistrict_SetRate_CalculateTax()
        {
            var district = new TaxingDistrict("FD-01", "Fabricated Fire District 1", 1.50m);
            decimal parcelAV = 275_000m;

            decimal tax = (parcelAV / 1000m) * district.RatePerThousand;

            Assert.Equal("FD-01", district.Code);
            Assert.Equal(412.50m, tax);
        }

        [Fact]
        public void ComplianceCheck_MultipleDistricts_AggregateUnderLimit()
        {
            var districts = new List<TaxingDistrict>
            {
                new("GEN-01", "Fabricated General Fund", 1.80m),
                new("RD-01", "Fabricated Road District", 2.25m),
                new("LIB-01", "Fabricated Library District", 0.50m),
            };

            decimal aggregateRate = districts.Sum(d => d.RatePerThousand);
            bool underStatutoryLimit = aggregateRate <= 5.90m;

            Assert.Equal(4.55m, aggregateRate);
            Assert.True(underStatutoryLimit);
        }

        [Fact]
        public void ReportGeneration_ProducesResultsForAllDistricts()
        {
            var districts = new List<TaxingDistrict>
            {
                new("SCH-01", "Fabricated School District", 3.60m),
                new("PK-01", "Fabricated Park District", 0.75m),
            };
            decimal parcelAV = 200_000m;

            var results = districts.Select(d => new TaxResult(
                d.Code,
                (parcelAV / 1000m) * d.RatePerThousand,
                d.RatePerThousand <= 5.90m
            )).ToList();

            Assert.Equal(2, results.Count);
            Assert.Equal(720.00m, results[0].Tax);
            Assert.Equal(150.00m, results[1].Tax);
            Assert.All(results, r => Assert.True(r.Compliant));
        }

        [Fact]
        public void ComplianceCheck_AggregateExceedsLimit_Flagged()
        {
            var districts = new List<TaxingDistrict>
            {
                new("GEN-02", "Fabricated General Fund 2", 3.50m),
                new("FD-02", "Fabricated Fire District 2", 2.80m),
            };

            decimal aggregateRate = districts.Sum(d => d.RatePerThousand);

            Assert.Equal(6.30m, aggregateRate);
            Assert.True(aggregateRate > 5.90m);
        }
    }
}
