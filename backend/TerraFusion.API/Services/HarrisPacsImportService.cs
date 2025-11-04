using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.API.Security;

namespace TerraFusion.API.Services
{
    public sealed class HarrisPacsImportService
    {
        private readonly ILogger<HarrisPacsImportService> _logger;
        private readonly string _connectionString;

        public HarrisPacsImportService(
            ILogger<HarrisPacsImportService> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Database connection string not configured");
        }

        public async Task<ImportResult> ImportPacsDataAsync(string filePath, string countyId = "benton")
        {
            var result = new ImportResult { CountyId = countyId, StartTime = DateTimeOffset.UtcNow };

            try
            {
                _logger.LogInformation("Starting Harris PACS import for county {County} from {FilePath}", countyId, filePath);

                // Validate county isolation - critical per user requirements
                if (!countyId.Equals("benton", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"County {countyId} not authorized for Harris PACS import. Only Benton County supported.");
                }

                var pacsData = await ReadPacsDataFile(filePath);
                result.TotalRecords = pacsData.Count;

                using var connection = new Npgsql.NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                foreach (var record in pacsData)
                {
                    try
                    {
                        await ImportParcelRecord(connection, record, countyId);
                        result.SuccessfulImports++;
                    }
                    catch (Exception ex)
                    {
                        result.FailedImports++;
                        result.Errors.Add($"Parcel {record.ParcelId}: {ex.Message}");
                        _logger.LogWarning(ex, "Failed to import parcel {ParcelId}", record.ParcelId);
                    }
                }

                // Run validation on imported records
                await ValidateImportedData(connection, countyId);

                result.EndTime = DateTimeOffset.UtcNow;
                result.Success = result.FailedImports == 0;

                _logger.LogInformation("Harris PACS import completed for {County}: {Success}/{Total} records",
                    countyId, result.SuccessfulImports, result.TotalRecords);

                return result;
            }
            catch (Exception ex)
            {
                result.EndTime = DateTimeOffset.UtcNow;
                result.Success = false;
                result.Errors.Add($"Import failed: {ex.Message}");
                _logger.LogError(ex, "Harris PACS import failed for county {County}", countyId);
                return result;
            }
        }

        private async Task<List<PacsParcelRecord>> ReadPacsDataFile(string filePath)
        {
            // Mock PACS data reader - in production, integrate with actual Harris PACS export format
            var mockData = new List<PacsParcelRecord>
            {
                new PacsParcelRecord
                {
                    ParcelId = "BEN-123-456-001",
                    OwnerName = "John & Jane Doe",
                    PropertyAddress = "123 Main St, Richland, WA 99354",
                    LegalDescription = "LOT 1 BLK 2 RICHLAND HEIGHTS SUBDIVISION",
                    AssessedValue = 285000m,
                    MarketValue = 320000m,
                    Acres = 0.25m,
                    PropertyClass = "RES",
                    Zoning = "R1",
                    TaxYear = 2024
                },
                new PacsParcelRecord
                {
                    ParcelId = "BEN-123-456-002",
                    OwnerName = "Smith Family Trust",
                    PropertyAddress = "125 Main St, Richland, WA 99354",
                    LegalDescription = "LOT 2 BLK 2 RICHLAND HEIGHTS SUBDIVISION",
                    AssessedValue = 295000m,
                    MarketValue = 335000m,
                    Acres = 0.30m,
                    PropertyClass = "RES",
                    Zoning = "R1",
                    TaxYear = 2024
                }
            };

            await Task.Delay(100); // Simulate file I/O
            return mockData;
        }

        private async Task ImportParcelRecord(Npgsql.NpgsqlConnection connection, PacsParcelRecord record, string countyId)
        {
            const string sql = @"
                INSERT INTO harris_import.pacs_parcels (
                    pacs_parcel_id, owner_name, property_address, legal_desc,
                    assessed_value, market_value, acres, property_class, zoning, tax_year
                ) VALUES (
                    @ParcelId, @OwnerName, @PropertyAddress, @LegalDescription,
                    @AssessedValue, @MarketValue, @Acres, @PropertyClass, @Zoning, @TaxYear
                )
                ON CONFLICT (pacs_parcel_id, tax_year)
                DO UPDATE SET
                    owner_name = EXCLUDED.owner_name,
                    property_address = EXCLUDED.property_address,
                    assessed_value = EXCLUDED.assessed_value,
                    market_value = EXCLUDED.market_value,
                    import_timestamp = NOW()";

            using var cmd = new Npgsql.NpgsqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@ParcelId", record.ParcelId);
            cmd.Parameters.AddWithValue("@OwnerName", record.OwnerName ?? "");
            cmd.Parameters.AddWithValue("@PropertyAddress", record.PropertyAddress ?? "");
            cmd.Parameters.AddWithValue("@LegalDescription", record.LegalDescription ?? "");
            cmd.Parameters.AddWithValue("@AssessedValue", record.AssessedValue);
            cmd.Parameters.AddWithValue("@MarketValue", record.MarketValue);
            cmd.Parameters.AddWithValue("@Acres", record.Acres);
            cmd.Parameters.AddWithValue("@PropertyClass", record.PropertyClass ?? "");
            cmd.Parameters.AddWithValue("@Zoning", record.Zoning ?? "");
            cmd.Parameters.AddWithValue("@TaxYear", record.TaxYear);

            await cmd.ExecuteNonQueryAsync();
        }

        private async Task ValidateImportedData(Npgsql.NpgsqlConnection connection, string countyId)
        {
            const string sql = @"
                SELECT import_id FROM harris_import.pacs_parcels
                WHERE validation_status = 'pending'";

            using var cmd = new Npgsql.NpgsqlCommand(sql, connection);
            using var reader = await cmd.ExecuteReaderAsync();

            var importIds = new List<Guid>();
            while (await reader.ReadAsync())
            {
                importIds.Add(reader.GetGuid(0));
            }
            reader.Close();

            foreach (var importId in importIds)
            {
                const string validateSql = "SELECT harris_import.validate_parcel(@ImportId)";
                using var validateCmd = new Npgsql.NpgsqlCommand(validateSql, connection);
                validateCmd.Parameters.AddWithValue("@ImportId", importId);
                await validateCmd.ExecuteScalarAsync();
            }

            _logger.LogInformation("Validated {Count} imported records for county {County}", importIds.Count, countyId);
        }

        public async Task<MigrationProgress> GetMigrationStatusAsync(string countyId = "benton")
        {
            using var connection = new Npgsql.NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            const string sql = @"
                SELECT validation_status, record_count, percentage
                FROM harris_import.migration_status";

            using var cmd = new Npgsql.NpgsqlCommand(sql, connection);
            using var reader = await cmd.ExecuteReaderAsync();

            var status = new MigrationProgress { CountyId = countyId };
            while (await reader.ReadAsync())
            {
                var validationStatus = reader.GetString(0);
                var count = reader.GetInt64(1);
                var percentage = reader.GetDecimal(2);

                switch (validationStatus)
                {
                    case "valid":
                        status.ValidRecords = (int)count;
                        break;
                    case "invalid":
                        status.InvalidRecords = (int)count;
                        break;
                    case "pending":
                        status.PendingRecords = (int)count;
                        break;
                }
            }

            status.TotalRecords = status.ValidRecords + status.InvalidRecords + status.PendingRecords;
            return status;
        }
    }

    public sealed record PacsParcelRecord
    {
        public string ParcelId { get; init; } = "";
        public string? OwnerName { get; init; }
        public string? PropertyAddress { get; init; }
        public string? LegalDescription { get; init; }
        public decimal AssessedValue { get; init; }
        public decimal MarketValue { get; init; }
        public decimal Acres { get; init; }
        public string? PropertyClass { get; init; }
        public string? Zoning { get; init; }
        public int TaxYear { get; init; }
    }

    public sealed class ImportResult
    {
        public string CountyId { get; set; } = "";
        public DateTimeOffset StartTime { get; set; }
        public DateTimeOffset EndTime { get; set; }
        public int TotalRecords { get; set; }
        public int SuccessfulImports { get; set; }
        public int FailedImports { get; set; }
        public bool Success { get; set; }
        public List<string> Errors { get; set; } = new();
        public TimeSpan Duration => EndTime - StartTime;
    }

    public sealed class MigrationProgress
    {
        public string CountyId { get; set; } = "";
        public int TotalRecords { get; set; }
        public int ValidRecords { get; set; }
        public int InvalidRecords { get; set; }
        public int PendingRecords { get; set; }
        public decimal CompletionPercentage => TotalRecords > 0 ? (ValidRecords * 100m / TotalRecords) : 0;
    }
}
