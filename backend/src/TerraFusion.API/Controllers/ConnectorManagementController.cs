// BIV-017: REST API for connector management
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Represents a registered data connector.
    /// </summary>
    public class ConnectorInfo
    {
        /// <summary>Unique connector identifier.</summary>
        public string ConnectorId { get; set; } = string.Empty;

        /// <summary>Display name.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Connector type (e.g., SqlServer, Api, Scraper).</summary>
        public string ConnectorType { get; set; } = string.Empty;

        /// <summary>Target system description.</summary>
        public string TargetSystem { get; set; } = string.Empty;

        /// <summary>Whether the connector is enabled.</summary>
        public bool Enabled { get; set; } = true;

        /// <summary>Current health status.</summary>
        public string Status { get; set; } = "unknown";

        /// <summary>Last successful sync timestamp.</summary>
        public DateTime? LastSyncAt { get; set; }

        /// <summary>Last sync duration.</summary>
        public TimeSpan? LastSyncDuration { get; set; }

        /// <summary>Records synced in the last operation.</summary>
        public int? LastSyncRecordCount { get; set; }

        /// <summary>UTC timestamp when connector was registered.</summary>
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Represents a connector health status response.
    /// </summary>
    public class ConnectorStatusResponse
    {
        /// <summary>Connector identifier.</summary>
        public string ConnectorId { get; set; } = string.Empty;

        /// <summary>Health status: healthy, degraded, unhealthy, unknown.</summary>
        public string Status { get; set; } = "unknown";

        /// <summary>Whether the connector can reach its data source.</summary>
        public bool IsReachable { get; set; }

        /// <summary>Connection latency in milliseconds.</summary>
        public double? LatencyMs { get; set; }

        /// <summary>Error message if unhealthy.</summary>
        public string? ErrorMessage { get; set; }

        /// <summary>UTC timestamp of this status check.</summary>
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Represents a sync trigger response.
    /// </summary>
    public class SyncTriggerResponse
    {
        /// <summary>Sync operation identifier.</summary>
        public string SyncId { get; set; } = Guid.NewGuid().ToString("N");

        /// <summary>Connector that the sync was triggered for.</summary>
        public string ConnectorId { get; set; } = string.Empty;

        /// <summary>Sync status: queued, running, completed, failed.</summary>
        public string Status { get; set; } = "queued";

        /// <summary>Message describing the sync state.</summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>UTC timestamp when the sync was triggered.</summary>
        public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Represents a sync history entry.
    /// </summary>
    public class SyncHistoryEntry
    {
        /// <summary>Sync operation identifier.</summary>
        public string SyncId { get; set; } = string.Empty;

        /// <summary>Sync mode: full or delta.</summary>
        public string Mode { get; set; } = string.Empty;

        /// <summary>Whether the sync succeeded.</summary>
        public bool Success { get; set; }

        /// <summary>Records fetched.</summary>
        public int RecordsFetched { get; set; }

        /// <summary>Records inserted.</summary>
        public int RecordsInserted { get; set; }

        /// <summary>Records updated.</summary>
        public int RecordsUpdated { get; set; }

        /// <summary>Records failed.</summary>
        public int RecordsFailed { get; set; }

        /// <summary>Duration of the sync.</summary>
        public TimeSpan Duration { get; set; }

        /// <summary>UTC timestamp when the sync started.</summary>
        public DateTime StartedAt { get; set; }

        /// <summary>Error message if the sync failed.</summary>
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Interface for the connector registry service.
    /// </summary>
    public interface IConnectorRegistry
    {
        /// <summary>Gets all registered connectors.</summary>
        Task<IReadOnlyList<ConnectorInfo>> GetAllAsync(CancellationToken ct = default);

        /// <summary>Gets a connector by ID.</summary>
        Task<ConnectorInfo?> GetByIdAsync(string connectorId, CancellationToken ct = default);

        /// <summary>Tests a connector's connection.</summary>
        Task<ConnectorStatusResponse> TestConnectionAsync(string connectorId, CancellationToken ct = default);

        /// <summary>Triggers a sync for a connector.</summary>
        Task<SyncTriggerResponse> TriggerSyncAsync(string connectorId, CancellationToken ct = default);

        /// <summary>Gets sync history for a connector.</summary>
        Task<IReadOnlyList<SyncHistoryEntry>> GetSyncHistoryAsync(string connectorId, int limit = 20, CancellationToken ct = default);
    }

    /// <summary>
    /// REST API for connector management.
    /// Provides endpoints to list connectors, check status, test connections,
    /// trigger syncs, and view sync history.
    /// </summary>
    [ApiController]
    [Route("api/connectors")]
    public class ConnectorManagementController : ControllerBase
    {
        private readonly IConnectorRegistry _registry;

        /// <summary>
        /// Initializes the connector management controller.
        /// </summary>
        /// <param name="registry">Connector registry service.</param>
        public ConnectorManagementController(IConnectorRegistry registry)
        {
            _registry = registry ?? throw new ArgumentNullException(nameof(registry));
        }

        /// <summary>
        /// Lists all registered connectors.
        /// </summary>
        /// <returns>List of connector information.</returns>
        /// <response code="200">Returns the list of connectors.</response>
        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyList<ConnectorInfo>), 200)]
        public async Task<IActionResult> ListConnectors(CancellationToken ct)
        {
            var connectors = await _registry.GetAllAsync(ct);
            return Ok(connectors);
        }

        /// <summary>
        /// Gets the health status of a specific connector.
        /// </summary>
        /// <param name="id">Connector identifier.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Connector status information.</returns>
        /// <response code="200">Returns the connector status.</response>
        /// <response code="404">Connector not found.</response>
        [HttpGet("{id}/status")]
        [ProducesResponseType(typeof(ConnectorStatusResponse), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetConnectorStatus(string id, CancellationToken ct)
        {
            var connector = await _registry.GetByIdAsync(id, ct);
            if (connector == null)
                return NotFound(new { message = $"Connector '{id}' not found." });

            var status = await _registry.TestConnectionAsync(id, ct);
            return Ok(status);
        }

        /// <summary>
        /// Tests a connector's connection to its data source.
        /// </summary>
        /// <param name="id">Connector identifier.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Connection test result.</returns>
        /// <response code="200">Connection test completed (check IsReachable for result).</response>
        /// <response code="404">Connector not found.</response>
        [HttpPost("{id}/test")]
        [ProducesResponseType(typeof(ConnectorStatusResponse), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> TestConnection(string id, CancellationToken ct)
        {
            var connector = await _registry.GetByIdAsync(id, ct);
            if (connector == null)
                return NotFound(new { message = $"Connector '{id}' not found." });

            var result = await _registry.TestConnectionAsync(id, ct);
            return Ok(result);
        }

        /// <summary>
        /// Triggers a sync operation for a connector.
        /// </summary>
        /// <param name="id">Connector identifier.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Sync trigger response with operation ID.</returns>
        /// <response code="202">Sync operation queued.</response>
        /// <response code="404">Connector not found.</response>
        [HttpPost("{id}/sync")]
        [ProducesResponseType(typeof(SyncTriggerResponse), 202)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> TriggerSync(string id, CancellationToken ct)
        {
            var connector = await _registry.GetByIdAsync(id, ct);
            if (connector == null)
                return NotFound(new { message = $"Connector '{id}' not found." });

            var response = await _registry.TriggerSyncAsync(id, ct);
            return Accepted(response);
        }

        /// <summary>
        /// Gets the sync history for a connector.
        /// </summary>
        /// <param name="id">Connector identifier.</param>
        /// <param name="limit">Maximum number of history entries to return (default 20).</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>List of sync history entries.</returns>
        /// <response code="200">Returns the sync history.</response>
        /// <response code="404">Connector not found.</response>
        [HttpGet("{id}/history")]
        [ProducesResponseType(typeof(IReadOnlyList<SyncHistoryEntry>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetSyncHistory(string id, [FromQuery] int limit = 20, CancellationToken ct = default)
        {
            var connector = await _registry.GetByIdAsync(id, ct);
            if (connector == null)
                return NotFound(new { message = $"Connector '{id}' not found." });

            var history = await _registry.GetSyncHistoryAsync(id, limit, ct);
            return Ok(history);
        }
    }
}
