// TerraFusionGPT Suite: Depreciation Calculation Function
// Elite Government OS Engineering - Property Depreciation Analysis

using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Functions
{
    /// <summary>
    /// Calculates property depreciation using age-life method
    /// </summary>
    public class DepreciationCalculationFunction : FunctionHandlerBase
    {
        private readonly ILogger<DepreciationCalculationFunction> _logger;

        public override string FunctionName => "CalculateDepreciation";
        public override string Description => "Calculates property depreciation using the age-life method based on actual age, effective age, and total economic life";

        public DepreciationCalculationFunction(ILogger<DepreciationCalculationFunction> logger)
        {
            _logger = logger;
        }

        public override string? GetRequiredRole()
        {
            return "Assessor"; // Requires assessor role
        }

        public override bool RequiresCountyIsolation()
        {
            return false; // Calculation doesn't require county data
        }

        public override ArgumentValidationResult ValidateArguments(JsonElement arguments)
        {
            // Validate actualAge
            var (success1, actualAge, error1) = GetRequiredDouble(arguments, "actualAge");
            if (!success1)
            {
                return ArgumentValidationResult.Invalid(error1!);
            }

            if (actualAge < 0)
            {
                return ArgumentValidationResult.Invalid("actualAge must be non-negative");
            }

            // Validate effectiveAge
            var (success2, effectiveAge, error2) = GetRequiredDouble(arguments, "effectiveAge");
            if (!success2)
            {
                return ArgumentValidationResult.Invalid(error2!);
            }

            if (effectiveAge < 0)
            {
                return ArgumentValidationResult.Invalid("effectiveAge must be non-negative");
            }

            // Validate economicLife
            var (success3, economicLife, error3) = GetRequiredDouble(arguments, "economicLife");
            if (!success3)
            {
                return ArgumentValidationResult.Invalid(error3!);
            }

            if (economicLife <= 0)
            {
                return ArgumentValidationResult.Invalid("economicLife must be greater than zero");
            }

            // Validate effective age is not greater than economic life
            if (effectiveAge > economicLife)
            {
                return ArgumentValidationResult.Invalid("effectiveAge cannot exceed economicLife");
            }

            return ArgumentValidationResult.Valid();
        }

        public override async Task<string> ExecuteAsync(
            JsonElement arguments,
            SecurityContext securityContext)
        {
            await Task.CompletedTask;
            await Task.CompletedTask;
            var actualAge = arguments.GetProperty("actualAge").GetDouble();
            var effectiveAge = arguments.GetProperty("effectiveAge").GetDouble();
            var economicLife = arguments.GetProperty("economicLife").GetDouble();
            var replacementCost = GetOptionalDouble(arguments, "replacementCost", null);

            _logger.LogInformation($"Calculating depreciation: actualAge={actualAge}, effectiveAge={effectiveAge}, economicLife={economicLife}");

            try
            {
                // Calculate depreciation using age-life method
                var depreciationPercent = (effectiveAge / economicLife) * 100;

                // Calculate remaining economic life
                var remainingLife = economicLife - effectiveAge;

                // Calculate remaining value percent
                var remainingValuePercent = 100 - depreciationPercent;

                // Calculate depreciated value if replacement cost provided
                double? depreciatedValue = null;
                double? depreciationAmount = null;

                if (replacementCost.HasValue)
                {
                    depreciatedValue = replacementCost.Value * (remainingValuePercent / 100);
                    depreciationAmount = replacementCost.Value - depreciatedValue.Value;
                }

                // Calculate annual depreciation
                var annualDepreciationPercent = 100 / economicLife;

                // Determine condition category based on effective age vs actual age
                string conditionIndicator;
                if (effectiveAge < actualAge * 0.8)
                {
                    conditionIndicator = "Well-Maintained (Effective Age < Actual Age)";
                }
                else if (effectiveAge > actualAge * 1.2)
                {
                    conditionIndicator = "Poor Maintenance (Effective Age > Actual Age)";
                }
                else
                {
                    conditionIndicator = "Average Maintenance (Effective Age ≈ Actual Age)";
                }

                var response = new
                {
                    success = true,
                    depreciation = new
                    {
                        depreciationPercent = Math.Round(depreciationPercent, 2),
                        remainingValuePercent = Math.Round(remainingValuePercent, 2),
                        depreciatedValue = depreciatedValue.HasValue ? Math.Round(depreciatedValue.Value, 2) : (double?)null,
                        depreciationAmount = depreciationAmount.HasValue ? Math.Round(depreciationAmount.Value, 2) : (double?)null,
                        annualDepreciationPercent = Math.Round(annualDepreciationPercent, 4)
                    },
                    ageAnalysis = new
                    {
                        actualAge,
                        effectiveAge,
                        economicLife,
                        remainingEconomicLife = remainingLife,
                        conditionIndicator
                    },
                    methodology = new
                    {
                        method = "Age-Life Method",
                        formula = "Depreciation % = (Effective Age ÷ Economic Life) × 100",
                        calculation = $"({effectiveAge} ÷ {economicLife}) × 100 = {Math.Round(depreciationPercent, 2)}%",
                        notes = new[]
                        {
                            "Effective Age reflects actual condition and maintenance level",
                            "Lower Effective Age indicates better maintenance",
                            "Higher Effective Age indicates poor maintenance or functional obsolescence",
                            "Economic Life is typical expected lifespan for this property type"
                        }
                    },
                    interpretationGuide = new
                    {
                        depreciationLevel = GetDepreciationLevel(depreciationPercent),
                        recommendations = GetRecommendations(depreciationPercent, effectiveAge, actualAge)
                    }
                };

                return JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating depreciation");

                return JsonSerializer.Serialize(new
                {
                    success = false,
                    error = "Failed to calculate depreciation"
                });
            }
        }

        private double? GetOptionalDouble(JsonElement args, string propertyName, double? defaultValue)
        {
            if (args.TryGetProperty(propertyName, out var element))
            {
                if (element.TryGetDouble(out var value))
                {
                    return value;
                }
            }

            return defaultValue;
        }

        private string GetDepreciationLevel(double depreciationPercent)
        {
            if (depreciationPercent < 10) return "Minimal (< 10%)";
            if (depreciationPercent < 25) return "Low (10-25%)";
            if (depreciationPercent < 50) return "Moderate (25-50%)";
            if (depreciationPercent < 75) return "High (50-75%)";
            return "Very High (> 75%)";
        }

        private string[] GetRecommendations(double depreciationPercent, double effectiveAge, double actualAge)
        {
            var recommendations = new System.Collections.Generic.List<string>();

            if (depreciationPercent < 25)
            {
                recommendations.Add("Property shows minimal depreciation - well-maintained");
            }
            else if (depreciationPercent > 75)
            {
                recommendations.Add("Property shows significant depreciation - may need major renovations");
                recommendations.Add("Consider functional obsolescence factors");
            }

            if (effectiveAge < actualAge * 0.8)
            {
                recommendations.Add("Effective age below actual age indicates excellent maintenance");
                recommendations.Add("Property may warrant higher quality/condition rating");
            }
            else if (effectiveAge > actualAge * 1.2)
            {
                recommendations.Add("Effective age exceeds actual age - indicates deferred maintenance");
                recommendations.Add("Inspect for functional obsolescence or physical deterioration");
            }

            if (depreciationPercent >= 50 && depreciationPercent <= 70)
            {
                recommendations.Add("Property nearing end of economic life");
                recommendations.Add("Consider cost to cure vs. remaining value");
            }

            return recommendations.ToArray();
        }
    }
}
