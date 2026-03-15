// TFR-020 — Registry of available data connectors
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using TerraFusion.Core.Sync.Connectors;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Health status of a registered connector.
    /// </summary>
    public enum ConnectorHealth
    {
        Unknown,
        Healthy,
        Degraded,
        Unhealthy
    }

    /// <summary>
    /// Metadata about a registered connector.
    /// </summary>
    public sealed record ConnectorRegistration
    {
        public string Name { get; init; } = string.Empty;
        public string ConnectorType { get; init; } = string.Empty;
        public ConnectorHealth Health { get; set; } = ConnectorHealth.Unknown;
        public IConnector Instance { get; init; } = null!;
        public DateTime RegisteredAtUtc { get; init; } = DateTime.UtcNow;
        public DateTime? LastHealthCheckUtc { get; set; }
    }

    /// <summary>
    /// Thread-safe registry of available data connectors. Supports registration, lookup, and health tracking.
    /// </summary>
    public class ConnectorRegistry
    {
        private readonly ConcurrentDictionary<string, ConnectorRegistration> _connectors = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Registers a connector with the given name.
        /// </summary>
        /// <param name="name">Unique connector name.</param>
        /// <param name="connector">Connector instance.</param>
        /// <param name="connectorType">Descriptor for the connector type (e.g. "PACS", "CAMA", "ODBC").</param>
        /// <returns>True if registered; false if name already exists.</returns>
        public bool RegisterConnector(string name, IConnector connector, string connectorType = "")
        {
            var registration = new ConnectorRegistration
            {
                Name = name,
                ConnectorType = connectorType,
                Instance = connector ?? throw new ArgumentNullException(nameof(connector))
            };
            return _connectors.TryAdd(name, registration);
        }

        /// <summary>
        /// Removes a connector registration.
        /// </summary>
        public bool UnregisterConnector(string name) =>
            _connectors.TryRemove(name, out _);

        /// <summary>
        /// Retrieves a connector by name. Returns null if not found.
        /// </summary>
        public IConnector? GetConnector(string name) =>
            _connectors.TryGetValue(name, out var reg) ? reg.Instance : null;

        /// <summary>
        /// Returns the registration metadata for a connector.
        /// </summary>
        public ConnectorRegistration? GetRegistration(string name) =>
            _connectors.TryGetValue(name, out var reg) ? reg : null;

        /// <summary>
        /// Lists all registered connectors.
        /// </summary>
        public IReadOnlyList<ConnectorRegistration> ListConnectors() =>
            _connectors.Values.ToList();

        /// <summary>
        /// Updates the health status of a connector.
        /// </summary>
        public void UpdateHealth(string name, ConnectorHealth health)
        {
            if (_connectors.TryGetValue(name, out var reg))
            {
                reg.Health = health;
                reg.LastHealthCheckUtc = DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Returns the number of registered connectors.
        /// </summary>
        public int Count => _connectors.Count;
    }
}
