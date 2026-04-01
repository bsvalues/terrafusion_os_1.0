// =============================================================================
// PACS SQL Adapter - pacscontract.v1 Implementation
// =============================================================================
// SQL Server implementation of IPacsAdapter.
// Uses the TerraFusion views defined in pacscontract.v1:
//   - vw_TerraFusion_Property_Core
//   - vw_TerraFusion_Property_Ownership
//   - vw_TerraFusion_Assessment_History
//
// This is the ONLY authorized SQL access point for PACS data.
// =============================================================================

using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Dapper;

namespace TerraFusion.Core.PACS
{
    /// <summary>
    /// SQL Server implementation of IPacsAdapter.
    /// Implements pacscontract.v1 with fail-closed semantics.
    /// </summary>
    public sealed class PacsSqlAdapter : IPacsAdapter, IDisposable
    {
        private readonly ILogger<PacsSqlAdapter> _logger;
        private readonly string _connectionString;
        private readonly string _salesConnectionString;
        private readonly int _commandTimeout;
        private DateTime? _lastConnectedAt;
        private bool _disposed;

        // Contract-defined view names
        private const string ViewPropertyCore = "vw_TerraFusion_Property_Core";
        private const string ViewPropertyOwnership = "vw_TerraFusion_Property_Ownership";
        private const string ViewAssessmentHistory = "vw_TerraFusion_Assessment_History";
        private const string ViewComparableSales = "vw_TerraFusion_Comparable_Sales";
        private const string ViewCamaCharacteristics = "vw_TerraFusion_Cama_Characteristics";
        private const string ViewImprovementCostMatrices = "vw_TerraFusion_Improvement_Cost_Matrices";
        private const string ProcHealthCheck = "sp_TerraFusion_HealthCheck";

        // Contract-defined indexes (warning only)
        private static readonly string[] RequiredIndexes = new[]
        {
            "IX_TerraFusion_Property_GeoID",
            "IX_TerraFusion_PropertyVal_PropYear",
            "IX_TerraFusion_Situs_Property"
        };

        public PacsSqlAdapter(
            ILogger<PacsSqlAdapter> logger,
            IConfiguration configuration)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            // Get connection string from configuration
            _connectionString = configuration.GetConnectionString("PacsConnection")
                ?? configuration["PACS:ConnectionString"]
                ?? throw new PacsContractViolationException(
                    PacsErrorCodes.ConnectionFailed,
                    "PACS connection string not configured. Set 'ConnectionStrings:PacsConnection' or 'PACS:ConnectionString'.");

            _salesConnectionString = configuration.GetConnectionString("PacsSalesConnection")
                ?? configuration["PACS:SalesConnectionString"]
                ?? _connectionString;

            // Validate connection string has required properties per pacscontract.v1
            ValidateConnectionString(_connectionString);
            ValidateConnectionString(_salesConnectionString);

            _commandTimeout = configuration.GetValue("PACS:CommandTimeoutSeconds", 30);
        }

        private static void ValidateConnectionString(string connectionString)
        {
            var builder = new SqlConnectionStringBuilder(connectionString);

            // pacscontract.v1 requires encryption
            if (!builder.Encrypt)
            {
                throw new PacsContractViolationException(
                    PacsErrorCodes.ConnectionFailed,
                    "PACS connection must use encryption (Encrypt=true) per pacscontract.v1");
            }

            // pacscontract.v1 requires application name for audit trail
            if (string.IsNullOrEmpty(builder.ApplicationName) || !builder.ApplicationName.Contains("TerraFusion"))
            {
                builder.ApplicationName = "TerraFusion-OS";
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // CONTRACT PROOF & HEALTH
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsContractProof> ValidateContractAsync(CancellationToken cancellationToken = default)
        {
            var errors = new List<string>();
            var warnings = new List<string>();

            // Check database connection
            var dbConnection = await CheckDatabaseConnectionAsync(cancellationToken);
            if (!dbConnection.Passed)
            {
                errors.Add(dbConnection.Details ?? "Database connection failed");
            }

            // Check required views
            var viewsCheck = await CheckRequiredViewsAsync(cancellationToken);
            if (!viewsCheck.Passed)
            {
                errors.Add(viewsCheck.Details ?? "Required views missing");
            }

            // Check required indexes (warning only per pacscontract.v1)
            var indexesCheck = await CheckRequiredIndexesAsync(cancellationToken);
            if (!indexesCheck.Passed)
            {
                warnings.Add(indexesCheck.Details ?? "Some indexes missing - performance may be degraded");
            }

            // Check health check procedure
            var procCheck = await CheckHealthCheckProcedureAsync(cancellationToken);
            if (!procCheck.Passed)
            {
                errors.Add(procCheck.Details ?? "Health check procedure missing");
            }

            // Execute health check if procedure exists
            var healthExec = new PacsProofItem { Name = "HealthCheckExecution", Passed = false, Severity = "error" };
            if (procCheck.Passed)
            {
                healthExec = await ExecuteHealthCheckAsync(cancellationToken);
                if (!healthExec.Passed)
                {
                    errors.Add(healthExec.Details ?? "Health check execution failed");
                }
            }

            var isValid = errors.Count == 0;

            _logger.LogInformation(
                "PACS contract validation {Result}: {ErrorCount} errors, {WarningCount} warnings",
                isValid ? "PASSED" : "FAILED", errors.Count, warnings.Count);

            return new PacsContractProof
            {
                IsValid = isValid,
                ValidatedAt = DateTime.UtcNow,
                DatabaseConnection = dbConnection,
                RequiredViews = viewsCheck,
                RequiredIndexes = indexesCheck,
                HealthCheckProcedure = procCheck,
                HealthCheckExecution = healthExec,
                Errors = errors,
                Warnings = warnings
            };
        }

        private async Task<PacsProofItem> CheckDatabaseConnectionAsync(CancellationToken cancellationToken)
        {
            try
            {
                await using var connection = CreatePrimaryConnection();
                var sw = Stopwatch.StartNew();
                await connection.OpenAsync(cancellationToken);
                sw.Stop();

                _lastConnectedAt = DateTime.UtcNow;

                // Verify we're connected to pacs_oltp
                var dbName = connection.Database;
                if (!dbName.Equals("pacs_oltp", StringComparison.OrdinalIgnoreCase))
                {
                    return new PacsProofItem
                    {
                        Name = "DatabaseConnection",
                        Passed = false,
                        Severity = "error",
                        Details = $"Connected to '{dbName}' but pacscontract.v1 requires 'pacs_oltp'"
                    };
                }

                return new PacsProofItem
                {
                    Name = "DatabaseConnection",
                    Passed = true,
                    Severity = "error",
                    Details = $"Connected to pacs_oltp in {sw.ElapsedMilliseconds}ms"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PACS database connection check failed");
                return new PacsProofItem
                {
                    Name = "DatabaseConnection",
                    Passed = false,
                    Severity = "error",
                    Details = $"Connection failed: {ex.Message}"
                };
            }
        }

        private async Task<PacsProofItem> CheckRequiredViewsAsync(CancellationToken cancellationToken)
        {
            try
            {
                var missingViews = new List<string>();

                await using (var connection = CreatePrimaryConnection())
                {
                    await connection.OpenAsync(cancellationToken);

                    foreach (var view in new[] { ViewPropertyCore, ViewPropertyOwnership, ViewAssessmentHistory })
                    {
                        var exists = await connection.ExecuteScalarAsync<int>(
                            "SELECT COUNT(*) FROM sys.views WHERE name = @ViewName",
                            new { ViewName = view });

                        if (exists == 0)
                        {
                            missingViews.Add($"pacs_oltp.{view}");
                        }
                    }
                }

                await using (var salesConnection = CreateSalesConnection())
                {
                    await salesConnection.OpenAsync(cancellationToken);

                    foreach (var view in new[] { ViewComparableSales, ViewCamaCharacteristics, ViewImprovementCostMatrices })
                    {
                        var exists = await salesConnection.ExecuteScalarAsync<int>(
                            "SELECT COUNT(*) FROM sys.views WHERE name = @ViewName",
                            new { ViewName = view });

                        if (exists == 0)
                        {
                            missingViews.Add($"{salesConnection.Database}.{view}");
                        }
                    }
                }

                if (missingViews.Count > 0)
                {
                    return new PacsProofItem
                    {
                        Name = "RequiredViews",
                        Passed = false,
                        Severity = "error",
                        Details = $"Missing views: {string.Join(", ", missingViews)}"
                    };
                }

                return new PacsProofItem
                {
                    Name = "RequiredViews",
                    Passed = true,
                    Severity = "error",
                    Details = $"Core views present in pacs_oltp; sales/CAMA/matrix views present in {GetDatabaseName(_salesConnectionString)}"
                };
            }
            catch (Exception ex)
            {
                return new PacsProofItem
                {
                    Name = "RequiredViews",
                    Passed = false,
                    Severity = "error",
                    Details = $"View check failed: {ex.Message}"
                };
            }
        }

        private async Task<PacsProofItem> CheckRequiredIndexesAsync(CancellationToken cancellationToken)
        {
            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var missingIndexes = new List<string>();

                foreach (var index in RequiredIndexes)
                {
                    var exists = await connection.ExecuteScalarAsync<int>(
                        "SELECT COUNT(*) FROM sys.indexes WHERE name = @IndexName",
                        new { IndexName = index });

                    if (exists == 0)
                    {
                        missingIndexes.Add(index);
                    }
                }

                if (missingIndexes.Count > 0)
                {
                    return new PacsProofItem
                    {
                        Name = "RequiredIndexes",
                        Passed = false,
                        Severity = "warning",  // per pacscontract.v1, indexes are warning-only
                        Details = $"Missing indexes (performance impact): {string.Join(", ", missingIndexes)}"
                    };
                }

                return new PacsProofItem
                {
                    Name = "RequiredIndexes",
                    Passed = true,
                    Severity = "warning",
                    Details = "All 3 required indexes present"
                };
            }
            catch (Exception ex)
            {
                return new PacsProofItem
                {
                    Name = "RequiredIndexes",
                    Passed = false,
                    Severity = "warning",
                    Details = $"Index check failed: {ex.Message}"
                };
            }
        }

        private async Task<PacsProofItem> CheckHealthCheckProcedureAsync(CancellationToken cancellationToken)
        {
            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var exists = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM sys.procedures WHERE name = @ProcName",
                    new { ProcName = ProcHealthCheck });

                return new PacsProofItem
                {
                    Name = "HealthCheckProcedure",
                    Passed = exists > 0,
                    Severity = "error",
                    Details = exists > 0 ? $"{ProcHealthCheck} exists" : $"{ProcHealthCheck} not found"
                };
            }
            catch (Exception ex)
            {
                return new PacsProofItem
                {
                    Name = "HealthCheckProcedure",
                    Passed = false,
                    Severity = "error",
                    Details = $"Procedure check failed: {ex.Message}"
                };
            }
        }

        private async Task<PacsProofItem> ExecuteHealthCheckAsync(CancellationToken cancellationToken)
        {
            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
                    ProcHealthCheck,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: _commandTimeout);

                return new PacsProofItem
                {
                    Name = "HealthCheckExecution",
                    Passed = true,
                    Severity = "error",
                    Details = "Health check executed successfully"
                };
            }
            catch (Exception ex)
            {
                return new PacsProofItem
                {
                    Name = "HealthCheckExecution",
                    Passed = false,
                    Severity = "error",
                    Details = $"Health check execution failed: {ex.Message}"
                };
            }
        }

        public async Task<PacsConnectionStatus> GetConnectionStatusAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                await using var connection = CreatePrimaryConnection();
                var sw = Stopwatch.StartNew();
                await connection.OpenAsync(cancellationToken);
                sw.Stop();

                _lastConnectedAt = DateTime.UtcNow;

                var builder = new SqlConnectionStringBuilder(_connectionString);

                return new PacsConnectionStatus
                {
                    IsConnected = true,
                    DatabaseName = connection.Database,
                    ServerName = MaskServerName(builder.DataSource),
                    LastConnectedAt = _lastConnectedAt,
                    LatencyMs = sw.Elapsed.TotalMilliseconds
                };
            }
            catch (Exception ex)
            {
                return new PacsConnectionStatus
                {
                    IsConnected = false,
                    LastConnectedAt = _lastConnectedAt,
                    ErrorMessage = ex.Message,
                    ErrorCode = PacsErrorCodes.ConnectionFailed
                };
            }
        }

        private static string MaskServerName(string server)
        {
            if (string.IsNullOrEmpty(server)) return "***";
            if (server.Length <= 4) return "***";
            return server.Substring(0, 2) + "***" + server.Substring(server.Length - 2);
        }

        // ═══════════════════════════════════════════════════════════════
        // PROPERTY QUERIES
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsPropertyCore?> GetPropertyByIdAsync(int propId, CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        prop_type_cd AS PropTypeCd,
                        situs_addr AS SitusAddr,
                        situs_city AS SitusCity,
                        situs_zip AS SitusZip,
                        legal_desc AS LegalDesc,
                        assessed_val AS AssessedVal,
                        market_val AS MarketVal,
                        land_val AS LandVal,
                        imprv_val AS ImprvVal,
                        appr_year AS ApprYear,
                        last_modified AS LastModified
                    FROM {ViewPropertyCore}
                    WHERE prop_id = @PropId";

                return await connection.QueryFirstOrDefaultAsync<PacsPropertyCore>(
                    sql, new { PropId = propId }, commandTimeout: _commandTimeout);
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        public async Task<PacsPropertyCore?> GetPropertyByGeoIdAsync(string geoId, CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        prop_type_cd AS PropTypeCd,
                        situs_addr AS SitusAddr,
                        situs_city AS SitusCity,
                        situs_zip AS SitusZip,
                        legal_desc AS LegalDesc,
                        assessed_val AS AssessedVal,
                        market_val AS MarketVal,
                        land_val AS LandVal,
                        imprv_val AS ImprvVal,
                        appr_year AS ApprYear,
                        last_modified AS LastModified
                    FROM {ViewPropertyCore}
                    WHERE geo_id = @GeoId";

                return await connection.QueryFirstOrDefaultAsync<PacsPropertyCore>(
                    sql, new { GeoId = geoId }, commandTimeout: _commandTimeout);
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        public async Task<PacsPagedResult<PacsPropertyCore>> GetPropertiesAsync(
            int page = 1,
            int pageSize = 100,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 100;
            if (pageSize > 1000) pageSize = 1000; // Cap at 1000

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var offset = (page - 1) * pageSize;

                var countSql = $"SELECT COUNT(*) FROM {ViewPropertyCore}";
                var totalCount = await connection.ExecuteScalarAsync<int>(countSql, commandTimeout: _commandTimeout);

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        prop_type_cd AS PropTypeCd,
                        situs_addr AS SitusAddr,
                        situs_city AS SitusCity,
                        situs_zip AS SitusZip,
                        legal_desc AS LegalDesc,
                        assessed_val AS AssessedVal,
                        market_val AS MarketVal,
                        land_val AS LandVal,
                        imprv_val AS ImprvVal,
                        appr_year AS ApprYear,
                        last_modified AS LastModified
                    FROM {ViewPropertyCore}
                    ORDER BY prop_id
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var items = await connection.QueryAsync<PacsPropertyCore>(
                    sql, new { Offset = offset, PageSize = pageSize }, commandTimeout: _commandTimeout);

                return new PacsPagedResult<PacsPropertyCore>
                {
                    Items = items.ToList(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        /// <summary>
        /// Text search across GeoId, situs_addr, and situs_city via SQL Server LIKE.
        /// Pushes the WHERE clause into the PACS view query.
        /// </summary>
        public async Task<PacsPagedResult<PacsPropertyCore>> SearchPropertiesAsync(
            string searchText,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 200) pageSize = 200;

            var like = $"%{searchText.Trim()}%";

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var offset = (page - 1) * pageSize;

                var countSql = $@"
                    SELECT COUNT(*) FROM {ViewPropertyCore}
                    WHERE geo_id LIKE @Like
                       OR situs_addr LIKE @Like
                       OR situs_city LIKE @Like";

                var totalCount = await connection.ExecuteScalarAsync<int>(
                    countSql, new { Like = like }, commandTimeout: _commandTimeout);

                if (totalCount == 0)
                {
                    return new PacsPagedResult<PacsPropertyCore>
                    {
                        Items = Array.Empty<PacsPropertyCore>(),
                        Page = page,
                        PageSize = pageSize,
                        TotalCount = 0,
                    };
                }

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        prop_type_cd AS PropTypeCd,
                        situs_addr AS SitusAddr,
                        situs_city AS SitusCity,
                        situs_zip AS SitusZip,
                        legal_desc AS LegalDesc,
                        assessed_val AS AssessedVal,
                        market_val AS MarketVal,
                        land_val AS LandVal,
                        imprv_val AS ImprvVal,
                        appr_year AS ApprYear,
                        last_modified AS LastModified
                    FROM {ViewPropertyCore}
                    WHERE geo_id LIKE @Like
                       OR situs_addr LIKE @Like
                       OR situs_city LIKE @Like
                    ORDER BY prop_id
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var items = await connection.QueryAsync<PacsPropertyCore>(
                    sql, new { Like = like, Offset = offset, PageSize = pageSize },
                    commandTimeout: _commandTimeout);

                return new PacsPagedResult<PacsPropertyCore>
                {
                    Items = items.ToList(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                };
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // OWNERSHIP QUERIES
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsPropertyOwnership?> GetOwnershipAsync(int propId, CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        owner_name AS OwnerName,
                        mail_addr_1 AS MailAddr1,
                        mail_addr_2 AS MailAddr2,
                        mail_city AS MailCity,
                        mail_state AS MailState,
                        mail_zip AS MailZip,
                        pct_ownership AS PctOwnership,
                        deed_date AS DeedDate
                    FROM {ViewPropertyOwnership}
                    WHERE prop_id = @PropId";

                return await connection.QueryFirstOrDefaultAsync<PacsPropertyOwnership>(
                    sql, new { PropId = propId }, commandTimeout: _commandTimeout);
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        public async Task<IReadOnlyList<PacsPropertyOwnership>> GetOwnershipByIdsAsync(
            IEnumerable<int> propIds,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            var idList = propIds.Distinct().ToList();
            if (idList.Count == 0)
            {
                return Array.Empty<PacsPropertyOwnership>();
            }

            if (idList.Count > 1000)
            {
                throw new ArgumentException("Cannot query more than 1000 property ownership records at once", nameof(propIds));
            }

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        owner_name AS OwnerName,
                        mail_addr_1 AS MailAddr1,
                        mail_addr_2 AS MailAddr2,
                        mail_city AS MailCity,
                        mail_state AS MailState,
                        mail_zip AS MailZip,
                        pct_ownership AS PctOwnership,
                        deed_date AS DeedDate
                    FROM {ViewPropertyOwnership}
                    WHERE prop_id IN @PropIds";

                var ownership = await connection.QueryAsync<PacsPropertyOwnership>(
                    sql,
                    new { PropIds = idList },
                    commandTimeout: _commandTimeout);

                return ownership.ToList();
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // ASSESSMENT QUERIES
        // ═══════════════════════════════════════════════════════════════

        public async Task<IReadOnlyList<PacsAssessmentHistory>> GetAssessmentHistoryAsync(
            int propId,
            int? yearFrom = null,
            int? yearTo = null,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            try
            {
                await using var connection = CreateSalesConnection();
                await connection.OpenAsync(cancellationToken);

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        prop_val_yr AS PropValYr,
                        assessed_val AS AssessedVal,
                        market_val AS MarketVal,
                        land_val AS LandVal,
                        imprv_val AS ImprvVal,
                        appraised_by AS AppraisedBy,
                        appraisal_dt AS AppraisalDt
                    FROM {ViewAssessmentHistory}
                    WHERE prop_id = @PropId
                        AND (@YearFrom IS NULL OR prop_val_yr >= @YearFrom)
                        AND (@YearTo IS NULL OR prop_val_yr <= @YearTo)
                    ORDER BY prop_val_yr DESC";

                var results = await connection.QueryAsync<PacsAssessmentHistory>(
                    sql, new { PropId = propId, YearFrom = yearFrom, YearTo = yearTo },
                    commandTimeout: _commandTimeout);

                return results.ToList();
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        public async Task<PacsAssessmentHistory?> GetCurrentAssessmentAsync(int propId, CancellationToken cancellationToken = default)
        {
            var currentYear = DateTime.Now.Year;
            var history = await GetAssessmentHistoryAsync(propId, currentYear, currentYear, cancellationToken);
            return history.FirstOrDefault();
        }

        // ═══════════════════════════════════════════════════════════════
        // COMPARABLE SALES QUERIES
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsPagedResult<PacsComparableSale>> GetComparableSalesAsync(
            int page = 1,
            int pageSize = 500,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 1000) pageSize = 500;

            try
            {
                await using var connection = CreateSalesConnection();
                await connection.OpenAsync(cancellationToken);

                _logger.LogInformation(
                    "PACS sales connection opened: configuredDb={ConfiguredDatabase}, actualDb={ActualDatabase}",
                    GetDatabaseName(_salesConnectionString),
                    connection.Database);

                var totalCount = await connection.ExecuteScalarAsync<int>(
                    $"SELECT COUNT(*) FROM {ViewComparableSales}");

                var rawSaleCount = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM sale WHERE COALESCE(NULLIF(adjusted_sl_price, 0), NULLIF(sl_price, 0)) > 0");

                _logger.LogInformation(
                    "PACS comparable sales source counts: comparableView={ComparableViewCount}, rawPositiveSales={RawSaleCount}",
                    totalCount,
                    rawSaleCount);

                var offset = (page - 1) * pageSize;
                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        sale_date AS SaleDate,
                        sale_price AS SalePrice,
                        prop_type_cd AS PropTypeCd,
                        situs_addr AS SitusAddr,
                        neighborhood AS Neighborhood,
                        sale_ratio_type_cd AS SaleRatioTypeCd,
                        deed_type_cd AS DeedTypeCd,
                        consideration AS Consideration,
                        last_modified AS LastModified
                    FROM {ViewComparableSales}
                    ORDER BY sale_date DESC, prop_id
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var items = await connection.QueryAsync<PacsComparableSale>(
                    sql,
                    new { Offset = offset, PageSize = pageSize },
                    commandTimeout: _commandTimeout);

                return new PacsPagedResult<PacsComparableSale>
                {
                    Items = items.ToList(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        public async Task<PacsPagedResult<PacsCamaCharacteristic>> GetCamaCharacteristicsAsync(
            int page = 1,
            int pageSize = 500,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 1000) pageSize = 500;

            try
            {
                await using var connection = CreateSalesConnection();
                await connection.OpenAsync(cancellationToken);

                var totalCount = await connection.ExecuteScalarAsync<int>(
                    $"SELECT COUNT(*) FROM {ViewCamaCharacteristics}");

                var offset = (page - 1) * pageSize;
                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        tax_year AS TaxYear,
                        building_type AS BuildingType,
                        building_type_description AS BuildingTypeDescription,
                        region AS Region,
                        square_feet AS SquareFeet,
                        stories AS Stories,
                        basement_sqft AS BasementSqft,
                        garage_sqft AS GarageSqft,
                        quality_grade AS QualityGrade,
                        condition_grade AS ConditionGrade,
                        complexity_grade AS ComplexityGrade,
                        exterior_wall AS ExteriorWall,
                        roof_type AS RoofType,
                        foundation AS Foundation,
                        hvac_type AS HvacType,
                        interior_finish AS InteriorFinish,
                        year_built AS YearBuilt,
                        effective_age AS EffectiveAge,
                        economic_life AS EconomicLife,
                        land_area_sqft AS LandAreaSqft,
                        land_zone AS LandZone,
                        land_adjustment_factor AS LandAdjustmentFactor,
                        bedrooms AS Bedrooms,
                        bathrooms AS Bathrooms,
                        fireplaces AS Fireplaces,
                        has_pool AS HasPool,
                        functional_obsolescence AS FunctionalObsolescence,
                        external_obsolescence AS ExternalObsolescence,
                        neighborhood AS Neighborhood,
                        property_type_cd AS PropertyTypeCd,
                        last_modified AS LastModified
                    FROM {ViewCamaCharacteristics}
                    ORDER BY prop_id
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var items = await connection.QueryAsync<PacsCamaCharacteristic>(
                    sql,
                    new { Offset = offset, PageSize = pageSize },
                    commandTimeout: _commandTimeout);

                return new PacsPagedResult<PacsCamaCharacteristic>
                {
                    Items = items.ToList(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        public async Task<PacsPagedResult<PacsImprovementCostMatrix>> GetImprovementCostMatricesAsync(
            int page = 1,
            int pageSize = 500,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 1000) pageSize = 500;

            try
            {
                await using var connection = CreateSalesConnection();
                await connection.OpenAsync(cancellationToken);

                var totalCount = await connection.ExecuteScalarAsync<int>(
                    $"SELECT COUNT(*) FROM {ViewImprovementCostMatrices}");

                var offset = (page - 1) * pageSize;
                var sql = $@"
                    SELECT
                        source_matrix_id AS SourceMatrixId,
                        matrix_year AS MatrixYear,
                        matrix_type AS MatrixType,
                        base_rate AS BaseRate,
                        multiplier AS Multiplier,
                        region AS Region,
                        building_type AS BuildingType,
                        building_type_description AS BuildingTypeDescription,
                        base_cost AS BaseCost,
                        matrix_description AS MatrixDescription,
                        data_points AS DataPoints,
                        min_cost AS MinCost,
                        max_cost AS MaxCost,
                        grade AS Grade,
                        condition AS Condition,
                        year_built AS YearBuilt,
                        depreciation_rate AS DepreciationRate,
                        axis_1 AS Axis1,
                        axis_2 AS Axis2,
                        adjustment_factor_raw AS AdjustmentFactorRaw,
                        matrix_label AS MatrixLabel
                    FROM {ViewImprovementCostMatrices}
                    ORDER BY matrix_year DESC, source_matrix_id
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var items = await connection.QueryAsync<PacsImprovementCostMatrix>(
                    sql,
                    new { Offset = offset, PageSize = pageSize },
                    commandTimeout: _commandTimeout);

                return new PacsPagedResult<PacsImprovementCostMatrix>
                {
                    Items = items.ToList(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // BATCH OPERATIONS
        // ═══════════════════════════════════════════════════════════════

        public async Task<IReadOnlyList<PacsPropertyCore>> GetPropertiesByIdsAsync(
            IEnumerable<int> propIds,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            var idList = propIds.ToList();
            if (idList.Count == 0) return Array.Empty<PacsPropertyCore>();
            if (idList.Count > 1000)
            {
                throw new ArgumentException("Cannot query more than 1000 properties at once", nameof(propIds));
            }

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var sql = $@"
                    SELECT
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        prop_type_cd AS PropTypeCd,
                        situs_addr AS SitusAddr,
                        situs_city AS SitusCity,
                        situs_zip AS SitusZip,
                        legal_desc AS LegalDesc,
                        assessed_val AS AssessedVal,
                        market_val AS MarketVal,
                        land_val AS LandVal,
                        imprv_val AS ImprvVal,
                        appr_year AS ApprYear,
                        last_modified AS LastModified
                    FROM {ViewPropertyCore}
                    WHERE prop_id IN @PropIds";

                var results = await connection.QueryAsync<PacsPropertyCore>(
                    sql, new { PropIds = idList }, commandTimeout: _commandTimeout);

                return results.ToList();
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        public async Task<IReadOnlyList<PacsPropertyCore>> GetChangedPropertiesAsync(
            DateTime since,
            int maxResults = 1000,
            CancellationToken cancellationToken = default)
        {
            await EnsureContractValidAsync(cancellationToken);

            if (maxResults > 10000) maxResults = 10000;

            try
            {
                await using var connection = CreatePrimaryConnection();
                await connection.OpenAsync(cancellationToken);

                var sql = $@"
                    SELECT TOP (@MaxResults)
                        prop_id AS PropId,
                        geo_id AS GeoId,
                        prop_type_cd AS PropTypeCd,
                        situs_addr AS SitusAddr,
                        situs_city AS SitusCity,
                        situs_zip AS SitusZip,
                        legal_desc AS LegalDesc,
                        assessed_val AS AssessedVal,
                        market_val AS MarketVal,
                        land_val AS LandVal,
                        imprv_val AS ImprvVal,
                        appr_year AS ApprYear,
                        last_modified AS LastModified
                    FROM {ViewPropertyCore}
                    WHERE last_modified > @Since
                    ORDER BY last_modified";

                var results = await connection.QueryAsync<PacsPropertyCore>(
                    sql, new { Since = since, MaxResults = maxResults }, commandTimeout: _commandTimeout);

                return results.ToList();
            }
            catch (SqlException ex)
            {
                throw WrapSqlException(ex);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIVATE HELPERS
        // ═══════════════════════════════════════════════════════════════

        private PacsContractProof? _cachedProof;
        private DateTime? _proofCachedAt;
        private static readonly TimeSpan ProofCacheDuration = TimeSpan.FromMinutes(5);

        private async Task EnsureContractValidAsync(CancellationToken cancellationToken)
        {
            // Cache the proof for 5 minutes to avoid repeated validation on every query
            if (_cachedProof != null &&
                _proofCachedAt.HasValue &&
                DateTime.UtcNow - _proofCachedAt.Value < ProofCacheDuration)
            {
                if (!_cachedProof.IsValid)
                {
                    throw new PacsContractViolationException(
                        PacsErrorCodes.ConnectionFailed,
                        $"PACS contract validation failed: {string.Join("; ", _cachedProof.Errors)}");
                }
                return;
            }

            _cachedProof = await ValidateContractAsync(cancellationToken);
            _proofCachedAt = DateTime.UtcNow;

            if (!_cachedProof.IsValid)
            {
                throw new PacsContractViolationException(
                    PacsErrorCodes.ConnectionFailed,
                    $"PACS contract validation failed: {string.Join("; ", _cachedProof.Errors)}");
            }
        }

        private PacsContractViolationException WrapSqlException(SqlException ex)
        {
            _logger.LogError(ex, "PACS SQL error: {ErrorNumber} - {Message}", ex.Number, ex.Message);

            return ex.Number switch
            {
                -2 => new PacsContractViolationException(PacsErrorCodes.Timeout, "PACS query timeout", ex),
                229 => new PacsContractViolationException(PacsErrorCodes.PermissionDenied, "PACS permission denied", ex),
                208 => new PacsContractViolationException(PacsErrorCodes.ViewMissing, $"PACS object not found: {ex.Message}", ex),
                _ => new PacsContractViolationException(PacsErrorCodes.ConnectionFailed, $"PACS SQL error: {ex.Message}", ex)
            };
        }

        private SqlConnection CreatePrimaryConnection() => new(_connectionString);

        private SqlConnection CreateSalesConnection() => new(_salesConnectionString);

        private static string GetDatabaseName(string connectionString)
        {
            var builder = new SqlConnectionStringBuilder(connectionString);
            return string.IsNullOrWhiteSpace(builder.InitialCatalog) ? "<unknown>" : builder.InitialCatalog;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            // No unmanaged resources to dispose
        }
    }
}
