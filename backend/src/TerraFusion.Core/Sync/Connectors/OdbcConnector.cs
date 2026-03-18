// TFR-103 — Generic ODBC connector for legacy county systems
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Odbc;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Connectors
{
    /// <summary>
    /// Generic ODBC connector for legacy county data systems.
    /// Wraps System.Data.Odbc for query execution, schema discovery, and bulk read.
    /// </summary>
    public class OdbcConnector : IConnector, IDisposable
    {
        private readonly ConnectorConfig _config;
        private OdbcConnection? _connection;

        /// <inheritdoc />
        public string Name => "ODBC";

        /// <inheritdoc />
        public bool IsConnected => _connection?.State == ConnectionState.Open;

        public OdbcConnector(ConnectorConfig config)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
        }

        /// <inheritdoc />
        public async Task ConnectAsync(CancellationToken ct = default)
        {
            _connection = new OdbcConnection(_config.ConnectionString);
            _connection.ConnectionTimeout = (int)_config.Timeout.TotalSeconds;
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
                using var conn = new OdbcConnection(_config.ConnectionString);
                await conn.OpenAsync(ct);
                conn.Close();
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
            var query = _config.Properties.TryGetValue("Query", out var q) ? q : "SELECT * FROM data";
            return await ExecuteQueryAsync($"{query} FETCH FIRST {maxRecords} ROWS ONLY", ct);
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<Dictionary<string, object?>>> FetchDeltaAsync(
            DateTime since, int maxRecords = 1000, CancellationToken ct = default)
        {
            EnsureConnected();
            var timestampCol = _config.Properties.TryGetValue("TimestampColumn", out var tc) ? tc : "LastModified";
            var baseQuery = _config.Properties.TryGetValue("Query", out var q) ? q : "SELECT * FROM data";
            var query = $"{baseQuery} WHERE {timestampCol} > ? FETCH FIRST {maxRecords} ROWS ONLY";

            using var cmd = new OdbcCommand(query, _connection);
            cmd.CommandTimeout = (int)_config.CommandTimeout.TotalSeconds;
            cmd.Parameters.AddWithValue("@since", since);

            return await ReadResultsAsync(cmd, ct);
        }

        /// <inheritdoc />
        public async Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default)
        {
            EnsureConnected();
            var tables = new List<string>();
            var columns = new Dictionary<string, IReadOnlyList<ColumnInfo>>();

            var dt = _connection!.GetSchema("Tables");
            foreach (DataRow row in dt.Rows)
            {
                var tableName = row["TABLE_NAME"]?.ToString() ?? "";
                if (!string.IsNullOrEmpty(tableName))
                    tables.Add(tableName);
            }

            foreach (var table in tables)
            {
                var colDt = _connection.GetSchema("Columns", new[] { null, null, table, null });
                var cols = new List<ColumnInfo>();
                foreach (DataRow row in colDt.Rows)
                {
                    cols.Add(new ColumnInfo
                    {
                        Name = row["COLUMN_NAME"]?.ToString() ?? "",
                        DataType = row["TYPE_NAME"]?.ToString() ?? "",
                        IsNullable = row["NULLABLE"]?.ToString() == "1",
                        MaxLength = row["COLUMN_SIZE"] is int size ? size : null
                    });
                }
                columns[table] = cols;
            }

            return new ConnectorSchema { Tables = tables, Columns = columns };
        }

        /// <summary>
        /// Executes an arbitrary SQL query and returns results as dictionaries.
        /// </summary>
        public async Task<IReadOnlyList<Dictionary<string, object?>>> ExecuteQueryAsync(
            string sql, CancellationToken ct = default)
        {
            EnsureConnected();
            using var cmd = new OdbcCommand(sql, _connection);
            cmd.CommandTimeout = (int)_config.CommandTimeout.TotalSeconds;
            return await ReadResultsAsync(cmd, ct);
        }

        private static async Task<IReadOnlyList<Dictionary<string, object?>>> ReadResultsAsync(
            OdbcCommand cmd, CancellationToken ct)
        {
            var results = new List<Dictionary<string, object?>>();
            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var record = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    record[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                }
                results.Add(record);
            }
            return results;
        }

        private void EnsureConnected()
        {
            if (_connection?.State != ConnectionState.Open)
                throw new InvalidOperationException("OdbcConnector is not connected. Call ConnectAsync first.");
        }

        public void Dispose()
        {
            _connection?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
