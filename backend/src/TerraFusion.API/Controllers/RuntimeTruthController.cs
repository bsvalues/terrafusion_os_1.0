using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Runtime truth probes for proving which TerraFusion DB backs the running API.
/// This controller is read-only and never reaches upstream source systems.
/// </summary>
[ApiController]
[Route("api/runtime/truth")]
[Produces("application/json")]
public sealed class RuntimeTruthController : ControllerBase
{
    private const string ConnectionStringName = "DefaultConnection";

    private readonly TerraFusionDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public RuntimeTruthController(
        TerraFusionDbContext db,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _db = db;
        _configuration = configuration;
        _environment = environment;
    }

    [HttpGet("db-identity")]
    public async Task<IActionResult> GetDbIdentity(CancellationToken ct = default)
    {
        var provider = _db.Database.ProviderName ?? "unknown";
        var (database, dataSource, connectionWarning) = ReadConnectionIdentity();
        var expectedDatabase =
            Environment.GetEnvironmentVariable("TF_EXPECTED_JUNE10_DB_NAME")
            ?? _configuration["RuntimeTruth:ExpectedJune10Database"];
        var expectedProvider =
            Environment.GetEnvironmentVariable("TF_EXPECTED_JUNE10_DB_PROVIDER")
            ?? _configuration["RuntimeTruth:ExpectedJune10Provider"];
        var expectedBentonParcelCount =
            ReadConfiguredInt("RuntimeTruth:ExpectedBentonParcelCount")
            ?? ReadConfiguredInt("BentonCounty:ParcelCount");

        var blockers = new List<string>();
        var warnings = new List<string>();
        if (!string.IsNullOrWhiteSpace(connectionWarning))
            warnings.Add(connectionWarning);

        var databaseMatchesExpected = false;
        var providerMatchesExpected = true;
        var usesRealProvider = !provider.Contains("InMemory", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(expectedDatabase))
        {
            blockers.Add(
                "Expected June 10 TerraFusion DB name is not configured. Set TF_EXPECTED_JUNE10_DB_NAME or RuntimeTruth:ExpectedJune10Database.");
        }
        else
        {
            databaseMatchesExpected = string.Equals(database, expectedDatabase, StringComparison.OrdinalIgnoreCase);
        }

        if (!string.IsNullOrWhiteSpace(expectedDatabase) && !databaseMatchesExpected)
        {
            blockers.Add(
                $"Runtime DB '{database ?? "<unknown>"}' does not match expected June 10 DB '{expectedDatabase}'.");
        }

        if (!string.IsNullOrWhiteSpace(expectedProvider) &&
            !provider.Contains(expectedProvider, StringComparison.OrdinalIgnoreCase))
        {
            providerMatchesExpected = false;
            blockers.Add(
                $"Runtime provider '{provider}' does not match expected provider '{expectedProvider}'.");
        }

        if (!usesRealProvider)
        {
            blockers.Add("Runtime API is using an in-memory provider; June 10 readiness requires a real TerraFusion DB.");
        }

        var migrationState = await ReadMigrationStateAsync(ct);
        warnings.AddRange(migrationState.Warnings);

        var rowCounts = new RuntimeTruthRowCounts(
            Counties: await SafeCountAsync(() => _db.Counties.CountAsync(ct), warnings, "Counties"),
            Properties: await SafeCountAsync(() => _db.Properties.CountAsync(ct), warnings, "Properties"),
            ComparableSales: await SafeCountAsync(() => _db.ComparableSales.CountAsync(ct), warnings, "ComparableSales"),
            CanonicalSaleQualifications: await SafeCountAsync(
                () => _db.CanonicalSaleQualifications.CountAsync(ct),
                warnings,
                "CanonicalSaleQualifications"));

        var isBentonParcelCountExpected =
            expectedBentonParcelCount.HasValue &&
            rowCounts.Properties.HasValue &&
            rowCounts.Properties.Value == expectedBentonParcelCount.Value;

        if (expectedBentonParcelCount.HasValue && rowCounts.Properties.HasValue && !isBentonParcelCountExpected)
        {
            blockers.Add(
                $"Runtime Properties count {rowCounts.Properties.Value} does not match configured Benton parcel count {expectedBentonParcelCount.Value}.");
        }

        var passed = blockers.Count == 0;
        var isExpectedJune10RuntimeDb = databaseMatchesExpected && providerMatchesExpected && usesRealProvider;

        return Ok(new RuntimeDbIdentityResponse(
            ApiBaseUrl: $"{Request.Scheme}://{Request.Host}",
            Environment: _environment.EnvironmentName,
            Provider: provider,
            ConnectionStringName: ConnectionStringName,
            ServerRedacted: RedactDataSource(dataSource),
            Database: database,
            ExpectedJune10Database: expectedDatabase,
            IsExpectedJune10RuntimeDb: isExpectedJune10RuntimeDb,
            ExpectedBentonParcelCount: expectedBentonParcelCount,
            IsBentonParcelCountExpected: isBentonParcelCountExpected,
            MigrationState: migrationState,
            RowCounts: rowCounts,
            Passed: passed,
            Blockers: blockers,
            Warnings: warnings));
    }

    [HttpGet("db-content")]
    public async Task<IActionResult> GetDbContent(CancellationToken ct = default)
    {
        var expectedBentonParcelCount =
            ReadConfiguredInt("RuntimeTruth:ExpectedBentonParcelCount")
            ?? ReadConfiguredInt("BentonCounty:ParcelCount");
        var counties = await _db.Counties
            .AsNoTracking()
            .Select(c => new { c.Id, c.Name, c.FipsCode })
            .ToListAsync(ct);
        var bentonCounty = counties.FirstOrDefault(c =>
            Normalize(c.Name) == "bentoncounty" ||
            Normalize(c.Name) == "benton" ||
            string.Equals(c.FipsCode, "53005", StringComparison.OrdinalIgnoreCase));

        var countySummaries = new List<RuntimeCountyContentSummary>();
        foreach (var county in counties.OrderBy(c => c.Name))
        {
            var query = _db.Properties.AsNoTracking().Where(p => p.CountyId == county.Id);
            var taxYears = await query
                .GroupBy(p => p.TaxYear)
                .Select(g => new { TaxYear = g.Key, Count = g.Count() })
                .OrderBy(x => x.TaxYear)
                .ToListAsync(ct);
            countySummaries.Add(new RuntimeCountyContentSummary(
                CountyId: county.Id,
                CountyName: county.Name,
                FipsCode: county.FipsCode,
                PropertyRows: await query.CountAsync(ct),
                DistinctParcelIds: await query.Select(p => p.ParcelId).Distinct().CountAsync(ct),
                DistinctParcelNumbers: await query.Select(p => p.ParcelNumber).Distinct().CountAsync(ct),
                DistinctPropertyIds: await query.Select(p => p.PropertyId).Distinct().CountAsync(ct),
                DuplicateParcelIdGroups: await query
                    .GroupBy(p => p.ParcelId)
                    .Where(g => g.Count() > 1)
                    .CountAsync(ct),
                DuplicateParcelNumberGroups: await query
                    .GroupBy(p => p.ParcelNumber)
                    .Where(g => g.Count() > 1)
                    .CountAsync(ct),
                MaxRowsPerParcelId: await MaxGroupCountAsync(query.Select(p => p.ParcelId), ct),
                TaxYears: taxYears.Select(x => new RuntimeTaxYearCount(x.TaxYear, x.Count)).ToList()));
        }

        var blockers = new List<string>();
        var warnings = new List<string>();
        RuntimeBentonContentDecision? bentonDecision = null;

        if (expectedBentonParcelCount is null)
        {
            blockers.Add("Expected Benton parcel count is not configured.");
        }

        if (bentonCounty is null)
        {
            blockers.Add("Benton county row was not found in TerraFusion Counties table.");
        }
        else
        {
            var summary = countySummaries.First(c => c.CountyId == bentonCounty.Id);
            var countMatchesRows =
                expectedBentonParcelCount.HasValue && summary.PropertyRows == expectedBentonParcelCount.Value;
            var countMatchesDistinctParcelIds =
                expectedBentonParcelCount.HasValue && summary.DistinctParcelIds == expectedBentonParcelCount.Value;
            var countMatchesDistinctParcelNumbers =
                expectedBentonParcelCount.HasValue &&
                summary.DistinctParcelNumbers == expectedBentonParcelCount.Value;

            var classification = "benton_content_count_unchecked";
            if (countMatchesRows)
            {
                classification = "configured_count_matches_property_rows";
            }
            else if (countMatchesDistinctParcelIds || countMatchesDistinctParcelNumbers)
            {
                classification = "configured_count_matches_distinct_parcels_not_rows";
            }
            else if (expectedBentonParcelCount.HasValue)
            {
                classification = "configured_count_matches_neither_rows_nor_distinct_parcels";
                blockers.Add(
                    $"Configured Benton parcel count {expectedBentonParcelCount.Value} matches neither runtime property rows {summary.PropertyRows} nor distinct parcel ids {summary.DistinctParcelIds}.");
            }

            if (!countMatchesRows && expectedBentonParcelCount.HasValue)
            {
                blockers.Add(
                    $"Runtime Benton property rows {summary.PropertyRows} do not match configured parcel count {expectedBentonParcelCount.Value}.");
            }

            if (summary.DuplicateParcelIdGroups > 0 || summary.DuplicateParcelNumberGroups > 0)
            {
                warnings.Add(
                    $"Runtime Benton properties contain duplicate parcel identifiers: {summary.DuplicateParcelIdGroups} ParcelId groups, {summary.DuplicateParcelNumberGroups} ParcelNumber groups.");
            }

            bentonDecision = new RuntimeBentonContentDecision(
                ExpectedParcelCount: expectedBentonParcelCount,
                PropertyRowsMatchExpected: countMatchesRows,
                DistinctParcelIdsMatchExpected: countMatchesDistinctParcelIds,
                DistinctParcelNumbersMatchExpected: countMatchesDistinctParcelNumbers,
                Classification: classification);
        }

        var passed = blockers.Count == 0;

        return Ok(new RuntimeDbContentResponse(
            ExpectedBentonParcelCount: expectedBentonParcelCount,
            TotalCounties: counties.Count,
            TotalProperties: await _db.Properties.CountAsync(ct),
            CountySummaries: countySummaries,
            BentonDecision: bentonDecision,
            Passed: passed,
            Blockers: blockers,
            Warnings: warnings));
    }

    private (string? Database, string? DataSource, string? Warning) ReadConnectionIdentity()
    {
        try
        {
            var connection = _db.Database.GetDbConnection();
            return (
                string.IsNullOrWhiteSpace(connection.Database) ? null : connection.Database,
                string.IsNullOrWhiteSpace(connection.DataSource) ? null : connection.DataSource,
                null);
        }
        catch (Exception ex) when (ex is InvalidOperationException or NotSupportedException)
        {
            return (
                null,
                null,
                $"Connection identity unavailable for provider '{_db.Database.ProviderName}': {ex.Message}");
        }
    }

    private async Task<RuntimeTruthMigrationState> ReadMigrationStateAsync(CancellationToken ct)
    {
        var warnings = new List<string>();
        try
        {
            var applied = await _db.Database.GetAppliedMigrationsAsync(ct);
            var pending = await _db.Database.GetPendingMigrationsAsync(ct);
            return new RuntimeTruthMigrationState(
                AppliedCount: applied.Count(),
                PendingCount: pending.Count(),
                LatestApplied: applied.LastOrDefault(),
                Warnings: warnings);
        }
        catch (Exception ex) when (ex is InvalidOperationException or NotSupportedException)
        {
            warnings.Add($"Migration state unavailable for provider '{_db.Database.ProviderName}': {ex.Message}");
            return new RuntimeTruthMigrationState(
                AppliedCount: null,
                PendingCount: null,
                LatestApplied: null,
                Warnings: warnings);
        }
    }

    private static async Task<int?> SafeCountAsync(
        Func<Task<int>> count,
        List<string> warnings,
        string tableName)
    {
        try
        {
            return await count();
        }
        catch (Exception ex) when (ex is InvalidOperationException or NotSupportedException)
        {
            warnings.Add($"Could not count {tableName}: {ex.Message}");
            return null;
        }
    }

    private static string? RedactDataSource(string? dataSource)
    {
        if (string.IsNullOrWhiteSpace(dataSource)) return null;

        var trimmed = dataSource.Trim();
        if (trimmed.StartsWith("localhost", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("::1", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals(".", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("(local", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        return "configured-host-redacted";
    }

    private int? ReadConfiguredInt(string key)
    {
        var raw = _configuration[key];
        return int.TryParse(raw, out var value) ? value : null;
    }

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : new string(value.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray());

    private static async Task<int> MaxGroupCountAsync(IQueryable<string> values, CancellationToken ct)
    {
        var counts = await values
            .GroupBy(value => value)
            .Select(group => group.Count())
            .ToListAsync(ct);

        return counts.Count == 0 ? 0 : counts.Max();
    }
}

public sealed record RuntimeDbIdentityResponse(
    string ApiBaseUrl,
    string Environment,
    string Provider,
    string ConnectionStringName,
    string? ServerRedacted,
    string? Database,
    string? ExpectedJune10Database,
    bool IsExpectedJune10RuntimeDb,
    int? ExpectedBentonParcelCount,
    bool IsBentonParcelCountExpected,
    RuntimeTruthMigrationState MigrationState,
    RuntimeTruthRowCounts RowCounts,
    bool Passed,
    IReadOnlyList<string> Blockers,
    IReadOnlyList<string> Warnings);

public sealed record RuntimeTruthMigrationState(
    int? AppliedCount,
    int? PendingCount,
    string? LatestApplied,
    IReadOnlyList<string> Warnings);

public sealed record RuntimeTruthRowCounts(
    int? Counties,
    int? Properties,
    int? ComparableSales,
    int? CanonicalSaleQualifications);

public sealed record RuntimeDbContentResponse(
    int? ExpectedBentonParcelCount,
    int TotalCounties,
    int TotalProperties,
    IReadOnlyList<RuntimeCountyContentSummary> CountySummaries,
    RuntimeBentonContentDecision? BentonDecision,
    bool Passed,
    IReadOnlyList<string> Blockers,
    IReadOnlyList<string> Warnings);

public sealed record RuntimeCountyContentSummary(
    Guid CountyId,
    string CountyName,
    string? FipsCode,
    int PropertyRows,
    int DistinctParcelIds,
    int DistinctParcelNumbers,
    int DistinctPropertyIds,
    int DuplicateParcelIdGroups,
    int DuplicateParcelNumberGroups,
    int MaxRowsPerParcelId,
    IReadOnlyList<RuntimeTaxYearCount> TaxYears);

public sealed record RuntimeTaxYearCount(int TaxYear, int Count);

public sealed record RuntimeBentonContentDecision(
    int? ExpectedParcelCount,
    bool PropertyRowsMatchExpected,
    bool DistinctParcelIdsMatchExpected,
    bool DistinctParcelNumbersMatchExpected,
    string Classification);
