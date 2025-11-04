using System.Threading.Tasks;
using TerraFusion.AI.Interfaces;
using TerraFusion.Core.DTOs;
using System.Diagnostics;
using Microsoft.Extensions.Hosting;
using System.IO;
using System;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Models;
using TerraFusion.Data.Repositories;
using System.Text.Json;
using System.Security.Cryptography;
using TerraFusion.Core.Security;

namespace TerraFusion.AI.Services
{
    public class MarketplaceService : IMarketplaceService
    {
        private readonly IHostEnvironment _hostingEnvironment;
        private readonly ILogger<MarketplaceService> _logger;
        private readonly IPluginSandboxService _sandboxService;
        private readonly IPluginRepository _pluginRepository;
        private readonly CrossPlatformVerifier _crossPlatformVerifier;

        public MarketplaceService(
            IHostEnvironment hostingEnvironment,
            ILogger<MarketplaceService> logger,
            IPluginSandboxService sandboxService,
            IPluginRepository pluginRepository,
            CrossPlatformVerifier crossPlatformVerifier)
        {
            _hostingEnvironment = hostingEnvironment;
            _logger = logger;
            _sandboxService = sandboxService;
            _pluginRepository = pluginRepository;
            _crossPlatformVerifier = crossPlatformVerifier;
        }

        public async System.Threading.Tasks.Task<(bool Success, string Message)> ProcessPluginSubmissionAsync(PluginSubmissionDto submissionDto)
        {
            _logger.LogInformation("Processing plugin submission for: {PluginName} v{PluginVersion}", submissionDto.Name, submissionDto.Version);

            // Step 1: Verify signature with consensus
            var packageBytesForVerification = Convert.FromBase64String(submissionDto.PackageData);
            var signatureBytes = Convert.FromHexString(submissionDto.Signature);

            var verificationResult = await _crossPlatformVerifier.VerifyWithConsensusAsync(
                packageBytesForVerification,
                signatureBytes,
                submissionDto.PublicKeyPem,
                submissionDto.AuthorId);

            if (!verificationResult.IsValid)
            {
                _logger.LogWarning("Plugin submission failed: Invalid signature for plugin {PluginName}. Details: {VerificationDetails}",
                    submissionDto.Name, JsonSerializer.Serialize(verificationResult));
                return (false, "Invalid plugin signature. Consensus verification failed.");
            }
            _logger.LogInformation("Signature consensus verification succeeded for {PluginName}", submissionDto.Name);

            var tempManifestFile = Path.GetTempFileName();
            try
            {
                await File.WriteAllTextAsync(tempManifestFile, submissionDto.ManifestJson);
                _logger.LogInformation("Manifest written to temporary file: {TempFile}", tempManifestFile);

                var validationResult = await ValidateManifestWithNodeScript(tempManifestFile);

                if (!validationResult.Success)
                {
                    _logger.LogWarning("Manifest validation failed for {PluginName}: {ValidationMessage}", submissionDto.Name, validationResult.Message);
                    return (false, validationResult.Message);
                }

                _logger.LogInformation("Manifest validation successful for {PluginName}", submissionDto.Name);

                // Step 2: Decode package and run in sandbox
                var wasmModule = Convert.FromBase64String(submissionDto.PackageData);
                var sandboxResult = await _sandboxService.ExecutePluginAsync(wasmModule, "run_test", Array.Empty<object>());

                if (!sandboxResult.Success)
                {
                    _logger.LogWarning("Plugin sandbox execution failed for {PluginName}: {SandboxOutput}", submissionDto.Name, sandboxResult.Output);
                    return (false, $"Plugin failed sandbox execution: {sandboxResult.Output}");
                }

                _logger.LogInformation("Plugin sandbox execution successful for {PluginName}. Output: {SandboxOutput}", submissionDto.Name, sandboxResult.Output);

                // Step 3: Store metadata in the database
                var plugin = new Plugin
                {
                    Id = Guid.NewGuid(),
                    Name = submissionDto.Name,
                    Version = submissionDto.Version,
                    Description = submissionDto.Description,
                    Category = submissionDto.Category,
                    AuthorId = submissionDto.AuthorId, // This should be populated from user claims in a real scenario
                    Status = PluginStatus.Pending,
                    SubmittedAt = DateTime.UtcNow,
                    PermissionsJson = ExtractPermissions(submissionDto.ManifestJson),
                    PackageUrl = $"https://plugins.terrafusion.ai/packages/{Guid.NewGuid()}.zip",
                    IconUrl = $"https://plugins.terrafusion.ai/icons/{Guid.NewGuid()}.png"
                };

                await _pluginRepository.AddAsync(plugin);
                _logger.LogInformation("Plugin metadata for {PluginName} saved to database with ID {PluginId}", plugin.Name, plugin.Id);

                // Future step: Save package to a secure storage and update PackageUrl

                return (true, "Plugin submitted successfully and is pending review.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while processing plugin submission for {PluginName}", submissionDto.Name);
                return (false, "An internal error occurred.");
            }
            finally
            {
                if (File.Exists(tempManifestFile))
                {
                    File.Delete(tempManifestFile);
                }
            }
        }

        private async System.Threading.Tasks.Task<(bool Success, string Message)> ValidateManifestWithNodeScript(string manifestPath)
        {
            var scriptsDir = Path.Combine(_hostingEnvironment.ContentRootPath, "..", "..", "scripts");
            var scriptPath = Path.Combine(scriptsDir, "validate-manifest.mjs");

            if (!File.Exists(scriptPath))
            {
                _logger.LogError("Validation script not found at {ScriptPath}", scriptPath);
                return (false, "Validation infrastructure is offline. Please contact support.");
            }

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = $"\"{scriptPath}\" \"{manifestPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = scriptsDir
                }
            };

            _logger.LogInformation("Executing node script: {FileName} {Arguments}", process.StartInfo.FileName, process.StartInfo.Arguments);

            process.Start();
            string output = await process.StandardOutput.ReadToEndAsync();
            string error = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                _logger.LogError("Manifest validation script failed with exit code {ExitCode}. Error: {Error}", process.ExitCode, error);
                return (false, $"Manifest validation failed: {error}");
            }

            _logger.LogInformation("Validation script output: {Output}", output);
            bool isValid = output.Contains("✅ Manifest is valid!");
            return (isValid, output);
        }

        private string ExtractPermissions(string manifestJson)
        {
            try
            {
                using var doc = JsonDocument.Parse(manifestJson);
                if (doc.RootElement.TryGetProperty("permissions", out var permissionsElement))
                {
                    return permissionsElement.ToString();
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Could not parse permissions from manifest.");
            }
            return "[]";
        }

        public async System.Threading.Tasks.Task<(bool Success, string Message)> PublishPluginAsync(PluginPublishDto publishDto)
        {
            _logger.LogInformation("Attempting to publish plugin {PluginId} v{Version}", publishDto.PluginId, publishDto.Version);

            var plugin = await _pluginRepository.GetByIdAsync(publishDto.PluginId);
            if (plugin == null || plugin.Version != publishDto.Version)
            {
                _logger.LogWarning("Publish failed: Plugin {PluginId} v{Version} not found or version mismatch.", publishDto.PluginId, publishDto.Version);
                return (false, "Plugin not found or version mismatch.");
            }

            // Step 1: Re-verify signature with consensus before publishing
            var packageBytes = Convert.FromBase64String(publishDto.PackageB64);
            var signatureBytesForPublish = Convert.FromHexString(publishDto.Signature);

            var verificationResultOnPublish = await _crossPlatformVerifier.VerifyWithConsensusAsync(
                packageBytes,
                signatureBytesForPublish,
                publishDto.PublicKeyPem,
                plugin.AuthorId);

            if (!verificationResultOnPublish.IsValid)
            {
                _logger.LogWarning("Publish failed: Invalid signature for plugin {PluginId}. Details: {VerificationDetails}",
                    publishDto.PluginId, JsonSerializer.Serialize(verificationResultOnPublish));
                return (false, "Invalid plugin signature. Consensus verification failed.");
            }
            _logger.LogInformation("Signature verification succeeded for {PluginId}", plugin.Id);

            // **Future Step 2: Store Package**
            // Here, we would upload the packageData to a secure blob storage (e.g., S3, Azure Blob Storage)
            // and get back a URL.
            var packageUrl = $"/cdn/plugins/{plugin.Id}/{plugin.Version}/package.tfplugin";
            _logger.LogInformation("Package storage placeholder for {PluginId}. URL: {PackageUrl}", plugin.Id, packageUrl);

            // **Step 3: Update Plugin Status**
            plugin.Status = PluginStatus.Approved;
            plugin.PackageUrl = packageUrl;
            plugin.LastUpdatedAt = DateTime.UtcNow;

            await _pluginRepository.UpdateAsync(plugin);

            _logger.LogInformation("Plugin {PluginId} v{Version} has been approved and published.", plugin.Id, plugin.Version);

            return (true, "Plugin published successfully.");
        }

    }
}
