// TerraFusionGPT Suite: GPT Configuration Seeder
// Elite Government OS Engineering - Automated GPT Deployment

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TaskAsync = System.Threading.Tasks.Task;

namespace TerraFusion.AI.Seeds
{
    /// <summary>
    /// Seeds pre-built government GPT configurations into the database
    /// </summary>
    public class GPTConfigurationSeeder
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<GPTConfigurationSeeder> _logger;
        private readonly string _configBasePath;
        private readonly string _promptBasePath;
        private readonly string _functionBasePath;

        public GPTConfigurationSeeder(
            TerraFusionDbContext context,
            ILogger<GPTConfigurationSeeder> logger)
        {
            _context = context;
            _logger = logger;

            // Base paths for configuration files
            var projectRoot = Path.Combine(AppContext.BaseDirectory, "../../../");
            _configBasePath = Path.Combine(projectRoot, "Configs/GPTs");
            _promptBasePath = Path.Combine(projectRoot, "Prompts");
            _functionBasePath = Path.Combine(projectRoot, "Functions");
        }

        /// <summary>
        /// Seed all pre-built GPT configurations
        /// </summary>
        public async System.Threading.Tasks.Task SeedAllGPTsAsync()
        {
            _logger.LogInformation("Starting GPT configuration seeding...");

            try
            {
                // Get all JSON config files
                var configFiles = GetAllConfigFiles();
                _logger.LogInformation($"Found {configFiles.Count} GPT configuration files");

                int created = 0;
                int updated = 0;
                int skipped = 0;

                foreach (var configFile in configFiles)
                {
                    try
                    {
                        var result = await SeedGPTFromFileAsync(configFile);

                        switch (result)
                        {
                            case SeedResult.Created:
                                created++;
                                break;
                            case SeedResult.Updated:
                                updated++;
                                break;
                            case SeedResult.Skipped:
                                skipped++;
                                break;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to seed GPT from {configFile}");
                    }
                }

                _logger.LogInformation(
                    $"GPT seeding complete: {created} created, {updated} updated, {skipped} skipped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error during GPT seeding");
                throw;
            }
        }

        /// <summary>
        /// Seed a single GPT from configuration file
        /// </summary>
        private async System.Threading.Tasks.Task<SeedResult> SeedGPTFromFileAsync(string configFilePath)
        {
            // Read and parse config file
            var jsonContent = await File.ReadAllTextAsync(configFilePath);
            var config = JsonSerializer.Deserialize<GPTConfigFile>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (config == null)
            {
                _logger.LogWarning($"Failed to parse config file: {configFilePath}");
                return SeedResult.Skipped;
            }

            _logger.LogInformation($"Processing GPT: {config.Name}");

            // Check if GPT already exists
            var existing = await _context.Set<GPTConfiguration>()
                .FirstOrDefaultAsync(g => g.Name == config.Name);

            // Load system prompt
            var systemPrompt = await LoadSystemPromptAsync(config.SystemPromptFile);
            if (string.IsNullOrEmpty(systemPrompt))
            {
                _logger.LogWarning($"System prompt not found for {config.Name}");
                systemPrompt = "You are a helpful assistant.";
            }

            // Load function definitions if enabled
            string? functionsJson = null;
            if (config.EnableFunctions && !string.IsNullOrEmpty(config.FunctionsJsonFile))
            {
                functionsJson = await LoadFunctionsJsonAsync(config.FunctionsJsonFile);
            }

            // Create or update GPT configuration
            if (existing == null)
            {
                // Create new
                var gpt = new GPTConfiguration
                {
                    Name = config.Name,
                    DisplayName = config.DisplayName,
                    Description = config.Description,
                    IconUrl = config.IconUrl,
                    Category = config.Category,
                    IsSystemGPT = config.IsSystemGPT,
                    IsPublic = config.IsPublic,
                    ModelProvider = config.ModelProvider,
                    ModelName = config.ModelName,
                    SystemPrompt = systemPrompt,
                    Temperature = config.Temperature,
                    MaxTokens = config.MaxTokens,
                    TopP = config.TopP,
                    FrequencyPenalty = config.FrequencyPenalty,
                    PresencePenalty = config.PresencePenalty,
                    EnableRAG = config.EnableRAG,
                    RAGDatasetId = config.RagDatasetId,
                    RAGTopK = config.RagTopK,
                    RAGScoreThreshold = config.RagScoreThreshold,
                    EnableFunctions = config.EnableFunctions,
                    FunctionsJson = functionsJson,
                    RequiredRole = config.RequiredRole,
                    AllowedCounties = config.AllowedCounties,
                    Price = config.Price,
                    IsFeatured = config.IsFeatured,
                    Status = config.Status,
                    Version = config.Version,
                    TotalConversations = 0,
                    TotalMessages = 0,
                    TotalTokensUsed = 0,
                    TotalCost = 0,
                    RatingCount = 0,
                    InstallCount = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedBy = "System"
                };

                _context.Set<GPTConfiguration>().Add(gpt);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created GPT: {config.Name} (ID: {gpt.Id})");
                return SeedResult.Created;
            }
            else
            {
                // Update existing (only if version is newer)
                if (IsNewerVersion(config.Version, existing.Version))
                {
                    existing.DisplayName = config.DisplayName;
                    existing.Description = config.Description;
                    existing.IconUrl = config.IconUrl;
                    existing.Category = config.Category;
                    existing.ModelProvider = config.ModelProvider;
                    existing.ModelName = config.ModelName;
                    existing.SystemPrompt = systemPrompt;
                    existing.Temperature = config.Temperature;
                    existing.MaxTokens = config.MaxTokens;
                    existing.TopP = config.TopP;
                    existing.FrequencyPenalty = config.FrequencyPenalty;
                    existing.PresencePenalty = config.PresencePenalty;
                    existing.EnableRAG = config.EnableRAG;
                    existing.RAGDatasetId = config.RagDatasetId;
                    existing.RAGTopK = config.RagTopK;
                    existing.RAGScoreThreshold = config.RagScoreThreshold;
                    existing.EnableFunctions = config.EnableFunctions;
                    existing.FunctionsJson = functionsJson;
                    existing.RequiredRole = config.RequiredRole;
                    existing.AllowedCounties = config.AllowedCounties;
                    existing.Price = config.Price;
                    existing.IsFeatured = config.IsFeatured;
                    existing.Status = config.Status;
                    existing.Version = config.Version;
                    existing.UpdatedAt = DateTime.UtcNow;
                    existing.UpdatedBy = "System";

                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Updated GPT: {config.Name} (version {existing.Version} -> {config.Version})");
                    return SeedResult.Updated;
                }
                else
                {
                    _logger.LogInformation($"Skipped GPT: {config.Name} (current version {existing.Version} >= {config.Version})");
                    return SeedResult.Skipped;
                }
            }
        }

        /// <summary>
        /// Get all GPT configuration files
        /// </summary>
        private List<string> GetAllConfigFiles()
        {
            var configFiles = new List<string>();

            if (!Directory.Exists(_configBasePath))
            {
                _logger.LogWarning($"Config base path does not exist: {_configBasePath}");
                return configFiles;
            }

            // Recursively find all .json files
            configFiles.AddRange(Directory.GetFiles(_configBasePath, "*.json", SearchOption.AllDirectories));

            return configFiles;
        }

        /// <summary>
        /// Load system prompt from file
        /// </summary>
        private async System.Threading.Tasks.Task<string> LoadSystemPromptAsync(string? promptFile)
        {
            if (string.IsNullOrEmpty(promptFile))
            {
                return string.Empty;
            }

            var promptPath = Path.Combine(_promptBasePath, promptFile);

            if (!File.Exists(promptPath))
            {
                _logger.LogWarning($"System prompt file not found: {promptPath}");
                return string.Empty;
            }

            return await File.ReadAllTextAsync(promptPath);
        }

        /// <summary>
        /// Load functions JSON from file
        /// </summary>
        private async System.Threading.Tasks.Task<string?> LoadFunctionsJsonAsync(string? functionsFile)
        {
            if (string.IsNullOrEmpty(functionsFile))
            {
                return null;
            }

            var functionsPath = Path.Combine(_functionBasePath, functionsFile);

            if (!File.Exists(functionsPath))
            {
                _logger.LogWarning($"Functions file not found: {functionsPath}");
                return null;
            }

            return await File.ReadAllTextAsync(functionsPath);
        }

        /// <summary>
        /// Compare version strings (semantic versioning)
        /// </summary>
        private bool IsNewerVersion(string? newVersion, string? currentVersion)
        {
            if (string.IsNullOrEmpty(newVersion)) return false;
            if (string.IsNullOrEmpty(currentVersion)) return true;

            try
            {
                var newParts = newVersion.Split('.').Select(int.Parse).ToArray();
                var currentParts = currentVersion.Split('.').Select(int.Parse).ToArray();

                // Compare major version
                if (newParts[0] > currentParts[0]) return true;
                if (newParts[0] < currentParts[0]) return false;

                // Compare minor version
                if (newParts.Length > 1 && currentParts.Length > 1)
                {
                    if (newParts[1] > currentParts[1]) return true;
                    if (newParts[1] < currentParts[1]) return false;
                }

                // Compare patch version
                if (newParts.Length > 2 && currentParts.Length > 2)
                {
                    if (newParts[2] > currentParts[2]) return true;
                }

                return false;
            }
            catch
            {
                // If version parsing fails, consider it newer to trigger update
                return true;
            }
        }

        /// <summary>
        /// Seed result enum
        /// </summary>
        private enum SeedResult
        {
            Created,
            Updated,
            Skipped
        }

        /// <summary>
        /// GPT configuration file model
        /// </summary>
        private class GPTConfigFile
        {
            public string Name { get; set; } = string.Empty;
            public string DisplayName { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string? IconUrl { get; set; }
            public string? Category { get; set; }
            public bool IsSystemGPT { get; set; }
            public bool IsPublic { get; set; }
            public string ModelProvider { get; set; } = string.Empty;
            public string ModelName { get; set; } = string.Empty;
            public string? SystemPromptFile { get; set; }
            public decimal Temperature { get; set; }
            public int MaxTokens { get; set; }
            public decimal TopP { get; set; }
            public decimal FrequencyPenalty { get; set; }
            public decimal PresencePenalty { get; set; }
            public bool EnableRAG { get; set; }
            public int? RagDatasetId { get; set; }
            public int RagTopK { get; set; }
            public decimal RagScoreThreshold { get; set; }
            public bool EnableFunctions { get; set; }
            public string? FunctionsJsonFile { get; set; }
            public string? RequiredRole { get; set; }
            public string? AllowedCounties { get; set; }
            public decimal Price { get; set; }
            public bool IsFeatured { get; set; }
            public string Status { get; set; } = "Active";
            public string Version { get; set; } = "1.0.0";
        }
    }

    /// <summary>
    /// Extension methods for seeding
    /// </summary>
    public static class GPTSeederExtensions
    {
        /// <summary>
        /// Add GPT configuration seeding to startup
        /// </summary>
        public static async System.Threading.Tasks.Task SeedGPTConfigurationsAsync(this IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<GPTConfigurationSeeder>>();

            var seeder = new GPTConfigurationSeeder(context, logger);
            await seeder.SeedAllGPTsAsync();
        }
    }
}
