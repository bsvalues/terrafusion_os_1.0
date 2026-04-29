using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: health-check coverage gate for the
/// <c>pacs_schema_catalog</c> per the C48-A C48-B implementation
/// contract preview point 7.
///
/// <para>Reports <see cref="HealthStatus.Healthy"/> when the
/// catalog's coverage meets or exceeds the configured floors,
/// <see cref="HealthStatus.Degraded"/> when below floor, and surfaces
/// the catalog's <see cref="PacsSchemaVersion"/> + coverage counts
/// in the health-check data dictionary so monitoring systems can
/// alert on regressions.</para>
///
/// <para>"Fails loudly at startup" semantics (per C48-A) are
/// implemented at the registration layer if needed: a startup
/// initializer can resolve <see cref="IPacsSchemaCatalog"/>, ask
/// the health check, and abort startup on Degraded. C48-B ships the
/// health check; the abort-startup behavior is operator policy and
/// not enforced by default.</para>
/// </summary>
public sealed class PacsSchemaCatalogHealthCheck : IHealthCheck
{
    private readonly IPacsSchemaCatalog _catalog;
    private readonly PacsSchemaCatalogCoverageFloor _floor;

    public PacsSchemaCatalogHealthCheck(
        IPacsSchemaCatalog catalog,
        PacsSchemaCatalogCoverageFloor floor)
    {
        _catalog = catalog;
        _floor = floor;
    }

    /// <inheritdoc />
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var coverage = _catalog.Coverage;

        var data = new Dictionary<string, object>
        {
            ["TableCount"] = coverage.TableCount,
            ["ColumnCount"] = coverage.ColumnCount,
            ["DictionaryCount"] = coverage.DictionaryCount,
            ["FloorTables"] = _floor.MinTables,
            ["FloorColumns"] = _floor.MinColumns,
            ["FloorDictionaries"] = _floor.MinDictionaries,
            ["TylerRelease"] = _catalog.Version.TylerRelease ?? "(unknown)",
            ["IngestedAt"] = _catalog.Version.IngestedAt.ToString("O"),
        };

        var meets =
            coverage.TableCount >= _floor.MinTables &&
            coverage.ColumnCount >= _floor.MinColumns &&
            coverage.DictionaryCount >= _floor.MinDictionaries;

        if (meets)
        {
            return Task.FromResult(HealthCheckResult.Healthy(
                description: "[PacsSchemaCatalog] coverage meets floor.",
                data: data));
        }

        return Task.FromResult(HealthCheckResult.Degraded(
            description: "[PacsSchemaCatalog] coverage below configured floor; readers may fail closed on missing tables/columns.",
            data: data));
    }
}

/// <summary>
/// Slice C48-B: minimum coverage floor for the catalog health check.
/// Operators set the floor to a value calibrated against the known
/// Tyler PACS install footprint (e.g. "we expect at least 80 tables,
/// 1500 columns, 30 dictionaries"). Below floor → Degraded.
/// </summary>
/// <param name="MinTables">Minimum number of tables expected.</param>
/// <param name="MinColumns">Minimum number of columns expected.</param>
/// <param name="MinDictionaries">Minimum number of dictionaries expected.</param>
public readonly record struct PacsSchemaCatalogCoverageFloor(
    int MinTables,
    int MinColumns,
    int MinDictionaries)
{
    /// <summary>
    /// Zero-coverage floor — health check always reports Healthy.
    /// Used when no expectation has been calibrated yet (e.g.
    /// during the C48-B → C48-C transition).
    /// </summary>
    public static PacsSchemaCatalogCoverageFloor None => new(0, 0, 0);
}
