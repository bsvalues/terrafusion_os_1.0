// TFR-022 — Base connector interface for data source integration
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Connectors
{
    /// <summary>
    /// Configuration for a data connector.
    /// </summary>
    public sealed record ConnectorConfig
    {
        /// <summary>Connection string or DSN for the data source.</summary>
        public string ConnectionString { get; init; } = string.Empty;

        /// <summary>Connection timeout.</summary>
        public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(30);

        /// <summary>Number of retries on transient failure.</summary>
        public int MaxRetries { get; init; } = 3;

        /// <summary>Command timeout for individual queries.</summary>
        public TimeSpan CommandTimeout { get; init; } = TimeSpan.FromMinutes(5);

        /// <summary>Optional additional settings.</summary>
        public Dictionary<string, string> Properties { get; init; } = new();
    }

    /// <summary>
    /// Schema descriptor returned by a connector.
    /// </summary>
    public sealed record ConnectorSchema
    {
        /// <summary>Available table or entity names.</summary>
        public IReadOnlyList<string> Tables { get; init; } = Array.Empty<string>();

        /// <summary>Column definitions keyed by table name.</summary>
        public Dictionary<string, IReadOnlyList<ColumnInfo>> Columns { get; init; } = new();
    }

    /// <summary>
    /// Column metadata from a data source.
    /// </summary>
    public sealed record ColumnInfo
    {
        public string Name { get; init; } = string.Empty;
        public string DataType { get; init; } = string.Empty;
        public bool IsNullable { get; init; } = true;
        public bool IsPrimaryKey { get; init; }
        public int? MaxLength { get; init; }
    }

    /// <summary>
    /// Base interface for all data connectors. Provides connect/disconnect lifecycle,
    /// record fetching (full and delta), schema discovery, and connection testing.
    /// </summary>
    public interface IConnector
    {
        /// <summary>Connector display name.</summary>
        string Name { get; }

        /// <summary>Whether the connector is currently connected.</summary>
        bool IsConnected { get; }

        /// <summary>Opens the connection to the data source.</summary>
        Task ConnectAsync(CancellationToken ct = default);

        /// <summary>Closes the connection to the data source.</summary>
        Task DisconnectAsync(CancellationToken ct = default);

        /// <summary>Tests connectivity without fetching data. Returns true if reachable.</summary>
        Task<bool> TestConnectionAsync(CancellationToken ct = default);

        /// <summary>Fetches records from the data source (full extract).</summary>
        Task<IReadOnlyList<Dictionary<string, object?>>> FetchRecordsAsync(
            int maxRecords = 1000, CancellationToken ct = default);

        /// <summary>Fetches records modified since the given timestamp (incremental/delta).</summary>
        Task<IReadOnlyList<Dictionary<string, object?>>> FetchDeltaAsync(
            DateTime since, int maxRecords = 1000, CancellationToken ct = default);

        /// <summary>Returns the schema of available tables/columns in the data source.</summary>
        Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default);
    }
}
