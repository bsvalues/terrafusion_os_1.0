// TFT-026 — Tax Roll / Levy Rate Connector
// Canon-sync connector for tax roll and levy rate data.

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.Connectors;

/// <summary>
/// TFT-026: Tax roll and levy rate connector.
/// Reads tax roll records, levy rates, tax code areas, and exemption data.
/// No appraisal math — raw tax data access only.
/// </summary>
public sealed class TaxRollConnector : IDataConnector
{
    private readonly ILogger<TaxRollConnector> _logger;
    private readonly string _connectionString;
    private bool _connected;

    /// <inheritdoc />
    public string Name => "tax-roll";

    /// <inheritdoc />
    public string DisplayName => "Tax Roll / Levy";

    /// <inheritdoc />
    public bool IsConnected => _connected;

    /// <summary>Initializes a new Tax Roll connector.</summary>
    public TaxRollConnector(
        ILogger<TaxRollConnector> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _connectionString = configuration.GetConnectionString("TaxRoll") ?? string.Empty;
    }

    /// <inheritdoc />
    public Task ConnectAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Connecting to Tax Roll system");
        _connected = true;
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task DisconnectAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Disconnecting from Tax Roll system");
        _connected = false;
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<bool> TestConnectionAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("Testing Tax Roll connection");
        return Task.FromResult(!string.IsNullOrWhiteSpace(_connectionString));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<Dictionary<string, object?>>> FetchAsync(
        ConnectorQuery query, CancellationToken ct = default)
    {
        _logger.LogInformation("Tax Roll fetch: entity={Entity}", query.EntityName);
        IReadOnlyList<Dictionary<string, object?>> empty =
            Array.Empty<Dictionary<string, object?>>();
        return Task.FromResult(empty);
    }

    /// <inheritdoc />
    public Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default)
    {
        var schema = new ConnectorSchema(Name, new[]
        {
            new ConnectorEntity("TaxRollEntry", new[]
            {
                new ConnectorField("ParcelNumber", "string", false),
                new ConnectorField("TaxYear", "int", false),
                new ConnectorField("TaxCodeArea", "string"),
                new ConnectorField("LevyRate", "decimal"),
                new ConnectorField("TaxAmount", "decimal"),
                new ConnectorField("ExemptionCode", "string"),
            }),
            new ConnectorEntity("LevyDistrict", new[]
            {
                new ConnectorField("DistrictId", "string", false),
                new ConnectorField("DistrictName", "string"),
                new ConnectorField("DistrictType", "string"),
                new ConnectorField("LevyRate", "decimal"),
                new ConnectorField("TaxYear", "int"),
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
