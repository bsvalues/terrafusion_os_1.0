using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using TerraFusion.Data;

namespace TerraFusion.API.Services
{
    public interface IMarketplaceService
    {
        Task<PluginSubmissionResult> ProcessPluginSubmissionAsync(PluginSubmissionDto submissionDto);
        Task<List<TerraFusion.Core.DTOs.PluginRevenue>> GetPluginRevenueAsync(string countyId);
        Task<PluginInstallationResult> InstallPluginAsync(string pluginId, string countyId);
        Task<bool> UninstallPluginAsync(string pluginId, string countyId);
        Task<List<TerraFusion.Core.DTOs.PluginAnalytics>> GetPluginAnalyticsAsync(string countyId);
        Task<PluginSubmissionResult> PublishPluginAsync(PluginPublishDto publishDto);
    }

    public class MarketplaceService : IMarketplaceService
    {
        private readonly ILogger<MarketplaceService> _logger;
        private readonly IModuleService _moduleService;
        private readonly TerraFusion.Data.TerraFusionDbContext _context;

        public MarketplaceService(ILogger<MarketplaceService> logger, IModuleService moduleService, TerraFusion.Data.TerraFusionDbContext context)
        {
            _logger = logger;
            _moduleService = moduleService;
            _context = context;
        }

        public async Task<PluginSubmissionResult> ProcessPluginSubmissionAsync(PluginSubmissionDto submissionDto)
        {
            try
            {
                _logger.LogInformation("Processing plugin submission: {PluginName}", submissionDto.Name);

                var plugin = new PluginSubmission
                {
                    Name = submissionDto.Name,
                    Description = submissionDto.Description,
                    Version = submissionDto.Version,
                    Author = "Unknown", // PluginSubmissionDto doesn't have Author
                    Category = submissionDto.Category,
                    Price = 0.00m, // PluginSubmissionDto doesn't have Price
                    SubmittedAt = DateTime.UtcNow,
                    Status = PluginStatus.Pending
                };

                _context.PluginSubmissions.Add(plugin);
                await _context.SaveChangesAsync();

                return new PluginSubmissionResult
                {
                    Success = true,
                    Message = $"Plugin '{submissionDto.Name}' submitted successfully for review",
                    PluginId = plugin.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing plugin submission: {PluginName}", submissionDto.Name);
                return new PluginSubmissionResult
                {
                    Success = false,
                    Message = "Failed to process plugin submission"
                };
            }
        }

        public async Task<List<TerraFusion.Core.DTOs.PluginRevenue>> GetPluginRevenueAsync(string countyId)
        {
            try
            {
                var revenue = await _context.PluginRevenue
                    .Where(r => r.CountyId == countyId)
                    .Select(r => new TerraFusion.Core.DTOs.PluginRevenue
                    {
                        PluginId = r.PluginId,
                        PluginName = r.PluginId, // Will be populated from Plugin entity
                        Revenue = r.Revenue,
                        Installations = 1, // Will be calculated from installations
                        Growth = 15.5 // Will be calculated from historical data
                    })
                    .ToListAsync();

                return revenue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving plugin revenue for county: {CountyId}", countyId);
                return new List<TerraFusion.Core.DTOs.PluginRevenue>();
            }
        }

        public async Task<PluginInstallationResult> InstallPluginAsync(string pluginId, string countyId)
        {
            try
            {
                _logger.LogInformation("Installing plugin {PluginId} for county {CountyId}", pluginId, countyId);

                var installation = new PluginInstallation
                {
                    PluginId = pluginId,
                    CountyId = countyId,
                    InstalledAt = DateTime.UtcNow,
                    Status = PluginInstallationStatus.Active
                };

                _context.PluginInstallations.Add(installation);

                var revenue = new TerraFusion.Core.Entities.PluginRevenue
                {
                    PluginId = pluginId,
                    CountyId = countyId,
                    Revenue = GetPluginPrice(pluginId),
                    GeneratedAt = DateTime.UtcNow
                };

                _context.PluginRevenue.Add(revenue);
                await _context.SaveChangesAsync();

                return new PluginInstallationResult
                {
                    Success = true,
                    Message = $"Plugin {pluginId} installed successfully for county {countyId}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error installing plugin {PluginId} for county {CountyId}", pluginId, countyId);
                return new PluginInstallationResult
                {
                    Success = false,
                    Message = "Failed to install plugin"
                };
            }
        }

        public async Task<bool> UninstallPluginAsync(string pluginId, string countyId)
        {
            try
            {
                var installation = await _context.PluginInstallations
                    .FirstOrDefaultAsync(i => i.PluginId == pluginId && i.CountyId == countyId);

                if (installation != null)
                {
                    installation.Status = PluginInstallationStatus.Inactive;
                    installation.UninstalledAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uninstalling plugin {PluginId} for county {CountyId}", pluginId, countyId);
                return false;
            }
        }

        public async Task<List<TerraFusion.Core.DTOs.PluginAnalytics>> GetPluginAnalyticsAsync(string countyId)
        {
            try
            {
                var analytics = await _context.PluginAnalytics
                    .Where(a => a.CountyId == countyId)
                    .Select(a => new TerraFusion.Core.DTOs.PluginAnalytics
                    {
                        PluginId = a.PluginId,
                        CountyId = a.CountyId,
                        UsageCount = a.UsageCount,
                        RecordedAt = a.RecordedAt,
                        Metrics = a.Metrics
                    })
                    .ToListAsync();

                return analytics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving plugin analytics for county: {CountyId}", countyId);
                return new List<TerraFusion.Core.DTOs.PluginAnalytics>();
            }
        }

        private decimal GetPluginPrice(string pluginId)
        {
            return pluginId switch
            {
                "advanced-property-analytics" => 89.00m,
                "government-compliance-automation" => 38.00m,
                "legacy-system-integration" => 15.00m,
                _ => 50.00m
            };
        }

        public async Task<PluginSubmissionResult> PublishPluginAsync(PluginPublishDto publishDto)
        {
            try
            {
                _logger.LogInformation("Publishing plugin: {PluginId}", publishDto.PluginId);

                // For now, create a basic plugin submission
                // In a real implementation, you would validate the signature and package
                var plugin = new PluginSubmission
                {
                    Name = $"Plugin_{publishDto.PluginId}",
                    Description = "Plugin published via API",
                    Version = publishDto.Version,
                    Author = "Unknown",
                    Category = "Government",
                    Price = 0.00m,
                    SubmittedAt = DateTime.UtcNow,
                    Status = PluginStatus.Approved
                };

                _context.PluginSubmissions.Add(plugin);
                await _context.SaveChangesAsync();

                return new PluginSubmissionResult
                {
                    Success = true,
                    Message = $"Plugin published successfully",
                    PluginId = plugin.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing plugin: {PluginId}", publishDto.PluginId);
                return new PluginSubmissionResult
                {
                    Success = false,
                    Message = "Failed to publish plugin"
                };
            }
        }
    }

    public class PluginInstallationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
