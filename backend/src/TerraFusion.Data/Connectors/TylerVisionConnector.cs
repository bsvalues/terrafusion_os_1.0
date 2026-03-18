// TFT-017 — Tyler Technologies Vision Connector
// Canon-sync connector for Tyler Vision CAMA/property data.

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.Connectors;

/// <summary>
/// TFT-017: Tyler Technologies Vision connector.
/// Reads property, improvement, and land data from Tyler Vision.
/// </summary>
public sealed class TylerVisionConnector : IDataConnector
{
    private readonly ILogger<TylerVisionConnector> _logger;
    private readonly string _baseUrl;
    private bool _connected;

    /// <inheritdoc />
    public string Name => "tyler-vision";

    /// <inheritdoc />
    public string DisplayName => "Tyler Technologies Vision";

    /// <inheritdoc />
    public bool IsConnected => _connected;

    /// <summary>Initializes a new Tyler Vision connector.</summary>
    public TylerVisionConnector(
        ILogger<TylerVisionConnector> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _baseUrl = configuration["Connectors:TylerVision:BaseUrl"] ?? string.Empty;
    }

    /// <inheritdoc />
    public Task ConnectAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Connecting to Tyler Vision at {Url}", _baseUrl);
        _connected = true;
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task DisconnectAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Disconnecting from Tyler Vision");
        _connected = false;
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<bool> TestConnectionAsync(CancellationToken ct = default)
    {
        _logger.LogDebug("Testing Tyler Vision connection");
        return Task.FromResult(!string.IsNullOrWhiteSpace(_baseUrl));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<Dictionary<string, object?>>> FetchAsync(
        ConnectorQuery query, CancellationToken ct = default)
    {
        _logger.LogInformation("Tyler Vision fetch: entity={Entity}", query.EntityName);
        IReadOnlyList<Dictionary<string, object?>> empty =
            Array.Empty<Dictionary<string, object?>>();
        return Task.FromResult(empty);
    }

    /// <inheritdoc />
    public Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default)
    {
        var schema = new ConnectorSchema(Name, new[]
        {
            new ConnectorEntity("Parcel", new[]
            {
                new ConnectorField("ParcelNumber", "string", false),
                new ConnectorField("PropertyType", "string"),
                new ConnectorField("Neighborhood", "string"),
                new ConnectorField("LandArea", "decimal"),
                new ConnectorField("ZoningCode", "string"),
            }),
            new ConnectorEntity("Improvement", new[]
            {
                new ConnectorField("ImprovementId", "int", false),
                new ConnectorField("ParcelNumber", "string", false),
                new ConnectorField("BuildingType", "string"),
                new ConnectorField("YearBuilt", "int"),
                new ConnectorField("SquareFeet", "decimal"),
                new ConnectorField("Stories", "int"),
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
