// LEV-009 — Levy Compliance Service (WA State Statutory Limits)
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Washington State levy compliance enforcement.
    /// Validates proposed rates against RCW 84.52 aggregate limits,
    /// RCW 84.55 1% annual increase cap, constitutional maximums,
    /// and special district statutory ceilings.
    /// </summary>
    public class LevyComplianceService
    {
        /// <summary>WA $5.90/$1,000 aggregate regular-levy limit (RCW 84.52.043).</summary>
        public const decimal AggregateLimitPerThousand = 5.90m;

        /// <summary>WA constitutional limit of $10.00/$1,000 (Article VII, Section 2).</summary>
        public const decimal ConstitutionalLimitPerThousand = 10.00m;

        /// <summary>Standard county regular-levy limit: $1.80/$1,000.</summary>
        public const decimal CountyRegularLimit = 1.80m;

        /// <summary>City regular-levy limit: $3.375/$1,000.</summary>
        public const decimal CityRegularLimit = 3.375m;

        /// <summary>Fire district limit: $1.50/$1,000.</summary>
        public const decimal FireDistrictLimit = 1.50m;

        /// <summary>Library district limit: $0.50/$1,000.</summary>
        public const decimal LibraryDistrictLimit = 0.50m;

        /// <summary>Hospital district limit: $0.75/$1,000.</summary>
        public const decimal HospitalDistrictLimit = 0.75m;

        /// <summary>
        /// Run all statutory limit checks for a proposed rate.
        /// </summary>
        /// <param name="districtType">Type of taxing district.</param>
        /// <param name="proposedRate">Proposed rate per $1,000.</param>
        /// <param name="aggregateRate">Sum of all overlapping district rates.</param>
        /// <param name="priorYearLevy">Prior year highest lawful levy.</param>
        /// <param name="proposedLevy">Proposed levy amount.</param>
        /// <returns>Compliance result with pass/fail for each check.</returns>
        public Task<ComplianceResult> CheckAllLimitsAsync(
            string districtType,
            decimal proposedRate,
            decimal aggregateRate,
            decimal priorYearLevy,
            decimal proposedLevy)
        {
            var result = new ComplianceResult { DistrictType = districtType };

            // 1. Aggregate $5.90 limit
            result.PassesAggregateLimit = aggregateRate <= AggregateLimitPerThousand;

            // 2. Constitutional $10.00 limit
            result.PassesConstitutionalLimit = aggregateRate <= ConstitutionalLimitPerThousand;

            // 3. Individual district statutory limit
            var districtLimit = GetDistrictLimit(districtType);
            result.PassesDistrictLimit = proposedRate <= districtLimit;
            result.ApplicableDistrictLimit = districtLimit;

            // 4. 1% annual increase cap
            var maxLevy = LevyCalculationService.Calculate1PercentLimit(priorYearLevy);
            result.Passes1PercentCap = proposedLevy <= maxLevy;
            result.Highest1PercentLevy = maxLevy;

            result.IsFullyCompliant = result.PassesAggregateLimit
                && result.PassesConstitutionalLimit
                && result.PassesDistrictLimit
                && result.Passes1PercentCap;

            return Task.FromResult(result);
        }

        /// <summary>
        /// Generate a compliance report for a district and tax year.
        /// </summary>
        public Task<LevyComplianceReport> GenerateLevyComplianceReportAsync(int districtId, int taxYear)
        {
            // Stub — in production, fetches data from EF Core context
            var report = new LevyComplianceReport
            {
                DistrictId = districtId,
                TaxYear = taxYear,
                GeneratedAt = DateTime.UtcNow,
                Checks = new List<ComplianceCheckItem>
                {
                    new() { Rule = "Aggregate $5.90 Limit", Status = "Pending" },
                    new() { Rule = "1% Annual Increase Cap", Status = "Pending" },
                    new() { Rule = "Constitutional $10.00 Limit", Status = "Pending" },
                    new() { Rule = "District Statutory Limit", Status = "Pending" }
                }
            };
            return Task.FromResult(report);
        }

        /// <summary>Look up the statutory rate limit for a district type.</summary>
        public static decimal GetDistrictLimit(string districtType)
        {
            return districtType?.ToUpperInvariant() switch
            {
                "COUNTY" => CountyRegularLimit,
                "CITY" or "TOWN" => CityRegularLimit,
                "FIRE" => FireDistrictLimit,
                "LIBRARY" => LibraryDistrictLimit,
                "HOSPITAL" => HospitalDistrictLimit,
                _ => AggregateLimitPerThousand
            };
        }
    }

    /// <summary>Result of a multi-check compliance evaluation.</summary>
    public class ComplianceResult
    {
        public string DistrictType { get; set; } = string.Empty;
        public bool PassesAggregateLimit { get; set; }
        public bool PassesConstitutionalLimit { get; set; }
        public bool PassesDistrictLimit { get; set; }
        public bool Passes1PercentCap { get; set; }
        public decimal ApplicableDistrictLimit { get; set; }
        public decimal Highest1PercentLevy { get; set; }
        public bool IsFullyCompliant { get; set; }
    }

    /// <summary>Full compliance report for a district and year.</summary>
    public class LevyComplianceReport
    {
        public int DistrictId { get; set; }
        public int TaxYear { get; set; }
        public DateTime GeneratedAt { get; set; }
        public List<ComplianceCheckItem> Checks { get; set; } = new();
    }

    /// <summary>Individual check within a compliance report.</summary>
    public class ComplianceCheckItem
    {
        public string Rule { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string Details { get; set; } = string.Empty;
    }
}
