using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using TerraFusion.Data;

namespace TerraFusion.API.Services
{
    public interface ICountyDeploymentService
    {
        Task<CountyDeploymentResult> DeployCountyAsync(CountyDeploymentRequest request);
        Task<List<CountyDeployment>> GetCountyDeploymentsAsync();
        Task<CountyDeployment?> GetCountyDeploymentAsync(string countyId);
        Task<bool> UpdateCountyConfigurationAsync(string countyId, CountyConfiguration config);
        Task<CountyHealthReport> GetCountyHealthAsync(string countyId);
        Task<bool> ValidateCountyDataAsync(string countyId);
    }

    public class CountyDeploymentService : ICountyDeploymentService
    {
        private readonly ILogger<CountyDeploymentService> _logger;
        private readonly TerraFusion.Data.TerraFusionDbContext _context;
        private readonly IModuleService _moduleService;

        public CountyDeploymentService(ILogger<CountyDeploymentService> logger, TerraFusion.Data.TerraFusionDbContext context, IModuleService moduleService)
        {
            _logger = logger;
            _context = context;
            _moduleService = moduleService;
        }

        public async Task<CountyDeploymentResult> DeployCountyAsync(CountyDeploymentRequest request)
        {
            try
            {
                _logger.LogInformation("Starting deployment for county: {CountyName}", request.CountyName);

                var deployment = new CountyDeployment
                {
                    CountyId = request.CountyId,
                    CountyName = request.CountyName,
                    State = request.State,
                    Population = request.Population,
                    DeploymentType = request.DeploymentType,
                    RequestedModules = request.RequestedModules,
                    DeployedAt = DateTime.UtcNow,
                    Status = CountyDeploymentStatus.InProgress
                };

                _context.CountyDeployments.Add(deployment);

                var county = new County
                {
                    Id = Guid.Parse(request.CountyId),
                    Name = request.CountyName,
                    State = request.State,
                    Population = request.Population,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Counties.Add(county);

                await _context.SaveChangesAsync();

                var result = await DeployCountyModulesAsync(request.CountyId, request.RequestedModules);

                if (result.Success)
                {
                    deployment.Status = CountyDeploymentStatus.Completed;
                    deployment.CompletedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return new CountyDeploymentResult
                    {
                        Success = true,
                        Message = $"County {request.CountyName} deployed successfully",
                        CountyId = request.CountyId,
                        DeployedModules = result.DeployedModules
                    };
                }
                else
                {
                    deployment.Status = CountyDeploymentStatus.Failed;
                    deployment.ErrorMessage = result.ErrorMessage;
                    await _context.SaveChangesAsync();

                    return new CountyDeploymentResult
                    {
                        Success = false,
                        Message = $"Failed to deploy county {request.CountyName}: {result.ErrorMessage}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deploying county: {CountyName}", request.CountyName);
                return new CountyDeploymentResult
                {
                    Success = false,
                    Message = "Internal server error during county deployment"
                };
            }
        }

        public async Task<List<CountyDeployment>> GetCountyDeploymentsAsync()
        {
            try
            {
                return await _context.CountyDeployments
                    .OrderByDescending(d => d.DeployedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving county deployments");
                return new List<CountyDeployment>();
            }
        }

        public async Task<CountyDeployment?> GetCountyDeploymentAsync(string countyId)
        {
            try
            {
                return await _context.CountyDeployments
                    .FirstOrDefaultAsync(d => d.CountyId == countyId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving county deployment: {CountyId}", countyId);
                return null;
            }
        }

        public async Task<bool> UpdateCountyConfigurationAsync(string countyId, CountyConfiguration config)
        {
            try
            {
                var county = await _context.Counties.FindAsync(Guid.Parse(countyId));
                if (county == null) return false;

                county.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating county configuration: {CountyId}", countyId);
                return false;
            }
        }

        public async Task<CountyHealthReport> GetCountyHealthAsync(string countyId)
        {
            try
            {
                var county = await _context.Counties.FindAsync(Guid.Parse(countyId));
                if (county == null)
                {
                    return new CountyHealthReport
                    {
                        CountyId = countyId,
                        Status = "Not Found",
                        LastChecked = DateTime.UtcNow
                    };
                }

                var activeModules = await _context.Modules
                    .Where(m => m.Status == TerraFusion.Core.Enums.ModuleStatus.Active)
                    .CountAsync();

                return new CountyHealthReport
                {
                    CountyId = countyId,
                    Status = "Active",
                    ActiveModules = activeModules,
                    LastChecked = DateTime.UtcNow,
                    Uptime = DateTime.UtcNow - county.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving county health: {CountyId}", countyId);
                return new CountyHealthReport
                {
                    CountyId = countyId,
                    Status = "Error",
                    LastChecked = DateTime.UtcNow
                };
            }
        }

        public async Task<bool> ValidateCountyDataAsync(string countyId)
        {
            try
            {
                var county = await _context.Counties.FindAsync(Guid.Parse(countyId));
                if (county == null) return false;

                var properties = await _context.Properties
                    .Where(p => p.CountyId == Guid.Parse(countyId))
                    .CountAsync();

                var assessments = await _context.PropertyAssessments
                    .Where(a => a.PropertyId == Guid.Parse(countyId))
                    .CountAsync();

                return properties > 0 && assessments > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving county health: {CountyId}", countyId);
                return false;
            }
        }

        private async Task<ModuleDeploymentResult> DeployCountyModulesAsync(string countyId, List<string> moduleNames)
        {
            try
            {
                var deployedModules = new List<string>();

                foreach (var moduleName in moduleNames)
                {
                    var module = await _moduleService.GetModuleByNameAsync(moduleName);
                    if (module != null)
                    {
                        var result = await _moduleService.LaunchModuleAsync(module.Id);
                        if (result)
                        {
                            deployedModules.Add(moduleName);
                        }
                    }
                }

                return new ModuleDeploymentResult
                {
                    Success = deployedModules.Count > 0,
                    DeployedModules = deployedModules,
                    ErrorMessage = deployedModules.Count == 0 ? "No modules were successfully deployed" : null
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deploying modules for county: {CountyId}", countyId);
                return new ModuleDeploymentResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }
    }

    public class CountyDeploymentRequest
    {
        public string CountyId { get; set; } = string.Empty;
        public string CountyName { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public int Population { get; set; }
        public CountyDeploymentType DeploymentType { get; set; }
        public List<string> RequestedModules { get; set; } = new();
    }

    public class CountyDeploymentResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? CountyId { get; set; }
        public List<string>? DeployedModules { get; set; }
    }

    public class CountyHealthReport
    {
        public string CountyId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ActiveModules { get; set; }
        public DateTime LastChecked { get; set; }
        public TimeSpan Uptime { get; set; }
    }

    public class CountyConfiguration
    {
        public string DatabaseConnection { get; set; } = string.Empty;
        public string ApiEndpoint { get; set; } = string.Empty;
        public List<string> EnabledFeatures { get; set; } = new();
        public Dictionary<string, string> CustomSettings { get; set; } = new();
    }

    public class ModuleDeploymentResult
    {
        public bool Success { get; set; }
        public List<string> DeployedModules { get; set; } = new();
        public string? ErrorMessage { get; set; }
    }
}
