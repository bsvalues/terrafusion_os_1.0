using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Factory for creating appropriate legacy database service implementations
    /// Maps counties to their specific legacy systems while maintaining abstraction
    /// </summary>
    public class LegacyDatabaseFactory
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LegacyDatabaseFactory> _logger;

        public LegacyDatabaseFactory(
            IServiceProvider serviceProvider, 
            IConfiguration configuration,
            ILogger<LegacyDatabaseFactory> logger)
        {
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Create legacy database service for specified county
        /// Returns appropriate implementation based on county's legacy system
        /// </summary>
        public ILegacyDatabaseService CreateForCounty(string countyName)
        {
            try
            {
                var legacySystemType = GetLegacySystemType(countyName);
                
                _logger.LogInformation("Creating legacy database service for {County} using {SystemType}", 
                    countyName, legacySystemType);

                return legacySystemType switch
                {
                    "HARRIS_PACS" => _serviceProvider.GetRequiredService<HarrisPacsLegacyService>(),
                    "TYLER_TECH" => _serviceProvider.GetRequiredService<TylerTechLegacyService>(),
                    "CAMA_PLUS" => _serviceProvider.GetRequiredService<CamaPlusLegacyService>(),
                    "GENERIC" => _serviceProvider.GetRequiredService<GenericLegacyService>(),
                    _ => throw new NotSupportedException($"Legacy system type '{legacySystemType}' not supported")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create legacy database service for {County}", countyName);
                throw;
            }
        }

        /// <summary>
        /// Get the legacy system type for a specific county
        /// Maintains mapping between counties and their legacy systems
        /// </summary>
        private string GetLegacySystemType(string countyName)
        {
            // Check configuration first
            var configKey = $"LegacySystems:{countyName.Replace(" ", "_").Replace(",", "")}";
            var configuredType = _configuration[configKey];
            
            if (!string.IsNullOrEmpty(configuredType))
            {
                return configuredType;
            }

            // Default mappings for known counties
            return countyName.ToUpperInvariant() switch
            {
                var name when name.Contains("BENTON") => "HARRIS_PACS",
                var name when name.Contains("CLARK") => "HARRIS_PACS",
                var name when name.Contains("KING") => "CAMA_PLUS",
                var name when name.Contains("PIERCE") => "HARRIS_PACS",
                var name when name.Contains("SNOHOMISH") => "HARRIS_PACS",
                var name when name.Contains("SPOKANE") => "CAMA_PLUS",
                var name when name.Contains("WHATCOM") => "HARRIS_PACS",
                var name when name.Contains("YAKIMA") => "HARRIS_PACS",
                var name when name.Contains("THURSTON") => "CAMA_PLUS",
                var name when name.Contains("KITSAP") => "HARRIS_PACS",
                _ => "GENERIC"
            };
        }

        /// <summary>
        /// Get all supported legacy system types
        /// </summary>
        public string[] GetSupportedSystemTypes()
        {
            return new[] { "HARRIS_PACS", "TYLER_TECH", "CAMA_PLUS", "GENERIC" };
        }

        /// <summary>
        /// Check if a legacy system type is supported
        /// </summary>
        public bool IsSystemTypeSupported(string systemType)
        {
            return Array.Exists(GetSupportedSystemTypes(), t => t.Equals(systemType, StringComparison.OrdinalIgnoreCase));
        }
    }

    /// <summary>
    /// Extension methods for dependency injection setup
    /// </summary>
    public static class LegacyDatabaseServiceExtensions
    {
        public static IServiceCollection AddLegacyDatabaseServices(this IServiceCollection services)
        {
            // Register all legacy database service implementations
            services.AddScoped<HarrisPacsLegacyService>();
            services.AddScoped<TylerTechLegacyService>();
            services.AddScoped<CamaPlusLegacyService>();
            services.AddScoped<GenericLegacyService>();
            
            // Register factory
            services.AddScoped<LegacyDatabaseFactory>();
            
            // Register generic interface with factory resolver
            services.AddScoped<ILegacyDatabaseService>(provider =>
            {
                var configuration = provider.GetRequiredService<IConfiguration>();
                var factory = provider.GetRequiredService<LegacyDatabaseFactory>();
                var countyName = configuration["County:Name"] ?? "Default County";
                return factory.CreateForCounty(countyName);
            });

            return services;
        }
    }
}
