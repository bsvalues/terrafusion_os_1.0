using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using System.Data;
using System.Data.Common;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Dynamic Property Count Service - NO HARDCODED VALUES
    /// Queries actual database for real-time property counts
    /// Replaces all hardcoded property numbers (await DynamicPropertyService.GetPropertyCountAsync("benton"), await DynamicPropertyService.GetPropertyCountAsync(countyCode), etc.)
    /// </summary>
    public interface IDynamicPropertyService
    {
        Task<int> GetActivePropertyCountAsync(string countyCode);
        Task<PropertyMetrics> GetPropertyMetricsAsync(string countyCode);
        Task<Dictionary<string, int>> GetAllCountyPropertyCountsAsync();
        Task InvalidatePropertyCountCacheAsync(string countyCode);
    }

    public class DynamicPropertyService : IDynamicPropertyService
    {
        private readonly IDbConnection _dbConnection;
        private readonly IMemoryCache _cache;
        private readonly ILogger<DynamicPropertyService> _logger;
        private const int CacheExpirationSeconds = 300; // 5 minutes

        public DynamicPropertyService(
            IDbConnection dbConnection,
            IMemoryCache cache,
            ILogger<DynamicPropertyService> logger)
        {
            _dbConnection = dbConnection;
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// Get active property count for county - NO HARDCODING
        /// Queries: SELECT COUNT(*) FROM properties WHERE county_id = @countyCode AND status = 'active'
        /// </summary>
        public async Task<int> GetActivePropertyCountAsync(string countyCode)
        {
            var cacheKey = $"property_count_{countyCode}";

            if (_cache.TryGetValue(cacheKey, out int cachedCount))
            {
                _logger.LogDebug("Returning cached property count for {County}: {Count}", countyCode, cachedCount);
                return cachedCount;
            }

            try
            {
                var query = @"
                    SELECT COUNT(*) 
                    FROM properties 
                    WHERE county_id = @countyCode 
                    AND status = 'active'
                    AND deleted_at IS NULL";

                using var command = _dbConnection.CreateCommand();
                command.CommandText = query;

                var parameter = command.CreateParameter();
                parameter.ParameterName = "@countyCode";
                parameter.Value = countyCode;
                command.Parameters.Add(parameter);

                var result = await ((DbCommand)command).ExecuteScalarAsync();
                var propertyCount = Convert.ToInt32(result);

                // Cache for 5 minutes
                _cache.Set(cacheKey, propertyCount, TimeSpan.FromSeconds(CacheExpirationSeconds));

                _logger.LogInformation("Retrieved property count for {County}: {Count}", countyCode, propertyCount);
                return propertyCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property count for county {County}", countyCode);
                // Return 0 instead of hardcoded fallback
                return 0;
            }
        }

        /// <summary>
        /// Get comprehensive property metrics for county
        /// </summary>
        public async Task<PropertyMetrics> GetPropertyMetricsAsync(string countyCode)
        {
            try
            {
                var query = @"
                    SELECT 
                        COUNT(*) as total_properties,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_properties,
                        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_properties,
                        COUNT(CASE WHEN assessment_date >= NOW() - INTERVAL '1 year' THEN 1 END) as recently_assessed,
                        AVG(assessed_value) as avg_assessed_value,
                        MAX(assessment_date) as last_assessment_date
                    FROM properties 
                    WHERE county_id = @countyCode 
                    AND deleted_at IS NULL";

                using var command = _dbConnection.CreateCommand();
                command.CommandText = query;

                var parameter = command.CreateParameter();
                parameter.ParameterName = "@countyCode";
                parameter.Value = countyCode;
                command.Parameters.Add(parameter);

                using var reader = await ((DbCommand)command).ExecuteReaderAsync();

                if (await ((DbDataReader)reader).ReadAsync())
                {
                    return new PropertyMetrics
                    {
                        CountyCode = countyCode,
                        TotalProperties = reader.GetInt32("total_properties"),
                        ActiveProperties = reader.GetInt32("active_properties"),
                        InactiveProperties = reader.GetInt32("inactive_properties"),
                        RecentlyAssessed = reader.GetInt32("recently_assessed"),
                        AverageAssessedValue = reader.GetDecimal("avg_assessed_value"),
                        LastAssessmentDate = reader.GetDateTime("last_assessment_date"),
                        QueryTimestamp = DateTime.UtcNow
                    };
                }

                return new PropertyMetrics { CountyCode = countyCode, QueryTimestamp = DateTime.UtcNow };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property metrics for county {County}", countyCode);
                return new PropertyMetrics { CountyCode = countyCode, QueryTimestamp = DateTime.UtcNow };
            }
        }

        /// <summary>
        /// Get property counts for all counties - NO HARDCODING
        /// </summary>
        public async Task<Dictionary<string, int>> GetAllCountyPropertyCountsAsync()
        {
            try
            {
                var query = @"
                    SELECT 
                        county_id,
                        COUNT(*) as property_count
                    FROM properties 
                    WHERE status = 'active' 
                    AND deleted_at IS NULL
                    GROUP BY county_id";

                using var command = _dbConnection.CreateCommand();
                command.CommandText = query;

                var results = new Dictionary<string, int>();

                using var reader = await ((DbCommand)command).ExecuteReaderAsync();

                while (await ((DbDataReader)reader).ReadAsync())
                {
                    var countyCode = reader.GetString("county_id");
                    var propertyCount = reader.GetInt32("property_count");
                    results[countyCode] = propertyCount;
                }

                _logger.LogInformation("Retrieved property counts for {CountyCount} counties", results.Count);
                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all county property counts");
                return new Dictionary<string, int>();
            }
        }

        /// <summary>
        /// Invalidate cached property count for county
        /// Call after property updates
        /// </summary>
        public async Task InvalidatePropertyCountCacheAsync(string countyCode)
        {
            var cacheKey = $"property_count_{countyCode}";
            _cache.Remove(cacheKey);

            _logger.LogDebug("Invalidated property count cache for {County}", countyCode);
            await Task.CompletedTask;
        }
    }

    public class PropertyMetrics
    {
        public string CountyCode { get; set; } = "";
        public int TotalProperties { get; set; }
        public int ActiveProperties { get; set; }
        public int InactiveProperties { get; set; }
        public int RecentlyAssessed { get; set; }
        public decimal AverageAssessedValue { get; set; }
        public DateTime LastAssessmentDate { get; set; }
        public DateTime QueryTimestamp { get; set; }
    }
}