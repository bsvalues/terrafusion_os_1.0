// TMR-015: Plugin discovery and CLI runner for ETL plugins
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// Marker interface for ETL plugins that can be discovered and executed.
    /// </summary>
    public interface IEtlPlugin
    {
        /// <summary>Unique plugin identifier.</summary>
        string PluginId { get; }

        /// <summary>Human-readable plugin name.</summary>
        string PluginName { get; }

        /// <summary>Plugin description.</summary>
        string Description { get; }

        /// <summary>Plugin version string.</summary>
        string Version { get; }

        /// <summary>
        /// Executes the plugin's ETL pipeline.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Result of the ETL execution.</returns>
        Task<EtlJobResult> ExecuteAsync(CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Discovers ETL plugins from loaded assemblies and provides a CLI-style runner.
    /// Plugins implement <see cref="IEtlPlugin"/> and are discovered at runtime.
    /// </summary>
    public class EtlPluginRunner
    {
        private readonly ILogger<EtlPluginRunner> _logger;
        private readonly EtlJobManager _jobManager;
        private readonly Dictionary<string, IEtlPlugin> _discoveredPlugins = new();

        /// <summary>
        /// Initializes the plugin runner.
        /// </summary>
        /// <param name="jobManager">Job manager for registration and execution.</param>
        /// <param name="logger">Logger instance.</param>
        public EtlPluginRunner(EtlJobManager jobManager, ILogger<EtlPluginRunner> logger)
        {
            _jobManager = jobManager ?? throw new ArgumentNullException(nameof(jobManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Discovers all <see cref="IEtlPlugin"/> implementations in the given assemblies.
        /// If no assemblies are specified, searches the current AppDomain.
        /// </summary>
        /// <param name="assemblies">Assemblies to search, or null for all loaded assemblies.</param>
        /// <param name="serviceProvider">Service provider for creating plugin instances.</param>
        /// <returns>Number of plugins discovered.</returns>
        public int DiscoverPlugins(IEnumerable<Assembly>? assemblies = null, IServiceProvider? serviceProvider = null)
        {
            var searchAssemblies = assemblies ?? AppDomain.CurrentDomain.GetAssemblies();
            int count = 0;

            foreach (var assembly in searchAssemblies)
            {
                try
                {
                    var pluginTypes = assembly.GetTypes()
                        .Where(t => typeof(IEtlPlugin).IsAssignableFrom(t)
                                    && t.IsClass
                                    && !t.IsAbstract);

                    foreach (var pluginType in pluginTypes)
                    {
                        try
                        {
                            IEtlPlugin? plugin = null;

                            if (serviceProvider != null)
                            {
                                plugin = serviceProvider.GetService(pluginType) as IEtlPlugin;
                            }

                            plugin ??= Activator.CreateInstance(pluginType) as IEtlPlugin;

                            if (plugin != null)
                            {
                                _discoveredPlugins[plugin.PluginId] = plugin;
                                _jobManager.RegisterJob(
                                    plugin.PluginId,
                                    plugin.PluginName,
                                    plugin.ExecuteAsync);
                                count++;
                                _logger.LogInformation("Discovered ETL plugin: {Id} ({Name} v{Version})",
                                    plugin.PluginId, plugin.PluginName, plugin.Version);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to instantiate plugin type {Type}", pluginType.FullName);
                        }
                    }
                }
                catch (ReflectionTypeLoadException ex)
                {
                    _logger.LogDebug(ex, "Could not load types from assembly {Assembly}", assembly.FullName);
                }
            }

            _logger.LogInformation("Plugin discovery complete. Found {Count} plugins", count);
            return count;
        }

        /// <summary>
        /// Runs a plugin by its ID.
        /// </summary>
        /// <param name="pluginId">Plugin identifier.</param>
        /// <returns>Job result, or null if not found.</returns>
        public async Task<EtlJobResult?> RunPluginAsync(string pluginId)
        {
            return await _jobManager.ExecuteJobAsync(pluginId);
        }

        /// <summary>
        /// Lists all discovered plugins.
        /// </summary>
        public IReadOnlyDictionary<string, IEtlPlugin> GetDiscoveredPlugins()
        {
            return _discoveredPlugins;
        }

        /// <summary>
        /// Runs all discovered plugins sequentially.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Results keyed by plugin ID.</returns>
        public async Task<Dictionary<string, EtlJobResult>> RunAllPluginsAsync(
            CancellationToken cancellationToken = default)
        {
            var results = new Dictionary<string, EtlJobResult>();

            foreach (var plugin in _discoveredPlugins)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var result = await _jobManager.ExecuteJobAsync(plugin.Key);
                if (result != null)
                {
                    results[plugin.Key] = result;
                }
            }

            return results;
        }
    }
}
