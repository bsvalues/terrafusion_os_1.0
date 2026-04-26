using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-032: Budget impact analysis for levy changes.
/// Exposes the native levy scenario and projection tables for the dashboard.
/// </summary>
[ApiController]
[Route("api/levy/budget")]
[Authorize]
public sealed class BudgetImpactController : ControllerBase
{
    private readonly ILogger<BudgetImpactController> _logger;
    private readonly LevyDbContext _db;

    public BudgetImpactController(
        ILogger<BudgetImpactController> logger,
        LevyDbContext db)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public sealed record BudgetScenarioDto(
        Guid ScenarioId,
        string ScenarioName,
        string ScenarioType,
        Guid LevyMeasureId,
        string LevyMeasureName,
        int LevyYear,
        string CountyId,
        decimal AssessedValue,
        decimal LevyRate,
        decimal CalculatedAmount,
        decimal ProjectedRevenue,
        decimal CollectionRate,
        bool IsActive,
        decimal? ConfidenceScore,
        bool QuantumOptimized,
        DateTime CreatedAt);

    public sealed record BudgetScenarioEnvelope(
        int TaxYear,
        string Source,
        DateTime GeneratedAt,
        IReadOnlyList<BudgetScenarioDto> Scenarios,
        int Count);

    public sealed record BudgetProjectionDto(
        Guid ScenarioId,
        string ScenarioName,
        int FiscalYear,
        decimal ProjectedAssessedValue,
        decimal ProjectedLevyAmount,
        decimal ProjectedCollectionRate,
        decimal ProjectedNetRevenue,
        decimal GrowthRate,
        decimal? ConfidenceLevel);

    public sealed record BudgetVisualizationSummaryDto(
        decimal TotalProjectedRevenue,
        decimal AverageCollectionRate,
        decimal AverageGrowthRate,
        IReadOnlyList<int> FiscalYears);

    public sealed record BudgetVisualizationEnvelope(
        int TaxYear,
        string Source,
        DateTime GeneratedAt,
        IReadOnlyList<BudgetProjectionDto> Projections,
        int Count,
        BudgetVisualizationSummaryDto Summary);

    private static IQueryable<LevyScenario> ApplyCountyFilter(
        IQueryable<LevyScenario> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(scenario => scenario.CountyId == normalized);
    }

    private static IQueryable<RevenueProjection> ApplyCountyFilter(
        IQueryable<RevenueProjection> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(projection => projection.CountyId == normalized);
    }

    private static IQueryable<LevyMeasure> ApplyCountyFilter(
        IQueryable<LevyMeasure> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(measure => measure.CountyId == normalized);
    }

    private async Task<int> ResolveEffectiveTaxYearAsync(int? requestedYear, string? countyId, CancellationToken cancellationToken)
    {
        if (requestedYear.HasValue)
        {
            return requestedYear.Value;
        }

        var latestProjectionYear = await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), countyId)
            .Select(projection => (int?)projection.FiscalYear)
            .MaxAsync(cancellationToken);

        var latestMeasureYear = await ApplyCountyFilter(_db.LevyMeasures.AsNoTracking(), countyId)
            .Select(measure => (int?)measure.LevyYear)
            .MaxAsync(cancellationToken);

        return new[] { latestProjectionYear, latestMeasureYear }
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .DefaultIfEmpty(DateTime.UtcNow.Year)
            .Max();
    }

    /// <summary>
    /// Analyze the budget impact of a proposed levy change.
    /// No synthetic output is returned here; callers should use the persisted
    /// scenario and projection endpoints until a write-side contract is defined.
    /// </summary>
    [HttpPost("analyze")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Analyze([FromBody] object request)
    {
        _logger.LogInformation("LEV-032: Budget impact analysis requested without a persisted write contract.");
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            error = "budget_impact_write_contract_missing",
            message = "Budget impact analysis write operations are not exposed until the persisted request contract is finalized. Use GET /api/levy/budget/scenarios and GET /api/levy/budget/visualization for live native data.",
        });
    }

    /// <summary>
    /// Retrieve budget impact visualization data for charting.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("visualization")]
    [ProducesResponseType(typeof(BudgetVisualizationEnvelope), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetVisualization(
        [FromQuery] string? scenarioId,
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        Guid? parsedScenarioId = null;
        if (!string.IsNullOrWhiteSpace(scenarioId))
        {
            if (!Guid.TryParse(scenarioId, out var scenarioGuid))
            {
                return BadRequest(new
                {
                    error = "invalid_scenario_id",
                    message = "scenarioId must be a GUID when provided.",
                });
            }

            parsedScenarioId = scenarioGuid;
        }

        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, countyId, cancellationToken);

        var projectionsQuery = ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), countyId)
            .Include(projection => projection.LevyScenario)
            .ThenInclude(scenario => scenario.LevyMeasure)
            .Where(projection => projection.FiscalYear == effectiveYear);

        if (parsedScenarioId.HasValue)
        {
            projectionsQuery = projectionsQuery.Where(projection => projection.LevyScenarioId == parsedScenarioId.Value);
        }

        var projections = await projectionsQuery
            .OrderBy(projection => projection.FiscalYear)
            .ThenByDescending(projection => projection.ProjectedNetRevenue)
            .ToListAsync(cancellationToken);

        var items = projections.Select(projection => new BudgetProjectionDto(
            ScenarioId: projection.LevyScenarioId,
            ScenarioName: projection.LevyScenario?.Name ?? projection.LevyScenarioId.ToString(),
            FiscalYear: projection.FiscalYear,
            ProjectedAssessedValue: projection.ProjectedAssessedValue,
            ProjectedLevyAmount: projection.ProjectedLevyAmount,
            ProjectedCollectionRate: projection.ProjectedCollectionRate,
            ProjectedNetRevenue: projection.ProjectedNetRevenue,
            GrowthRate: projection.GrowthRate,
            ConfidenceLevel: projection.ConfidenceLevel)).ToList();

        _logger.LogInformation(
            "LEV-032: Budget visualization requested for taxYear={TaxYear}, county={CountyId}, scenarioId={ScenarioId}, projections={ProjectionCount}",
            effectiveYear,
            countyId ?? "<all>",
            parsedScenarioId?.ToString() ?? "<all>",
            items.Count);

        return Ok(new BudgetVisualizationEnvelope(
            TaxYear: effectiveYear,
            Source: "RevenueProjections + LevyScenarios",
            GeneratedAt: DateTime.UtcNow,
            Projections: items,
            Count: items.Count,
            Summary: new BudgetVisualizationSummaryDto(
                TotalProjectedRevenue: items.Sum(item => item.ProjectedNetRevenue),
                AverageCollectionRate: items.Count > 0 ? items.Average(item => item.ProjectedCollectionRate) : 0m,
                AverageGrowthRate: items.Count > 0 ? items.Average(item => item.GrowthRate) : 0m,
                FiscalYears: items.Select(item => item.FiscalYear).Distinct().OrderBy(value => value).ToList())));
    }

    /// <summary>
    /// List available budget impact scenarios.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("scenarios")]
    [ProducesResponseType(typeof(BudgetScenarioEnvelope), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetScenarios(
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, countyId, cancellationToken);

        var scenarios = await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), countyId)
            .Include(scenario => scenario.LevyMeasure)
            .Where(scenario => scenario.LevyMeasure.LevyYear == effectiveYear)
            .OrderByDescending(scenario => scenario.IsActive)
            .ThenByDescending(scenario => scenario.CreatedAt)
            .ToListAsync(cancellationToken);

        var items = scenarios.Select(scenario => new BudgetScenarioDto(
            ScenarioId: scenario.Id,
            ScenarioName: scenario.Name,
            ScenarioType: scenario.ScenarioType,
            LevyMeasureId: scenario.LevyMeasureId,
            LevyMeasureName: scenario.LevyMeasure?.Name ?? "Unlabeled Levy Measure",
            LevyYear: scenario.LevyMeasure?.LevyYear ?? effectiveYear,
            CountyId: scenario.CountyId,
            AssessedValue: scenario.AssessedValue,
            LevyRate: scenario.LevyRate,
            CalculatedAmount: scenario.CalculatedAmount,
            ProjectedRevenue: scenario.ProjectedRevenue,
            CollectionRate: scenario.CollectionRate,
            IsActive: scenario.IsActive,
            ConfidenceScore: scenario.ConfidenceScore,
            QuantumOptimized: scenario.QuantumOptimized,
            CreatedAt: scenario.CreatedAt)).ToList();

        _logger.LogInformation(
            "LEV-032: Budget scenarios requested for taxYear={TaxYear}, county={CountyId}, scenarios={ScenarioCount}",
            effectiveYear,
            countyId ?? "<all>",
            items.Count);

        return Ok(new BudgetScenarioEnvelope(
            TaxYear: effectiveYear,
            Source: "LevyScenarios + LevyMeasures",
            GeneratedAt: DateTime.UtcNow,
            Scenarios: items,
            Count: items.Count));
    }
}
