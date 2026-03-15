// TMR-125: Application Monitor - Uptime and health tracking
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Monitoring
{
    /// <summary>
    /// Health status of an application component.
    /// </summary>
    public enum ComponentHealth
    {
        Healthy,
        Degraded,
        Unhealthy
    }

    /// <summary>
    /// Status entry for a monitored component.
    /// </summary>
    public class ComponentStatus
    {
        public string Name { get; set; } = string.Empty;
        public ComponentHealth Health { get; set; }
        public TimeSpan Uptime { get; set; }
        public DateTime LastChecked { get; set; } = DateTime.UtcNow;
        public string? Message { get; set; }
    }

    /// <summary>
    /// Tracks application uptime and component health across the DataMining platform.
    /// </summary>
    public class ApplicationMonitor
    {
        private readonly ILogger<ApplicationMonitor> _logger;
        private readonly DateTime _startTime = DateTime.UtcNow;
        private readonly Dictionary<string, ComponentStatus> _components = new();

        public ApplicationMonitor(ILogger<ApplicationMonitor> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Gets the application uptime since startup.
        /// </summary>
        public TimeSpan Uptime => DateTime.UtcNow - _startTime;

        /// <summary>
        /// Registers a component for health tracking.
        /// </summary>
        public void RegisterComponent(string name)
        {
            _components[name] = new ComponentStatus
            {
                Name = name,
                Health = ComponentHealth.Healthy,
                Uptime = TimeSpan.Zero
            };
            _logger.LogInformation("Component registered for monitoring: {Name}", name);
        }

        /// <summary>
        /// Updates the health status of a registered component.
        /// </summary>
        public Task UpdateComponentHealthAsync(string name, ComponentHealth health, string? message = null)
        {
            if (!_components.ContainsKey(name))
                RegisterComponent(name);

            _components[name].Health = health;
            _components[name].LastChecked = DateTime.UtcNow;
            _components[name].Message = message;

            if (health != ComponentHealth.Healthy)
                _logger.LogWarning("Component {Name} health: {Health} - {Message}", name, health, message);

            return Task.CompletedTask;
        }

        /// <summary>
        /// Returns the overall application health summary.
        /// </summary>
        public Task<ApplicationHealthSummary> GetHealthSummaryAsync()
        {
            var summary = new ApplicationHealthSummary
            {
                Uptime = Uptime,
                StartTime = _startTime,
                Components = new List<ComponentStatus>(_components.Values)
            };
            return Task.FromResult(summary);
        }
    }

    /// <summary>
    /// Overall application health summary.
    /// </summary>
    public class ApplicationHealthSummary
    {
        public TimeSpan Uptime { get; set; }
        public DateTime StartTime { get; set; }
        public List<ComponentStatus> Components { get; set; } = new();
    }
}
