// TFT-022 — US Census ACS Connector
// Canon-sync connector for Census Bureau American Community Survey data.
//
// WO-WAL-001F — public-source connector truth.
// Health for this connector is OBSERVED, never assumed: TestConnectionAsync performs one bounded
// probe against the configured source and fails closed on a missing key, a key rejection, a
// non-2xx response, a non-array payload, or an unreachable source. FetchAsync fails closed rather
// than returning an empty collection that a caller could read as "the source has no rows".

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Data.Connectors;

/// <summary>
/// TFT-022: US Census ACS connector.
/// Reads demographic, income, and housing data from the Census Bureau API.
/// </summary>
public sealed class CensusConnector : IDataConnector
{
    /// <summary>
    /// Bounded probe client. Census answers a rejected key with a 302 to an
    /// <c>invalid_key.html</c> page and a keyless request with <c>missing_key.html</c>, so the probe
    /// inspects the final URI and the payload shape instead of trusting the status code alone.
    /// </summary>
    private static readonly HttpClient ProbeClient = new() { Timeout = TimeSpan.FromSeconds(6) };

    private const string ProbePath = "/2023/acs/acs5?get=NAME&for=state:53";

    private readonly ILogger<CensusConnector> _logger;
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private bool _connected;

    /// <inheritdoc />
    public string Name => "census-acs";

    /// <inheritdoc />
    public string DisplayName => "US Census ACS";

    /// <inheritdoc />
    public bool IsConnected => _connected;

    /// <summary>Initializes a new Census ACS connector.</summary>
    public CensusConnector(
        ILogger<CensusConnector> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _apiKey = configuration["Connectors:Census:ApiKey"] ?? string.Empty;
        _baseUrl = configuration["Connectors:Census:BaseUrl"]
                   ?? "https://api.census.gov/data";
    }

    /// <inheritdoc />
    public async Task ConnectAsync(CancellationToken ct = default)
    {
        var observed = await TestConnectionAsync(ct);
        _connected = observed;

        if (observed)
        {
            _logger.LogInformation("Census ACS source verified reachable for {BaseUrl}", _baseUrl);
        }
        else
        {
            _logger.LogWarning(
                "Census ACS connect refused: source not observed reachable for {BaseUrl}; connector stays disconnected",
                _baseUrl);
        }
    }

    /// <inheritdoc />
    public Task DisconnectAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Disconnecting from Census ACS");
        _connected = false;
        return Task.CompletedTask;
    }

    /// <summary>
    /// Observed health. Returns true only when a bounded live probe of the configured source
    /// returned a Census data payload. Any missing configuration, rejection, transport failure or
    /// unexpected payload reports the source unavailable.
    /// </summary>
    /// <inheritdoc />
    public async Task<bool> TestConnectionAsync(CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning(
                "Census ACS connector has no API key (Connectors:Census:ApiKey): source is unavailable, not healthy");
            return false;
        }

        if (string.IsNullOrWhiteSpace(_baseUrl))
        {
            _logger.LogWarning("Census ACS connector has no base URL: source is unavailable, not healthy");
            return false;
        }

        var probeUrl = _baseUrl.TrimEnd('/') + ProbePath + "&key=" + Uri.EscapeDataString(_apiKey);

        try
        {
            using var response = await ProbeClient.GetAsync(probeUrl, HttpCompletionOption.ResponseHeadersRead, ct);
            var finalUri = response.RequestMessage?.RequestUri?.AbsoluteUri ?? string.Empty;

            if (IsSourceRejectionUri(finalUri))
            {
                _logger.LogWarning(
                    "Census ACS probe was redirected to a key-rejection page ({Uri}): source is unavailable",
                    finalUri);
                return false;
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Census ACS probe returned status {Status}: source is unavailable",
                    (int)response.StatusCode);
                return false;
            }

            var payload = await response.Content.ReadAsStringAsync(ct);
            var observed = !string.IsNullOrWhiteSpace(payload)
                           && payload.TrimStart().StartsWith("[", StringComparison.Ordinal);

            if (!observed)
            {
                _logger.LogWarning(
                    "Census ACS probe returned a non-array payload: source is unavailable, not healthy");
            }

            return observed;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Census ACS probe could not reach the source: source is unavailable");
            return false;
        }
    }

    /// <summary>
    /// True when a response URI is one of the Census key-rejection pages, which are served with a
    /// success status and therefore cannot be distinguished by status code alone.
    /// </summary>
    public static bool IsSourceRejectionUri(string? uri) =>
        !string.IsNullOrWhiteSpace(uri)
        && (uri.Contains("invalid_key", StringComparison.OrdinalIgnoreCase)
            || uri.Contains("missing_key", StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Fails closed. This connector has no implemented acquisition path, so it faults instead of
    /// returning an empty collection that a caller could present as a successful read.
    /// </summary>
    /// <inheritdoc />
    public Task<IReadOnlyList<Dictionary<string, object?>>> FetchAsync(
        ConnectorQuery query, CancellationToken ct = default)
    {
        _logger.LogWarning(
            "Census ACS fetch is not implemented for entity={Entity}: failing closed instead of reporting an empty success",
            query.EntityName);

        return Task.FromException<IReadOnlyList<Dictionary<string, object?>>>(
            new NotSupportedException(
                "census-acs connector does not implement FetchAsync: no rows were read from the source. "
                + "An empty result must not be presented as acquired public data."));
    }

    /// <inheritdoc />
    public Task<ConnectorSchema> GetSchemaAsync(CancellationToken ct = default)
    {
        var schema = new ConnectorSchema(Name, new[]
        {
            new ConnectorEntity("Demographics", new[]
            {
                new ConnectorField("GeoId", "string", false),
                new ConnectorField("TotalPopulation", "int"),
                new ConnectorField("MedianAge", "decimal"),
                new ConnectorField("MedianHouseholdIncome", "decimal"),
                new ConnectorField("MedianHomeValue", "decimal"),
                new ConnectorField("VacancyRate", "decimal"),
            }),
            new ConnectorEntity("HousingCharacteristics", new[]
            {
                new ConnectorField("GeoId", "string", false),
                new ConnectorField("TotalHousingUnits", "int"),
                new ConnectorField("OwnerOccupied", "int"),
                new ConnectorField("RenterOccupied", "int"),
                new ConnectorField("MedianRent", "decimal"),
                new ConnectorField("MedianYearBuilt", "int"),
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
