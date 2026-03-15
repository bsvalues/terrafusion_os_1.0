// TFR-008: SQL Server utility methods for sync operations
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;

namespace TerraFusion.Data.Helpers
{
    /// <summary>
    /// Represents column metadata from SQL Server schema introspection.
    /// </summary>
    public class ColumnSchema
    {
        /// <summary>Column name.</summary>
        public string ColumnName { get; set; } = string.Empty;

        /// <summary>SQL Server data type (e.g., varchar, int, decimal).</summary>
        public string DataType { get; set; } = string.Empty;

        /// <summary>Maximum character length for string types, or null.</summary>
        public int? MaxLength { get; set; }

        /// <summary>Numeric precision, or null.</summary>
        public int? Precision { get; set; }

        /// <summary>Numeric scale, or null.</summary>
        public int? Scale { get; set; }

        /// <summary>Whether the column allows null values.</summary>
        public bool IsNullable { get; set; }

        /// <summary>Ordinal position in the table.</summary>
        public int OrdinalPosition { get; set; }
    }

    /// <summary>
    /// SQL Server utility methods for TerraFusion sync operations.
    /// Provides safe bulk copy, parameterized queries, schema introspection,
    /// and timeout management.
    /// </summary>
    public static class SqlServerHelpers
    {
        /// <summary>
        /// Default command timeout in seconds for sync operations.
        /// </summary>
        public const int DefaultTimeoutSeconds = 120;

        /// <summary>
        /// Default bulk copy batch size.
        /// </summary>
        public const int DefaultBatchSize = 5000;

        /// <summary>
        /// Builds a SQL Server connection string from individual components.
        /// </summary>
        /// <param name="server">Server hostname or IP.</param>
        /// <param name="database">Database name.</param>
        /// <param name="username">SQL login username (null for integrated auth).</param>
        /// <param name="password">SQL login password (null for integrated auth).</param>
        /// <param name="timeoutSeconds">Connection timeout in seconds.</param>
        /// <param name="encrypt">Whether to encrypt the connection.</param>
        /// <returns>A complete connection string.</returns>
        public static string BuildConnectionString(
            string server,
            string database,
            string? username = null,
            string? password = null,
            int timeoutSeconds = 30,
            bool encrypt = true)
        {
            var builder = new SqlConnectionStringBuilder
            {
                DataSource = server,
                InitialCatalog = database,
                ConnectTimeout = timeoutSeconds,
                Encrypt = encrypt,
                TrustServerCertificate = !encrypt,
                ApplicationName = "TerraFusion.Sync",
            };

            if (!string.IsNullOrEmpty(username))
            {
                builder.UserID = username;
                builder.Password = password;
            }
            else
            {
                builder.IntegratedSecurity = true;
            }

            return builder.ConnectionString;
        }

        /// <summary>
        /// Performs a bulk copy from a DataTable into a SQL Server destination table.
        /// Uses batching and configurable timeout for large datasets.
        /// </summary>
        /// <param name="connectionString">Target SQL Server connection string.</param>
        /// <param name="destinationTable">Fully qualified destination table name.</param>
        /// <param name="data">The data to bulk insert.</param>
        /// <param name="batchSize">Number of rows per batch.</param>
        /// <param name="timeoutSeconds">Timeout per batch in seconds.</param>
        /// <param name="columnMappings">Optional explicit column mappings (source -> dest).</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The number of rows copied.</returns>
        public static async Task<int> SafeBulkCopyAsync(
            string connectionString,
            string destinationTable,
            DataTable data,
            int batchSize = DefaultBatchSize,
            int timeoutSeconds = DefaultTimeoutSeconds,
            Dictionary<string, string>? columnMappings = null,
            CancellationToken cancellationToken = default)
        {
            if (data == null || data.Rows.Count == 0)
                return 0;

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);

            using var bulkCopy = new SqlBulkCopy(connection)
            {
                DestinationTableName = destinationTable,
                BatchSize = batchSize,
                BulkCopyTimeout = timeoutSeconds,
                EnableStreaming = true,
            };

            if (columnMappings != null)
            {
                foreach (var (source, dest) in columnMappings)
                {
                    bulkCopy.ColumnMappings.Add(source, dest);
                }
            }
            else
            {
                // Auto-map by column name
                foreach (DataColumn col in data.Columns)
                {
                    bulkCopy.ColumnMappings.Add(col.ColumnName, col.ColumnName);
                }
            }

            await bulkCopy.WriteToServerAsync(data, cancellationToken);
            return data.Rows.Count;
        }

        /// <summary>
        /// Executes a parameterized query and returns results as a DataTable.
        /// All parameters are added safely to prevent SQL injection.
        /// </summary>
        /// <param name="connectionString">SQL Server connection string.</param>
        /// <param name="query">SQL query with @parameter placeholders.</param>
        /// <param name="parameters">Parameter name-value pairs.</param>
        /// <param name="timeoutSeconds">Command timeout in seconds.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>DataTable with query results.</returns>
        public static async Task<DataTable> ParameterizedQueryAsync(
            string connectionString,
            string query,
            Dictionary<string, object?>? parameters = null,
            int timeoutSeconds = DefaultTimeoutSeconds,
            CancellationToken cancellationToken = default)
        {
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);

            using var command = new SqlCommand(query, connection)
            {
                CommandTimeout = timeoutSeconds,
            };

            if (parameters != null)
            {
                foreach (var (name, value) in parameters)
                {
                    command.Parameters.AddWithValue(
                        name.StartsWith("@") ? name : $"@{name}",
                        value ?? DBNull.Value);
                }
            }

            var table = new DataTable();
            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            table.Load(reader);
            return table;
        }

        /// <summary>
        /// Retrieves schema metadata for all columns in a given table.
        /// </summary>
        /// <param name="connectionString">SQL Server connection string.</param>
        /// <param name="tableName">Table name to introspect.</param>
        /// <param name="schemaName">Schema name (default: dbo).</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>List of column schema definitions.</returns>
        public static async Task<List<ColumnSchema>> GetTableSchemaAsync(
            string connectionString,
            string tableName,
            string schemaName = "dbo",
            CancellationToken cancellationToken = default)
        {
            const string query = @"
                SELECT
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    NUMERIC_PRECISION,
                    NUMERIC_SCALE,
                    IS_NULLABLE,
                    ORDINAL_POSITION
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = @TableName
                  AND TABLE_SCHEMA = @SchemaName
                ORDER BY ORDINAL_POSITION";

            var parameters = new Dictionary<string, object?>
            {
                ["TableName"] = tableName,
                ["SchemaName"] = schemaName,
            };

            var dt = await ParameterizedQueryAsync(connectionString, query, parameters,
                cancellationToken: cancellationToken);

            var columns = new List<ColumnSchema>();
            foreach (DataRow row in dt.Rows)
            {
                columns.Add(new ColumnSchema
                {
                    ColumnName = row["COLUMN_NAME"].ToString()!,
                    DataType = row["DATA_TYPE"].ToString()!,
                    MaxLength = row["CHARACTER_MAXIMUM_LENGTH"] is DBNull ? null : Convert.ToInt32(row["CHARACTER_MAXIMUM_LENGTH"]),
                    Precision = row["NUMERIC_PRECISION"] is DBNull ? null : Convert.ToInt32(row["NUMERIC_PRECISION"]),
                    Scale = row["NUMERIC_SCALE"] is DBNull ? null : Convert.ToInt32(row["NUMERIC_SCALE"]),
                    IsNullable = string.Equals(row["IS_NULLABLE"].ToString(), "YES", StringComparison.OrdinalIgnoreCase),
                    OrdinalPosition = Convert.ToInt32(row["ORDINAL_POSITION"]),
                });
            }

            return columns;
        }

        /// <summary>
        /// Retrieves a mapping of column names to their SQL Server data types for a table.
        /// </summary>
        /// <param name="connectionString">SQL Server connection string.</param>
        /// <param name="tableName">Table name to introspect.</param>
        /// <param name="schemaName">Schema name (default: dbo).</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Dictionary of column name to full data type string.</returns>
        public static async Task<Dictionary<string, string>> GetColumnTypesAsync(
            string connectionString,
            string tableName,
            string schemaName = "dbo",
            CancellationToken cancellationToken = default)
        {
            var columns = await GetTableSchemaAsync(connectionString, tableName, schemaName, cancellationToken);
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var col in columns)
            {
                var typeStr = col.DataType;
                if (col.MaxLength.HasValue && col.MaxLength > 0)
                    typeStr = $"{col.DataType}({col.MaxLength})";
                else if (col.Precision.HasValue && col.Scale.HasValue)
                    typeStr = $"{col.DataType}({col.Precision},{col.Scale})";

                result[col.ColumnName] = typeStr;
            }

            return result;
        }

        /// <summary>
        /// Tests whether a SQL Server connection can be established.
        /// </summary>
        /// <param name="connectionString">SQL Server connection string.</param>
        /// <param name="timeoutSeconds">Connection timeout override.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>True if connection succeeded, false otherwise.</returns>
        public static async Task<bool> TestConnectionAsync(
            string connectionString,
            int timeoutSeconds = 10,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var builder = new SqlConnectionStringBuilder(connectionString)
                {
                    ConnectTimeout = timeoutSeconds,
                };

                using var connection = new SqlConnection(builder.ConnectionString);
                await connection.OpenAsync(cancellationToken);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
