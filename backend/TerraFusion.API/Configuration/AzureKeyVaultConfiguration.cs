using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Configuration
{
    /// <summary>
    /// Azure Key Vault configuration provider for secure secrets management
    /// </summary>
    public static class AzureKeyVaultConfigurationExtensions
    {
        /// <summary>
        /// Adds Azure Key Vault configuration to the application
        /// </summary>
        public static IConfigurationBuilder AddAzureKeyVaultConfiguration(
            this IConfigurationBuilder builder,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            var keyVaultConfig = configuration.GetSection("AzureKeyVault");
            
            try 
            {
                var isEnabled = keyVaultConfig.GetValue<bool>("Enabled", false);
                
                // Additional check for environment variable override
                var envEnabled = Environment.GetEnvironmentVariable("AzureKeyVault__Enabled");
                if (!string.IsNullOrEmpty(envEnabled) && bool.TryParse(envEnabled, out var envEnabledValue))
                {
                    isEnabled = envEnabledValue;
                }
                
                // For non-production environments, default to disabled unless explicitly enabled
                if (environment.EnvironmentName != "Production" && environment.EnvironmentName != "Staging")
                {
                    isEnabled = false;
                }

                Console.WriteLine($"Azure Key Vault Configuration - Environment: {environment.EnvironmentName}, Enabled: {isEnabled}");

                if (!isEnabled)
                {
                    Console.WriteLine("Azure Key Vault disabled, skipping configuration");
                    return builder;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in Azure Key Vault configuration: {ex.Message}");
                // Return builder without Azure Key Vault in case of any errors
                return builder;
            }

            var vaultUrl = keyVaultConfig.GetValue<string>("VaultUrl");
            if (string.IsNullOrEmpty(vaultUrl))
            {
                throw new InvalidOperationException("AzureKeyVault:VaultUrl is required when Azure Key Vault is enabled");
            }

            // Use different authentication methods based on environment
            if (environment.IsDevelopment())
            {
                // Use Visual Studio or Azure CLI credentials for development
                var credential = new DefaultAzureCredential();
                builder.AddAzureKeyVault(new Uri(vaultUrl), credential);
            }
            else
            {
                // Use managed identity or service principal for production
                var clientId = keyVaultConfig.GetValue<string>("ClientId");
                var clientSecret = keyVaultConfig.GetValue<string>("ClientSecret");
                var tenantId = keyVaultConfig.GetValue<string>("TenantId");

                if (!string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(clientSecret) && !string.IsNullOrEmpty(tenantId))
                {
                    var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
                    builder.AddAzureKeyVault(new Uri(vaultUrl), credential);
                }
                else
                {
                    // Use managed identity
                    var credential = new DefaultAzureCredential();
                    builder.AddAzureKeyVault(new Uri(vaultUrl), credential);
                }
            }

            return builder;
        }
    }

    /// <summary>
    /// Service for managing secure configuration with Azure Key Vault
    /// </summary>
    public interface ISecureConfigurationService
    {
        Task<string> GetSecretAsync(string secretName);
        Task<T> GetConfigurationValueAsync<T>(string key, T defaultValue = default);
        Task SetSecretAsync(string secretName, string secretValue);
        Task<bool> SecretExistsAsync(string secretName);
    }

    public class SecureConfigurationService : ISecureConfigurationService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SecureConfigurationService> _logger;
        private readonly SecretClient? _secretClient;
        private readonly bool _keyVaultEnabled;

        public SecureConfigurationService(
            IConfiguration configuration,
            ILogger<SecureConfigurationService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _keyVaultEnabled = _configuration.GetValue<bool>("AzureKeyVault:Enabled", false);

            if (_keyVaultEnabled)
            {
                var vaultUrl = _configuration.GetValue<string>("AzureKeyVault:VaultUrl");
                if (!string.IsNullOrEmpty(vaultUrl))
                {
                    var credential = new DefaultAzureCredential();
                    _secretClient = new SecretClient(new Uri(vaultUrl), credential);
                }
            }
        }

        public async Task<string> GetSecretAsync(string secretName)
        {
            if (!_keyVaultEnabled || _secretClient == null)
            {
                // Fallback to regular configuration
                return _configuration[secretName] ?? string.Empty;
            }

            try
            {
                var secret = await _secretClient.GetSecretAsync(secretName);
                return secret.Value.Value;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve secret {SecretName} from Key Vault, falling back to configuration", secretName);
                return _configuration[secretName] ?? string.Empty;
            }
        }

        public async Task<T> GetConfigurationValueAsync<T>(string key, T defaultValue = default)
        {
            try
            {
                var value = await GetSecretAsync(key);
                if (string.IsNullOrEmpty(value))
                {
                    return defaultValue;
                }

                if (typeof(T) == typeof(string))
                {
                    return (T)(object)value;
                }

                return (T)Convert.ChangeType(value, typeof(T));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get configuration value for {Key}, using default", key);
                return defaultValue;
            }
        }

        public async Task SetSecretAsync(string secretName, string secretValue)
        {
            if (!_keyVaultEnabled || _secretClient == null)
            {
                throw new InvalidOperationException("Azure Key Vault is not enabled or configured");
            }

            try
            {
                await _secretClient.SetSecretAsync(secretName, secretValue);
                _logger.LogInformation("Secret {SecretName} updated in Key Vault", secretName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to set secret {SecretName} in Key Vault", secretName);
                throw;
            }
        }

        public async Task<bool> SecretExistsAsync(string secretName)
        {
            if (!_keyVaultEnabled || _secretClient == null)
            {
                return !string.IsNullOrEmpty(_configuration[secretName]);
            }

            try
            {
                await _secretClient.GetSecretAsync(secretName);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>
    /// Service collection extensions for secure configuration
    /// </summary>
    public static class SecureConfigurationServiceCollectionExtensions
    {
        public static IServiceCollection AddSecureConfiguration(this IServiceCollection services)
        {
            services.AddSingleton<ISecureConfigurationService, SecureConfigurationService>();
            return services;
        }
    }
}
