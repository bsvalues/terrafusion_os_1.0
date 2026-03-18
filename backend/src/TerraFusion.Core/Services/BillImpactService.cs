// LEV-011 — Bill Impact Service
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Calculates the property tax bill impact of rate changes.
    /// Supports single-property estimates and multi-scenario comparisons
    /// for public hearings and what-if analysis.
    /// </summary>
    public class BillImpactService
    {
        /// <summary>
        /// Estimate the dollar impact on a single property when
        /// the levy rate changes from current to proposed.
        /// </summary>
        /// <param name="propertyValue">Assessed value of the property.</param>
        /// <param name="currentRate">Current rate per $1,000.</param>
        /// <param name="proposedRate">Proposed rate per $1,000.</param>
        /// <returns>Impact details including current tax, proposed tax, and change.</returns>
        public BillImpactResult EstimateBillImpact(
            decimal propertyValue,
            decimal currentRate,
            decimal proposedRate)
        {
            var currentTax = LevyCalculationService.CalculateTax(propertyValue, currentRate);
            var proposedTax = LevyCalculationService.CalculateTax(propertyValue, proposedRate);

            return new BillImpactResult
            {
                PropertyValue = propertyValue,
                CurrentRate = currentRate,
                ProposedRate = proposedRate,
                CurrentTax = currentTax,
                ProposedTax = proposedTax,
                DollarChange = proposedTax - currentTax,
                PercentChange = currentTax != 0
                    ? Math.Round(((proposedTax - currentTax) / currentTax) * 100m, 2)
                    : 0m,
                MonthlyChange = Math.Round((proposedTax - currentTax) / 12m, 2)
            };
        }

        /// <summary>
        /// Compare multiple levy scenarios for the same property value.
        /// Useful for board presentations and public hearings.
        /// </summary>
        /// <param name="propertyValue">Assessed value of the property.</param>
        /// <param name="scenarios">Named scenarios with proposed rates.</param>
        /// <returns>Side-by-side comparison of all scenarios.</returns>
        public Task<ScenarioComparison> CompareScenariosAsync(
            decimal propertyValue,
            List<ScenarioInput> scenarios)
        {
            var results = scenarios.Select(s => new ScenarioOutput
            {
                ScenarioName = s.Name,
                Rate = s.ProposedRate,
                AnnualTax = LevyCalculationService.CalculateTax(propertyValue, s.ProposedRate),
                MonthlyTax = Math.Round(
                    LevyCalculationService.CalculateTax(propertyValue, s.ProposedRate) / 12m, 2)
            }).ToList();

            var baseline = results.FirstOrDefault();
            if (baseline != null)
            {
                foreach (var r in results)
                {
                    r.DifferenceFromBaseline = r.AnnualTax - baseline.AnnualTax;
                }
            }

            var comparison = new ScenarioComparison
            {
                PropertyValue = propertyValue,
                Scenarios = results,
                GeneratedAt = DateTime.UtcNow
            };

            return Task.FromResult(comparison);
        }
    }

    /// <summary>Result of a single-property bill impact estimate.</summary>
    public class BillImpactResult
    {
        public decimal PropertyValue { get; set; }
        public decimal CurrentRate { get; set; }
        public decimal ProposedRate { get; set; }
        public decimal CurrentTax { get; set; }
        public decimal ProposedTax { get; set; }
        public decimal DollarChange { get; set; }
        public decimal PercentChange { get; set; }
        public decimal MonthlyChange { get; set; }
    }

    /// <summary>Input for a named levy scenario.</summary>
    public class ScenarioInput
    {
        public string Name { get; set; } = string.Empty;
        public decimal ProposedRate { get; set; }
    }

    /// <summary>Computed output for a single scenario.</summary>
    public class ScenarioOutput
    {
        public string ScenarioName { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal AnnualTax { get; set; }
        public decimal MonthlyTax { get; set; }
        public decimal DifferenceFromBaseline { get; set; }
    }

    /// <summary>Side-by-side scenario comparison result.</summary>
    public class ScenarioComparison
    {
        public decimal PropertyValue { get; set; }
        public List<ScenarioOutput> Scenarios { get; set; } = new();
        public DateTime GeneratedAt { get; set; }
    }
}
