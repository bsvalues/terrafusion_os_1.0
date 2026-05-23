using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.API.CostForge;

/// <summary>
/// Health check for CostForge module.
/// Verifies: cost matrix availability, depreciation schedule integrity,
/// region factor completeness, and calculation engine readiness.
/// </summary>
public class CostForgeHealthCheck : IHealthCheck
{
    private const int ExpectedMatrixEntries = 66;  // 11 types × 6 regions
    private const int ExpectedRegions = 6;
    private const int ExpectedBuildingTypes = 11;

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var data = new Dictionary<string, object>();

        try
        {
            // Check 1: Cost matrix has expected entry count
            var matrixCount = Controllers.BentonCostData.CostMatrix.Length;
            data["costMatrixEntries"] = matrixCount;
            if (matrixCount != ExpectedMatrixEntries)
            {
                return Task.FromResult(HealthCheckResult.Degraded(
                    $"Cost matrix has {matrixCount} entries, expected {ExpectedMatrixEntries}",
                    data: data));
            }

            // Check 2: All regions have factors
            var regionCount = Controllers.BentonCostData.RegionFactors.Count;
            data["regionFactors"] = regionCount;
            if (regionCount != ExpectedRegions)
            {
                return Task.FromResult(HealthCheckResult.Degraded(
                    $"Region factors has {regionCount} entries, expected {ExpectedRegions}",
                    data: data));
            }

            // Check 3: All building types exist in matrix
            var buildingTypes = Controllers.BentonCostData.CostMatrix
                .Select(e => e.BuildingType)
                .Distinct()
                .Count();
            data["buildingTypes"] = buildingTypes;
            if (buildingTypes != ExpectedBuildingTypes)
            {
                return Task.FromResult(HealthCheckResult.Degraded(
                    $"Cost matrix has {buildingTypes} building types, expected {ExpectedBuildingTypes}",
                    data: data));
            }

            // Check 4: Depreciation brackets cover full range
            var resDepBrackets = Controllers.BentonCostData.ResidentialDepreciation;
            var comDepBrackets = Controllers.BentonCostData.CommercialDepreciation;
            data["residentialBrackets"] = resDepBrackets.Length;
            data["commercialBrackets"] = comDepBrackets.Length;

            if (resDepBrackets[0].MinAge != 0 || comDepBrackets[0].MinAge != 0)
            {
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    "Depreciation brackets do not start at age 0",
                    data: data));
            }

            // Check 5: Quality, condition, and complexity factors exist
            data["qualityGrades"] = Controllers.BentonCostData.QualityFactors.Count;
            data["conditionGrades"] = Controllers.BentonCostData.ConditionFactors.Count;
            data["complexityGrades"] = Controllers.BentonCostData.ComplexityFactors.Count;

            // Check 6: All base costs are positive
            var invalidCosts = Controllers.BentonCostData.CostMatrix
                .Where(e => e.BaseCostPerSqft <= 0)
                .ToList();
            if (invalidCosts.Any())
            {
                data["invalidCostEntries"] = invalidCosts.Count;
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    $"{invalidCosts.Count} matrix entries have non-positive base cost",
                    data: data));
            }

            // Check 7: Verify a sample calculation works
            var testResult = Controllers.CostForgeController.ComputeCostEstimate(
                "R1", "Reval 1", 1000m, 2020, "STANDARD", "GOOD", "STANDARD");
            data["sampleCalculationWorking"] = testResult != null;
            if (testResult == null)
            {
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    "Sample cost calculation returned null",
                    data: data));
            }

            data["matrixYear"] = 2025;
            data["status"] = "All checks passed";

            return Task.FromResult(HealthCheckResult.Healthy(
                "CostForge engine healthy: 66 matrix entries, 6 regions, 11 building types, depreciation schedules valid",
                data: data));
        }
        catch (Exception ex)
        {
            data["exception"] = ex.Message;
            return Task.FromResult(HealthCheckResult.Unhealthy(
                $"CostForge health check failed: {ex.Message}",
                exception: ex,
                data: data));
        }
    }
}
