using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.Security.Interfaces;

namespace TerraFusion.Security.Services
{
    /// <summary>
    /// HashiCorp Vault integration for production secrets management
    /// Implements P0-CRITICAL security requirement from CTO Roadmap
    /// </summary>
    public class VaultSecretsService : ISecretsService
    {
        private readonly ILogger<VaultSecretsService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _vaultUrl;
        private readonly string _vaultToken;
        private readonly string _vaultMountPath;

        public VaultSecretsService(
            ILogger<VaultSecretsService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            
            _vaultUrl = _configuration["Vault:Url"] ?? "http://localhost:8200";
            _vaultToken = _configuration["Vault:Token"] ?? Environment.GetEnvironmentVariable("VAULT_TOKEN") ?? "";
            _vaultMountPath = _configuration["Vault:MountPath"] ?? "secret";
            
            if (string.IsNullOrEmpty(_vaultToken))
            {
                _logger.LogWarning("VAULT_TOKEN environment variable not set - using development mode");
            }
        }

        public async Task<string> GetSecretAsync(string secretPath)
        {
            try
            {
                if (string.IsNullOrEmpty(_vaultToken))
                {
                    // Development fallback
                    return _configuration[$"Secrets:{secretPath}"] ?? "";
                }

                var request = new HttpRequestMessage(HttpMethod.Get, $"{_vaultUrl}/v1/{_vaultMountPath}/data/{secretPath}");
                request.Headers.Add("X-Vault-Token", _vaultToken);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var vaultResponse = JsonSerializer.Deserialize<VaultResponse>(content);

                if (vaultResponse?.Data?.Data != null && vaultResponse.Data.Data.TryGetValue("value", out var secretValue))
                {
                    _logger.LogInformation("Successfully retrieved secret from Vault: {SecretPath}", secretPath);
                    return secretValue?.ToString() ?? "";
                }

                throw new InvalidOperationException($"Failed to extract secret value from Vault response for path: {secretPath}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve secret from Vault: {SecretPath}", secretPath);
                throw;
            }
        }

        public async Task<bool> SetSecretAsync(string secretPath, string value)
        {
            try
            {
                if (string.IsNullOrEmpty(_vaultToken))
                {
                    _logger.LogWarning("Cannot set secret in Vault - no token available");
                    return false;
                }

                var secretData = new { data = new { value } };
                var json = JsonSerializer.Serialize(secretData);

                var request = new HttpRequestMessage(HttpMethod.Post, $"{_vaultUrl}/v1/{_vaultMountPath}/data/{secretPath}")
                {
                    Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
                };
                request.Headers.Add("X-Vault-Token", _vaultToken);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                _logger.LogInformation("Successfully set secret in Vault: {SecretPath}", secretPath);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to set secret in Vault: {SecretPath}", secretPath);
                return false;
            }
        }

        public async Task<bool> DeleteSecretAsync(string secretPath)
        {
            try
            {
                if (string.IsNullOrEmpty(_vaultToken))
                {
                    _logger.LogWarning("Cannot delete secret from Vault - no token available");
                    return false;
                }

                var request = new HttpRequestMessage(HttpMethod.Delete, $"{_vaultUrl}/v1/{_vaultMountPath}/metadata/{secretPath}");
                request.Headers.Add("X-Vault-Token", _vaultToken);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                _logger.LogInformation("Successfully deleted secret from Vault: {SecretPath}", secretPath);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete secret from Vault: {SecretPath}", secretPath);
                return false;
            }
        }

        public async Task<bool> IsVaultAvailableAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_vaultUrl}/v1/sys/health");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private class VaultResponse
        {
            public VaultData? Data { get; set; }
        }

        private class VaultData
        {
            public Dictionary<string, object>? Data { get; set; }
        }
    }

    public interface ISecretsService
    {
        Task<string> GetSecretAsync(string secretPath);
        Task<bool> SetSecretAsync(string secretPath, string value);
        Task<bool> DeleteSecretAsync(string secretPath);
        Task<bool> IsVaultAvailableAsync();
    }
}
