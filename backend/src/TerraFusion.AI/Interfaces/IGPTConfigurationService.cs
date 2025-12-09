// TerraFusionGPT Suite: GPT Configuration Service Interface
// Elite Government OS Engineering - AI Platform

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.AI.Entities;
using TerraFusion.Core.Entities;
using TaskAsync = System.Threading.Tasks.Task;

namespace TerraFusion.AI.Interfaces
{
    /// <summary>
    /// Service interface for managing GPT configurations
    /// </summary>
    public interface IGPTConfigurationService
    {
        /// <summary>
        /// Create a new GPT configuration
        /// </summary>
        System.Threading.Tasks.Task<GPTConfiguration> CreateGPTAsync(GPTConfiguration config);

        /// <summary>
        /// Update an existing GPT configuration
        /// </summary>
        System.Threading.Tasks.Task<GPTConfiguration> UpdateGPTAsync(int id, GPTConfiguration config);

        /// <summary>
        /// Delete a GPT configuration (soft delete - archive)
        /// </summary>
        System.Threading.Tasks.Task<bool> DeleteGPTAsync(int id);

        /// <summary>
        /// Get a specific GPT by ID
        /// </summary>
        System.Threading.Tasks.Task<GPTConfiguration?> GetGPTByIdAsync(int id);

        /// <summary>
        /// Get a specific GPT by name
        /// </summary>
        System.Threading.Tasks.Task<GPTConfiguration?> GetGPTByNameAsync(string name);

        /// <summary>
        /// Get all available GPTs for a user (based on county and role)
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> GetAvailableGPTsAsync(string userId, int countyId, string role);

        /// <summary>
        /// Get all system-provided GPTs
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> GetSystemGPTsAsync();

        /// <summary>
        /// Get GPTs by category
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> GetGPTsByCategoryAsync(string category, int? countyId = null);

        /// <summary>
        /// Search GPTs by name or description
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> SearchGPTsAsync(string query, int? countyId = null);

        /// <summary>
        /// Get most popular GPTs (by install count)
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> GetPopularGPTsAsync(int count = 10);

        /// <summary>
        /// Get highest rated GPTs
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> GetTopRatedGPTsAsync(int count = 10);

        /// <summary>
        /// Get featured GPTs
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> GetFeaturedGPTsAsync();

        /// <summary>
        /// Increment install count for a GPT
        /// </summary>
        System.Threading.Tasks.Task IncrementInstallCountAsync(int gptId);

        /// <summary>
        /// Update GPT rating
        /// </summary>
        System.Threading.Tasks.Task UpdateRatingAsync(int gptId, decimal rating, int ratingCount);

        /// <summary>
        /// Increment usage stats (conversations, messages, tokens, cost)
        /// </summary>
        System.Threading.Tasks.Task IncrementUsageStatsAsync(int gptId, int messages, long tokens, decimal cost);

        /// <summary>
        /// Validate GPT configuration before saving
        /// </summary>
        System.Threading.Tasks.Task<(bool IsValid, List<string> Errors)> ValidateGPTConfigAsync(GPTConfiguration config);

        /// <summary>
        /// Phase 15: Get all GPT configurations for diagnostics (no filters)
        /// </summary>
        System.Threading.Tasks.Task<List<GPTConfiguration>> GetAllConfigurationsAsync();
    }
}
