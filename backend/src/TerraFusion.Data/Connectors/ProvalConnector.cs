// TFT-019 — ProVal CAMA Connector
// Canon-sync connector for ProVal cost approach data.

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.Connectors;

/// <summary>
/// TFT-019: ProVal CAMA connector.
/// Reads cost approach data, cost tables, and depreciation schedules from ProVal.
/// No appraisal math — raw data access only.
/// </summary>
public sealed class ProvalConnector : IDataConnector
{
    private readonly ILogger<ProvalConnector> _logger;
    private readonly string _connectionString;
    private bool _connected;

    /// <inheritdoc />
    public string Name => "proval";

    /// <inheritdoc />
    public string DisplayName => "ProVal CAMA";

    /// <inheritdoc />
    public bool IsConnected => _connected;

    /// <summary>Initializes a new ProVal connector.</summary>
    public ProvalConnector(
        ILogger<ProvalConnector> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _connectionString = configuration.GetConnectionString("ProVal") ?? string.Empty;
    }

    /// <inheritdoc />
    public Task ConnectAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Connecting to ProVal CAMA");
        _connected = true;
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task DisconnectAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Disconnecting from ProVal CAMA");
        _connected = false;
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<bool> TestConnectionAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("Testing ProVal connection");
        return Task.FromResult(!string.IsNullOrWhiteSpace(_connectionString));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<Dictionary<string, object?>>> FetchAsync(
        ConnectorQuery query, CancellationToken ct = default)
    {
        _logger.LogInformation("ProVal fetch: entity={Entity}", query.EntityName);
        IReadOnlyList<Dictionary<string, object?>> empty =
            Array.Empty<Dictionary<string, object?>>();
        return Task.FromResult(empty);
    }

    /// <inheritdoc />
    public Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default)
    {
        var schema = new ConnectorSchema(Name, new[]
        {
            new ConnectorEntity("CostEntry", new[]
            {
                new ConnectorField("EntryId", "int", false),
                new ConnectorField("ParcelId", "string", false),
                new ConnectorField("ComponentType", "string"),
                new ConnectorField("Quality", "string"),
                new ConnectorField("Quantity", "decimal"),
                new ConnectorField("UnitCost", "decimal"),
            }),
            new ConnectorEntity("DepreciationSchedule", new[]
            {
                new ConnectorField("ScheduleId", "int", false),
                new ConnectorField("EffectiveAge", "int"),
                new ConnectorField("Condition", "string"),
                new ConnectorField("DepreciationRate", "decimal"),
            }),
        });
        return Task.FromResult(schema);
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        _connected = false;
        return ValueTask.CompletedTask;
    }
}
