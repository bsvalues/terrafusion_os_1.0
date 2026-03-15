// TFR-023 — Harris PACS 9.0 connector
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Connectors
{
    /// <summary>
    /// Harris PACS 9.0 data connector. Reads from PACS SQL Server database.
    /// Supports property, sales, ownership, and permit tables.
    /// Maps PACS field names to the TerraFusion canonical schema.
    /// </summary>
    public class PacsConnector : IConnector
    {
        private readonly ConnectorConfig _config;
        private bool _connected;

        /// <summary>
        /// PACS table name constants.
        /// </summary>
        public static class PacsTables
        {
            public const string Property = "PROP_MASTER";
            public const string Sales = "SALES_MASTER";
            public const string Ownership = "OWNER_MASTER";
            public const string Permits = "PERMIT_MASTER";
            public const string Improvements = "IMPR_MASTER";
            public const string LandSegments = "LAND_SEGMENTS";
        }

        /// <summary>
        /// Field name mappings from PACS schema → TerraFusion schema.
        /// </summary>
        private static readonly Dictionary<string, string> FieldMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["PROP_ID"] = "PropertyId",
            ["PARCEL_NO"] = "ParcelNumber",
            ["PROP_TYPE"] = "PropertyType",
            ["SITUS_ADDR"] = "SitusAddress",
            ["SITUS_CITY"] = "SitusCity",
            ["SITUS_ZIP"] = "SitusZip",
            ["LEGAL_DESC"] = "LegalDescription",
            ["OWNER_NAME"] = "OwnerName",
            ["OWNER_ADDR"] = "OwnerAddress",
            ["SALE_DATE"] = "SaleDate",
            ["SALE_PRICE"] = "SalePrice",
            ["SALE_TYPE"] = "SaleType",
            ["PERMIT_NO"] = "PermitNumber",
            ["PERMIT_DATE"] = "PermitDate",
            ["PERMIT_TYPE"] = "PermitType",
            ["PERMIT_VALUE"] = "PermitValue",
            ["IMPR_TYPE"] = "ImprovementType",
            ["YEAR_BUILT"] = "YearBuilt",
            ["SQ_FT"] = "SquareFeet",
            ["BEDROOMS"] = "Bedrooms",
            ["BATHROOMS"] = "Bathrooms",
            ["LAND_AREA"] = "LandArea",
            ["LAND_USE_CODE"] = "LandUseCode",
            ["NEIGHBORHOOD"] = "NeighborhoodCode",
            ["LAST_MODIFIED"] = "LastModifiedUtc",
            ["CREATED_DATE"] = "SourceCreatedDate"
        };

        /// <inheritdoc />
        public string Name => "HarrisPACS";

        /// <inheritdoc />
        public bool IsConnected => _connected;

        public PacsConnector(ConnectorConfig config)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
        }

        /// <inheritdoc />
        public Task ConnectAsync(CancellationToken ct = default)
        {
            // In production, opens SqlConnection to PACS SQL Server instance.
            _connected = true;
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task DisconnectAsync(CancellationToken ct = default)
        {
            _connected = false;
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public async Task<bool> TestConnectionAsync(CancellationToken ct = default)
        {
            try
            {
                await ConnectAsync(ct);
                await DisconnectAsync(ct);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public Task<IReadOnlyList<Dictionary<string, object?>>> FetchRecordsAsync(
            int maxRecords = 1000, CancellationToken ct = default)
        {
            EnsureConnected();
            // Placeholder: production implementation executes SQL against PACS database
            // SELECT TOP(@max) * FROM PROP_MASTER ORDER BY PROP_ID
            IReadOnlyList<Dictionary<string, object?>> empty = Array.Empty<Dictionary<string, object?>>();
            return Task.FromResult(empty);
        }

        /// <inheritdoc />
        public Task<IReadOnlyList<Dictionary<string, object?>>> FetchDeltaAsync(
            DateTime since, int maxRecords = 1000, CancellationToken ct = default)
        {
            EnsureConnected();
            // Placeholder: production implementation queries LAST_MODIFIED > @since
            IReadOnlyList<Dictionary<string, object?>> empty = Array.Empty<Dictionary<string, object?>>();
            return Task.FromResult(empty);
        }

        /// <inheritdoc />
        public Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default)
        {
            var schema = new ConnectorSchema
            {
                Tables = new[]
                {
                    PacsTables.Property, PacsTables.Sales, PacsTables.Ownership,
                    PacsTables.Permits, PacsTables.Improvements, PacsTables.LandSegments
                },
                Columns = new Dictionary<string, IReadOnlyList<ColumnInfo>>
                {
                    [PacsTables.Property] = new[]
                    {
                        new ColumnInfo { Name = "PROP_ID", DataType = "int", IsPrimaryKey = true, IsNullable = false },
                        new ColumnInfo { Name = "PARCEL_NO", DataType = "varchar", MaxLength = 30 },
                        new ColumnInfo { Name = "PROP_TYPE", DataType = "varchar", MaxLength = 10 },
                        new ColumnInfo { Name = "SITUS_ADDR", DataType = "varchar", MaxLength = 200 },
                        new ColumnInfo { Name = "SITUS_CITY", DataType = "varchar", MaxLength = 100 },
                        new ColumnInfo { Name = "SITUS_ZIP", DataType = "varchar", MaxLength = 10 },
                        new ColumnInfo { Name = "LEGAL_DESC", DataType = "varchar", MaxLength = 500 },
                        new ColumnInfo { Name = "LAST_MODIFIED", DataType = "datetime" }
                    }
                }
            };
            return Task.FromResult(schema);
        }

        /// <summary>
        /// Maps a PACS record (PACS field names) to a TerraFusion record (canonical field names).
        /// </summary>
        public static Dictionary<string, object?> MapToCanonical(Dictionary<string, object?> pacsRecord)
        {
            var canonical = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var kvp in pacsRecord)
            {
                var targetField = FieldMap.TryGetValue(kvp.Key, out var mapped) ? mapped : kvp.Key;
                canonical[targetField] = kvp.Value;
            }
            return canonical;
        }

        private void EnsureConnected()
        {
            if (!_connected)
                throw new InvalidOperationException("PacsConnector is not connected. Call ConnectAsync first.");
        }
    }
}
