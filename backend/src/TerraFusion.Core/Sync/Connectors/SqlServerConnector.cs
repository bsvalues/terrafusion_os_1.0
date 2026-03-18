// TFR-104 — Direct SQL Server connector with bulk copy support
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;

namespace TerraFusion.Core.Sync.Connectors
{
    /// <summary>
    /// Direct SQL Server connector using Microsoft.Data.SqlClient.
    /// Optimized for large transfers via SqlBulkCopy. Supports connection pooling.
    /// </summary>
    public class SqlServerConnector : IConnector, IDisposable
    {
        private readonly ConnectorConfig _config;
        private SqlConnection? _connection;

        /// <inheritdoc />
        public string Name => "SqlServer";

        /// <inheritdoc />
        public bool IsConnected => _connection?.State == ConnectionState.Open;

        public SqlServerConnector(ConnectorConfig config)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
        }

        /// <inheritdoc />
        public async Task ConnectAsync(CancellationToken ct = default)
        {
            var builder = new SqlConnectionStringBuilder(_config.ConnectionString)
            {
                ConnectTimeout = (int)_config.Timeout.TotalSeconds,
                Pooling = true,
                MinPoolSize = 1,
                MaxPoolSize = 10
            };
            _connection = new SqlConnection(builder.ConnectionString);
            await _connection.OpenAsync(ct);
        }

        /// <inheritdoc />
        public Task DisconnectAsync(CancellationToken ct = default)
        {
            _connection?.Close();
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public async Task<bool> TestConnectionAsync(CancellationToken ct = default)
        {
            try
            {
                using var conn = new SqlConnection(_config.ConnectionString);
                await conn.OpenAsync(ct);
                using var cmd = new SqlCommand("SELECT 1", conn);
                await cmd.ExecuteScalarAsync(ct);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<Dictionary<string, object?>>> FetchRecordsAsync(
            int maxRecords = 1000, CancellationToken ct = default)
        {
            EnsureConnected();
            var table = GetConfigValue("Table", "Properties");
            return await ExecuteQueryAsync(
                $"SELECT TOP (@max) * FROM [{table}]",
                new SqlParameter("@max", maxRecords),
                ct);
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<Dictionary<string, object?>>> FetchDeltaAsync(
            DateTime since, int maxRecords = 1000, CancellationToken ct = default)
        {
            EnsureConnected();
            var table = GetConfigValue("Table", "Properties");
            var tsCol = GetConfigValue("TimestampColumn", "LastModified");
            return await ExecuteQueryAsync(
                $"SELECT TOP (@max) * FROM [{table}] WHERE [{tsCol}] > @since ORDER BY [{tsCol}]",
                ct,
                new SqlParameter("@max", maxRecords),
                new SqlParameter("@since", since));
        }

        /// <inheritdoc />
        public async Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default)
        {
            EnsureConnected();
            var tables = new List<string>();
            var columns = new Dictionary<string, IReadOnlyList<ColumnInfo>>();

            // Get tables
            using (var cmd = new SqlCommand(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'", _connection))
            {
                using var reader = await cmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                    tables.Add(reader.GetString(0));
            }

            // Get columns per table
            foreach (var table in tables)
            {
                var cols = new List<ColumnInfo>();
                using var cmd = new SqlCommand(
                    @"SELECT c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE, c.CHARACTER_MAXIMUM_LENGTH,
                      CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PK
                      FROM INFORMATION_SCHEMA.COLUMNS c
                      LEFT JOIN (
                          SELECT ku.COLUMN_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                          WHERE tc.TABLE_NAME = @table AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                      ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
                      WHERE c.TABLE_NAME = @table", _connection);
                cmd.Parameters.AddWithValue("@table", table);

                using var reader = await cmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    cols.Add(new ColumnInfo
                    {
                        Name = reader.GetString(0),
                        DataType = reader.GetString(1),
                        IsNullable = reader.GetString(2) == "YES",
                        MaxLength = reader.IsDBNull(3) ? null : (int?)reader.GetInt32(3),
                        IsPrimaryKey = reader.GetInt32(4) == 1
                    });
                }
                columns[table] = cols;
            }

            return new ConnectorSchema { Tables = tables, Columns = columns };
        }

        /// <summary>
        /// Bulk copies a DataTable into a target SQL Server table using SqlBulkCopy.
        /// </summary>
        /// <param name="dataTable">Data to copy.</param>
        /// <param name="destinationTable">Target table name.</param>
        /// <param name="batchSize">Rows per batch (default 5000).</param>
        /// <param name="ct">Cancellation token.</param>
        public async Task BulkCopyAsync(DataTable dataTable, string destinationTable,
            int batchSize = 5000, CancellationToken ct = default)
        {
            EnsureConnected();
            using var bulkCopy = new SqlBulkCopy(_connection!)
            {
                DestinationTableName = destinationTable,
                BatchSize = batchSize,
                BulkCopyTimeout = (int)_config.CommandTimeout.TotalSeconds,
                EnableStreaming = true
            };

            // Map columns by name
            foreach (DataColumn col in dataTable.Columns)
            {
                bulkCopy.ColumnMappings.Add(col.ColumnName, col.ColumnName);
            }

            await bulkCopy.WriteToServerAsync(dataTable, ct);
        }

        /// <summary>
        /// Executes a SQL query and returns results as dictionaries.
        /// </summary>
        public async Task<IReadOnlyList<Dictionary<string, object?>>> ExecuteQueryAsync(
            string sql, CancellationToken ct, params SqlParameter[] parameters)
        {
            EnsureConnected();
            using var cmd = new SqlCommand(sql, _connection);
            cmd.CommandTimeout = (int)_config.CommandTimeout.TotalSeconds;
            foreach (var p in parameters) cmd.Parameters.Add(p);
            return await ReadResultsAsync(cmd, ct);
        }

        /// <summary>
        /// Overload accepting a single parameter for convenience.
        /// </summary>
        public Task<IReadOnlyList<Dictionary<string, object?>>> ExecuteQueryAsync(
            string sql, SqlParameter parameter, CancellationToken ct) =>
            ExecuteQueryAsync(sql, ct, parameter);

        private static async Task<IReadOnlyList<Dictionary<string, object?>>> ReadResultsAsync(
            SqlCommand cmd, CancellationToken ct)
        {
            var results = new List<Dictionary<string, object?>>();
            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var record = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < reader.FieldCount; i++)
                    record[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                results.Add(record);
            }
            return results;
        }

        private string GetConfigValue(string key, string defaultValue) =>
            _config.Properties.TryGetValue(key, out var v) ? v : defaultValue;

        private void EnsureConnected()
        {
            if (_connection?.State != ConnectionState.Open)
                throw new InvalidOperationException("SqlServerConnector is not connected. Call ConnectAsync first.");
        }

        public void Dispose()
        {
            _connection?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
