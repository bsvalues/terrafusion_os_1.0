// TerraFusionGPT Suite: GPT Configuration Service Implementation
// Elite Government OS Engineering - AI Platform

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Data;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TaskAsync = System.Threading.Tasks.Task;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Service for managing GPT configurations with government compliance
    /// </summary>
    public class GPTConfigurationService : IGPTConfigurationService
    {
        private readonly AIDbContext _context;
        private readonly ILogger<GPTConfigurationService> _logger;

        public GPTConfigurationService(
            AIDbContext context,
            ILogger<GPTConfigurationService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async System.Threading.Tasks.Task<GPTConfiguration> CreateGPTAsync(GPTConfiguration config)
        {
            try
            {
                _logger.LogInformation("Creating new GPT: {Name} by user {UserId}",
                    config.Name, config.CreatedByUserId);

                // Validate configuration
                var (isValid, errors) = await ValidateGPTConfigAsync(config);
                if (!isValid)
                {
                    var errorMessage = string.Join(", ", errors);
                    _logger.LogError("GPT validation failed: {Errors}", errorMessage);
                    throw new InvalidOperationException($"GPT configuration is invalid: {errorMessage}");
                }

                // Check for duplicate name
                var existing = await _context.GPTConfigurations
                    .FirstOrDefaultAsync(g => g.Name == config.Name && g.Status != "Deleted");

                if (existing != null)
                {
                    throw new InvalidOperationException($"GPT with name '{config.Name}' already exists");
                }

                // Set timestamps
                config.CreatedAt = DateTime.UtcNow;
                config.UpdatedAt = DateTime.UtcNow;
                config.Status = "Active";

                _context.GPTConfigurations.Add(config);
                await _context.SaveChangesAsync();

                _logger.LogInformation("GPT created successfully: {Name} (ID: {Id})",
                    config.Name, config.Id);

                return config;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating GPT: {Name}", config.Name);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<GPTConfiguration> UpdateGPTAsync(int id, GPTConfiguration config)
        {
            try
            {
                _logger.LogInformation("Updating GPT ID: {Id}", id);

                var existing = await _context.GPTConfigurations.FindAsync(id);
                if (existing == null)
                {
                    throw new InvalidOperationException($"GPT with ID {id} not found");
                }

                // Validate updated configuration
                var (isValid, errors) = await ValidateGPTConfigAsync(config);
                if (!isValid)
                {
                    var errorMessage = string.Join(", ", errors);
                    throw new InvalidOperationException($"GPT configuration is invalid: {errorMessage}");
                }

                // Update properties
                existing.DisplayName = config.DisplayName;
                existing.Description = config.Description;
                existing.IconUrl = config.IconUrl;
                existing.Category = config.Category;
                existing.ModelProvider = config.ModelProvider;
                existing.ModelName = config.ModelName;
                existing.SystemPrompt = config.SystemPrompt;
                existing.Temperature = config.Temperature;
                existing.MaxTokens = config.MaxTokens;
                existing.TopP = config.TopP;
                existing.FrequencyPenalty = config.FrequencyPenalty;
                existing.PresencePenalty = config.PresencePenalty;
                existing.EnableRAG = config.EnableRAG;
                existing.RAGDatasetId = config.RAGDatasetId;
                existing.RAGTopK = config.RAGTopK;
                existing.RAGScoreThreshold = config.RAGScoreThreshold;
                existing.EnableFunctions = config.EnableFunctions;
                existing.FunctionsJson = config.FunctionsJson;
                existing.RequiredRole = config.RequiredRole;
                existing.AllowedCounties = config.AllowedCounties;
                existing.IsPublic = config.IsPublic;
                existing.IsFeatured = config.IsFeatured;
                existing.Price = config.Price;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = config.UpdatedBy;

                await _context.SaveChangesAsync();

                _logger.LogInformation("GPT updated successfully: {Name} (ID: {Id})",
                    existing.Name, id);

                return existing;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating GPT ID: {Id}", id);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<bool> DeleteGPTAsync(int id)
        {
            try
            {
                _logger.LogInformation("Deleting GPT ID: {Id}", id);

                var gpt = await _context.GPTConfigurations.FindAsync(id);
                if (gpt == null)
                {
                    return false;
                }

                // Soft delete - archive instead of removing
                gpt.Status = "Archived";
                gpt.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("GPT archived successfully: {Name} (ID: {Id})",
                    gpt.Name, id);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting GPT ID: {Id}", id);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<GPTConfiguration?> GetGPTByIdAsync(int id)
        {
            return await _context.GPTConfigurations
                .FirstOrDefaultAsync(g => g.Id == id && g.Status != "Deleted");
        }

        public async System.Threading.Tasks.Task<GPTConfiguration?> GetGPTByNameAsync(string name)
        {
            return await _context.GPTConfigurations
                .FirstOrDefaultAsync(g => g.Name == name && g.Status != "Deleted");
        }

        public async System.Threading.Tasks.Task<List<GPTConfiguration>> GetAvailableGPTsAsync(
            string userId, int countyId, string role)
        {
            try
            {
                var query = _context.GPTConfigurations
                    .Where(g => g.Status == "Active");

                // Include system GPTs
                query = query.Where(g =>
                    g.IsSystemGPT ||
                    g.IsPublic ||
                    g.CreatedByUserId == userId ||
                    g.CountyId == countyId);

                // Filter by role if required
                query = query.Where(g =>
                    g.RequiredRole == null ||
                    g.RequiredRole == role);

                var gpts = await query
                    .OrderByDescending(g => g.IsFeatured)
                    .ThenByDescending(g => g.InstallCount)
                    .ToListAsync();

                return gpts;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available GPTs for user {UserId}", userId);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<List<GPTConfiguration>> GetSystemGPTsAsync()
        {
            return await _context.GPTConfigurations
                .Where(g => g.IsSystemGPT && g.Status == "Active")
                .OrderBy(g => g.Category)
                .ThenBy(g => g.DisplayName)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<List<GPTConfiguration>> GetGPTsByCategoryAsync(
            string category, int? countyId = null)
        {
            var query = _context.GPTConfigurations
                .Where(g => g.Category == category && g.Status == "Active");

            if (countyId.HasValue)
            {
                query = query.Where(g =>
                    g.IsSystemGPT ||
                    g.IsPublic ||
                    g.CountyId == countyId.Value);
            }

            return await query
                .OrderByDescending(g => g.AverageRating)
                .ThenByDescending(g => g.InstallCount)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<List<GPTConfiguration>> SearchGPTsAsync(
            string query, int? countyId = null)
        {
            var searchQuery = _context.GPTConfigurations
                .Where(g => g.Status == "Active" &&
                    (g.DisplayName.Contains(query) ||
                     g.Description!.Contains(query) ||
                     g.Category!.Contains(query)));

            if (countyId.HasValue)
            {
                searchQuery = searchQuery.Where(g =>
                    g.IsSystemGPT ||
                    g.IsPublic ||
                    g.CountyId == countyId.Value);
            }

            return await searchQuery
                .OrderByDescending(g => g.InstallCount)
                .Take(50)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<List<GPTConfiguration>> GetPopularGPTsAsync(int count = 10)
        {
            return await _context.GPTConfigurations
                .Where(g => g.Status == "Active")
                .OrderByDescending(g => g.InstallCount)
                .Take(count)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<List<GPTConfiguration>> GetTopRatedGPTsAsync(int count = 10)
        {
            return await _context.GPTConfigurations
                .Where(g => g.Status == "Active" && g.AverageRating.HasValue)
                .OrderByDescending(g => g.AverageRating)
                .ThenByDescending(g => g.RatingCount)
                .Take(count)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<List<GPTConfiguration>> GetFeaturedGPTsAsync()
        {
            return await _context.GPTConfigurations
                .Where(g => g.IsFeatured && g.Status == "Active")
                .OrderByDescending(g => g.InstallCount)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task IncrementInstallCountAsync(int gptId)
        {
            var gpt = await _context.GPTConfigurations.FindAsync(gptId);
            if (gpt != null)
            {
                gpt.InstallCount++;
                gpt.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async System.Threading.Tasks.Task UpdateRatingAsync(int gptId, decimal rating, int ratingCount)
        {
            var gpt = await _context.GPTConfigurations.FindAsync(gptId);
            if (gpt != null)
            {
                gpt.AverageRating = rating;
                gpt.RatingCount = ratingCount;
                gpt.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async System.Threading.Tasks.Task IncrementUsageStatsAsync(
            int gptId, int messages, long tokens, decimal cost)
        {
            var gpt = await _context.GPTConfigurations.FindAsync(gptId);
            if (gpt != null)
            {
                gpt.TotalMessages += messages;
                gpt.TotalTokensUsed += tokens;
                gpt.TotalCost += cost;
                gpt.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async System.Threading.Tasks.Task<(bool IsValid, List<string> Errors)> ValidateGPTConfigAsync(
            GPTConfiguration config)
        {
            var errors = new List<string>();

            // Validate required fields
            if (string.IsNullOrWhiteSpace(config.Name))
                errors.Add("Name is required");

            if (string.IsNullOrWhiteSpace(config.DisplayName))
                errors.Add("Display name is required");

            if (string.IsNullOrWhiteSpace(config.ModelProvider))
                errors.Add("Model provider is required");

            if (string.IsNullOrWhiteSpace(config.ModelName))
                errors.Add("Model name is required");

            if (string.IsNullOrWhiteSpace(config.SystemPrompt))
                errors.Add("System prompt is required");

            // Validate model provider
            var validProviders = new[] { "OpenAI", "Anthropic", "Azure", "Local" };
            if (!validProviders.Contains(config.ModelProvider))
                errors.Add($"Invalid model provider. Must be one of: {string.Join(", ", validProviders)}");

            // Validate temperature
            if (config.Temperature < 0 || config.Temperature > 2)
                errors.Add("Temperature must be between 0 and 2");

            // Validate max tokens
            if (config.MaxTokens < 100 || config.MaxTokens > 128000)
                errors.Add("Max tokens must be between 100 and 128,000");

            // Validate RAG configuration
            if (config.EnableRAG && !config.RAGDatasetId.HasValue)
                errors.Add("RAG dataset ID is required when RAG is enabled");

            // Validate RAG score threshold
            if (config.RAGScoreThreshold < 0 || config.RAGScoreThreshold > 1)
                errors.Add("RAG score threshold must be between 0 and 1");

            // Validate county context for non-system GPTs
            if (!config.IsSystemGPT && !config.CountyId.HasValue)
                errors.Add("County ID is required for non-system GPTs");

            await System.Threading.Tasks.Task.CompletedTask; // For async consistency

            return (errors.Count == 0, errors);
        }
    }
}
