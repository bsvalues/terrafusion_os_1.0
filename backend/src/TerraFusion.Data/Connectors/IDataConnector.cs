// TerraFusion Canon-Sync — IDataConnector interface
// Shared contract for all TerraCanon data connectors.

namespace TerraFusion.Data.Connectors;

/// <summary>
/// Core contract implemented by every TerraCanon data connector.
/// Provides connection lifecycle, health testing, schema introspection,
/// and generic data fetch capabilities.
/// </summary>
public interface IDataConnector : IAsyncDisposable
{
    /// <summary>Unique connector identifier (e.g. "harris-pacs", "tyler-vision").</summary>
    string Name { get; }

    /// <summary>Human-readable display name.</summary>
    string DisplayName { get; }

    /// <summary>Whether the connector is currently connected.</summary>
    bool IsConnected { get; }

    /// <summary>Opens the underlying connection to the external data source.</summary>
    Task ConnectAsync(CancellationToken ct = default);

    /// <summary>Gracefully closes the connection.</summary>
    Task DisconnectAsync(CancellationToken ct = default);

    /// <summary>Performs a lightweight round-trip to verify connectivity.</summary>
    /// <returns>True when the remote source is reachable and responsive.</returns>
    Task<bool> TestConnectionAsync(CancellationToken ct = default);

    /// <summary>
    /// Executes a connector-specific query and returns results as a
    /// list of dynamic property bags.
    /// </summary>
    /// <param name="query">Connector-specific query descriptor.</param>
    /// <param name="ct">Cancellation token.</param>
    Task<IReadOnlyList<Dictionary<string, object?>>> FetchAsync(
        ConnectorQuery query, CancellationToken ct = default);

    /// <summary>Returns schema metadata describing available tables/fields.</summary>
    Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default);
}

/// <summary>Describes a query sent to a connector.</summary>
public sealed record ConnectorQuery(
    string EntityName,
    string? Filter = null,
    int? MaxRows = null,
    IReadOnlyList<string>? Fields = null);

/// <summary>Schema metadata returned by a connector.</summary>
public sealed record ConnectorSchema(
    string ConnectorName,
    IReadOnlyList<ConnectorEntity> Entities);

/// <summary>A single entity (table / layer / endpoint) exposed by a connector.</summary>
public sealed record ConnectorEntity(
    string Name,
    IReadOnlyList<ConnectorField> Fields);

/// <summary>A field within a connector entity.</summary>
public sealed record ConnectorField(
    string Name,
    string DataType,
    bool IsNullable = true);
